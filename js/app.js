// ==============================
// DOM
// ==============================
const video = document.getElementById('camera');
const stillImage = document.getElementById('stillImage');
const overlay = document.getElementById('overlay');
const overlayFrame = document.getElementById('overlay-frame');
const videoModeBtn = document.getElementById('videoModeBtn');
const stillModeBtn = document.getElementById('stillModeBtn');


window.addEventListener('DOMContentLoaded', () => {
  overlayFrame.style.width  = overlay.naturalWidth + 'px';
  overlayFrame.style.height = overlay.naturalHeight + 'px';
  overlay.style.display = 'none';
  overlayFrame.style.display = 'none';  

  // 初期位置を強制的に反映
  setTransform();

  console.log('overlay size:',
    overlay.getBoundingClientRect().width,
    overlay.getBoundingClientRect().height
  );
});


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

  // video → canvas
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  console.log('video.videoWidth', video.videoWidth);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  // ArUco 検出
  const success = detectArucoAndScale(canvas);

  if (!success) {
    showCalibrationError('ArUcoマーカーを対象物と一緒に写してください');
    return;
  }

  const rect2 = camera.getBoundingClientRect();
  ovr_v_scale = rect2.width / video.videoWidth;

  // 成功時のみ静止画化
  hideCalibrationMessage();

  stillImage.src = canvas.toDataURL('image/png');
  // stillImage.src = document
  //   .getElementById('arucoDebugCanvas')
  //   .toDataURL('image/png');

  video.pause();
  video.style.display = 'none';
  stillImage.style.display = 'block';
  overlay.style.display = 'block';
  overlayFrame.style.display = 'block';  
});

videoModeBtn.addEventListener('click', () => {
  stillImage.style.display = 'none';
  video.style.display = 'block';
  video.play();
  overlay.style.display = 'none';
  overlayFrame.style.display = 'none';  
});

// ==============================
// 刺繍オーバーレイ 操作状態
// ==============================
let currentX = 0;//window.innerWidth / 2;
let currentY = 0;//window.innerHeight / 2;
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
setTransform();

// ==============================
// Pointer Events（PC / Android 共通）
// ==============================
overlay.addEventListener('pointerdown', (e) => {
  console.log('pointerdown on overlay', e.clientX, e.clientY);
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
  updateRealSizeLabel();
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
    scale += e.deltaY * -0.0001;
    scale = Math.min(Math.max(0.01, scale), 5);
  }
  setTransform();
  updateRealSizeLabel();
  console.log('scale', scale);
}, { passive: false });

const calibMessage = document.getElementById('calibMessage');

// design.png の実寸幅（mm）
const DESIGN_REAL_MM = 80;

const stillCanvasForDisplay =
  document.getElementById('stillCanvasForDisplay');

function showCalibrationError(msg) {
  calibMessage.textContent = msg;
  calibMessage.style.display = 'block';
}

function hideCalibrationMessage() {
  calibMessage.style.display = 'none';
}

function applyDesignScale(mmPerPx) {
  const DESIGN_MM_PER_PX = 0.1; // design.png のルール
  const TARGET_MM = 20;         // ArUco マーカー実寸

  // 今表示されている design の幅（px）
  const currentPx = overlay.naturalWidth;

  // 今の表示サイズが何mm相当か
  const currentMm = currentPx * DESIGN_MM_PER_PX;

  const targetPx = currentMm / mmPerPx;
  // 目標mmとの比率
  const ratio = targetPx / currentPx;

  // scale に累積で掛ける
  scale = ratio;

  console.log('currentPx', currentPx);
  console.log('currentMm', currentMm);
  console.log('ratio', ratio);
  console.log('overlay.naturalWidth', overlay.naturalWidth);

  setTransform();
  updateRealSizeLabel();
}

function setTransform() {
  const transform =
    `translate(${currentX}px, ${currentY}px)
      translate(-50%, -50%)
      rotate(${rotation}deg)
    scale(${scale})`;
    
  overlay.style.transform = transform;
  overlayFrame.style.transform = transform;
}

const ARUCO_SIZE_MM = 20;   // マーカー実寸
let mmPerPx = null;        // キャリブレーション結果
let ovr_v_scale = 1;

const realSizeLabel = document.getElementById('realSizeLabel');

