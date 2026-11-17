
/* =========================================================
   SILVER STAR ATHLETE CARE PRO
   FILE 06 : pose.js

   주요 기능
   1. MediaPipe Pose AI 모델 연결
   2. 신체 관절 위치 인식
   3. 관절 좌표 추출
   4. 관절 각도 계산
   5. 좌우 신체 균형 분석 기반
   6. 영상 위 관절 표시
   7. 분석 결과 다른 파일에 전달

   참고:
   외부 MediaPipe 라이브러리가 필요합니다.
========================================================= */

"use strict";

const PoseAnalyzer = {
  pose: null,
  cameraVideo: null,
  canvas: null,
  context: null,

  isReady: false,
  isRunning: false,

  latestLandmarks: null,
  latestAngles: null,

  // AI 분석 초기화
  async init() {
    this.cameraVideo = document.getElementById(
      "camera-video"
    );

    this.canvas = document.getElementById(
      "camera-canvas"
    );

    if (!this.cameraVideo || !this.canvas) {
      console.warn("AI 분석 영역을 찾을 수 없습니다.");
      return;
    }

    this.context = this.canvas.getContext("2d");

    this.setupEvents();

    console.log("AI 자세 분석 기능이 준비되었습니다.");
  },

  // 외부 라이브러리 연결
  async loadModel() {
    if (!window.Pose) {
      alert(
        "MediaPipe Pose 라이브러리가 연결되지 않았습니다."
      );
      return false;
    }

    try {
      this.pose = new window.Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.pose.onResults((results) => {
        this.handleResults(results);
      });

      await this.pose.initialize();

      this.isReady = true;

      this.updateStatus("AI 관절 인식 모델 준비 완료");

      return true;

    } catch (error) {
      console.error("AI 모델 초기화 실패:", error);

      this.updateStatus("AI 모델 연결 실패");

      return false;
    }
  },

  // 이벤트 설정
  setupEvents() {
    const startButton = document.getElementById(
      "pose-start"
    );

    const stopButton = document.getElementById(
      "pose-stop"
    );

    startButton?.addEventListener("click", () => {
      this.startAnalysis();
    });

    stopButton?.addEventListener("click", () => {
      this.stopAnalysis();
    });

    // 카메라 또는 영상이 새로 준비되면 분석 상태 갱신
    document.addEventListener(
      "camera:video-loaded",
      () => {
        this.clearCanvas();
      }
    );
  },

  // AI 분석 시작
  async startAnalysis() {
    if (!this.cameraVideo) {
      alert("영상 영역을 찾을 수 없습니다.");
      return;
    }

    if (
      this.cameraVideo.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      alert("먼저 카메라를 연결하거나 영상을 업로드해 주세요.");
      return;
    }

    if (!this.isReady) {
      const loaded = await this.loadModel();

      if (!loaded) return;
    }

    this.isRunning = true;

    this.updateStatus("AI 관절 분석 진행 중");

    this.analyzeFrame();
  },

  // 프레임 분석
  async analyzeFrame() {
    if (!this.isRunning || !this.pose) return;

    if (
      this.cameraVideo.readyState >=
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      try {
        await this.pose.send({
          image: this.cameraVideo
        });
      } catch (error) {
        console.error("프레임 분석 오류:", error);
      }
    }

    if (this.isRunning) {
      requestAnimationFrame(() => {
        this.analyzeFrame();
      });
    }
  },

  // AI 분석 종료
  stopAnalysis() {
    this.isRunning = false;

    this.clearCanvas();

    this.updateStatus("AI 분석 대기 중");
  },

  // 분석 결과 수신
  handleResults(results) {
    if (!results || !results.poseLandmarks) {
      this.latestLandmarks = null;
      this.latestAngles = null;

      this.clearCanvas();

      this.updateStatus("신체 관절을 인식하지 못했습니다.");

      return;
    }

    const landmarks = results.poseLandmarks;

    this.latestLandmarks = landmarks;

    this.drawLandmarks(landmarks);

    this.latestAngles = this.calculateAllAngles(
      landmarks
    );

    // 다른 기능에 분석 결과 전달
    document.dispatchEvent(
      new CustomEvent("pose:analyzed", {
        detail: {
          landmarks: this.latestLandmarks,
          angles: this.latestAngles,
          analyzedAt: new Date().toISOString()
        }
      })
    );

    this.updateStatus("AI 관절 인식 완료");
  },

  // 관절 연결선 및 점 표시
  drawLandmarks(landmarks) {
    if (!this.canvas || !this.context) return;

    const width = this.cameraVideo.videoWidth;
    const height = this.cameraVideo.videoHeight;

    if (!width || !height) return;

    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.context;

    ctx.clearRect(0, 0, width, height);

    // 관절 연결 구조
    const connections = [
      [11, 12],
      [11, 13],
      [13, 15],
      [12, 14],
      [14, 16],
      [11, 23],
      [12, 24],
      [23, 24],
      [23, 25],
      [25, 27],
      [24, 26],
      [26, 28],
      [27, 29],
      [29, 31],
      [28, 30],
      [30, 32]
    ];

    // 연결선 그리기
    ctx.strokeStyle = "#35d5ff";
    ctx.lineWidth = 3;

    connections.forEach(([start, end]) => {
      const a = landmarks[start];
      const b = landmarks[end];

      if (
        !a ||
        !b ||
        a.visibility < 0.5 ||
        b.visibility < 0.5
      ) {
        return;
      }

      ctx.beginPath();

      ctx.moveTo(
        a.x * width,
        a.y * height
      );

      ctx.lineTo(
        b.x * width,
        b.y * height
      );

      ctx.stroke();
    });

    // 관절 점 그리기
    landmarks.forEach((point) => {
      if (
        !point ||
        point.visibility < 0.5
      ) {
        return;
      }

      ctx.beginPath();

      ctx.arc(
        point.x * width,
        point.y * height,
        5,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.strokeStyle = "#167bd1";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },

  // 세 점을 이용한 관절 각도 계산
  calculateAngle(a, b, c) {
    if (!a || !b || !c) return null;

    const radians = Math.atan2(
      c.y - b.y,
      c.x - b.x
    ) - Math.atan2(
      a.y - b.y,
      a.x - b.x
    );

    let angle = Math.abs(
      radians * (180 / Math.PI)
    );

    if (angle > 180) {
      angle = 360 - angle;
    }

    return Math.round(angle * 10) / 10;
  },

  // 관절별 각도 계산
  calculateAllAngles(landmarks) {
    const point = (index) => {
      const p = landmarks[index];

      if (
        !p ||
        (p.visibility !== undefined &&
          p.visibility < 0.5)
      ) {
        return null;
      }

      return {
        x: p.x,
        y: p.y
      };
    };

    return {
      leftElbow: this.calculateAngle(
        point(11),
        point(13),
        point(15)
      ),

      rightElbow: this.calculateAngle(
        point(12),
        point(14),
        point(16)
      ),

      leftShoulder: this.calculateAngle(
        point(13),
        point(11),
        point(23)
      ),

      rightShoulder: this.calculateAngle(
        point(14),
        point(12),
        point(24)
      ),

      leftHip: this.calculateAngle(
        point(11),
        point(23),
        point(25)
      ),

      rightHip: this.calculateAngle(
        point(12),
        point(24),
        point(26)
      ),

      leftKnee: this.calculateAngle(
        point(23),
        point(25),
        point(27)
      ),

      rightKnee: this.calculateAngle(
        point(24),
        point(26),
        point(28)
      ),

      leftAnkle: this.calculateAngle(
        point(25),
        point(27),
        point(31)
      ),

      rightAnkle: this.calculateAngle(
        point(26),
        point(28),
        point(32)
      )
    };
  },

  // 좌우 각도 차이 계산
  calculateSideDifference(left, right) {
    if (
      left === null ||
      right === null ||
      left === undefined ||
      right === undefined
    ) {
      return null;
    }

    return Math.round(
      Math.abs(left - right) * 10
    ) / 10;
  },

  // 분석 결과 가져오기
  getAnalysisResult() {
    if (!this.latestAngles) return null;

    const angles = this.latestAngles;

    return {
      angles,

      differences: {
        elbow: this.calculateSideDifference(
          angles.leftElbow,
          angles.rightElbow
        ),

        shoulder: this.calculateSideDifference(
          angles.leftShoulder,
          angles.rightShoulder
        ),

        hip: this.calculateSideDifference(
          angles.leftHip,
          angles.rightHip
        ),

        knee: this.calculateSideDifference(
          angles.leftKnee,
          angles.rightKnee
        ),

        ankle: this.calculateSideDifference(
          angles.leftAnkle,
          angles.rightAnkle
        )
      },

      analyzedAt: new Date().toISOString()
    };
  },

  // 화면 상태 표시
  updateStatus(message) {
    const status = document.getElementById(
      "pose-status"
    );

    if (status) {
      status.textContent = message;
    }
  },

  // 관절 표시 초기화
  clearCanvas() {
    if (!this.context || !this.canvas) return;

    this.context.clearRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  },

  // 종료 및 리소스 정리
  destroy() {
    this.stopAnalysis();

    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }

    this.isReady = false;
  }
};

// 페이지 로딩 후 실행
document.addEventListener("DOMContentLoaded", () => {
  PoseAnalyzer.init();
});

// 다른 파일에서 사용 가능하도록 등록
window.PoseAnalyzer = PoseAnalyzer;