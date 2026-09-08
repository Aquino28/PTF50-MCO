// ============================================================
// CCS LAB GUARDIAN
// COCO-SSD + scene persistence + unattended-item timer
// ============================================================

const statusEl = document.getElementById("status");
const statusDot = document.getElementById("statusDot");

const webcamModeBtn = document.getElementById("webcamModeBtn");
const webcamControls = document.getElementById("webcamControls");
const startWebcamBtn = document.getElementById("startWebcamBtn");
const stopWebcamBtn = document.getElementById("stopWebcamBtn");

const videoEl = document.getElementById("webcamFeed");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const stageWrapper = document.getElementById("stageWrapper");
const emptyState = document.getElementById("emptyState");

const peopleCountEl = document.getElementById("peopleCount");
const objectCountEl = document.getElementById("objectCount");
const alertCountEl = document.getElementById("alertCount");
const longestTimerEl = document.getElementById("longestTimer");

const sceneBadge = document.getElementById("sceneBadge");
const labStatusTitle = document.getElementById("labStatusTitle");
const labStatusText = document.getElementById("labStatusText");

const resultsList = document.getElementById("results");
const noResults = document.getElementById("noResults");
const watchList = document.getElementById("watchList");
const activityList = document.getElementById("activityList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// These are COCO-SSD classes that make sense for a CCS laboratory.
// The model itself still only knows its original pre-trained vocabulary.
const WATCHED_ITEMS = [
  "backpack", "book", "laptop", "cell phone",
  "keyboard", "mouse", "remote", "tv",
  "scissors", "cup", "bottle"
];

// A detection must persist for several frames before it is treated as a
// real tracked object. This helps reduce one-frame false positives.
const MIN_TRACK_SCORE = 0.55;
const REQUIRED_PERSISTENCE = 3;
const ALERT_AFTER_MS = 30000;

let model = null;
let webcamLoopRunning = false;
let webcamBusy = false;

let trackedItems = new Map();
let activity = [];
let totalAlerts = 0;

// ===== INITIALIZATION =====

async function init() {
  try {
    setStatus("Loading AI model…", "loading");

    model = await cocoSsd.load();

    webcamModeBtn.classList.add("is-active");
    webcamControls.style.display = "flex";

    setStatus(
      "AI model ready. Start the webcam to begin monitoring.","ok");

    addActivity("System","COCO-SSD model loaded successfully.");

  } catch (error) {
    console.error("Model loading error:", error);

    setStatus( "Unable to load AI model.","alert");

    addActivity("System","Model loading failed.");
  }
}

init();

// ===== UI HELPERS =====

function setStatus(message, type) {
  statusEl.textContent = message;
  statusDot.className = "status-dot";
  if (type === "ok") statusDot.classList.add("ok");
  if (type === "alert") statusDot.classList.add("alert");
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function addActivity(objectName, message) {
  activity.unshift({
    time: nowLabel(),
    objectName,
    message
  });

  activity = activity.slice(0, 12);
  renderActivity();
}

function renderActivity() {
  activityList.innerHTML = "";

  if (!activity.length) {
    activityList.innerHTML = '<li class="activity-empty">Detection activity will appear here.</li>';
    return;
  }

  activity.forEach(item => {
    const li = document.createElement("li");
    li.className = "activity-item";
    li.innerHTML =
      `<span class="activity-time">${item.time}</span>` +
      `<strong>${escapeHtml(item.objectName)}</strong> ` +
      `${escapeHtml(item.message)}`;
    activityList.appendChild(li);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===== WEBCAM MODE =====

startWebcamBtn.addEventListener("click", async () => {
  if (!model) {
    setStatus("AI model is still loading.", "loading");
    return;
  }

  try {
    setStatus("Starting camera…", "loading");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment"
      },
      audio: false
    });

    videoEl.srcObject = stream;

    videoEl.style.display = "block";
    emptyState.style.display = "none";

    startWebcamBtn.style.display = "none";
    stopWebcamBtn.style.display = "inline-block";

    stageWrapper.classList.add("is-live");

    resetTracking();

    // Make sure the video starts playing.
    await videoEl.play();

    setStatus("Live monitoring active.", "ok");

    addActivity(
      "Camera",
      "Live laboratory monitoring started."
    );

    webcamLoopRunning = true;
    webcamBusy = false;

    detectLoop();

  } catch (error) {
    console.error("Camera error:", error);

    setStatus(
      "Camera access was not available.",
      "alert"
    );

    addActivity(
      "Camera",
      "Permission or device error."
    );
  }
});


stopWebcamBtn.addEventListener("click", () => {
  stopWebcamIfRunning();

  startWebcamBtn.style.display = "inline-block";
  stopWebcamBtn.style.display = "none";

  clearVisualState();

  setStatus(
    "Webcam stopped.",
    "loading"
  );

  addActivity(
    "Camera",
    "Live laboratory monitoring stopped."
  );
});


function stopWebcamIfRunning() {
  webcamLoopRunning = false;
  webcamBusy = false;

  stageWrapper.classList.remove("is-live");

  if (videoEl.srcObject) {
    videoEl.srcObject
      .getTracks()
      .forEach(track => track.stop());

    videoEl.srcObject = null;
  }

  videoEl.pause();
}

// ===== DETECTION =====

async function detectOnce(sourceElement) {
  try {
    const predictions = await model.detect(sourceElement);
    renderPredictions(predictions, sourceElement, false);
  } catch (error) {
    console.error(error);
    setStatus("Detection error. Please try again.", "alert");
  }
}

async function detectLoop() {
  if (!webcamLoopRunning || webcamBusy) return;

  webcamBusy = true;

  try {
    const predictions = await model.detect(videoEl);
    renderPredictions(predictions, videoEl, true);
  } catch (error) {
    console.error(error);
  } finally {
    webcamBusy = false;
  }

  if (webcamLoopRunning) requestAnimationFrame(detectLoop);
}

// ===== RENDERING =====

function renderPredictions(predictions, sourceElement, isLive) {
  canvas.width = sourceElement.videoWidth || sourceElement.naturalWidth || sourceElement.width;
  canvas.height = sourceElement.videoHeight || sourceElement.naturalHeight || sourceElement.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const visible = predictions.filter(p => p.score >= MIN_TRACK_SCORE);
  const people = visible.filter(p => p.class === "person");
  const watched = visible.filter(p => WATCHED_ITEMS.includes(p.class));

  peopleCountEl.textContent = people.length;
  objectCountEl.textContent = visible.length;

  updateTrackedItems(watched, people.length, isLive);
  drawPredictions(visible);
  renderResults(visible);
  renderWatchList();
  updateDashboardStatus(people.length, watched.length);
}

function drawPredictions(predictions) {
  predictions.forEach(item => {
    const [x, y, width, height] = item.bbox;
    const tracked = trackedItems.get(item.class);
    const isAlert = tracked && tracked.alerted;

    ctx.strokeStyle = isAlert ? "#df6b71" : "#3c9b6e";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    const label =
      `${item.class} ${Math.round(item.score * 100)}%` +
      (isAlert ? " • POSSIBLY UNATTENDED" : "");

    ctx.font = "12px 'JetBrains Mono', monospace";
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = isAlert ? "#df6b71" : "#3c9b6e";
    ctx.fillRect(x, Math.max(0, y - 21), textWidth + 10, 21);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 5, Math.max(14, y - 6));
  });
}

function renderResults(predictions) {
  resultsList.innerHTML = "";

  if (!predictions.length) {
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  predictions.forEach(item => {
    const tracked = trackedItems.get(item.class);
    const isAlert = tracked && tracked.alerted;

    const li = document.createElement("li");
    li.className = "result-item" + (isAlert ? " alert" : "");

    const status = isAlert ? "⚠ WATCHING" : "● DETECTED";

    li.innerHTML =
      `<span class="result-name">${escapeHtml(item.class)} — ${status}</span>` +
      `<span class="result-confidence">${Math.round(item.score * 100)}%</span>`;

    resultsList.appendChild(li);
  });
}

// ===== PERSISTENCE / UNATTENDED LOGIC =====

function updateTrackedItems(watched, peopleCount, isLive) {
  const now = Date.now();
  const currentClasses = new Set(watched.map(item => item.class));

  watched.forEach(item => {
    const existing = trackedItems.get(item.class);

    if (!existing) {
      trackedItems.set(item.class, {
        label: item.class,
        firstSeen: now,
        lastSeen: now,
        persistence: 1,
        alerted: false,
        lastScore: item.score
      });
      return;
    }

    existing.lastSeen = now;
    existing.persistence += 1;
    existing.lastScore = item.score;

    // For a live feed, a watched object becomes "possibly unattended"
    // only after it has persisted across several frames while no person
    // is detected.
    if (
      isLive &&
      peopleCount === 0 &&
      existing.persistence >= REQUIRED_PERSISTENCE &&
      now - existing.firstSeen >= ALERT_AFTER_MS &&
      !existing.alerted
    ) {
      existing.alerted = true;
      totalAlerts += 1;
      alertCountEl.textContent = totalAlerts;
      addActivity(item.class, "has remained visible without a detected person.");
    }

    // If a person returns, resume normal monitoring.
    if (peopleCount > 0 && existing.alerted) {
      existing.alerted = false;
      existing.firstSeen = now;
      addActivity(item.class, "person detected again; alert cleared.");
    }
  });

  // Remove objects that disappeared from the scene.
  [...trackedItems.entries()].forEach(([label, item]) => {
    if (!currentClasses.has(label) && now - item.lastSeen > 1800) {
      if (item.alerted) {
        addActivity(label, "is no longer visible; monitoring ended.");
      }
      trackedItems.delete(label);
    }
  });
}

function renderWatchList() {
  const items = [...trackedItems.values()].filter(item => item.alerted);

  if (!items.length) {
    watchList.innerHTML =
      '<div class="empty-watch">No unattended items are currently being tracked.</div>';
    longestTimerEl.textContent = "00:00";
    return;
  }

  const now = Date.now();
  let longest = 0;

  watchList.innerHTML = "";

  items.forEach(item => {
    const elapsed = now - item.firstSeen;
    longest = Math.max(longest, elapsed);

    const card = document.createElement("div");
    card.className = "watch-card";

    card.innerHTML = `
      <div class="watch-main">
        <strong>⚠️ ${escapeHtml(item.label)}</strong>
        <span>Possibly unattended • ${Math.round(item.lastScore * 100)}% confidence</span>
      </div>
      <div class="timer">${formatTime(elapsed)}</div>
    `;

    watchList.appendChild(card);
  });

  longestTimerEl.textContent = formatTime(longest);
}

// Update timers even when the detection frame itself isn't changing.
setInterval(() => {
  renderWatchList();
}, 500);

// ===== DASHBOARD STATUS =====

function updateDashboardStatus(peopleCount, watchedCount) {
  const alerts = [...trackedItems.values()].filter(item => item.alerted).length;

  if (alerts > 0) {
    sceneBadge.textContent = "ATTENTION";
    sceneBadge.className = "scene-badge alert";

    labStatusTitle.textContent = "Attention required";
    labStatusText.textContent = `${alerts} item${alerts > 1 ? "s" : ""} may be unattended.`;

    setStatus("Possible unattended item detected.", "alert");
  } else if (peopleCount > 0) {
    sceneBadge.textContent = "MONITORING";
    sceneBadge.className = "scene-badge ok";

    labStatusTitle.textContent = "Normal monitoring";
    labStatusText.textContent = `${peopleCount} person${peopleCount > 1 ? "s" : ""} detected in the scene.`;

    setStatus("Live monitoring active.", "ok");
  } else if (watchedCount > 0) {
    sceneBadge.textContent = "CHECKING";
    sceneBadge.className = "scene-badge";

    labStatusTitle.textContent = "Checking scene";
    labStatusText.textContent = "Objects detected; no person is currently visible.";

    setStatus("Checking detected items.", "loading");
  } else {
    sceneBadge.textContent = "CLEAR";
    sceneBadge.className = "scene-badge ok";

    labStatusTitle.textContent = "No monitored objects";
    labStatusText.textContent = "No watched items are currently visible.";

    setStatus("Scene analyzed.", "ok");
  }
}

// ===== RESET / CLEAR =====

function resetTracking() {
  trackedItems.clear();
  totalAlerts = 0;
  alertCountEl.textContent = "0";
  longestTimerEl.textContent = "00:00";
  renderWatchList();
}

function clearVisualState() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resultsList.innerHTML = "";
  noResults.style.display = "block";
  peopleCountEl.textContent = "0";
  objectCountEl.textContent = "0";
  resetTracking();

  sceneBadge.textContent = "WAITING";
  sceneBadge.className = "scene-badge";
  labStatusTitle.textContent = "Waiting";
  labStatusText.textContent = "No scene is being analyzed.";
}

clearHistoryBtn.addEventListener("click", () => {
  activity = [];
  renderActivity();
  addActivity("System", "Activity history cleared.");
});
