const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');
const stockController = require('./controllers/stockController');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cấu hình để Express có thể đọc các file tĩnh (CSS, JS, Hình ảnh nếu có) trong thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// 2. Định nghĩa route GET cho trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// 1. Khung giờ SÁNG: Chạy mỗi 5 phút từ 9:00 AM đến 11:29 AM (Theo giờ Việt Nam)
cron.schedule('*/5 9-11 * * 1-5', () => {
    // Ép đối tượng Date hiển thị chính xác theo múi giờ Việt Nam
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
    const localDate = new Date(now);
    const currentHour = localDate.getHours();
    const currentMinute = localDate.getMinutes();

    // Lọc bỏ các lượt chạy phát sinh sau 11:30
    if (currentHour === 11 && currentMinute > 30) {
        return; 
    }

    console.log(`[Sáng] Cập nhật giá TCB lúc ${currentHour}:${currentMinute}`);
    stockController.sendAutomaticStockAlert('TCB', TARGET_CHAT_ID);
}, {
    timezone: "Asia/Ho_Chi_Minh" // Ép cron chạy theo múi giờ Việt Nam
});

// 2. Khung giờ CHIỀU: Chạy mỗi 5 phút từ 13:00 (1:00 PM) đến 15:00 (3:00 PM) (Theo giờ Việt Nam)
cron.schedule('*/5 13-15 * * 1-5', () => {
    // Ép đối tượng Date hiển thị chính xác theo múi giờ Việt Nam
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
    const localDate = new Date(now);
    const currentHour = localDate.getHours();
    const currentMinute = localDate.getMinutes();

    // Lọc bỏ các lượt chạy phát sinh sau 15:00
    if (currentHour === 15 && currentMinute > 0) {
        return; 
    }

    console.log(`[Chiều] Cập nhật giá TCB lúc ${currentHour}:${currentMinute}`);
    stockController.sendAutomaticStockAlert('TCB', TARGET_CHAT_ID);
}, {
    timezone: "Asia/Ho_Chi_Minh" // Ép cron chạy theo múi giờ Việt Nam
});

// Kích hoạt toàn bộ định tuyến cấu hình
app.use('/', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server kiến trúc phân tách đang chạy mượt mà tại port ${PORT}`);
});