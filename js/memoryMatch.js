// Image URLs for the memory cards
// const mockImageUrls = [
//   "https://picsum.photos/id/10/150/150",
//   "https://picsum.photos/id/14/150/150",
//   "https://picsum.photos/id/20/150/150",
//   "https://picsum.photos/id/25/150/150",
//   "https://picsum.photos/id/30/150/150",
//   "https://picsum.photos/id/35/150/150",
//   "https://picsum.photos/id/40/150/150",
//   "https://picsum.photos/id/45/150/150",
//   "https://picsum.photos/id/50/150/150",
//   "https://picsum.photos/id/55/150/150",
//   "https://picsum.photos/id/60/150/150",
//   "https://picsum.photos/id/65/150/150",
// ];

const imageUrls = [
  "../assets/memoryMatch/arthur.webp",
  "../assets/memoryMatch/diego.webp",
  "../assets/memoryMatch/gean.webp",
  "../assets/memoryMatch/karina.webp",
  "../assets/memoryMatch/luiz.webp",
  "../assets/memoryMatch/m.almeida.webp",
  "../assets/memoryMatch/m.santos.webp",
  "../assets/memoryMatch/m.soares.webp",
  "../assets/memoryMatch/mauro.webp",
  "../assets/memoryMatch/pedro.webp",
  "../assets/memoryMatch/renato.webp",
  "../assets/memoryMatch/savio.webp",
  "../assets/memoryMatch/yan.webp",
  "../assets/memoryMatch/yuri.webp",
];

let images = [];

// Game state variables
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 0;
let moves = 0;
let canFlip = true;
let gameStarted = false;
let gameLevel = "easy";
let startTime = 0;

let cols = 4;
let rows = 3;
let margin = 14;
let cardWidth = 100;
let cardHeight = 100;

let canvasWidth = 890;
let canvasHeight = 450;
let aspectRatio = 0.9;

