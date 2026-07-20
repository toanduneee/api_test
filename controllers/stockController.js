const axios = require('axios');

// Bộ nhớ tạm lưu dữ liệu mới nhất và danh sách cảnh báo
let latestStockData = {}; 
let priceAlerts = []; // Cấu trúc: { chatId, symbol, minPrice, maxPrice }

// Hàm lấy dữ liệu cổ phiếu từ API mới của Cafef [source: 1]
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
            
            const foreignBuyVal = raw.foreignBuyValue || 0;
            const foreignSellVal = raw.foreignSellValue || 0;
            const netValBillion = parseFloat(((foreignBuyVal - foreignSellVal) / 1000000000).toFixed(2));

            const result = {
                symbol: raw.symbol.toUpperCase(),
                price: price,
                change: change,
                percent: percent,
                netVal: netValBillion
            };

            // Cập nhật vào bộ nhớ tạm để dùng chung
            latestStockData[result.symbol] = result;
            return result;
        }
        return null;
    } catch (err) {
        console.error(`[Cafef New API] Lỗi lấy dữ liệu mã ${symbol}:`, err.message);
        return null;
    }
}

// Handler cho lệnh check tay và cài đặt Cảnh báo giá: /stock <mã> <giá_thấp>-<giá_cao>
exports.checkStockCommand = async (ctx) => {
    try {
        const text = ctx.message.text.trim();
        const args = text.split(/\s+/).slice(1);
        
        if (args.length === 0) {
            return await ctx.reply('⚠️ Vui lòng nhập đúng cú pháp.\nVí dụ check tay: `/stock TCB` \nVí dụ đặt alert: `/stock TCB 28.5-29.0`', { parse_mode: 'Markdown' });
        }

        const symbol = args[0].toUpperCase();
        const rangeArg = args[1];

        // Trường hợp 1: Người dùng đặt cảnh báo giá (Có tham số giá)
        if (rangeArg && rangeArg.includes('-')) {
            const prices = rangeArg.split('-');
            const minPrice = parseFloat(prices[0]);
            const maxPrice = parseFloat(prices[1]);

            if (isNaN(minPrice) || isNaN(maxPrice)) {
                return await ctx.reply('❌ Khoảng giá không hợp lệ. Ví dụ đúng: 28.5-29.0');
            }

            // Lưu hoặc cập nhật cảnh báo của user này cho mã cổ phiếu đó
            const chatId = ctx.chat.id.toString();
            priceAlerts = priceAlerts.filter(alert => !(alert.chatId === chatId && alert.symbol === symbol));
            priceAlerts.push({ chatId, symbol, minPrice, maxPrice });

            return await ctx.reply(`🔔 Đã bật cảnh báo cho **${symbol}** khi giá rơi vào khoảng **${minPrice} - ${maxPrice}**!`, { parse_mode: 'Markdown' });
        }

        // Trường hợp 2: Check tay trực tiếp như cũ [source: 1]
        await ctx.reply(`🔍 Đang quét dữ liệu mã ${symbol} từ API Cafef App...`);
        const data = await getCafefNewPrice(symbol);

        if (!data) {
            return await ctx.reply('❌ Không lấy được thông tin cổ phiếu lúc này.');
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

// Hàm quét dữ liệu ngầm (Chạy mỗi 1 phút từ index.js)
exports.fetchPriceInBackground = async (symbol) => {
    const data = await getCafefNewPrice(symbol);
    if (!data) return null;

    // Kiểm tra danh sách Price Alert ngay lập tức
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) return data;

    for (const alert of priceAlerts) {
        if (alert.symbol === symbol && data.price >= alert.minPrice && data.price <= alert.maxPrice) {
            const statusEmoji = data.change > 0 ? '🟢' : (data.change < 0 ? '🔴' : '🟡');
            const alertMessage = `🚨 <b>CẢNH BÁO GIÁ KHẨN CẤP: ${symbol}</b> 🚨\n\n` +
                                 `💵 <b>Giá hiện tại:</b> <code>${data.price}</code> nằm trong khoảng cài đặt (${alert.minPrice} - ${alert.maxPrice})\n` +
                                 `${statusEmoji} <b>Biến động:</b> <code>${data.change > 0 ? '+' : ''}${data.change}</code> (${data.percent}%)`;

            axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: alert.chatId,
                text: alertMessage,
                parse_mode: 'HTML'
            }).catch(err => console.error('Lỗi gửi alert khẩn cấp:', err.message));
        }
    }
    return data;
};

// Hàm gửi báo cáo định kỳ (Đã đổi text thành 10 phút)
exports.sendAutomaticStockAlert = async (symbol, chatId) => {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) return;

    // Lấy dữ liệu từ bộ nhớ tạm để tránh gọi API trùng lặp
    const data = latestStockData[symbol.toUpperCase()];

    if (data) {
        const statusEmoji = data.change > 0 ? '🟢' : (data.change < 0 ? '🔴' : '🟡');
        const foreignEmoji = data.netVal > 0 ? '🔵 Mua ròng' : (data.netVal < 0 ? '🟠 Bán ròng' : '⚪ Cân bằng');
        const foreignText = `${foreignEmoji}: <code>${data.netVal > 0 ? '+' : ''}${data.netVal}</code> tỷ`;

        const message = `🔔 <b>CẬP NHẬT BIẾN ĐỘNG 10 PHÚT: ${data.symbol}</b>\n\n` +
                        `💵 <b>Giá khớp:</b> <code>${data.price}</code> (${data.change > 0 ? '+' : ''}${data.change} | ${data.percent}%)\n` +
                        `🌐 <b>Khối ngoại:</b> ${foreignText}`;

        try {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            });
            console.log(`Đã gửi cập nhật 10 phút mã ${symbol} thành công!`);
        } catch (error) {
            console.error('Lỗi gửi báo cáo định kỳ:', error.message);
        }
    }
};