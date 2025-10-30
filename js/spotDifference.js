// Enhanced Spot the Difference Game with Multiple Levels

// Game state
let leftImg, rightImg;
let differences = [];
let found = [];
let timer = 90;
let startTime;
let gameOver = false;
let currentLevel = 1;
let score = 0;
let hints = 3;
let showingHint = false;
let hintTimer = 0;
let wrongClicks = [];
let combo = 0;
let particles = [];

// Canvas settings
const canvasWidth = 800;
const canvasHeight = 400;
const imageWidth = 400;

// Color palette for better visuals
const colors = {
  sky: [135, 206, 250],
  ground: [34, 139, 34],
  house: [205, 133, 63],
  roof: [139, 69, 19],
  window: [173, 216, 230],
  door: [101, 67, 33],
  sun: [255, 223, 0],
  cloud: [255, 255, 255],
  flower: [255, 182, 193],
  fence: [160, 82, 45],
};

// Particle class for visual effects
class Particle {
  constructor(x, y, isCorrect) {
    this.x = x;
    this.y = y;
    this.vx = random(-3, 3);
    this.vy = random(-5, -2);
    this.size = random(3, 8);
    this.lifespan = 255;
    this.isCorrect = isCorrect;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.lifespan -= 8;
  }

  draw() {
    push();
    if (this.isCorrect) {
      fill(0, 255, 0, this.lifespan);
    } else {
      fill(255, 0, 0, this.lifespan);
    }
    noStroke();
    circle(this.x, this.y, this.size);
    pop();
  }

  isDead() {
    return this.lifespan <= 0;
  }
}

function setup() {
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvasContainer");
  noStroke();

  generateLevel(currentLevel);
  startTime = millis();
  cursor("crosshair");

  // Add restart button listener
  let restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", restartGame);
  }

  // Add hint button listener
  let hintBtn = document.getElementById("hintBtn");
  if (hintBtn) {
    hintBtn.addEventListener("click", useHint);
  }
}

