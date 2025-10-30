// Game state
let snake = [];
let food;
let direction = "RIGHT";
let nextDirection = "RIGHT";
let score = 0;
let highScore = 0;
let gameStarted = false;
let gameOver = false;
let isPaused = false;

// Grid settings
const gridSize = 20;
let cols, rows;
let canvasWidth = 890;
const canvasHeight = 600;

// Speed settings
let speed = 10;
let speedLevel = 1;
let frameDelay = 10;
let frameCounter = 0;

// =============================================
// P5.JS SETUP - Initialize game
// =============================================
let canvas;

function setup() {
  const canvasContainer = document.getElementById("canvasContainer");
  canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvasContainer");

  window.addEventListener("resize", () => {
    const newWidth = canvasContainer.offsetWidth;
    if (newWidth !== canvasWidth) {
      canvasWidth = newWidth;
      resizeCanvas(canvasWidth, canvasHeight);

      cols = floor(canvasWidth / gridSize);
      rows = floor(canvasHeight / gridSize);
    }
  });

  cols = floor(canvasWidth / gridSize);
  rows = floor(canvasHeight / gridSize);

  highScore = localStorage.getItem("snakeHighScore") || 0;
  document.getElementById("highScore").textContent = `High Score: ${highScore}`;

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("pauseBtn").addEventListener("click", togglePause);

  // Show start message
  noLoop();
  showStartScreen();
}

// =============================================
// START GAME - Initialize new game
// =============================================
function startGame() {
  snake = [];
  snake.push(createVector(floor(cols / 2), floor(rows / 2)));
  direction = "RIGHT";
  nextDirection = "RIGHT";
  score = 0;
  speed = 10;
  speedLevel = 1;
  gameStarted = true;
  gameOver = false;
  isPaused = false;

  spawnFood();
  updateUI();
  loop();

  document.getElementById("status").textContent = "";
  document.getElementById("startBtn").textContent = "🔄 Restart";
}

// =============================================
// TOGGLE PAUSE - Pause/Resume game
// =============================================
function togglePause() {
  if (!gameStarted || gameOver) return;

  isPaused = !isPaused;

  if (isPaused) {
    noLoop();
    document.getElementById("pauseBtn").textContent = "▶️ Resume";
    document.getElementById("status").textContent = "⏸️ Paused";
  } else {
    loop();
    document.getElementById("pauseBtn").textContent = "⏸️ Pause";
    document.getElementById("status").textContent = "";
  }
}

// =============================================
// DRAW LOOP - Main game rendering
// =============================================
function draw() {
  if (!gameStarted) {
    showStartScreen();
    return;
  }

  if (isPaused) return;

  // Control game speed
  frameCounter++;
  if (frameCounter < frameDelay) return;
  frameCounter = 0;

  background(20, 30, 20);
  drawGrid();

  // Move snake
  direction = nextDirection;
  let head = snake[0].copy();

  if (direction === "UP") head.y--;
  if (direction === "DOWN") head.y++;
  if (direction === "LEFT") head.x--;
  if (direction === "RIGHT") head.x++;

  // Check wall collision
  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    endGame();
    return;
  }

  // Check self collision
  for (let segment of snake) {
    if (head.equals(segment)) {
      endGame();
      return;
    }
  }

  // Add new head
  snake.unshift(head);

  // Check food collision
  if (head.equals(food)) {
    score += 10;
    speedLevel = floor(score / 50) + 1;
    speed = 10 + speedLevel;
    frameDelay = max(2, 10 - speedLevel);
    spawnFood();
    updateUI();
  } else {
    // Remove tail
    snake.pop();
  }

  // Draw food
  drawFood();

  // Draw snake
  drawSnake();
}

// =============================================
// DRAW GRID - Draw background grid
// =============================================
function drawGrid() {
  stroke(30, 50, 30);
  strokeWeight(1);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      noFill();
      rect(i * gridSize, j * gridSize, gridSize, gridSize);
    }
  }
}

