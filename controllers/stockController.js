const axios = require('axios');

let latestStockData = {}; 
let priceAlerts = []; // Cấu trúc: { chatId, symbol, minPrice, maxPrice }

// 2 mảng RAM lưu chat ID và mã theo dõi định kỳ
const subscribedChatIds = [];
const subscribedSymbols = [];

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

            // Cập nhật vào bộ nhớ tạm
            latestStockData[result.symbol] = result;
            return result;
        }
        return null;
    } catch (err) {
        console.error(`[Cafef API] Lỗi lấy dữ liệu mã ${symbol}:`, err.message);
        return null;
    }
}

exports.checkStockCommand = async (ctx) => {
    try {
        const text = ctx.message.text.trim();
        const args = text.split(/\s+/).slice(1);
        const chatId = ctx.chat.id.toString();
        
        if (args.length === 0) {
            return await ctx.reply(
                '⚠️ Vui lòng nhập đúng cú pháp:\n' +
                '• Bật thông báo & xem giá: `/stock <MÃ>` (VD: `/stock TCB`)\n' +
                '• Đặt cảnh báo giá khẩn cấp: `/stock <MÃ> <giá_min>-<giá_max>` (VD: `/stock TCB 28.5-29.0`)',
                { parse_mode: 'Markdown' }
            );
        }

        const symbol = args[0].toUpperCase();
        const rangeArg = args[1];

        // Trường hợp 1: Đặt cảnh báo giá khẩn cấp
        if (rangeArg && rangeArg.includes('-')) {
            const prices = rangeArg.split('-');
            const minPrice = parseFloat(prices[0]);
            const maxPrice = parseFloat(prices[1]);

            if (isNaN(minPrice) || isNaN(maxPrice)) {
                return await ctx.reply('❌ Khoảng giá không hợp lệ. Ví dụ đúng: 28.5-29.0');
            }

            priceAlerts = priceAlerts.filter(alert => !(alert.chatId === chatId && alert.symbol === symbol));
            priceAlerts.push({ chatId, symbol, minPrice, maxPrice });

            return await ctx.reply(`🔔 Đã bật cảnh báo khẩn cấp cho *${symbol}* khi giá chạm *${minPrice} - ${maxPrice}*!`, { parse_mode: 'Markdown' });
        }

        // Trường hợp 2: Lưu/Cập nhật vào 2 mảng RAM để nhận thông báo định kỳ
        const existingIndex = subscribedChatIds.indexOf(chatId);
        let notifyNote = '';

        if (existingIndex !== -1) {
            const oldSymbol = subscribedSymbols[existingIndex];
            subscribedSymbols[existingIndex] = symbol;
            notifyNote = `\n\n🔄 <i>Đã đổi mã theo dõi định kỳ từ <b>${oldSymbol}</b> sang <b>${symbol}</b>.</i>`;
        } else {
            subscribedChatIds.push(chatId);
            subscribedSymbols.push(symbol);
            notifyNote = `\n\n✅ <i>Đã bật theo dõi định kỳ mã <b>${symbol}</b> cho chat này (Dùng /stockcancel để hủy).</i>`;
        }

        // Quét và trả về giá ngay lập tức
        await ctx.reply(`🔍 Đang quét dữ liệu mã ${symbol} từ Cafef...`);
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
            `🌐 <b>Giao dịch khối ngoại:</b>\n${foreignText}` +
            notifyNote,
            { parse_mode: 'HTML' }
        );
    } catch (err) {
        console.error('Lỗi lệnh /stock:', err.message);
    }
};

exports.cancelStockCommand = async (ctx) => {
    try {
        const chatId = ctx.chat.id.toString();
        const index = subscribedChatIds.indexOf(chatId);

        // Xóa cảnh báo khẩn cấp nếu có
        priceAlerts = priceAlerts.filter(alert => alert.chatId !== chatId);

        if (index !== -1) {
            const removedSymbol = subscribedSymbols[index];
            
            // Xóa đồng thời ở cả 2 mảng
            subscribedChatIds.splice(index, 1);
            subscribedSymbols.splice(index, 1);

            return await ctx.reply(
                `🛑 Đã hủy theo dõi mã <b>${removedSymbol}</b>.\nĐoạn chat này sẽ không nhận thông báo tự động nữa.`,
                { parse_mode: 'HTML' }
            );
        } else {
            return await ctx.reply('ℹ️ Đoạn chat này hiện chưa đăng ký theo dõi mã cổ phiếu nào.');
        }
    } catch (err) {
        console.error('Lỗi lệnh /stockcancel:', err.message);
    }
};

exports.fetchAllSubscribedPrices = async () => {
    // 1. Lọc ra danh sách các mã duy nhất cần quét (từ cả thông báo định kỳ và alert khẩn cấp)
    const symbolsToFetch = [...new Set([...subscribedSymbols, ...priceAlerts.map(a => a.symbol)])];

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    for (const sym of symbolsToFetch) {
        const data = await getCafefNewPrice(sym);
        if (!data) continue;

        // Kiểm tra Alert khẩn cấp nếu có
        if (TELEGRAM_BOT_TOKEN) {
            for (const alert of priceAlerts) {
                if (alert.symbol === sym && data.price >= alert.minPrice && data.price <= alert.maxPrice) {
                    const statusEmoji = data.change > 0 ? '🟢' : (data.change < 0 ? '🔴' : '🟡');
                    const alertMessage = `🚨 <b>CẢNH BÁO GIÁ KHẨN CẤP: ${sym}</b> 🚨\n\n` +
                                         `💵 <b>Giá hiện tại:</b> <code>${data.price}</code> nằm trong khoảng cài đặt (${alert.minPrice} - ${alert.maxPrice})\n` +
                                         `${statusEmoji} <b>Biến động:</b> <code>${data.change > 0 ? '+' : ''}${data.change}</code> (${data.percent}%)`;

                    axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                        chat_id: alert.chatId,
                        text: alertMessage,
                        parse_mode: 'HTML'
                    }).catch(err => console.error('Lỗi gửi alert khẩn cấp:', err.message));
                }
            }
        }
    }
};

exports.sendPeriodicStockUpdates = async () => {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN || subscribedChatIds.length === 0) return;

    for (let i = 0; i < subscribedChatIds.length; i++) {
        const chatId = subscribedChatIds[i];
        const symbol = subscribedSymbols[i];

        const data = latestStockData[symbol] || await getCafefNewPrice(symbol);
        if (!data) continue;

        const statusEmoji = data.change > 0 ? '🟢' : (data.change < 0 ? '🔴' : '🟡');
        const foreignEmoji = data.netVal > 0 ? '🔵 Mua ròng' : (data.netVal < 0 ? '🟠 Bán ròng' : '⚪ Cân bằng');
        const foreignText = `${foreignEmoji}: <code>${data.netVal > 0 ? '+' : ''}${data.netVal}</code> tỷ`;

        const message = `🔔 <b>CẬP NHẬT BIẾN ĐỘNG (10 PHÚT): ${data.symbol}</b>\n\n` +
                        `💵 <b>Giá khớp:</b> <code>${data.price}</code> (${data.change > 0 ? '+' : ''}${data.change} | ${data.percent}%)\n` +
                        `🌐 <b>Khối ngoại:</b> ${foreignText}\n\n` +
                        `<i>Dùng /stockcancel để dừng nhận tin.</i>`;

        try {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            });
            console.log(`Đã gửi cập nhật định kỳ mã ${symbol} tới chat ${chatId}`);
        } catch (error) {
            console.error(`Lỗi gửi định kỳ tới chat ${chatId}:`, error.message);
        }
    }
};