function draw() {
  if (gameOver) return; // Prevent drawing if game is truly over
  background(20);

  // Draw both images
  image(leftImg, 0, 0);
  image(rightImg, imageWidth, 0);

  // Draw divider with style
  push();
  stroke(255, 255, 255, 30);
  strokeWeight(4);
  line(imageWidth, 0, imageWidth, height);
  stroke(255, 255, 255, 60);
  strokeWeight(2);
  line(imageWidth, 0, imageWidth, height);
  pop();

  // Draw found difference markers with animation
  found.forEach((f, index) => {
    push();
    let pulse = sin(frameCount * 0.1 + index) * 5 + 30;

    // Green circle with pulse effect
    fill(0, 255, 0, 100);
    stroke(0, 255, 0);
    strokeWeight(3);
    circle(f.x, f.y, pulse);

    // Checkmark instead of X
    stroke(255);
    strokeWeight(3);
    let size = 10;
    line(f.x - size / 2, f.y, f.x - size / 4, f.y + size / 2);
    line(f.x - size / 4, f.y + size / 2, f.x + size / 2, f.y - size / 2);
    pop();
  });

  // Draw hint effect
  if (showingHint && hintTimer > 0) {
    let hintDiff = differences.find(
      (d) => !found.some((f) => f.x === d.x && f.y === d.y)
    );
    if (hintDiff) {
      push();
      let pulse = sin(frameCount * 0.2) * 20 + 40;
      stroke(255, 255, 0, 150);
      strokeWeight(3);
      noFill();
      circle(hintDiff.x, hintDiff.y, pulse);
      pop();
    }
    hintTimer--;
    if (hintTimer <= 0) {
      showingHint = false;
    }
  }

  // Draw wrong click feedback
  wrongClicks = wrongClicks.filter((click) => {
    push();
    fill(255, 0, 0, click.alpha);
    noStroke();
    textSize(20);
    textAlign(CENTER, CENTER);
    text("✗", click.x, click.y);
    pop();
    click.alpha -= 5;
    return click.alpha > 0;
  });

  // Update and draw particles
  particles = particles.filter((p) => {
    p.update();
    p.draw();
    return !p.isDead();
  });

  // Update timer
  let elapsed = floor((millis() - startTime) / 1000);
  let remaining = timer - elapsed;

  // Update UI
  document.getElementById("timer").textContent = `⏰ ${max(0, remaining)}s`;
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("level").textContent = `Level ${currentLevel}`;
  document.getElementById("hints").textContent = `💡 Hints: ${hints}`;

  // Timer warning
  if (remaining <= 10 && remaining > 0 && !gameOver) {
    push();
    fill(255, 0, 0, 100 + sin(frameCount * 0.2) * 50);
    textSize(30);
    textAlign(CENTER);
    text("⚠️", width / 2, 40);
    pop();
  }

  // Check for timeout
  if (remaining <= 0 && !gameOver) {
    gameOver = true;
    document.getElementById("status").textContent = "⏰ Time's Up! Try Again!";
    document.getElementById("status").className =
      "mt-4 text-xl text-red-400 font-bold text-center";
    showGameOverEffects();
    noLoop();
    return;
  }

  // Check for win condition
  if (found.length === differences.length && !gameOver) {
    gameOver = true;
    let timeTaken = floor((millis() - startTime) / 1000);
    let timeBonus = max(0, (timer - timeTaken) * 10);
    score += timeBonus;

    document.getElementById(
      "status"
    ).textContent = `🎉 Level ${currentLevel} Complete! +${timeBonus} bonus points`;
    document.getElementById("status").className =
      "mt-4 text-xl text-green-400 font-bold text-center";

    // Next level after delay
    setTimeout(() => {
      currentLevel++;
      if (currentLevel <= 5) {
        nextLevel();
      } else {
        document.getElementById(
          "status"
        ).textContent = `🏆 Game Complete! Final Score: ${score}`;
        noLoop();
      }
    }, 2000);
  }

  // Draw progress bar
  push();
  fill(50);
  rect(10, height - 20, width - 20, 10, 5);
  fill(0, 255, 0);
  let progress = (found.length / differences.length) * (width - 20);
  rect(10, height - 20, progress, 10, 5);

  // Draw difference counter
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(
    `${found.length}/${differences.length} Differences Found`,
    width / 2,
    height - 25
  );

  // Combo indicator
  if (combo > 1) {
    push();
    let comboScale = map(min(combo, 5), 2, 5, 1, 1.5);
    textSize(20 * comboScale);
    fill(255, 255, 0);
    textAlign(CENTER);
    text(`${combo}x Combo!`, width / 2, 60);
    pop();
  }
  pop();
}

function mousePressed() {
  if (gameOver) return;

  let foundDifference = false;

  for (let i = 0; i < differences.length; i++) {
    let d = differences[i];
    // Check click on both left and right side
    let clickX = mouseX % imageWidth;
    let distance = dist(clickX, mouseY, d.x % imageWidth, d.y);

    if (distance < d.radius && !found.some((f) => f.id === i)) {
      // Use ID to track found differences
      found.push({ ...d, id: i });
      foundDifference = true;
      combo++;

      // Calculate points with combo
      let points = 100 * combo;
      score += points;

      // Create success particles at both locations
      for (let j = 0; j < 10; j++) {
        particles.push(new Particle(d.x, d.y, true));
        particles.push(new Particle(d.x - imageWidth, d.y, true));
      }

      // Success sound effect (visual feedback)
      push();
      stroke(0, 255, 0);
      strokeWeight(4);
      noFill();
      circle(d.x, d.y, 50);
      circle(d.x - imageWidth, d.y, 50);
      pop();

      return;
    }
  }

  // Wrong click
  if (
    !foundDifference &&
    mouseX > 0 &&
    mouseX < width &&
    mouseY > 0 &&
    mouseY < height
  ) {
    combo = 0;
    wrongClicks.push({ x: mouseX, y: mouseY, alpha: 255 });

    // Create error particles
    for (let j = 0; j < 5; j++) {
      particles.push(new Particle(mouseX, mouseY, false));
    }

    // Penalty
    score = max(0, score - 50);
  }
}

