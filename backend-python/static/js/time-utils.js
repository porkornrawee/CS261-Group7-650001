function pad(n) { return String(n).padStart(2, "0"); }
function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function toMin(text) { const [hh, mm] = text.split(":").map(Number); return hh * 60 + mm; }
function fromMin(n) { return pad(Math.floor(n / 60)) + ":" + pad(n % 60); }
function durationText(m) {
  if (m < 60) return `${m} นาที`;
  const hours = Math.floor(m / 60), rest = m % 60;
  return rest ? `${hours} ชม. ${rest} นาที` : `${hours} ชม.`;
}

// 2026-10-20 -> "20 ต.ค. 2569"
function thaiDate(text) {
  const [y, m, d] = text.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
