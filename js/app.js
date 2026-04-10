const video = document.getElementById('camera');
const overlay = document.getElementById('overlay');

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });

    video.srcObject = stream;
    await video.play(); // ← 重要
  } catch (e) {
    console.error(e);
    alert('カメラを起動できませんでした');
  }
}

startCamera();

// ------ 以下 UI 操作（問題なし） ------
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;
let scale = 1;
let rotation = 0;

function setTransform() {
  overlay.style.transform =
    `translate(${currentX}px, ${currentY}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
}

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

overlay.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (e.shiftKey) {
      rotation += e.deltaY * 0.1;
    } else {
      scale += e.deltaY * -0.001;
      scale = Math.min(Math.max(0.1, scale), 5);
    }
    setTransform();
  },
  { passive: false }
);

setTransform();
