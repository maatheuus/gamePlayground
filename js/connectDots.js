let dots = [];
let guideDots = [];
let currentIndex = 0;
let drawingCompleted = false;
let gameStarted = false;
let gameOver = false;
let currentDifficulty = "easy";
let showNumbers = true;
let numberVisibility = [];

let lastPos = { x: 0, y: 0 };
let currentPos = { x: 0, y: 0 };

const dotSize = 12;
let timer = 0;
let startTime = 0;
let canvasWidth = 900;
let canvasHeight = 450;
const MIN_DISTANCE_FOR_NUMBERS = 35; // Distância mínima entre números

// Letra B melhorada - centralizada e maior
const easyGuidePoints = [
  // Linha vertical esquerda
  { x: 350, y: 100 },
  { x: 350, y: 250 },
  { x: 350, y: 400 },

  // Curva superior (de baixo para cima para voltar ao topo)
  { x: 350, y: 250 },
  { x: 350, y: 100 },
  { x: 450, y: 100 },
  { x: 500, y: 125 },
  { x: 520, y: 175 },
  { x: 500, y: 225 },
  { x: 450, y: 250 },
  { x: 350, y: 250 },

  // Curva inferior
  { x: 450, y: 250 },
  { x: 500, y: 275 },
  { x: 520, y: 325 },
  { x: 500, y: 375 },
  { x: 450, y: 400 },
  { x: 350, y: 400 },
];

// Letras B U Z separadas
const mediumGuidePoints = [
  // Letra B
  { x: 150, y: 150 },
  { x: 150, y: 250 },
  { x: 150, y: 350 },
  { x: 150, y: 250 },
  { x: 150, y: 150 },
  { x: 220, y: 150 },
  { x: 250, y: 170 },
  { x: 250, y: 200 },
  { x: 220, y: 220 },
  { x: 150, y: 220 },
  { x: 220, y: 220 },
  { x: 250, y: 240 },
  { x: 250, y: 330 },
  { x: 220, y: 350 },
  { x: 150, y: 350 },

  // Letra U
  { x: 350, y: 150 },
  { x: 350, y: 280 },
  { x: 360, y: 320 },
  { x: 390, y: 350 },
  { x: 430, y: 350 },
  { x: 460, y: 320 },
  { x: 470, y: 280 },
  { x: 470, y: 150 },

  // Letra Z
  { x: 570, y: 150 },
  { x: 670, y: 150 },
  { x: 570, y: 350 },
  { x: 670, y: 350 },
];

// BUZZVEL completo
const hardGuidePoints = [
  // B
  { x: 50, y: 200 },
  { x: 50, y: 250 },
  { x: 50, y: 300 },
  { x: 50, y: 250 },
  { x: 50, y: 200 },
  { x: 90, y: 200 },
  { x: 105, y: 210 },
  { x: 105, y: 225 },
  { x: 90, y: 235 },
  { x: 50, y: 235 },
  { x: 90, y: 235 },
  { x: 105, y: 245 },
  { x: 105, y: 290 },
  { x: 90, y: 300 },
  { x: 50, y: 300 },

  // U
  { x: 150, y: 200 },
  { x: 150, y: 270 },
  { x: 155, y: 290 },
  { x: 170, y: 300 },
  { x: 190, y: 300 },
  { x: 205, y: 290 },
  { x: 210, y: 270 },
  { x: 210, y: 200 },

  // Z (primeiro)
  { x: 250, y: 200 },
  { x: 300, y: 200 },
  { x: 250, y: 300 },
  { x: 300, y: 300 },

  // Z (segundo)
  { x: 340, y: 200 },
  { x: 390, y: 200 },
  { x: 340, y: 300 },
  { x: 390, y: 300 },

  // V
  { x: 430, y: 200 },
  { x: 460, y: 300 },
  { x: 490, y: 200 },

  // E
  { x: 530, y: 200 },
  { x: 530, y: 250 },
  { x: 530, y: 300 },
  { x: 580, y: 300 },
  { x: 530, y: 300 },
  { x: 530, y: 250 },
  { x: 570, y: 250 },
  { x: 530, y: 250 },
  { x: 530, y: 200 },
  { x: 580, y: 200 },

  // L
  { x: 620, y: 200 },
  { x: 620, y: 300 },
  { x: 670, y: 300 },
];

