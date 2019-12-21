import * as faceapi from 'face-api.js';

const loadModels = folder =>
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(folder),
    faceapi.nets.faceLandmark68Net.loadFromUri(folder),
    faceapi.nets.faceRecognitionNet.loadFromUri(folder),
    faceapi.nets.faceExpressionNet.loadFromUri(folder),
    faceapi.nets.ageGenderNet.loadFromUri(folder),
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
    .withFaceExpressions()
    .withAgeAndGender();
  const resizedDetections = faceapi.resizeResults(detections, getVideoDimensions(video));
  return resizedDetections;
};

const draw = (canvas, detections) => {
  faceapi.draw.drawDetections(canvas, detections);
  faceapi.draw.drawFaceLandmarks(canvas, detections);
  faceapi.draw.drawFaceExpressions(canvas, detections);
  detections.forEach(detection => {
    const { age, gender, genderProbability } = detection;
    new faceapi.draw.DrawTextField(
      [
        `${faceapi.utils.round(age, 0)} years`,
        `${gender} (${faceapi.utils.round(genderProbability)})`
      ],
      detection.detection.box.bottomRight,
    ).draw(canvas);
  });
};

const clearCanvas = canvas => canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

const detectInterval = 100;
const WIDTH = 1280;
const HEIGHT = 720;
const modelFolder = '/weights';
const video = document.getElementById('video');

video.addEventListener('play', () => {
  const canvas = createCanvas(video);
  setInterval(async () => {
    const detections = await detect(video);
    clearCanvas(canvas);
    draw(canvas, detections);
  }, detectInterval);
});

loadModels(modelFolder).then(() => {
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