// =============================================
// DRAW SNAKE - Render the snake
// =============================================
function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    let segment = snake[i];

    // Gradient effect from head to tail
    if (i === 0) {
      fill(100, 255, 100); // Bright green head
    } else {
      let brightness = map(i, 0, snake.length, 255, 100);
      fill(50, brightness, 50);
    }

    stroke(20);
    strokeWeight(2);
    rect(
      segment.x * gridSize,
      segment.y * gridSize,
      gridSize - 1,
      gridSize - 1,
      3
    );

    // Draw eyes on head
    if (i === 0) {
      fill(0);
      noStroke();
      let eyeSize = 3;
      if (direction === "RIGHT") {
        circle(
          segment.x * gridSize + gridSize - 6,
          segment.y * gridSize + 6,
          eyeSize
        );
        circle(
          segment.x * gridSize + gridSize - 6,
          segment.y * gridSize + gridSize - 6,
          eyeSize
        );
      } else if (direction === "LEFT") {
        circle(segment.x * gridSize + 6, segment.y * gridSize + 6, eyeSize);
        circle(
          segment.x * gridSize + 6,
          segment.y * gridSize + gridSize - 6,
          eyeSize
        );
      } else if (direction === "UP") {
        circle(segment.x * gridSize + 6, segment.y * gridSize + 6, eyeSize);
        circle(
          segment.x * gridSize + gridSize - 6,
          segment.y * gridSize + 6,
          eyeSize
        );
      } else {
        circle(
          segment.x * gridSize + 6,
          segment.y * gridSize + gridSize - 6,
          eyeSize
        );
        circle(
          segment.x * gridSize + gridSize - 6,
          segment.y * gridSize + gridSize - 6,
          eyeSize
        );
      }
    }
  }
}

// =============================================
// DRAW FOOD - Render the food
// =============================================
function drawFood() {
  fill(255, 50, 50);
  stroke(200, 0, 0);
  strokeWeight(2);
  circle(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize - 2
  );

  // Add sparkle effect
  noStroke();
  fill(255, 200, 200);
  circle(
    food.x * gridSize + gridSize / 2 - 3,
    food.y * gridSize + gridSize / 2 - 3,
    4
  );
}

// =============================================
// SPAWN FOOD - Create new food at random position
// =============================================
function spawnFood() {
  let validPosition = false;

  while (!validPosition) {
    food = createVector(floor(random(cols)), floor(random(rows)));

    // Check if food spawns on snake
    validPosition = true;
    for (let segment of snake) {
      if (food.equals(segment)) {
        validPosition = false;
        break;
      }
    }
  }
}

// =============================================
// KEY PRESSED - Handle keyboard input
// =============================================
function keyPressed() {
  // Arrow keys
  if (keyCode === UP_ARROW || key === "w" || key === "W") {
    if (direction !== "DOWN") nextDirection = "UP";
  } else if (keyCode === DOWN_ARROW || key === "s" || key === "S") {
    if (direction !== "UP") nextDirection = "DOWN";
  } else if (keyCode === LEFT_ARROW || key === "a" || key === "A") {
    if (direction !== "RIGHT") nextDirection = "LEFT";
  } else if (keyCode === RIGHT_ARROW || key === "d" || key === "D") {
    if (direction !== "LEFT") nextDirection = "RIGHT";
  }

  // Space to pause
  if (key === " ") {
    togglePause();
  }

  // Prevent default browser behavior
  return false;
}

// =============================================
// END GAME - Handle game over
// =============================================
function endGame() {
  gameOver = true;
  gameStarted = false;
  noLoop();

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("snakeHighScore", highScore);
    document.getElementById(
      "status"
    ).textContent = `🎉 New High Score: ${score}!`;
    document.getElementById("status").className =
      "mt-4 text-xl text-green-400 text-center font-bold";
  } else {
    document.getElementById(
      "status"
    ).textContent = `💀 Game Over! Final Score: ${score}`;
    document.getElementById("status").className =
      "mt-4 text-xl text-red-400 text-center font-bold";
  }

  document.getElementById("highScore").textContent = `High Score: ${highScore}`;
  document.getElementById("startBtn").textContent = "🔄 Try Again";
}

// =============================================
// UPDATE UI - Update score display
// =============================================
function updateUI() {
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("speed").textContent = `Speed: ${speedLevel}`;
}

// =============================================
// SHOW START SCREEN - Display start message
// =============================================
function showStartScreen() {
  background(20, 30, 20);
  fill(100, 255, 100);
  textAlign(CENTER, CENTER);
  textSize(32);
  textStyle(BOLD);
  text("🐍 SNAKE GAME 🐍", width / 2, height / 2 - 40);

  textSize(18);
  fill(200);
  text("Click 'Start Game' to begin!", width / 2, height / 2 + 20);
}
