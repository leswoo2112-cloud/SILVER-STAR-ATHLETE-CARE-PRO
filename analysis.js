
/* =========================================================
   SILVER STAR ATHLETE CARE PRO
   FILE 07 : analysis.js

   주요 기능
   1. 신체 기능 평가 결과 입력
   2. 좌우 신체 기능 비교
   3. 통증 및 불편감 기록
   4. 검사별 결과 저장
   5. 미측정 항목 구분
   6. AI 관절 분석 결과 연동
   7. 리포트 기능에 평가 결과 전달

   주의:
   이 프로그램은 운동 기능 기록 및 참고용 평가 도구이며
   의학적 진단이나 부상 복귀 판정을 대신하지 않습니다.
========================================================= */

"use strict";

const AnalysisManager = {
  results: [],
  currentResult: null,

  // 평가 항목
  assessmentItems: [
    {
      id: "squat",
      name: "스쿼트",
      description: "양발로 앉았다 일어나는 동작의 안정성 평가",
      unit: "회",
      type: "number"
    },
    {
      id: "singleLegSquat",
      name: "한 발 스쿼트",
      description: "좌우 한 발 지지 시 균형과 움직임 평가",
      unit: "회",
      type: "side"
    },
    {
      id: "balance",
      name: "한 발 균형",
      description: "한 발로 서 있는 시간 측정",
      unit: "초",
      type: "side"
    },
    {
      id: "ankleMobility",
      name: "발목 가동범위",
      description: "발목의 좌우 움직임 범위 기록",
      unit: "도",
      type: "side"
    },
    {
      id: "kneeMobility",
      name: "무릎 가동범위",
      description: "무릎의 움직임 범위 기록",
      unit: "도",
      type: "side"
    },
    {
      id: "pain",
      name: "통증 정도",
      description: "운동 중 느끼는 통증 정도 기록",
      unit: "/10",
      type: "pain"
    }
  ],

  // 초기화
  init() {
    this.loadResults();
    this.setupForm();
    this.renderAssessmentItems();
    this.renderHistory();

    // AI 관절 분석 결과 수신
    document.addEventListener(
      "pose:analyzed",
      (event) => {
        this.receivePoseResult(event.detail);
      }
    );

    console.log("기능 평가 관리 기능이 준비되었습니다.");
  },

  // 폼 연결
  setupForm() {
    const form = document.getElementById(
      "assessment-form"
    );

    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.saveAssessment();
    });
  },

  // 평가 항목 화면 생성
  renderAssessmentItems() {
    const container = document.getElementById(
      "assessment-items"
    );

    if (!container) return;

    container.innerHTML = "";

    this.assessmentItems.forEach((item) => {
      const card = document.createElement("div");

      card.className = "panel";

      const title = document.createElement("h3");
      title.textContent = item.name;

      const description = document.createElement("p");
      description.className = "muted";
      description.textContent = item.description;

      card.append(title, description);

      if (item.type === "side") {
        card.appendChild(
          this.createSideInputs(item)
        );
      } else if (item.type === "pain") {
        card.appendChild(
          this.createPainInput(item)
        );
      } else {
        card.appendChild(
          this.createNumberInput(item)
        );
      }

      container.appendChild(card);
    });
  },

  // 입력 요소 생성
  createInput(id, labelText, unit) {
    const wrapper = document.createElement("label");

    wrapper.style.display = "grid";
    wrapper.style.gap = "7px";
    wrapper.style.marginTop = "12px";

    const label = document.createElement("span");
    label.textContent = labelText;

    const input = document.createElement("input");

    input.type = "number";
    input.id = id;
    input.step = "any";
    input.min = "0";
    input.placeholder = `${unit} 입력`;

    input.style.padding = "10px";
    input.style.border = "1px solid #dce5ef";
    input.style.borderRadius = "8px";

    wrapper.append(label, input);

    return wrapper;
  },

  // 일반 수치 입력
  createNumberInput(item) {
    const wrapper = document.createElement("div");

    wrapper.appendChild(
      this.createInput(
        `assessment-${item.id}`,
        `${item.name} (${item.unit})`,
        item.unit
      )
    );

    const status = this.createStatusSelect(
      `assessment-${item.id}-status`
    );

    wrapper.appendChild(status);

    return wrapper;
  },

  // 좌우 입력
  createSideInputs(item) {
    const wrapper = document.createElement("div");

    wrapper.style.display = "grid";
    wrapper.style.gridTemplateColumns =
      "repeat(2,minmax(0,1fr))";

    wrapper.style.gap = "12px";

    wrapper.appendChild(
      this.createInput(
        `assessment-${item.id}-left`,
        `왼쪽 (${item.unit})`,
        item.unit
      )
    );

    wrapper.appendChild(
      this.createInput(
        `assessment-${item.id}-right`,
        `오른쪽 (${item.unit})`,
        item.unit
      )
    );

    const status = this.createStatusSelect(
      `assessment-${item.id}-status`
    );

    const statusWrapper = document.createElement("div");
    statusWrapper.style.gridColumn = "1/-1";
    statusWrapper.appendChild(status);

    wrapper.appendChild(statusWrapper);

    return wrapper;
  },

  // 통증 입력
  createPainInput(item) {
    const wrapper = document.createElement("div");

    wrapper.appendChild(
      this.createInput(
        "assessment-pain",
        "통증 정도 (0~10)",
        "/10"
      )
    );

    const input = wrapper.querySelector("input");

    input.max = "10";
    input.step = "1";

    wrapper.appendChild(
      this.createStatusSelect(
        "assessment-pain-status"
      )
    );

    return wrapper;
  },

  // 측정 상태 선택
  createStatusSelect(id) {
    const wrapper = document.createElement("label");

    wrapper.style.display = "grid";
    wrapper.style.gap = "7px";
    wrapper.style.marginTop = "12px";

    const title = document.createElement("span");
    title.textContent = "측정 상태";

    const select = document.createElement("select");
    select.id = id;

    const options = [
      ["measured", "측정 완료"],
      ["not-measured", "미측정"],
      ["unable", "수행 불가"],
      ["pain", "통증으로 중단"]
    ];

    options.forEach(([value, text]) => {
      const option = document.createElement("option");

      option.value = value;
      option.textContent = text;

      select.appendChild(option);
    });

    select.style.padding = "10px";
    select.style.border = "1px solid #dce5ef";
    select.style.borderRadius = "8px";

    wrapper.append(title, select);

    return wrapper;
  },

  // 숫자값 읽기
  getNumber(id, min = 0, max = Infinity) {
    const input = document.getElementById(id);

    if (!input || input.value.trim() === "") {
      return null;
    }

    const value = Number(input.value);

    if (
      !Number.isFinite(value) ||
      value < min ||
      value > max
    ) {
      throw new Error(
        `${id} 항목의 입력값을 확인해 주세요.`
      );
    }

    return value;
  },

  // 측정 상태 읽기
  getStatus(id) {
    return (
      document.getElementById(id)?.value ||
      "measured"
    );
  },

  // 평가 결과 수집
  collectAssessment() {
    const data = {};

    this.assessmentItems.forEach((item) => {
      const status = this.getStatus(
        `assessment-${item.id}-status`
      );

      if (item.type === "side") {
        data[item.id] = {
          left:
            status === "measured"
              ? this.getNumber(
                  `assessment-${item.id}-left`
                )
              : null,

          right:
            status === "measured"
              ? this.getNumber(
                  `assessment-${item.id}-right`
                )
              : null,

          status
        };

      } else {
        const max =
          item.type === "pain" ? 10 : Infinity;

        data[item.id] = {
          value:
            status === "measured"
              ? this.getNumber(
                  `assessment-${item.id}`,
                  0,
                  max
                )
              : null,

          status
        };
      }
    });

    return data;
  },

  // 평가 저장
  saveAssessment() {
    try {
      const athlete =
        window.AthleteManager?.getSelectedAthlete();

      if (!athlete) {
        alert("먼저 선수를 선택해 주세요.");
        return;
      }

      const assessment = {
        id: `assessment-${Date.now()}`,
        athleteId: athlete.id,
        athleteName: athlete.name,
        data: this.collectAssessment(),
        notes:
          document.getElementById("assessment-notes")
            ?.value.trim() || "",
        date: new Date().toISOString()
      };

      this.results.push(assessment);

      this.currentResult = assessment;

      this.saveResults();
      this.renderHistory();

      document.dispatchEvent(
        new CustomEvent("assessment:saved", {
          detail: {
            assessment
          }
        })
      );

      alert("기능 평가 결과가 저장되었습니다.");

    } catch (error) {
      console.error("평가 저장 오류:", error);
      alert(error.message || "평가 결과를 저장하지 못했습니다.");
    }
  },

  // 평가 기록 표시
  renderHistory() {
    const container = document.getElementById(
      "assessment-history"
    );

    if (!container) return;

    container.innerHTML = "";

    const athlete =
      window.AthleteManager?.getSelectedAthlete();

    const filtered = this.results.filter(
      (item) =>
        !athlete || item.athleteId === athlete.id
    );

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          저장된 평가 기록이 없습니다.
        </div>
      `;

      return;
    }

    [...filtered].reverse().forEach((item) => {
      const row = document.createElement("div");

      row.className = "athlete-row";

      const info = document.createElement("div");
      info.className = "athlete-info";

      const name = document.createElement("b");
      name.textContent = item.athleteName;

      const date = document.createElement("small");
      date.textContent = new Date(
        item.date
      ).toLocaleString("ko-KR");

      info.append(name, date);

      const button = document.createElement("button");
      button.className = "athlete-select";
      button.textContent = "결과 보기";

      button.addEventListener("click", () => {
        this.viewAssessment(item.id);
      });

      row.append(info, button);
      container.appendChild(row);
    });
  },

  // 평가 결과 상세 보기
  viewAssessment(id) {
    const item = this.results.find(
      (result) => result.id === id
    );

    if (!item) return;

    this.currentResult = item;

    const output = document.getElementById(
      "assessment-detail"
    );

    if (!output) return;

    output.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = `${item.athleteName} 선수 평가 결과`;

    const date = document.createElement("p");
    date.className = "muted";
    date.textContent = new Date(
      item.date
    ).toLocaleString("ko-KR");

    output.append(title, date);

    this.assessmentItems.forEach((definition) => {
      const value = item.data[definition.id];

      const paragraph = document.createElement("p");

      if (!value) return;

      let text = definition.name + ": ";

      if (value.status !== "measured") {
        text += this.getStatusText(value.status);
      } else if (
        value.left !== undefined
      ) {
        text +=
          `왼쪽 ${value.left ?? "-"} ${definition.unit} / ` +
          `오른쪽 ${value.right ?? "-"} ${definition.unit}`;
      } else {
        text +=
          `${value.value ?? "-"} ${definition.unit}`;
      }

      paragraph.textContent = text;

      output.appendChild(paragraph);
    });

    if (item.notes) {
      const notes = document.createElement("p");
      notes.textContent = `메모: ${item.notes}`;
      output.appendChild(notes);
    }
  },

  // 측정 상태 한글 변환
  getStatusText(status) {
    const labels = {
      measured: "측정 완료",
      "not-measured": "미측정",
      unable: "수행 불가",
      pain: "통증으로 중단"
    };

    return labels[status] || "상태 미확인";
  },

  // AI 관절 분석 결과 수신
  receivePoseResult(data) {
    if (!data || !data.angles) return;

    this.currentPoseResult = {
      angles: data.angles,
      receivedAt: new Date().toISOString()
    };

    document.dispatchEvent(
      new CustomEvent("analysis:pose-received", {
        detail: this.currentPoseResult
      })
    );
  },

  // 선수별 평가 기록 가져오기
  getResultsByAthlete(athleteId) {
    return this.results
      .filter(
        (item) => item.athleteId === athleteId
      )
      .map((item) => ({ ...item }));
  },

  // 가장 최근 평가 결과 가져오기
  getLatestResult(athleteId) {
    const filtered = this.results
      .filter(
        (item) => item.athleteId === athleteId
      )
      .sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date)
      );

    return filtered[0] || null;
  },

  // 전체 평가 결과 저장
  saveResults() {
    try {
      localStorage.setItem(
        "silverStarAssessments",
        JSON.stringify(this.results)
      );
    } catch (error) {
      console.error("평가 결과 저장 실패:", error);
      alert("평가 결과를 저장하지 못했습니다.");
    }
  },

  // 평가 결과 불러오기
  loadResults() {
    try {
      const saved = localStorage.getItem(
        "silverStarAssessments"
      );

      if (!saved) return;

      const parsed = JSON.parse(saved);

      this.results = Array.isArray(parsed)
        ? parsed
        : [];

    } catch (error) {
      console.error("평가 결과 불러오기 실패:", error);
      this.results = [];
    }
  }
};

// 페이지 로딩 완료 후 실행
document.addEventListener("DOMContentLoaded", () => {
  AnalysisManager.init();
});

// 다른 파일에서 사용 가능하도록 등록
window.AnalysisManager = AnalysisManager;