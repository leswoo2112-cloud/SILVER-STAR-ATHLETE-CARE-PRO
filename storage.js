
"use strict";

/**
 * SILVER STAR ATHLETE CARE PRO
 * File: storage.js
 *
 * 전체 데이터 저장 및 백업 관리
 *
 * 저장 데이터:
 * - silverStarAthletes
 * - silverStarAssessments
 *
 * 주의:
 * 데이터는 현재 브라우저의 localStorage에 저장됩니다.
 * 브라우저 데이터 삭제 및 기기 변경에 대비해 백업을 권장합니다.
 */

const StorageManager = {
  keys: {
    athletes: "silverStarAthletes",
    assessments: "silverStarAssessments"
  },

  init() {
    this.setupEvents();
    this.renderStorageInfo();

    console.log("데이터 저장 관리 모듈이 초기화되었습니다.");
  },

  setupEvents() {
    const exportButton = document.getElementById("storage-export");
    const importButton = document.getElementById("storage-import");
    const fileInput = document.getElementById("storage-file");
    const clearButton = document.getElementById("storage-clear");

    if (exportButton) {
      exportButton.addEventListener("click", () => {
        this.exportBackup();
      });
    }

    if (importButton && fileInput) {
      importButton.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        await this.importBackup(file);
        fileInput.value = "";
      });
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        this.clearAllData();
      });
    }

    window.addEventListener("storage", () => {
      this.renderStorageInfo();
    });

    document.addEventListener("assessment:saved", () => {
      this.renderStorageInfo();
    });

    document.addEventListener("athlete:updated", () => {
      this.renderStorageInfo();
    });
  },

  readData(key) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) return [];

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`${key} 데이터를 읽지 못했습니다.`, error);
      return [];
    }
  },

  getAllData() {
    return {
      appName: "SILVER STAR ATHLETE CARE PRO",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),

      data: {
        athletes: this.readData(this.keys.athletes),
        assessments: this.readData(this.keys.assessments)
      }
    };
  },

  exportBackup() {
    try {
      const backup = this.getAllData();

      const json = JSON.stringify(backup, null, 2);

      const blob = new Blob(
        [json],
        { type: "application/json;charset=utf-8" }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `silver-star-backup-${date}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      alert("데이터 백업 파일을 생성했습니다.");
    } catch (error) {
      console.error("데이터 백업 실패:", error);
      alert("데이터 백업 중 오류가 발생했습니다.");
    }
  },

  async importBackup(file) {
    if (!file) return false;

    if (!file.name.toLowerCase().endsWith(".json")) {
      alert("JSON 백업 파일만 불러올 수 있습니다.");
      return false;
    }

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!this.validateBackup(backup)) {
        alert("올바른 백업 파일이 아닙니다.");
        return false;
      }

      const confirmed = confirm(
        "백업 데이터를 불러오면 현재 저장된 선수 및 평가 기록이 교체됩니다. 계속할까요?"
      );

      if (!confirmed) return false;

      const athletes = backup.data.athletes;
      const assessments = backup.data.assessments;

      localStorage.setItem(
        this.keys.athletes,
        JSON.stringify(athletes)
      );

      localStorage.setItem(
        this.keys.assessments,
        JSON.stringify(assessments)
      );

      this.renderStorageInfo();

      document.dispatchEvent(
        new CustomEvent("storage:restored")
      );

      document.dispatchEvent(
        new CustomEvent("athlete:updated")
      );

      document.dispatchEvent(
        new CustomEvent("assessment:saved")
      );

      alert("백업 데이터를 성공적으로 불러왔습니다.");

      return true;
    } catch (error) {
      console.error("백업 파일 불러오기 실패:", error);
      alert("백업 파일을 불러오지 못했습니다.");
      return false;
    }
  },

  validateBackup(backup) {
    if (!backup || typeof backup !== "object") return false;

    if (
      backup.appName !== "SILVER STAR ATHLETE CARE PRO"
    ) {
      return false;
    }

    if (!backup.data || typeof backup.data !== "object") {
      return false;
    }

    if (
      !Array.isArray(backup.data.athletes) ||
      !Array.isArray(backup.data.assessments)
    ) {
      return false;
    }

    const athletesValid = backup.data.athletes.every((athlete) => {
      return (
        athlete &&
        typeof athlete === "object" &&
        athlete.id !== undefined
      );
    });

    const assessmentsValid = backup.data.assessments.every((item) => {
      return (
        item &&
        typeof item === "object" &&
        item.athleteId !== undefined
      );
    });

    return athletesValid && assessmentsValid;
  },

  getStorageUsage() {
    let totalBytes = 0;

    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);

      if (!key) continue;

      const value = localStorage.getItem(key) || "";

      totalBytes += new Blob([key + value]).size;
    }

    return {
      bytes: totalBytes,
      kilobytes: totalBytes / 1024,
      megabytes: totalBytes / (1024 * 1024)
    };
  },

  getDataCounts() {
    const athletes = this.readData(this.keys.athletes);
    const assessments = this.readData(this.keys.assessments);

    return {
      athletes: athletes.length,
      assessments: assessments.length
    };
  },

  renderStorageInfo() {
    const counts = this.getDataCounts();
    const usage = this.getStorageUsage();

    const fields = {
      "storage-athlete-count": counts.athletes,
      "storage-assessment-count": counts.assessments,
      "storage-usage": `${usage.kilobytes.toFixed(2)} KB`
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = String(value);
      }
    });
  },

  clearAllData() {
    const confirmed = confirm(
      "정말로 모든 선수 정보와 평가 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다. 먼저 백업하는 것을 권장합니다."
    );

    if (!confirmed) return;

    localStorage.removeItem(this.keys.athletes);
    localStorage.removeItem(this.keys.assessments);

    this.renderStorageInfo();

    document.dispatchEvent(
      new CustomEvent("storage:cleared")
    );

    document.dispatchEvent(
      new CustomEvent("athlete:updated")
    );

    document.dispatchEvent(
      new CustomEvent("assessment:saved")
    );

    alert("저장된 선수 정보와 평가 기록을 삭제했습니다.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  StorageManager.init();
});

window.StorageManager = StorageManager;