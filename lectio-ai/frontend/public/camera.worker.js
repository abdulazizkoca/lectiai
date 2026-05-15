// Public fallback worker for pages that load the camera worker directly.
importScripts("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js");

const { FaceLandmarker, FilesetResolver } = self;
const MAX_CLASS_FACES = 32;
const CALIBRATION_FRAMES = 10;
const SNAPSHOT_THRESHOLD_MS = 15000;

let faceLandmarker = null;
let lastVideoTime = -1;
let lastTick = performance.now();
let roomHistory = [];
let inattentiveTimer = 0;
const faceStates = new Map();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getFaceState = (trackId) => {
  if (!faceStates.has(trackId)) {
    faceStates.set(trackId, {
      history: [],
      baseline: { eyeOpenness: 0, headPitch: 0, headYaw: 0, headRoll: 0 },
      calibrationFrames: 0,
    });
  }
  return faceStates.get(trackId);
};

const getRawMetrics = (landmarks) => {
  const leftEyeOpen = Math.abs(landmarks[159].y - landmarks[145].y);
  const rightEyeOpen = Math.abs(landmarks[386].y - landmarks[374].y);
  const eyeOpenness = (leftEyeOpen + rightEyeOpen) / 2;
  const nose = landmarks[1];
  const chin = landmarks[152];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  return {
    eyeOpenness,
    headPitch: chin.y - nose.y,
    headYaw: (rightEye.x - nose.x) - (nose.x - leftEye.x),
    headRoll: rightEye.y - leftEye.y,
    gaze: [Number((nose.x - 0.5).toFixed(3)), Number((nose.y - 0.5).toFixed(3))],
  };
};

const calibrate = (state, metrics) => {
  state.calibrationFrames += 1;
  const n = state.calibrationFrames;
  state.baseline.eyeOpenness = (state.baseline.eyeOpenness * (n - 1) + metrics.eyeOpenness) / n;
  state.baseline.headPitch = (state.baseline.headPitch * (n - 1) + metrics.headPitch) / n;
  state.baseline.headYaw = (state.baseline.headYaw * (n - 1) + metrics.headYaw) / n;
  state.baseline.headRoll = (state.baseline.headRoll * (n - 1) + metrics.headRoll) / n;
};

const getBoundingBox = (landmarks) => {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return [
    Number(clamp(minX, 0, 1).toFixed(4)),
    Number(clamp(minY, 0, 1).toFixed(4)),
    Number(clamp(maxX - minX, 0, 1).toFixed(4)),
    Number(clamp(maxY - minY, 0, 1).toFixed(4)),
  ];
};

const calculateAttention = (landmarks, trackId) => {
  const state = getFaceState(trackId);
  const metrics = getRawMetrics(landmarks);

  if (state.calibrationFrames < CALIBRATION_FRAMES) {
    calibrate(state, metrics);
    return { score: 100, metrics, calibrating: true };
  }

  const eyeRatio = clamp(metrics.eyeOpenness / (state.baseline.eyeOpenness || 0.01), 0, 1.35);
  const eyeScore = eyeRatio > 0.78 ? 100 : eyeRatio > 0.55 ? 65 : 20;
  const yawDeviation = Math.abs(metrics.headYaw - state.baseline.headYaw);
  const gazeScore = yawDeviation < 0.055 ? 100 : yawDeviation < 0.11 ? 65 : 25;
  const pitchDeviation = metrics.headPitch - state.baseline.headPitch;
  const pitchScore = pitchDeviation < 0.055 ? 100 : pitchDeviation < 0.11 ? 55 : 20;
  const rollDeviation = Math.abs(metrics.headRoll - state.baseline.headRoll);
  const postureScore = rollDeviation < 0.045 ? 100 : rollDeviation < 0.09 ? 70 : 40;
  const rawScore = pitchScore * 0.34 + gazeScore * 0.28 + eyeScore * 0.28 + postureScore * 0.1;

  state.history.push(rawScore);
  if (state.history.length > 12) state.history.shift();
  const smoothedScore = state.history.reduce((sum, value) => sum + value, 0) / state.history.length;
  return { score: Math.round(clamp(smoothedScore, 0, 100)), metrics, calibrating: false };
};

