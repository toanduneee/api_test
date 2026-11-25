const STORAGE_KEY = "my_vocab_scramble_toeic_v1";
const TOEIC_CSV_PATH = "toeic_600_words.csv";

const DEFAULT_VOCAB = [
  { word: "basis", meaning: "Nền tảng, cơ sở, căn cứ", topic: "Salaries & Benefits" },
  { word: "benefit", meaning: "Lợi ích", topic: "Salaries & Benefits" },
  { word: "compensate", meaning: "Bù, đền bù, bồi thường", topic: "Salaries & Benefits" },
  { word: "negotiate", meaning: "Thương lượng, đàm phán, điều đình", topic: "Salaries & Benefits" },
  { word: "retire", meaning: "Nghỉ hưu", topic: "Salaries & Benefits" },
  { word: "contract", meaning: "Hợp đồng", topic: "Contracts" },
  { word: "schedule", meaning: "Lịch trình; thời khóa biểu", topic: "Office Procedures" },
  { word: "strategy", meaning: "Chiến lược", topic: "Business Planning" }
];

let vocabData = [];

function loadSavedCustomVocab() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveVocabData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabData));
  } catch (err) {
    console.warn("Bộ nhớ trình duyệt đầy, chỉ giữ trong phiên hiện tại.", err);
  }
}

function clearSavedVocabOverride() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// Trạng thái game
let sessionWords = [];
let currentIndex = 0;
let selfSolvedCount = 0;
let currentWordObj = null;
let currentWordMeta = { upperWord: "", separatorsAfter: {}, wordPartsCount: 1 };
let tiles = [];
let slots = [];
let hintedSlots = [];
let activeSlot = 0;
let hintsLeft = 2;
let usedHintThisWord = false;
let isSolved = false;

