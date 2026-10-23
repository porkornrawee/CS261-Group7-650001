import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { location: { search: '' } };
const calls = [];
let responseBody = { ok: true, reservations: [] };
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  return { status: 200, json: async () => responseBody };
};

const { listMyReservations } = await import('../js/api/reservations.js');

test('history calls the current-user endpoint with the selected status', async () => {
  await listMyReservations('cancelled');
  assert.equal(calls[0].url, '/api/me/reservations?status=cancelled');
});

test('history mock applies status filters to the mock response', async () => {
  responseBody = {
    ok: true,
    reservations: [
      { code: 'PK-C', status: 'cancelled' },
      { code: 'PK-A', status: 'active' },
    ],
  };
  window.location.search = '?mock=1';

  const { reservations } = await listMyReservations('cancelled');

  assert.deepEqual(calls[1].init, {});
  assert.deepEqual(reservations.map((item) => item.code), ['PK-C']);
});