// Objeto para mapear dificuldade aos pontos
const difficultyGuidePoints = {
  easy: easyGuidePoints,
  medium: mediumGuidePoints,
  hard: hardGuidePoints,
};

class Dot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  connect(px, py) {
    stroke(90);
    strokeWeight(2);
    line(this.x, this.y, px, py);
  }

  plot(fillColor, strokeColor) {
    fill(fillColor);
    stroke(strokeColor);
    strokeWeight(2);
    ellipse(this.x, this.y, dotSize);
  }

  plotText(txt, show = true) {
    if (!show) return;

    fill(50);
    stroke(255);
    strokeWeight(2);

    // Fundo branco para melhor legibilidade
    let padding = 8;
    let boxSize = 20;
    fill(255);
    noStroke();
    rect(this.x + 10, this.y - 5, boxSize, boxSize, 3);

    // Texto
    fill(50);
    noStroke();
    textSize(14);
    textAlign(LEFT, CENTER);
    text(txt, this.x + 14, this.y + 5);
  }

  within(px, py) {
    let d = dist(px, py, this.x, this.y);
    return d < dotSize * 1.5;
  }
}

function setup() {
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvasContainer");
  textFont("Times");

  // Inicializa com os pontos da dificuldade easy
  updateGuidePoints("easy");

  // Event listeners para os botões de dificuldade
  document.querySelectorAll(".difficulty").forEach((btn) => {
    btn.addEventListener("click", () => {
      let difficulty = btn.textContent.trim().toLowerCase();
      startGame(parseInt(btn.dataset.time), difficulty);
    });
  });

  // Criar botão de restart se não existir
  if (!document.getElementById("restartBtn")) {
    let controlsDiv = document.querySelector(".difficulty").parentElement;

    // Container para botões de controle
    let controlBtns = document.createElement("div");
    controlBtns.className = "flex gap-3 mt-4";
    controlBtns.innerHTML = `
      <button id="restartBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-white">
        🔄 Restart
      </button>
      <button id="toggleNumbers" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold text-white">
        🔢 Toggle Numbers
      </button>
    `;
    controlsDiv.appendChild(controlBtns);

    // Event listener para restart
    document
      .getElementById("restartBtn")
      .addEventListener("click", restartGame);

    // Event listener para toggle números
    document.getElementById("toggleNumbers").addEventListener("click", () => {
      showNumbers = !showNumbers;
      document.getElementById("toggleNumbers").textContent = showNumbers
        ? "🔢 Hide Numbers"
        : "👁️ Show Numbers";
    });
  }
}

function restartGame() {
  if (!gameStarted && !drawingCompleted && !gameOver) return;

  // Reseta todas as variáveis
  dots = [];
  currentIndex = 0;
  drawingCompleted = false;
  gameOver = false;
  gameStarted = false;

  // Reseta posições
  if (guideDots.length > 0) {
    lastPos.x = guideDots[0].x;
    lastPos.y = guideDots[0].y;
    currentPos.x = guideDots[0].x;
    currentPos.y = guideDots[0].y;
  }

  // Limpa mensagens
  document.getElementById("timer").textContent = "Select difficulty to start";
  document.getElementById("status").textContent = "";

  // Mostra instruções novamente
  if (document.getElementsByClassName("instructions")[0]) {
    document.getElementsByClassName("instructions")[0].style.display = "block";
  }

  loop();
}

function updateGuidePoints(difficulty) {
  guideDots = [];
  numberVisibility = [];
  let selectedPoints = difficultyGuidePoints[difficulty] || easyGuidePoints;

  for (let i = 0; i < selectedPoints.length; i++) {
    guideDots.push(new Dot(selectedPoints[i].x, selectedPoints[i].y));
  }

  // Calcular quais números devem ser mostrados
  calculateNumberVisibility();

  if (guideDots.length > 0) {
    lastPos.x = guideDots[0].x;
    lastPos.y = guideDots[0].y;
    currentPos.x = guideDots[0].x;
    currentPos.y = guideDots[0].y;
  }
}