function useHint() {
  if (hints > 0 && !showingHint && !gameOver) {
    let unFounds = differences.filter((d, i) => !found.some((f) => f.id === i));
    if (unFounds.length > 0) {
      hints--;
      showingHint = true;
      hintTimer = 120; // Show hint for 2 seconds
      score = max(0, score - 200); // Penalty for using hint
      document.getElementById("hints").textContent = `💡 Hints: ${hints}`;
    }
  }
}

function restartGame() {
  gameOver = false;
  currentLevel = 1;
  score = 0;
  hints = 3;
  timer = 90;
  found = [];
  differences = [];
  particles = [];
  wrongClicks = [];
  combo = 0;
  showingHint = false;

  generateLevel(1);
  startTime = millis();
  document.getElementById("status").textContent = "";
  loop();
}

function nextLevel() {
  gameOver = false;
  found = [];
  differences = [];
  particles = [];
  wrongClicks = [];
  combo = 0;
  timer = max(30, 90 - (currentLevel - 1) * 10); // Less time, min 30s
  hints++; // Bonus hint for completing level

  generateLevel(currentLevel);
  startTime = millis();
  document.getElementById("status").textContent = "";
  loop();
}

function showGameOverEffects() {
  // Show remaining differences on both sides
  differences.forEach((d, i) => {
    if (!found.some((f) => f.id === i)) {
      push();
      stroke(255, 0, 0);
      strokeWeight(3);
      noFill();
      circle(d.x, d.y, 35);
      circle(d.x - imageWidth, d.y, 35);
      pop();
    }
  });
}

function generateLevel(level) {
  leftImg = createGraphics(imageWidth, canvasHeight);
  rightImg = createGraphics(imageWidth, canvasHeight);
  differences = []; // Clear previous level's differences

  // Different scenes based on level
  switch (level) {
    case 1:
      generateScene1();
      break;
    case 2:
      generateScene2();
      break;
    case 3:
      generateScene3();
      break;
    case 4:
      generateScene4();
      break;
    case 5:
      generateScene5();
      break;
    default:
      generateScene1();
  }
}

// --- REFACTORED SCENE GENERATION ---

function generateScene1() {
  // Level 1: Garden Scene (5 differences)
  const leftConfig = {
    sunOrMoon: "sun",
    showCloud1: true,
    flower1Color: colors.flower,
    showExtraWindow: false,
    tree1Size: 60,
  };
  const rightConfig = {
    sunOrMoon: "moon",
    showCloud1: false,
    flower1Color: [255, 0, 0], // Red
    showExtraWindow: true,
    tree1Size: 80, // Larger tree
  };

  drawGardenScene(leftImg, leftConfig);
  drawGardenScene(rightImg, rightConfig);

  // Define difference locations (use right image coordinates)
  differences.push({ x: 320 + imageWidth, y: 60, radius: 30 }); // 1. Moon
  differences.push({ x: 120 + imageWidth, y: 50, radius: 25 }); // 2. Missing cloud
  differences.push({ x: 150 + imageWidth, y: 320, radius: 20 }); // 3. Flower color
  differences.push({ x: 272 + imageWidth, y: 192, radius: 20 }); // 4. Extra window
  differences.push({ x: 100 + imageWidth, y: 250, radius: 40 }); // 5. Tree size
}

