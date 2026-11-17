
"use strict";

/**
 * SILVER STAR ATHLETE CARE PRO
 * File: report.js
 *
 * 선수별 평가 리포트 및 시각화
 * 의료적 진단이나 복귀 판정을 제공하지 않습니다.
 */

const ReportManager = {
  currentAssessment: null,

  init() {
    this.setupEvents();
    this.renderReport();

    console.log("평가 리포트 모듈이 초기화되었습니다.");
  },

  setupEvents() {
    document.addEventListener("athlete:selected", () => {
      this.renderReport();
    });

    document.addEventListener("assessment:saved", () => {
      this.renderReport();
    });

    document.addEventListener("app:pagechange", (event) => {
      if (event.detail?.page === "report") {
        this.renderReport();
      }
    });

    const printButton = document.getElementById("report-print");

    if (printButton) {
      printButton.addEventListener("click", () => {
        this.printReport();
      });
    }

    const refreshButton = document.getElementById("report-refresh");

    if (refreshButton) {
      refreshButton.addEventListener("click", () => {
        this.renderReport();
      });
    }
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

  getAssessmentHistory(athleteId) {
    const manager = window.AnalysisManager;

    if (!manager) return [];

    if (typeof manager.getHistory === "function") {
      const history = manager.getHistory(athleteId);
      return Array.isArray(history) ? history : [];
    }

    try {
      const saved = JSON.parse(
        localStorage.getItem("silverStarAssessments") || "[]"
      );

      if (!Array.isArray(saved)) return [];

      return saved.filter(
        (item) => String(item.athleteId) === String(athleteId)
      );
    } catch (error) {
      console.error("평가 기록을 불러오지 못했습니다.", error);
      return [];
    }
  },

  getLatestAssessment(history) {
    if (!history.length) return null;

    return [...history].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();

      return dateB - dateA;
    })[0];
  },

  getItems(assessment) {
    if (!assessment) return [];

    if (Array.isArray(assessment.items)) {
      return assessment.items;
    }

    if (Array.isArray(assessment.results)) {
      return assessment.results;
    }

    return [];
  },

  getItemName(item) {
    const names = {
      squat: "양발 스쿼트",
      singleLegSquat: "한 발 스쿼트",
      balance: "한 발 균형",
      ankleMobility: "발목 가동범위",
      kneeMobility: "무릎 가동범위",
      pain: "통증 정도"
    };

    return item.name || names[item.id] || item.id || "기타 평가";
  },

  getValue(item, side) {
    const possibleKeys = [
      side,
      `${side}Value`,
      `${side}Result`,
      `${side}Score`
    ];

    for (const key of possibleKeys) {
      const value = item[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        Number.isFinite(Number(value))
      ) {
        return Number(value);
      }
    }

    return null;
  },

  getStatusLabel(status) {
    const labels = {
      measured: "측정 완료",
      "not-measured": "미측정",
      unable: "수행 불가",
      pain: "통증으로 중단"
    };

    return labels[status] || "상태 확인 필요";
  },

  getAssessmentDate(assessment) {
    const value =
      assessment.date ||
      assessment.createdAt ||
      assessment.updatedAt;

    if (!value) return "날짜 정보 없음";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  },

  getSummary(assessment) {
    const items = this.getItems(assessment);

    const measured = items.filter(
      (item) => item.status === "measured"
    ).length;

    const unable = items.filter(
      (item) => item.status === "unable"
    ).length;

    const pain = items.filter(
      (item) => item.status === "pain"
    ).length;

    const notMeasured = items.filter(
      (item) => item.status === "not-measured"
    ).length;

    const painItem = items.find((item) => item.id === "pain");

    let painValue = null;

    if (painItem) {
      painValue =
        this.getValue(painItem, "left") ??
        this.getValue(painItem, "right") ??
        this.getValue(painItem, "value");
    }

    return {
      total: items.length,
      measured,
      unable,
      pain,
      notMeasured,
      painValue
    };
  },

  renderReport() {
    const container = document.getElementById("report-content");

    if (!container) {
      this.renderLegacyElements();
      return;
    }

    const athlete = this.getSelectedAthlete();

    if (!athlete) {
      container.innerHTML = `
        <div class="report-empty">
          <div class="report-empty-icon">📋</div>
          <h3>선수를 선택해 주세요.</h3>
          <p>선수를 선택하면 해당 선수의 평가 기록과 분석 결과를 확인할 수 있습니다.</p>
        </div>
      `;

      this.updateLegacyElements(null);
      return;
    }

    const history = this.getAssessmentHistory(athlete.id);
    const latest = this.getLatestAssessment(history);

    this.currentAssessment = latest;

    if (!latest) {
      container.innerHTML = `
        <div class="report-empty">
          <div class="report-empty-icon">📊</div>
          <h3>아직 평가 기록이 없습니다.</h3>
          <p>기능 평가 화면에서 평가를 진행하고 저장하면 이곳에 리포트가 생성됩니다.</p>
        </div>
      `;

      this.updateLegacyElements(null);
      return;
    }

    const summary = this.getSummary(latest);
    const items = this.getItems(latest);

    container.innerHTML = `
      <div class="report-header">
        <div>
          <span class="report-eyebrow">ATHLETE PERFORMANCE REPORT</span>
          <h2>${this.escapeHtml(athlete.name)} 선수 평가 리포트</h2>
          <p>평가 일시: ${this.escapeHtml(this.getAssessmentDate(latest))}</p>
        </div>

        <div class="report-header-actions">
          <button type="button" id="report-print-inner" class="report-action-button">
            리포트 인쇄 / PDF 저장
          </button>
        </div>
      </div>

      <section class="report-summary-grid">
        ${this.createSummaryCard("평가 항목", summary.total, "전체 평가 항목")}
        ${this.createSummaryCard("측정 완료", summary.measured, "측정이 완료된 항목")}
        ${this.createSummaryCard("수행 불가", summary.unable, "수행하지 못한 항목")}
        ${this.createSummaryCard("통증 중단", summary.pain, "통증으로 중단한 항목")}
      </section>

      <section class="report-section">
        <div class="report-section-heading">
          <div>
            <span>01 / ASSESSMENT OVERVIEW</span>
            <h3>기능 평가 결과</h3>
          </div>
        </div>

        <div class="report-table-wrap">
          ${this.createResultTable(items)}
        </div>
      </section>

      <section class="report-section">
        <div class="report-section-heading">
          <div>
            <span>02 / LEFT & RIGHT COMPARISON</span>
            <h3>좌우 신체 기능 비교</h3>
          </div>
        </div>

        <div class="report-chart-grid">
          ${this.createComparisonCharts(items)}
        </div>
      </section>

      <section class="report-section">
        <div class="report-section-heading">
          <div>
            <span>03 / PAIN & NOTES</span>
            <h3>통증 및 평가 메모</h3>
          </div>
        </div>

        ${this.createPainSection(summary, items)}

        <div class="report-notes">
          <strong>평가 메모</strong>
          <p>${this.escapeHtml(latest.notes || "작성된 메모가 없습니다.")}</p>
        </div>
      </section>

      <section class="report-section">
        <div class="report-section-heading">
          <div>
            <span>04 / ASSESSMENT HISTORY</span>
            <h3>평가 기록 이력</h3>
          </div>
        </div>

        ${this.createHistory(history)}
      </section>

      <div class="report-disclaimer">
        <strong>안내 사항</strong>
        <p>
          본 리포트는 입력된 기능 평가 자료를 정리한 참고 자료입니다.
          의료적 진단, 부상 여부의 확정 또는 경기 복귀 가능 여부를 판단하지 않습니다.
          통증이나 기능 제한이 지속되면 의료 전문가의 평가를 받으세요.
        </p>
      </div>
    `;

    const innerPrint = document.getElementById("report-print-inner");

    if (innerPrint) {
      innerPrint.addEventListener("click", () => {
        this.printReport();
      });
    }

    this.updateLegacyElements(latest);
  },

  createSummaryCard(title, value, description) {
    return `
      <article class="report-summary-card">
        <span>${this.escapeHtml(title)}</span>
        <strong>${Number(value) || 0}</strong>
        <small>${this.escapeHtml(description)}</small>
      </article>
    `;
  },

  createResultTable(items) {
    if (!items.length) {
      return `<p class="report-no-data">표시할 평가 항목이 없습니다.</p>`;
    }

    const rows = items.map((item) => {
      const left = this.getValue(item, "left");
      const right = this.getValue(item, "right");

      const leftText = left === null ? "-" : left;
      const rightText = right === null ? "-" : right;

      return `
        <tr>
          <td>${this.escapeHtml(this.getItemName(item))}</td>
          <td>${this.escapeHtml(String(leftText))}</td>
          <td>${this.escapeHtml(String(rightText))}</td>
          <td>
            <span class="report-status status-${this.escapeHtml(item.status || "unknown")}">
              ${this.escapeHtml(this.getStatusLabel(item.status))}
            </span>
          </td>
        </tr>
      `;
    }).join("");

    return `
      <table class="report-table">
        <thead>
          <tr>
            <th>평가 항목</th>
            <th>왼쪽</th>
            <th>오른쪽</th>
            <th>측정 상태</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  createComparisonCharts(items) {
    const comparable = items.filter((item) => {
      return (
        item.status === "measured" &&
        this.getValue(item, "left") !== null &&
        this.getValue(item, "right") !== null
      );
    });

    if (!comparable.length) {
      return `
        <div class="report-chart-empty">
          좌우 비교가 가능한 측정 데이터가 없습니다.
        </div>
      `;
    }

    return comparable.map((item) => {
      const left = this.getValue(item, "left");
      const right = this.getValue(item, "right");
      const max = Math.max(left, right, 1);
      const leftWidth = (left / max) * 100;
      const rightWidth = (right / max) * 100;
      const difference = Math.abs(left - right);

      return `
        <article class="report-chart-card">
          <h4>${this.escapeHtml(this.getItemName(item))}</h4>

          <div class="report-bar-row">
            <span>왼쪽</span>
            <div class="report-bar-track">
              <div class="report-bar-fill left-fill" style="width:${leftWidth}%"></div>
            </div>
            <strong>${this.escapeHtml(String(left))}</strong>
          </div>

          <div class="report-bar-row">
            <span>오른쪽</span>
            <div class="report-bar-track">
              <div class="report-bar-fill right-fill" style="width:${rightWidth}%"></div>
            </div>
            <strong>${this.escapeHtml(String(right))}</strong>
          </div>

          <div class="report-difference">
            좌우 수치 차이: <strong>${this.escapeHtml(String(difference))}</strong>
          </div>
        </article>
      `;
    }).join("");
  },

  createPainSection(summary, items) {
    const painItem = items.find((item) => item.id === "pain");

    if (!painItem || summary.painValue === null) {
      return `
        <div class="report-pain-card">
          <strong>통증 수치</strong>
          <p>통증 데이터가 입력되지 않았습니다.</p>
        </div>
      `;
    }

    const value = Math.max(0, Math.min(10, summary.painValue));

    return `
      <div class="report-pain-card">
        <div>
          <span>PAIN SCALE</span>
          <strong>${this.escapeHtml(String(value))}<small> / 10</small></strong>
        </div>
        <div class="report-pain-track">
          <div class="report-pain-fill" style="width:${value * 10}%"></div>
        </div>
        <p>0은 통증 없음, 10은 상상할 수 있는 가장 심한 통증을 의미하는 주관적 수치입니다.</p>
      </div>
    `;
  },

  createHistory(history) {
    if (!history.length) {
      return `<p class="report-no-data">평가 이력이 없습니다.</p>`;
    }

    const sorted = [...history].sort((a, b) => {
      return new Date(b.date || b.createdAt || 0) -
        new Date(a.date || a.createdAt || 0);
    });

    return `
      <div class="report-history-list">
        ${sorted.map((item, index) => {
          const summary = this.getSummary(item);

          return `
            <article class="report-history-item">
              <div>
                <strong>${index === 0 ? "최근 평가" : `평가 기록 ${index + 1}`}</strong>
                <p>${this.escapeHtml(this.getAssessmentDate(item))}</p>
              </div>
              <div class="report-history-stats">
                <span>측정 완료 ${summary.measured}</span>
                <span>수행 불가 ${summary.unable}</span>
                <span>통증 중단 ${summary.pain}</span>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  },

  renderLegacyElements() {
    const athlete = this.getSelectedAthlete();

    if (!athlete) {
      this.updateLegacyElements(null);
      return;
    }

    const history = this.getAssessmentHistory(athlete.id);
    const latest = this.getLatestAssessment(history);

    this.currentAssessment = latest;
    this.updateLegacyElements(latest);
  },

  updateLegacyElements(assessment) {
    const summary = assessment ? this.getSummary(assessment) : null;

    const fields = {
      "report-total": summary?.total ?? 0,
      "report-measured": summary?.measured ?? 0,
      "report-unable": summary?.unable ?? 0,
      "report-pain": summary?.pain ?? 0
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value);
    });

    const dateElement = document.getElementById("report-date");

    if (dateElement) {
      dateElement.textContent = assessment
        ? this.getAssessmentDate(assessment)
        : "평가 기록 없음";
    }
  },

  printReport() {
    if (!this.currentAssessment) {
      alert("인쇄할 평가 리포트가 없습니다.");
      return;
    }

    window.print();
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
  }
};

document.addEventListener("DOMContentLoaded", () => {
  ReportManager.init();
});

window.ReportManager = ReportManager;