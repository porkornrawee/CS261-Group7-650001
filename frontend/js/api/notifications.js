/** Notifications API. All HTTP calls go through api/client.js. */
import { request } from './client.js';

/** GET /api/me/notifications -> { ok: true, notifications: Notification[], unread_count:number } */
export async function listNotifications() {
  const data = await request('/api/me/notifications', {
    mockFile: 'notifications.json',
  });
  return {
    notifications: data.notifications || [],
    unread_count: data.unread_count,
  };
}

/** POST /api/me/notifications/<id>/read -> { ok: true } */
export function markNotificationRead(id) {
  return request(`/api/me/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
    mockFile: 'notification-read.json',
  });
}
