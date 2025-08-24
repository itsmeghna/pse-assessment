(() => {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const burger = document.querySelector(".site-header__burger");
  const nav = document.querySelector(".site-header__nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("site-header__nav--open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  class Carousel {
    constructor(root) {
      this.root = root;
      this.axis = root.dataset.axis || "x";
      this.autoplay = root.dataset.autoplay === "true" && !prefersReduced;
      this.interval = Number(root.dataset.interval) || 5000;
      this.viewport = root.querySelector(".carousel__viewport");
      this.slidesEl = root.querySelector(".carousel__slides");
      this.slides = Array.from(root.querySelectorAll(".carousel__slide"));
      this.dots = root.querySelector(".carousel__dots");
      this.status = root.querySelector(".carousel__status-text");
      this.index = this.slides.findIndex((s) =>
        s.classList.contains("is-active")
      );
      if (this.index < 0) this.index = 0;
      this.timer = null;

      this.init();
    }

    init() {
      if (this.dots) this.buildDots();
      this.update();
      this.bindControls();
      if (this.autoplay) this.start();
      if (
        this.root.dataset.pauseOnHover === "true" &&
        this.root.matches(":hover") === false
      ) {
        this.root.addEventListener("mouseenter", () => this.stop());
        this.root.addEventListener(
          "mouseleave",
          () => this.autoplay && this.start()
        );
        this.root.addEventListener("focusin", () => this.stop());
        this.root.addEventListener(
          "focusout",
          () => this.autoplay && this.start()
        );
      }
    }

    buildDots() {
      this.dots.innerHTML = "";
      this.slides.forEach((_, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", `Go to slide ${i + 1}`);
        btn.addEventListener("click", () => this.go(i));
        this.dots.appendChild(btn);
      });
    }

    bindControls() {
      this.root.querySelectorAll("[data-dir]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const dir = btn.dataset.dir || "";
          dir.includes("next") ? this.next() : this.prev();
        });
      });

      this.root.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          if (this.timer) {
            this.stop();
            btn.setAttribute("aria-pressed", "false");
            btn.textContent = "►";
          } else {
            this.start();
            btn.setAttribute("aria-pressed", "true");
            btn.textContent = "❚❚";
          }
        });
      });

      this.root.querySelectorAll('[data-action="axis"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          this.axis = this.axis === "x" ? "y" : "x";
          this.root.setAttribute("data-axis", this.axis);
          this.update();
        });
      });

      this.root.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") this.next();
        if (e.key === "ArrowLeft") this.prev();
        if (e.key === "Home") this.go(0);
        if (e.key === "End") this.go(this.slides.length - 1);
      });

      let startX = 0,
        startY = 0,
        active = false;
      this.viewport.addEventListener("pointerdown", (e) => {
        active = true;
        startX = e.clientX;
        startY = e.clientY;
      });
      this.viewport.addEventListener("pointerup", (e) => {
        if (!active) return;
        const dx = e.clientX - startX,
          dy = e.clientY - startY;
        const TH = 30;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > TH)
          dx < 0 ? this.next() : this.prev();
        else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > TH)
          dy < 0 ? this.next() : this.prev();
        active = false;
      });
    }

    start() {
      this.stop();
      this.timer = setInterval(() => this.next(), this.interval);
    }
    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
    next() {
      this.go((this.index + 1) % this.slides.length);
    }
    prev() {
      this.go((this.index - 1 + this.slides.length) % this.slides.length);
    }

    go(i) {
      this.index = i;
      const offset = -this.index * 100;
      this.slidesEl.style.transform =
        this.axis === "x" ? `translateX(${offset}%)` : `translateY(${offset}%)`;
      this.slides.forEach((s, idx) => {
        s.classList.toggle("is-active", idx === this.index);
        s.tabIndex = idx === this.index ? 0 : -1;
        s.setAttribute("aria-hidden", idx === this.index ? "false" : "true");
      });
      if (this.dots)
        Array.from(this.dots.children).forEach((b, idx) =>
          b.setAttribute("aria-current", idx === this.index ? "true" : "false")
        );
      if (this.status)
        this.status.textContent = `Slide ${this.index + 1} of ${
          this.slides.length
        }`;
    }

    update() {
      this.go(this.index);
    }
  }

  document.querySelectorAll(".carousel").forEach((root) => new Carousel(root));

  (function cardsDots() {
    const cards = document.querySelector('.cards[data-mobile-slider="true"]');
    const dotsWrap = document.querySelector(".dots");
    if (!cards || !dotsWrap) return;

    function createDots() {
      dotsWrap.innerHTML = "";
      const items = Array.from(cards.children);
      items.forEach((_, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", `Go to card ${i + 1}`);
        btn.addEventListener("click", () => {
          items[i].scrollIntoView({ behavior: "smooth", inline: "center" });
        });
        dotsWrap.appendChild(btn);
      });

      cards.addEventListener(
        "scroll",
        () => {
          const center = cards.scrollLeft + cards.clientWidth / 2;
          const idx = Array.from(cards.children).reduce(
            (best, el, i) => {
              const box = el.offsetLeft + el.offsetWidth / 2;
              const diff = Math.abs(center - box);
              return diff < best.diff ? { i, diff } : best;
            },
            { i: 0, diff: Infinity }
          ).i;
          Array.from(dotsWrap.children).forEach((b, j) =>
            b.setAttribute("aria-current", j === idx ? "true" : "false")
          );
        },
        { passive: true }
      );
    }

    createDots();
    window.addEventListener("resize", createDots);
  })();
})();
