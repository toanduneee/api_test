const { Telegraf } = require('telegraf');
const videoController = require('./videoController');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '👏', '🔥', '😁', '😎', '😍', '🤩', '🥳', '🤯', '🤔', '🤗', '😇', '🤠', '👽', '👻', '💋', '💯'];
let lastDebugStatus = "No command triggered yet";

// Câu lệnh /hello
bot.command('hello', async (ctx) => {
    try {
        const text = ctx.message.text.trim();
        const args = text.split(/\s+/).slice(1);

        if (args.length > 0) {
            const name = args.join(' ');
            try {
                for (let i = 0; i < 5; i++) {
                    await ctx.reply(`Dậy đê em ơi @${name}`);
                }
            } catch (apiErr) {
                console.warn('Gửi tin nhắn thật thất bại:', apiErr.message);
            }
            lastDebugStatus = "a";
        } else {
            try {
                await ctx.reply('Cú pháp đúng: /hello <tên>');
            } catch (apiErr) {
                console.warn('Gửi tin nhắn thật thất bại:', apiErr.message);
            }
            lastDebugStatus = "b";
        }
    } catch (err) {
        lastDebugStatus = `Error in hello command: ${err.message}`;
    }
});

// Bắt sự kiện tin nhắn thường
bot.on('message', async (ctx) => {
    try {
        if (ctx.message && ctx.message.text) {
            const messageText = ctx.message.text.trim();

            if (messageText.startsWith('/')) {
                lastDebugStatus = "Bỏ qua vì câu lệnh chưa định nghĩa";
                return;
            }

            // Nếu là link TikTok thì nhảy vào bộ điều khiển tải video
            if (messageText.includes('tiktok.com')) {
                lastDebugStatus = "Phát hiện link TikTok gửi từ người dùng";
                const urlRegex = /(https?:\/\/[^\s]+tiktok\.com[^\s]*)/gi;
                const match = messageText.match(urlRegex);
                
                if (match) {
                    await videoController.handleTiktokDownloadAndSend(match[0], ctx.chat.id, ctx);
                    return;
                }
            }

            // Thả reaction tin nhắn thường
            const randomEmoji = EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)];
            try {
                await ctx.telegram.callApi('setMessageReaction', {
                    chat_id: ctx.chat.id,
                    message_id: ctx.message.message_id,
                    reaction: [{ type: 'emoji', emoji: randomEmoji }],
                    is_big: true
                });
            } catch (apiErr) {
                console.warn('Thả reaction thất bại:', apiErr.message);
            }
            lastDebugStatus = `Đã thả emoji: ${randomEmoji}`;
        }
    } catch (err) {
        lastDebugStatus = `Error reacting: ${err.message}`;
    }
});

// Hàm xử lý webhook Express nhận dữ liệu từ Telegram
exports.handleTelegramWebhook = async (req, res) => {
    try {
        lastDebugStatus = "No command triggered yet";
        await bot.handleUpdate(req.body);
        return res.status(200).json({ status: 'ok', debug: lastDebugStatus });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: error.message });
    }
};