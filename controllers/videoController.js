const axios = require('axios');
const FormData = require('form-data');

const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/122.0.0.0 Safari/537.36'
};

// Hàm lõi xử lý tải từ TikWM và đẩy lên Telegram (dùng chung cho cả Webhook và API ngoài)
async function handleTiktokDownloadAndSend(tiktokUrl, chatId, ctx) {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    try {
        // Xử lý link redirect rút gọn
        const checkRedirect = await axios.get(tiktokUrl, {
            headers: commonHeaders,
            maxRedirects: 5,
            timeout: 5000
        });
        const finalUrl = checkRedirect.request.res.responseUrl || tiktokUrl;

        // Gọi TikWM lấy link sạch
        const apiResponse = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`, {
            headers: commonHeaders,
            timeout: 8000
        });

        const resData = apiResponse.data;
        if (!resData || resData.code !== 0 || !resData.data?.play) {
            if (ctx) await ctx.reply('❌ Không thể lấy được link video sạch từ hệ thống bypass.');
            return false;
        }

        if (ctx) await ctx.reply('⏳ Đang tải và xử lý video, đợi xíu nhé...');

        // Tải video về RAM dạng Buffer
        const videoResponse = await axios({
            method: 'get',
            url: resData.data.play,
            headers: commonHeaders,
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const videoBuffer = Buffer.from(videoResponse.data);

        // Đẩy file nhị phân sang Telegram
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('video', videoBuffer, {
            filename: 'video.mp4',
            contentType: 'video/mp4'
        });
        formData.append('caption', `🎬 *${resData.data.title || "TikTok Video"}*\n\n🔗 Link gốc: ${tiktokUrl}`);

        await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`,
            formData,
            { headers: formData.getHeaders(), timeout: 35000 }
        );
        return true;
    } catch (error) {
        console.error('Lỗi tải video:', error.message);
        if (ctx) await ctx.reply(`❌ Có lỗi xảy ra khi tải video: ${error.message}`);
        return false;
    }
}

// Handler cho công cụ bên ngoài gọi POST API trực tiếp
exports.downloadTiktokApi = async (req, res) => {
    try {
        const { tiktokUrl, chatId } = req.body;
        if (!tiktokUrl || !chatId) return res.status(400).json({ error: 'Thiếu thông tin yêu cầu' });

        const success = await handleTiktokDownloadAndSend(tiktokUrl, chatId, null);
        if (success) {
            return res.status(200).json({ success: true, message: "Gửi video thành công!" });
        } else {
            return res.status(500).json({ error: "Thất bại khi xử lý tải video" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Xuất hàm bổ trợ ra để file định tuyến Bot có thể sử dụng
exports.handleTiktokDownloadAndSend = handleTiktokDownloadAndSend;