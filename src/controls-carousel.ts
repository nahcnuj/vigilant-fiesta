/** Title-screen controls help carousel (touch / keys slides + dots). */
export function initControlsCarousel(): void {
  const root = document.querySelector("[data-controls-carousel]");
  const track = document.querySelector("[data-controls-track]");
  const dotsHost = document.querySelector("[data-controls-dots]");
  if (
    !(root instanceof HTMLElement) || !(track instanceof HTMLElement) ||
    !(dotsHost instanceof HTMLElement)
  ) {
    return;
  }
  const slides = [...track.querySelectorAll(".controls-slide")];
  if (slides.length === 0) return;

  const visible = () => {
    const w = track.clientWidth;
    if (w <= 0) return 1;
    const sw = (slides[0] as HTMLElement).getBoundingClientRect().width;
    return Math.max(1, Math.round(w / sw));
  };

  const syncDots = () => {
    const vis = visible();
    const needDots = slides.length > vis;
    dotsHost.hidden = !needDots;
    if (!needDots) {
      dotsHost.replaceChildren();
      return;
    }
    if (dotsHost.childElementCount !== slides.length) {
      dotsHost.replaceChildren();
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "controls-dot";
        b.setAttribute("aria-label", `スライド ${i + 1}`);
        b.addEventListener("click", () => {
          (slides[i] as HTMLElement).scrollIntoView({
            behavior: "smooth",
            inline: "start",
            block: "nearest",
          });
        });
        dotsHost.appendChild(b);
      });
    }
    const idx = Math.round(
      track.scrollLeft / Math.max(1, (slides[0] as HTMLElement).offsetWidth),
    );
    [...dotsHost.children].forEach((el, i) => {
      el.setAttribute("aria-current", i === idx ? "true" : "false");
    });
  };

  track.addEventListener("scroll", () => syncDots(), { passive: true });
  globalThis.addEventListener("resize", () => syncDots());
  syncDots();
}
