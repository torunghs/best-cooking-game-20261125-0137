// Debug driver: navigate, capture console errors + exceptions, report state.
const [url] = process.argv.slice(2);
const port = process.env.CDP_PORT || '9224';
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = list.find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  if (data.id && pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
  else if (data.method === 'Runtime.exceptionThrown') {
    console.log('EXCEPTION:', JSON.stringify(data.params.exceptionDetails).slice(0, 1500));
  } else if (data.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(data.params.type)) {
    console.log('CONSOLE', data.params.type, JSON.stringify(data.params.args).slice(0, 800));
  }
};
function send(method, params = {}) {
  const mid = ++id;
  return new Promise((resolve) => { pending.set(mid, resolve); ws.send(JSON.stringify({ id: mid, method, params })); });
}
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 5000));
const r = await send('Runtime.evaluate', { expression: '({ready: !!window.__shotReady, title: document.title, body: document.body ? document.body.innerHTML.slice(0,200) : null})', returnByValue: true });
console.log('STATE:', JSON.stringify(r.result?.result?.value));
console.log('ERR:', JSON.stringify(r.result?.exceptionDetails)?.slice(0, 500));
ws.close();
process.exit(0);
