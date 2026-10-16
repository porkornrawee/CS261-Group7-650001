// ---------- ผังช่องจอด ----------
async function loadLayout() {
  const { body } = await api("/api/zones");
  $("#hours").textContent = `เปิดให้จอง ${body.open_time}–${body.close_time} น.`;
  openMin = toMin(body.open_time);
  closeMin = toMin(body.close_time);

  slotInfo.clear();
  $("#lot").replaceChildren(...body.zones.map((zone) =>
    h("div", { class: "zone", "data-zone": zone.id, role: "radiogroup", "aria-label": zone.name },
      h("div", { class: "zone-head" },
        h("span", { class: "zone-name" }, zone.name),
        h("span", { class: "zone-count" })),
      h("div", { class: "bays" }, zone.slots.map((slot) => {
        slotInfo.set(slot.id, { label: slot.label, zone: zone.name, status: null, busy: [] });
        return h("label", { class: "bay", "data-slot": slot.id },
          h("input", { type: "radio", name: "slot_id", value: slot.id, "aria-label": `ช่อง ${slot.label}` }),
          h("span", { class: "bay-face" },
            h("span", { class: "bay-icon" }),
            h("span", { class: "bay-label" }, slot.label),
            h("span", { class: "bay-state" })));
      })))));

  renderTimes();
  syncChips();
}

function resetBays() {
  document.querySelectorAll(".bay").forEach((bay) => {
    bay.removeAttribute("data-status");
    bay.removeAttribute("title");
    bay.querySelector(".bay-icon").replaceChildren();
    bay.querySelector(".bay-state").textContent = "";
    const info = slotInfo.get(Number(bay.dataset.slot));
    if (info) { info.status = null; info.busy = []; }
  });
  document.querySelectorAll(".zone-count").forEach((count) => {
    count.textContent = "";
    count.classList.remove("ok", "full");
  });
  document.querySelectorAll("[data-count]").forEach((n) => { n.textContent = "–"; });
}

async function refreshAvailability() {
  const ticket = ++availabilityRequest;
  const query = new URLSearchParams({ date: form.date.value, start: form.start.value, end: form.end.value });
  if (!form.date.value || !form.start.value || !form.end.value) return;
  const { status, body } = await api("/api/availability?" + query);
  if (ticket !== availabilityRequest) return; // มีคำขอใหม่กว่าแล้ว ข้ามผลเก่า

  const hint = $("#time-hint");
  resetBays();
  if (status !== 200) { hint.textContent = body.error.message; updatePick(); return; }
  hint.textContent = "";

  // หมายเหตุ: ช่องที่ถูกจองยังกดเลือกได้ เพื่อให้เห็นว่า Backend เป็นผู้ตัดสินจริง ไม่ใช่แค่ UI
  const totals = { free: 0, partial: 0, booked: 0 };
  for (const slot of body.slots) {
    const bay = document.querySelector(`.bay[data-slot="${slot.id}"]`);
    if (!bay) continue;
    // เผื่อ API รุ่นเก่าที่ยังไม่มี status: booked = ไม่ว่าง
    const state = slot.status || (slot.booked ? "booked" : "free");
    const busy = slot.busy || [];
    const info = slotInfo.get(slot.id);
    info.status = state;
    info.busy = busy;
    totals[state]++;

    bay.dataset.status = state;
    bay.querySelector(".bay-icon").replaceChildren(icon(STATUS_ICON[state]));
    bay.querySelector(".bay-state").textContent = STATUS_TEXT[state];
    bay.querySelector("input").setAttribute("aria-label", `ช่อง ${info.label} ${STATUS_TEXT[state]}`);
    if (busy.length) bay.title = "ติดจอง " + busy.map((b) => `${b.start}–${b.end}`).join(", ");
  }
  for (const key of Object.keys(totals)) $(`[data-count="${key}"]`).textContent = totals[key];

  for (const zone of body.zones) {
    const count = document.querySelector(`.zone[data-zone="${zone.id}"] .zone-count`);
    count.textContent = zone.full ? "เต็ม" : `ว่าง ${zone.free}/${zone.total}`;
    count.classList.add(zone.full ? "full" : "ok");
  }
  updatePick();
}

// แถบสรุปช่องที่เลือก
function updatePick() {
  const box = $("#pick");
  const picked = form.querySelector('input[name="slot_id"]:checked');
  box.className = "pick";
  if (!picked) {
    box.replaceChildren(h("span", { class: "dot picked" }), h("span", {}, "ยังไม่ได้เลือกช่องจอด แตะช่องที่ต้องการในผังด้านบน"));
    return;
  }
  const info = slotInfo.get(Number(picked.value));
  const head = `ช่อง ${info.label} · ${info.zone} · `;
  const busyText = info.busy.map((b) => `${b.start}–${b.end}`).join(", ");
  let tone = "", message = head.replace(/ · $/, "");
  if (info.status === "free") { tone = "ok"; message = head + "ว่างตลอดช่วงเวลาที่เลือก"; }
  else if (info.status === "partial") { tone = "warn"; message = head + `ติดจอง ${busyText} น. ลองเลื่อนเวลาให้พ้นช่วงนี้`; }
  else if (info.status === "booked") { tone = "bad"; message = head + "ไม่ว่างในช่วงเวลานี้ ระบบจะไม่รับการจอง"; }
  if (tone) box.classList.add(tone);
  box.replaceChildren(h("span", { class: "dot " + ({ ok: "free", warn: "partial", bad: "booked" }[tone] || "picked") }), h("span", {}, message));
}
form.addEventListener("change", (event) => { if (event.target.name === "slot_id") updatePick(); });
