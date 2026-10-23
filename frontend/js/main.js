/** Application entry point: render the header and poll the current user's alerts. */
import { AppHeader } from './components/layout/AppHeader.js';
import { listNotifications, markNotificationRead } from './api/notifications.js';
import { NotificationList } from './features/notification/NotificationList.js';
import { showToast } from './components/ui/Toast.js';
import { startRouter, currentPath } from './router.js';

const header = document.querySelector('#app-header');
let notifications = [];
let unreadCount = 0;
let notificationPanelOpen = false;
const knownNotificationIds = new Set();
let initialPollCompleted = false;
let polling = false;

function renderHeader() {
  const el = AppHeader({
    activeRoute: currentPath(),
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
    });
    el.querySelector('.app-header-root').append(list);
  }
}

async function pollNotifications() {
  if (polling) return;
  polling = true;
  try {
    const response = await listNotifications();
    const next = response.notifications;
    for (const notification of next) {
      const id = String(notification.id);
      if (initialPollCompleted && !notification.read_at && !knownNotificationIds.has(id)) {
        showToast(notification.message || 'มีการแจ้งเตือนใหม่', 'info');
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

renderHeader();
window.addEventListener('hashchange', renderHeader);
pollNotifications();
window.setInterval(pollNotifications, 45_000);
startRouter(document.querySelector('#app'));
