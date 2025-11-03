// Heart Maze Game
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

// Game state
let maze = [];
let player = { x: 0, y: 0 };
let goal = { x: 0, y: 0 };
let gameStarted = false;
let gameWon = false;
let moves = 0;
let hintsLeft = 3;
let timerInterval = null;
let startTime = 0;
let solution = [];
let showingHint = false;

// Maze settings
const difficulties = {
  easy: { gridSize: 20, cellSize: 30 },
  medium: { gridSize: 30, cellSize: 20 },
  hard: { gridSize: 40, cellSize: 15 },
};

let currentDifficulty = "medium";
let gridSize = difficulties[currentDifficulty].gridSize;
let cellSize = difficulties[currentDifficulty].cellSize;

// Colors
const colors = {
  wall: "#ec4899", // Pink
  path: "#fce7f3", // Light pink
  player: "#be123c", // Rose red
  goal: "#dc2626", // Red
  heart: "#f472b6", // Pink
  hint: "#fbbf24", // Yellow
};

// Initialize game
function init() {
  updateDifficulty();
  document.getElementById("newGameBtn").addEventListener("click", newGame);
  document.getElementById("hintBtn").addEventListener("click", showHint);
  document
    .getElementById("difficulty")
    .addEventListener("change", handleDifficultyChange);

  // Keyboard controls
  document.addEventListener("keydown", handleKeyPress);

  // Touch controls
  document
    .getElementById("upBtn")
    .addEventListener("click", () => movePlayer(0, -1));
  document
    .getElementById("downBtn")
    .addEventListener("click", () => movePlayer(0, 1));
  document
    .getElementById("leftBtn")
    .addEventListener("click", () => movePlayer(-1, 0));
  document
    .getElementById("rightBtn")
    .addEventListener("click", () => movePlayer(1, 0));

  newGame();
}

// Update difficulty settings
function updateDifficulty() {
  const diff = difficulties[currentDifficulty];
  gridSize = diff.gridSize;
  cellSize = diff.cellSize;
}

// Handle difficulty change
function handleDifficultyChange(e) {
  currentDifficulty = e.target.value;
  newGame();
}

// Generate heart-shaped boundary
function isInsideHeart(x, y) {
  // Normalize coordinates to -1 to 1 range
  const nx = (x - gridSize / 2) / (gridSize / 2);
  const ny = (y - gridSize / 2) / (gridSize / 2);

  // Heart equation: (x^2 + y^2 - 1)^3 - x^2*y^3 <= 0
  // Modified and scaled for better shape
  const heartEq = Math.pow(nx * nx + ny * ny - 0.8, 3) - nx * nx * ny * ny * ny;

  return heartEq <= 0 && y < gridSize - 2; // Keep away from bottom edge
}

// Create heart-shaped grid
function createHeartGrid() {
  const grid = [];
  for (let y = 0; y < gridSize; y++) {
    grid[y] = [];
    for (let x = 0; x < gridSize; x++) {
      grid[y][x] = {
        x: x,
        y: y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
        inHeart: isInsideHeart(x, y),
      };
    }
  }
  return grid;
}

// Shuffle array helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate maze using recursive backtracking
function generateMaze(startX, startY) {
  const stack = [];
  let current = maze[startY][startX];
  current.visited = true;

  stack.push(current);

  while (stack.length > 0) {
    current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];

      // Remove walls between current and next
      removeWalls(current, next);

      next.visited = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }
}

// Get unvisited neighbors within heart
function getUnvisitedNeighbors(cell) {
  const neighbors = [];
  const { x, y } = cell;

  const directions = [
    { dx: 0, dy: -1 }, // top
    { dx: 1, dy: 0 }, // right
    { dx: 0, dy: 1 }, // bottom
    { dx: -1, dy: 0 }, // left
  ];

  directions.forEach(({ dx, dy }) => {
    const nx = x + dx;
    const ny = y + dy;

    if (
      nx >= 0 &&
      nx < gridSize &&
      ny >= 0 &&
      ny < gridSize &&
      !maze[ny][nx].visited &&
      maze[ny][nx].inHeart
    ) {
      neighbors.push(maze[ny][nx]);
    }
  });

  return neighbors;
}

// Remove walls between two cells
function removeWalls(cell1, cell2) {
  const dx = cell2.x - cell1.x;
  const dy = cell2.y - cell1.y;

  if (dx === 1) {
    cell1.walls.right = false;
    cell2.walls.left = false;
  } else if (dx === -1) {
    cell1.walls.left = false;
    cell2.walls.right = false;
  } else if (dy === 1) {
    cell1.walls.bottom = false;
    cell2.walls.top = false;
  } else if (dy === -1) {
    cell1.walls.top = false;
    cell2.walls.bottom = false;
  }
}

