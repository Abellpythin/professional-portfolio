// ---------------------------------------------------------------------------
// tour.js — guided tour controller: a caption bar with previous / next /
// autoplay, driving main.js through `go(step)`.
// ---------------------------------------------------------------------------
export function createTour({ els, steps, go, onEnd }) {
  const { bar, count, say, prev, next, auto, exit } = els;
  let index = -1;
  let active = false;
  let playing = false;
  let timer = 0;
  const AUTO_MS = 8500;

  function show() {
    const step = steps[index];
    count.textContent = `${index + 1} / ${steps.length}`;
    say.textContent = step.say || step.id;
    say.title = say.textContent;
    prev.disabled = index <= 0;
    next.disabled = index >= steps.length - 1;
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing || !active) return;
    timer = setTimeout(() => { if (index < steps.length - 1) goTo(index + 1); else setPlaying(false); }, AUTO_MS);
  }
  function setPlaying(v) {
    playing = v;
    auto.textContent = v ? "⏸" : "⏵";
    auto.setAttribute("aria-pressed", String(v));
    auto.setAttribute("aria-label", v ? "Pause autoplay" : "Autoplay");
    schedule();
  }
  function goTo(i) {
    index = Math.max(0, Math.min(steps.length - 1, i));
    show();
    go(steps[index]);
    schedule();
  }

  prev.addEventListener("click", () => goTo(index - 1));
  next.addEventListener("click", () => goTo(index + 1));
  auto.addEventListener("click", () => setPlaying(!playing));
  exit.addEventListener("click", () => stop());

  function start() {
    if (!steps.length) return;
    active = true;
    bar.hidden = false;
    goTo(0);
  }
  function stop(silent = false) {
    if (!active) return;
    active = false;
    playing = false;
    clearTimeout(timer);
    setPlaying(false);
    bar.hidden = true;
    index = -1;
    if (!silent && onEnd) onEnd();
  }

  return {
    start, stop,
    next: () => active && goTo(index + 1),
    prev: () => active && goTo(index - 1),
    get active() { return active; },
  };
}
