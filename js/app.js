const video = document.getElementById('camera');
const stillImage = document.getElementById('stillImage');
const overlay = document.getElementById('overlay');

const videoModeBtn = document.getElementById('videoModeBtn');
const stillModeBtn = document.getElementById('stillModeBtn');

// ------------------------------
// カメラ起動
// ------------------------------
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false
  });
  video.srcObject = stream;
}
startCamera();

// ------------------------------
// モード切替
// ------------------------------
stillModeBtn.addEventListener('click', () => {
  if (camera.videoWidth === 0) return;

  const canvas = document.createElement('canvas');
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  canvas.getContext('2d').drawImage(camera, 0, 0);

  stillImage.src = canvas.toDataURL('image/png');
  camera.pause();
  camera.style.display = 'none';
  stillImage.style.display = 'block';
});


videoModeBtn.addEventListener('click', () => {
  stillImage.style.display = 'none';
  camera.style.display = 'block';
  camera.play();
});


// ------------------------------
// オーバーレイ操作（移動・拡大・回転）
// ------------------------------
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;
let scale = 1;
let rotation = 0;

function setTransform() {
  overlay.style.transform =
    `translate(${currentX}px, ${currentY}px)` +
    ` translate(-50%, -50%)` +
    ` rotate(${rotation}deg)` +
    ` scale(${scale})`;
}

// 移動
overlay.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  setTransform();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// 拡大縮小・回転
overlay.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.shiftKey) {
    rotation += e.deltaY * 0.1;
  } else {
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(0.1, scale), 5);
  }
  setTransform();
});

setTransform();

// ==============================
// タッチ操作（Android / タブレット）
// ==============================

let lastTouchDistance = 0;
let lastTouchAngle = 0;

overlay.addEventListener('touchstart', (e) => {
  e.preventDefault();

  if (e.touches.length === 1) {
    // 1本指ドラッグ（移動）
    isDragging = true;
    startX = e.touches[0].clientX - currentX;
    startY = e.touches[0].clientY - currentY;
  }

  if (e.touches.length === 2) {
    // 2本指操作 初期化
    lastTouchDistance = getDistance(e.touches);
    lastTouchAngle = getAngle(e.touches);
  }
}, { passive: false });

overlay.addEventListener('touchmove', (e) => {
  e.preventDefault();

  if (e.touches.length === 1 && isDragging) {
    // 移動
    currentX = e.touches[0].clientX - startX;
    currentY = e.touches[0].clientY - startY;
    setTransform();
  }

  if (e.touches.length === 2) {
    // 拡大縮小 + 回転
    const newDistance = getDistance(e.touches);
    const newAngle = getAngle(e.touches);

    // スケール
    scale *= newDistance / lastTouchDistance;
    scale = Math.min(Math.max(0.1, scale), 5);

    // 回転
    rotation += newAngle - lastTouchAngle;

    lastTouchDistance = newDistance;
    lastTouchAngle = newAngle;

    setTransform();
  }
}, { passive: false });

overlay.addEventListener('touchend', () => {
  isDragging = false;
});

// ------------------------------
// タッチ用ユーティリティ
// ------------------------------
function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getAngle(touches) {
  const dx = touches[1].clientX - touches[0].clientX;
  const dy = touches[1].clientY - touches[0].clientY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}
