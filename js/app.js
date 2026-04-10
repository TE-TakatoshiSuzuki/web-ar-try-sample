const video = document.getElementById('camera');
const overlay = document.getElementById('overlay');

if (!video || !overlay) {
  alert('HTML要素が見つかりません（camera / overlay）');
} else {
  startCamera();
}

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

// マウス移動
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

// PC拡大縮小 & 回転
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
