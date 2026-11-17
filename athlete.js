
/* =========================================================
   SILVER STAR ATHLETE CARE PRO
   FILE 04 : athlete.js

   주요 기능
   1. 선수 등록
   2. 선수 목록 표시
   3. 선수 선택 및 변경
   4. 선수 정보 수정
   5. 선수 삭제
   6. 선택 선수 정보 확인
   7. 다른 기능 파일과 선수 정보 공유
========================================================= */

"use strict";

const AthleteManager = {
  athletes: [],
  selectedAthleteId: null,

  // 프로그램 시작
  init() {
    this.loadAthletes();
    this.setupForm();
    this.renderAthletes();

    console.log("선수 관리 기능이 준비되었습니다.");
  },

  // 고유 ID 생성
  createId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `athlete-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
  },

  // 입력 폼 연결
  setupForm() {
    const form = document.getElementById("athlete-form");

    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      this.registerAthlete();
    });
  },

  // 선수 등록
  registerAthlete() {
    const name = document.getElementById("athlete-name");
    const age = document.getElementById("athlete-age");
    const gender = document.getElementById("athlete-gender");
    const sport = document.getElementById("athlete-sport");
    const height = document.getElementById("athlete-height");
    const weight = document.getElementById("athlete-weight");
    const team = document.getElementById("athlete-team");

    if (!name || !name.value.trim()) {
      alert("선수 이름을 입력해 주세요.");
      name?.focus();
      return;
    }

    const athlete = {
      id: this.createId(),
      name: name.value.trim(),
      age: age?.value ? Number(age.value) : null,
      gender: gender?.value || "",
      sport: sport?.value || "",
      height: height?.value ? Number(height.value) : null,
      weight: weight?.value ? Number(weight.value) : null,
      team: team?.value.trim() || "",
      createdAt: new Date().toISOString()
    };

    // 입력 정보 검증
    if (
      athlete.age !== null &&
      (!Number.isFinite(athlete.age) ||
        athlete.age < 1 ||
        athlete.age > 120)
    ) {
      alert("나이를 올바르게 입력해 주세요.");
      age?.focus();
      return;
    }

    if (
      athlete.height !== null &&
      (!Number.isFinite(athlete.height) ||
        athlete.height <= 0 ||
        athlete.height > 300)
    ) {
      alert("키를 올바르게 입력해 주세요.");
      height?.focus();
      return;
    }

    if (
      athlete.weight !== null &&
      (!Number.isFinite(athlete.weight) ||
        athlete.weight <= 0 ||
        athlete.weight > 500)
    ) {
      alert("체중을 올바르게 입력해 주세요.");
      weight?.focus();
      return;
    }

    this.athletes.push(athlete);
    this.selectedAthleteId = athlete.id;

    this.saveAthletes();
    this.renderAthletes();
    this.updateSelectedAthlete();

    const form = document.getElementById("athlete-form");

    form?.reset();

    alert(`${athlete.name} 선수 등록이 완료되었습니다.`);
  },

  // 선수 목록 화면 표시
  renderAthletes() {
    const list = document.getElementById("athlete-list");

    if (!list) return;

    list.innerHTML = "";

    if (this.athletes.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          등록된 선수가 없습니다.<br>
          새로운 선수를 등록해 주세요.
        </div>
      `;

      return;
    }

    this.athletes.forEach((athlete) => {
      const row = document.createElement("div");

      row.className = "athlete-row";

      if (athlete.id === this.selectedAthleteId) {
        row.classList.add("selected");
      }

      const info = document.createElement("div");
      info.className = "athlete-info";

      const name = document.createElement("b");
      name.textContent = athlete.name;

      const details = document.createElement("small");

      const detailParts = [];

      if (athlete.sport) detailParts.push(athlete.sport);
      if (athlete.age !== null) {
        detailParts.push(`${athlete.age}세`);
      }
      if (athlete.team) detailParts.push(athlete.team);

      details.textContent =
        detailParts.join(" · ") || "추가 정보 없음";

      info.append(name, details);

      const buttons = document.createElement("div");
      buttons.style.display = "flex";
      buttons.style.gap = "6px";

      const selectButton = document.createElement("button");
      selectButton.className = "athlete-select";
      selectButton.textContent =
        athlete.id === this.selectedAthleteId
          ? "선택됨"
          : "선택";

      selectButton.addEventListener("click", () => {
        this.selectAthlete(athlete.id);
      });

      const editButton = document.createElement("button");
      editButton.className = "athlete-select";
      editButton.textContent = "수정";

      editButton.addEventListener("click", () => {
        this.editAthlete(athlete.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.className = "athlete-select";
      deleteButton.textContent = "삭제";

      deleteButton.addEventListener("click", () => {
        this.deleteAthlete(athlete.id);
      });

      buttons.append(
        selectButton,
        editButton,
        deleteButton
      );

      row.append(info, buttons);
      list.appendChild(row);
    });
  },

  // 선수 선택
  selectAthlete(id) {
    const athlete = this.athletes.find(
      (item) => item.id === id
    );

    if (!athlete) return;

    this.selectedAthleteId = id;

    this.saveAthletes();
    this.renderAthletes();
    this.updateSelectedAthlete();

    document.dispatchEvent(
      new CustomEvent("athlete:selected", {
        detail: {
          athlete: { ...athlete }
        }
      })
    );
  },

  // 선택 선수 정보 전달
  updateSelectedAthlete() {
    const athlete = this.getSelectedAthlete();

    const nameElement = document.getElementById(
      "selected-athlete-name"
    );

    if (nameElement) {
      nameElement.textContent = athlete
        ? athlete.name
        : "선수를 선택해 주세요.";
    }

    document.dispatchEvent(
      new CustomEvent("athlete:updated", {
        detail: {
          athlete: athlete ? { ...athlete } : null
        }
      })
    );
  },

  // 선수 정보 수정
  editAthlete(id) {
    const athlete = this.athletes.find(
      (item) => item.id === id
    );

    if (!athlete) return;

    const newName = prompt(
      "선수 이름을 수정해 주세요.",
      athlete.name
    );

    if (newName === null) return;

    if (!newName.trim()) {
      alert("이름은 비워 둘 수 없습니다.");
      return;
    }

    athlete.name = newName.trim();

    this.saveAthletes();
    this.renderAthletes();
    this.updateSelectedAthlete();

    alert("선수 정보가 수정되었습니다.");
  },

  // 선수 삭제
  deleteAthlete(id) {
    const athlete = this.athletes.find(
      (item) => item.id === id
    );

    if (!athlete) return;

    const confirmed = confirm(
      `${athlete.name} 선수 정보를 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    this.athletes = this.athletes.filter(
      (item) => item.id !== id
    );

    if (this.selectedAthleteId === id) {
      this.selectedAthleteId =
        this.athletes.length > 0
          ? this.athletes[0].id
          : null;
    }

    this.saveAthletes();
    this.renderAthletes();
    this.updateSelectedAthlete();
  },

  // 선택된 선수 정보 가져오기
  getSelectedAthlete() {
    return this.athletes.find(
      (item) => item.id === this.selectedAthleteId
    ) || null;
  },

  // 전체 선수 목록 가져오기
  getAllAthletes() {
    return this.athletes.map((athlete) => ({
      ...athlete
    }));
  },

  // 선수 정보 저장
  saveAthletes() {
    try {
      localStorage.setItem(
        "silverStarAthletes",
        JSON.stringify({
          athletes: this.athletes,
          selectedAthleteId: this.selectedAthleteId
        })
      );
    } catch (error) {
      console.error("선수 정보 저장 실패:", error);
      alert("선수 정보를 저장하지 못했습니다.");
    }
  },

  // 선수 정보 불러오기
  loadAthletes() {
    try {
      const savedData = localStorage.getItem(
        "silverStarAthletes"
      );

      if (!savedData) return;

      const parsed = JSON.parse(savedData);

      this.athletes = Array.isArray(parsed.athletes)
        ? parsed.athletes
        : [];

      this.selectedAthleteId =
        parsed.selectedAthleteId || null;

      if (
        !this.athletes.some(
          (item) => item.id === this.selectedAthleteId
        )
      ) {
        this.selectedAthleteId =
          this.athletes[0]?.id || null;
      }
    } catch (error) {
      console.error("선수 정보 불러오기 실패:", error);

      this.athletes = [];
      this.selectedAthleteId = null;
    }
  }
};

// HTML 로딩 완료 후 실행
document.addEventListener("DOMContentLoaded", () => {
  AthleteManager.init();
});

// 다른 JavaScript 파일에서 사용할 수 있도록 등록
window.AthleteManager = AthleteManager;