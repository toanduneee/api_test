// Danh sách 36 lá bài Lenormand đầy đủ (giữ nguyên `name` gốc để tương thích API AI)
const lenormandDeck = [
    { id: 1, icon: "🏇", name: "The Rider", viName: "Kỵ Sĩ", meaning: "Tin tức, thông điệp, sự di chuyển nhanh chóng, người mới đến." },
    { id: 2, icon: "🍀", name: "The Clover", viName: "Cỏ Bốn Lá", meaning: "May mắn nhỏ, cơ hội bất ngờ, niềm vui ngắn hạn, hy vọng." },
    { id: 3, icon: "⛵", name: "The Ship", viName: "Con Tàu", meaning: "Chuyến đi, sự dịch chuyển, khoảng cách, khát vọng, kinh doanh." },
    { id: 4, icon: "🏛️", name: "The House", viName: "Ngôi Nhà", meaning: "Gia đình, sự an toàn, sự ổn định, nơi ở hiện tại, sự ấm cúng." },
    { id: 5, icon: "🌳", name: "The Tree", viName: "Cây Cổ Thụ", meaning: "Sức khỏe, sự phát triển lâu dài, kết nối tâm linh, nguồn cội." },
    { id: 6, icon: "☁️", name: "The Clouds", viName: "Đám Mây", meaning: "Sự mập mờ, bối rối, rắc rối tạm thời, nghi ngờ." },
    { id: 7, icon: "🐍", name: "The Snake", viName: "Con Rắn", meaning: "Sự phản bội, lừa dối, sự ghen tị, đường vòng, sự phức tạp." },
    { id: 8, icon: "⚱️", name: "The Coffin", viName: "Quan Tài", meaning: "Sự kết thúc, mất mát, thay đổi lớn, sự chuyển giao." },
    { id: 9, icon: "💐", name: "The Flowers", viName: "Bó Hoa", meaning: "Món quà, niềm vui, sự công nhận, tình bạn, hạnh phúc ngọt ngào." },
    { id: 10, icon: "🗡️", name: "The Scythe", viName: "Lưỡi Hái", meaning: "Sự cắt đứt đột ngột, nguy hiểm, quyết định nhanh chóng, thu hoạch." },
    { id: 11, icon: "⚡", name: "The Whip", viName: "Cây Roi", meaning: "Xung đột, tranh cãi, sự lặp đi lặp lại, áp lực, thử thách." },
    { id: 12, icon: "🕊️", name: "The Birds", viName: "Đôi Chim", meaning: "Cuộc trò chuyện, tin đồn, lo lắng nhẹ, cặp đôi, giao tiếp." },
    { id: 13, icon: "🌱", name: "The Child", viName: "Đứa Trẻ", meaning: "Sự khởi đầu mới, sự ngây thơ, nhỏ bé, tò mò và thuần khiết." },
    { id: 14, icon: "🦊", name: "The Fox", viName: "Con Cáo", meaning: "Sự khôn ngoan, công việc, sự cảnh giác, khéo léo để sinh tồn." },
    { id: 15, icon: "🐻", name: "The Bear", viName: "Con Gấu", meaning: "Sức mạnh, quyền lực, tài chính, sự bảo vệ, người có vị thế." },
    { id: 16, icon: "✨", name: "The Stars", viName: "Những Vì Sao", meaning: "Hy vọng, ước mơ, cảm hứng, định hướng, thành công tương lai." },
    { id: 17, icon: "🦢", name: "The Stork", viName: "Chim Hạc", meaning: "Sự thay đổi, cải tiến, chuyển dịch, chu kỳ mới tích cực." },
    { id: 18, icon: "🐕", name: "The Dog", viName: "Chú Chó", meaning: "Tình bạn, sự trung thành, lòng tin, người hỗ trợ đắc lực." },
    { id: 19, icon: "🏰", name: "The Tower", viName: "Tòa Tháp", meaning: "Cơ quan tổ chức, sự cô lập, ranh giới, tham vọng, độc lập." },
    { id: 20, icon: "🌿", name: "The Garden", viName: "Khu Vườn", meaning: "Cộng đồng, sự kiện công chúng, mạng xã hội, nơi đông người." },
    { id: 21, icon: "⛰️", name: "The Mountain", viName: "Ngọn Núi", meaning: "Trở ngại, sự trì hoãn, thách thức lớn, sự bế tắc." },
    { id: 22, icon: "🧭", name: "The Crossroads", viName: "Ngã Rẽ", meaning: "Lựa chọn, quyết định, ngã rẽ cuộc đời, nhiều hướng đi." },
    { id: 23, icon: "🐁", name: "The Mice", viName: "Đàn Chuột", meaning: "Sự hao mòn, mất mát nhỏ, căng thẳng, lo lắng ngầm." },
    { id: 24, icon: "❤️‍🔥", name: "The Heart", viName: "Trái Tim", meaning: "Tình yêu, cảm xúc, đam mê, sự lãng mạn, lòng trắc ẩn." },
    { id: 25, icon: "💍", name: "The Ring", viName: "Chiếc Nhẫn", meaning: "Cam kết, hợp đồng, hôn nhân, mối quan hệ gắn bó bền chặt." },
    { id: 26, icon: "📖", name: "The Book", viName: "Cuốn Sách", meaning: "Bí mật, kiến thức, học vấn, thông tin chưa được tiết lộ." },
    { id: 27, icon: "✉️", name: "The Letter", viName: "Bức Thư", meaning: "Thư từ, tài liệu, tin nhắn văn bản, thông báo chính thức." },
    { id: 28, icon: "🤴", name: "The Man", viName: "Người Đàn Ông", meaning: "Nam giới, người hỏi (nếu là nam), người đàn ông quan trọng." },
    { id: 29, icon: "👸", name: "The Woman", viName: "Người Phụ Nữ", meaning: "Nữ giới, người hỏi (nếu là nữ), người phụ nữ quan trọng." },
    { id: 30, icon: "⚜️", name: "The Lily", viName: "Hoa Bách Hợp", meaning: "Sự bình yên, trưởng thành, thâm niên, sự thuần khiết." },
    { id: 31, icon: "☀️", name: "The Sun", viName: "Mặt Trời", meaning: "Thành công, năng lượng, sự rõ ràng, niềm vui lớn, ấm áp." },
    { id: 32, icon: "🌙", name: "The Moon", viName: "Mặt Trăng", meaning: "Danh tiếng, trực giác, cảm xúc sâu sắc, tiềm thức, công nhận." },
    { id: 33, icon: "🗝️", name: "The Key", viName: "Chìa Khóa", meaning: "Giải pháp, sự chắc chắn, mở ra cơ hội và bước ngoặt quan trọng." },
    { id: 34, icon: "🐟", name: "The Fish", viName: "Đàn Cá", meaning: "Tài lộc, dòng tiền, kinh doanh, sự giàu có và dồi dào." },
    { id: 35, icon: "⚓", name: "The Anchor", viName: "Mỏ Neo", meaning: "Sự bền vững, mục tiêu lâu dài, an toàn, công việc ổn định." },
    { id: 36, icon: "✝️", name: "The Cross", viName: "Thánh Giá", meaning: "Gánh nặng, định mệnh, thử thách sâu sắc, bài học tinh thần." }
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

let isFlipped = false;
let isInterpreting = false;
let toastTimer = null;

// Hoa văn SVG mặt sau lá bài
const cardBackSVG = `
<svg class="card-back-sigil" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 3"/>
    <circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="1.2"/>
    <path d="M50 8 L57 43 L92 50 L57 57 L50 92 L43 57 L8 50 L43 43 Z" stroke="currentColor" stroke-width="1.5" fill="rgba(229,193,113,0.12)"/>
    <circle cx="50" cy="50" r="5" fill="currentColor"/>
</svg>
`;

// Hiện thông báo Toast thay cho alert()
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Điền nhanh câu hỏi gợi ý
function setQuestion(text) {
    const input = document.getElementById("user-question");
    if (!input) return;
    input.value = text;
    input.focus();
}

// Khởi tạo 5 khung lá bài úp khi tải trang
function initCards() {
    const container = document.getElementById("cards-container");
    container.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        container.innerHTML += `
            <div class="card-perspective" onclick="handleCardClick()">
                <div class="card-inner" id="card-inner-${i}">
                    <div class="card-back">
                        <div class="card-back-pattern">
                            ${cardBackSVG}
                            <div class="card-back-pos">${i + 1}. ${positions[i]}</div>
                        </div>
                    </div>
                    <div class="card-front" id="card-front-${i}"></div>
                </div>
            </div>
        `;
    }
}

