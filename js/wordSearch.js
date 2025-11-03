// =============================================
// WORD SEARCH GAME
// Find all hidden words in the letter grid
// =============================================

// Game state
let grid = [];
let gridSize = 12;
let words = [];
let foundWords = new Set();
let selectedCells = [];
let isSelecting = false;
let startTime = null;
let timerInterval = null;
let currentDifficulty = "easy";

// Word lists by difficulty
const wordLists = {
  easy: ["CAT", "DOG", "SUN", "MOON", "STAR", "TREE", "FISH", "BIRD"],
  medium: [
    "APPLE",
    "GRAPE",
    "LEMON",
    "ORANGE",
    "BANANA",
    "CHERRY",
    "MANGO",
    "PEACH",
    "PLUM",
    "BERRY",
  ],
  hard: [
    "ELEPHANT",
    "GIRAFFE",
    "DOLPHIN",
    "PENGUIN",
    "KANGAROO",
    "BUTTERFLY",
    "CROCODILE",
    "OCTOPUS",
    "CHEETAH",
    "RACCOON",
  ],
};

// Directions: [rowDelta, colDelta]
const directions = [
  [0, 1], // Horizontal right
  [0, -1], // Horizontal left
  [1, 0], // Vertical down
  [-1, 0], // Vertical up
  [1, 1], // Diagonal down-right
  [-1, -1], // Diagonal up-left
  [1, -1], // Diagonal down-left
  [-1, 1], // Diagonal up-right
];

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  initGame();
});

function setupEventListeners() {
  document.getElementById("newGameBtn").addEventListener("click", () => {
    initGame();
  });

  document.getElementById("hintBtn").addEventListener("click", showHint);

  document.getElementById("difficulty").addEventListener("change", (e) => {
    currentDifficulty = e.target.value;
    initGame();
  });

  // Grid selection events
  const gridContainer = document.getElementById("gridContainer");
  gridContainer.addEventListener("mousedown", startSelection);
  gridContainer.addEventListener("mouseover", continueSelection);
  gridContainer.addEventListener("mouseup", endSelection);
  gridContainer.addEventListener("mouseleave", endSelection);

  // Touch events for mobile
  gridContainer.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  gridContainer.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  gridContainer.addEventListener("touchend", handleTouchEnd, {
    passive: false,
  });
}

// =============================================
// GAME INITIALIZATION
// =============================================
function computeGridSize(screenWidth, difficulty) {
  if (screenWidth <= 360) return 7;
  if (screenWidth <= 480) return 8;
  if (difficulty === "easy") return 10;
  if (difficulty === "medium") return 12;
  return 15;
}

function debounce(fn, wait = 200) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}

function computeWordCount(screenWidth, difficulty) {
  if (screenWidth <= 480) {
    if (difficulty === "easy") return 4;
    if (difficulty === "medium") return 6;
    return 8;
  }

  if (difficulty === "easy") return 6;
  if (difficulty === "medium") return 8;
  return 8;
}

function initGame(difficulty) {
  currentDifficulty = difficulty || currentDifficulty;

  foundWords.clear();
  selectedCells = [];
  isSelecting = false;

  gridSize = computeGridSize(window.innerWidth, currentDifficulty);

  const count = computeWordCount(window.innerWidth, currentDifficulty);
  words = selectRandomWords(wordLists[currentDifficulty], count).filter(
    (word) => word.length <= gridSize
  );

  generateGrid();
  renderGrid();
  renderWordList();
  updateScore();

  if (timerInterval) clearInterval(timerInterval);
  startTimer();
  showStatus("Find all the words!", "info");
}

const handleResize = debounce(() => {
  const newSize = computeGridSize(window.innerWidth, currentDifficulty);
  if (newSize === gridSize) return;
  gridSize = newSize;
  selectedCells = [];
  isSelecting = false;
  generateGrid();
  renderGrid();
  renderWordList();
  updateScore();
}, 200);

window.addEventListener("resize", handleResize);

function selectRandomWords(list, count) {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateGrid() {
  grid = Array(gridSize)
    .fill()
    .map(() =>
      Array(gridSize)
        .fill()
        .map(() => ({
          letter: "",
          isWord: false,
          wordIndex: -1,
        }))
    );

  words.forEach((word, wordIndex) => {
    if (word.length > gridSize) return;

    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      const direction =
        directions[Math.floor(Math.random() * directions.length)];
      const startRow = Math.floor(Math.random() * gridSize);
      const startCol = Math.floor(Math.random() * gridSize);

      if (canPlaceWord(word, startRow, startCol, direction)) {
        placeWord(word, startRow, startCol, direction, wordIndex);
        placed = true;
      }
      attempts++;
    }
  });

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col].letter === "") {
        grid[row][col].letter = String.fromCharCode(
          65 + Math.floor(Math.random() * 26)
        );
      }
    }
  }
}

function canPlaceWord(word, startRow, startCol, [rowDelta, colDelta]) {
  const endRow = startRow + (word.length - 1) * rowDelta;
  const endCol = startCol + (word.length - 1) * colDelta;

  // Check bounds
  if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) {
    return false;
  }

  // Check if path is clear or matches existing letters
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * rowDelta;
    const col = startCol + i * colDelta;
    const cell = grid[row][col];

    if (cell.letter !== "" && cell.letter !== word[i]) {
      return false;
    }
  }

  return true;
}

function placeWord(word, startRow, startCol, [rowDelta, colDelta], wordIndex) {
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * rowDelta;
    const col = startCol + i * colDelta;
    grid[row][col] = {
      letter: word[i],
      isWord: true,
      wordIndex: wordIndex,
    };
  }
}

// =============================================
// RENDERING
// =============================================

