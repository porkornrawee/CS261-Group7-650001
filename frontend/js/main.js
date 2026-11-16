/** Application entry point: header/footer ทุกหน้า, สถานะล็อกอิน (US11) และ poll แจ้งเตือนของผู้ใช้ (US4) */
import { AppHeader } from './components/layout/AppHeader.js';
import { AppFooter } from './components/layout/AppFooter.js';
import { getState, subscribe } from './store.js';
import { ensureSession, signOut } from './features/auth/session.js';
import { listNotifications, markNotificationRead } from './api/notifications.js';
import { NotificationList, notificationMeta, resetNotificationFilter } from './features/notification/NotificationList.js';
import { showToast } from './components/ui/Toast.js';
import { startRouter, currentPath } from './router.js';

const header = document.querySelector('#app-header');
document.querySelector('#app-footer')?.replaceChildren(AppFooter());
let notifications = [];
let unreadCount = 0;
let notificationPanelOpen = false;
const knownNotificationIds = new Set();
let initialPollCompleted = false;
let polling = false;

function renderHeader() {
  const el = AppHeader({
    activeRoute: currentPath(),
    activeHash: window.location.hash,
    user: getState().user,
    onLogout: () => {
      notificationPanelOpen = false;
      resetNotificationFilter();
      signOut().catch(() => showToast('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่', 'error'));
    },
    unreadCount,
    notificationsOpen: notificationPanelOpen,
    onToggleNotifications: () => {
      notificationPanelOpen = !notificationPanelOpen;
      renderHeader();
    },
  });
  header.replaceChildren(el);

  if (notificationPanelOpen) {
    const list = NotificationList({
      notifications,
      onRead: async (id) => {
        try {
          await markNotificationRead(id);
          await pollNotifications();
        } catch {
          showToast('ทำเครื่องหมายแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่', 'error');
        }
      },
      onReadAll: async (ids) => {
        const results = await Promise.allSettled(ids.map((id) => markNotificationRead(id)));
        await pollNotifications();
        if (results.some((r) => r.status === 'rejected')) {
          showToast('ทำเครื่องหมายอ่านแล้วไม่ครบทุกรายการ กรุณาลองใหม่', 'error');
        }
      },
    });
    el.append(list);
  }
}

async function pollNotifications() {
  if (polling || !getState().user) return;
  polling = true;
  try {
    const response = await listNotifications();
    const next = response.notifications;
    for (const notification of next) {
      const id = String(notification.id);
      if (initialPollCompleted && !notification.read_at && !knownNotificationIds.has(id)) {
        showToast(notification.message || 'มีการแจ้งเตือนใหม่', 'info', notificationMeta(notification.type).icon);
      }
      knownNotificationIds.add(id);
    }
    initialPollCompleted = true;
    notifications = next;
    unreadCount = Number.isFinite(response.unread_count)
      ? response.unread_count
      : next.filter((notification) => !notification.read_at).length;
    renderHeader();
  } catch {
    // Preserve the last successful result if the service is temporarily unavailable.
  } finally {
    polling = false;
  }
}

let lastUserId = null;
subscribe((state) => {
  const userId = state.user?.student_id || null;
  if (userId !== lastUserId) {
    lastUserId = userId;
    notifications = [];
    unreadCount = 0;
    knownNotificationIds.clear();
    initialPollCompleted = false;
    if (userId) pollNotifications();
  }
  renderHeader();
});

renderHeader();
window.addEventListener('hashchange', () => {
  notificationPanelOpen = false; // เปลี่ยนหน้าแล้วปิดแผงแจ้งเตือน
  renderHeader();
});

// ปิดแผงแจ้งเตือนเมื่อกด Esc (คืนโฟกัสให้ปุ่มกระดิ่ง) หรือคลิกนอกแผง
function closeNotificationPanel({ restoreFocus = false } = {}) {
  if (!notificationPanelOpen) return;
  notificationPanelOpen = false;
  renderHeader();
  if (restoreFocus) header.querySelector('.app-header-notifications-toggle')?.focus();
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNotificationPanel({ restoreFocus: true });
});
document.addEventListener('click', (event) => {
  if (!notificationPanelOpen) return;
  const target = event.target;
  if (target.closest?.('#header-notification-list, .app-header-notifications-toggle')) return;
  if (!target.isConnected) return; // รายการที่ถูก render ใหม่ระหว่างคลิก ไม่ถือว่าคลิกนอกแผง
  closeNotificationPanel();
});
ensureSession();
window.setInterval(pollNotifications, 45_000);
startRouter(document.querySelector('#app'));