// Bấm trực tiếp vào lá bài úp để bốc bài
function handleCardClick() {
    if (!isFlipped) {
        handleButtonClick();
    }
}

// Xử lý nút chính (Bốc bài / Bốc lại)
function handleButtonClick() {
    if (isInterpreting) return;

    const actionBtn = document.getElementById("action-btn");

    if (!isFlipped) {
        drawFiveCards();
        isFlipped = true;
        actionBtn.innerHTML = `<span class="btn-icon">↻</span> Bốc lại`;
        actionBtn.classList.add("is-reset");
    } else {
        resetCards();
        isFlipped = false;
        actionBtn.innerHTML = `<span class="btn-icon">✨</span> Bốc 5 Lá Bài`;
        actionBtn.classList.remove("is-reset");
    }
}

// Bốc ngẫu nhiên 5 lá không trùng nhau
function drawFiveCards() {
    const questionInput = document.getElementById("user-question").value.trim();
    currentDraw.question = questionInput || "Không có câu hỏi cụ thể";

    const tempDeck = [...lenormandDeck];
    currentDraw.cards = [];

    for (let i = 0; i < 5; i++) {
        if (tempDeck.length === 0) break;
        const randomIndex = Math.floor(Math.random() * tempDeck.length);
        const card = tempDeck.splice(randomIndex, 1)[0];
        currentDraw.cards.push(card);
    }

    currentDraw.cards.forEach((card, index) => {
        const frontDiv = document.getElementById(`card-front-${index}`);
        frontDiv.innerHTML = `
            <div class="card-top-meta">
                <div class="position-label">${index + 1}. ${positions[index]}</div>
                <div class="card-num">LÁ SỐ ${String(card.id).padStart(2, '0')}</div>
            </div>
            <div class="card-center">
                <div class="card-symbol">${card.icon}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-vi-name">${card.viName}</div>
                <div class="card-divider"></div>
            </div>
            <p class="card-meaning">${card.meaning}</p>
        `;

        setTimeout(() => {
            document.getElementById(`card-inner-${index}`).classList.add("flipped");
        }, index * 160);
    });

    // Hiển thị các nút hành động sau khi bốc
    document.getElementById("btn-interpret").style.display = "inline-flex";
    document.getElementById("copy-btn").style.display = "inline-flex";
}

