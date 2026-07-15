const axios = require('axios');

// API 1: Lấy giá hiện tại từ Cafef (siêu ổn định)
async function getCafefPrice(symbol) {
    try {
        const response = await axios.get(`https://e.cafef.vn/info.ashx?ticket=${symbol.toUpperCase()}`, { timeout: 5000 });
        if (response.data && response.data.Symbol) {
            return {
                price: response.data.Price,
                change: response.data.Change || 0,
                percent: response.data.PercentChange || 0,
                name: response.data.Name || "Cổ phiếu"
            };
        }
        return null;
    } catch (err) {
        console.error(`[Cafef] Lỗi lấy giá mã ${symbol}:`, err.message);
        return null;
    }
}

// API 2: Lấy dữ liệu khối ngoại từ VNDirect
async function getVNDirectForeign(symbol) {
    try {
        const response = await axios.get(`https://api-finfo.vndirect.com.vn/v4/foreigns/latest?order=tradingDate&filter=code:${symbol.toUpperCase()}`, { timeout: 5000 });
        if (response.data && response.data.data && response.data.data.length > 0) {
            const fData = response.data.data[0];
            // Đổi giá trị ròng từ Đồng sang Tỷ Đồng cho dễ nhìn
            const netValBillion = fData.netVal ? (fData.netVal / 1000000000).toFixed(2) : 0;
            return {
                netVal: parseFloat(netValBillion),
                buyVol: fData.buyVol || 0,
                sellVol: fData.sellVol || 0
            };
        }
        return null;
    } catch (err) {
        console.error(`[VND] Lỗi lấy khối ngoại mã ${symbol}:`, err.message);
        return null;
    }
}

// Handler cho lệnh check tay trực tiếp: /stock <mã>
exports.checkStockCommand = async (ctx) => {
    try {
        const text = ctx.message.text.trim();
        const args = text.split(/\s+/).slice(1);
        const symbol = args[0] || 'TCB';

        await ctx.reply(`🔍 Đang quét dữ liệu mã ${symbol.toUpperCase()}...`);
        
        const [priceData, foreignData] = await Promise.all([
            getCafefPrice(symbol),
            getVNDirectForeign(symbol)
        ]);

        if (!priceData) {
            return await ctx.reply('❌ Không lấy được thông tin giá cổ phiếu lúc này.');
        }

        const statusEmoji = priceData.change > 0 ? '🟢' : (priceData.change < 0 ? '🔴' : '🟡');
        let foreignText = "⚠️ Chưa có dữ liệu khối ngoại hôm nay.";
        
        if (foreignData) {
            const foreignEmoji = foreignData.netVal > 0 ? '🔵 (Khối ngoại MUA RÒNG)' : (foreignData.netVal < 0 ? '🟠 (Khối ngoại BÁN RÒNG)' : '⚪ (Cân bằng)');
            foreignText = `${foreignEmoji}: \`${foreignData.netVal > 0 ? '+' : ''}${foreignData.netVal}\` tỷ VNĐ`;
        }

        await ctx.reply(
            `📊 *CẬP NHẬT CỔ PHIẾU: ${symbol.toUpperCase()}*\n` +
            `🏢 _${priceData.name}_\n\n` +
            `💰 *Giá hiện tại:* \`${priceData.price}\`\n` +
            `${statusEmoji} *Biến động:* \`${priceData.change > 0 ? '+' : ''}${priceData.change}\` (${priceData.percent}%)\n` +
            `🌐 *Giao dịch khối ngoại:* \n ${foreignText}\n\n` +
            `_Cập nhật tự động từ hệ thống_`,
            { parse_mode: 'Markdown' }
        );
    } catch (err) {
        console.error('Lỗi lệnh stock:', err.message);
    }
};

// Hàm tự động gửi báo cáo định kỳ mỗi 5 phút
exports.sendAutomaticStockAlert = async (symbol, chatId) => {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('Lỗi: Chưa cấu hình TELEGRAM_BOT_TOKEN trong file .env');
        return;
    }

    try {
        const [priceData, foreignData] = await Promise.all([
            getCafefPrice(symbol),
            getVNDirectForeign(symbol)
        ]);

        if (priceData) {
            const statusEmoji = priceData.change > 0 ? '🟢' : (priceData.change < 0 ? '🔴' : '🟡');
            let foreignText = "⚠️ Chưa có dữ liệu khối ngoại.";
            
            if (foreignData) {
                const foreignEmoji = foreignData.netVal > 0 ? '🔵 Mua ròng' : (foreignData.netVal < 0 ? '🟠 Bán ròng' : '⚪ Cân bằng');
                foreignText = `${foreignEmoji}: \`${foreignData.netVal > 0 ? '+' : ''}${foreignData.netVal}\` tỷ`;
            }

            const message = `🔔 *CẬP NHẬT BIẾN ĐỘNG 5 PHÚT: ${symbol.toUpperCase()}*\n\n` +
                            `💵 *Giá khớp:* \`${priceData.price}\` (${priceData.change > 0 ? '+' : ''}${priceData.change} | ${priceData.percent}%)\n` +
                            `🌐 *Khối ngoại:* ${foreignText}`;

            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            });
            console.log(`Đã gửi cập nhật 5 phút mã ${symbol} thành công!`);
        }
    } catch (error) {
        console.error('Lỗi gửi báo cáo tự động:', error.message);
    }
};