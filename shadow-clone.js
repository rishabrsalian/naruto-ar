const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let clonesTriggered = false;
let cloneStartTime = null;
let mask = null;
let consecutiveSealFrames = 0;

// ----------------------
// Trained gesture model & Cross Seal Detection
// ----------------------
let gestureModel = null;

async function loadGestureModel() {
  try {
    gestureModel = await tf.loadLayersModel("gesture-model.json");
    console.log("Gesture model loaded");
  } catch (e) {
    console.warn("Failed to load gesture model, geometric cross-seal will be used:", e);
  }
}

function normalizeHand(lm) {
  const w = lm[0];
  const mcp = lm[9];
  const scale =
    Math.sqrt(
      (mcp.x - w.x) ** 2 + (mcp.y - w.y) ** 2 + ((mcp.z || 0) - (w.z || 0)) ** 2
    ) || 1;

  const out = [];
  for (let i = 0; i < 21; i++) {
    out.push((lm[i].x - w.x) / scale);
    out.push((lm[i].y - w.y) / scale);
    out.push(((lm[i].z || 0) - (w.z || 0)) / scale);
  }
  return out;
}

// Geometric cross seal fallback (hands crossed in front of body)
function checkGeometricCrossSeal(left, right) {
  if (!left || !right || left.length < 21 || right.length < 21) return 0;
  const wristDist = Math.hypot(left[0].x - right[0].x, left[0].y - right[0].y);
  const knkDist = Math.hypot(left[5].x - right[5].x, left[5].y - right[5].y);

  if (wristDist < 0.28 || knkDist < 0.22) {
    const leftUp = left[8].y < left[5].y;
    const rightUp = right[8].y < right[5].y;
    if (leftUp && rightUp) return 0.98;
    if (leftUp || rightUp) return 0.88;
    return 0.75;
  }
  return 0;
}

function predictGesture(right, left) {
  if (!right || !left) {
    const confidenceEl = document.querySelector(".confidence");
    if (confidenceEl) confidenceEl.textContent = "0%";
    consecutiveSealFrames = 0;
    return false;
  }

  // 1. Geometric cross seal
  const geomScore = checkGeometricCrossSeal(left, right);

  // 2. Neural model prediction (test both hand orderings to avoid handedness inversion)
  let mlScore = 0;
  if (gestureModel) {
    try {
      const in1 = tf.tensor2d([[...normalizeHand(right), ...normalizeHand(left)]]);
      const in2 = tf.tensor2d([[...normalizeHand(left), ...normalizeHand(right)]]);
      const out1 = gestureModel.predict(in1);
      const out2 = gestureModel.predict(in2);
      const p1 = out1.dataSync()[0];
      const p2 = out2.dataSync()[0];
      mlScore = Math.max(p1, p2);
      in1.dispose();
      in2.dispose();
      out1.dispose();
      out2.dispose();
    } catch (e) {}
  }

  const prob = Math.max(geomScore, mlScore);

  const confidenceEl = document.querySelector(".confidence");
  if (confidenceEl) confidenceEl.textContent = (prob * 100).toFixed(1) + "%";

  if (prob >= 0.70) {
    consecutiveSealFrames++;
    if (consecutiveSealFrames >= 2) {
      return true;
    }
  } else {
    consecutiveSealFrames = Math.max(0, consecutiveSealFrames - 1);
  }
  return false;
}

loadGestureModel();

// ----------------------
// Custom clones
// ----------------------
const customClones = [
  { x: -100, y: 100, scale: 0.9,  delay: 850,  smokeSpawned: false },
  { x:  120, y: 100, scale: 0.85, delay: 1000, smokeSpawned: false },
  { x: -180, y: 140, scale: 0.8,  delay: 1150, smokeSpawned: false },
  { x: -140, y: 140, scale: 0.45, delay: 1180, smokeSpawned: false },
  { x:  180, y: 160, scale: 0.7,  delay: 1300, smokeSpawned: false },
  { x:  140, y: 160, scale: 0.4,  delay: 1320, smokeSpawned: false },
  { x: -250, y: 140, scale: 0.7,  delay: 1450, smokeSpawned: false },
  { x: -220, y: 140, scale: 0.35, delay: 1470, smokeSpawned: false },
  { x:  260, y: 160, scale: 0.65, delay: 1600, smokeSpawned: false },
  { x: -100, y: 150, scale: 0.6,  delay: 2000, smokeSpawned: false },
  { x:  100, y: 150, scale: 0.6,  delay: 2150, smokeSpawned: false },
];

// ----------------------
// Selfie Segmentation & Holistic
// ----------------------
const selfie = new SelfieSegmentation({
  locateFile: (f) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/${f}`,
});
selfie.setOptions({ modelSelection: 1 });
selfie.onResults((r) => (mask = r.segmentationMask));

const holistic = new Holistic({
  locateFile: (f) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${f}`,
});
holistic.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.65,
  minTrackingConfidence: 0.65
});

// ----------------------
// Camera setup
// ----------------------
const camera = new Camera(video, {
  width: 640,
  height: 480,
  onFrame: async () => {
    await selfie.send({ image: video });
    await holistic.send({ image: video });
  },
});
camera.start();

// ----------------------
// Preloaded Smoke Sprites
// ----------------------
const SMOKE_FOLDERS = ["smoke_1", "smoke_2", "smoke_3"];
const SMOKE_FRAME_COUNT = 5;
const SMOKE_DURATION = 550;
const activeSmokes = [];
const preloadedSmoke = {};