// DOM Elements
const progressFill = document.getElementById("progressFill");
const currentNumEl = document.getElementById("currentNum");
const totalNumEl = document.getElementById("totalNum");
const selfSolvedNumEl = document.getElementById("selfSolvedNum");
const levelBadge = document.getElementById("levelBadge");
const topicBadge = document.getElementById("topicBadge");
const meaningText = document.getElementById("meaningText");
const subMeaning = document.getElementById("subMeaning");
const slotsContainer = document.getElementById("slotsContainer");
const slotsHint = document.getElementById("slotsHint");
const tilesContainer = document.getElementById("tilesContainer");
const hintsLeftEl = document.getElementById("hintsLeft");
const hintBtn = document.getElementById("hintBtn");
const deleteBtn = document.getElementById("deleteBtn");
const clearBtn = document.getElementById("clearBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const audioBtn = document.getElementById("audioBtn");
const feedbackBar = document.getElementById("feedbackBar");
const feedbackText = document.getElementById("feedbackText");
const nextBtn = document.getElementById("nextBtn");
const modeSelect = document.getElementById("modeSelect");
const gameArea = document.getElementById("gameArea");
const summaryCard = document.getElementById("summaryCard");
const importStatus = document.getElementById("importStatus");
const modalTopicFilter = document.getElementById("modalTopicFilter");
const topicDatalist = document.getElementById("topicDatalist");

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function speakWord(word) {
  if (!("speechSynthesis" in window) || !word) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "en-US";
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

function buildWordMeta(rawWord) {
  const clean = String(rawWord || "").trim().replace(/\s+/g, " ");
  let upperWord = "";
  const separatorsAfter = {};

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (/[a-zA-Z]/.test(ch)) {
      upperWord += ch.toUpperCase();
    } else if ((ch === " " || ch === "-") && upperWord.length > 0) {
      separatorsAfter[upperWord.length - 1] = ch;
    }
  }

  const wordPartsCount = clean ? clean.split(/\s+/).length : 1;
  return { upperWord, separatorsAfter, wordPartsCount };
}

function getTopicCounts() {
  const counts = new Map();
  for (const item of vocabData) {
    const topic = (item.topic || "Chung").trim() || "Chung";
    counts.set(topic, (counts.get(topic) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function populateTopicControls() {
  const topics = getTopicCounts();
  const prevMode = modeSelect.value;
  const prevModalFilter = modalTopicFilter.value;

  modeSelect.innerHTML = "";

  const baseOptions = [
    { value: "all-20", label: "Tất cả chủ đề · 20 câu" },
    { value: "all-10", label: "Luyện nhanh · 10 câu" },
    { value: "all-all", label: `Tất cả chủ đề · ${vocabData.length.toLocaleString()} từ` }
  ];

  baseOptions.forEach(opt => {
    const el = document.createElement("option");
    el.value = opt.value;
    el.textContent = opt.label;
    modeSelect.appendChild(el);
  });

  if (topics.length > 0) {
    const group = document.createElement("optgroup");
    group.label = `Phân loại theo Topic (${topics.length})`;
    topics.forEach(([topic, count]) => {
      const el = document.createElement("option");
      el.value = `topic:${topic}`;
      el.textContent = `${topic} (${count} từ)`;
      group.appendChild(el);
    });
    modeSelect.appendChild(group);
  }

  const hasPrevMode = [...modeSelect.options].some(o => o.value === prevMode);
  modeSelect.value = hasPrevMode ? prevMode : "all-20";

  // Populate modal topic filter & datalist
  modalTopicFilter.innerHTML = `<option value="">Tất cả chủ đề (${vocabData.length.toLocaleString()})</option>`;
  topicDatalist.innerHTML = "";
  topics.forEach(([topic, count]) => {
    const opt = document.createElement("option");
    opt.value = topic;
    opt.textContent = `${topic} (${count})`;
    modalTopicFilter.appendChild(opt);

    const dataOpt = document.createElement("option");
    dataOpt.value = topic;
    topicDatalist.appendChild(dataOpt);
  });

  const hasPrevFilter = [...modalTopicFilter.options].some(o => o.value === prevModalFilter);
  modalTopicFilter.value = hasPrevFilter ? prevModalFilter : "";
}

function startSession() {
  if (vocabData.length === 0) return;

  const mode = modeSelect.value;
  let filtered = [];

  if (mode.startsWith("topic:")) {
    const targetTopic = mode.slice(6);
    filtered = vocabData.filter(item => (item.topic || "Chung") === targetTopic);
    sessionWords = shuffleArray(filtered.length > 0 ? filtered : vocabData);
  } else {
    const [, countStr] = mode.split("-");
    const maxCount = countStr === "all" ? vocabData.length : parseInt(countStr, 10) || 20;
    const shuffled = shuffleArray(vocabData);
    sessionWords = shuffled.slice(0, Math.min(maxCount, shuffled.length));
  }

  currentIndex = 0;
  selfSolvedCount = 0;
  gameArea.style.display = "block";
  summaryCard.classList.remove("show");
  loadWord();
}

function loadWord() {
  currentWordObj = sessionWords[currentIndex];
  currentWordMeta = buildWordMeta(currentWordObj.word);
  const { upperWord } = currentWordMeta;

  isSolved = false;
  hintsLeft = 2;
  usedHintThisWord = false;
  activeSlot = 0;

  slots = new Array(upperWord.length).fill(null);
  hintedSlots = new Array(upperWord.length).fill(false);

  const letters = upperWord.split("").map((char, idx) => ({ id: idx, char }));
  const shuffled = shuffleArray(letters);
  if (shuffled.map(t => t.char).join("") === upperWord && upperWord.length > 1) {
    shuffled.reverse();
  }
  tiles = shuffled;

  currentNumEl.textContent = currentIndex + 1;
  totalNumEl.textContent = sessionWords.length;
  selfSolvedNumEl.textContent = selfSolvedCount;

  if (currentWordObj.level) {
    levelBadge.style.display = "inline-block";
    levelBadge.textContent = currentWordObj.level;
    levelBadge.className = "level-badge " + currentWordObj.level;
  } else {
    levelBadge.style.display = "none";
  }

  topicBadge.textContent = currentWordObj.topic || "Chung";
  meaningText.textContent = currentWordObj.meaning;
  subMeaning.textContent = currentWordObj.enDef ? `(${currentWordObj.enDef})` : "";
  feedbackBar.classList.remove("show");

  progressFill.style.width = `${(currentIndex / sessionWords.length) * 100}%`;
  renderBoard();
}

function renderBoard() {
  const { upperWord, separatorsAfter, wordPartsCount } = currentWordMeta;
  const filledCount = slots.filter(id => id !== null).length;

  slotsContainer.innerHTML = "";
  slots.forEach((tileId, index) => {
    const slotEl = document.createElement("div");
    slotEl.className = "slot";
    if (index === activeSlot && !isSolved) slotEl.classList.add("active");
    if (tileId === null) {
      slotEl.classList.add("empty");
    } else {
      const tile = tiles.find(t => t.id === tileId);
      slotEl.textContent = tile.char;
      slotEl.classList.add("filled");
      if (hintedSlots[index]) slotEl.classList.add("hinted");
    }
    if (isSolved) slotEl.classList.add("correct");

    slotEl.addEventListener("click", () => {
      if (isSolved) return;
      if (slots[index] !== null) {
        slots[index] = null;
        hintedSlots[index] = false;
      }
      activeSlot = index;
      renderBoard();
    });

    slotsContainer.appendChild(slotEl);

    const sep = separatorsAfter[index];
    if (sep && index < slots.length - 1) {
      const sepEl = document.createElement("span");
      sepEl.className = sep === "-" ? "slot-sep hyphen" : "slot-sep space";
      if (sep === "-") sepEl.textContent = "-";
      slotsContainer.appendChild(sepEl);
    }
  });

  const partsInfo = wordPartsCount > 1 ? ` (${wordPartsCount} từ)` : "";
  slotsHint.textContent = `${filledCount} / ${upperWord.length} ký tự${partsInfo} · Chạm ô đã điền để trả lại`;

  tilesContainer.innerHTML = "";
  tiles.forEach(tile => {
    const isUsed = slots.includes(tile.id);
    const tileEl = document.createElement("button");
    tileEl.className = "tile" + (isUsed ? " used" : "");
    tileEl.textContent = tile.char;
    tileEl.addEventListener("click", () => placeTile(tile.id));
    tilesContainer.appendChild(tileEl);
  });

  hintsLeftEl.textContent = hintsLeft;
  hintBtn.disabled = hintsLeft <= 0 || isSolved;
  deleteBtn.disabled = filledCount === 0 || isSolved;
  clearBtn.disabled = filledCount === 0 || isSolved;
  shuffleBtn.disabled = isSolved;
}

function moveToNextEmptySlot(fromIndex) {
  for (let i = fromIndex + 1; i < slots.length; i++) {
    if (slots[i] === null) return i;
  }
  for (let i = 0; i < fromIndex; i++) {
    if (slots[i] === null) return i;
  }
  return Math.min(fromIndex + 1, slots.length - 1);
}

function placeTile(tileId) {
  if (isSolved || slots.includes(tileId)) return;
  slots[activeSlot] = tileId;
  hintedSlots[activeSlot] = false;
  activeSlot = moveToNextEmptySlot(activeSlot);
  renderBoard();
  checkAnswer();
}

function checkAnswer() {
  if (slots.includes(null)) return;

  const { upperWord } = currentWordMeta;
  const userAnswer = slots.map(id => tiles.find(t => t.id === id).char).join("");

  if (userAnswer === upperWord) {
    isSolved = true;
    if (!usedHintThisWord) {
      selfSolvedCount++;
      selfSolvedNumEl.textContent = selfSolvedCount;
    }
    progressFill.style.width = `${((currentIndex + 1) / sessionWords.length) * 100}%`;
    renderBoard();
    feedbackText.textContent = `Chính xác! "${currentWordObj.word}"`;
    nextBtn.textContent = currentIndex === sessionWords.length - 1 ? "Xem kết quả →" : "Câu tiếp theo →";
    feedbackBar.classList.add("show");
    speakWord(currentWordObj.word);
  } else {
    slotsContainer.classList.add("shake");
    const slotEls = slotsContainer.querySelectorAll(".slot");
    slotEls.forEach(el => el.classList.add("wrong"));
    setTimeout(() => {
      slotsContainer.classList.remove("shake");
      slotEls.forEach(el => el.classList.remove("wrong"));
    }, 450);
  }
}

function useHint() {
  if (hintsLeft <= 0 || isSolved) return;
  const { upperWord } = currentWordMeta;

  let targetIdx = activeSlot;
  const currentChar = slots[targetIdx] !== null ? tiles.find(t => t.id === slots[targetIdx]).char : null;
  if (currentChar === upperWord[targetIdx]) {
    targetIdx = slots.findIndex((id, idx) => {
      const ch = id !== null ? tiles.find(t => t.id === id).char : null;
      return ch !== upperWord[idx];
    });
  }
  if (targetIdx === -1) return;

  const neededChar = upperWord[targetIdx];
  slots[targetIdx] = null;

  let matchingTile = tiles.find(t => t.char === neededChar && !slots.includes(t.id));
  if (!matchingTile) {
    const wrongSlotIdx = slots.findIndex((id, idx) => {
      if (id === null) return false;
      const t = tiles.find(tile => tile.id === id);
      return t.char === neededChar && upperWord[idx] !== neededChar;
    });
    if (wrongSlotIdx !== -1) {
      const tileId = slots[wrongSlotIdx];
      slots[wrongSlotIdx] = null;
      matchingTile = tiles.find(t => t.id === tileId);
    }
  }

  if (matchingTile) {
    slots[targetIdx] = matchingTile.id;
    hintedSlots[targetIdx] = true;
    hintsLeft--;
    usedHintThisWord = true;
    activeSlot = moveToNextEmptySlot(targetIdx);
    renderBoard();
    checkAnswer();
  }
}

function deleteOne() {
  if (isSolved) return;
  if (slots[activeSlot] !== null) {
    slots[activeSlot] = null;
    hintedSlots[activeSlot] = false;
  } else {
    for (let i = activeSlot - 1; i >= 0; i--) {
      if (slots[i] !== null) {
        slots[i] = null;
        hintedSlots[i] = false;
        activeSlot = i;
        break;
      }
    }
  }
  renderBoard();
}

function clearAll() {
  if (isSolved) return;
  slots.fill(null);
  hintedSlots.fill(false);
  activeSlot = 0;
  renderBoard();
}

function nextQuestion() {
  if (currentIndex < sessionWords.length - 1) {
    currentIndex++;
    loadWord();
  } else {
    gameArea.style.display = "none";
    document.getElementById("sumTotal").textContent = sessionWords.length;
    document.getElementById("sumSelf").textContent = selfSolvedCount;
    summaryCard.classList.add("show");
  }
}

// --- BỘ CHUYỂN ĐỔI & NẠP DỮ LIỆU CSV / JSON ---
function parseCSV(text) {
  const cleanText = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let val = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        val += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        val += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(val);
        val = "";
      } else if (ch === "\r" && next === "\n") {
        row.push(val);
        rows.push(row);
        row = [];
        val = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        row.push(val);
        rows.push(row);
        row = [];
        val = "";
      } else {
        val += ch;
      }
    }
  }

  if (val.length > 0 || row.length > 0) {
    row.push(val);
    rows.push(row);
  }
  return rows;
}

function isValidVocabWord(word) {
  const alphaOnly = word.replace(/[^a-zA-Z]/g, "");
  return /^[a-zA-Z\s-]+$/.test(word) && alphaOnly.length >= 2 && alphaOnly.length <= 24;
}

function parseVocabCSV(text) {
  const rows = parseCSV(text).filter(r => r.some(cell => cell.trim() !== ""));
  if (rows.length === 0) return [];

  const firstRowLower = rows[0].map(h => h.trim().toLowerCase());
  const findCol = (names) => firstRowLower.findIndex(h => names.includes(h));

  const enIdx = findCol(["english", "word", "en", "term"]);
  const viIdx = findCol(["vietnamese", "meaning", "vi", "vn", "nghia"]);
  const topicIdx = findCol(["topic", "category", "chude", "group"]);

  const hasHeader = enIdx !== -1 && viIdx !== -1;
  const startRow = hasHeader ? 1 : 0;
  const colWord = hasHeader ? enIdx : 0;
  const colMeaning = hasHeader ? viIdx : 1;
  const colTopic = hasHeader ? topicIdx : 2;

  const result = [];
  const seen = new Set();

  for (let i = startRow; i < rows.length; i++) {
    const r = rows[i];
    const word = String(r[colWord] || "").trim().replace(/\s+/g, " ").toLowerCase();
    const meaning = String(r[colMeaning] || "").trim();
    const topic = colTopic !== -1 ? String(r[colTopic] || "").trim() : "Chung";

    if (!word || !meaning || !isValidVocabWord(word)) continue;

    const finalTopic = topic || "Chung";
    const key = `${word}|${finalTopic}`;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      word,
      meaning,
      topic: finalTopic
    });
  }

  return result;
}

