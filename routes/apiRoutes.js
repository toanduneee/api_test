const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const botController = require('../controllers/botController');
const interpretController = require('../controllers/interpretController');
const ttsController = require('../controllers/ttsController');

// Tuyến đường xử lý webhook của bot Telegram
router.post('/webhook/telegram', botController.handleTelegramWebhook);

// Tuyến đường dành cho API ngoài gọi tải video trực tiếp
router.post('/api/get-video', videoController.downloadTiktokApi);

router.post('/api/interpret', interpretController.interpretCards);

router.post('/api/tts', ttsController.generateSpeech);

module.exports = router;