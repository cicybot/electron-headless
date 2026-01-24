// Test harness: ensures Electron backend is running, then exercises a minimal RPC call.
// Before tests: if Electron backend is not started on port 3456, start it via `npm start` in app/

const http = require('http')
const net = require('net')
const path = require('path')
const { spawn } = require('child_process')

function postRpc(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload)
    const options = {
      hostname: '127.0.0.1',
      port: 3456,
      path: '/rpc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }
    const req = http.request(options, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        console.log("postRpc",payload,{body})
        try {
          resolve(JSON.parse(body))
        } catch {
          resolve(body)
        }
      })
    })
    req.on('error', (err) => reject(err))
    req.write(data)
    req.end()
  })
}

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port }, () => {
      s.end()
      resolve(true)
    })
    s.on('error', () => resolve(false))
    setTimeout(() => {
      try { s.destroy() } catch {}
      resolve(false)
    }, 1000)
  })
}

async function ensureBackendUp() {
  // If port already open, nothing to do
  if (await isPortOpen(3456)) return
  // Otherwise start the backend in app/ via npm start
  const appDir = path.resolve(__dirname, '..')
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['start'], { cwd: appDir, shell: true, stdio: 'inherit' })
    proc.on('error', (err) => reject(err))
    const timeout = setTimeout(() => reject(new Error('Backend start timeout')), 60000)
    const waitFor = setInterval(async () => {
      if (await isPortOpen(3456)) {
        clearInterval(waitFor)
        clearTimeout(timeout)
        resolve()
      }
    }, 500)
  })
}

describe('Electron test harness (RPC)', () => {
  beforeAll(async () => {
    await ensureBackendUp()
  })

  test('RPC /rpc responds to getWindows with window info', async () => {
    const resp = await postRpc({ method: 'getWindows', params: {} });

    // top-level shape
    expect(resp).toBeDefined();
    expect(resp).toHaveProperty('ok', true);
    expect(resp).toHaveProperty('result');
    expect(typeof resp.result).toBe('object');

    // first level: window groups
    const groups = Object.values(resp.result);
    expect(groups.length).toBeGreaterThan(0);

    // second level: windows
    const windows = Object.values(groups[0]);
    expect(windows.length).toBeGreaterThan(0);

    const win = windows[0];

    // window fields
    expect(win).toHaveProperty('id');
    expect(typeof win.id).toBe('number');

    expect(win).toHaveProperty('wcId');
    expect(typeof win.wcId).toBe('number');

    expect(win).toHaveProperty('bounds');
    expect(win.bounds).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number),
        })
    );
  });

  test('RPC /rpc runCode code return integer', async () => {
    const resp = await postRpc({ method: 'runCode', params: {win_id:1,code:"1"} })

    expect(resp).toBeDefined();
    expect(resp).toHaveProperty('ok', true);
    expect(resp).toHaveProperty('result', 1);
  })
  test('RPC /rpc runCode code return json', async () => {
    const resp = await postRpc({
      method: 'runCode',
      params: {
        win_id: 1,
        code: `({ a: 1, b: "x", c: true })`
      }
    });

    expect(resp).toBeDefined();
    expect(resp.ok).toBe(true);

    expect(resp.result).toEqual({
      a: 1,
      b: "x",
      c: true,
    });

    expect(typeof resp.result).toBe("object");
  })

})
