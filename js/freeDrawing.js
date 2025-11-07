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

// Zoom and Pan state
let zoomLevel = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;
let minZoom = 0.1;
let maxZoom = 10.0;

// Touch gesture state
let lastTouchDist = 0;
let lastTouchMidpoint = { x: 0, y: 0 };
let lastTapTime = 0;
let doubleTapThreshold = 300; // milliseconds

let colorPicker, sizeSlider, sizeDisplay, eraserBtn, clearBtn, saveBtn;
let undoBtn, redoBtn, symmetryBtn, replayBtn;
let zoomInBtn, zoomOutBtn, zoomResetBtn, zoomDisplay;

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

  // Setup zoom controls
  zoomInBtn = document.getElementById("zoomInBtn");
  zoomOutBtn = document.getElementById("zoomOutBtn");
  zoomResetBtn = document.getElementById("zoomResetBtn");
  zoomDisplay = document.getElementById("zoomDisplay");

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => zoomBy(1.2));
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => zoomBy(0.8));
  }

  if (zoomResetBtn) {
    zoomResetBtn.addEventListener("click", resetZoom);
  }

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    // Space key for pan mode
    if (e.code === "Space" && !isDrawing) {
      e.preventDefault();
      cursor(MOVE);
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      updateCursor();
    }
  });

  if (sizeDisplay) sizeDisplay.textContent = `Size: ${brushSize}px`;

  updateCursor();
  updateZoomDisplay();
}

function draw() {
  background(255);

  // Apply zoom and pan transformations
  push();
  translate(panX, panY);
  scale(zoomLevel);
  image(canvasGraphics, 0, 0);
  pop();
}

function pointerInsideCanvas(px, py) {
  return px >= 0 && px <= width && py >= 0 && py <= height;
}

// Transform screen coordinates to canvas coordinates
function screenToCanvas(screenX, screenY) {
  const canvasX = (screenX - panX) / zoomLevel;
  const canvasY = (screenY - panY) / zoomLevel;
  return { x: canvasX, y: canvasY };
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
    // Middle mouse button (button 1) or space key for panning
    if (mouseButton === CENTER || keyIsDown(32)) {
      isPanning = true;
      lastPanX = mouseX;
      lastPanY = mouseY;
      cursor(MOVE);
      return;
    }

    // Transform coordinates for drawing
    const canvasCoords = screenToCanvas(mouseX, mouseY);
    startStroke(canvasCoords.x, canvasCoords.y);
  }
}

function mouseDragged() {
  // Handle panning
  if (isPanning) {
    const dx = mouseX - lastPanX;
    const dy = mouseY - lastPanY;
    panX += dx;
    panY += dy;
    lastPanX = mouseX;
    lastPanY = mouseY;
    return;
  }

  // Handle drawing
  if (!isDrawing) return;
  if (!pointerInsideCanvas(mouseX, mouseY)) {
    return;
  }

  const canvasCoords = screenToCanvas(mouseX, mouseY);
  extendStroke(canvasCoords.x, canvasCoords.y);
}
function mouseReleased() {
  if (isPanning) {
    isPanning = false;
    updateCursor();
    return;
  }
  if (isDrawing) endStroke();
}

