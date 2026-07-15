const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(express.json());

// Cấu hình CORS cơ bản cho phép gọi API từ mọi nguồn
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    next();
});

// 1. Endpoint /ping để UptimeRobot vào kích hoạt giữ server luôn thức
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// 2. API nhận link TikTok và trung chuyển video qua Telegram
app.post('/api/get-video', async (req, res) => {
    try {
        const { tiktokUrl, chatId } = req.body;
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

        if (!tiktokUrl) return res.status(400).json({ error: 'Thiếu link TikTok' });
        if (!chatId) return res.status(400).json({ error: 'Thiếu chatId để gửi Telegram' });
        if (!TELEGRAM_BOT_TOKEN) return res.status(500).json({ error: 'Chưa cấu hình TELEGRAM_BOT_TOKEN trên Render' });

        const commonHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/122.0.0.0 Safari/537.36'
        };

        // Bước 2.1: Giải quyết trường hợp link rút gọn (vt.tiktok.com)
        const checkRedirect = await axios.get(tiktokUrl, {
            headers: commonHeaders,
            maxRedirects: 5,
            timeout: 5000
        });
        const finalUrl = checkRedirect.request.res.responseUrl || tiktokUrl;

        // Bước 2.2: Gọi qua TikWM để bóc tách link sạch không watermark không bị chặn
        const apiResponse = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`, {
            headers: commonHeaders,
            timeout: 8000
        });

        const resData = apiResponse.data;
        if (!resData || resData.code !== 0 || !resData.data?.play) {
            return res.status(422).json({ error: 'Không thể lấy được link video sạch từ cổng bypass.' });
        }

        const cleanVideoUrl = resData.data.play;
        const videoTitle = resData.data.title || "TikTok Video";

        // Bước 2.3: Server Render đứng ra tải file video thật về RAM dưới dạng Buffer
        const videoResponse = await axios({
            method: 'get',
            url: cleanVideoUrl,
            headers: commonHeaders,
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const videoBuffer = Buffer.from(videoResponse.data);

        // Bước 2.4: Đóng gói dữ liệu nhị phân gửi thẳng lên API Telegram
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('video', videoBuffer, {
            filename: 'video.mp4',
            contentType: 'video/mp4'
        });
        formData.append('caption', `🎬 *${videoTitle}*\n\n🔗 Link gốc: ${tiktokUrl}`);

        const telegramResponse = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 35000
            }
        );

        if (telegramResponse.data.ok) {
            return res.status(200).json({
                success: true,
                message: "Đã tải và gửi video trực tiếp qua Telegram thành công!"
            });
        } else {
            return res.status(500).json({
                error: "Telegram từ chối gửi video.",
                details: telegramResponse.data
            });
        }

    } catch (error) {
        return res.status(500).json({
          error: 'Thất bại trong quá trình xử lý tải/gửi video.',
          details: error.response?.data ? error.response.data.toString() : error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy mượt mà tại port ${PORT}`);
});