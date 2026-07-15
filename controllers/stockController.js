const axios = require('axios');

// Hàm lấy giá cổ phiếu thực tế từ bảng giá VNDirect
async function getStockPrice(symbol) {
    try {
        const response = await axios.get(`https://banggia.vndirect.com.vn/api/chungkhoan/getSymbolInfo?symbols=${symbol.toUpperCase()}`);
        
        if (response.data && response.data.length > 0) {
            const data = response.data[0];
            return {
                symbol: symbol.toUpperCase(),
                currentPrice: data.lastPrice, // Giá khớp lệnh gần nhất
                change: data.ot,             // Mức tăng giảm
                changePercent: data.changePercent || 0
            };
        }
        return null;
    } catch (error) {
        console.error(`Lỗi khi lấy giá mã ${symbol}:`, error.message);
        return null;
    }
}

// Handler cho lệnh check giá trực tiếp khi người dùng gõ tin nhắn (Ví dụ: /stock fpt)
exports.checkStockCommand = async (ctx) => {
    try {
        const text = ctx.message.text.trim();
        const args = text.split(/\s+/).slice(1);
        const symbol = args[0] || 'TCB'; // Nếu chỉ gõ /stock thì mặc định check TCB

        await ctx.reply(`🔍 Đang kiểm tra mã ${symbol.toUpperCase()}...`);
        const stock = await getStockPrice(symbol);

        if (!stock) {
            return await ctx.reply('❌ Không tìm thấy thông tin mã cổ phiếu này hoặc API lỗi.');
        }

        const statusEmoji = stock.change > 0 ? '🟢' : (stock.change < 0 ? '🔴' : '🟡');
        await ctx.reply(
            `📊 *THÔNG TIN CỔ PHIẾU: ${stock.symbol}*\n\n` +
            `💰 Giá hiện tại: \`${stock.currentPrice}\`\n` +
            `${statusEmoji} Biến động: \`${stock.change > 0 ? '+' : ''}${stock.change}\` (${stock.changePercent}%)\n\n` +
            `_Cập nhật từ hệ thống bảng giá_`, 
            { parse_mode: 'Markdown' }
        );
    } catch (err) {
        console.error('Lỗi lệnh stock:', err.message);
    }
};

// Hàm tự động gửi thông báo định kỳ
exports.sendAutomaticStockAlert = async (symbol, chatId) => {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('Lỗi: Chưa cấu hình TELEGRAM_BOT_TOKEN trong file .env');
        return;
    }

    const stock = await getStockPrice(symbol);
    if (stock) {
        const statusEmoji = stock.change > 0 ? '🟢' : (stock.change < 0 ? '🔴' : '🟡');
        const message = `🔔 *BÁO CÁO GIÁ CỔ PHIẾU TỰ ĐỘNG*\n\n` +
                        `📈 Mã: *${stock.symbol}*\n` +
                        `💵 Giá khớp: \`${stock.currentPrice}\`\n` +
                        `${statusEmoji} Thay đổi: \`${stock.change > 0 ? '+' : ''}${stock.change}\` (${stock.changePercent}%)`;

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
    }
};