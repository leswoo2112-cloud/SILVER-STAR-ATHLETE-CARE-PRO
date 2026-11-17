
"use strict";

/**
 * SILVER STAR ATHLETE CARE PRO
 * File: rehab.js
 *
 * 재활 운동 안내 및 평가 결과 기반 운동 추천
 * 주의: 본 프로그램은 의료적 진단이나 치료 처방을 제공하지 않습니다.
 */

const RehabManager = {
  selectedCategory: "all",
  completedExercises: new Set(),

  exercises: [
    {
      id: "ankle-mobility",
      title: "발목 가동성 운동",
      category: "ankle",
      level: "기초",
      duration: "3~5분",
      purpose: "발목 관절의 움직임과 가동 범위 확인 및 유지",
      method: [
        "의자에 앉아 한쪽 발을 바닥에서 살짝 들어 올립니다.",
        "발끝으로 천천히 원을 그리듯 움직입니다.",
        "양방향으로 움직인 후 반대쪽 발도 실시합니다."
      ],
      amount: "좌우 각각 10회",
      caution: "발목에 통증이 발생하면 움직임을 중단합니다.",
      tags: ["발목", "가동성", "유연성"]
    },
    {
      id: "calf-stretch",
      title: "종아리 스트레칭",
      category: "ankle",
      level: "기초",
      duration: "3분",
      purpose: "종아리 근육의 유연성 유지",
      method: [
        "벽을 마주 보고 양손을 벽에 댑니다.",
        "한쪽 다리를 뒤로 보내고 뒤꿈치를 바닥에 붙입니다.",
        "몸을 천천히 앞으로 이동하며 종아리의 당김을 느낍니다."
      ],
      amount: "좌우 각각 20초씩 2회",
      caution: "반동을 주지 말고 편안한 범위에서 실시합니다.",
      tags: ["종아리", "발목", "유연성"]
    },
    {
      id: "ankle-calf-raise",
      title: "카프 레이즈",
      category: "ankle",
      level: "기초",
      duration: "3~5분",
      purpose: "종아리 근육과 발목 주변 근육 강화",
      method: [
        "벽이나 의자를 잡고 안정적으로 섭니다.",
        "양쪽 뒤꿈치를 천천히 들어 올립니다.",
        "잠시 유지한 후 천천히 뒤꿈치를 내립니다."
      ],
      amount: "10회씩 2세트",
      caution: "균형이 불안정하면 의자나 벽을 반드시 잡고 실시합니다.",
      tags: ["종아리", "발목", "근력"]
    },
    {
      id: "sit-to-stand",
      title: "의자에서 일어서기",
      category: "knee",
      level: "기초",
      duration: "3~5분",
      purpose: "허벅지와 엉덩이 근육의 기초 근력 유지",
      method: [
        "높이가 안정적인 의자에 앉습니다.",
        "발을 어깨너비 정도로 벌리고 발바닥을 바닥에 붙입니다.",
        "상체를 약간 앞으로 기울이며 천천히 일어섭니다.",
        "다시 천천히 의자에 앉습니다."
      ],
      amount: "8~10회씩 2세트",
      caution: "무릎이 안쪽으로 무너지지 않도록 하고 통증이 있으면 중단합니다.",
      tags: ["무릎", "허벅지", "기초근력"]
    },
    {
      id: "quad-contraction",
      title: "대퇴사두근 수축 운동",
      category: "knee",
      level: "기초",
      duration: "3분",
      purpose: "허벅지 앞쪽 근육의 수축 능력 유지",
      method: [
        "다리를 앞으로 편 상태로 앉거나 눕습니다.",
        "무릎 뒤쪽을 바닥 또는 수건에 가볍게 누릅니다.",
        "허벅지 앞쪽에 힘을 주고 5초간 유지합니다.",
        "천천히 힘을 풀어 줍니다."
      ],
      amount: "10회씩 2세트",
      caution: "무릎을 강하게 누르지 말고 편안한 범위에서 실시합니다.",
      tags: ["무릎", "허벅지", "근육 활성화"]
    },
    {
      id: "glute-bridge",
      title: "브릿지",
      category: "hip",
      level: "기초",
      duration: "3~5분",
      purpose: "엉덩이와 몸통 주변 근육 활성화",
      method: [
        "바닥에 등을 대고 누워 무릎을 세웁니다.",
        "발바닥을 바닥에 붙인 상태에서 엉덩이에 힘을 줍니다.",
        "골반을 천천히 들어 올립니다.",
        "몸통과 허벅지가 자연스럽게 이어지면 잠시 유지한 후 내려옵니다."
      ],
      amount: "10회씩 2세트",
      caution: "허리를 과도하게 꺾지 않도록 주의합니다.",
      tags: ["엉덩이", "골반", "코어"]
    },
    {
      id: "side-leg-raise",
      title: "옆으로 다리 들기",
      category: "hip",
      level: "기초",
      duration: "3~5분",
      purpose: "엉덩이 옆쪽 근육 강화와 골반 안정성 향상",
      method: [
        "옆으로 누워 아래쪽 다리는 편안하게 구부립니다.",
        "위쪽 다리를 무릎이 굽혀지지 않도록 편 상태로 들어 올립니다.",
        "천천히 다리를 내립니다.",
        "반대쪽도 같은 방법으로 실시합니다."
      ],
      amount: "좌우 각각 10회씩 2세트",
      caution: "골반이 뒤로 넘어가지 않도록 유지합니다.",
      tags: ["엉덩이", "골반", "안정성"]
    },
    {
      id: "supported-balance",
      title: "지지형 균형 운동",
      category: "balance",
      level: "기초",
      duration: "3분",
      purpose: "균형 감각과 자세 조절 능력 유지",
      method: [
        "벽이나 튼튼한 의자 옆에 섭니다.",
        "양발로 균형을 잡은 후 한쪽 발을 살짝 들어 올립니다.",
        "필요하면 손으로 지지물을 잡고 자세를 유지합니다.",
        "반대쪽도 동일하게 실시합니다."
      ],
      amount: "좌우 각각 10~15초씩 2회",
      caution: "넘어질 위험이 있으므로 지지물을 가까이 두고 실시합니다.",
      tags: ["균형", "자세 조절", "안정성"]
    },
    {
      id: "heel-to-toe",
      title: "일자 걷기",
      category: "balance",
      level: "기초",
      duration: "2~3분",
      purpose: "동적 균형과 보행 중 자세 조절 능력 유지",
      method: [
        "벽 옆의 안전한 공간에 섭니다.",
        "한쪽 발의 뒤꿈치를 반대쪽 발의 발끝 가까이에 놓습니다.",
        "천천히 앞으로 몇 걸음 이동합니다.",
        "필요하면 벽을 잡고 실시합니다."
      ],
      amount: "5~8걸음씩 2회",
      caution: "어지럽거나 균형을 잃을 것 같으면 즉시 중단합니다.",
      tags: ["균형", "보행", "자세 조절"]
    }
  ],

  init() {
    this.setupCategoryButtons();
    this.setupExerciseEvents();
    this.renderExercises();
    this.setupEventListeners();

    console.log("재활 운동 안내 모듈이 초기화되었습니다.");
  },

  setupCategoryButtons() {
    const buttons = document.querySelectorAll("[data-rehab-category]");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.dataset.rehabCategory;

        this.selectedCategory = category || "all";

        buttons.forEach((item) => {
          item.classList.toggle("active", item === button);
        });

        this.renderExercises();
      });
    });
  },

  setupExerciseEvents() {
    const container = document.getElementById("rehab-grid");

    if (!container) return;

    container.addEventListener("click", (event) => {
      const completeButton = event.target.closest("[data-exercise-complete]");

      if (!completeButton) return;

      const exerciseId = completeButton.dataset.exerciseComplete;

      this.toggleCompleted(exerciseId);
    });
  },

  setupEventListeners() {
    document.addEventListener("assessment:saved", () => {
      this.renderExercises();
    });

    document.addEventListener("athlete:selected", () => {
      this.completedExercises.clear();
      this.renderExercises();
    });

    document.addEventListener("app:pagechange", (event) => {
      if (event.detail?.page === "rehab") {
        this.renderExercises();
      }
    });
  },

  getSelectedAthlete() {
    if (
      window.AthleteManager &&
      typeof window.AthleteManager.getSelectedAthlete === "function"
    ) {
      return window.AthleteManager.getSelectedAthlete();
    }

    return null;
  },

  getLatestAssessment() {
    const athlete = this.getSelectedAthlete();

    if (!athlete || !window.AnalysisManager) return null;

    if (
      typeof window.AnalysisManager.getLatestResult === "function"
    ) {
      return window.AnalysisManager.getLatestResult(athlete.id);
    }

    return null;
  },

  getRecommendedCategories() {
    const result = this.getLatestAssessment();

    if (!result) return [];

    const categories = new Set();

    const items = result.items || result.results || [];

    items.forEach((item) => {
      const status = item.status;

      if (status === "unable" || status === "pain") {
        if (
          item.id?.toLowerCase().includes("ankle") ||
          item.name?.includes("발목")
        ) {
          categories.add("ankle");
        }

        if (
          item.id?.toLowerCase().includes("knee") ||
          item.name?.includes("무릎")
        ) {
          categories.add("knee");
        }

        if (
          item.id?.toLowerCase().includes("balance") ||
          item.name?.includes("균형")
        ) {
          categories.add("balance");
        }
      }

      const values = [
        item.left,
        item.right,
        item.leftValue,
        item.rightValue
      ];

      if (values.some((value) => Number(value) > 0 && Number(value) < 10)) {
        if (
          item.id?.toLowerCase().includes("ankle") ||
          item.name?.includes("발목")
        ) {
          categories.add("ankle");
        }
      }
    });

    return [...categories];
  },

  getExerciseStatus(exercise) {
    const recommended = this.getRecommendedCategories();

    if (recommended.includes(exercise.category)) {
      return "평가 결과 관련 운동";
    }

    return "일반 컨디션 관리 운동";
  },

  toggleCompleted(exerciseId) {
    if (this.completedExercises.has(exerciseId)) {
      this.completedExercises.delete(exerciseId);
    } else {
      this.completedExercises.add(exerciseId);
    }

    this.renderExercises();
  },

  createExerciseCard(exercise) {
    const completed = this.completedExercises.has(exercise.id);

    const card = document.createElement("article");
    card.className = "rehab-card";

    if (completed) {
      card.classList.add("completed");
    }

    const methodHtml = exercise.method
      .map((step, index) => `
        <li>
          <span class="rehab-step-number">${index + 1}</span>
          <span>${this.escapeHtml(step)}</span>
        </li>
      `)
      .join("");

    const tagsHtml = exercise.tags
      .map((tag) => `<span class="rehab-tag">${this.escapeHtml(tag)}</span>`)
      .join("");

    card.innerHTML = `
      <div class="rehab-card-top">
        <span class="rehab-level">${this.escapeHtml(exercise.level)}</span>
        <span class="rehab-duration">${this.escapeHtml(exercise.duration)}</span>
      </div>

      <div class="rehab-card-heading">
        <h3>${this.escapeHtml(exercise.title)}</h3>
        <p>${this.escapeHtml(this.getExerciseStatus(exercise))}</p>
      </div>

      <div class="rehab-purpose">
        <strong>운동 목적</strong>
        <p>${this.escapeHtml(exercise.purpose)}</p>
      </div>

      <div class="rehab-method">
        <strong>운동 방법</strong>
        <ol>${methodHtml}</ol>
      </div>

      <div class="rehab-amount">
        <span>권장 횟수</span>
        <strong>${this.escapeHtml(exercise.amount)}</strong>
      </div>

      <div class="rehab-tags">${tagsHtml}</div>

      <div class="rehab-caution">
        <strong>주의사항</strong>
        <p>${this.escapeHtml(exercise.caution)}</p>
      </div>

      <button
        type="button"
        class="rehab-complete-button ${completed ? "active" : ""}"
        data-exercise-complete="${this.escapeHtml(exercise.id)}"
      >
        ${completed ? "✓ 운동 완료" : "운동 완료 체크"}
      </button>
    `;

    return card;
  },

  renderExercises() {
    const container = document.getElementById("rehab-grid");

    if (!container) return;

    const athlete = this.getSelectedAthlete();
    const recommendedCategories = this.getRecommendedCategories();

    let filtered = this.exercises;

    if (this.selectedCategory !== "all") {
      filtered = filtered.filter(
        (exercise) => exercise.category === this.selectedCategory
      );
    }

    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "rehab-summary";

    header.innerHTML = `
      <div class="rehab-summary-main">
        <span class="rehab-summary-label">REHABILITATION GUIDE</span>
        <h3>${athlete ? `${this.escapeHtml(athlete.name)} 선수의 운동 안내` : "재활 운동 안내"}</h3>
        <p>
          ${
            recommendedCategories.length
              ? "최근 평가에서 확인된 항목을 참고하여 관련 운동을 표시했습니다."
              : "기초적인 움직임과 신체 기능 유지를 위한 운동을 안내합니다."
          }
        </p>
      </div>

      <div class="rehab-summary-count">
        <strong>${filtered.length}</strong>
        <span>운동 프로그램</span>
      </div>
    `;

    container.appendChild(header);

    if (!athlete) {
      const notice = document.createElement("div");
      notice.className = "rehab-notice";
      notice.textContent = "선수를 선택하면 해당 선수의 최근 평가 결과를 참고할 수 있습니다.";
      container.appendChild(notice);
    }

    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "해당 카테고리에 등록된 운동이 없습니다.";
      container.appendChild(empty);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "rehab-card-grid";

    filtered.forEach((exercise) => {
      grid.appendChild(this.createExerciseCard(exercise));
    });

    container.appendChild(grid);

    const safetyNotice = document.createElement("div");
    safetyNotice.className = "rehab-safety-notice";

    safetyNotice.innerHTML = `
      <strong>운동 안전 안내</strong>
      <p>
        이 운동 정보는 일반적인 신체 기능 관리 참고 자료이며 의료적 진단이나
        개인별 치료 처방이 아닙니다. 운동 중 통증이 발생하거나 악화되면
        즉시 중단하세요. 급성 손상, 심한 부종, 체중을 싣기 어려운 상태가 있거나
        의료진의 운동 제한 지시를 받은 경우 전문가와 먼저 상담하세요.
      </p>
    `;

    container.appendChild(safetyNotice);
  },

  escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return map[character];
    });
  },

  getExercises() {
    return [...this.exercises];
  },

  getCompletedExercises() {
    return [...this.completedExercises];
  }
};

document.addEventListener("DOMContentLoaded", () => {
  RehabManager.init();
});

window.RehabManager = RehabManager;