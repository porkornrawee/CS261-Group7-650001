async function api(path, options) {
  const response = await fetch(path, options);
  return { status: response.status, body: await response.json() };
}