// Find path using BFS (for solution/hint)
function findSolution() {
  const queue = [[player.x, player.y, []]];
  const visited = new Set();
  visited.add(`${player.x},${player.y}`);

  while (queue.length > 0) {
    const [x, y, path] = queue.shift();

    if (x === goal.x && y === goal.y) {
      return path;
    }

    const cell = maze[y][x];
    const directions = [
      { dx: 0, dy: -1, wall: "top" },
      { dx: 1, dy: 0, wall: "right" },
      { dx: 0, dy: 1, wall: "bottom" },
      { dx: -1, dy: 0, wall: "left" },
    ];

    directions.forEach(({ dx, dy, wall }) => {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;

      if (
        nx >= 0 &&
        nx < gridSize &&
        ny >= 0 &&
        ny < gridSize &&
        !cell.walls[wall] &&
        !visited.has(key) &&
        maze[ny][nx].inHeart
      ) {
        visited.add(key);
        queue.push([nx, ny, [...path, { x: nx, y: ny }]]);
      }
    });
  }

  return [];
}

// New game
function newGame() {
  updateDifficulty();

  // Reset game state
  gameStarted = false;
  gameWon = false;
  moves = 0;
  hintsLeft = 30;
  showingHint = false;

  // Clear timer
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Create heart-shaped grid
  maze = createHeartGrid();

  // Find valid start position (top of heart)
  let startX = Math.floor(gridSize / 2);
  let startY = Math.floor(gridSize * 0.15);

  // Ensure start is inside heart
  while (!maze[startY][startX].inHeart) {
    startY++;
  }

  player.x = startX;
  player.y = startY;

  // Find goal position (center/bottom of heart)
  let goalX = Math.floor(gridSize / 2);
  let goalY = Math.floor(gridSize * 0.6);

  // Ensure goal is inside heart
  while (!maze[goalY][goalX].inHeart) {
    goalY--;
  }

  goal.x = goalX;
  goal.y = goalY;

  // Generate maze
  generateMaze(startX, startY);

  // Find solution
  solution = findSolution();

  // Update UI
  document.getElementById("moves").textContent = moves;
  document.getElementById("hintsLeft").textContent = hintsLeft;
  document.getElementById("timer").textContent = "0:00";
  document.getElementById("hintBtn").textContent = `Show Hint (${hintsLeft})`;
  hideStatusMessage();

  // Draw
  draw();
}

// Start timer
function startTimer() {
  if (!gameStarted) {
    gameStarted = true;
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
  }
}

// Update timer display
function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  document.getElementById("timer").textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// Handle keyboard input
function handleKeyPress(e) {
  if (gameWon) return;

  const key = e.key.toLowerCase();

  if (key === "arrowup" || key === "w") {
    e.preventDefault();
    movePlayer(0, -1);
  } else if (key === "arrowdown" || key === "s") {
    e.preventDefault();
    movePlayer(0, 1);
  } else if (key === "arrowleft" || key === "a") {
    e.preventDefault();
    movePlayer(-1, 0);
  } else if (key === "arrowright" || key === "d") {
    e.preventDefault();
    movePlayer(1, 0);
  }
}

// Move player
function movePlayer(dx, dy) {
  if (gameWon) return;

  startTimer();
  showingHint = false;

  const newX = player.x + dx;
  const newY = player.y + dy;

  // Check boundaries
  if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) {
    return;
  }

  // Check if inside heart
  if (!maze[newY][newX].inHeart) {
    return;
  }

  // Check walls
  const currentCell = maze[player.y][player.x];
  let canMove = false;

  if (dx === 1 && !currentCell.walls.right) canMove = true;
  if (dx === -1 && !currentCell.walls.left) canMove = true;
  if (dy === 1 && !currentCell.walls.bottom) canMove = true;
  if (dy === -1 && !currentCell.walls.top) canMove = true;

  if (canMove) {
    player.x = newX;
    player.y = newY;
    moves++;
    document.getElementById("moves").textContent = moves;

    // Recalculate solution from new position
    solution = findSolution();

    draw();

    // Check win condition
    if (player.x === goal.x && player.y === goal.y) {
      winGame();
      playSimple();
    }
  }
}

