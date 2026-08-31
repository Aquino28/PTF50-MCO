// ===== SETUP: grab all the elements we'll need, once =====

const statusEl = document.getElementById("status");
const resultsList = document.getElementById("results");

const uploadModeBtn = document.getElementById("uploadModeBtn");
const webcamModeBtn = document.getElementById("webcamModeBtn");
const uploadControls = document.getElementById("uploadControls");
const webcamControls = document.getElementById("webcamControls");
const fileInput = document.getElementById("fileInput");
const startWebcamBtn = document.getElementById("startWebcamBtn");

const imgEl = document.getElementById("labPhoto");
const videoEl = document.getElementById("webcamFeed");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

// The items we're treating as "school equipment" — see the limitation
// discussion: COCO-SSD only knows these 80 classes, nothing more specific
// like "pen" or "pencil case" exists in its vocabulary.
const WATCHED_ITEMS = [
  "backpack", "book", "laptop", "cell phone",
  "keyboard", "mouse", "scissors", "cup", "bottle"
];

let model = null;
let webcamLoopRunning = false;

// ===== LOAD THE MODEL ONCE, AS SOON AS THE PAGE OPENS =====

async function init() {
  model = await cocoSsd.load();
  statusEl.innerText = "Model loaded. Choose Upload Photo or Use Webcam.";
}

init();

// ===== MODE SWITCHING =====
// Clicking a mode button just shows/hides the right controls and stage element.
// It does NOT run detection by itself — that happens after an image loads
// or the webcam starts.

uploadModeBtn.addEventListener("click", function () {
  stopWebcamIfRunning();
  uploadControls.style.display = "block";
  webcamControls.style.display = "none";
  videoEl.style.display = "none";
  imgEl.style.display = "none"; // stays hidden until a file is actually chosen
});

webcamModeBtn.addEventListener("click", function () {
  uploadControls.style.display = "none";
  webcamControls.style.display = "block";
  imgEl.style.display = "none";
});

// ===== UPLOAD MODE =====

fileInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  // FileReader lets us read a local file the user picked and turn it
  // into a data URL string the <img> tag can display as its src.
  const reader = new FileReader();
  reader.onload = function (e) {
    imgEl.src = e.target.result;
  };
  reader.readAsDataURL(file);

  // Once the image has actually finished loading its pixels, run detection.
  // We only want to detect AFTER the image is visible and sized correctly.
  imgEl.onload = async function () {
    imgEl.style.display = "block";
    videoEl.style.display = "none";
    await detectOnce(imgEl);
  };
});

// ===== WEBCAM MODE =====

startWebcamBtn.addEventListener("click", async function () {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoEl.srcObject = stream;
  videoEl.style.display = "block";
  imgEl.style.display = "none";

  videoEl.onloadeddata = function () {
    webcamLoopRunning = true;
    detectLoop();
  };
});

function stopWebcamIfRunning() {
  webcamLoopRunning = false;
  if (videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach(function (track) { track.stop(); });
    videoEl.srcObject = null;
  }
}

// ===== SHARED DETECTION LOGIC =====
// Both modes end up calling this. It runs the model once on whatever
// source (an <img> or a <video> frame) and draws the results.

async function detectOnce(sourceElement) {
  const predictions = await model.detect(sourceElement);
  renderPredictions(predictions, sourceElement);
}

// The webcam needs to detect over and over, frame after frame, since the
// scene keeps changing live. requestAnimationFrame asks the browser to
// call this function again right before its next repaint — effectively
// creating a smooth loop synced to the browser's own refresh rate.
async function detectLoop() {
  if (!webcamLoopRunning) return;

  const predictions = await model.detect(videoEl);
  renderPredictions(predictions, videoEl);

  requestAnimationFrame(detectLoop);
}

// ===== DRAWING + "LEFT BEHIND" LOGIC =====

function renderPredictions(predictions, sourceElement) {
  // Size the canvas to match whichever source is currently active.
  canvas.width = sourceElement.videoWidth || sourceElement.width;
  canvas.height = sourceElement.videoHeight || sourceElement.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resultsList.innerHTML = "";

  const personPresent = predictions.some(function (p) { return p.class === "person"; });

  predictions.forEach(function (item) {
    const [x, y, width, height] = item.bbox;
    const isWatchedItem = WATCHED_ITEMS.includes(item.class);
    const isLeftBehind = isWatchedItem && !personPresent;

    // Green box for normal detections, red box for a flagged left-behind item.
    ctx.strokeStyle = isLeftBehind ? "#FF0000" : "#00FF00";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    const label = item.class + " " + Math.round(item.score * 100) + "%" + (isLeftBehind ? " — LEFT BEHIND?" : "");
    ctx.font = "16px Arial";
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = isLeftBehind ? "#FF0000" : "#00FF00";
    ctx.fillRect(x, y - 20, textWidth + 8, 20);
    ctx.fillStyle = "#000000";
    ctx.fillText(label, x + 4, y - 5);

    const li = document.createElement("li");
    li.innerText = label;
    resultsList.appendChild(li);
  });

  statusEl.innerText = personPresent
    ? "Person present in frame."
    : "No person detected — any watched item above is flagged as possibly left behind.";
}