function generateScene2() {
  // Level 2: City Scene (6 differences)
  const leftConfig = {
    b1_y: 200,
    b1_h: 150,
    showCar1: true,
    light1Color: colors.sun,
    b2_window: "default",
    showAntenna: false,
    cloud1Shape: "default",
  };
  const rightConfig = {
    b1_y: 250, // Shorter building
    b1_h: 100,
    showCar1: false, // Missing car
    light1Color: [255, 0, 0], // Red light
    b2_window: "filled", // Window pattern change
    showAntenna: true, // Add antenna
    cloud1Shape: "square", // Cloud shape
  };

  drawCityScene(leftImg, leftConfig);
  drawCityScene(rightImg, rightConfig);

  differences.push({ x: 80 + imageWidth, y: 300, radius: 30 }); // 1. Building height
  differences.push({ x: 225 + imageWidth, y: 340, radius: 25 }); // 2. Missing car
  differences.push({ x: 300 + imageWidth, y: 280, radius: 15 }); // 3. Street light
  differences.push({ x: 160 + imageWidth, y: 190, radius: 15 }); // 4. Window
  differences.push({ x: 250 + imageWidth, y: 90, radius: 20 }); // 5. Antenna
  differences.push({ x: 330 + imageWidth, y: 55, radius: 20 }); // 6. Cloud shape
}

function generateScene3() {
  // Level 3: Beach Scene (7 differences)
  const leftConfig = {
    showCoconuts: false,
    showShell1: true,
    wavePattern: "default",
    sunRays: false,
    sailColor: [255, 255, 255],
    ballStripe: [255, 0, 0],
    crabPos: { x: 60, y: 360 },
  };
  const rightConfig = {
    showCoconuts: true,
    showShell1: false,
    wavePattern: "straight",
    sunRays: true,
    sailColor: [255, 0, 0],
    ballStripe: [0, 255, 0],
    crabPos: { x: 80, y: 360 }, // Moved crab
  };

  drawBeachScene(leftImg, leftConfig);
  drawBeachScene(rightImg, rightConfig);

  differences.push({ x: 300 + imageWidth, y: 150, radius: 15 }); // 1. Coconuts
  differences.push({ x: 190 + imageWidth, y: 347, radius: 15 }); // 2. Missing shell
  differences.push({ x: 150 + imageWidth, y: 280, radius: 20 }); // 3. Wave pattern
  differences.push({ x: 90 + imageWidth, y: 45, radius: 15 }); // 4. Sun rays
  differences.push({ x: 260 + imageWidth, y: 215, radius: 20 }); // 5. Sail color
  differences.push({ x: 120 + imageWidth, y: 320, radius: 20 }); // 6. Beach ball
  differences.push({ x: 80 + imageWidth, y: 360, radius: 15 }); // 7. Crab position
}

function generateScene4() {
  // Level 4: Forest Scene (8 differences)
  const leftConfig = {
    branchAngle: { x2: 180, y2: 170 },
    mushroomSpots: true,
    birdPos: { x: 200, y: 90 },
    leaf1Color: [34, 139, 34],
    rock1Shape: "ellipse",
    butterflyWing: "default",
    treeHole: true,
    flowerPetals: "default",
  };
  const rightConfig = {
    branchAngle: { x2: 180, y2: 160 }, // Changed angle
    mushroomSpots: false, // Missing spots
    birdPos: { x: 210, y: 90 }, // Moved bird
    leaf1Color: [255, 140, 0], // Orange leaf
    rock1Shape: "circle", // Changed rock
    butterflyWing: "filled", // Changed wing
    treeHole: false, // Missing hole
    flowerPetals: "extra", // Extra petals
  };

  drawForestScene(leftImg, leftConfig);
  drawForestScene(rightImg, rightConfig);

  differences.push({ x: 165 + imageWidth, y: 165, radius: 20 }); // 1. Branch
  differences.push({ x: 280 + imageWidth, y: 335, radius: 15 }); // 2. Mushroom
  differences.push({ x: 210 + imageWidth, y: 90, radius: 15 }); // 3. Bird
  differences.push({ x: 320 + imageWidth, y: 250, radius: 15 }); // 4. Leaf
  differences.push({ x: 100 + imageWidth, y: 360, radius: 20 }); // 5. Rock
  differences.push({ x: 250 + imageWidth, y: 140, radius: 15 }); // 6. Butterfly
  differences.push({ x: 60 + imageWidth, y: 240, radius: 15 }); // 7. Tree hole
  differences.push({ x: 350 + imageWidth, y: 330, radius: 12 }); // 8. Flower
}