// Show hint
function showHint() {
  if (hintsLeft > 0 && !gameWon && solution.length > 0) {
    showingHint = true;
    hintsLeft--;
    document.getElementById("hintsLeft").textContent = hintsLeft;
    document.getElementById("hintBtn").textContent = `Show Hint (${hintsLeft})`;

    if (hintsLeft === 0) {
      document.getElementById("hintBtn").disabled = true;
      document
        .getElementById("hintBtn")
        .classList.add("opacity-50", "cursor-not-allowed");
    }

    draw();

    // Hide hint after 2 seconds
    setTimeout(() => {
      showingHint = false;
      draw();
    }, 2000);
  }
}

// Win game
function winGame() {
  gameWon = true;
  clearInterval(timerInterval);

  const time = document.getElementById("timer").textContent;
  showStatusMessage(
    `🎉 Congratulations! You reached the heart in ${moves} moves and ${time}!`,
    "success"
  );

  draw();
}

// Show status message
function showStatusMessage(message, type = "info") {
  const statusDiv = document.getElementById("statusMessage");
  statusDiv.textContent = message;
  statusDiv.className = `mb-4 p-3 rounded-lg text-center font-semibold ${
    type === "success"
      ? "bg-green-100 text-green-800"
      : "bg-blue-100 text-blue-800"
  }`;
  statusDiv.classList.remove("hidden");
}

// Hide status message
function hideStatusMessage() {
  document.getElementById("statusMessage").classList.add("hidden");
}

// Draw everything
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate offset to center the maze
  const mazeWidth = gridSize * cellSize;
  const mazeHeight = gridSize * cellSize;
  const offsetX = (canvas.width - mazeWidth) / 2;
  const offsetY = (canvas.height - mazeHeight) / 2;

  // Draw heart outline first
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Draw cells
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = maze[y][x];

      if (!cell.inHeart) continue;

      const cellX = x * cellSize;
      const cellY = y * cellSize;

      // Fill cell
      ctx.fillStyle = colors.path;
      ctx.fillRect(cellX, cellY, cellSize, cellSize);

      // Draw walls
      ctx.strokeStyle = colors.wall;
      ctx.lineWidth = 2;
      ctx.beginPath();

      if (cell.walls.top) {
        ctx.moveTo(cellX, cellY);
        ctx.lineTo(cellX + cellSize, cellY);
      }
      if (cell.walls.right) {
        ctx.moveTo(cellX + cellSize, cellY);
        ctx.lineTo(cellX + cellSize, cellY + cellSize);
      }
      if (cell.walls.bottom) {
        ctx.moveTo(cellX, cellY + cellSize);
        ctx.lineTo(cellX + cellSize, cellY + cellSize);
      }
      if (cell.walls.left) {
        ctx.moveTo(cellX, cellY);
        ctx.lineTo(cellX, cellY + cellSize);
      }

      ctx.stroke();
    }
  }

  // Draw hint path
  if (showingHint && solution.length > 0) {
    ctx.strokeStyle = colors.hint;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const startX = player.x * cellSize + cellSize / 2;
    const startY = player.y * cellSize + cellSize / 2;
    ctx.moveTo(startX, startY);

    // Draw first few steps of solution
    const stepsToShow = Math.min(5, solution.length);
    for (let i = 0; i < stepsToShow; i++) {
      const step = solution[i];
      const stepX = step.x * cellSize + cellSize / 2;
      const stepY = step.y * cellSize + cellSize / 2;
      ctx.lineTo(stepX, stepY);
    }

    ctx.stroke();
  }

  // Draw goal
  const goalX = goal.x * cellSize + cellSize / 2;
  const goalY = goal.y * cellSize + cellSize / 2;

  ctx.fillStyle = colors.goal;
  ctx.beginPath();
  ctx.arc(goalX, goalY, cellSize * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Draw heart symbol at goal
  ctx.fillStyle = "white";
  ctx.font = `${cellSize * 0.6}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("❤", goalX, goalY);

  // Pulsing effect for goal
  if (!gameWon) {
    const pulse = Math.sin(Date.now() / 300) * 0.1 + 1;
    ctx.strokeStyle = colors.goal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(goalX, goalY, cellSize * 0.5 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw player
  const playerX = player.x * cellSize + cellSize / 2;
  const playerY = player.y * cellSize + cellSize / 2;

  ctx.fillStyle = colors.player;
  ctx.beginPath();
  ctx.arc(playerX, playerY, cellSize * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Draw player border
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

// Initialize when page loads
window.addEventListener("load", init);

const successAudioEl = document.getElementById("sdn-success");

function playSimple() {
  const VOLUME = 0.2;

  const clone = successAudioEl.cloneNode(true);
  clone.play();
  clone.volume = VOLUME;
}
