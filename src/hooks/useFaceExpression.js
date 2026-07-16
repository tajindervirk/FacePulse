import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { classifyExpression } from '../utils/expressionLogic';

export const useFaceExpression = (videoRef, canvasRef, overlayMode) => {
  const [faces, setFaces] = useState([]);
  const [pinchDistance, setPinchDistance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const landmarkerRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const lastVideoTime = useRef(-1);

  // Throttling state for UI and detection
  const lastUpdateTime = useRef(0);
  const THROTTLE_MS = 150; // 150ms throttle as requested

  useEffect(() => {
    let stream;
    let isActive = true;

    const init = async () => {
      try {
        setIsLoading(true);
        // Load WASM
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        // Initialize Face Landmarker
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 4
        });

        // Initialize Hand Landmarker
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        // Start Camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (isActive) {
              videoRef.current.play();
              detect();
            }
          };
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err.message || "Failed to initialize camera or model.");
        setIsLoading(false);
      }
    };

    const drawOverlay = (faceResults, handResults) => {
      if (!canvasRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      // Match canvas size to video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (overlayMode === 'none') return;

      const drawingUtils = new DrawingUtils(ctx);
      
      if (faceResults.faceLandmarks) {
        for (const landmarks of faceResults.faceLandmarks) {
          if (overlayMode === 'mesh') {
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#00E5FF", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#00E5FF", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0", lineWidth: 1 });
          } else if (overlayMode === 'contour') {
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#00E5FF", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#00E5FF", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0", lineWidth: 2 });
          } else if (overlayMode === 'dots') {
            drawingUtils.drawLandmarks(landmarks, { color: "#00E5FF", radius: 1 });
          }
        }
      }

      if (handResults && handResults.landmarks) {
        for (const landmarks of handResults.landmarks) {
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00E5FF", lineWidth: 2 });
          drawingUtils.drawLandmarks(landmarks, { color: "#E0E0E0", radius: 2 });
        }
      }
    };

    const detect = () => {
      if (!isActive || !landmarkerRef.current || !handLandmarkerRef.current || !videoRef.current) return;
      
      const video = videoRef.current;
      
      // Only process if video is playing and has valid dimensions
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const now = performance.now();
        if (now - lastUpdateTime.current >= THROTTLE_MS) {
          lastUpdateTime.current = now;
          lastVideoTime.current = video.currentTime;
          
          try {
            const faceResults = landmarkerRef.current.detectForVideo(video, now);
            const handResults = handLandmarkerRef.current.detectForVideo(video, now);
            
            // Draw overlay
            drawOverlay(faceResults, handResults);

            // Face expressions
            if (faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
              const detectedFaces = faceResults.faceBlendshapes.map((face) => {
                const classification = classifyExpression(face.categories);
                return {
                  ...classification,
                  blendshapes: face.categories
                };
              });
              setFaces(detectedFaces);
            } else {
              setFaces([]);
            }

            // Hand pinch distance (Index tip is 8, Thumb tip is 4)
            if (handResults.landmarks && handResults.landmarks.length > 0) {
              const hand = handResults.landmarks[0];
              const thumb = hand[4];
              const index = hand[8];
              if (thumb && index) {
                const dx = thumb.x - index.x;
                const dy = thumb.y - index.y;
                setPinchDistance(Math.sqrt(dx * dx + dy * dy));
              } else {
                setPinchDistance(null);
              }
            } else {
              setPinchDistance(null);
            }

          } catch (e) {
            console.error("Detection error:", e);
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(detect);
    };

    init();

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [overlayMode]);

  return { faces, pinchDistance, isLoading, error };
};
