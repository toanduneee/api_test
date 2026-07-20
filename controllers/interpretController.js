require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
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

        const response = await client.chat.completions.create({
            model: "openai/gpt-oss-120b", 
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: JSON.stringify(data) }
            ]
        });

        return res.json({ 
            success: true, 
            output_text: response.choices[0].message.content 
        });
    } catch (error) {
        console.error("Lỗi Groq API:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Đã xảy ra lỗi trong quá trình giải bài." 
        });
    }
};