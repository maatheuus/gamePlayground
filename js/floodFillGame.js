let canvas, ctx;
let currentImage = null;
let originalImageData = null;
let bwImageData = null;
let currentColor = "#FF5733";
let tolerance = 32;
let undoStack = [];
let redoStack = [];
let currentImageId = null;
let isLoading = false;

// Canvas dimensions (responsive)
let CANVAS_WIDTH = 890;
let CANVAS_HEIGHT = 600;

document.addEventListener("DOMContentLoaded", () => {
  initCanvas();
  setupEventListeners();
  loadFromLocalStorage();

  // Handle window resize
  window.addEventListener("resize", handleResize);
});

/**
 * Initialize the canvas and context
 */
function initCanvas() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d", { willReadFrequently: true });

  // Calculate responsive canvas size
  updateCanvasSize();

  canvas.style.display = "none";
}

/**
 * Update canvas size based on container
 */
function updateCanvasSize() {
  const container = document.getElementById("canvasContainer");
  const containerWidth = container.clientWidth - 8; // Subtract border
  const maxHeight = 600;

  // Calculate dimensions maintaining 890:600 aspect ratio
  const aspectRatio = 890 / 600;

  if (containerWidth / aspectRatio <= maxHeight) {
    CANVAS_WIDTH = containerWidth;
    CANVAS_HEIGHT = containerWidth / aspectRatio;
  } else {
    CANVAS_HEIGHT = maxHeight;
    CANVAS_WIDTH = maxHeight * aspectRatio;
  }

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

/**
 * Handle window resize
 */
function handleResize() {
  if (!originalImageData) return;

  // Store current canvas data
  const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;

  // Update canvas size
  updateCanvasSize();

  // Redraw the image at new size
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = oldWidth;
  tempCanvas.height = oldHeight;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.putImageData(currentData, 0, 0);

  // Draw scaled image
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(tempCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Update stored data
  originalImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/**
 * Setup all event listeners for UI controls
 */
function setupEventListeners() {
  // Image controls
  const sampleBtns = document.querySelectorAll(".sampleBtn");
  sampleBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const source = e.target.dataset.source;
      if (source) {
        loadSampleImage(source);
      }
    });
  });

  // Color controls
  document.getElementById("colorPicker").addEventListener("input", (e) => {
    currentColor = e.target.value;
    document.getElementById("colorHex").value = currentColor.toUpperCase();
    updateColorSwatches();
    saveSettings();
  });

  document.getElementById("colorHex").addEventListener("input", (e) => {
    let value = e.target.value;
    if (!value.startsWith("#")) value = "#" + value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      currentColor = value;
      document.getElementById("colorPicker").value = currentColor;
      updateColorSwatches();
      saveSettings();
    }
  });

  // Color palette swatches
  document.querySelectorAll(".color-swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      const color = swatch.getAttribute("data-color");
      currentColor = color;
      document.getElementById("colorPicker").value = color;
      document.getElementById("colorHex").value = color.toUpperCase();
      updateColorSwatches();
      saveSettings();
    });

    // Keyboard support for swatches
    swatch.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        swatch.click();
      }
    });
  });

  // Tolerance slider
  document.getElementById("toleranceSlider").addEventListener("input", (e) => {
    tolerance = parseInt(e.target.value);
    document.getElementById("toleranceValue").textContent = tolerance;
    saveSettings();
  });

  // Action buttons
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);
  document.getElementById("clearBtn").addEventListener("click", clearDrawing);
  document.getElementById("saveBtn").addEventListener("click", saveCanvas);

  // Canvas click/touch events
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("touchstart", handleCanvasTouchStart, {
    passive: false,
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboard);
}

/**
 * Update active state of color swatches
 */
function updateColorSwatches() {
  document.querySelectorAll(".color-swatch").forEach((swatch) => {
    if (
      swatch.getAttribute("data-color").toUpperCase() ===
      currentColor.toUpperCase()
    ) {
      swatch.classList.add("active");
    } else {
      swatch.classList.remove("active");
    }
  });
}

// =============================================
// IMAGE LOADING
// =============================================

/**
 * Load the sample coloring page image
 */
async function loadSampleImage(source) {
  await loadLocalImage(`../assets/paint/${source}.png`, "Christmas Elf");
}

/**
 * Load a local image file
 * @param {string} imagePath - Path to the local image
 * @param {string} imageName - Display name for the image
 */