function touchStarted() {
  if (!touches || touches.length === 0) return;

  // Two-finger gesture (pinch-to-zoom or pan)
  if (touches.length === 2) {
    const t1 = touches[0];
    const t2 = touches[1];

    // Calculate initial distance and midpoint
    lastTouchDist = dist(t1.x, t1.y, t2.x, t2.y);
    lastTouchMidpoint = {
      x: (t1.x + t2.x) / 2,
      y: (t1.y + t2.y) / 2,
    };

    // End any current drawing
    if (isDrawing) endStroke();
    return false;
  }

  // Single touch - check for double-tap or draw
  const t = touches[0];
  if (pointerInsideCanvas(t.x, t.y)) {
    const currentTime = millis();
    const timeSinceLastTap = currentTime - lastTapTime;

    // Double-tap detection
    if (timeSinceLastTap < doubleTapThreshold) {
      // Double-tap: zoom in on tap location
      const beforeZoomX = (t.x - panX) / zoomLevel;
      const beforeZoomY = (t.y - panY) / zoomLevel;

      zoomLevel = constrain(zoomLevel * 2, minZoom, maxZoom);

      panX = t.x - beforeZoomX * zoomLevel;
      panY = t.y - beforeZoomY * zoomLevel;

      updateZoomDisplay();
      lastTapTime = 0; // Reset to prevent triple-tap
      return false;
    }

    lastTapTime = currentTime;

    // Start drawing
    const canvasCoords = screenToCanvas(t.x, t.y);
    startStroke(canvasCoords.x, canvasCoords.y);
    return false;
  }
}
function touchMoved() {
  if (!touches || touches.length === 0) return;

  // Two-finger gesture: pinch-to-zoom and pan
  if (touches.length === 2) {
    const t1 = touches[0];
    const t2 = touches[1];

    // Calculate current distance and midpoint
    const currentDist = dist(t1.x, t1.y, t2.x, t2.y);
    const currentMidpoint = {
      x: (t1.x + t2.x) / 2,
      y: (t1.y + t2.y) / 2,
    };

    if (lastTouchDist > 0) {
      // Pinch-to-zoom: calculate zoom based on distance change
      const zoomFactor = currentDist / lastTouchDist;

      // Get midpoint position before zoom
      const midBeforeZoomX = (lastTouchMidpoint.x - panX) / zoomLevel;
      const midBeforeZoomY = (lastTouchMidpoint.y - panY) / zoomLevel;

      // Apply zoom
      zoomLevel = constrain(zoomLevel * zoomFactor, minZoom, maxZoom);

      // Calculate new pan to keep midpoint fixed
      panX = lastTouchMidpoint.x - midBeforeZoomX * zoomLevel;
      panY = lastTouchMidpoint.y - midBeforeZoomY * zoomLevel;

      // Apply additional pan from midpoint movement
      const midDeltaX = currentMidpoint.x - lastTouchMidpoint.x;
      const midDeltaY = currentMidpoint.y - lastTouchMidpoint.y;
      panX += midDeltaX;
      panY += midDeltaY;

      updateZoomDisplay();
    }

    // Update last values
    lastTouchDist = currentDist;
    lastTouchMidpoint = currentMidpoint;

    return false;
  }

  // Single touch: continue drawing
  if (isDrawing && touches.length === 1) {
    const t = touches[0];
    const canvasCoords = screenToCanvas(t.x, t.y);
    extendStroke(canvasCoords.x, canvasCoords.y);
    return false;
  }
}
function touchEnded() {
  // Reset touch gesture state
  if (!touches || touches.length < 2) {
    lastTouchDist = 0;
  }

  // End drawing if active
  if (isDrawing) endStroke();
}

// Mouse wheel zoom handler
function mouseWheel(event) {
  if (!pointerInsideCanvas(mouseX, mouseY)) return;

  // Prevent page scrolling
  event.preventDefault();

  // Calculate zoom factor based on scroll direction
  const zoomFactor = event.delta > 0 ? 0.9 : 1.1;

  // Get mouse position before zoom
  const mouseBeforeZoomX = (mouseX - panX) / zoomLevel;
  const mouseBeforeZoomY = (mouseY - panY) / zoomLevel;

  // Apply zoom
  zoomLevel = constrain(zoomLevel * zoomFactor, minZoom, maxZoom);

  // Adjust pan to keep mouse position fixed
  panX = mouseX - mouseBeforeZoomX * zoomLevel;
  panY = mouseY - mouseBeforeZoomY * zoomLevel;

  updateZoomDisplay();

  return false;
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

// Zoom utility functions
function zoomBy(factor) {
  const centerX = width / 2;
  const centerY = height / 2;

  // Get center position before zoom
  const centerBeforeZoomX = (centerX - panX) / zoomLevel;
  const centerBeforeZoomY = (centerY - panY) / zoomLevel;

  // Apply zoom
  zoomLevel = constrain(zoomLevel * factor, minZoom, maxZoom);

  // Adjust pan to keep center position fixed
  panX = centerX - centerBeforeZoomX * zoomLevel;
  panY = centerY - centerBeforeZoomY * zoomLevel;

  updateZoomDisplay();
}

function resetZoom() {
  zoomLevel = 1.0;
  panX = 0;
  panY = 0;
  updateZoomDisplay();
}

function updateZoomDisplay() {
  if (zoomDisplay) {
    zoomDisplay.textContent = `Zoom: ${Math.round(zoomLevel * 100)}%`;
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
