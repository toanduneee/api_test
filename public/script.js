// Danh sách 36 lá bài Lenormand cơ bản đầy đủ
const lenormandDeck = [
    { id: 1, name: "The Rider", meaning: "Tin tức, thông điệp, sự di chuyển nhanh chóng, người mới đến." },
    { id: 2, name: "The Clover", meaning: "May mắn nhỏ, cơ hội bất ngờ, niềm vui ngắn hạn, hy vọng." },
    { id: 3, name: "The Ship", meaning: "Chuyến đi, sự dịch chuyển, khoảng cách, khát vọng, kinh doanh." },
    { id: 4, name: "The House", meaning: "Gia đình, sự an toàn, sự ổn định, nơi ở hiện tại, sự ấm cúng." },
    { id: 5, name: "The Tree", meaning: "Sức khỏe, sự phát triển lâu dài, kết nối tâm linh, nguồn cội." },
    { id: 6, name: "The Clouds", meaning: "Sự mập mờ, bối rối, rắc rối tạm thời, nghi ngờ." },
    { id: 7, name: "The Snake", meaning: "Sự phản bội, lừa dối, sự ghen tị, đường vòng, sự phức tạp." },
    { id: 8, name: "The Coffin", meaning: "Sự kết thúc, mất mát, thay đổi lớn, sự chuyển giao." },
    { id: 9, name: "The Flowers", meaning: "Món quà, niềm vui, sự công nhận, tình bạn, hạnh phúc ngọt ngào." },
    { id: 10, name: "The Scythe", meaning: "Sự cắt đứt đột ngột, nguy hiểm, quyết định nhanh chóng, thu hoạch." },
    { id: 11, name: "The Whip", meaning: "Xung đột, tranh cãi, sự lặp đi lặp lại, thể thao, hình phạt." },
    { id: 12, name: "The Birds", meaning: "Cuộc trò chuyện, tin đồn, lo lắng nhẹ, cặp đôi, giao tiếp." },
    { id: 13, name: "The Child", meaning: "Sự khởi đầu mới, đứa trẻ, sự ngây thơ, nhỏ bé, sự tò mò." },
    { id: 14, name: "The Fox", meaning: "Sự khôn ngoan, công việc, sự cảnh giác, lừa lọc vì sinh tồn." },
    { id: 15, name: "The Bear", meaning: "Sức mạnh, quyền lực, tài chính, sự bảo vệ, người mẹ hoặc sếp." },
    { id: 16, name: "The Stars", meaning: "Hy vọng, ước mơ, cảm hứng, định hướng, thành công trong tương lai." },
    { id: 17, name: "The Stork", meaning: "Sự thay đổi, cải tiến, chuyển dịch, sinh nở, chu kỳ mới." },
    { id: 18, name: "The Dog", meaning: "Tình bạn, sự trung thành, lòng tin, người hỗ trợ đắc lực." },
    { id: 19, name: "The Tower", meaning: "Cơ quan nhà nước, sự cô lập, ranh giới, tòa nhà lớn, tham vọng." },
    { id: 20, name: "The Garden", meaning: "Cộng đồng, sự kiện công chúng, mạng xã hội, nơi đông người." },
    { id: 21, name: "The Mountain", meaning: "Trở ngại, sự trì hoãn, thách thức lớn, sự bế tắc." },
    { id: 22, name: "The Crossroads", meaning: "Lựa chọn, quyết định, ngã rẽ cuộc đời, nhiều hướng đi." },
    { id: 23, name: "The Mice", meaning: "Sự hao mòn, mất mát nhỏ, căng thẳng, lo lắng, sự phá hoại ngầm." },
    { id: 24, name: "The Heart", meaning: "Tình yêu, cảm xúc, đam mê, sự lãng mạn, lòng trắc ẩn." },
    { id: 25, name: "The Ring", meaning: "Cam kết, hợp đồng, hôn nhân, mối quan hệ tuần hoàn, vòng lặp." },
    { id: 26, name: "The Book", meaning: "Bí mật, kiến thức, học vấn, thông tin chưa được tiết lộ." },
    { id: 27, name: "The Letter", meaning: "Thư từ, tài liệu viết tay, tin nhắn văn bản, thông báo chính thức." },
    { id: 28, name: "The Man", meaning: "Nam giới, người hỏi (nếu là nam), người đàn ông quan trọng." },
    { id: 29, name: "The Woman", meaning: "Nữ giới, người hỏi (nếu là nữ), người phụ nữ quan trọng." },
    { id: 30, name: "The Lily", meaning: "Sự bình yên, sự trưởng thành, thâm niên, tình dục, sự thuần khiết." },
    { id: 31, name: "The Sun", meaning: "Thành công, năng lượng, sự rõ ràng, niềm vui lớn, sự ấm áp." },
    { id: 32, name: "The Moon", meaning: "Danh tiếng, trực giác, cảm xúc sâu sắc, tiềm thức, sự công nhận." },
    { id: 33, name: "The Key", meaning: "Chìa khóa, giải pháp, sự chắc chắn, mở ra cơ hội quan trọng." },
    { id: 34, name: "The Fish", meaning: "Tài lộc, dòng tiền, kinh doanh, sự giàu có, sự dồi dào." },
    { id: 35, name: "The Anchor", meaning: "Sự bền vững, mục tiêu lâu dài, sự an toàn, bến đỗ, công việc ổn định." },
    { id: 36, name: "The Cross", meaning: "Gánh nặng, định mệnh, thử thách, đau khổ, niềm tin tôn giáo." }
];

