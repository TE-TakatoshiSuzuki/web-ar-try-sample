// ==============================
// DOM
// ==============================
const video = document.getElementById('camera');
const stillImage = document.getElementById('stillImage');
const overlay = document.getElementById('overlay');
const videoModeBtn = document.getElementById('videoModeBtn');
const stillModeBtn = document.getElementById('stillModeBtn');

// ==============================
// カメラ起動
// ==============================
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    alert('カメラを起動できませんでした');
    console.error(e);
  }
}
startCamera();

// ==============================
// 動画 / 静止画 モード切替
// ==============================
stillModeBtn.addEventListener('click', () => {
  if (video.videoWidth === 0) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  stillImage.src = canvas.toDataURL('image/png');
  video.pause();

  video.style.display = 'none';
  stillImage.style.display = 'block';
});

videoModeBtn.addEventListener('click', () => {
  stillImage.style.display = 'none';
  video.style.display = 'block';
  video.play();
});

// ==============================
// 刺繍オーバーレイ 操作状態
// ==============================
let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;
let scale = 1;
let rotation = 0;

// Pointer 操作用
let pointers = new Map();
let startOffsetX = 0;
let startOffsetY = 0;
let startDistance = 0;
let startAngle = 0;
let startScale = 1;
let startRotation = 0;

// ==============================
// 描画反映
// ==============================
function setTransform() {
  overlay.style.transform =
    `translate(${currentX}px, ${currentY}px)` +
    ` translate(-50%, -50%)` +
    ` rotate(${rotation}deg)` +
    ` scale(${scale})`;
}
setTransform();

// ==============================
// Pointer Events（PC / Android 共通）
// ==============================
overlay.addEventListener('pointerdown', (e) => {
  overlay.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    startOffsetX = e.clientX - currentX;
    startOffsetY = e.clientY - currentY;
  }

  if (pointers.size === 2) {
    const pts = [...pointers.values()];
    startDistance = getDistance(pts[0], pts[1]);
    startAngle = getAngle(pts[0], pts[1]);
    startScale = scale;
    startRotation = rotation;
  }
});

overlay.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;

  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    currentX = e.clientX - startOffsetX;
    currentY = e.clientY - startOffsetY;
  }

  if (pointers.size === 2) {
    const pts = [...pointers.values()];
    const dist = getDistance(pts[0], pts[1]);
    const angle = getAngle(pts[0], pts[1]);

    scale = startScale * (dist / startDistance);
    scale = Math.min(Math.max(0.1, scale), 5);

    rotation = startRotation + (angle - startAngle);
  }

  setTransform();
});

overlay.addEventListener('pointerup', (e) => {
  pointers.delete(e.pointerId);
});

overlay.addEventListener('pointercancel', (e) => {
  pointers.delete(e.pointerId);
});

// ==============================
// ユーティリティ
// ==============================
function getDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getAngle(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

// ==============================
// PC用ホイール操作（補助）
// ==============================
overlay.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.shiftKey) {
    rotation += e.deltaY * 0.1;
  } else {
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(0.1, scale), 5);
  }
  setTransform();
}, { passive: false });