function mapLevel(rawLevel) {
  if (!rawLevel) return "";
  const m = String(rawLevel).toUpperCase().match(/(A1|A2|B1|B2|C1|C2)/);
  return m ? m[1] : "";
}

function extractViMeaning(item) {
  const directKeys = ["vi", "vn", "vietnamese", "meaning_vi", "mean_vi", "meaning", "nghia"];
  for (const k of directKeys) {
    if (typeof item[k] === "string" && item[k].trim()) return item[k].trim();
  }
  const containers = ["translations", "translation", "langs", "languages", "meanings", "i18n", "tr", "locales"];
  for (const c of containers) {
    const obj = item[c];
    if (obj && typeof obj === "object") {
      for (const k of ["vi", "vn", "vietnamese", "Vietnamese", "vi-VN"]) {
        if (typeof obj[k] === "string" && obj[k].trim()) return obj[k].trim();
        if (obj[k] && typeof obj[k] === "object") {
          const val = obj[k].word || obj[k].mean || obj[k].meaning || obj[k].text || obj[k].translation;
          if (typeof val === "string" && val.trim()) return val.trim();
        }
      }
    }
  }
  return (item.mean || item.definition || item.def || "").trim();
}

function normalizeDataset(rawJson) {
  const list = Array.isArray(rawJson)
    ? rawJson
    : (rawJson.data || rawJson.words || rawJson.entries || rawJson.items || Object.values(rawJson).find(Array.isArray) || []);

  const result = [];
  const seen = new Set();

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const rawWord = String(item.word || item.en || item.english || item.term || "").trim().replace(/\s+/g, " ").toLowerCase();
    if (!isValidVocabWord(rawWord)) continue;

    const meaning = extractViMeaning(item);
    if (!meaning) continue;

    const topic = String(item.topic || item.category || item.level || "Chung").trim() || "Chung";
    const key = `${rawWord}|${topic}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const enDef = (item.mean && item.mean !== meaning) ? String(item.mean).trim() : "";

    result.push({
      word: rawWord,
      meaning,
      enDef,
      topic,
      level: mapLevel(item.level || item.cefr || item.grade)
    });
  }
  return result;
}

async function loadToeicDataset(forceReload = false) {
  if (!forceReload) {
    const saved = loadSavedCustomVocab();
    if (saved) {
      vocabData = saved;
      populateTopicControls();
      renderVocabList();
      startSession();
      return;
    }
  }

  try {
    const res = await fetch(TOEIC_CSV_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    const parsed = parseVocabCSV(csvText);
    if (parsed.length === 0) throw new Error("Không đọc được dữ liệu từ CSV");

    vocabData = parsed;
    if (forceReload) {
      clearSavedVocabOverride();
      importStatus.style.color = "#34d399";
      importStatus.textContent = `✓ Đã tải lại ${vocabData.length.toLocaleString()} từ TOEIC (${getTopicCounts().length} chủ đề)!`;
    }
  } catch (err) {
    console.warn("Không thể tải toeic_600_words.csv tự động, dùng danh sách mẫu:", err);
    vocabData = [...DEFAULT_VOCAB];
    if (forceReload) {
      importStatus.style.color = "#f87171";
      importStatus.textContent = "Không tải được toeic_600_words.csv (hãy chạy qua web server hoặc nhập file CSV thủ công).";
    }
  }

  populateTopicControls();
  renderVocabList();
  startSession();
}

// Tải lại TOEIC CSV
document.getElementById("reloadToeicBtn").addEventListener("click", () => {
  loadToeicDataset(true);
});

// Tải bộ Oxford 3.357 từ từ GitHub
const fetchOxfordBtn = document.getElementById("fetchOxfordBtn");

fetchOxfordBtn.addEventListener("click", async () => {
  fetchOxfordBtn.disabled = true;
  importStatus.style.color = "#60a5fa";
  importStatus.textContent = "Đang tải dữ liệu Oxford 3000 & 5000 từ GitHub...";

  const urls = [
    "https://raw.githubusercontent.com/dnizfor/vocabulary-flashcard-dataset/main/data/data.json",
    "https://cdn.jsdelivr.net/gh/dnizfor/vocabulary-flashcard-dataset@main/data/data.json"
  ];

  let loaded = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const parsed = normalizeDataset(json);
      if (parsed.length > 0) {
        loaded = parsed;
        break;
      }
    } catch (e) {
      console.warn("Thử nguồn tiếp theo...", e);
    }
  }

  fetchOxfordBtn.disabled = false;
  if (loaded) {
    vocabData = loaded;
    saveVocabData();
    populateTopicControls();
    importStatus.style.color = "#34d399";
    importStatus.textContent = `✓ Đã nạp thành công ${vocabData.length.toLocaleString()} từ vựng!`;
    renderVocabList();
    startSession();
  } else {
    importStatus.style.color = "#f87171";
    importStatus.textContent = "Không tải được trực tiếp (kiểm tra mạng).";
  }
});

// Nhập file JSON hoặc CSV từ máy tính
document.getElementById("fileImportInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    let parsed = [];
    try {
      if (file.name.endsWith(".json")) {
        parsed = normalizeDataset(JSON.parse(text));
      } else {
        parsed = parseVocabCSV(text);
      }

      if (parsed.length > 0) {
        vocabData = parsed;
        saveVocabData();
        populateTopicControls();
        importStatus.style.color = "#34d399";
        importStatus.textContent = `✓ Đã nhập thành công ${parsed.length.toLocaleString()} từ từ file "${file.name}"!`;
        renderVocabList();
        startSession();
      } else {
        importStatus.style.color = "#f87171";
        importStatus.textContent = "Không tìm thấy từ hợp lệ trong file CSV/JSON.";
      }
    } catch (err) {
      importStatus.style.color = "#f87171";
      importStatus.textContent = "File bị lỗi định dạng: " + err.message;
    }
  };
  reader.readAsText(file, "UTF-8");
  e.target.value = "";
});

// Sự kiện nút game
audioBtn.addEventListener("click", () => {
  if (currentWordObj) speakWord(currentWordObj.word);
});
hintBtn.addEventListener("click", useHint);
deleteBtn.addEventListener("click", deleteOne);
clearBtn.addEventListener("click", clearAll);
shuffleBtn.addEventListener("click", () => {
  tiles = shuffleArray(tiles);
  renderBoard();
});
nextBtn.addEventListener("click", nextQuestion);
modeSelect.addEventListener("change", startSession);
document.getElementById("restartBtn").addEventListener("click", startSession);

// Gõ bàn phím trực tiếp
document.addEventListener("keydown", (e) => {
  if (document.getElementById("vocabModal").classList.contains("open")) return;
  if (summaryCard.classList.contains("show")) return;
  if (!currentWordObj) return;

  if (e.code === "ShiftLeft" && !e.repeat) {
    e.preventDefault();
    speakWord(currentWordObj.word);
    return;
  }

  if (isSolved) {
    if (e.key === "Enter") nextQuestion();
    return;
  }

  if (e.key === "Tab") {
    e.preventDefault();
    useHint();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    activeSlot = Math.max(0, activeSlot - 1);
    renderBoard();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    activeSlot = Math.min(slots.length - 1, activeSlot + 1);
    renderBoard();
  } else if (e.key === "Backspace") {
    e.preventDefault();
    deleteOne();
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    const char = e.key.toUpperCase();
    const availableTile = tiles.find(t => t.char === char && !slots.includes(t.id));
    if (availableTile) placeTile(availableTile.id);
  }
});

// Modal Quản lý & Tìm kiếm từ vựng
const vocabModal = document.getElementById("vocabModal");
const vocabListEl = document.getElementById("vocabList");
const vocabCountEl = document.getElementById("vocabCount");
const searchVocabInput = document.getElementById("searchVocabInput");

function renderVocabList() {
  const q = searchVocabInput.value.trim().toLowerCase();
  const topicFilter = modalTopicFilter.value;
  vocabCountEl.textContent = vocabData.length.toLocaleString();
  vocabListEl.innerHTML = "";

  const matched = vocabData
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => {
      if (topicFilter && (item.topic || "Chung") !== topicFilter) return false;
      if (!q) return true;
      return (
        item.word.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        (item.topic || "").toLowerCase().includes(q)
      );
    });

  const slice = matched.slice(0, 60);
  slice.forEach(({ item, idx }) => {
    const row = document.createElement("div");
    row.className = "vocab-item";

    const info = document.createElement("div");
    const wordEl = document.createElement("strong");
    wordEl.textContent = item.word + " ";

    const topicEl = document.createElement("span");
    topicEl.style.color = "var(--blue-bright)";
    topicEl.style.fontSize = "0.8rem";
    topicEl.textContent = `[${item.topic || "Chung"}]`;

    const meaningEl = document.createElement("div");
    meaningEl.style.color = "var(--text-secondary)";
    meaningEl.style.fontSize = "0.83rem";
    meaningEl.textContent = item.meaning;

    info.appendChild(wordEl);
    info.appendChild(topicEl);
    info.appendChild(meaningEl);

    const delBtn = document.createElement("button");
    delBtn.className = "del-word-btn";
    delBtn.textContent = "Xóa";
    delBtn.addEventListener("click", () => {
      if (vocabData.length <= 1) return alert("Cần giữ lại ít nhất 1 từ!");
      vocabData.splice(idx, 1);
      saveVocabData();
      populateTopicControls();
      renderVocabList();
    });

    row.appendChild(info);
    row.appendChild(delBtn);
    vocabListEl.appendChild(row);
  });

  if (matched.length > 60) {
    const note = document.createElement("div");
    note.style.cssText = "text-align:center; font-size:0.82rem; color:var(--text-muted); padding:8px;";
    note.textContent = `Đang hiển thị 60 / ${matched.length.toLocaleString()} từ. Chọn chủ đề hoặc gõ tìm kiếm để lọc thêm.`;
    vocabListEl.appendChild(note);
  }
}

searchVocabInput.addEventListener("input", renderVocabList);
modalTopicFilter.addEventListener("change", renderVocabList);

document.getElementById("menuBtn").addEventListener("click", () => {
  importStatus.textContent = "";
  renderVocabList();
  vocabModal.classList.add("open");
});

document.getElementById("closeModalBtn").addEventListener("click", () => {
  vocabModal.classList.remove("open");
});

document.getElementById("addWordBtn").addEventListener("click", () => {
  const word = document.getElementById("newWord").value.trim().replace(/\s+/g, " ").toLowerCase();
  const meaning = document.getElementById("newMeaning").value.trim();
  const topic = document.getElementById("newTopic").value.trim() || "Chung";

  if (!word || !isValidVocabWord(word)) {
    return alert("Vui lòng nhập từ tiếng Anh hợp lệ (chỉ gồm chữ cái, dấu cách hoặc dấu gạch ngang).");
  }
  if (!meaning) return alert("Vui lòng nhập nghĩa tiếng Việt.");

  vocabData.unshift({ word, meaning, topic });
  saveVocabData();
  populateTopicControls();
  document.getElementById("newWord").value = "";
  document.getElementById("newMeaning").value = "";
  renderVocabList();
  startSession();
});

// Khởi chạy: tự động nạp toeic_600_words.csv
loadToeicDataset(false);