// Úp toàn bộ bài và dọn giao diện
function resetCards() {
    for (let i = 0; i < 5; i++) {
        const el = document.getElementById(`card-inner-${i}`);
        if (el) el.classList.remove("flipped");
    }

    document.getElementById("copy-btn").style.display = "none";
    document.getElementById("btn-interpret").style.display = "none";

    // Ẩn khu vực kết quả AI cũ
    const section = document.getElementById("interpretation-section");
    const content = document.getElementById("interpretation-content");
    if (section) section.style.display = "none";
    if (content) content.innerHTML = "";

    document.getElementById("user-question").value = "";
    currentDraw = { question: "", cards: [] };
}

// Copy kết quả vào clipboard
function copyResults() {
    if (currentDraw.cards.length === 0) return;

    const latestQuestion = document.getElementById("user-question").value.trim() || currentDraw.question;

    let copyText = `Tôi vừa thực hiện trải bài bói Lenormand 5 lá.\n`;
    copyText += `Câu hỏi của tôi: "${latestQuestion}"\n\n`;
    copyText += `Các lá bài bốc được theo thứ tự:\n`;

    currentDraw.cards.forEach((card, index) => {
        copyText += `${index + 1}. Vị trí [${positions[index]}]: Lá #${card.id} ${card.name} (${card.viName}) - Ý nghĩa: ${card.meaning}\n`;
    });

    copyText += `\nHãy giải nghĩa chi tiết trải bài này dựa trên câu hỏi của tôi.`;

    navigator.clipboard.writeText(copyText)
        .then(() => {
            const copyBtn = document.getElementById("copy-btn");
            copyBtn.innerHTML = `<span class="btn-icon">✓</span> Đã sao chép!`;
            copyBtn.classList.add("copied");
            showToast("✦ Đã copy kết quả trải bài vào bộ nhớ tạm!");

            setTimeout(() => {
                copyBtn.innerHTML = `<span class="btn-icon">📋</span> Copy kết quả`;
                copyBtn.classList.remove("copied");
            }, 2200);
        })
        .catch(() => {
            showToast("⚠️ Trình duyệt không hỗ trợ tự động sao chép.");
        });
}

