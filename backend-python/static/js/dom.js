// สร้าง element อย่างปลอดภัย: ข้อความทุกตัวถูกใส่เป็น text node (กัน XSS จากชื่อผู้จอง)
function h(tag, props, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === false || value == null) continue;
    if (key === "class") node.className = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) node.append(kid);
  return node;
}

// ไอคอน SVG เป็นค่าคงที่ในโค้ดนี้เท่านั้น (ไม่มีข้อมูลจากผู้ใช้) จึงใช้ innerHTML ได้อย่างปลอดภัย
const ICONS = {
  car: '<svg viewBox="0 0 24 24"><path d="M5.2 10.5 6.6 6.6A2.5 2.5 0 0 1 9 5h6a2.5 2.5 0 0 1 2.4 1.6l1.4 3.9h.2A2 2 0 0 1 21 12.5V17a1 1 0 0 1-1 1h-1.1a2.5 2.5 0 0 1-4.8 0H9.9a2.5 2.5 0 0 1-4.8 0H4a1 1 0 0 1-1-1v-4.5a2 2 0 0 1 2-2h.2zm2.3 0h9l-.9-2.6a.6.6 0 0 0-.6-.4H9a.6.6 0 0 0-.6.4l-.9 2.6zM7.5 16.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.2l3.6 2.1-.8 1.3L11 13V7h2z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.4L6.6 12.2 8 10.8l2.8 2.8 5.2-5.2 1.4 1.4-6.6 6.6z"/></svg>',
  ticket: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.2a2.8 2.8 0 0 0 0 5.6V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.2a2.8 2.8 0 0 0 0-5.6V7zm6 1.5v7h2v-7H9zm4 0v7h2v-7h-2z"/></svg>',
};
function icon(name) {
  const node = h("span", { class: "ico", "aria-hidden": "true" });
  node.innerHTML = ICONS[name];
  return node;
}