const positions = [
    "Quá khứ / Gốc rễ",
    "Hiện tại / Tình hình",
    "Tương lai gần",
    "Rào cản / Thách thức",
    "Kết quả / Lời khuyên"
];

let currentDraw = {
    question: "",
    cards: []
};

let isFlipped = false; // Theo dõi trạng thái lật bài

// Hàm khởi tạo 5 khung bài úp khi tải trang
function initCards() {
    const container = document.getElementById("cards-container");
    container.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        container.innerHTML += `
            <div class="card-perspective">
                <div class="card-inner" id="card-inner-${i}">
                    <!-- MẶT SAU (ÚP) -->
                    <div class="card-back">
                        <div class="card-back-pattern">🔮</div>
                    </div>
                    <!-- MẶT TRƯỚC (NGỬA) -->
                    <div class="card-front" id="card-front-${i}">
                        <!-- Dữ liệu bài lật sẽ được nạp vào đây -->
                    </div>
                </div>
            </div>
        `;
    }
}

// Xử lý sự kiện khi click nút chính
function handleButtonClick() {
    const actionBtn = document.getElementById("action-btn");

    if (!isFlipped) {
        // Trạng thái: Đang úp -> Thực hiện BỐC BÀI
        drawFiveCards();
        isFlipped = true;
        actionBtn.innerText = "Bốc lại";
        actionBtn.style.background = "#e53935"; // Chuyển nút sang màu đỏ để báo hiệu reset
    } else {
        // Trạng thái: Đang ngửa -> Thực hiện ÚP BÀI (RESET)
        resetCards();
        isFlipped = false;
        actionBtn.innerText = "Bốc bài";
        actionBtn.style.background = "#8e24aa"; // Trở lại màu tím
    }
}

// Thực hiện bốc 5 lá bài ngẫu nhiên
function drawFiveCards() {
    const questionInput = document.getElementById("user-question").value.trim();
    currentDraw.question = questionInput || "Không có câu hỏi cụ thể";

    let tempDeck = [...lenormandDeck];
    currentDraw.cards = [];

    // Chọn ngẫu nhiên 5 lá không trùng nhau
    for (let i = 0; i < 5; i++) {
        if (tempDeck.length === 0) break;
        const randomIndex = Math.floor(Math.random() * tempDeck.length);
        const card = tempDeck.splice(randomIndex, 1)[0];
        currentDraw.cards.push(card);
    }

    // Đổ dữ liệu vào mặt trước của các lá bài rồi kích hoạt xoay lật 180 độ
    currentDraw.cards.forEach((card, index) => {
        const frontDiv = document.getElementById(`card-front-${index}`);
        // Đoạn gán HTML mặt trước trong hàm drawFiveCards() của script.js:
        frontDiv.innerHTML = `
    <div class="position-label">${index + 1}. ${positions[index]}</div>
    <div class="card-num">Lá #${card.id}</div> <!-- Class card-num sẽ bị ẩn trên mobile -->
    <div class="card-name">${card.name}</div>
    <p class="card-meaning"><strong>Ý nghĩa:</strong> ${card.meaning}</p> <!-- Class card-meaning sẽ bị ẩn trên mobile -->
`;

        // Lật bài tuần tự từng lá một tạo hiệu ứng cuốn hút
        setTimeout(() => {
            document.getElementById(`card-inner-${index}`).classList.add("flipped");
        }, index * 150);
    });

    // Hiện nút "Copy kết quả"
    document.getElementById("copy-btn").style.display = "inline-block";
}