function updateRealSizeLabel() {
  if (!mmPerPx) return;

  const rect = overlay.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const widthMm  = rect.width  * mmPerPx / ovr_v_scale;
  const heightMm = rect.height * mmPerPx;
  // console.log('----*****************************----');
  // console.log('rect.width', rect.width);
  // console.log('debugCanvas.width', debugCanvas.width);
  // console.log('video.videoWidth', video.videoWidth);
  // console.log('video.width', rect2.width);
  // console.log('sc', sc);
  // console.log('widthMm', widthMm);
  // console.log('mmPerPx', mmPerPx);
  realSizeLabel.textContent =
    `W ${widthMm.toFixed(1)} mm × H ${heightMm.toFixed(1)} mm`;
}

function detectArucoAndScale(canvas) {
  const debugCanvas = document.getElementById('arucoDebugCanvas');
  debugCanvas.width = canvas.width;
  debugCanvas.height = canvas.height;

  let src = cv.imread(canvas);

  // ArUco 準備
  const dictionary = cv.getPredefinedDictionary(cv.DICT_6X6_1000);
  const parameters = new cv.aruco_DetectorParameters();
  const refineParam = new cv.aruco_RefineParameters(10, 3, true);

  // ArucoDetector生成
  const arucoDetector = new cv.aruco_ArucoDetector(dictionary, parameters, refineParam);

  // detectMarkersからの戻り値用オブジェクト用意
  const markerCorners = new cv.MatVector();
  const rejectedCandidates = new cv.MatVector();
  const markerIds = new cv.Mat(); 
  // 検出実行
  arucoDetector.detectMarkers(src, markerCorners, markerIds, rejectedCandidates);    
  
  // 検出結果の解析
  const findMarker = [];
  // 見つかったIDのリスト
  const findMarkerIds = markerIds.data32S;
  // 見つかった件数
  const findMarkerCount = markerCorners.size();

  // ❌ 見つからない
  if (findMarkerCount === 0) {
    src.delete();
    markerIds.delete();
    return false;
  }
  else if (findMarkerCount > 1) {
    src.delete();
    markerIds.delete();
    return false;
  }

  const arArea = document.querySelector('.ar-area');

  const rect = arArea.getBoundingClientRect();
  xRatio = rect.width / canvas.width;   // ⚠️ 属性
  yRatio = rect.height / canvas.height;  // ⚠️ 属性

  
  // IDと座標情をマッチング
//  for (let i = 0; i < findMarkerCount; i++) {
    // ID
    let i = 0;
    const id = findMarkerIds[i];
    // 座標
    const mat = markerCorners.get(i);
    // x0, y0, x1, y1, x2 ,y2, x3, y3の配列となっている
    const points = mat.data32F;
    // 後の描画用にx, y, width, heightに変換
    const x = Math.min(points[0], points[2], points[4], points[6]);
    const mx = Math.max(points[0], points[2], points[4], points[6]);
    const y = Math.min(points[1], points[3], points[5], points[7]);
    const my = Math.max(points[1], points[3], points[5], points[7]);
    findMarker.push({
        id: id, x: x, y: y, width: mx -x, height: my -y
    });
    //alert('[' + points[0] + ',' + points[1] + '], ['+  points[2] + ',' + points[3] + '], ['+  points[4] + ',' + points[5] + '], ['+  points[6] + ',' + points[7] + ']' );
   // 4点の平均辺長(px)を計算
    const pts = [];
    for (let i = 0; i < 4; i++) {
      pts.push({
        x: points[i * 2],
        y: points[i * 2 + 1]
      });
    }

//  }


  let total = 0;
  for (let i = 0; i < 4; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % 4];
    total += Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }
  const markerPx = total / 4; // 1辺平均
  console.log('markerPx', markerPx);

    // 結果の表示
//  const canvas = $('#canvas')[0];

  const ctx = arucoDebugCanvas.getContext('2d');
  ctx.clearRect(0, 0, arucoDebugCanvas.width, arucoDebugCanvas.height);
  
  ctx.beginPath();
  ctx.strokeStyle = 'blue';
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.lineTo(pts[2].x, pts[2].y);
  ctx.lineTo(pts[3].x, pts[3].y);
  ctx.closePath();
  ctx.stroke();

  // マーカーID表示
  ctx.fillStyle = 'green';
  ctx.font = '12px Times New Roman';
  ctx.fillText(id, x, my + 12);

   // px → mm 換算
   mmPerPx = ARUCO_SIZE_MM / markerPx;
   // 刺繍画像に反映
   console.log('mmPerPx', mmPerPx);
   console.log('pts[0].x', pts[0].x);
   console.log('pts[0].y', pts[0].y);
   applyDesignScale(mmPerPx);
   updateRealSizeLabel();

  // 後始末
  src.delete();
  markerIds.delete();

  return true;
}

