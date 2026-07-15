const { Telegraf } = require('telegraf');
const videoController = require('./videoController');
const stockController = require('./stockController');
const audioController = require('./audioController');

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

bot.command('stock', stockController.checkStockCommand);

bot.command('getid', async (ctx) => {
    try {
        const userId = ctx.from.id;          // ID của người dùng gõ lệnh
        const chatId = ctx.chat.id;          // ID của phòng chat hiện tại (cá nhân hoặc nhóm)
        const chatType = ctx.chat.type;      // Loại phòng chat (private, group, supergroup)

        // Lấy Thread ID (nếu nhóm có bật tính năng chia Topic)
        const threadId = ctx.message.message_thread_id;

        let responseText = `👤 <b>ID của bạn:</b> <code>${userId}</code>\n`;
        responseText += `💬 <b>ID Cuộc trò chuyện:</b> <code>${chatId}</code> (<i>${chatType}</i>)\n`;

        // Nếu lệnh được gõ trong một Topic của nhóm (Thread)
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

        if (!video) return; // Không phải video thì bỏ qua

        // Gửi câu hỏi kèm 2 nút bấm Có / Không, reply trực tiếp vào video đó
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
        await ctx.deleteMessage(); // Xóa tin nhắn câu hỏi của bot đi cho sạch nhóm
    } catch (err) {
        console.error('Lỗi khi hủy:', err.message);
    }
});

// 3. Lắng nghe khi người dùng bấm nút "Có"
// 3. Lắng nghe khi người dùng bấm nút "Có"
// 3. Lắng nghe khi người dùng bấm nút "Có" (hoặc nút Chuyển qua MP3 dưới video TikTok)
bot.action('convert_mp3_yes', async (ctx) => {
    try {
        // Tin nhắn chứa nút bấm hiện tại (nơi người dùng click)
        const currentMessage = ctx.callbackQuery.message;
        // Tin nhắn được reply (nếu có, đối với trường hợp bot hỏi Có/Không ở video thường)
        const repliedMessage = currentMessage.reply_to_message;
        
        // Ưu tiên tìm video trực tiếp ở tin nhắn hiện tại trước (áp dụng cho video TikTok gửi kèm nút)
        // Nếu không có mới tìm ở tin nhắn được reply (áp dụng cho video thường người dùng gửi lên)
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
        
        // Nếu đây là tin nhắn hỏi "Có/Không" (không phải tin nhắn chứa video trực tiếp), ta xóa nó đi cho sạch
        if (targetMessage !== currentMessage) {
            try {
                await ctx.deleteMessage();
            } catch (e) {
                console.warn("Không xóa được tin nhắn câu hỏi:", e.message);
            }
        }

        // Gọi trực tiếp audioController để xử lý convert
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