// ---------- เริ่มต้น ----------
(function init() {
  $("#ico-clock").replaceWith(icon("clock"));
  $("#ico-ticket").replaceWith(icon("ticket"));

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  form.date.value = ymd(tomorrow);
  form.date.min = ymd(new Date());
  form.start.value = "09:00";
  form.end.value = "10:00";

  renderDates();
  renderDurations();
  updatePick();

  // ช่องกรอกเวลา/วันที่แบบเดิมยังใช้ได้ และจะซิงก์กับชิปให้อัตโนมัติ
  for (const name of ["date", "start", "end"]) form[name].addEventListener("input", onTimeChange);

  loadLayout().then(() => { syncChips(); refreshAvailability(); });
  loadRecent();
})();
