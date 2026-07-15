const express = require('express');
const apiRoutes = require('./routes/apiRoutes');
const stockController = require('./controllers/stockController');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Cấu hình CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});

// Endpoint ping giữ ấm server cho UptimeRobot
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

const TARGET_CHAT_ID = '-1002144884147';

// 1. Khung giờ SÁNG: Chạy mỗi 5 phút từ 9:00 AM đến 11:29 AM
// Cú pháp: Phút (chia hết cho 5), Giờ (9 đến 11), Ngày (*), Tháng (*), Thứ (1-5 là Thứ 2 đến Thứ 6)
cron.schedule('*/5 9-11 * * 1-5', () => {
    // Để chặn trường hợp chạy quá 11:30 (ví dụ 11:35, 11:40...), ta lọc thêm bằng code:
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour === 11 && currentMinute > 30) {
        return; // Dừng lại không gửi sau 11:30
    }

    console.log(`[Sáng] Cập nhật giá TCB lúc ${currentHour}:${currentMinute}`);
    stockController.sendAutomaticStockAlert('TCB', TARGET_CHAT_ID);
});

// 2. Khung giờ CHIỀU: Chạy mỗi 5 phút từ 13:00 (1:00 PM) đến 15:00 (3:00 PM)
// Cú pháp: Phút (chia hết cho 5), Giờ (13 đến 15), Ngày (*), Tháng (*), Thứ (1-5)
cron.schedule('*/5 13-15 * * 1-5', () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Để chặn trường hợp chạy quá 15:00 (ví dụ 15:05, 15:10...)
    if (currentHour === 15 && currentMinute > 0) {
        return; // Dừng lại không gửi sau 15:00
    }

    console.log(`[Chiều] Cập nhật giá TCB lúc ${currentHour}:${currentMinute}`);
    stockController.sendAutomaticStockAlert('TCB', TARGET_CHAT_ID);
});

app.get('/', (req, res) => {
    res.status(200).send('test thôi nè');
})
// Kích hoạt toàn bộ định tuyến cấu hình
app.use('/', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server kiến trúc phân tách đang chạy mượt mà tại port ${PORT}`);
});