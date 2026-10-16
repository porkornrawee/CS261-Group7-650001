// ---------- ผลลัพธ์ ----------
function showTicket(data) {
  const r = data.reservation;
  stage.replaceChildren(
    h("article", { class: "ticket fresh" },
      h("div", { class: "ticket-head" }, h("span", { class: "p-sign", "aria-hidden": "true" }, "P"), "บัตรจองที่จอดรถ"),
      h("div", { class: "ticket-body" },
        h("img", { src: data.qr_data_uri, alt: "QR Code รหัสการจอง " + r.code }),
        h("div", { class: "ticket-code" }, r.code),
        h("p", { class: "ticket-note" }, "แสดง QR นี้ที่ทางเข้า · ",
          h("a", { href: data.qr_url, target: "_blank", rel: "noopener" }, "เปิดภาพ QR")),
        h("dl", { class: "ticket-meta" },
          h("dt", {}, "ผู้จอง"), h("dd", {}, r.user_name),
          h("dt", {}, "ช่องจอด"), h("dd", {}, `${r.slot} (${r.zone})`),
          h("dt", {}, "วันที่"), h("dd", {}, thaiDate(r.date)),
          h("dt", {}, "เวลา"), h("dd", {}, `${r.start}–${r.end} น.`)))));
  stage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showError(error) {
  stage.replaceChildren(
    h("div", { class: "alert", role: "alert" },
      h("h2", {}, ERROR_TITLES[error.code] || "จองไม่สำเร็จ"),
      h("p", {}, error.message),
      h("p", { class: "alert-code" }, "รหัสข้อผิดพลาด: " + error.code)));
  stage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function loadRecent() {
  const { body } = await api("/api/reservations?limit=10");
  const box = $("#recent");
  if (!body.reservations.length) {
    box.replaceChildren(h("p", { class: "empty" }, "ยังไม่มีรายการจอง"));
    return;
  }
  box.replaceChildren(h("ul", { class: "recent-list" }, body.reservations.map((r) =>
    h("li", {},
      h("span", { class: "r-slot", "aria-label": "ช่อง " + r.slot }, r.slot),
      h("div", { class: "r-main" },
        h("div", { class: "r-code" }, r.code),
        h("div", { class: "r-sub" },
          h("span", {}, r.user_name),
          h("span", {}, thaiDate(r.date)),
          h("span", {}, `${r.start}–${r.end} น.`)))))));
}
