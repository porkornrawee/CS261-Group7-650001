/**
 * main.js — จุดเริ่มต้นของแอป (Owner: Dev 1 | Ticket: CO-06)
 * ประกอบ AppHeader + router เข้ากับ index.html
 */
import { AppHeader } from './components/layout/AppHeader.js';
import { startRouter, currentPath } from './router.js';

const header = document.querySelector('#app-header');
function renderHeader() {
  // AppHeader ยังเป็น stub — ถ้ายังคืน todo-box ให้คงเมนูชั่วคราว #dev-nav ไว้ใน index.html
  const el = AppHeader({ activeRoute: currentPath(), student: null });
  if (!el.matches('[data-todo]')) header.replaceChildren(el);
}
renderHeader();
window.addEventListener('hashchange', renderHeader);
startRouter(document.querySelector('#app'));