// Card class representing each memory card
class Card {
  constructor(x, y, symbolImage, id) {
    this.x = x;
    this.y = y;
    this.symbol = symbolImage;
    this.id = id;
    this.flipped = false;
    this.matched = false;
    this.justMatched = false;
    this.matchAnimationTime = 0;
  }
  draw() {
    push();
    translate(this.x, this.y);

    // Green highlight animation for newly matched cards
    if (this.justMatched) {
      let alpha = map(this.matchAnimationTime, 0, 30, 255, 100);
      stroke(0, 255, 0, alpha);
      strokeWeight(4);
      fill(0, 255, 0, alpha * 0.3);
      rect(-2, -2, cardWidth + 4, cardHeight + 4, 8);

      this.matchAnimationTime++;
      if (this.matchAnimationTime > 30) {
        this.justMatched = false;
      }
    }

    // Card background with green border for matched cards
    if (this.matched) {
      stroke(0, 200, 0);
      strokeWeight(3);
      fill(60, 120, 60);
    } else {
      stroke(50);
      strokeWeight(2);
      fill(80);
    }
    rect(0, 0, cardWidth, cardHeight, 8);

    // Display image when flipped or matched
    if (this.flipped || this.matched) {
      if (this.symbol && typeof this.symbol === "object" && this.symbol.width) {
        push();
        imageMode(CENTER);

        let padding = cardWidth * 0.08;

        let availableWidth = cardWidth - padding * 2;
        let availableHeight = cardHeight - padding * 2;

        let imgAspectRatio = this.symbol.width / this.symbol.height;
        let displayWidth, displayHeight;

        if (imgAspectRatio > availableWidth / availableHeight) {
          displayWidth = availableWidth;
          displayHeight = availableWidth / imgAspectRatio;
        } else {
          displayHeight = availableHeight;
          displayWidth = availableHeight * imgAspectRatio;
        }

        smooth();

        drawingContext.save();
        drawingContext.beginPath();
        drawingContext.roundRect(
          padding,
          padding,
          availableWidth,
          availableHeight,
          5
        );
        drawingContext.clip();

        // Desenhar imagem centralizada
        image(
          this.symbol,
          cardWidth / 2,
          cardHeight / 2,
          displayWidth,
          displayHeight
        );

        drawingContext.restore();
        pop();
      } else {
        noStroke();
        fill(200);
        textAlign(CENTER, CENTER);
        textSize(Math.min(cardWidth, cardHeight) * 0.3);
        text("?", cardWidth / 2, cardHeight / 2);
      }
    } else {
      push();
      noStroke();

      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.roundRect(0, 0, cardWidth, cardHeight, 8);
      drawingContext.clip();

      let c1 = color(0);
      let c2 = color("#C30304");

      // Loop para criar o gradiente vertical (preto para vermelho)
      for (let y = 0; y < cardHeight; y++) {
        let inter = map(y, 0, cardHeight, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(0, y, cardWidth, y);
      }

      drawingContext.restore();
      noStroke();

      fill(255, 255, 255, 200);
      textAlign(CENTER, CENTER);
      textSize(cardWidth * 0.35);
      text("?", cardWidth / 2, cardHeight / 2);
      pop();
    }

    pop();
  }
  contains(mx, my) {
    return (
      mx > this.x &&
      mx < this.x + cardWidth &&
      my > this.y &&
      my < this.y + cardHeight
    );
  }

  flip() {
    this.flipped = !this.flipped;
  }
}

// Preload all images before starting
function preload() {
  images = [];

  pixelDensity(displayDensity());

  for (let url of imageUrls) {
    let img = loadImage(url);
    images.push(img);
  }
}

let canvas;

function setup() {
  const canvasContainer = document.getElementById("canvasContainer");

  // Canvas responsivo baseado no container
  canvasWidth = min(canvasContainer.offsetWidth, 900);
  canvasHeight = canvasWidth * 0.55; // Proporção 16:9 aproximada

  canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvasContainer");
  textFont("Arial");

  // Habilitar anti-aliasing
  pixelDensity(displayDensity());
  smooth();

  // Listener de resize melhorado
  window.addEventListener("resize", () => {
    const newWidth = min(canvasContainer.offsetWidth, 900);
    if (Math.abs(newWidth - canvasWidth) > 10) {
      // Evita resize constante
      canvasWidth = newWidth;
      canvasHeight = canvasWidth * 0.55;
      resizeCanvas(canvasWidth, canvasHeight);

      // Recalcular posições dos cards se o jogo estiver ativo
      if (gameStarted) {
        recalculateCardPositions();
      }
    }
  });

  // Attach difficulty button listeners
  document.querySelectorAll(".difficulty").forEach((btn) => {
    btn.addEventListener("click", () => {
      startGame(btn.dataset.level);
    });
  });

  // Initial screen message
  background(50);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("Select a difficulty to start!", width / 2, height / 2);
  noLoop();
}

function recalculateCardPositions() {
  if (!gameStarted || cards.length === 0) return;

  // Recalcular dimensões dos cards
  cardWidth = (canvasWidth - margin * (cols + 1)) / cols;
  cardHeight = cardWidth * aspectRatio; // Cards mais altos

  // Verificar se cabe na altura disponível
  let maxHeight = (canvasHeight - margin * (rows + 1)) / rows;
  if (cardHeight > maxHeight) {
    cardHeight = maxHeight;
    cardWidth = cardHeight / aspectRatio;
  }

  // Atualizar posições dos cards existentes
  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (index < cards.length) {
        let x = margin + col * (cardWidth + margin);
        let y = margin + row * (cardHeight + margin);
        cards[index].x = x;
        cards[index].y = y;
        index++;
      }
    }
  }
}