// Xử lý bấm nút Giải Nghĩa Trải Bài (AI)
document.getElementById("btn-interpret").addEventListener("click", async () => {
    if (isInterpreting) return;

    const questionInput = document.getElementById("user-question");
    const questionText = questionInput ? questionInput.value.trim() : "";

    if (!questionText) {
        showToast("✦ Vui lòng nhập câu hỏi của bạn trước khi nhờ AI luận giải!");
        if (questionInput) questionInput.focus();
        return;
    }

    const finalCards = currentDraw.cards;
    if (!finalCards || finalCards.length === 0) {
        showToast("✦ Vui lòng bốc đủ 5 lá bài trước nhé!");
        return;
    }

    const mappedCards = finalCards.map((card, index) => ({
        position: positions[index],
        card_name: card.name,
        original_meaning: card.meaning
    }));

    const spreadData = {
        question: questionText,
        spread_type: "Trải bài 5 lá theo dòng thời gian",
        cards: mappedCards
    };

    await handleInterpret(spreadData);
});

// Gọi API Backend lấy lời giải từ AI
async function handleInterpret(spreadData) {
    const section = document.getElementById("interpretation-section");
    const loading = document.getElementById("loading-ai");
    const content = document.getElementById("interpretation-content");
    const interpretBtn = document.getElementById("btn-interpret");

    isInterpreting = true;
    if (interpretBtn) {
        interpretBtn.disabled = true;
        interpretBtn.innerHTML = `<span class="btn-icon">⏳</span> Đang luận giải...`;
    }

    if (section) section.style.display = "block";
    if (loading) loading.style.display = "block";
    if (content) content.innerHTML = "";

    if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
        const response = await fetch("/api/interpret", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: spreadData })
        });

        const result = await response.json();

        if (loading) loading.style.display = "none";

        if (result.success) {
            if (content) {
                content.innerHTML = marked.parse(result.output_text);
            }
        } else {
            if (content) {
                content.innerHTML = `<div class="error-msg">Thất bại: ${result.error || "Không thể giải nghĩa lúc này."}</div>`;
            }
        }
    } catch (error) {
        if (loading) loading.style.display = "none";
        if (content) {
            content.innerHTML = `<div class="error-msg">Lỗi kết nối đến máy chủ. Vui lòng thử lại sau ít phút!</div>`;
        }
        console.error("Lỗi kết nối server:", error);
    } finally {
        isInterpreting = false;
        if (interpretBtn) {
            interpretBtn.disabled = false;
            interpretBtn.innerHTML = `<span class="btn-icon">🔮</span> Giải Nghĩa Bằng AI`;
        }
    }
}

// Nhấn Enter trong ô câu hỏi để bốc bài nhanh
document.getElementById("user-question").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !isFlipped) {
        e.preventDefault();
        handleButtonClick();
    }
});

// Khởi chạy sinh 5 lá úp khi tải trang
window.addEventListener("DOMContentLoaded", initCards);