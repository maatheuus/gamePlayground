let paddle;
let ball;
let bricks = [];
let powerups = [];
let score = 0;
let lives = 3;
let level = 1;
let gameStarted = false;
let gameOver = false;
let isPaused = false;
let ballStuck = true; // controla se a bola está presa ao paddle antes de lançar

let canvasWidth = 890;
const canvasHeight = 600;

const brickRows = 5;
const brickCols = 10;
const brickWidth = 70;
const brickHeight = 25;
const brickPadding = 5;
const brickOffsetTop = 60;
const brickOffsetLeft = 35;

const powerupTypes = [
  { type: "wide", color: [100, 200, 255], symbol: "↔️" },
  { type: "multi", color: [255, 200, 100], symbol: "⚫" },
  { type: "slow", color: [150, 255, 150], symbol: "🐌" },
  { type: "life", color: [255, 100, 100], symbol: "❤️" },
];

class Paddle {
  constructor() {
    this.width = 100;
    this.height = 15;
    this.x = canvasWidth / 2 - this.width / 2;
    this.y = canvasHeight - 40;
    this.speed = 8;
    this.normalWidth = 100;
    this.wideWidth = 150;
  }

  draw() {
    fill(100, 150, 255);
    stroke(50, 100, 200);
    rect(this.x, this.y, this.width, this.height, 5);
  }

  move(dir) {
    this.x += dir * this.speed;
    this.x = constrain(this.x, 0, canvasWidth - this.width);
  }

  makeWide() {
    this.width = this.wideWidth;
  }

  makeNormal() {
    this.width = this.normalWidth;
  }
}

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.speedX = 0;
    this.speedY = 0;
    this.normalSpeed = 5;
    this.slowSpeed = 3;
    this.active = true;
  }

  draw() {
    fill(255, 255, 100);
    circle(this.x, this.y, this.radius * 2);
  }

  update() {
    // bola presa antes do lançamento
    if (ballStuck) {
      this.x = paddle.x + paddle.width / 2;
      this.y = paddle.y - this.radius;
      return;
    }

    this.x += this.speedX;
    this.y += this.speedY;

    // colisões laterais
    if (this.x - this.radius <= 0 || this.x + this.radius >= canvasWidth)
      this.speedX *= -1;

    // colisão no topo
    if (this.y - this.radius <= 0) this.speedY *= -1;

    // colisão com o paddle
    if (
      this.y + this.radius >= paddle.y &&
      this.y - this.radius <= paddle.y + paddle.height &&
      this.x >= paddle.x &&
      this.x <= paddle.x + paddle.width
    ) {
      this.speedY *= -1;
      let hitPos = (this.x - paddle.x) / paddle.width;
      this.speedX = (hitPos - 0.5) * 10;
    }

    // bola saiu da tela
    if (this.y > canvasHeight) this.active = false;
  }

  launch() {
    this.speedX = random(-3, 3);
    this.speedY = -this.normalSpeed;
  }

  makeSlow() {
    // reduz a velocidade mantendo direção
    let mag = sqrt(this.speedX ** 2 + this.speedY ** 2);
    this.speedX = (this.speedX / mag) * this.slowSpeed;
    this.speedY = (this.speedY / mag) * this.slowSpeed;
  }

  makeNormal() {
    let mag = sqrt(this.speedX ** 2 + this.speedY ** 2);
    this.speedX = (this.speedX / mag) * this.normalSpeed;
    this.speedY = (this.speedY / mag) * this.normalSpeed;
  }
}

class Brick {
  constructor(x, y, hits) {
    this.x = x;
    this.y = y;
    this.width = brickWidth;
    this.height = brickHeight;
    this.hits = hits; // quantas vezes precisa ser atingido
    this.maxHits = hits;
    this.visible = true;
  }

  draw() {
    if (!this.visible) return;
    let hue = map(this.hits, 1, this.maxHits, 0, 120);
    colorMode(HSB);
    fill(hue, 80, 90);
    colorMode(RGB);
    rect(this.x, this.y, this.width, this.height, 3);
  }

  hit() {
    this.hits--;
    if (this.hits <= 0) {
      this.visible = false;
      return true;
    }
    return false;
  }
}

class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 2;
    this.type = type.type;
    this.color = type.color;
    this.symbol = type.symbol;
    this.active = true;
  }

  draw() {
    fill(this.color);
    circle(this.x, this.y, this.width);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.symbol, this.x, this.y);
  }

  update() {
    this.y += this.speed;

    // coleta pelo jogador
    if (
      this.y + this.height / 2 >= paddle.y &&
      this.x >= paddle.x &&
      this.x <= paddle.x + paddle.width
    ) {
      this.activate();
      this.active = false;
    }

    if (this.y > canvasHeight) this.active = false;
  }

  // ativa efeito do power-up
  activate() {
    if (this.type === "wide") {
      paddle.makeWide();
      setTimeout(() => paddle.makeNormal(), 10000);
    } else if (this.type === "multi") {
      createExtraBalls();
    } else if (this.type === "slow") {
      ball.makeSlow();
      setTimeout(() => ball.makeNormal(), 8000);
    } else if (this.type === "life") {
      lives++;
      updateUI();
    }
  }
}