function generateScene5() {
  // Level 5: Space Scene (10 differences)
  const leftConfig = {
    starConstellation: true,
    ringAngle: "default",
    rocketWindow: "default",
    asteroid1Size: 15,
    cometTail: "default",
    stationAntenna: false,
    nebulaColor: [138, 43, 226, 50],
    satellitePanel: "default",
    moonCrater: true,
    starBrightness: "default",
  };
  const rightConfig = {
    starConstellation: false, // Missing star
    ringAngle: "steep", // Changed angle
    rocketWindow: "blue", // Changed color
    asteroid1Size: 18, // Larger
    cometTail: "short", // Shorter tail
    stationAntenna: true, // Added antenna
    nebulaColor: [255, 0, 255, 50], // Pink nebula
    satellitePanel: "wide", // Wider panel
    moonCrater: false, // Missing crater
    starBrightness: "bright", // Brighter star
  };

  drawSpaceScene(leftImg, leftConfig);
  drawSpaceScene(rightImg, rightConfig);

  differences.push({ x: 90 + imageWidth, y: 110, radius: 15 }); // 1. Star
  differences.push({ x: 250 + imageWidth, y: 150, radius: 25 }); // 2. Ring
  differences.push({ x: 150 + imageWidth, y: 250, radius: 12 }); // 3. Window
  differences.push({ x: 320 + imageWidth, y: 80, radius: 15 }); // 4. Asteroid
  differences.push({ x: 65 + imageWidth, y: 185, radius: 20 }); // 5. Comet
  differences.push({ x: 280 + imageWidth, y: 242, radius: 15 }); // 6. Antenna
  differences.push({ x: 180 + imageWidth, y: 320, radius: 25 }); // 7. Nebula
  differences.push({ x: 357 + imageWidth, y: 212, radius: 15 }); // 8. Panel
  differences.push({ x: 100 + imageWidth, y: 300, radius: 12 }); // 9. Crater
  differences.push({ x: 370 + imageWidth, y: 40, radius: 10 }); // 10. Star
}

// --- REFACTORED SCENE DRAWING FUNCTIONS ---

function drawGardenScene(img, config) {
  img.background(255);

  // Sky
  img.noStroke();
  img.fill(colors.sky[0], colors.sky[1], colors.sky[2]);
  img.rect(0, 0, imageWidth, 200);

  // Sun / Moon (Difference 1)
  if (config.sunOrMoon === "sun") {
    img.fill(colors.sun[0], colors.sun[1], colors.sun[2]);
    img.circle(320, 60, 45);
  } else {
    img.fill(240, 240, 240);
    img.circle(320, 60, 45);
    img.fill(colors.sky[0], colors.sky[1], colors.sky[2]);
    img.circle(335, 60, 35);
  }

  // Clouds (Difference 2)
  img.fill(colors.cloud[0], colors.cloud[1], colors.cloud[2]);
  if (config.showCloud1) {
    img.circle(100, 50, 40);
    img.circle(120, 50, 45);
    img.circle(140, 50, 35);
  }
  img.circle(250, 80, 30);
  img.circle(270, 80, 35);

  // Ground
  img.fill(colors.ground[0], colors.ground[1], colors.ground[2]);
  img.rect(0, 200, imageWidth, 200);

  // House
  img.fill(colors.house[0], colors.house[1], colors.house[2]);
  img.rect(200, 150, 100, 100);

  // Roof
  img.fill(colors.roof[0], colors.roof[1], colors.roof[2]);
  img.triangle(190, 150, 250, 100, 310, 150);

  // Windows (Difference 4)
  img.fill(colors.window[0], colors.window[1], colors.window[2]);
  img.rect(220, 180, 25, 25);
  if (config.showExtraWindow) {
    img.rect(260, 180, 25, 25);
  }
  img.rect(220, 215, 25, 30); // This is the lower window, not the door

  // Door
  img.fill(colors.door[0], colors.door[1], colors.door[2]);
  img.rect(265, 210, 25, 40);

  // Tree (Difference 5)
  img.fill(colors.roof[0], colors.roof[1], colors.roof[2]);
  img.rect(90, 260, 20, 60);
  img.fill(colors.ground[0], colors.ground[1], colors.ground[2]);
  img.circle(100, 250, config.tree1Size); // Use config size

  // Flowers (Difference 3)
  img.fill(
    config.flower1Color[0],
    config.flower1Color[1],
    config.flower1Color[2]
  );
  img.circle(150, 320, 20); // Use config color
  img.fill(colors.flower[0], colors.flower[1], colors.flower[2]); // Reset
  img.circle(180, 315, 15);
  img.circle(350, 310, 18);

  // Fence
  img.fill(colors.fence[0], colors.fence[1], colors.fence[2]);
  for (let i = 0; i < 8; i++) {
    img.rect(30 + i * 45, 280, 8, 40);
  }
}

