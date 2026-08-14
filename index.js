require('dotenv').config(); 
const express = require('express'); 
const path = require('path'); 
const apiRoutes = require('./routes/apiRoutes'); 
const stockController = require('./controllers/stockController'); 
const spxController = require('./controllers/spxController');
const cron = require('node-cron'); 

const app = express(); 
const PORT = process.env.PORT || 3000; 

app.use(express.json()); 
app.use((req, res, next) => {     
    res.setHeader('Access-Control-Allow-Origin', '*');     
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');     
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');     
    next(); 
});

app.use(express.static(path.join(__dirname, 'public'))); 
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/ping', (req, res) => { res.status(200).send('pong'); });
app.use('/', apiRoutes); 

let morningCounter = 0;
let afternoonCounter = 0;

// Khung giờ SÁNG: Quét mỗi 1 phút từ 9:00 AM đến 11:29 AM
cron.schedule('*/1 9-11 * * 1-5', async () => {     
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });     
    const localDate = new Date(now);     
    const currentHour = localDate.getHours();     
    const currentMinute = localDate.getMinutes();     
    if (currentHour === 11 && currentMinute > 30) return;      
    
    console.log(`[Sáng] Quét giá ngầm các mã đã đăng ký lúc ${currentHour}:${currentMinute}`);     
    
    // Bước 1: Quét ngầm tất cả các mã đang lưu trên RAM
    await stockController.fetchAllSubscribedPrices();
    
    // Bước 2: Tự động gửi báo cáo định kỳ mỗi 10 phút đến các chat ID tương ứng
    morningCounter++;
    if (morningCounter >= 10) {
        await stockController.sendPeriodicStockUpdates(); 
        morningCounter = 0;
    }
}, { timezone: "Asia/Ho_Chi_Minh" });

// Khung giờ CHIỀU: Quét mỗi 1 phút từ 13:00 đến 15:00
cron.schedule('*/1 13-15 * * 1-5', async () => {     
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });     
    const localDate = new Date(now);     
    const currentHour = localDate.getHours();     
    const currentMinute = localDate.getMinutes();     
    if (currentHour === 15 && currentMinute > 0) return;      
    
    console.log(`[Chiều] Quét giá ngầm các mã đã đăng ký lúc ${currentHour}:${currentMinute}`);     
    
    // Bước 1: Quét ngầm tất cả các mã đang lưu trên RAM
    await stockController.fetchAllSubscribedPrices();
    
    // Bước 2: Tự động gửi báo cáo định kỳ mỗi 10 phút đến các chat ID tương ứng
    afternoonCounter++;
    if (afternoonCounter >= 10) {
        await stockController.sendPeriodicStockUpdates(); 
        afternoonCounter = 0;
    }
}, { timezone: "Asia/Ho_Chi_Minh" });

// Cronjob cho track đơn hàng SPX
cron.schedule('*/15 7-22 * * *', async () => {
    console.log('[CRON SPX] Đang tiến hành quét tự động đơn hàng...');
    await spxController.autoTrackSPXOrders();
}, { timezone: "Asia/Ho_Chi_Minh" });

app.listen(PORT, () => {     
    console.log(`Server kiến trúc phân tầng đang chạy tại port ${PORT}`); 
});