const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_TEST });

exports.replyWithAI = async (ctx) => {
    try {
        const fullText = ctx.message.text || '';
        const prompt = fullText.replace(/^\/ask\s*/, '').trim();
        if (!prompt) {
            return await ctx.reply('Bạn vui lòng nhập câu hỏi sau lệnh /ask nhé! Ví dụ: /ask Groq là gì?');
        }
        await ctx.sendChatAction('typing');
        const systemPrompt = `Bạn là một trợ lý AI trên Telegram, bạn cần phản hồi các tin nhắn của người dùng.
Hãy trả lời câu hỏi một cách ngắn gọn, súc tích và dễ hiểu.
Quy tắc trình bày:
- Hãy thật là hài hước, có thể sử dụng lời lẽ châm chọc, chế diễu, gây hài.
- CẤM sử dụng định dạng Markdown.
- Nếu có đoạn mã lệnh, code, câu lệnh SQL hoặc lệnh Terminal, BẮT BUỘC đặt trong ô code block (dùng 3 dấu xuyệt ngược \\\ ).
- Dùng dấu gạch đầu dòng (-) cho các danh sách để giao diện rõ ràng.`;
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "system",
                    "content": systemPrompt,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            "model": 'openai/gpt-oss-120b',
            "temperature": 1,
            "max_completion_tokens": 2048,
            "top_p": 1,
            "reasoning_effort": "medium",
            "stop": null
        });
        const replyText = chatCompletion.choices[0]?.message?.content || 'Không nhận được phản hồi từ AI.';
        const fixText = `\`\`\`\n${replyText}\n\`\`\``
        try {
            await ctx.reply(fixText, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
        } catch (markdownErr) {
            console.warn('Lỗi parse Markdown của Telegram, gửi lại dạng Plain Text:', markdownErr.message);
            // Fallback gửi thường nếu tin nhắn chứa ký tự đặc biệt gây lỗi
            await ctx.reply(replyText);
        }
    } catch (err) {
        console.error('Lỗi tại askController:', err);
        
        // Nếu lỗi do Markdown format sai, thử gửi dạng tin nhắn thường để không bị trôi tin
        try {
            await ctx.reply('Có lỗi xảy ra hoặc lỗi định dạng Markdown từ AI. Đang gửi lại dạng văn bản thường...\n\n' + err.message);
        } catch (e) {
            console.error('Không thể gửi tin nhắn báo lỗi:', e);
        }
    }
}