function drawCityScene(img, config) {
  img.background(135, 206, 250);

  // Buildings (Difference 1)
  img.fill(100, 100, 120);
  img.rect(50, config.b1_y, 60, config.b1_h); // Use config y/h
  img.rect(130, 150, 80, 200);
  img.rect(230, 180, 70, 170);
  img.rect(320, 160, 60, 190);

  // Windows (Difference 4)
  img.fill(255, 255, 200);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      img.rect(60 + i * 20, 170 + j * 30, 12, 18);
    }
  }
  // Building 2 windows
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (config.b2_window === "filled" && i === 1 && j === 0) {
        img.fill(50, 50, 60);
        img.rect(130 + 1 * 20 + 10, 150 + 1 * 30, 12, 18); // Approx location from original
        img.fill(255, 255, 200);
      } else {
        img.rect(130 + 10 + i * 20, 150 + 10 + j * 30, 12, 18);
      }
    }
  }
  // Other windows
  for (let b = 2; b < 4; b++) {
    let x = 130 + (b - 1) * 100;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        img.rect(x + 10 + i * 20, 160 + 10 + j * 30, 12, 18);
      }
    }
  }

  // Antenna (Difference 5)
  if (config.showAntenna) {
    img.stroke(200);
    img.strokeWeight(3);
    img.line(250, 100, 250, 80);
    img.noStroke();
  }

  // Street
  img.fill(80, 80, 80);
  img.rect(0, 350, imageWidth, 50);

  // Cars (Difference 2)
  if (config.showCar1) {
    img.fill(255, 0, 0);
    img.rect(200, 330, 50, 20);
  }
  img.fill(0, 0, 255);
  img.rect(100, 335, 40, 15);

  // Street lights (Difference 3)
  img.fill(150, 150, 150);
  img.rect(298, 280, 4, 70);
  img.fill(config.light1Color[0], config.light1Color[1], config.light1Color[2]);
  img.circle(300, 280, 15);

  // Clouds (Difference 6)
  img.fill(220, 220, 230);
  if (config.cloud1Shape === "default") {
    img.circle(320, 50, 30);
    img.circle(340, 50, 35);
  } else {
    img.circle(330, 55, 25);
  }
}