let canvas;
function setup() {
  canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvasContainer");

  // ajusta o canvas ao redimensionar a janela
  window.addEventListener("resize", () => {
    const newWidth = canvasContainer.offsetWidth;
    if (newWidth !== canvasWidth) {
      canvasWidth = newWidth;
      resizeCanvas(canvasWidth, canvasHeight);
    }
  });

  paddle = new Paddle();
  ball = new Ball(canvasWidth / 2, canvasHeight / 2);

  // botões da interface
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("pauseBtn").addEventListener("click", togglePause);
  noLoop();
  showStartScreen();
}

function startGame() {
  score = 0;
  lives = 3;
  level = 1;
  gameStarted = true;
  gameOver = false;
  isPaused = false;
  ballStuck = true;

  createBricks();
  paddle = new Paddle();
  ball = new Ball(canvasWidth / 2, canvasHeight / 2);
  powerups = [];
  updateUI();
  loop();

  document.getElementById("status").textContent = "Click to launch the ball!";
  document.getElementById("startBtn").textContent = "🔄 Restart";
}

// cria grade de tijolos
function createBricks() {
  bricks = [];
  for (let row = 0; row < brickRows; row++) {
    for (let col = 0; col < brickCols; col++) {
      let x = col * (brickWidth + brickPadding) + brickOffsetLeft;
      let y = row * (brickHeight + brickPadding) + brickOffsetTop;
      let hits = min(row + 1, 3);
      bricks.push(new Brick(x, y, hits));
    }
  }
}

function createExtraBalls() {
  score += 50;
  updateUI();
}

// pausa ou retoma o jogo
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

function draw() {
  if (!gameStarted) return showStartScreen();
  if (isPaused) return;

  background(20, 20, 40);
  paddle.draw();
  ball.draw();
  ball.update();

  // colisões da bola com os tijolos
  for (let brick of bricks) {
    brick.draw();
    if (
      brick.visible &&
      ball.x + ball.radius >= brick.x &&
      ball.x - ball.radius <= brick.x + brick.width &&
      ball.y + ball.radius >= brick.y &&
      ball.y - ball.radius <= brick.y + brick.height
    ) {
      ball.speedY *= -1;
      let destroyed = brick.hit();
      if (destroyed) {
        score += 10 * level;
        updateUI();

        // chance de soltar power-up
        if (random() < 0.15) {
          let randomPowerup = random(powerupTypes);
          powerups.push(
            new Powerup(brick.x + brick.width / 2, brick.y, randomPowerup)
          );
        }

        // sobe de nível
        if (checkLevelComplete()) levelUp();
      }
    }
  }

  // atualiza e desenha power-ups ativos
  for (let i = powerups.length - 1; i >= 0; i--) {
    let powerup = powerups[i];
    powerup.update();
    powerup.draw();
    if (!powerup.active) powerups.splice(i, 1);
  }

  // perdeu a bola
  if (!ball.active) {
    lives--;
    updateUI();
    if (lives <= 0) endGame();
    else resetBall();
  }

  // movimento com teclado
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) paddle.move(-1);
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) paddle.move(1);
}

// movimento com o mouse
function mouseMoved() {
  if (gameStarted && !gameOver && !isPaused) {
    paddle.x = constrain(
      mouseX - paddle.width / 2,
      0,
      canvasWidth - paddle.width
    );
  }
}

// lança a bola com clique
function mousePressed() {
  if (ballStuck && gameStarted && !gameOver && !isPaused) {
    ball.launch();
    ballStuck = false;
    document.getElementById("status").textContent = "";
  }
}

// verifica se todos os tijolos sumiram
function checkLevelComplete() {
  return bricks.every((b) => !b.visible);
}

// avança para o próximo nível
function levelUp() {
  level++;
  ballStuck = true;
  ball = new Ball(canvasWidth / 2, canvasHeight / 2);
  createBricks();
  powerups = [];
  document.getElementById(
    "status"
  ).textContent = `🎉 Level ${level}! Click to continue!`;
  updateUI();
}

// reinicia bola após perder uma vida
function resetBall() {
  ballStuck = true;
  ball = new Ball(canvasWidth / 2, canvasHeight / 2);
}

// encerra o jogo
function endGame() {
  gameOver = true;
  gameStarted = false;
  noLoop();
  document.getElementById(
    "status"
  ).textContent = `💀 Game Over! Final Score: ${score}`;
  document.getElementById("startBtn").textContent = "🔄 Try Again";
}

// atualiza pontuação e vidas na interface
function updateUI() {
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("lives").textContent = `Lives: ${lives}`;
  document.getElementById("level").textContent = `Level: ${level}`;
}

// tela inicial
function showStartScreen() {
  background(20, 20, 40);
  fill(255, 100, 100);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("🧱 BRICK BREAKER 🧱", width / 2, height / 2 - 40);
  textSize(18);
  fill(200);
  text("Click 'Start Game' to begin!", width / 2, height / 2 + 20);
}
