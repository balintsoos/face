import * as faceapi from 'face-api.js';

const loadModels = () =>
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/weights'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/weights'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/weights'),
    faceapi.nets.faceExpressionNet.loadFromUri('/weights'),
  ]);

const getVideoDimensions = video => ({ width: video.width, height: video.height });

const createCanvas = video => {
  const canvas = faceapi.createCanvasFromMedia(video);
  faceapi.matchDimensions(canvas, getVideoDimensions(video));
  document.body.append(canvas);
  return canvas;
};

const detect = async video => {
  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();
  const resizedDetections = faceapi.resizeResults(detections, getVideoDimensions(video));
  return resizedDetections;
};

const draw = (canvas, detections) => {
  faceapi.draw.drawDetections(canvas, detections);
  faceapi.draw.drawFaceLandmarks(canvas, detections);
  faceapi.draw.drawFaceExpressions(canvas, detections);
};

const clearCanvas = canvas => canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

const detectInterval = 100;
const WIDTH = 1280;
const HEIGHT = 720;
const video = document.getElementById('video');

video.addEventListener('play', () => {
  const canvas = createCanvas(video);
  setInterval(async () => {
    const detections = await detect(video);
    clearCanvas(canvas);
    draw(canvas, detections);
  }, detectInterval);
});

loadModels().then(() => {
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: WIDTH,
        height: HEIGHT,
        facingMode: 'user',
      },
    })
    .then(stream => {
      video.width = WIDTH;
      video.height = HEIGHT;
      video.srcObject = stream;
    });
});
