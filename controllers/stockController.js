const axios = require('axios');

// Hàm lấy dữ liệu cổ phiếu từ API mới của Cafef
async function getCafefNewPrice(symbol) {
    try {
        const response = await axios.get(`https://msh-appdata.cafef.vn/rest-api/api/v1/Watchlists/${symbol.toUpperCase()}/price`, {
            timeout: 5000,
            headers: {
                "accept": "*/*",
                "accept-language": "vi,en-US;q=0.9,en;q=0.8",
                "priority": "u=1, i",
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": '"Android"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://mshdev-iframe.cafef.vn/",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
            }
        });

        if (response.data && response.data.succeeded && response.data.data?.value) {
            const raw = response.data.data.value;
            
            const price = raw.price || 0;
            const refPrice = raw.refPrice || 0;
            const change = parseFloat((price - refPrice).toFixed(2));
            const percent = refPrice > 0 ? parseFloat(((change / refPrice) * 100).toFixed(2)) : 0;
            
            // Tính toán khối ngoại ròng (đơn vị: Tỷ VNĐ)
            const foreignBuyVal = raw.foreignBuyValue || 0;
            const foreignSellVal = raw.foreignSellValue || 0;
            const netValBillion = parseFloat(((foreignBuyVal - foreignSellVal) / 1000000000).toFixed(2));

            return {
                symbol: raw.symbol,
                price: price,
                change: change,
                percent: percent,
                netVal: netValBillion
            };
        }
        return null;
    } catch (err) {
        console.error(`[Cafef New API] Lỗi lấy dữ liệu mã ${symbol}:`, err.message);
        return null;
    }
}

// Handler cho lệnh check tay trực tiếp: /stock <mã>
exports.checkStockCommand = async (ctx) => {
    try {
        const text = ctx.message.text.trim();
        const args = text.split(/\s+/).slice(1);
        const symbol = args[0] || 'TCB';

        await ctx.reply(`🔍 Đang quét dữ liệu mã ${symbol.toUpperCase()} từ API Cafef App...`);
        
        const data = await getCafefNewPrice(symbol);

        if (!data) {
            return await ctx.reply('❌ Không lấy được thông tin cổ phiếu lúc này (API Cafef lỗi hoặc bị chặn).');
        }

        const statusEmoji = data.change > 0 ? '🟢' : (data.change < 0 ? '🔴' : '🟡');
        const foreignEmoji = data.netVal > 0 ? '🔵 (Khối ngoại MUA RÒNG)' : (data.netVal < 0 ? '🟠 (Khối ngoại BÁN RÒNG)' : '⚪ (Cân bằng)');
        const foreignText = `${foreignEmoji}: <code>${data.netVal > 0 ? '+' : ''}${data.netVal}</code> tỷ VNĐ`;

        await ctx.reply(
            `📊 <b>CẬP NHẬT CỔ PHIẾU: ${data.symbol}</b>\n\n` +
            `💰 <b>Giá hiện tại:</b> <code>${data.price}</code>\n` +
            `${statusEmoji} <b>Biến động:</b> <code>${data.change > 0 ? '+' : ''}${data.change}</code> (${data.percent}%)\n` +
            `🌐 <b>Giao dịch khối ngoại:</b>\n${foreignText}\n\n` +
            `<i>Cập nhật tự động từ hệ thống</i>`,
            { parse_mode: 'HTML' }
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
        const data = await getCafefNewPrice(symbol);

        if (data) {
            const statusEmoji = data.change > 0 ? '🟢' : (data.change < 0 ? '🔴' : '🟡');
            const foreignEmoji = data.netVal > 0 ? '🔵 Mua ròng' : (data.netVal < 0 ? '🟠 Bán ròng' : '⚪ Cân bằng');
            const foreignText = `${foreignEmoji}: <code>${data.netVal > 0 ? '+' : ''}${data.netVal}</code> tỷ`;

            const message = `🔔 <b>CẬP NHẬT BIẾN ĐỘNG 5 PHÚT: ${data.symbol}</b>\n\n` +
                            `💵 <b>Giá khớp:</b> <code>${data.price}</code> (${data.change > 0 ? '+' : ''}${data.change} | ${data.percent}%)\n` +
                            `🌐 <b>Khối ngoại:</b> ${foreignText}`;

            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            });
            console.log(`Đã gửi cập nhật 5 phút mã ${symbol} thành công!`);
        } else {
            console.log(`[Cafef New API] Không lấy được dữ liệu cho ${symbol} tại lượt này.`);
        }
    } catch (error) {
        console.error('Lỗi gửi báo cáo tự động:', error.response ? error.response.data : error.message);
    }
};