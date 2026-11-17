
/* =========================================================
   SILVER STAR ATHLETE CARE PRO
   FILE 03 : main.js

   주요 기능
   1. 프로그램 초기화
   2. 메뉴 이동 및 화면 전환
   3. 홈 화면 빠른 메뉴 연결
   4. 현재 날짜 표시
   5. 언어 설정 버튼
   6. 화면 전환 이벤트 제공
========================================================= */

"use strict";

const App = {
  currentPage: "home",

  // 프로그램 초기화
  init() {
    this.setupNavigation();
    this.setupLanguageButton();
    this.setupCurrentDate();
    this.setupQuickActions();
    this.activateDefaultPage();

    console.log(
      "SILVER STAR ATHLETE CARE PRO가 정상적으로 실행되었습니다."
    );
  },

  // 메뉴 이동 기능
  setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        const target =
          item.dataset.page ||
          item.dataset.target ||
          item.getAttribute("href")?.replace("#", "");

        if (!target) return;

        // 페이지 이동
        this.showPage(target);

        // 링크 기본 동작 방지
        if (item.tagName === "A") {
          event.preventDefault();
        }
      });
    });
  },

  // 화면 전환 기능
  showPage(pageName) {
    const pages = document.querySelectorAll(".page");
    const navItems = document.querySelectorAll(".nav-item");

    let targetPage = document.getElementById(
      `page-${pageName}`
    );

    if (!targetPage) {
      targetPage = document.getElementById(pageName);
    }

    // 존재하지 않는 페이지 확인
    if (!targetPage) {
      console.warn(
        `화면을 찾을 수 없습니다: ${pageName}`
      );
      return false;
    }

    // 모든 페이지 비활성화
    pages.forEach((page) => {
      page.classList.remove("active");
    });

    // 선택한 페이지 활성화
    targetPage.classList.add("active");

    // 메뉴 선택 상태 변경
    navItems.forEach((item) => {
      const itemPage =
        item.dataset.page ||
        item.dataset.target ||
        item.getAttribute("href")?.replace("#", "");

      const isActive =
        itemPage === pageName ||
        itemPage === `page-${pageName}`;

      item.classList.toggle("active", isActive);
    });

    // 현재 페이지 저장
    this.currentPage = pageName;

    // 화면 상단으로 이동
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    // 다른 기능 파일에 페이지 변경 알림
    document.dispatchEvent(
      new CustomEvent("app:pagechange", {
        detail: {
          page: pageName
        }
      })
    );

    return true;
  },

  // 기본 화면 설정
  activateDefaultPage() {
    const activePage = document.querySelector(
      ".page.active"
    );

    if (activePage) {
      this.currentPage = activePage.id.replace(
        "page-",
        ""
      );

      return;
    }

    this.showPage("home");
  },

  // 언어 설정 버튼
  setupLanguageButton() {
    const languageButton = document.querySelector(
      ".language-toggle"
    );

    if (!languageButton) return;

    languageButton.addEventListener("click", () => {
      alert(
        "영어 전환 기능은 다음 업데이트에서 구현할 예정입니다."
      );
    });
  },

  // 현재 날짜 표시
  setupCurrentDate() {
    const dateElements = document.querySelectorAll(
      "[data-current-date]"
    );

    const today = new Date();

    const formattedDate = today.toLocaleDateString(
      "ko-KR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      }
    );

    dateElements.forEach((element) => {
      element.textContent = formattedDate;
    });
  },

  // 홈 화면 빠른 메뉴 버튼
  setupQuickActions() {
    const quickCards = document.querySelectorAll(
      ".quick-card"
    );

    quickCards.forEach((card) => {
      card.addEventListener("click", () => {
        const target =
          card.dataset.page ||
          card.dataset.target;

        if (target) {
          this.showPage(target);
        }
      });
    });
  },

  // 현재 페이지 확인
  getCurrentPage() {
    return this.currentPage;
  }
};

// DOM 준비 완료 후 프로그램 실행
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

// 다른 JavaScript 파일에서 접근할 수 있도록 등록
window.App = App;