function renderGrid() {
  const container = document.getElementById("gridContainer");
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${gridSize}, minmax(15px, 1fr))`;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.textContent = grid[row][col].letter;
      cell.dataset.row = row;
      cell.dataset.col = col;
      container.appendChild(cell);
    }
  }
}

function renderWordList() {
  const wordList = document.getElementById("wordList");
  wordList.innerHTML = "";

  words.forEach((word, index) => {
    const li = document.createElement("li");
    li.className = "word-item";
    li.textContent = word;
    li.id = `word-${index}`;
    wordList.appendChild(li);
  });
}

// =============================================
// SELECTION HANDLING
// =============================================

function startSelection(e) {
  if (e.target.classList.contains("grid-cell")) {
    isSelecting = true;
    selectedCells = [];
    clearSelection();
    addToSelection(e.target);
  }
}

function continueSelection(e) {
  if (isSelecting && e.target.classList.contains("grid-cell")) {
    if (!isSelected(e.target)) {
      addToSelection(e.target);
    }
  }
}

function endSelection() {
  if (isSelecting) {
    isSelecting = false;
    checkSelection();
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  if (element && element.classList.contains("grid-cell")) {
    isSelecting = true;
    selectedCells = [];
    clearSelection();
    addToSelection(element);
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (isSelecting) {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.classList.contains("grid-cell")) {
      if (!isSelected(element)) {
        addToSelection(element);
      }
    }
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  if (isSelecting) {
    isSelecting = false;
    checkSelection();
  }
}

function addToSelection(cell) {
  selectedCells.push(cell);
  cell.classList.add("selected");
}

function isSelected(cell) {
  return selectedCells.includes(cell);
}

function clearSelection() {
  selectedCells.forEach((cell) => {
    if (!cell.classList.contains("found")) {
      cell.classList.remove("selected");
    }
  });
  selectedCells = [];
}

// =============================================
// WORD VALIDATION
// =============================================

function checkSelection() {
  if (selectedCells.length < 2) {
    clearSelection();
    return;
  }

  const selectedWord = getSelectedWord();
  const reversedWord = selectedWord.split("").reverse().join("");

  let found = false;
  for (let [index, word] of words.entries()) {
    if (
      (selectedWord === word || reversedWord === word) &&
      !foundWords.has(index)
    ) {
      markWordFound(index);
      markCellsAsFound();
      playSuccessAnimation();
      playSimple("success");
      updateScore();
      checkWin();
      found = true;
      break;
    }
  }

  if (!found) playSimple("fail");

  clearSelection();
}

function getSelectedWord() {
  return selectedCells.map((cell) => cell.textContent).join("");
}

function markWordFound(index) {
  foundWords.add(index);
  const wordElement = document.getElementById(`word-${index}`);
  if (wordElement) {
    wordElement.classList.add("found");
    wordElement.classList.add("celebrate");
    setTimeout(() => wordElement.classList.remove("celebrate"), 500);
  }
}

function markCellsAsFound() {
  selectedCells.forEach((cell) => {
    cell.classList.add("found");
    cell.classList.remove("selected");
  });
}

function playSuccessAnimation() {
  showStatus("Word found! 🎉", "success");
}

// =============================================
// GAME STATUS
// =============================================

function updateScore() {
  document.getElementById(
    "score"
  ).textContent = `Found: ${foundWords.size}/${words.length}`;
}

function checkWin() {
  if (foundWords.size === words.length) {
    stopTimer();
    const time = document.getElementById("timer").textContent;
    showStatus(
      `🎉 Congratulations! You found all words in ${time}! 🎉`,
      "success"
    );
  }
}

function showHint() {
  // Find first unfound word
  const unfoundIndex = words.findIndex((_, index) => !foundWords.has(index));

  if (unfoundIndex === -1) {
    showStatus("All words found!", "info");
    return;
  }

  // Highlight cells of that word temporarily
  const hintCells = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col].wordIndex === unfoundIndex) {
        const cellElement = document.querySelector(
          `[data-row="${row}"][data-col="${col}"]`
        );
        if (cellElement) {
          cellElement.style.backgroundColor = "rgba(255, 255, 0, 0.4)";
          hintCells.push(cellElement);
        }
      }
    }
  }

  showStatus(`Hint: Look for "${words[unfoundIndex]}"`, "info");

  // Remove highlight after 2 seconds
  setTimeout(() => {
    hintCells.forEach((cell) => {
      if (!cell.classList.contains("found")) {
        cell.style.backgroundColor = "";
      }
    });
  }, 2000);
}

// =============================================
// TIMER
// =============================================

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
  updateTimer();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  document.getElementById("timer").textContent = `⏰ ${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// =============================================
// UI HELPERS
// =============================================

function showStatus(message, type = "info") {
  const statusContainer = document.getElementById("statusContainer");
  const status = document.getElementById("status");

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-cyan-600",
  };

  status.className = "px-4 py-3 rounded-lg text-center font-semibold";
  status.classList.add(colors[type] || colors.info);
  status.textContent = message;
  statusContainer.classList.remove("hidden");

  setTimeout(() => {
    // statusContainer.classList.add("hidden");
  }, 3000);
}

// =============================================
// AUDIO LISTENERS
// =============================================
const successAudioEl = document.getElementById("sdn-success");
const failAudioEl = document.getElementById("sdn-fail");

function playSimple(info) {
  // const VOLUME = 1.0;
  const VOLUME = 0.2;

  if (info === "success") {
    const clone = successAudioEl.cloneNode(true);
    clone.play();
    clone.volume = VOLUME;
    return;
  }

  if (info === "fail") {
    const clone = failAudioEl.cloneNode(true);
    clone.play();
    clone.volume = VOLUME;
    return;
  }
}
