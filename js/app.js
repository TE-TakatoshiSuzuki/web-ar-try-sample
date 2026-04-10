const video = document.getElementById('camera');
const overlay = document.getElementById('overlay');

// ------------------------------
// カメラ起動（← ここは触らない）
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
// オーバーレイ操作用
// ------------------------------
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;
let scale = 1;
let rotation = 0; // ★ 回転を追加

function setTransform() {
  overlay.style.transform =
    `translate(${currentX}px, ${currentY}px)` +
    ` translate(-50%, -50%)` +
    ` rotate(${rotation}deg)` +   // ★ 回転を追加
    ` scale(${scale})`;
}

// ------------------------------
// 移動（マウスドラッグ）
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

// ------------------------------
// 拡大縮小 / 回転（ホイール）
// ------------------------------
overlay.addEventListener('wheel', (e) => {
  e.preventDefault();

  if (e.shiftKey) {
    // ★ Shift + ホイール → 回転
    rotation += e.deltaY * 0.1;
  } else {
    // ★ 通常ホイール → 拡大縮小
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(0.1, scale), 5);
  }

  setTransform();
});

// 初期反映
setTransform();