function drawBeachScene(img, config) {
  img.background(135, 206, 250);

  // Sun (Difference 4)
  img.fill(255, 223, 0);
  img.circle(80, 60, 50);
  if (config.sunRays) {
    img.stroke(255, 223, 0);
    img.strokeWeight(2);
    img.line(80, 50, 100, 40);
    img.line(80, 50, 100, 50);
    img.line(80, 50, 100, 60);
  }

  // Ocean
  img.noStroke();
  img.fill(30, 144, 255);
  img.rect(0, 200, imageWidth, 100);

  // Waves (Difference 3)
  img.stroke(100, 149, 237);
  img.strokeWeight(2);
  img.noFill();
  for (let i = 0; i < 8; i++) {
    if (config.wavePattern === "default" || i !== 2) {
      img.arc(50 + i * 50, 280, 40, 20, PI, TWO_PI);
    } else {
      img.line(50 + i * 50 - 20, 280, 50 + i * 50 + 20, 280);
    }
  }

  // Beach
  img.noStroke();
  img.fill(238, 203, 173);
  img.rect(0, 300, imageWidth, 100);

  // Palm tree (Difference 1)
  img.fill(101, 67, 33);
  img.rect(290, 180, 20, 120);
  img.fill(0, 128, 0);
  img.ellipse(300, 170, 80, 40);
  if (config.showCoconuts) {
    img.fill(101, 67, 33);
    img.circle(300, 150, 12);
    img.circle(290, 155, 10);
  }

  // Boat (Difference 5)
  img.fill(139, 69, 19);
  img.rect(240, 230, 40, 15);
  img.fill(config.sailColor[0], config.sailColor[1], config.sailColor[2]);
  img.triangle(250, 200, 250, 230, 270, 215);

  // Beach ball (Difference 6)
  img.fill(config.ballStripe[0], config.ballStripe[1], config.ballStripe[2]);
  img.arc(120, 320, 30, 30, PI, TWO_PI);
  img.fill(255, 255, 0);
  img.arc(120, 320, 30, 30, 0, PI);

  // Seashells (Difference 2)
  img.fill(255, 228, 196);
  if (config.showShell1) {
    img.ellipse(180, 340, 20, 15);
  }
  img.ellipse(220, 355, 15, 12);

  // Crab (Difference 7)
  img.fill(255, 99, 71);
  img.ellipse(config.crabPos.x, config.crabPos.y, 20, 15);
}

function drawForestScene(img, config) {
  img.background(135, 206, 250);

  // Trees (Difference 1, 7)
  for (let i = 0; i < 5; i++) {
    img.fill(101, 67, 33);
    img.rect(50 + i * 80, 200, 30, 150);
    img.fill(34, 139, 34);
    img.circle(65 + i * 80, 190, 70);
  }
  // Branch (Diff 1)
  img.stroke(101, 67, 33);
  img.strokeWeight(5);
  img.line(150, 180, config.branchAngle.x2, config.branchAngle.y2);
  img.noStroke();
  // Tree hole (Diff 7)
  if (config.treeHole) {
    img.fill(0);
    img.ellipse(60, 240, 15, 20);
  }

  // Forest floor
  img.fill(101, 67, 33);
  img.rect(0, 350, imageWidth, 50);

  // Mushrooms (Difference 2)
  img.fill(139, 69, 19);
  img.rect(275, 340, 10, 15);
  img.fill(255, 0, 0);
  img.arc(280, 340, 30, 25, PI, TWO_PI);
  if (config.mushroomSpots) {
    img.fill(255);
    img.circle(275, 335, 5);
    img.circle(285, 335, 5);
  }

  // Birds (Difference 3)
  img.fill(0);
  img.circle(config.birdPos.x, config.birdPos.y, 8);
  img.triangle(
    config.birdPos.x - 5,
    config.birdPos.y,
    config.birdPos.x - 8,
    config.birdPos.y + 2,
    config.birdPos.x - 8,
    config.birdPos.y - 2
  );

  // Rocks (Difference 5)
  img.fill(128, 128, 128);
  if (config.rock1Shape === "ellipse") {
    img.ellipse(100, 360, 30, 20);
  } else {
    img.circle(100, 360, 25);
  }
  img.ellipse(340, 370, 25, 18);

  // Flowers (Difference 8)
  img.fill(255, 255, 0);
  for (let i = 0; i < 6; i++) {
    let x = 50 + i * 60;
    let y = 320 + (i % 2) * 10;
    img.circle(x, y, 10);
  }
  if (config.flowerPetals === "extra") {
    img.fill(255, 255, 0);
    img.circle(350, 330, 8); // Original code was random
  }

  // Butterfly (Difference 6)
  if (config.butterflyWing === "default") {
    img.fill(255, 20, 147);
    img.ellipse(245, 140, 12, 18);
  } else {
    img.fill(255, 20, 147);
    img.ellipse(245, 140, 15, 15); // Changed shape
  }
  img.fill(255, 20, 147);
  img.ellipse(255, 140, 12, 18);

  // Leaves (Difference 4)
  img.fill(config.leaf1Color[0], config.leaf1Color[1], config.leaf1Color[2]);
  img.ellipse(320, 250, 15, 20); // Use config color
  img.fill(34, 139, 34); // Reset
  img.ellipse(120, 270, 18, 15);
}

