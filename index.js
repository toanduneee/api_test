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

cron.schedule('*/5 * * * *', () => {
    console.log('Tự động cập nhật giá cổ phiếu TCB (mỗi 5 phút)...');
    const TARGET_CHAT_ID = '-1002144884147';
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