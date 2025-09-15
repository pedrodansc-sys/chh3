let video, canvas, ctx;
let backgroundImage = null;
let isFrontCamera = true;
let stream = null;

document.addEventListener("DOMContentLoaded", () => {
  video = document.getElementById('webcam');
  canvas = document.getElementById('output');
  ctx = canvas.getContext('2d');

  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Access camera
  startCamera();

  // Handle background image upload
  const upload = document.getElementById('upload');
  const imageBtn = document.getElementById('imageBtn');
  imageBtn.addEventListener('click', () => upload.click());
  upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        backgroundImage = img;
      }
      img.src = URL.createObjectURL(file);
    }
  });

  // Camera toggle
  document.getElementById('cameraToggle').addEventListener('click', () => {
    isFrontCamera = !isFrontCamera;
    startCamera();
  });

  requestAnimationFrame(processFrame);
});

// Resize canvas to fit window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Start camera stream
function startCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: isFrontCamera ? 'user' : 'environment' }
  }).then(s => {
    stream = s;
    video.srcObject = s;
    video.play();
  }).catch(err => console.error('Camera error:', err));
}

// Process each video frame
function processFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  if (backgroundImage) {
    let frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = frame.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      if (isGreen(r, g, b)) {
        let x = (i / 4) % canvas.width;
        let y = Math.floor((i / 4) / canvas.width);
        // Replace with pixel from background image
        let bgX = Math.floor(x / canvas.width * backgroundImage.width);
        let bgY = Math.floor(y / canvas.height * backgroundImage.height);
        let idx = (bgY * backgroundImage.width + bgX) * 4;
        data[i] = backgroundImageData.data[idx];
        data[i + 1] = backgroundImageData.data[idx + 1];
        data[i + 2] = backgroundImageData.data[idx + 2];
        data[i + 3] = backgroundImageData.data[idx + 3];
      }
    }

    ctx.putImageData(frame, 0, 0);
  }

  requestAnimationFrame(processFrame);
}

// Check if pixel is green (chroma key)
function isGreen(r, g, b) {
  return g > 120 && r < 100 && b < 100;
}

// Cache background image pixel data
let backgroundImageData = null;
const observer = new MutationObserver(() => {
  if (backgroundImage) {
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = backgroundImage.width;
    tempCanvas.height = backgroundImage.height;
    let tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(backgroundImage, 0, 0);
    backgroundImageData = tempCtx.getImageData(0, 0, backgroundImage.width, backgroundImage.height);
  }
});
observer.observe(document.getElementById('output'), { attributes: true, childList: true, subtree: true });