SMOKE_FOLDERS.forEach(folder => {
  preloadedSmoke[folder] = [];
  for (let i = 1; i <= SMOKE_FRAME_COUNT; i++) {
    const img = new Image();
    img.src = `assets/${folder}/${i}.png`;
    preloadedSmoke[folder].push(img);
  }
});

function spawnSmoke(x, y, scale) {
  scale *= 1.25;
  const folder =
    SMOKE_FOLDERS[Math.floor(Math.random() * SMOKE_FOLDERS.length)];
  activeSmokes.push({ x, y, scale, start: performance.now(), frames: preloadedSmoke[folder] });
}

function drawSmokes() {
  const now = performance.now();
  for (let i = activeSmokes.length - 1; i >= 0; i--) {
    const s = activeSmokes[i];
    const elapsed = now - s.start;
    const frameDuration = SMOKE_DURATION / SMOKE_FRAME_COUNT;
    const frameIndex = Math.floor(elapsed / frameDuration);

    if (frameIndex >= s.frames.length) {
      activeSmokes.splice(i, 1);
      continue;
    }

    const img = s.frames[frameIndex];
    if (img && img.complete) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(s.scale, s.scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }
  }
}

// ----------------------
// Results Loop
// ----------------------
holistic.onResults((res) => {
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw live webcam background (mirrored)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  // Trigger clones via cross seal
  if (!clonesTriggered) {
    if (predictGesture(res.rightHandLandmarks, res.leftHandLandmarks)) {
      triggerClones();
    }
  }

  // Draw Clones & Smoke
  if (clonesTriggered) {
    const now = performance.now();
    customClones.forEach((cl) => {
      if (!cl.smokeSpawned && now - cloneStartTime >= cl.delay) {
        cl.smokeSpawned = true;
        const centerX = cl.x + canvas.width / 2;
        const centerY = cl.y + canvas.height / 2 - 35;
        spawnSmoke(centerX - 15, centerY, cl.scale);
        spawnSmoke(centerX + 15, centerY, cl.scale);
      }
    });

    const person = grabPerson();
    drawClones(person);
    drawSmokes();
  }

  // Draw skeletons
  if (res.rightHandLandmarks) drawFingerSkeleton(res.rightHandLandmarks);
  if (res.leftHandLandmarks) drawFingerSkeleton(res.leftHandLandmarks);
});

// ----------------------
// Clone Renderer & Person Grabber
// ----------------------
function drawClones(person) {
  if (!person) return;
  const now = performance.now();
  const sorted = [...customClones].sort((a, b) => b.delay - a.delay);

  sorted.forEach((cl) => {
    if (now - cloneStartTime >= cl.delay) {
      ctx.save();
      ctx.translate(cl.x + canvas.width * (1 - cl.scale) / 2, cl.y);
      ctx.scale(cl.scale, cl.scale);
      ctx.drawImage(person, 0, 0);
      ctx.restore();
    }
  });

  ctx.drawImage(person, 0, 0);
}

const _cloneCanvas = document.createElement("canvas");
const _cloneCtx = _cloneCanvas.getContext("2d");

function grabPerson() {
  if (!mask) return null;
  _cloneCanvas.width = canvas.width;
  _cloneCanvas.height = canvas.height;

  _cloneCtx.save();
  _cloneCtx.scale(-1, 1);
  _cloneCtx.drawImage(mask, -canvas.width, 0, canvas.width, canvas.height);
  _cloneCtx.restore();

  _cloneCtx.globalCompositeOperation = "source-in";
  _cloneCtx.save();
  _cloneCtx.scale(-1, 1);
  _cloneCtx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  _cloneCtx.restore();
  _cloneCtx.globalCompositeOperation = "source-over";

  return _cloneCanvas;
}

// ----------------------
// Finger skeleton
// ----------------------
const FINGER_INDICES = {
  thumb:  [0, 1, 2, 3, 4],
  index:  [0, 5, 6, 7, 8],
  middle: [0, 9, 10, 11, 12],
  ring:   [0, 13, 14, 15, 16],
  pinky:  [0, 17, 18, 19, 20],
};

function drawFingerSkeleton(lm) {
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#f97316";
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 2;

  for (const indices of Object.values(FINGER_INDICES)) {
    ctx.beginPath();
    indices.forEach((i, idx) => {
      const x = (1 - lm[i].x) * canvas.width;
      const y = lm[i].y * canvas.height;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  lm.forEach((point) => {
    ctx.beginPath();
    ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  });
  ctx.restore();
}

// ----------------------
// Trigger & Reset Actions
// ----------------------
function triggerClones() {
  if (clonesTriggered) return;
  clonesTriggered = true;
  cloneStartTime = performance.now();

  const img = document.getElementById("overlayImg");
  const btn = img ? img.closest(".video-overlay-btn") : null;
  if (img) {
    img.src = "assets/state-2.png";
    img.dataset.state = "2";
  }
  if (btn) {
    btn.classList.add("pop");
    setTimeout(() => btn.classList.remove("pop"), 250);
  }
}

function resetClones() {
  clonesTriggered = false;
  cloneStartTime = null;
  customClones.forEach((cl) => (cl.smokeSpawned = false));
  activeSmokes.length = 0;
  const img = document.getElementById("overlayImg");
  if (img) {
    img.src = "assets/state-1.png";
    img.dataset.state = "1";
  }
}

// Button click & keyboard hotkeys
const overlayBtn = document.querySelector(".video-overlay-btn");
if (overlayBtn) {
  overlayBtn.addEventListener("click", triggerClones);
}

window.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key.toLowerCase() === "c") triggerClones();
  if (e.key.toLowerCase() === "r") resetClones();
});

window.onload = resetClones;
