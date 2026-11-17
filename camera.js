
/* =========================================================
   SILVER STAR ATHLETE CARE PRO
   FILE 05 : camera.js

   주요 기능
   1. 웹캠 연결 및 종료
   2. 실시간 영상 표시
   3. 영상 파일 업로드
   4. 사진 촬영 및 저장
   5. 촬영 영상 재생 및 정지
   6. 촬영 자료를 다른 기능에 전달
========================================================= */

"use strict";

const CameraManager = {
  stream: null,
  videoElement: null,
  canvasElement: null,
  currentMode: "none",
  uploadedFileUrl: null,
  isRecording: false,
  mediaRecorder: null,
  recordedChunks: [],

  // 초기화
  init() {
    this.videoElement = document.getElementById("camera-video");
    this.canvasElement = document.getElementById("camera-canvas");

    this.setupCameraButtons();
    this.setupUpload();

    console.log("촬영 및 영상 관리 기능이 준비되었습니다.");
  },

  // 촬영 버튼 연결
  setupCameraButtons() {
    const startButton = document.getElementById("camera-start");
    const stopButton = document.getElementById("camera-stop");
    const captureButton = document.getElementById("camera-capture");
    const recordButton = document.getElementById("camera-record");

    startButton?.addEventListener("click", () => {
      this.startCamera();
    });

    stopButton?.addEventListener("click", () => {
      this.stopCamera();
    });

    captureButton?.addEventListener("click", () => {
      this.capturePhoto();
    });

    recordButton?.addEventListener("click", () => {
      this.toggleRecording();
    });
  },

  // 카메라 연결
  async startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert(
        "현재 브라우저에서 카메라를 사용할 수 없습니다. HTTPS 또는 localhost 환경인지 확인해 주세요."
      );
      return;
    }

    try {
      this.stopCamera();

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          }
        },
        audio: false
      });

      if (!this.videoElement) {
        alert("영상 표시 영역을 찾을 수 없습니다.");
        this.stopCamera();
        return;
      }

      this.videoElement.srcObject = this.stream;
      this.videoElement.classList.add("visible");

      await this.videoElement.play();

      this.currentMode = "camera";

      this.updateStatus("카메라 연결 완료");

      console.log("카메라가 연결되었습니다.");
    } catch (error) {
      console.error("카메라 연결 실패:", error);

      this.updateStatus("카메라 연결 실패");

      alert(
        "카메라를 연결하지 못했습니다. 브라우저의 카메라 권한을 확인해 주세요."
      );
    }
  },

  // 카메라 종료
  stopCamera() {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });

      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement.classList.remove("visible");
    }

    this.currentMode = "none";

    this.updateStatus("카메라 연결 종료");
  },

  // 영상 파일 업로드
  setupUpload() {
    const uploadInput = document.getElementById("video-upload");

    if (!uploadInput) return;

    uploadInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];

      if (file) {
        this.loadVideo(file);
      }
    });
  },

  // 업로드 영상 불러오기
  loadVideo(file) {
    if (!file.type.startsWith("video/")) {
      alert("영상 파일만 업로드할 수 있습니다.");
      return;
    }

    // 이전 URL 정리
    if (this.uploadedFileUrl) {
      URL.revokeObjectURL(this.uploadedFileUrl);
    }

    this.stopCamera();

    this.uploadedFileUrl = URL.createObjectURL(file);

    if (!this.videoElement) return;

    this.videoElement.srcObject = null;
    this.videoElement.src = this.uploadedFileUrl;
    this.videoElement.controls = true;
    this.videoElement.classList.add("visible");

    this.currentMode = "uploaded";

    this.videoElement.onloadedmetadata = () => {
      this.updateStatus(
        `영상 불러오기 완료 · ${this.videoElement.videoWidth} × ${this.videoElement.videoHeight}`
      );

      document.dispatchEvent(
        new CustomEvent("camera:video-loaded", {
          detail: {
            name: file.name,
            type: file.type,
            size: file.size,
            duration: this.videoElement.duration
          }
        })
      );
    };

    this.videoElement.play().catch(() => {
      // 브라우저 자동 재생이 차단된 경우 직접 재생 가능
    });
  },

  // 사진 촬영
  capturePhoto() {
    if (!this.videoElement || !this.canvasElement) {
      alert("촬영 영역을 찾을 수 없습니다.");
      return;
    }

    if (
      this.videoElement.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      alert("먼저 카메라를 연결하거나 영상을 불러와 주세요.");
      return;
    }

    const width = this.videoElement.videoWidth;
    const height = this.videoElement.videoHeight;

    if (!width || !height) {
      alert("현재 영상에서 촬영할 수 없습니다.");
      return;
    }

    this.canvasElement.width = width;
    this.canvasElement.height = height;

    const context = this.canvasElement.getContext("2d");

    context.drawImage(
      this.videoElement,
      0,
      0,
      width,
      height
    );

    const imageData = this.canvasElement.toDataURL(
      "image/png"
    );

    this.savePhoto(imageData);

    document.dispatchEvent(
      new CustomEvent("camera:photo-captured", {
        detail: {
          image: imageData,
          width,
          height,
          capturedAt: new Date().toISOString()
        }
      })
    );

    this.updateStatus("사진 촬영 완료");

    alert("사진 촬영이 완료되었습니다.");
  },

  // 촬영 사진 저장 및 미리보기
  savePhoto(imageData) {
    const preview = document.getElementById(
      "captured-preview"
    );

    if (preview) {
      preview.innerHTML = "";

      const image = document.createElement("img");
      image.src = imageData;
      image.alt = "촬영한 선수 움직임 사진";

      preview.appendChild(image);
    }

    const downloadLink = document.createElement("a");

    downloadLink.href = imageData;
    downloadLink.download =
      `silver-star-capture-${Date.now()}.png`;

    downloadLink.textContent = "촬영 사진 다운로드";
    downloadLink.className = "btn btn-outline";

    if (preview) {
      preview.appendChild(downloadLink);
    }
  },

  // 영상 녹화 시작 및 종료
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  },

  // 녹화 시작
  startRecording() {
    if (!this.stream) {
      alert("먼저 카메라를 연결해 주세요.");
      return;
    }

    if (!window.MediaRecorder) {
      alert("현재 브라우저는 영상 녹화를 지원하지 않습니다.");
      return;
    }

    try {
      this.recordedChunks = [];

      const options = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9"
      )
        ? {
            mimeType: "video/webm;codecs=vp9"
          }
        : {
            mimeType: "video/webm"
          };

      this.mediaRecorder = new MediaRecorder(
        this.stream,
        options
      );

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.downloadRecording();
      };

      this.mediaRecorder.start();

      this.isRecording = true;

      this.updateStatus("영상 녹화 중");

    } catch (error) {
      console.error("녹화 시작 실패:", error);
      alert("영상 녹화를 시작하지 못했습니다.");
    }
  },

  // 녹화 종료
  stopRecording() {
    if (
      this.mediaRecorder &&
      this.mediaRecorder.state !== "inactive"
    ) {
      this.mediaRecorder.stop();
    }

    this.isRecording = false;

    this.updateStatus("영상 녹화 종료");
  },

  // 녹화 영상 다운로드
  downloadRecording() {
    if (this.recordedChunks.length === 0) return;

    const blob = new Blob(this.recordedChunks, {
      type: "video/webm"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download =
      `silver-star-video-${Date.now()}.webm`;

    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    document.dispatchEvent(
      new CustomEvent("camera:recording-saved", {
        detail: {
          size: blob.size,
          type: blob.type
        }
      })
    );
  },

  // 촬영 상태 표시
  updateStatus(message) {
    const status = document.getElementById(
      "camera-status"
    );

    if (status) {
      status.textContent = message;
    }
  },

  // 현재 영상 정보 가져오기
  getVideoInfo() {
    if (!this.videoElement) return null;

    return {
      mode: this.currentMode,
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
      duration: this.videoElement.duration || 0
    };
  },

  // 프로그램 종료 시 정리
  destroy() {
    this.stopCamera();

    if (this.uploadedFileUrl) {
      URL.revokeObjectURL(this.uploadedFileUrl);
      this.uploadedFileUrl = null;
    }
  }
};

// 페이지 로딩 완료 후 실행
document.addEventListener("DOMContentLoaded", () => {
  CameraManager.init();
});

// 다른 JavaScript 파일에서 사용할 수 있도록 등록
window.CameraManager = CameraManager;