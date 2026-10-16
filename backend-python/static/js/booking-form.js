// ---------- กดยืนยันการจอง ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = $("#submit");
  const picked = form.querySelector('input[name="slot_id"]:checked');
  submit.disabled = true;
  submit.textContent = "กำลังจอง…";
  try {
    const { status, body } = await api("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: form.user_name.value,
        slot_id: picked ? Number(picked.value) : null,
        date: form.date.value,
        start: form.start.value,
        end: form.end.value,
      }),
    });
    if (status === 201) { showTicket(body); if (picked) picked.checked = false; } else showError(body.error);
  } catch (networkError) {
    showError({ code: "NETWORK", message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง" });
  } finally {
    submit.disabled = false;
    submit.textContent = "ยืนยันการจอง";
  }
  refreshAvailability();
  loadRecent();
});