// Úp toàn bộ bài về trạng thái cũ
function resetCards() {
    for (let i = 0; i < 5; i++) {
        document.getElementById(`card-inner-${i}`).classList.remove("flipped");
    }

    // Ẩn nút Copy và xóa trắng input câu hỏi cũ
    document.getElementById("copy-btn").style.display = "none";
    document.getElementById("user-question").value = "";
    currentDraw = { question: "", cards: [] };
}

// Copy kết quả vào clipboard
function copyResults() {
    if (currentDraw.cards.length === 0) return;

    let copyText = `Tôi vừa thực hiện trải bài bói Lenormand 5 lá.\n`;
    copyText += `Câu hỏi của tôi: "${currentDraw.question}"\n\n`;
    copyText += `Các lá bài bốc được theo thứ tự:\n`;

    currentDraw.cards.forEach((card, index) => {
        copyText += `${index + 1}. Vị trí [${positions[index]}]: Lá #${card.id} ${card.name} (Ý nghĩa: ${card.meaning})\n`;
    });

    copyText += `\nHãy giải nghĩa chi tiết trải bài này dựa trên câu hỏi của tôi.`;

    navigator.clipboard.writeText(copyText)
        .then(() => {
            const copyBtn = document.getElementById("copy-btn");
            const originalText = copyBtn.innerText;

            copyBtn.innerText = "Đã copy thành công! ✓";
            copyBtn.style.background = "#2e7d32";

            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.style.background = "#0288d1";
            }, 2000);
        })
        .catch(err => {
            alert("Không thể tự động sao chép!");
        });
}

document.getElementById('btn-interpret').addEventListener('click', async () => {          
    // 1. Thu thập câu hỏi
    const questionInput = document.getElementById('user-question') || document.querySelector('input[type="text"]');     
    const questionText = questionInput ? questionInput.value.trim() : "";          
    
    if (!questionText) {         
        alert("Vui lòng nhập câu hỏi trước khi yêu cầu luận giải trải bài!");         
        return;     
    }     

    // SỬA ĐỔI: Lấy trực tiếp mảng bài thực tế mà hàm drawFiveCards() của bạn đã tạo ra
    const finalCards = currentDraw.cards; 

    if (!finalCards || finalCards.length === 0) {         
        alert("Vui lòng ấn nút Bốc bài để chọn đủ các lá bài trên trải bài trước!");         
        return;     
    }     

    // Gán dữ liệu map với vị trí tương ứng để AI hiểu vị trí của lá bài đó
    const mappedCards = finalCards.map((card, index) => {
        return {
            position: positions[index], // Lấy từ mảng vị trí mẫu ("Quá khứ", "Hiện tại"...) của bạn
            card_name: card.name,
            original_meaning: card.meaning
        };
    });

    // Đóng gói dữ liệu gửi lên Backend     
    const spreadData = {         
        question: questionText,         
        spread_type: "Trải bài 5 lá theo dòng thời gian",          
        cards: mappedCards     
    };     

    // 3. Gọi hàm giải bài
    await handleInterpret(spreadData);  
});

/**
 * Hàm gọi API Backend để lấy lời giải nghĩa từ AI và render lên giao diện
 * @param {Object} spreadData - Đối tượng dữ liệu trải bài thực tế
 */
async function handleInterpret(spreadData) {
    // Khai báo và lấy các phần tử giao diện hiển thị kết quả
    const section = document.getElementById('interpretation-section');
    const loading = document.getElementById('loading-ai');
    const content = document.getElementById('interpretation-content');

    // Kích hoạt trạng thái chờ trên UI
    if (section) section.style.display = 'block';
    if (loading) loading.style.display = 'block';
    if (content) content.innerHTML = ''; // Xóa sạch kết quả cũ

    try {
        // Gửi request lên endpoint Backend
        const response = await fetch('/api/interpret', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: spreadData })
        });
        
        const result = await response.json();
        
        // Tắt trạng thái chờ loading
        if (loading) loading.style.display = 'none';

        if (result.success) {
            // Sử dụng thư viện marked dịch chuỗi Markdown từ Groq API thành HTML
            if (content) {
                content.innerHTML = marked.parse(result.output_text);
            }
        } else {
            if (content) {
                content.innerHTML = `<p style="color: red; font-weight: bold;">Thất bại: ${result.error}</p>`;
            }
        }
    } catch (error) {
        // Xử lý khi không kết nối được server hoặc server sập
        if (loading) loading.style.display = 'none';
        if (content) {
            content.innerHTML = `<p style="color: red; font-weight: bold;">Lỗi kết nối đến Server hệ thống. Vui lòng kiểm tra lại!</p>`;
        }
        console.error("Lỗi kết nối server:", error);
    }
}

// Khởi chạy sinh bài sau khi toàn bộ tài nguyên web được tải xong
window.onload = initCards;