function calculateNumberVisibility() {
  numberVisibility = new Array(guideDots.length).fill(false);

  if (guideDots.length === 0) return;

  // Sempre mostra o primeiro e o último
  numberVisibility[0] = true;
  numberVisibility[guideDots.length - 1] = true;

  // Pontos estratégicos para cada dificuldade
  let strategicPoints = [];

  if (currentDifficulty === "easy") {
    // Para a letra B, mostrar pontos-chave das curvas
    strategicPoints = [0, 2, 5, 7, 10, 13, 15];
  } else if (currentDifficulty === "medium") {
    // Para BUZ, mostrar início de cada letra
    strategicPoints = [0, 15, 23];
  } else if (currentDifficulty === "hard") {
    // Para BUZZVEL, mostrar início de cada letra
    strategicPoints = [0, 15, 24, 28, 32, 39, 50];
  }

  // Marca os pontos estratégicos
  for (let point of strategicPoints) {
    if (point < guideDots.length) {
      numberVisibility[point] = true;
    }
  }

  // Adiciona alguns pontos intermediários se estiverem longe o suficiente
  for (let i = 1; i < guideDots.length - 1; i++) {
    if (!numberVisibility[i]) {
      let showThis = true;

      // Verifica distância dos pontos já visíveis
      for (let j = 0; j < guideDots.length; j++) {
        if (numberVisibility[j] && i !== j) {
          let d = dist(
            guideDots[i].x,
            guideDots[i].y,
            guideDots[j].x,
            guideDots[j].y
          );
          if (d < MIN_DISTANCE_FOR_NUMBERS) {
            showThis = false;
            break;
          }
        }
      }

      if (showThis && i % 3 === 0) {
        // Mostra a cada 3 pontos se houver espaço
        numberVisibility[i] = true;
      }
    }
  }
}

function startGame(timeLimit, difficulty) {
  currentDifficulty = difficulty;
  updateGuidePoints(difficulty);

  dots = [];
  currentIndex = 0;
  drawingCompleted = false;
  gameOver = false;
  gameStarted = true;
  timer = timeLimit;
  startTime = millis();

  if (guideDots.length > 0) {
    lastPos.x = guideDots[0].x;
    lastPos.y = guideDots[0].y;
    currentPos.x = guideDots[0].x;
    currentPos.y = guideDots[0].y;
  }

  document.getElementById("timer").textContent = `Time: ${timer}s`;
  document.getElementById("status").textContent = "";

  // Mostra qual desenho deve ser feito
  let drawingName = {
    easy: "Letter B",
    medium: "Letters BUZ",
    hard: "Word BUZZVEL",
  };
  document.getElementById(
    "status"
  ).textContent = `Draw: ${drawingName[difficulty]}`;

  loop();
}

