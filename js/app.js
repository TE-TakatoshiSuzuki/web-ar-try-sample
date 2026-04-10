const video = document.getElementById('camera');
const overlay = document.getElementById('overlay');

// ------------------------------
// カメラ起動
// ------------------------------
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    video.srcObject = stream;
  } catch (e) {
    alert('カメラを起動できませんでした');
    console.error(e);
  }
}

startCamera();

// ------------------------------
// オーバーレイ操作用変数
// ------------------------------
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;

let scale = 1;
let rotation = 0;

let lastDistance = 0;
let lastAngle = 0;

// ------------------------------
// ユーティリティ
// ------------------------------
function setTransform() {
  overlay.style.transform =
    `translate(${currentX}px, ${currentY}px)` +
    ` translate(-50%, -50%)` +
    ` rotate(${rotation}deg)` +
    ` scale(${scale})`;
}

// ------------------------------
// マウス操作（PC）
// ------------------------------
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

// ホイールで拡大縮小
overlay.addEventListener('wheel', (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  scale = Math.min(Math.max(0.1, scale), 5);
  setTransform();
});

// ------------------------------
// タッチ操作（スマホ・タブレット）
// ------------------------------
overlay.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    startX = e.touches[0].clientX - currentX;
    startY = e.touches[0].clientY - currentY;
  }

  if (e.touches.length === 2) {
    lastDistance = getDistance(e.touches);
    lastAngle = getAngle(e.touches);
  }
});

overlay.addEventListener('touchmove', (e) => {
  e.preventDefault();

  if (e.touches.length === 1 && isDragging) {
    currentX = e.touches[0].clientX - startX;
    currentY = e.touches[0].clientY - startY;
  }

  if (e.touches.length === 2) {
    const distance = getDistance(e.touches);
    const angle = getAngle(e.touches);

    scale *= distance / lastDistance;
    rotation += angle - lastAngle;

    lastDistance = distance;
    lastAngle = angle;
  }

  setTransform();
}, { passive: false });

overlay.addEventListener('touchend', () => {
  isDragging = false;
});

// ------------------------------
// ジェスチャー計算
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

// 初期反映
setTransform();
