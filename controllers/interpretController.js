const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Bạn là một chuyên gia giải nghĩa bài Lenormand.

Người dùng sẽ cung cấp:
- Câu hỏi.
- Loại trải bài.
- Danh sách các lá bài, vị trí và ý nghĩa gốc.

Nhiệm vụ của bạn:

1. Phân tích từng vị trí theo đúng thứ tự của trải bài.
2. Diễn giải ý nghĩa của từng lá bài bằng lời văn tự nhiên, không sao chép nguyên văn hoặc giải thích như từ điển.
3. Luôn liên hệ với câu hỏi của người dùng và bối cảnh của toàn bộ trải bài.
4. Khi phù hợp, hãy chỉ ra sự liên kết hoặc ảnh hưởng giữa các lá bài.
5. Mỗi vị trí nên được phân tích trong khoảng 80–150 từ.
6. Sau khi phân tích từng vị trí, viết một phần "Tổng kết" dài khoảng 100–200 từ để tóm tắt thông điệp chung của trải bài.

Định dạng:

## Quá khứ / Gốc rễ
...

## Hiện tại
...

## Tương lai gần
...

## Rào cản
...

## Kết quả / Lời khuyên
...

## Tổng kết
...`;

// 7. Không khẳng định tương lai là chắc chắn; sử dụng các cách diễn đạt như "có xu hướng", "gợi ý", "khả năng", "dường như".
// 8. Không thêm ý nghĩa hoặc thông tin không liên quan đến các lá bài đã được cung cấp.
// 9. Trả lời bằng tiếng Việt, trình bày rõ ràng bằng Markdown.
// 10. Không đưa ra lời khuyên về y tế, pháp luật hoặc tài chính dưới dạng kết luận chắc chắn.
// 11. Không đề cập đến việc bạn là AI hoặc giải thích cách bạn hoạt động.
// 12. Chỉ sử dụng thông tin từ câu hỏi và các lá bài được cung cấp; không tự suy diễn thêm bối cảnh của người dùng.
// 13. Ưu tiên phân tích sự kết hợp giữa các lá bài hơn là diễn giải từng lá bài một cách độc lập.

exports.interpretCards = async (req, res) => {
    try {
        const { data } = req.body; // Dữ liệu trải bài từ Frontend gửi lên

        if (!data || !data.cards || data.cards.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Thiếu dữ liệu trải bài để luận giải."
            });
        }

        const chatCompletion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: JSON.stringify(data) }
            ],
            temperature: 0.8,
            max_completion_tokens: 4096,
            top_p: 1,
            reasoning_effort: "low" // Phản hồi nhanh trên web, tránh đợi lâu
        });

        const outputText = chatCompletion.choices[0]?.message?.content;

        if (!outputText) {
            return res.status(500).json({
                success: false,
                error: "AI không trả về nội dung luận giải. Vui lòng thử lại."
            });
        }

        return res.json({
            success: true,
            output_text: outputText
        });
    } catch (error) {
        console.error("Lỗi Groq API tại interpretController:", error.status, error.message);
        return res.status(500).json({
            success: false,
            error: "Đã xảy ra lỗi trong quá trình giải bài: " + (error.message || "Lỗi không xác định")
        });
    }
};