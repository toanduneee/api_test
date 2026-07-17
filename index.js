// index.js
require('dotenv').config(); // Đảm bảo dotenv chạy đầu tiên
const express = require('express'); 
const path = require('path'); 
const apiRoutes = require('./routes/apiRoutes'); 
const stockController = require('./controllers/stockController'); 
const cron = require('node-cron'); 

const app = express(); 
const PORT = process.env.PORT || 3000; 

// MIDDLEWARE ƯU TIÊN 1: Cấu hình phân tích dữ liệu JSON (Phải đặt TRƯỚC Router)
app.use(express.json()); 

// MIDDLEWARE ƯU TIÊN 2: Cấu hình CORS
app.use((req, res, next) => {     
    res.setHeader('Access-Control-Allow-Origin', '*');     
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');     
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');     
    next(); 
});

// Cấu hình các file tĩnh (CSS, JS, hình ảnh) từ thư mục public
app.use(express.static(path.join(__dirname, 'public'))); 

// Route trang chủ
app.get('/', (req, res) => {     
    res.sendFile(path.join(__dirname, 'public', 'index.html')); 
});

// Endpoint ping giám sát server cho UptimeRobot 
app.get('/ping', (req, res) => {     
    res.status(200).send('pong'); 
});

// KÍCH HOẠT ĐỊNH TUYẾN CHÍNH (Đã bao gồm cả các route /api)
app.use('/', apiRoutes); 

// ==========================================
// CRON JOB MANAGER (Giữ nguyên cấu hình của bạn)
// ==========================================
const TARGET_CHAT_ID = '-1002144884147'; 

// Khung giờ SÁNG: 5 phút/lần từ 9:00 AM đến 11:29 AM
cron.schedule('*/5 9-11 * * 1-5', () => {     
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });     
    const localDate = new Date(now);     
    const currentHour = localDate.getHours();     
    const currentMinute = localDate.getMinutes();     
    if (currentHour === 11 && currentMinute > 30) return;      
    console.log(`[Sáng] Cập nhật giá TCB lúc ${currentHour}:${currentMinute}`);     
    stockController.sendAutomaticStockAlert('TCB', TARGET_CHAT_ID); 
}, { timezone: "Asia/Ho_Chi_Minh" });

// Khung giờ CHIỀU: 5 phút/lần từ 13:00 đến 15:00
cron.schedule('*/5 13-15 * * 1-5', () => {     
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });     
    const localDate = new Date(now);     
    const currentHour = localDate.getHours();     
    const currentMinute = localDate.getMinutes();     
    if (currentHour === 15 && currentMinute > 0) return;      
    console.log(`[Chiều] Cập nhật giá TCB lúc ${currentHour}:${currentMinute}`);     
    stockController.sendAutomaticStockAlert('TCB', TARGET_CHAT_ID); 
}, { timezone: "Asia/Ho_Chi_Minh" });

// Khởi chạy server
app.listen(PORT, () => {     
    console.log(`Server kiến trúc phân tầng đang chạy tại port ${PORT}`); 
});