let currentColor;
let brushSize;
let isErasing = false;
let drawingHistory = [];
let maxHistorySteps = 50;
let canvasGraphics;

const canvasWidth = 900;
const canvasHeight = 450;

function setup() {
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvasContainer");

  canvasGraphics = createGraphics(canvasWidth, canvasHeight);
  canvasGraphics.background(0);

  background(0);
  strokeJoin(ROUND);
  strokeCap(ROUND);

  currentColor = color("#ff0000");
  brushSize = 8;

  saveToHistory();

  const colorPicker = document.getElementById("colorPicker");
  const sizeSlider = document.getElementById("sizeSlider");
  const sizeDisplay = document.getElementById("sizeDisplay");
  const eraserBtn = document.getElementById("eraserBtn");
  const clearBtn = document.getElementById("clearBtn");
  const saveBtn = document.getElementById("saveBtn");
  const undoBtn = document.getElementById("undoBtn");

  colorPicker.addEventListener("input", (e) => {
    currentColor = color(e.target.value);
    isErasing = false;
    eraserBtn.classList.remove("ring-4", "ring-blue-300");
    updateCursor();
  });

  sizeSlider.addEventListener("input", (e) => {
    brushSize = parseInt(e.target.value);
    if (sizeDisplay) {
      sizeDisplay.textContent = `Size: ${brushSize}px`;
    }
    updateCursor();
  });

  if (sizeDisplay) {
    sizeDisplay.textContent = `Size: ${brushSize}px`;
  }

  eraserBtn.addEventListener("click", () => {
    isErasing = !isErasing;
    if (isErasing) {
      eraserBtn.classList.add("ring-4", "ring-blue-300");
    } else {
      eraserBtn.classList.remove("ring-4", "ring-blue-300");
    }
    updateCursor();
  });

  clearBtn.addEventListener("click", () => {
    background(0);
    canvasGraphics.background(0);
    drawingHistory = [];
    saveToHistory();
  });

  saveBtn.addEventListener("click", () => {
    saveCanvas("my_drawing", "png");
  });

  if (undoBtn) {
    undoBtn.addEventListener("click", () => {
      undo();
    });
  }

  updateCursor();
}

function mouseDragged() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  if (pmouseX < 0 || pmouseX > width || pmouseY < 0 || pmouseY > height) return;

  strokeWeight(brushSize);
  stroke(isErasing ? 0 : currentColor);
  line(pmouseX, pmouseY, mouseX, mouseY);

  canvasGraphics.strokeWeight(brushSize);
  canvasGraphics.stroke(isErasing ? 0 : currentColor);
  canvasGraphics.line(pmouseX, pmouseY, mouseX, mouseY);
}

function mouseReleased() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    saveToHistory();
  }
}

function saveToHistory() {
  let imgData = get();
  drawingHistory.push(imgData);
  if (drawingHistory.length > maxHistorySteps) {
    drawingHistory.shift();
  }
}

function undo() {
  if (drawingHistory.length > 1) {
    drawingHistory.pop();
    let previousState = drawingHistory[drawingHistory.length - 1];
    image(previousState, 0, 0);
    canvasGraphics.image(previousState, 0, 0);
  }
}

function updateCursor() {
  if (isErasing) {
    cursor("crosshair");
  } else {
    cursor("crosshair");
  }
}