function drawSpaceScene(img, config) {
  img.background(0, 0, 40);

  // Stars (Difference 1, 10)
  img.fill(255);
  for (let i = 0; i < 50; i++) {
    let x = (i * 37) % imageWidth;
    let y = (i * 51) % canvasHeight;
    let size = 1 + ((i * 13) % 3);
    img.circle(x, y, size);
  }
  if (config.starConstellation) {
    img.fill(255, 255, 220);
    img.circle(85, 105, 3);
    img.circle(95, 115, 2);
  }
  if (config.starBrightness === "bright") {
    img.fill(255, 255, 0);
    img.circle(370, 40, 6);
  } else {
    img.fill(255, 255, 200);
    img.circle(370, 40, 3);
  }

  // Planets (Difference 2)
  img.fill(255, 140, 0);
  img.circle(250, 150, 60);
  img.stroke(255, 215, 0, 100);
  img.strokeWeight(3);
  img.noFill();
  if (config.ringAngle === "default") {
    img.ellipse(250, 150, 90, 20);
  } else {
    img.ellipse(250, 150, 80, 30);
  }

  img.noStroke();
  img.fill(100, 149, 237);
  img.circle(100, 80, 40);

  // Rocket (Difference 3)
  img.fill(192, 192, 192);
  img.rect(140, 240, 20, 60);
  img.triangle(140, 240, 150, 220, 160, 240);
  img.fill(255, 0, 0);
  img.triangle(135, 300, 150, 320, 165, 300);
  if (config.rocketWindow === "default") {
    img.fill(135, 206, 250);
    img.circle(150, 250, 8);
  } else {
    img.fill(0, 191, 255);
    img.circle(150, 250, 10);
  }

  // Asteroids (Difference 4)
  img.fill(169, 169, 169);
  img.circle(320, 80, config.asteroid1Size);
  img.circle(50, 200, 12);
  img.circle(380, 280, 20);

  // Space station (Difference 6)
  img.fill(192, 192, 192);
  img.rect(260, 250, 40, 30);
  img.rect(250, 260, 60, 10);
  if (config.stationAntenna) {
    img.stroke(192, 192, 192);
    img.strokeWeight(2);
    img.line(280, 250, 280, 235);
    img.noStroke();
  }

  // Comet (Difference 5)
  img.fill(255);
  img.circle(50, 180, 10);
  img.stroke(255, 255, 255, 100);
  img.strokeWeight(2);
  if (config.cometTail === "default") {
    img.line(50, 180, 90, 200);
  } else {
    img.line(50, 180, 80, 190);
  }

  // Nebula (Difference 7)
  img.noStroke();
  img.fill(
    config.nebulaColor[0],
    config.nebulaColor[1],
    config.nebulaColor[2],
    config.nebulaColor[3]
  );
  img.ellipse(180, 320, 60, 40);

  // Satellite (Difference 8)
  img.fill(192, 192, 192);
  img.rect(340, 200, 30, 20);
  img.fill(0, 0, 139);
  if (config.satellitePanel === "default") {
    img.rect(335, 200, 15, 25);
    img.rect(370, 200, 15, 25);
  } else {
    img.rect(330, 200, 20, 25);
    img.rect(370, 200, 20, 25);
  }

  // Moon (Difference 9)
  img.fill(192, 192, 192);
  img.circle(100, 300, 50);
  img.fill(169, 169, 169);
  img.circle(90, 295, 8);
  if (config.moonCrater) {
    img.circle(105, 305, 6);
  }
}
