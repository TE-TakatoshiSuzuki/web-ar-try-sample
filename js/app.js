const video = document.getElementById('camera');
const overlay = document.getElementById('overlay');

// ------------------------------
// カメラ起動（← ここは「動いてた」ので触らない）
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
// オーバーレイ移動・拡大縮小用
// ------------------------------
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;
let scale = 1;

function setTransform() {
  overlay.style.transform =
    `translate(${currentX}px, ${currentY}px) translate(-50%, -50%) scale(${scale})`;
}

// 移動（マウス）
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

// 拡大縮小（ホイール）
overlay.addEventListener('wheel', (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  scale = Math.min(Math.max(0.1, scale), 5);
  setTransform();
});

// 初期反映
setTransform();