const getStatus = (score) => {
  if (score < 40) return "red";
  if (score < 70) return "yellow";
  return "green";
};

self.onmessage = async (e) => {
  if (e.data.type === "INIT") {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: e.data.maxFaces || MAX_CLASS_FACES,
        minFaceDetectionConfidence: 0.18,
        minFacePresenceConfidence: 0.18,
        minTrackingConfidence: 0.18,
      });
      self.postMessage({ type: "INIT_SUCCESS", maxFaces: e.data.maxFaces || MAX_CLASS_FACES });
    } catch (err) {
      self.postMessage({ type: "INIT_FAIL", error: err.message });
    }
    return;
  }

  if (e.data.type !== "PROCESS_FRAME" || !faceLandmarker) return;

  const bitmap = e.data.frame;
  const timestamp = e.data.timestamp;
  if (timestamp === lastVideoTime) {
    bitmap.close();
    return;
  }
  lastVideoTime = timestamp;

  const now = performance.now();
  const dt = now - lastTick;
  lastTick = now;
  let students = [];

  try {
    const results = faceLandmarker.detectForVideo(bitmap, timestamp);
    students = (results.faceLandmarks || []).slice(0, MAX_CLASS_FACES).map((landmarks, index) => {
      const attention = calculateAttention(landmarks, index + 1);
      const bbox = getBoundingBox(landmarks);
      return {
        track_id: index + 1,
        attention_score: attention.score,
        status: getStatus(attention.score),
        bbox,
        position: [Number((bbox[0] + bbox[2] / 2).toFixed(4)), Number((bbox[1] + bbox[3] / 2).toFixed(4))],
        eye_openness: Number(attention.metrics.eyeOpenness.toFixed(4)),
        gaze_direction: attention.metrics.gaze,
        head_pose: [
          Number(attention.metrics.headYaw.toFixed(4)),
          Number(attention.metrics.headPitch.toFixed(4)),
          Number(attention.metrics.headRoll.toFixed(4)),
        ],
        is_calibrated: !attention.calibrating,
      };
    });
  } finally {
    bitmap.close();
  }

  const averageScore = students.length
    ? students.reduce((sum, student) => sum + student.attention_score, 0) / students.length
    : 0;
  roomHistory.push(averageScore);
  if (roomHistory.length > 12) roomHistory.shift();
  const smoothedRoomScore = roomHistory.reduce((sum, value) => sum + value, 0) / roomHistory.length || 0;
  const status = getStatus(smoothedRoomScore);

  if (status === "red" && students.length > 0) {
    inattentiveTimer += dt;
    if (inattentiveTimer > SNAPSHOT_THRESHOLD_MS) {
      self.postMessage({ type: "TAKE_SNAPSHOT", score: Math.round(smoothedRoomScore), students });
      inattentiveTimer = 0;
    }
  } else if (smoothedRoomScore > 60) {
    inattentiveTimer = 0;
  }

  const greenCount = students.filter((student) => student.status === "green").length;
  const yellowCount = students.filter((student) => student.status === "yellow").length;
  const redCount = students.filter((student) => student.status === "red").length;

  self.postMessage({
    type: "RESULT",
    score: Math.round(smoothedRoomScore),
    status,
    label: status === "green" ? "Sinf diqqatli" : status === "yellow" ? "Diqqat pasaymoqda" : "Sinf chalg'igan",
    calibrating: students.some((student) => !student.is_calibrated),
    studentCount: students.length,
    students,
    room: {
      total_students: students.length,
      green_count: greenCount,
      yellow_count: yellowCount,
      red_count: redCount,
      average_attention: Math.round(smoothedRoomScore),
      coverage: students.length >= MAX_CLASS_FACES ? "full" : "wide",
    },
  });
};
