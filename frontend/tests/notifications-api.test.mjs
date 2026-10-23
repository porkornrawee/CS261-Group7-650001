import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { location: { search: '' } };
const calls = [];
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  return { status: 200, json: async () => ({ ok: true, notifications: [] }) };
};

const { listNotifications, markNotificationRead } = await import('../js/api/notifications.js');

test('listNotifications reads the current user notification endpoint', async () => {
  const result = await listNotifications();
  assert.deepEqual(result.notifications, []);
  assert.equal(calls[0].url, '/api/me/notifications');
});

test('markNotificationRead posts to the notification read endpoint', async () => {
  await markNotificationRead('id /1');
  assert.equal(calls[1].url, '/api/me/notifications/id%20%2F1/read');
  assert.equal(calls[1].init.method, 'POST');
});