function draw() {
  background(222);

  // Desenha linhas guia transparentes (opcional - para ajudar o jogador)
  if (gameStarted && !drawingCompleted && !gameOver) {
    stroke(200, 200, 200, 50);
    strokeWeight(1);
    for (let i = 0; i < guideDots.length - 1; i++) {
      line(
        guideDots[i].x,
        guideDots[i].y,
        guideDots[i + 1].x,
        guideDots[i + 1].y
      );
    }
  }

  // Desenha os pontos guia
  for (let i = 0; i < guideDots.length; i++) {
    if (i === currentIndex && !drawingCompleted) {
      // Destaca o próximo ponto com animação
      let pulse = sin(frameCount * 0.1) * 3;
      fill(255, 100, 100);
      stroke(255, 50, 50);
      strokeWeight(3);
      ellipse(guideDots[i].x, guideDots[i].y, dotSize + pulse);
    } else if (i < currentIndex) {
      // Pontos já conectados
      guideDots[i].plot(color(100, 200, 100), color(50, 150, 50));
    } else {
      // Pontos ainda não conectados
      guideDots[i].plot(color(200, 200, 200), color(160));
    }

    // Mostra apenas números estratégicos
    if (showNumbers && numberVisibility[i]) {
      guideDots[i].plotText(i + 1);
    }

    // Sempre mostra o número do ponto atual (mesmo se números estão ocultos)
    if (i === currentIndex && !drawingCompleted && gameStarted) {
      guideDots[i].plotText(i + 1, true);
    }
  }

  // Desenha os pontos conectados pelo usuário
  for (let i = 0; i < dots.length; i++) {
    dots[i].plot(color(50, 150, 250), color(30, 100, 200));
    if (i > 0) {
      stroke(30, 100, 200);
      strokeWeight(3);
      line(dots[i].x, dots[i].y, dots[i - 1].x, dots[i - 1].y);
    }
  }

  if (!gameStarted) {
    // Mensagem inicial
    fill(100);
    textSize(20);
    textStyle(NORMAL);
    textAlign(CENTER);
    text("Choose a difficulty to start!", width / 2, height / 2);
    return;
  }

  let elapsed = floor((millis() - startTime) / 1000);
  let remaining = timer - elapsed;
  document.getElementById("timer").textContent = `Time: ${max(remaining, 0)}s`;

  if (gameStarted && document.getElementsByClassName("instructions")[0]) {
    document.getElementsByClassName("instructions")[0].style.display = "none";
  }

  if (remaining <= 0 && !drawingCompleted) {
    gameOver = true;
    gameStarted = false;
    fill(255, 50, 50);
    textSize(32);
    textStyle(BOLD);
    textAlign(CENTER);
    text("⏰ Time Up! Try again!", width / 2, height / 2);
    textSize(20);
    textStyle(NORMAL);
    text("Press Restart to try again", width / 2, height / 2 + 40);
    noLoop();
    return;
  }

  if (currentIndex === 0 && !drawingCompleted && gameStarted) {
    fill(255, 100, 100);
    stroke(255);
    strokeWeight(1);
    textSize(20);
    textStyle(BOLD);
    textAlign(CENTER);
    text("Click on the red point to start!", width / 2, 50);
  } else if (!drawingCompleted && gameStarted) {
    // Linha tracejada do último ponto até o mouse
    stroke(100, 150, 200, 150);
    strokeWeight(2);
    setLineDash([5, 5]);
    line(lastPos.x, lastPos.y, currentPos.x, currentPos.y);
    setLineDash([]);

    // Instrução para o próximo ponto
    textAlign(CENTER);
    fill(90);
    textSize(18);
    strokeWeight(1);
    textStyle(NORMAL);
    text(`Connect to point ${currentIndex + 1}`, width / 2, 50);

    // Mostra progresso
    let progress = floor((currentIndex / guideDots.length) * 100);
    textSize(16);
    fill(100);
    text(`Progress: ${progress}%`, width / 2, 75);
  } else if (drawingCompleted) {
    fillVertex();
    fill(50, 200, 50);
    stroke(255);
    strokeWeight(2);
    textSize(28);
    textStyle(BOLD);
    textAlign(CENTER);

    let message = {
      easy: "🎉 Perfect B! Well done!",
      medium: "🎉 BUZ completed! Amazing!",
      hard: "🎉 BUZZVEL mastered! Incredible!",
    };

    text(message[currentDifficulty], width / 2, height / 2);
    let timeTaken = floor((millis() - startTime) / 1000);
    textSize(20);
    textStyle(NORMAL);
    text(`Time: ${timeTaken}s`, width / 2, height / 2 + 35);
    textSize(18);
    text("Press Restart to play again!", width / 2, height / 2 + 65);
    noLoop();
  }
}

function fillVertex() {
  // Para o modo medium e hard, não preenche (pois são letras separadas)
  if (currentDifficulty !== "easy") return;

  stroke(90);
  strokeWeight(2);
  fill(100, 150, 255, 120);
  beginShape();
  for (let i = 0; i < dots.length; i++) {
    vertex(dots[i].x, dots[i].y);
  }
  endShape(CLOSE);
}

function mousePressed() {
  if (!gameStarted || drawingCompleted || gameOver) return;
  currentPos.x = mouseX;
  currentPos.y = mouseY;
  if (guideDots[currentIndex].within(mouseX, mouseY)) {
    dots.push(new Dot(guideDots[currentIndex].x, guideDots[currentIndex].y));
    currentIndex++;
    lastPos.x = guideDots[currentIndex - 1].x;
    lastPos.y = guideDots[currentIndex - 1].y;
    if (currentIndex === guideDots.length) {
      drawingCompleted = true;
    }
  }
}

function mouseMoved() {
  if (gameStarted && !drawingCompleted && !gameOver) {
    currentPos.x = mouseX;
    currentPos.y = mouseY;
  }
}

function setLineDash(pattern) {
  drawingContext.setLineDash(pattern);
}
