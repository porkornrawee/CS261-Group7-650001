import test from 'node:test';
import assert from 'node:assert/strict';

// client.js อ่าน window.location และเรียก fetch ของ global จึงจำลองสองอย่างนี้
function setup({ search = '', response }) {
  globalThis.window = { location: { search } };
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return response;
  };
  return calls;
}
const json = (body, status = 200) => ({ status, json: async () => body });

const { request, ApiError, isMock } = await import('../js/api/client.js');

test('isMock เปิดเมื่อมี ?mock=1 เท่านั้น', () => {
  setup({ search: '?mock=1', response: json({}) });
  assert.equal(isMock(), true);
  setup({ search: '?mock=0', response: json({}) });
  assert.equal(isMock(), false);
});

test('request ปกติส่ง JSON body และคืนข้อมูล', async () => {
  const calls = setup({ response: json({ ok: true, hello: 'x' }) });
  const data = await request('/api/vehicles', { method: 'POST', body: { a: 1 } });
  assert.equal(data.hello, 'x');
  assert.equal(calls[0].url, '/api/vehicles');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.body, JSON.stringify({ a: 1 }));
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
});

test('request โยน ApiError เมื่อ ok:false', async () => {
  setup({ response: json({ ok: false, error: { code: 'SLOT_CONFLICT', message: 'ซ้ำ' } }, 409) });
  await assert.rejects(request('/api/reservations', { method: 'POST', body: {} }), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, 'SLOT_CONFLICT');
    assert.equal(error.status, 409);
    return true;
  });
});

test('request โยน ApiError เมื่อ HTTP >= 400 แม้ body ไม่ใช่ JSON', async () => {
  setup({ response: { status: 500, json: async () => { throw new Error('not json'); } } });
  await assert.rejects(request('/api/zones'), (error) => error.code === 'UNKNOWN' && error.status === 500);
});

test('โหมด mock ต้องมี mockFile', async () => {
  setup({ search: '?mock=1', response: json({}) });
  await assert.rejects(request('/api/zones'), (error) => error.code === 'MOCK_MISSING');
});

test('โหมด mock โหลดไฟล์ mock แทนการเรียก API', async () => {
  const calls = setup({ search: '?mock=1', response: json({ ok: true, zones: [] }) });
  const data = await request('/api/zones', { mockFile: 'zones.json' });
  assert.deepEqual(data.zones, []);
  assert.match(calls[0].url, /mock\/zones\.json$/);
});
