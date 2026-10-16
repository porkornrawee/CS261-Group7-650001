// ---------- ชิปเลือกวัน / เวลาเริ่ม / ระยะเวลา ----------
function renderDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chips = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    chips.push(h("button", { type: "button", class: "chip date-chip", "data-value": ymd(d), "aria-pressed": "false" },
      h("span", { class: "dc-dow" }, i === 0 ? "วันนี้" : d.toLocaleDateString("th-TH", { weekday: "short" })),
      h("span", { class: "dc-day" }, String(d.getDate())),
      h("span", { class: "dc-mon" }, d.toLocaleDateString("th-TH", { month: "short" }))));
  }
  $("#date-strip").replaceChildren(...chips);
}

function renderTimes() {
  const chips = [];
  for (let m = openMin; m < closeMin; m += 60) {
    chips.push(h("button", { type: "button", class: "chip time-chip", "data-value": fromMin(m), "aria-pressed": "false" }, fromMin(m)));
  }
  $("#time-strip").replaceChildren(...chips);
}

function renderDurations() {
  $("#dur-strip").replaceChildren(...[30, 60, 120, 180, 240].map((m) =>
    h("button", { type: "button", class: "chip dur-chip", "data-value": m, "aria-pressed": "false" }, durationText(m))));
}

// ตั้งเวลาสิ้นสุดจาก "เวลาเริ่ม + ระยะเวลา" แต่ไม่เกินเวลาปิด
function applyDuration() {
  if (!form.start.value) return;
  const end = Math.min(toMin(form.start.value) + duration, closeMin);
  form.end.value = fromMin(end);
}

function syncChips() {
  const now = new Date();
  const isToday = form.date.value === ymd(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = form.start.value ? toMin(form.start.value) : null;
  const endMin = form.end.value ? toMin(form.end.value) : null;
  const span = startMin != null && endMin != null ? endMin - startMin : null;

  const mark = (chip, on) => { chip.classList.toggle("on", on); chip.setAttribute("aria-pressed", String(on)); };
  document.querySelectorAll(".date-chip").forEach((chip) => mark(chip, chip.dataset.value === form.date.value));
  document.querySelectorAll(".time-chip").forEach((chip) => {
    mark(chip, chip.dataset.value === form.start.value);
    chip.disabled = isToday && toMin(chip.dataset.value) < nowMin; // เวลาที่ผ่านไปแล้วของวันนี้
  });
  document.querySelectorAll(".dur-chip").forEach((chip) => mark(chip, span === Number(chip.dataset.value)));

  const text = $("#duration-text");
  if (span != null && span > 0) {
    text.replaceChildren("ช่วงเวลาที่เลือก ", h("b", {}, `${form.start.value}–${form.end.value} น.`), ` (${durationText(span)})`);
  } else {
    text.textContent = "";
  }
}

let refreshTimer;
function onTimeChange() {
  syncChips();
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refreshAvailability, 250);
}

$("#date-strip").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-value]");
  if (!chip) return;
  form.date.value = chip.dataset.value;
  onTimeChange();
});
$("#time-strip").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-value]");
  if (!chip || chip.disabled) return;
  form.start.value = chip.dataset.value;
  applyDuration();
  onTimeChange();
});
$("#dur-strip").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-value]");
  if (!chip) return;
  duration = Number(chip.dataset.value);
  applyDuration();
  onTimeChange();
});