async function loadLocalImage(imagePath, imageName) {
  if (isLoading) return;

  isLoading = true;
  currentImageId = imageName;
  showLoading(true);
  hidePlaceholder();

  try {
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Failed to load local image"));
      img.src = imagePath;
    });

    // Clear canvas and set white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Calculate scaling to fit image in canvas while maintaining aspect ratio
    const scale = Math.min(
      CANVAS_WIDTH / img.width,
      CANVAS_HEIGHT / img.height
    );
    const x = (CANVAS_WIDTH - img.width * scale) / 2;
    const y = (CANVAS_HEIGHT - img.height * scale) / 2;

    // Draw image centered on canvas
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Store original image data
    originalImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // For coloring pages, we don't need to apply BW filter since they're already BW
    // But we can still allow   adjustment
    bwImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Reset undo/redo stacks
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();

    // Show canvas
    canvas.style.display = "block";

    saveSettings();
  } catch (error) {
    console.error("Error loading local image:", error);
    showPlaceholder();
  } finally {
    isLoading = false;
    showLoading(false);
  }
}

// =============================================
// FLOOD FILL ALGORITHM
// =============================================

/**
 * Handle canvas click event
 * @param {MouseEvent} event - Click event
 */
function handleCanvasClick(event) {
  if (!originalImageData) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(event.clientX - rect.left);
  const y = Math.floor(event.clientY - rect.top);

  performFloodFill(x, y);
}

/**
 * Handle canvas touch event
 * @param {TouchEvent} event - Touch event
 */
function handleCanvasTouchStart(event) {
  event.preventDefault();
  if (!originalImageData) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const touch = event.touches[0];
  const x = Math.floor(touch.clientX - rect.left);
  const y = Math.floor(touch.clientY - rect.top);

  performFloodFill(x, y);
}

/**
 * Perform flood fill at the specified coordinates
 * @param {number} startX - X coordinate
 * @param {number} startY - Y coordinate
 */
function performFloodFill(startX, startY) {
  // Save state before filling
  saveToUndo();

  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imageData.data;

  // Get target color at click position
  const startPos = (startY * CANVAS_WIDTH + startX) * 4;
  const targetR = data[startPos];
  const targetG = data[startPos + 1];
  const targetB = data[startPos + 2];

  // Parse fill color
  const fillColor = tinycolor(currentColor).toRgb();

  // Check if target color is same as fill color (within tolerance)
  if (
    colorDistance(
      targetR,
      targetG,
      targetB,
      fillColor.r,
      fillColor.g,
      fillColor.b
    ) <= tolerance
  ) {
    undoStack.pop(); // Remove the state we just saved
    updateUndoRedoButtons();
    return;
  }

  // Stack-based flood fill to avoid recursion stack overflow
  const stack = [[startX, startY]];
  const visited = new Set();
  let pixelsFilled = 0;

  while (stack.length > 0) {
    const [x, y] = stack.pop();

    // Skip if out of bounds
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) continue;

    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const pos = (y * CANVAS_WIDTH + x) * 4;
    const r = data[pos];
    const g = data[pos + 1];
    const b = data[pos + 2];

    // Check if color matches target within tolerance
    if (colorDistance(r, g, b, targetR, targetG, targetB) <= tolerance) {
      // Fill pixel
      data[pos] = fillColor.r;
      data[pos + 1] = fillColor.g;
      data[pos + 2] = fillColor.b;
      data[pos + 3] = 255;
      pixelsFilled++;

      // Add neighbors to stack (4-directional)
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
  }

  if (pixelsFilled === 0) {
    undoStack.pop(); // Remove the state we just saved
    updateUndoRedoButtons();
    return;
  }

  // Apply filled image with animation
  canvas.classList.add("filling");
  setTimeout(() => canvas.classList.remove("filling"), 300);

  ctx.putImageData(imageData, 0, 0);

  // Clear redo stack when new action is performed
  redoStack = [];
  updateUndoRedoButtons();

  // Save to localStorage
  saveToLocalStorage();
}

/**
 * Calculate color distance between two RGB colors
 * @param {number} r1, g1, b1 - First color
 * @param {number} r2, g2, b2 - Second color
 * @returns {number} Distance value
 */
