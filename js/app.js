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
  if (video.videoWidth === 0) return;

  // video → 1フレームを img にコピー
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
