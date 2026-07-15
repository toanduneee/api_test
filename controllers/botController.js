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
bot.action('convert_mp3_yes', async (ctx) => {
    try {
        // Lấy tin nhắn gốc mà bot đã reply vào
        const originalMessage = ctx.callbackQuery.message.reply_to_message;
        
        if (!originalMessage) {
            return await ctx.answerCbQuery('❌ Không tìm thấy video gốc. Có thể bạn đã xóa video trước đó.', { show_alert: true });
        }

        let fileId = null;

        // Trường hợp 1: Tin nhắn gốc chứa video thường
        if (originalMessage.video) {
            fileId = originalMessage.video.file_id;
        } 
        // Trường hợp 2: Tin nhắn gốc là video hình tròn (video_note)
        else if (originalMessage.video_note) {
            fileId = originalMessage.video_note.file_id;
        } 
        // Trường hợp 3: Tin nhắn gốc là ảnh động (animation/gif)
        else if (originalMessage.animation) {
            fileId = originalMessage.animation.file_id;
        }
        // Trường hợp 4: Gửi dưới dạng tài liệu (document) nhưng là file video
        else if (originalMessage.document && originalMessage.document.mime_type?.startsWith('video/')) {
            fileId = originalMessage.document.file_id;
        }

        // Nếu không bóc tách được bất kỳ file_id video nào
        if (!fileId) {
            return await ctx.answerCbQuery('❌ Không tìm thấy video hợp lệ trong tin nhắn gốc.', { show_alert: true });
        }

        // Báo cho Telegram biết ta nhận được tương tác thành công
        await ctx.answerCbQuery('🔄 Đang khởi tạo tiến trình trích xuất...');

        // Giả lập callback_data chứa file_id thật để chuyển tiếp cho audioController xử lý
        ctx.callbackQuery.data = `mp3_${fileId}`;

        // Gọi audioController xử lý tải, convert và gửi file
        await audioController.handleMp3Conversion(ctx);
    } catch (err) {
        console.error('Lỗi chi tiết khi xử lý nút Có:', err.message);
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