function colorDistance(r1, g1, b1, r2, g2, b2) {
  // Euclidean distance in RGB space
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

// =============================================
// UNDO / REDO SYSTEM
// =============================================

/**
 * Save current canvas state to undo stack
 */
function saveToUndo() {
  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  undoStack.push(imageData);

  // Limit undo stack to 10 items
  if (undoStack.length > 10) {
    undoStack.shift();
  }

  updateUndoRedoButtons();
}

/**
 * Undo last action
 */
function undo() {
  if (undoStack.length === 0) return;

  // Save current state to redo stack
  const currentState = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  redoStack.push(currentState);

  // Limit redo stack to 10 items
  if (redoStack.length > 10) {
    redoStack.shift();
  }

  // Restore previous state
  const previousState = undoStack.pop();
  ctx.putImageData(previousState, 0, 0);

  updateUndoRedoButtons();
  saveToLocalStorage();
}

/**
 * Redo last undone action
 */
function redo() {
  if (redoStack.length === 0) return;

  // Save current state to undo stack
  saveToUndo();

  // Restore next state
  const nextState = redoStack.pop();
  ctx.putImageData(nextState, 0, 0);

  // Remove the duplicate we just added
  undoStack.pop();

  updateUndoRedoButtons();
  saveToLocalStorage();
}

/**
 * Update undo/redo button states
 */
function updateUndoRedoButtons() {
  document.getElementById("undoBtn").disabled = undoStack.length === 0;
  document.getElementById("redoBtn").disabled = redoStack.length === 0;
}

/**
 * Clear drawing and reset to BW image
 */
function clearDrawing() {
  if (!originalImageData) {
    return;
  }

  if (confirm("Are you sure you want to clear all colors and reset?")) {
    saveToUndo();

    redoStack = [];
    updateUndoRedoButtons();
    saveToLocalStorage();
  }
}

// =============================================
// SAVE FUNCTIONALITY
// =============================================

/**
 * Save canvas as PNG file
 */
function saveCanvas() {
  if (!originalImageData) {
    return;
  }

  try {
    // Create download link
    const link = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    link.download = `floodfill-artwork-${timestamp}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Error saving canvas:", error);
  }
}

// =============================================
// LOCAL STORAGE
// =============================================

/**
 * Save current state to localStorage
 */
function saveToLocalStorage() {
  if (!originalImageData) return;

  try {
    const state = {
      imageId: currentImageId,
      canvasData: canvas.toDataURL("image/png"),
      color: currentColor,
      tolerance: tolerance,

      timestamp: Date.now(),
    };

    localStorage.setItem("floodFillPainter", JSON.stringify(state));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/**
 * Save settings only (without canvas data)
 */
function saveSettings() {
  try {
    const settings = JSON.parse(
      localStorage.getItem("floodFillPainter") || "{}"
    );
    settings.color = currentColor;
    settings.tolerance = tolerance;

    settings.imageId = currentImageId;
    localStorage.setItem("floodFillPainter", JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

/**
 * Load saved state from localStorage
 */
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("floodFillPainter");
    if (!saved) return;

    const state = JSON.parse(saved);

    // Restore settings
    if (state.color) {
      currentColor = state.color;
      document.getElementById("colorPicker").value = currentColor;
      document.getElementById("colorHex").value = currentColor.toUpperCase();
      updateColorSwatches();
    }

    if (state.tolerance !== undefined) {
      tolerance = state.tolerance;
      document.getElementById("toleranceSlider").value = tolerance;
      document.getElementById("toleranceValue").textContent = tolerance;
    }

    // Offer to restore canvas
    if (state.canvasData && state.timestamp) {
      const hoursSinceLastSave =
        (Date.now() - state.timestamp) / (1000 * 60 * 60);

      if (hoursSinceLastSave < 24) {
        if (confirm("Continue your previous artwork?")) {
          restoreCanvasFromData(state.canvasData, state.imageId);
        }
      }
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
  }
}

/**
 * Restore canvas from saved data URL
 * @param {string} dataUrl - Canvas data URL
 * @param {number} imageId - Image ID
 */
function restoreCanvasFromData(dataUrl, imageId) {
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    currentImageId = imageId;
    originalImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.style.display = "block";
    hidePlaceholder();
  };
  img.src = dataUrl;
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboard(event) {
  // Undo: Ctrl+Z or Cmd+Z
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key === "z" &&
    !event.shiftKey
  ) {
    event.preventDefault();
    undo();
  }

  // Redo: Shift+Ctrl+Z or Shift+Cmd+Z
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z") {
    event.preventDefault();
    redo();
  }

  // Save: Ctrl+S or Cmd+S
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();
    saveCanvas();
  }
}

// =============================================
// UI HELPERS
// =============================================

/**
 * Show/hide loading spinner
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
  const loadingContainer = document.getElementById("loadingContainer");
  const initialMessage = document.getElementById("initialMessage");
  const loadingSpinner = document.getElementById("loadingSpinner");

  if (show) {
    // Show loading container with spinner
    loadingContainer.style.display = "flex";
    initialMessage.classList.add("hidden");
    loadingSpinner.classList.remove("hidden");
    loadingSpinner.classList.add("flex");
  } else {
    // Hide entire loading container
    loadingContainer.style.display = "none";
  }
}

/**
 * Hide the placeholder message
 */
function hidePlaceholder() {
  document.getElementById("placeholder").style.display = "none";
}

/**
 * Show error placeholder message
 */
function showPlaceholder() {
  const loadingContainer = document.getElementById("loadingContainer");
  canvas.style.display = "none";

  // Hide loading container completely
  loadingContainer.style.display = "none";

  // Show error placeholder
  const placeholder = document.getElementById("placeholder");
  placeholder.classList.remove("hidden");
  placeholder.classList.add("flex");
}
