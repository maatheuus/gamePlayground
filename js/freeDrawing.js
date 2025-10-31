let canvasGraphics;
let canvasWidth = 900;
let canvasHeight = 850;

let currentColor;
let brushSize = 8;
let isErasing = false;
let symmetry = false;

let strokes = [];
let redoStack = [];

let currentStroke = null;
let isDrawing = false;

let colorPicker, sizeSlider, sizeDisplay, eraserBtn, clearBtn, saveBtn;
let undoBtn, redoBtn, symmetryBtn, replayBtn;

function setup() {
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvasContainer");

  canvasGraphics = createGraphics(canvasWidth, canvasHeight);
  canvasGraphics.pixelDensity(1);
  canvasGraphics.background(255);

  background(255);

  strokeJoin(ROUND);
  strokeCap(ROUND);

  currentColor = color("#000");
  brushSize = 8;

  colorPicker = document.getElementById("colorPicker");
  sizeSlider = document.getElementById("sizeSlider");
  sizeDisplay = document.getElementById("sizeDisplay");
  eraserBtn = document.getElementById("eraserBtn");
  clearBtn = document.getElementById("clearBtn");
  saveBtn = document.getElementById("saveBtn");
  undoBtn = document.getElementById("undoBtn");
  redoBtn = document.getElementById("redoBtn");
  symmetryBtn = document.getElementById("symmetryBtn");
  replayBtn = document.getElementById("replayBtn");

  colorPicker.addEventListener("input", (e) => {
    currentColor = color(e.target.value);
    isErasing = false;
    eraserBtn.classList.remove("ring-4", "ring-blue-300");
    updateCursor();
  });

  sizeSlider.addEventListener("input", (e) => {
    brushSize = Math.max(1, parseInt(e.target.value));
    if (sizeDisplay) sizeDisplay.textContent = `Size: ${brushSize}px`;
    updateCursor();
  });

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
    strokes = [];
    redoStack = [];
    redrawFromStrokes();
  });

  saveBtn.addEventListener("click", () => {
    saveCanvas(canvasGraphics.canvas, "my_drawing", "png");
  });

  if (undoBtn) {
    undoBtn.addEventListener("click", undo);
  }

  if (redoBtn) {
    redoBtn.addEventListener("click", redo);
  }

  if (symmetryBtn) {
    symmetryBtn.addEventListener("click", () => {
      symmetry = !symmetry;
      symmetryBtn.textContent = `🔁 Symmetry: ${symmetry ? "On" : "Off"}`;
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener("click", replayDrawing);
  }

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
  });

  if (sizeDisplay) sizeDisplay.textContent = `Size: ${brushSize}px`;

  updateCursor();
}

function draw() {
  background(255);
  image(canvasGraphics, 0, 0);
}

function pointerInsideCanvas(px, py) {
  return px >= 0 && px <= width && py >= 0 && py <= height;
}

function startStroke(x, y) {
  isDrawing = true;
  currentStroke = {
    points: [{ x, y }],
    color: isErasing ? "#ffffff" : colorToHex(currentColor),
    size: brushSize,
    isErasing,
    symmetry,
  };
}

function extendStroke(x, y) {
  if (!currentStroke) return;
  currentStroke.points.push({ x, y });
  drawStrokeSegment(
    canvasGraphics,
    currentStroke,
    currentStroke.points.length - 2
  );
}

function endStroke() {
  if (!currentStroke) return;
  strokes.push(currentStroke);
  redoStack = [];
  currentStroke = null;
  isDrawing = false;
}

function mousePressed() {
  if (pointerInsideCanvas(mouseX, mouseY)) {
    startStroke(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (!isDrawing) return;
  if (!pointerInsideCanvas(mouseX, mouseY)) {
    return;
  }
  extendStroke(mouseX, mouseY);
}
function mouseReleased() {
  if (isDrawing) endStroke();
}

function touchStarted() {
  if (touches && touches.length > 0) {
    const t = touches[0];
    if (pointerInsideCanvas(t.x, t.y)) {
      startStroke(t.x, t.y);
      return false;
    }
  }
}
function touchMoved() {
  if (touches && touches.length > 0 && isDrawing) {
    const t = touches[0];
    extendStroke(t.x, t.y);
    return false;
  }
}
function touchEnded() {
  if (isDrawing) endStroke();
}

function drawStrokeSegment(g, strokeObj, startIndex) {
  if (!strokeObj || strokeObj.points.length < 2) return;

  const p1 = strokeObj.points[startIndex];
  const p2 = strokeObj.points[startIndex + 1];
  if (!p1 || !p2) return;

  g.push();
  g.strokeWeight(strokeObj.size);
  g.strokeCap(ROUND);
  g.strokeJoin(ROUND);
  if (strokeObj.isErasing) {
    g.stroke(255);
  } else {
    g.stroke(strokeObj.color);
  }

  g.line(p1.x, p1.y, p2.x, p2.y);

  if (strokeObj.symmetry) {
    const cx = canvasWidth / 2;
    const sp1x = cx + (cx - p1.x);
    const sp2x = cx + (cx - p2.x);
    g.line(sp1x, p1.y, sp2x, p2.y);
  }

  g.pop();
}

function redrawFromStrokes() {
  canvasGraphics.clear();
  canvasGraphics.background(255);
  for (let s = 0; s < strokes.length; s++) {
    const st = strokes[s];
    if (!st || !st.points || st.points.length < 2) continue;
    for (let i = 0; i < st.points.length - 1; i++) {
      drawStrokeSegment(canvasGraphics, st, i);
    }
  }
}

function undo() {
  if (strokes.length === 0) return;
  const last = strokes.pop();
  redoStack.push(last);
  redrawFromStrokes();
}

function redo() {
  if (redoStack.length === 0) return;
  const item = redoStack.pop();
  strokes.push(item);
  for (let i = 0; i < item.points.length - 1; i++) {
    drawStrokeSegment(canvasGraphics, item, i);
  }
}

async function replayDrawing() {
  if (strokes.length === 0) return;
  canvasGraphics.clear();
  canvasGraphics.background(255);

  const prevCursor = document.body.style.pointerEvents;
  document.body.style.pointerEvents = "none";

  for (let s = 0; s < strokes.length; s++) {
    const st = strokes[s];
    for (let i = 0; i < st.points.length - 1; i++) {
      drawStrokeSegment(canvasGraphics, st, i);
      await sleep(Math.max(5, 40 - st.size));
    }
  }

  document.body.style.pointerEvents = prevCursor;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function colorToHex(c) {
  try {
    return (
      "#" +
      hex(Math.floor(red(c)), 2) +
      hex(Math.floor(green(c)), 2) +
      hex(Math.floor(blue(c)), 2)
    );
  } catch (e) {
    return c;
  }
}

function updateCursor() {
  try {
    if (isErasing) cursor("../assets/freeDrawing/eraser.cur");
    else cursor("../assets/freeDrawing/pencil.cur");
  } catch (e) {
    cursor(ARROW);
  }
}

function exportStrokesJSON() {
  const data = {
    width: canvasWidth,
    height: canvasHeight,
    strokes,
  };
  return JSON.stringify(data);
}