// Start game with selected difficulty
function startGame(level) {
  gameLevel = level;
  gameStarted = true;
  matchedPairs = 0;
  moves = 0;
  flippedCards = [];
  cards = [];
  canFlip = true;
  startTime = millis();

  if (level === "easy") {
    cols = 4;
    rows = 3;
  } else if (level === "medium") {
    cols = 4;
    rows = 4;
  } else if (level === "hard") {
    cols = 6;
    rows = 4;
  } else {
    cols = 7;
    rows = 4;
  }

  totalPairs = (cols * rows) / 2;

  cardWidth = (canvasWidth - margin * (cols + 1)) / cols;
  cardHeight = cardWidth * aspectRatio;

  let maxHeight = (canvasHeight - margin * (rows + 1)) / rows;

  if (cardHeight > maxHeight) {
    // Se não couber, ajustar pela altura
    cardHeight = maxHeight;
    cardWidth = cardHeight / aspectRatio;
  }

  if (images.length < totalPairs) {
    console.warn("Not enough loaded images for the requested difficulty.");
  }

  let gridWidth = cols * cardWidth + (cols - 1) * margin;
  let gridHeight = rows * cardHeight + (rows - 1) * margin;
  let offsetX = (canvasWidth - gridWidth) / 2;
  let offsetY = (canvasHeight - gridHeight) / 2;

  // Randomize image selection for variety and create pairs and shuffle card positions
  let shuffledImages = shuffle([...images]);
  let selectedImages = shuffledImages.slice(0, totalPairs);
  let cardImages = selectedImages.concat(selectedImages);
  cardImages = shuffle(cardImages);

  let id = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let x = offsetX + col * (cardWidth + margin);
      let y = offsetY + row * (cardHeight + margin);
      let imgObj = cardImages[id];
      cards.push(new Card(x, y, imgObj, id));
      id++;
    }
  }
  updateUI();
  loop();
}

// Main draw loop
function draw() {
  background(50);

  if (!gameStarted) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Select a difficulty to start!", width / 2, height / 2);
    return;
  }

  for (let card of cards) {
    card.draw();
  }

  if (matchedPairs < totalPairs) {
    let elapsed = floor((millis() - startTime) / 1000);
    let minutes = floor(elapsed / 60);
    let seconds = elapsed % 60;

    if (minutes > 0) {
      document.getElementById(
        "timer"
      ).textContent = `Time: ${minutes}m ${seconds}s`;
    } else {
      document.getElementById("timer").textContent = `Time: ${seconds}s`;
    }
  }
}

// Handle card clicks
function mousePressed() {
  if (!gameStarted || !canFlip) return;

  for (let card of cards) {
    if (card.contains(mouseX, mouseY) && !card.flipped && !card.matched) {
      card.flip();
      flippedCards.push(card);

      if (flippedCards.length === 2) {
        moves++;
        canFlip = false;

        // Check for match
        if (flippedCards[0].symbol === flippedCards[1].symbol) {
          setTimeout(() => {
            flippedCards[0].matched = true;
            flippedCards[1].matched = true;
            flippedCards[0].justMatched = true;
            flippedCards[1].justMatched = true;
            flippedCards[0].matchAnimationTime = 0;
            flippedCards[1].matchAnimationTime = 0;
            matchedPairs++;
            flippedCards = [];
            canFlip = true;
            updateUI();
            checkWin();
          }, 500);
        } else {
          setTimeout(() => {
            flippedCards[0].flip();
            flippedCards[1].flip();
            flippedCards = [];
            canFlip = true;
          }, 1000);
        }

        updateUI();
      }

      break;
    }
  }
}

// Update game statistics display
function updateUI() {
  document.getElementById("moves").textContent = `Moves: ${moves}`;
  document.getElementById(
    "matches"
  ).textContent = `Matches: ${matchedPairs}/${totalPairs}`;
}

// Check for game completion
function checkWin() {
  if (matchedPairs === totalPairs) {
    let elapsed = floor((millis() - startTime) / 1000);
    let minutes = floor(elapsed / 60);
    let seconds = elapsed % 60;

    let timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    document.getElementById(
      "status"
    ).textContent = `🎉 You won in ${moves} moves and ${timeString}!`;
    document.getElementById("status").className =
      "mt-4 text-xl text-green-400 text-center font-bold";
    gameStarted = false;

    // Performance-based star rating
    let stars = "⭐⭐⭐";
    if (moves > totalPairs * 2) {
      stars = "⭐⭐";
    }
    if (moves > totalPairs * 3) {
      stars = "⭐";
    }

    setTimeout(() => {
      document.getElementById("status").textContent += ` ${stars}`;
    }, 500);
  }
}

// Fisher-Yates shuffle algorithm
function shuffle(array) {
  let currentIndex = array.length;
  let temporaryValue, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = floor(random() * currentIndex);
    currentIndex--;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
