/**
 * core/dom.js — ตัวช่วยสร้าง DOM (Owner: Dev 1 | Ticket: CO-01)
 * PM เตรียม h() และ todo() ให้ใช้งานได้ก่อน Dev 1 ต้อง:
 *  - ย้าย/ปรับ icon() จาก backend-python/static/index.html บรรทัด ~374-400 มาไว้ที่นี่
 *  - เพิ่ม $(selector) และ clear(el) ถ้าจำเป็น
 */

/**
 * สร้าง element: h('div', { class: 'x', onClick: fn }, 'ข้อความ', childEl)
 * props ที่ขึ้นต้น on = event listener, class/className = class, dataset/aria ใส่เป็น attribute ปกติ
 */
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class' || key === 'className') {
      el.className = value;
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === undefined || kid === null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

/** กล่องบอกว่า component/page นี้ยังเป็น stub — Dev ลบการเรียกนี้เมื่อทำจริง */
export function todo(name, owner, ticket, params) {
  const extra = params && Object.keys(params).length ? ` params=${JSON.stringify(params)}` : '';
  return h('div', { class: 'todo-box', 'data-todo': name },
    h('b', null, `TODO: ${name}`),
    h('small', null, `เจ้าของงาน: Dev ${owner} · ใบงาน ${ticket}${extra}`),
  );
}
