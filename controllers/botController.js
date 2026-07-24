const { Telegraf } = require('telegraf');
const videoController = require('./videoController');
const stockController = require('./stockController');
const audioController = require('./audioController');
const askController = require('./askController');

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

// ĐĂNG KÝ LỆNH STOCK (Xử lý song song cả tra cứu và cài đặt Alert)
bot.command('stock', stockController.checkStockCommand);

bot.command('ask', askController.replyWithAI);

bot.command('getid', async (ctx) => {
    try {
        const userId = ctx.from.id;          
        const chatId = ctx.chat.id;          
        const chatType = ctx.chat.type;      

        const threadId = ctx.message.message_thread_id;

        let responseText = `👤 <b>ID của bạn:</b> <code>${userId}</code>\n`;
        responseText += `💬 <b>ID Cuộc trò chuyện:</b> <code>${chatId}</code> (<i>${chatType}</i>)\n`;

        if (threadId) {
            responseText += `🧵 <b>ID Topic (Thread):</b> <code>${threadId}</code>\n`;
        }

        await ctx.reply(responseText, {
            parse_mode: 'HTML',
            reply_parameters: {
                message_id: ctx.message.message_id
            }
        });
    } catch (err) {
        console.error('Loi lay ID: ', err.message);
    }
});

// 1. Lắng nghe khi có người dùng gửi VIDEO hoặc VIDEO NOTE (tròn)
bot.on(['video', 'video_note', 'document'], async (ctx) => {
    try {
        const isVideoDoc = ctx.message.document && ctx.message.document.mime_type?.startsWith('video/');
        const video = ctx.message.video || ctx.message.video_note || (isVideoDoc ? ctx.message.document : null);

        if (!video) return; 

        await ctx.reply('🎬 Tôi phát hiện một video. Bạn có muốn trích xuất nhạc từ video này không?', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🟢 Có', callback_data: 'convert_mp3_yes' },
                        { text: '🔴 Không', callback_data: 'convert_mp3_no' }
                    ]
                ]
            },
            reply_parameters: {
                message_id: ctx.message.message_id
            }
        });
    } catch (err) {
        console.error('Lỗi khi hiển thị nút bấm Có/Không:', err.message);
    }
});

// 2. Lắng nghe khi người dùng bấm nút "Không"
bot.action('convert_mp3_no', async (ctx) => {
    try {
        await ctx.answerCbQuery('Đã hủy bỏ yêu cầu.');
        await ctx.deleteMessage(); 
    } catch (err) {
        console.error('Lỗi khi hủy:', err.message);
    }
});

// 3. Lắng nghe khi người dùng bấm nút "Có"
bot.action('convert_mp3_yes', async (ctx) => {
    try {
        const currentMessage = ctx.callbackQuery.message;
        const repliedMessage = currentMessage.reply_to_message;
        
        const targetMessage = (currentMessage.video || currentMessage.video_note || currentMessage.document) 
            ? currentMessage 
            : repliedMessage;

        if (!targetMessage) {
            return await ctx.answerCbQuery('❌ Không tìm thấy video gốc để xử lý.', { show_alert: true });
        }

        let fileId = null;

        if (targetMessage.video) {
            fileId = targetMessage.video.file_id;
        } else if (targetMessage.video_note) {
            fileId = targetMessage.video_note.file_id;
        } else if (targetMessage.animation) {
            fileId = targetMessage.animation.file_id;
        } else if (targetMessage.document && targetMessage.document.mime_type?.startsWith('video/')) {
            fileId = targetMessage.document.file_id;
        }

        if (!fileId) {
            return await ctx.answerCbQuery('❌ Không tìm thấy video hợp lệ để chuyển đổi.', { show_alert: true });
        }

        await ctx.answerCbQuery('🔄 Đang khởi tạo tiến trình trích xuất...');
        
        if (targetMessage !== currentMessage) {
            try {
                await ctx.deleteMessage();
            } catch (e) {
                console.warn("Không xóa được tin nhắn câu hỏi:", e.message);
            }
        }

        await audioController.processAndSendMp3(ctx, fileId);

    } catch (err) {
        console.error('Lỗi khi xử lý nút Có/Chuyển MP3:', err.message);
        await ctx.answerCbQuery('❌ Có lỗi xảy ra trong quá trình bóc tách video.', { show_alert: true });
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

            if (messageText.includes('tiktok.com')) {
                lastDebugStatus = "Phát hiện link TikTok gửi từ người dùng";
                const urlRegex = /(https?:\/\/[^\s]+tiktok\.com[^\s]*)/gi;
                const match = messageText.match(urlRegex);

                if (match) {
                    await videoController.handleTiktokDownloadAndSend(match[0], ctx.chat.id, ctx);
                    return;
                }
            }

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