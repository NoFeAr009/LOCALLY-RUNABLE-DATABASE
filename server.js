require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Client if URL and Key are provided
let SUPABASE_URL = process.env.SUPABASE_URL;
if (SUPABASE_URL) {
  try {
    const parsed = new URL(SUPABASE_URL);
    SUPABASE_URL = parsed.origin;
  } catch (e) {}
}
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
const isSupabaseActive = SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY.startsWith('eyJ') && !SUPABASE_URL.includes('your-project-ref');

if (isSupabaseActive) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log(`[Supabase] Database connected successfully to ${SUPABASE_URL}`);
  } catch (err) {
    console.error('[Supabase] Initialization failed:', err.message);
  }
} else {
  console.log('[Database] Running in Local Storage mode (JSON engine).');
}

// Fallback Local Storage Setup
const DATA_DIR = path.join(__dirname, 'storage');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const PENDING_FILE = path.join(DATA_DIR, 'pending.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(PENDING_FILE)) fs.writeFileSync(PENDING_FILE, JSON.stringify([], null, 2), 'utf8');

if (!fs.existsSync(USERS_FILE)) {
  const defaultUsers = [
    { id: "usr_nofear", username: "NOFEAR", password: "NOFEAR009", role: "admin", is_primary_admin: true, createdAt: new Date().toISOString() }
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf8');
}

function readJSON(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8') || '[]'); } catch { return []; } }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

// Audit Logger Helper
async function logSecurityEvent(req, action, username, status, details = {}) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  if (isSupabaseActive && supabase) {
    try {
      await supabase.from('audit_logs').insert([{
        id: logId,
        ip: ip,
        username: username || 'Anonymous',
        action: action,
        status: status,
        device: userAgent,
        details: details,
        timestamp: now
      }]);
      return;
    } catch (e) {}
  }

  const logs = readJSON(LOGS_FILE);
  logs.unshift({ id: logId, timestamp: now, ip, username: username || 'Anonymous', action, status, device: userAgent, details });
  if (logs.length > 500) logs.pop();
  writeJSON(LOGS_FILE, logs);
}

// Session Token Manager
const activeTokens = new Map();
function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace('Bearer ', '') : req.query.token;
  if (!token) return null;
  return activeTokens.get(token) || null;
}

function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  req.user = user;
  next();
}

function isPrimaryAdminUser(user) {
  if (!user) return false;
  return (user.username || '').toUpperCase() === 'NOFEAR';
}

function requirePrimaryAdmin(req, res, next) {
  const user = getAuthUser(req);
  if (!isPrimaryAdminUser(user)) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Access Denied</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #FAF7F2; color: #3A2E2B; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; }
          .card { background: white; padding: 2rem; border-radius: 12px; border: 1px solid #E8E2D9; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width:400px; }
          h2 { color: #8A1C14; margin-top:0; }
          a { background: #A67C52; color: white; padding: 0.6rem 1.2rem; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🔒 Access Restricted</h2>
          <p>The Control Center is strictly restricted to master admin (<strong>NOFEAR</strong>) only.</p>
          <a href="/admin">Go to Admin Login</a>
        </div>
      </body>
      </html>
    `);
  }
  req.user = user;
  next();
}

// ================= ANIMATED CREAMY THEME STYLESHEET SNIPPET =================
const ANIMATED_CREAMY_THEME_CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulseGlow {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 163, 115, 0.4); }
    50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(212, 163, 115, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 163, 115, 0); }
  }

  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #FAF7F2; color: #3A2E2B; margin: 0; padding: 0; }
  
  .top-header-banner {
    position: sticky;
    top: 0;
    z-index: 9999;
    background: #2C221E;
    color: #FAF7F2;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 4px solid #D4A373;
    box-shadow: 0 4px 15px rgba(44, 34, 30, 0.15);
    animation: fadeInUp 0.4s ease-out;
  }
  .header-logo { font-size: 1.4rem; font-weight: 800; color: #F3E5D8; transition: transform 0.3s ease; }
  .header-logo:hover { transform: scale(1.03); }

  .header-actions { display: flex; gap: 0.75rem; align-items: center; }
  
  .control-btn { 
    background: #8C6D46; 
    color: #FAF7F2; 
    text-decoration: none; 
    padding: 0.6rem 1rem; 
    border-radius: 6px; 
    font-weight: 700; 
    font-size: 0.9rem; 
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  .control-btn:hover { background: #6F5536; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(111, 85, 54, 0.3); }

  .admin-portal-button {
    background: linear-gradient(135deg, #D4A373 0%, #BC8A5F 100%);
    color: #2C221E;
    text-decoration: none;
    padding: 0.7rem 1.4rem;
    border-radius: 8px;
    font-weight: 800;
    font-size: 1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 14px rgba(212, 163, 115, 0.4);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    border: 2px solid #EADBC8;
    animation: pulseGlow 3s infinite ease-in-out;
  }
  .admin-portal-button:hover { 
    background: linear-gradient(135deg, #E6B585 0%, #D4A373 100%); 
    color: #000000; 
    transform: translateY(-3px) scale(1.03); 
    box-shadow: 0 8px 20px rgba(212, 163, 115, 0.6);
  }

  .container { max-width: 1050px; margin: 2rem auto; padding: 0 1rem; animation: fadeInUp 0.6s ease-out; }
  
  .card { 
    background: #FFFFFF; 
    border: 1px solid #E8E2D9; 
    border-radius: 12px; 
    padding: 1.5rem; 
    margin-bottom: 1.5rem; 
    box-shadow: 0 4px 15px rgba(140, 120, 100, 0.05); 
    transition: all 0.3s ease;
  }
  .card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(140, 120, 100, 0.12); }

  h2, h3 { margin-top: 0; color: #2C221E; border-bottom: 2px solid #EADBC8; padding-bottom: 0.5rem; }
  label { display: block; margin-top: 1rem; color: #5C4A42; font-weight: 600; }
  
  input, textarea, select { 
    width: 100%; 
    padding: 0.75rem; 
    border-radius: 8px; 
    border: 1.5px solid #D8CFC4; 
    background: #FAF7F2; 
    color: #2C221E; 
    font-size: 0.95rem; 
    margin-top: 0.4rem; 
    transition: all 0.3s ease;
  }
  input:focus, textarea:focus, select:focus { 
    outline: none; 
    border-color: #A67C52; 
    background: #FFFFFF; 
    box-shadow: 0 0 0 4px rgba(166, 124, 82, 0.18);
  }

  button { 
    background: linear-gradient(135deg, #A67C52 0%, #8C6D46 100%); 
    font-weight: 700; 
    border: none; 
    cursor: pointer; 
    width: 100%; 
    padding: 0.85rem; 
    border-radius: 8px; 
    color: #FFFFFF; 
    font-size: 1rem; 
    margin-top: 1.2rem; 
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 4px 12px rgba(166, 124, 82, 0.25);
  }
  button:hover { 
    background: linear-gradient(135deg, #B88D63 0%, #A67C52 100%); 
    transform: translateY(-2px); 
    box-shadow: 0 8px 20px rgba(166, 124, 82, 0.4);
  }

  .status { padding: 0.75rem; border-radius: 6px; margin-top: 1rem; display: none; animation: fadeInUp 0.3s ease; }
  .status.success { background: #E3EDE3; color: #1E4620; display: block; border: 1px solid #C4DCC4; }
  .status.error { background: #FCE8E6; color: #8A1C14; display: block; border: 1px solid #F5C2BE; }

  table { width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1.5rem; animation: fadeInUp 0.5s ease; }
  th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #E8E2D9; font-size: 0.9rem; transition: background 0.2s ease; }
  th { background: #F0EAE1; color: #2C221E; font-weight: 700; }
  tr:hover td { background: #F8F3EC; }

  .badge-user { background: #EADBC8; color: #4A3525; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
  .category-header { background: #F0EAE1; padding: 0.75rem 1rem; border-radius: 8px; border-left: 6px solid #A67C52; margin-top: 1.5rem; font-weight: bold; color: #2C221E; }
  .badge-db { background: ${isSupabaseActive ? '#2D6A4F' : '#8C6D46'}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
  pre { background: #FAF7F2; color: #2C221E; padding: 0.75rem; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; border: 1px solid #E8E2D9; }
`;

// ================= CONTROL CENTER (NOFEAR MASTER CONTROL) =================
app.get('/control', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NOFEAR Master Control Center</title>
      <style>
        ${ANIMATED_CREAMY_THEME_CSS}
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .metric { font-size: 2rem; font-weight: 800; color: #A67C52; margin: 0.5rem 0; }
        .metric-sub { font-size: 0.85rem; color: #7A685D; }
        .btn-green { background: linear-gradient(135deg, #52796F 0%, #354F52 100%); color: white; }
        .btn-green:hover { background: linear-gradient(135deg, #638D82 0%, #52796F 100%); }
        .btn-blue { background: linear-gradient(135deg, #A67C52 0%, #8C6D46 100%); color: white; }
        .btn-blue:hover { background: linear-gradient(135deg, #B88D63 0%, #A67C52 100%); }
        .status-pill { background: #E3EDE3; color: #1E4620; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        .master-auth-box { max-width: 420px; margin: 4rem auto; background: white; padding: 2rem; border-radius: 12px; border: 1px solid #E8E2D9; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
      </style>
    </head>
    <body>

      <header class="top-header-banner">
        <div class="header-logo">⚡ Master Control Center (NOFEAR) <span class="badge-db">${isSupabaseActive ? '⚡ Supabase DB' : '💾 Local DB'}</span></div>
        <div class="header-actions">
          <a href="/" class="control-btn">📥 Data Entry Portal</a>
          <a href="/admin" class="admin-portal-button">🔑 Admin Portal</a>
        </div>
      </header>

      <!-- IN-PAGE AUTHENTICATION IF NOT LOGGED IN -->
      <div id="authPrompt" class="container" style="display: none;">
        <div class="master-auth-box">
          <h2>⚡ Master Admin Access</h2>
          <p style="color: #7A685D; margin-bottom: 1.5rem;">Enter NOFEAR master password to unlock the Control Center:</p>
          <form id="masterLoginForm">
            <input type="password" id="masterPassInput" placeholder="Enter NOFEAR password" value="NOFEAR009" required />
            <button type="submit" class="btn-blue" style="margin-top: 1rem;">🔓 Unlock Master Control Center</button>
          </form>
          <div id="authError" style="color: #8A1C14; margin-top: 1rem; font-weight: 600; display: none;"></div>
        </div>
      </div>

      <!-- MAIN CONTROL CENTER DASHBOARD -->
      <div id="controlDashboard" class="container" style="display: none;">
        
        <div class="grid-3">
          
          <!-- SERVER STATUS CARD -->
          <div class="card">
            <h3>⚙️ Server Status <span id="serverStatusPill" class="status-pill">ONLINE</span></h3>
            <div class="metric" id="serverPort">Port 3000</div>
            <div class="metric-sub" id="serverUptime">Uptime: Loading...</div>
            <button onclick="fetchSystemStats()" class="btn-blue">🔄 Refresh Server Status</button>
          </div>

          <!-- DATABASE CONNECTION CARD -->
          <div class="card">
            <h3>🗄️ Database Engine <span id="dbModePill" class="status-pill">${isSupabaseActive ? 'SUPABASE' : 'LOCAL DB'}</span></h3>
            <div class="metric" id="dbRecordsCount">...</div>
            <div class="metric-sub" id="dbTarget">Target: ${isSupabaseActive ? 'https://dygmhlghcmprjtvxjzxx.supabase.co' : 'Local JSON Engine'}</div>
            <button onclick="testDbConnection()" class="btn-green">⚡ Test DB Ping</button>
            <button onclick="downloadJsonFile()" class="btn-blue">💾 Download JSON Backup File</button>
          </div>

          <!-- SYSTEM METRICS CARD -->
          <div class="card">
            <h3>🖥️ System Resources</h3>
            <div class="metric" id="memUsage">RAM: ...</div>
            <div class="metric-sub" id="sysPlatform">OS: ${os.platform()} ${os.arch()} | CPUs: ${os.cpus().length}</div>
            <button onclick="fetchSystemStats()" class="btn-blue">📊 View System Details</button>
          </div>

        </div>

        <!-- LIVE DATABASE SUMMARY CARD -->
        <div class="card">
          <h3>📊 Live Database Summary</h3>
          <div style="display:flex; gap:1rem; margin-bottom:1rem; flex-wrap: wrap;">
            <button onclick="fetchSystemStats()" style="width:auto; margin:0;" class="btn-blue">🔄 Refresh Metrics</button>
            <button onclick="runDatabaseSeed()" style="width:auto; margin:0;" class="btn-green">🌱 Seed/Verify Master Admin (NOFEAR)</button>
            <a href="/admin" class="btn-blue" style="text-decoration:none; display:inline-block; width:auto; margin:0; padding:0.85rem 1.2rem;">👤 Open Admin & User Portal</a>
          </div>
          <pre id="systemStatsView">Loading statistics...</pre>
        </div>

      </div>

      <script>
        let authToken = localStorage.getItem('adminToken');

        async function initControlCenter() {
          if (authToken) {
            try {
              const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + authToken } });
              if (res.ok) {
                const user = await res.json();
                if ((user.username || '').toUpperCase() === 'NOFEAR') {
                  showDashboard();
                  return;
                }
              }
            } catch (e) {}
          }
          showAuthPrompt();
        }

        function showAuthPrompt() {
          document.getElementById('authPrompt').style.display = 'block';
          document.getElementById('controlDashboard').style.display = 'none';
        }

        function showDashboard() {
          document.getElementById('authPrompt').style.display = 'none';
          document.getElementById('controlDashboard').style.display = 'block';
          fetchSystemStats();
        }

        document.getElementById('masterLoginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = document.getElementById('masterPassInput').value;
          const errBox = document.getElementById('authError');
          errBox.style.display = 'none';

          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: 'NOFEAR', password: password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
              authToken = data.token;
              localStorage.setItem('adminToken', authToken);
              showDashboard();
            } else {
              errBox.textContent = data.error || 'Invalid password for NOFEAR!';
              errBox.style.display = 'block';
            }
          } catch (err) {
            errBox.textContent = 'Server connection error';
            errBox.style.display = 'block';
          }
        });

        async function fetchSystemStats() {
          try {
            const res = await fetch('/api/system/stats', { headers: { 'Authorization': 'Bearer ' + authToken } });
            if (!res.ok) {
              showAuthPrompt();
              return;
            }
            const data = await res.json();
            document.getElementById('serverUptime').textContent = 'Uptime: ' + data.uptimeFormatted;
            document.getElementById('dbRecordsCount').textContent = data.approvedRecordsCount + ' Records';
            document.getElementById('memUsage').textContent = data.memoryUsageMB + ' MB RAM';
            document.getElementById('systemStatsView').textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            document.getElementById('serverStatusPill').className = 'status-pill offline';
            document.getElementById('serverStatusPill').textContent = 'OFFLINE';
          }
        }

        async function downloadJsonFile() {
          try {
            const res = await fetch('/api/system/backup', { headers: { 'Authorization': 'Bearer ' + authToken } });
            if (!res.ok) throw new Error('Server returned ' + res.status);
            const data = await res.text();
            
            const blob = new Blob([data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'database_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            alert('✅ Backup downloaded!');
          } catch (err) { alert('❌ Download failed.'); }
        }

        async function testDbConnection() {
          const res = await fetch('/api/data');
          if (res.ok) alert('✅ Database Ping Successful!');
          else alert('❌ Database Ping Failed');
        }

        async function runDatabaseSeed() {
          const res = await fetch('/api/system/seed', { method: 'POST', headers: { 'Authorization': 'Bearer ' + authToken } });
          const data = await res.json();
          alert(data.message || 'Seeded successfully!');
          fetchSystemStats();
        }

        initControlCenter();
      </script>
    </body>
    </html>
  `);
});

// SYSTEM API ENDPOINTS (NOFEAR ONLY)
app.get('/api/system/stats', requirePrimaryAdmin, async (req, res) => {
  const uptimeSec = process.uptime();
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = Math.floor(uptimeSec % 60);

  let approvedRecordsCount = 0;
  let pendingCount = 0;
  let usersCount = 0;

  if (isSupabaseActive && supabase) {
    try {
      const { data: recs } = await supabase.from('data_records').select('id');
      const { data: pends } = await supabase.from('pending_approvals').select('id');
      const { data: usrs } = await supabase.from('users').select('id');
      approvedRecordsCount = recs ? recs.length : 0;
      pendingCount = pends ? pends.length : 0;
      usersCount = usrs ? usrs.length : 0;
    } catch (e) {}
  } else {
    approvedRecordsCount = readJSON(DATA_FILE).length;
    pendingCount = readJSON(PENDING_FILE).length;
    usersCount = readJSON(USERS_FILE).length;
  }

  res.json({
    status: 'ONLINE',
    serverPort: PORT,
    databaseEngine: isSupabaseActive ? 'Supabase PostgreSQL' : 'Local JSON Database',
    supabaseUrl: isSupabaseActive ? SUPABASE_URL : 'Unconfigured',
    uptimeSeconds: Math.floor(uptimeSec),
    uptimeFormatted: `${hours}h ${minutes}m ${seconds}s`,
    memoryUsageMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    approvedRecordsCount,
    pendingCount,
    usersCount,
    osPlatform: os.platform(),
    osArch: os.arch(),
    totalMemoryGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
    freeMemoryGB: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/system/backup', requirePrimaryAdmin, async (req, res) => {
  let dataRecords = [];
  let usersList = [];
  let pendingList = [];
  let logsList = [];

  if (isSupabaseActive && supabase) {
    try {
      const { data: recs } = await supabase.from('data_records').select('*');
      const { data: usrs } = await supabase.from('users').select('*');
      const { data: pends } = await supabase.from('pending_approvals').select('*');
      const { data: logs } = await supabase.from('audit_logs').select('*');
      dataRecords = recs || [];
      usersList = usrs || [];
      pendingList = pends || [];
      logsList = logs || [];
    } catch (e) {}
  } else {
    dataRecords = readJSON(DATA_FILE);
    usersList = readJSON(USERS_FILE);
    pendingList = readJSON(PENDING_FILE);
    logsList = readJSON(LOGS_FILE);
  }

  const fullBackup = {
    backupTimestamp: new Date().toISOString(),
    databaseEngine: isSupabaseActive ? 'Supabase PostgreSQL' : 'Local JSON Database',
    tables: {
      data_records: dataRecords,
      users: usersList,
      pending_approvals: pendingList,
      audit_logs: logsList
    }
  };

  const backupJSON = JSON.stringify(fullBackup, null, 2);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="database_backup.json"');
  res.setHeader('Content-Length', Buffer.byteLength(backupJSON));
  res.send(backupJSON);
});

app.post('/api/system/seed', requirePrimaryAdmin, async (req, res) => {
  const seedUser = {
    id: "usr_nofear",
    username: "NOFEAR",
    password: "NOFEAR009",
    role: "admin",
    is_primary_admin: true,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseActive && supabase) {
    await supabase.from('users').upsert([seedUser]);
  } else {
    const users = readJSON(USERS_FILE);
    if (!users.some(u => u.username === 'NOFEAR')) {
      users.push(seedUser);
      writeJSON(USERS_FILE, users);
    }
  }

  res.json({ message: 'Primary Admin (NOFEAR / NOFEAR009) verified & seeded successfully!' });
});

// ================= PUBLIC DATA ENTRY PAGE =================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Data Entry Portal</title>
      <style>
        ${ANIMATED_CREAMY_THEME_CSS}
      </style>
    </head>
    <body>

      <header class="top-header-banner">
        <div class="header-logo">
          📦 Data Entry Portal <span class="badge-db">${isSupabaseActive ? '⚡ Supabase DB' : '💾 Local DB'}</span>
        </div>
        <div class="header-actions">
          <a href="/admin" class="admin-portal-button">🔑 Admin Login Portal</a>
        </div>
      </header>

      <div class="container">
        <div class="card">
          <h2>📥 Submit Data Record (Verification Portal)</h2>
          <p style="color:#7A685D; font-size:0.95rem; margin-top:-0.5rem; margin-bottom:1rem;">
            Entries submitted here enter the <strong>Verification Stage</strong>. Once reviewed and approved by Master Admin (<strong>NOFEAR</strong>), they are automatically placed in the permanent database tables.
          </p>
          <div id="statusBox" class="status"></div>

          <form id="entryForm">
            <label>Title / Category Table Name</label>
            <input type="text" id="title" placeholder="e.g. Student Records, Inventory, Accounting" required />

            <label>Payload (JSON, Key-Value pairs, or Text Details)</label>
            <textarea id="payload" rows="4" placeholder="CURRENCY= NPR&#10;MONEY= 5000$&#10;COST= SLAVE&#10;INTREST= NONE" required></textarea>

            <button type="submit">⏳ Submit Data for Verification</button>
          </form>
        </div>

        <div class="card" style="border-left: 6px solid #B45309;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2>⏳ Submissions in Verification Stage <span id="pendingCountBadge" class="badge" style="background:#B45309; color:#FFFFFF;">0</span></h2>
            <button onclick="loadPendingQueue()" style="width:auto; margin:0; padding:0.4rem 1rem; background:#8C6D46;">🔄 Refresh Queue</button>
          </div>
          <p style="color:#7A685D; font-size:0.85rem; margin-top:0;">These records are currently awaiting review and approval by NOFEAR.</p>
          <div id="pendingQueueContainer">Loading verification queue...</div>
        </div>

        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2>📊 Approved Categorized Data Tables</h2>
            <button onclick="loadRecords()" style="width:auto; margin:0; padding:0.4rem 1rem;">🔄 Refresh Tables</button>
          </div>
          <p style="color:#7A685D; font-size:0.85rem; margin-top:0;">Verified permanent records stored in database.</p>
          <div id="tablesContainer">Loading records...</div>
        </div>
      </div>

      <script>
        function renderDataContentHTML(content) {
          if (content === null || content === undefined) return '<em>No data</em>';
          if (typeof content === 'object') {
            if (Array.isArray(content)) {
              if (content.length === 0) return '<em>Empty list</em>';
              return '<div style="display:flex; flex-direction:column; gap:0.4rem;">' + content.map(item => {
                if (typeof item === 'object') {
                  let rows = Object.entries(item).map(([k, v]) => \`<tr><td style="font-weight:700; color:#5C4A42; width:35%; background:#F8F3EC; padding:0.4rem 0.6rem;">\${k}</td><td style="padding:0.4rem 0.6rem;"><code>\${typeof v === 'object' ? JSON.stringify(v) : v}</code></td></tr>\`).join('');
                  return \`<table style="margin:0; border:1px solid #E8E2D9; border-radius:6px; overflow:hidden;"><tbody>\${rows}</tbody></table>\`;
                }
                return \`<div style="background:#FAF7F2; padding:0.4rem 0.6rem; border-radius:4px; border:1px solid #E8E2D9;">\${item}</div>\`;
              }).join('') + '</div>';
            }
            let rows = Object.entries(content).map(([k, v]) => \`<tr><td style="font-weight:700; color:#5C4A42; width:35%; background:#F8F3EC; padding:0.4rem 0.6rem;">\${k}</td><td style="padding:0.4rem 0.6rem;"><code>\${typeof v === 'object' ? JSON.stringify(v) : v}</code></td></tr>\`).join('');
            return \`<table style="margin:0; border:1px solid #E8E2D9; border-radius:6px; overflow:hidden;"><tbody>\${rows}</tbody></table>\`;
          }

          const text = String(content).trim();
          const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
          const isKeyValue = lines.length > 0 && lines.every(l => l.includes('=') || l.includes(':'));

          if (isKeyValue) {
            let rows = lines.map(line => {
              let sep = line.includes('=') ? '=' : ':';
              let parts = line.split(sep);
              let key = parts[0].trim();
              let val = parts.slice(1).join(sep).trim();
              return \`<tr><td style="font-weight:700; color:#5C4A42; width:35%; background:#F8F3EC; padding:0.4rem 0.6rem;">\${key}</td><td style="font-weight:600; color:#2C221E; padding:0.4rem 0.6rem;">\${val}</td></tr>\`;
            }).join('');
            return \`<table style="margin:0; border:1px solid #E8E2D9; border-radius:6px; overflow:hidden;"><tbody>\${rows}</tbody></table>\`;
          }

          return \`<div style="background:#FAF7F2; padding:0.6rem; border-radius:6px; border:1px solid #E8E2D9; white-space:pre-wrap;">\${text}</div>\`;
        }

        async function loadRecords() {
          const res = await fetch('/api/data');
          const data = await res.json();
          const container = document.getElementById('tablesContainer');

          if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#7A685D;">No approved data records found.</p>';
            return;
          }

          const grouped = {};
          data.forEach(item => {
            const cat = item.title || item.category || 'General Records';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
          });

          let html = '';
          for (const [category, items] of Object.entries(grouped)) {
            html += \`
              <div class="category-header">📋 Table Category: <strong>\${category}</strong> (\${items.length} records)</div>
              <table>
                <thead>
                  <tr>
                    <th style="width:18%;">Category / Title</th>
                    <th style="width:45%;">Entered Data Content</th>
                    <th style="width:17%;">Entered By</th>
                    <th style="width:20%;">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  \${items.map(item => {
                    const dateStr = new Date(item.created_at || item.createdAt).toLocaleString();
                    const updatedStr = item.updated_at ? \`<br><small style="color:#2D6A4F; font-size:0.75rem;">Updated: \${new Date(item.updated_at).toLocaleTimeString()}</small>\` : '';
                    const userStr = item.submitted_by || item.submittedBy || 'Public User';
                    return \`
                      <tr>
                        <td><strong>\${item.title || category}</strong><br><small style="color:#8C6D46; font-size:0.75rem;">ID: <code>\${item.id}</code></small></td>
                        <td>\${renderDataContentHTML(item.content)}</td>
                        <td><span class="badge-user">👤 \${userStr}</span></td>
                        <td><small style="color:#5C4A42;">\${dateStr}\${updatedStr}</small></td>
                      </tr>
                    \`;
                  }).join('')}
                </tbody>
              </table>
            \`;
          }

          container.innerHTML = html;
        }

        document.getElementById('entryForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const title = document.getElementById('title').value;
          const payloadRaw = document.getElementById('payload').value;
          let content;
          try { content = JSON.parse(payloadRaw); } catch { content = payloadRaw; }

          const statusBox = document.getElementById('statusBox');
          try {
            const res = await fetch('/api/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, content })
            });
            const data = await res.json();
            statusBox.className = 'status success';
            statusBox.textContent = '✅ Record submitted! ID: ' + data.id + ' (Awaiting approval if required)';
            document.getElementById('entryForm').reset();
            loadRecords();
          } catch (err) {
            statusBox.className = 'status error';
            statusBox.textContent = '❌ Failed to save record.';
          }
        });

        loadRecords();
      </script>
    </body>
    </html>
  `);
});

// ================= ADMIN PANEL & WEB UI =================
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Portal & Security Console</title>
      <style>
        ${ANIMATED_CREAMY_THEME_CSS}
        .navbar { background: #2C221E; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #D4A373; color: #FAF7F2; }
        .navbar h2 { margin: 0; color: #F3E5D8; font-size: 1.3rem; }
        .entry-link { background: #8C6D46; color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.9rem; transition: all 0.3s; }
        .entry-link:hover { background: #6F5536; transform: translateY(-2px); }
        .login-box { max-width: 380px; margin: 5rem auto; background: #FFFFFF; padding: 2rem; border-radius: 12px; border: 1px solid #E8E2D9; box-shadow: 0 10px 25px rgba(140,120,100,0.15); animation: fadeInUp 0.4s ease; }
        .login-box h3 { border: none; text-align: center; font-size: 1.4rem; color: #2C221E; margin-bottom: 1.5rem; }
        
        .tab-nav { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #EADBC8; padding-bottom: 0.5rem; }
        .tab-btn { background: #F0EAE1; color: #5C4A42; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600; width: auto; margin: 0; transition: all 0.3s ease; }
        .tab-btn:hover { background: #EADBC8; transform: translateY(-1px); }
        .tab-btn.active { background: #A67C52; color: white; }
        .btn-danger { background: linear-gradient(135deg, #B84A39 0%, #8A2E20 100%); color: white; }
        .btn-danger:hover { background: linear-gradient(135deg, #CF5644 0%, #B84A39 100%); }
        .btn-success { background: linear-gradient(135deg, #52796F 0%, #354F52 100%); color: white; }
        .btn-success:hover { background: linear-gradient(135deg, #638D82 0%, #52796F 100%); }
      </style>
    </head>
    <body>

      <div class="navbar">
        <h2>🔒 Admin Portal <span class="badge-db">${isSupabaseActive ? '⚡ Supabase DB' : '💾 Local DB'}</span></h2>
        <div>
          <a href="/control" id="controlLinkBtn" class="entry-link" style="background:#A67C52; margin-right:0.5rem; display:none;">⚡ Control Center (NOFEAR)</a>
          <a href="/" class="entry-link">📥 Data Entry Portal</a>
          <span id="navRight"></span>
        </div>
      </div>

      <div class="container">
        <!-- CLEAN LOGIN MODAL -->
        <div id="loginSection" class="login-box">
          <h3>Admin Login</h3>
          <form id="loginForm">
            <label>User ID / Username</label>
            <input type="text" id="loginUsername" placeholder="Enter User ID" required />
            
            <label>Password</label>
            <input type="password" id="loginPassword" placeholder="Enter Password" required />
            
            <button type="submit">🔑 Log In</button>
          </form>
        </div>

        <!-- DASHBOARD VIEW -->
        <div id="dashboardSection" style="display: none;">
          
          <div class="tab-nav">
            <button class="tab-btn active" onclick="switchTab('dataTab')">📦 Data Tables & Edits</button>
            <button class="tab-btn" onclick="switchTab('approvalsTab')">⏳ Pending Approvals <span id="pendingBadge" class="badge" style="background:#D4A373; color:#2C221E;">0</span></button>
            <button class="tab-btn" id="usersTabBtn" onclick="switchTab('usersTab')">👤 User Credentials DB</button>
            <button class="tab-btn" id="auditTabBtn" onclick="switchTab('auditTab')">🛡️ Audit & Security Console</button>
          </div>

          <!-- TAB 1: DATA RECORDS IN CATEGORIZED TABLES -->
          <div id="dataTab" class="tab-content card">
            <h3>📦 Categorized Data Tables</h3>
            
            <h4>Add New Data Record</h4>
            <form id="adminDataForm">
              <input type="text" id="adminDataTitle" placeholder="Category / Table Title (e.g. Student Records)" required />
              <textarea id="adminDataPayload" placeholder="Data Payload (JSON or text)" rows="3" required></textarea>
              <button type="submit">Submit Data Record</button>
            </form>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2rem;">
              <h4>Approved Data Tables</h4>
              <button onclick="loadDashboardData()" style="width: auto; margin: 0; padding: 0.4rem 1rem;">🔄 Refresh Tables</button>
            </div>
            <div id="adminTablesContainer">Loading data tables...</div>
          </div>

          <!-- TAB 2: PENDING APPROVALS QUEUE (NOFEAR ONLY) -->
          <div id="approvalsTab" class="tab-content card" style="display: none;">
            <h3>⏳ Approvals Queue (NOFEAR Master Control)</h3>
            <p style="color: #7A685D; font-size: 0.9rem;">Data additions or edits submitted by users require approval from default admin (NOFEAR).</p>
            <div id="approvalsList">Loading pending approvals...</div>
          </div>

          <!-- TAB 3: USER CREDENTIALS DB (NOFEAR ONLY) -->
          <div id="usersTab" class="tab-content card" style="display: none;">
            <h3>👤 User Accounts & Credentials</h3>
            <div class="grid-2">
              <div>
                <h4>Create New User Account</h4>
                <form id="addUserForm">
                  <label>User ID / Username</label>
                  <input type="text" id="newUsername" placeholder="e.g. manager, user1" required />
                  <label>Password</label>
                  <input type="password" id="newPassword" placeholder="Enter password" required />
                  <label>Role</label>
                  <select id="newRole">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit">➕ Add User Account</button>
                </form>
              </div>

              <div>
                <h4>Existing User Accounts</h4>
                <table>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Password</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody id="usersTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 4: AUDIT & SECURITY MONITORING CONSOLE -->
          <div id="auditTab" class="tab-content card" style="display: none;">
            <h3>🛡️ Security Audit & Tracker Console</h3>
            <p style="color: #7A685D; font-size: 0.9rem;">Real-time logging of login attempts, IP addresses, device user-agents, timestamps, and user actions.</p>
            <button onclick="loadAuditLogs()" style="width: auto; margin-bottom: 1rem; padding: 0.4rem 1rem;">🔄 Refresh Security Logs</button>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                  <th>User ID Input</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Device / User-Agent</th>
                </tr>
              </thead>
              <tbody id="auditLogsBody"></tbody>
            </table>
          </div>

          <!-- EDIT RECORD MODAL FOR NOFEAR -->
          <div id="editModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; justify-content:center; align-items:center;">
            <div class="card" style="max-width:550px; width:90%; margin:auto; background:white; position:relative; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
              <h3>✏️ Edit Data Record (NOFEAR Master)</h3>
              <form id="editRecordForm">
                <input type="hidden" id="editRecordId" />
                <label>Category / Table Title</label>
                <input type="text" id="editRecordTitle" required />
                
                <label>Data Payload (JSON or Text)</label>
                <textarea id="editRecordPayload" rows="6" required></textarea>
                
                <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                  <button type="submit" class="btn-success" style="margin:0;">💾 Save Changes</button>
                  <button type="button" onclick="closeEditModal()" class="btn-danger" style="margin:0;">Cancel</button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>

      <script>
        let authToken = localStorage.getItem('adminToken');
        let currentUser = null;

        if (authToken) verifyAuth();

        async function verifyAuth() {
          const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + authToken } });
          if (res.ok) {
            currentUser = await res.json();
            showDashboard();
          } else {
            localStorage.removeItem('adminToken');
            authToken = null;
          }
        }

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('loginUsername').value;
          const password = document.getElementById('loginPassword').value;

          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });

          const data = await res.json();
          if (res.ok && data.token) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('adminToken', authToken);
            showDashboard();
          } else {
            alert(data.error || 'Invalid credentials!');
          }
        });

        function showDashboard() {
          document.getElementById('loginSection').style.display = 'none';
          document.getElementById('dashboardSection').style.display = 'block';
          document.getElementById('navRight').innerHTML = \`
            <span style="color:#F3E5D8; font-weight:bold; margin-right:1rem;">👤 \${currentUser.username} (\${currentUser.role})</span>
            <button onclick="logout()" class="btn-danger" style="margin:0; padding:0.4rem 1rem; width:auto;">Logout</button>
          \`;

          const isMasterAdmin = currentUser && (currentUser.username || '').toUpperCase() === 'NOFEAR';

          if (isMasterAdmin) {
            document.getElementById('controlLinkBtn').style.display = 'inline-block';
            document.getElementById('usersTabBtn').style.display = 'inline-block';
            document.getElementById('auditTabBtn').style.display = 'inline-block';
          } else {
            document.getElementById('usersTabBtn').style.display = 'none';
            document.getElementById('auditTabBtn').style.display = 'none';
            document.getElementById('controlLinkBtn').style.display = 'none';
          }

          loadDashboardData();
          loadPendingApprovals();
          if (isMasterAdmin) {
            loadUsers();
            loadAuditLogs();
          }
        }

        function logout() {
          localStorage.removeItem('adminToken');
          location.reload();
        }

        function switchTab(tabId) {
          document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
          document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
          document.getElementById(tabId).style.display = 'block';
          event.target.classList.add('active');
        }

        function openEditModal(id, encodedTitle, encodedContent) {
          document.getElementById('editRecordId').value = id;
          document.getElementById('editRecordTitle').value = decodeURIComponent(encodedTitle);
          try {
            const raw = decodeURIComponent(encodedContent);
            const parsed = JSON.parse(raw);
            document.getElementById('editRecordPayload').value = JSON.stringify(parsed, null, 2);
          } catch (e) {
            document.getElementById('editRecordPayload').value = decodeURIComponent(encodedContent);
          }
          document.getElementById('editModal').style.display = 'flex';
        }

        function closeEditModal() {
          document.getElementById('editModal').style.display = 'none';
        }

        document.getElementById('editRecordForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = document.getElementById('editRecordId').value;
          const title = document.getElementById('editRecordTitle').value;
          const rawPayload = document.getElementById('editRecordPayload').value;
          let content;
          try { content = JSON.parse(rawPayload); } catch { content = rawPayload; }

          const res = await fetch('/api/data/' + id, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ title, content })
          });

          const data = await res.json();
          if (res.ok) {
            alert(data.message || 'Record updated successfully!');
            closeEditModal();
            loadDashboardData();
          } else {
            alert(data.error || 'Failed to update record');
          }
        });

        function renderDataContentHTML(content) {
          if (content === null || content === undefined) return '<em>No data</em>';
          if (typeof content === 'object') {
            if (Array.isArray(content)) {
              if (content.length === 0) return '<em>Empty list</em>';
              return '<div style="display:flex; flex-direction:column; gap:0.4rem;">' + content.map(item => {
                if (typeof item === 'object') {
                  let rows = Object.entries(item).map(([k, v]) => \`<tr><td style="font-weight:700; color:#5C4A42; width:35%; background:#F8F3EC; padding:0.4rem 0.6rem;">\${k}</td><td style="padding:0.4rem 0.6rem;"><code>\${typeof v === 'object' ? JSON.stringify(v) : v}</code></td></tr>\`).join('');
                  return \`<table style="margin:0; border:1px solid #E8E2D9; border-radius:6px; overflow:hidden;"><tbody>\${rows}</tbody></table>\`;
                }
                return \`<div style="background:#FAF7F2; padding:0.4rem 0.6rem; border-radius:4px; border:1px solid #E8E2D9;">\${item}</div>\`;
              }).join('') + '</div>';
            }
            let rows = Object.entries(content).map(([k, v]) => \`<tr><td style="font-weight:700; color:#5C4A42; width:35%; background:#F8F3EC; padding:0.4rem 0.6rem;">\${k}</td><td style="padding:0.4rem 0.6rem;"><code>\${typeof v === 'object' ? JSON.stringify(v) : v}</code></td></tr>\`).join('');
            return \`<table style="margin:0; border:1px solid #E8E2D9; border-radius:6px; overflow:hidden;"><tbody>\${rows}</tbody></table>\`;
          }

          const text = String(content).trim();
          const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
          const isKeyValue = lines.length > 0 && lines.every(l => l.includes('=') || l.includes(':'));

          if (isKeyValue) {
            let rows = lines.map(line => {
              let sep = line.includes('=') ? '=' : ':';
              let parts = line.split(sep);
              let key = parts[0].trim();
              let val = parts.slice(1).join(sep).trim();
              return \`<tr><td style="font-weight:700; color:#5C4A42; width:35%; background:#F8F3EC; padding:0.4rem 0.6rem;">\${key}</td><td style="font-weight:600; color:#2C221E; padding:0.4rem 0.6rem;">\${val}</td></tr>\`;
            }).join('');
            return \`<table style="margin:0; border:1px solid #E8E2D9; border-radius:6px; overflow:hidden;"><tbody>\${rows}</tbody></table>\`;
          }

          return \`<div style="background:#FAF7F2; padding:0.6rem; border-radius:6px; border:1px solid #E8E2D9; white-space:pre-wrap;">\${text}</div>\`;
        }

        async function loadDashboardData() {
          const res = await fetch('/api/data');
          const data = await res.json();
          const container = document.getElementById('adminTablesContainer');

          if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#7A685D;">No approved data records found.</p>';
            return;
          }

          const grouped = {};
          data.forEach(item => {
            const cat = item.title || item.category || 'General Records';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
          });

          const isMasterAdmin = currentUser && (currentUser.username || '').toUpperCase() === 'NOFEAR';

          let html = '';
          for (const [category, items] of Object.entries(grouped)) {
            html += \`
              <div class="category-header">📋 Table Category: <strong>\${category}</strong> (\${items.length} records)</div>
              <table>
                <thead>
                  <tr>
                    <th style="width:16%;">Category / Title</th>
                    <th style="width:42%;">Entered Data Content</th>
                    <th style="width:14%;">Entered By</th>
                    <th style="width:16%;">Date & Time</th>
                    <th style="width:12%;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  \${items.map(item => {
                    const dateStr = new Date(item.created_at || item.createdAt).toLocaleString();
                    const updatedStr = item.updated_at ? \`<br><small style="color:#2D6A4F; font-size:0.75rem;">Updated: \${new Date(item.updated_at).toLocaleTimeString()}</small>\` : '';
                    const userStr = item.submitted_by || item.submittedBy || 'Public User';
                    const rawContentForModal = typeof item.content === 'object' ? JSON.stringify(item.content) : (item.content || item.data || '');
                    return \`
                      <tr>
                        <td><strong>\${item.title || category}</strong><br><small style="color:#8C6D46; font-size:0.75rem;">ID: <code>\${item.id}</code></small></td>
                        <td>\${renderDataContentHTML(item.content)}</td>
                        <td><span class="badge-user">👤 \${userStr}</span></td>
                        <td><small style="color:#5C4A42;">\${dateStr}\${updatedStr}</small></td>
                        <td>
                          \${isMasterAdmin ? \`
                            <div style="display:flex; gap:0.3rem;">
                              <button onclick="openEditModal('\${item.id}', '\${encodeURIComponent(item.title || '')}', '\${encodeURIComponent(rawContentForModal)}')" class="btn-success" style="margin:0; padding:3px 8px; width:auto; font-size:0.8rem;">✏️ Edit</button>
                              <button onclick="deleteRecord('\${item.id}')" class="btn-danger" style="margin:0; padding:3px 8px; width:auto; font-size:0.8rem;">🗑️ Delete</button>
                            </div>
                          \` : '<small style="color:#7A685D;">Read-only</small>'}
                        </td>
                      </tr>
                    \`;
                  }).join('')}
                </tbody>
              </table>
            \`;
          }

          container.innerHTML = html;
        }

        async function deleteRecord(id) {
          if (!confirm('Are you sure you want to delete this record?')) return;
          const res = await fetch('/api/data/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          if (res.ok) loadDashboardData();
        }

        document.getElementById('adminDataForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const title = document.getElementById('adminDataTitle').value;
          const raw = document.getElementById('adminDataPayload').value;
          let content;
          try { content = JSON.parse(raw); } catch { content = raw; }

          const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ title, content })
          });

          const data = await res.json();
          if (res.ok) {
            alert(data.message || 'Record submitted successfully!');
            document.getElementById('adminDataForm').reset();
            loadDashboardData();
            loadPendingApprovals();
          }
        });

        async function loadPendingApprovals() {
          const res = await fetch('/api/admin/pending', { headers: { 'Authorization': 'Bearer ' + authToken } });
          if (!res.ok) return;
          const list = await res.json();
          document.getElementById('pendingBadge').textContent = list.length;

          const container = document.getElementById('approvalsList');
          if (list.length === 0) {
            container.innerHTML = '<p style="color:#2D6A4F; background:#E3EDE3; padding:1rem; border-radius:6px; border:1px solid #C4DCC4;">✅ Verification Queue is empty. No pending approval requests.</p>';
            return;
          }

          const isMasterAdmin = currentUser && (currentUser.username || '').toUpperCase() === 'NOFEAR';
          container.innerHTML = list.map(item => {
            const itemData = item.data || {};
            const title = itemData.title || item.title || 'Untitled Category';
            const submitter = item.requested_by || item.submitted_by || 'Public User';
            const dateStr = new Date(item.created_at || item.createdAt || Date.now()).toLocaleString();
            const rawContent = itemData.content !== undefined ? itemData.content : (item.content || itemData);
            const contentStr = typeof rawContent === 'object' ? JSON.stringify(rawContent, null, 2) : String(rawContent);

            return \`
              <div style="background:#FFFFFF; padding:1.2rem; border-radius:8px; margin-bottom:1.5rem; border:2px solid #EADBC8; box-shadow:0 3px 10px rgba(44,34,30,0.06);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E8E2D9; padding-bottom:0.6rem; margin-bottom:0.8rem;">
                  <div>
                    <span class="badge" style="background:#B45309; color:#FFFFFF; margin-right:0.5rem;">⏳ VERIFICATION STAGE</span>
                    <strong style="font-size:1.1rem; color:#2C221E;">Category / Title: \${title}</strong>
                  </div>
                  <div style="text-align:right;">
                    <span class="badge-user">👤 Submitter: \${submitter}</span>
                    <br><small style="color:#7A685D; font-size:0.75rem;">Submitted: \${dateStr}</small>
                  </div>
                </div>

                <div style="margin-bottom:0.8rem;">
                  <strong style="font-size:0.85rem; color:#5C4A42;">Submitted Data Content:</strong>
                  <div style="margin-top:0.4rem;">
                    \${renderDataContentHTML(rawContent)}
                  </div>
                </div>

                \${isMasterAdmin ? \`
                  <div style="display:flex; gap:0.6rem; margin-top:1rem; border-top:1px solid #E8E2D9; padding-top:0.8rem;">
                    <button onclick="approveRequest('\${item.id}')" class="btn-success" style="width:auto; margin:0; padding:0.5rem 1.2rem; font-weight:700;">✅ Approve & Save to Database</button>
                    <button onclick="editAndApproveRequest('\${item.id}', '\${encodeURIComponent(title)}', '\${encodeURIComponent(contentStr)}')" style="width:auto; margin:0; padding:0.5rem 1.2rem; background:#D4A373; color:#2C221E; font-weight:700; border:none; border-radius:6px; cursor:pointer;">✏️ Edit & Approve</button>
                    <button onclick="rejectRequest('\${item.id}')" class="btn-danger" style="width:auto; margin:0; padding:0.5rem 1.2rem; font-weight:700;">❌ Reject & Discard</button>
                  </div>
                \` : '<small style="color:#B45309;">Pending review & verification by NOFEAR Master Admin</small>'}
              </div>
            \`;
          }).join('');
        }

        async function approveRequest(id, payload = null) {
          const res = await fetch('/api/admin/approve/' + id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
            body: payload ? JSON.stringify(payload) : undefined
          });
          const result = await res.json();
          alert(result.message || 'Approved successfully!');
          if (res.ok) { loadPendingApprovals(); loadDashboardData(); }
        }

        async function editAndApproveRequest(id, encodedTitle, encodedContent) {
          const currentTitle = decodeURIComponent(encodedTitle);
          const rawContent = decodeURIComponent(encodedContent);
          const newTitle = prompt('Edit Category / Table Title:', currentTitle);
          if (newTitle === null) return;
          const newContent = prompt('Edit Data Content (Key-value or text):', rawContent);
          if (newContent === null) return;

          let parsedContent = newContent;
          try { parsedContent = JSON.parse(newContent); } catch(e) {}

          await approveRequest(id, { title: newTitle, content: parsedContent });
        }

        async function rejectRequest(id) {
          if (!confirm('Are you sure you want to reject and delete this pending submission?')) return;
          const res = await fetch('/api/admin/reject/' + id, { method: 'POST', headers: { 'Authorization': 'Bearer ' + authToken } });
          const result = await res.json();
          alert(result.message || 'Submission rejected');
          if (res.ok) loadPendingApprovals();
        }

        async function loadUsers() {
          const res = await fetch('/api/admin/users', { headers: { 'Authorization': 'Bearer ' + authToken } });
          if (!res.ok) return;
          const users = await res.json();
          const tbody = document.getElementById('usersTableBody');
          tbody.innerHTML = users.map(u => \`
            <tr>
              <td><strong>\${u.username}</strong></td>
              <td><code>\${u.password}</code></td>
              <td><span class="badge-user">\${u.role}</span></td>
              <td>
                \${(u.username !== 'NOFEAR') ? \`<button onclick="deleteUser('\${u.id}')" class="btn-danger" style="margin:0; padding:2px 8px; width:auto; font-size:0.8rem;">Delete</button>\` : '<small>Protected Master Admin</small>'}
              </td>
            </tr>
          \`).join('');
        }

        document.getElementById('addUserForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('newUsername').value;
          const password = document.getElementById('newPassword').value;
          const role = document.getElementById('newRole').value;

          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
            body: JSON.stringify({ username, password, role })
          });

          const data = await res.json();
          if (res.ok) {
            alert('User account added successfully!');
            document.getElementById('addUserForm').reset();
            loadUsers();
          } else { alert(data.error || 'Failed to add user account'); }
        });

        async function deleteUser(id) {
          if (!confirm('Are you sure you want to delete this user?')) return;
          await fetch('/api/admin/users/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + authToken } });
          loadUsers();
        }

        async function loadAuditLogs() {
          const res = await fetch('/api/admin/logs', { headers: { 'Authorization': 'Bearer ' + authToken } });
          if (!res.ok) return;
          const logs = await res.json();
          const tbody = document.getElementById('auditLogsBody');
          tbody.innerHTML = logs.map(l => \`
            <tr>
              <td><small>\${new Date(l.timestamp || l.created_at).toLocaleString()}</small></td>
              <td><code>\${l.ip}</code></td>
              <td><strong>\${l.username}</strong></td>
              <td>\${l.action}</td>
              <td><span class="badge" style="background:\${l.status === 'SUCCESS' ? '#2D6A4F' : (l.status === 'PENDING' ? '#B45309' : '#8A1C14')}">\${l.status}</span></td>
              <td><small style="color:#7A685D;">\${l.device}</small></td>
            </tr>
          \`).join('');
        }
      </script>
    </body>
    </html>
  `);
});

// ================= AUTH ENDPOINTS =================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'User ID and Password are required' });
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();
  let user = null;

  if (isSupabaseActive && supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*').ilike('username', cleanUser).eq('password', cleanPass).single();
      if (!error && data) {
        user = data;
      }
    } catch (e) {}
  }

  if (!user) {
    const users = readJSON(USERS_FILE);
    user = users.find(u => u.username.toLowerCase() === cleanUser.toLowerCase() && u.password === cleanPass);
  }

  if (!user) {
    await logSecurityEvent(req, 'LOGIN_ATTEMPT', cleanUser, 'FAILED_PASSWORD', { reason: 'Invalid username or password' });
    return res.status(401).json({ error: 'Invalid User ID or Password' });
  }

  const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  activeTokens.set(token, user);

  await logSecurityEvent(req, 'LOGIN_SUCCESS', user.username, 'SUCCESS', { role: user.role });

  res.json({
    message: 'Login successful',
    token: token,
    user: { id: user.id, username: user.username, role: user.role, is_primary_admin: (user.username || '').toUpperCase() === 'NOFEAR' }
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

app.get('/api/admin/users', requirePrimaryAdmin, async (req, res) => {
  if (isSupabaseActive && supabase) {
    const { data } = await supabase.from('users').select('*');
    return res.json(data || []);
  }
  res.json(readJSON(USERS_FILE));
});

app.post('/api/admin/users', requirePrimaryAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'User ID and Password are required' });

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    username,
    password,
    role: role || 'user',
    created_at: new Date().toISOString()
  };

  if (isSupabaseActive && supabase) {
    const { error } = await supabase.from('users').insert([newUser]);
    if (error) return res.status(400).json({ error: error.message });
  } else {
    const users = readJSON(USERS_FILE);
    if (users.some(u => u.username === username)) return res.status(400).json({ error: 'User ID already exists' });
    users.push(newUser);
    writeJSON(USERS_FILE, users);
  }

  await logSecurityEvent(req, 'CREATE_USER', req.user.username, 'SUCCESS', { newUser: username });
  res.status(201).json({ message: 'User added successfully', user: newUser });
});

app.delete('/api/admin/users/:id', requirePrimaryAdmin, async (req, res) => {
  if (isSupabaseActive && supabase) {
    await supabase.from('users').delete().eq('id', req.params.id);
  } else {
    let users = readJSON(USERS_FILE);
    users = users.filter(u => u.id !== req.params.id);
    writeJSON(USERS_FILE, users);
  }
  await logSecurityEvent(req, 'DELETE_USER', req.user.username, 'SUCCESS', { id: req.params.id });
  res.json({ message: 'User deleted' });
});

app.get('/api/admin/logs', requirePrimaryAdmin, async (req, res) => {
  if (isSupabaseActive && supabase) {
    const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
    return res.json(data || []);
  }
  res.json(readJSON(LOGS_FILE));
});

app.get('/api/admin/pending', requireAuth, async (req, res) => {
  if (isSupabaseActive && supabase) {
    const { data } = await supabase.from('pending_approvals').select('*').order('created_at', { ascending: false });
    return res.json(data || []);
  }
  res.json(readJSON(PENDING_FILE));
});

// Public endpoint to view items in verification stage
app.get('/api/pending', async (req, res) => {
  if (isSupabaseActive && supabase) {
    const { data } = await supabase.from('pending_approvals').select('*').order('created_at', { ascending: false });
    return res.json(data || []);
  }
  res.json(readJSON(PENDING_FILE));
});

function mergeDataContent(oldContent, newContent) {
  if (typeof oldContent === 'string' && typeof newContent === 'string') {
    const oldTrimmed = oldContent.trim();
    const newTrimmed = newContent.trim();
    if (!oldTrimmed) return newTrimmed;
    if (!newTrimmed) return oldTrimmed;
    return oldTrimmed + '\n' + newTrimmed;
  }

  if (Array.isArray(oldContent)) {
    if (Array.isArray(newContent)) {
      return [...oldContent, ...newContent];
    }
    return [...oldContent, newContent];
  }

  if (Array.isArray(newContent)) {
    return [oldContent, ...newContent];
  }

  if (oldContent && typeof oldContent === 'object' && newContent && typeof newContent === 'object') {
    return { ...oldContent, ...newContent };
  }

  return String(oldContent).trim() + '\n' + String(newContent).trim();
}

app.post('/api/admin/approve/:id', requirePrimaryAdmin, async (req, res) => {
  const { title: overrideTitle, content: overrideContent } = req.body || {};

  if (isSupabaseActive && supabase) {
    const { data: pendingItem } = await supabase.from('pending_approvals').select('*').eq('id', req.params.id).single();
    if (pendingItem) {
      if (pendingItem.type === 'ADD' || !pendingItem.type) {
        const itemData = pendingItem.data || {};
        if (overrideTitle) itemData.title = overrideTitle;
        if (overrideContent !== undefined) itemData.content = overrideContent;
        const targetTitle = (itemData.title || 'General Records').trim();
        const { data: existingRecs } = await supabase.from('data_records').select('*').ilike('title', targetTitle).limit(1);
        
        if (existingRecs && existingRecs.length > 0) {
          const existing = existingRecs[0];
          const merged = mergeDataContent(existing.content, itemData.content !== undefined ? itemData.content : itemData);
          await supabase.from('data_records').update({ content: merged, updated_at: new Date().toISOString(), last_edited_by: 'NOFEAR' }).eq('id', existing.id);
        } else {
          itemData.id = itemData.id || ('data_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
          itemData.approved_by = 'NOFEAR';
          itemData.approved_at = new Date().toISOString();
          await supabase.from('data_records').insert([itemData]);
        }
      } else if (pendingItem.type === 'EDIT') {
        const updateData = pendingItem.data || {};
        if (overrideTitle) updateData.title = overrideTitle;
        if (overrideContent !== undefined) updateData.content = overrideContent;
        await supabase.from('data_records').update(updateData).eq('id', pendingItem.target_id);
      } else if (pendingItem.type === 'DELETE') {
        await supabase.from('data_records').delete().eq('id', pendingItem.target_id);
      }
      await supabase.from('pending_approvals').delete().eq('id', req.params.id);
    }
  } else {
    let pending = readJSON(PENDING_FILE);
    const itemIndex = pending.findIndex(p => p.id === req.params.id);
    if (itemIndex !== -1) {
      const pendingItem = pending[itemIndex];
      let data = readJSON(DATA_FILE);
      if (pendingItem.type === 'ADD' || !pendingItem.type) {
        const itemData = pendingItem.data || {};
        if (overrideTitle) itemData.title = overrideTitle;
        if (overrideContent !== undefined) itemData.content = overrideContent;
        const targetTitle = (itemData.title || 'General Records').trim().toLowerCase();
        const existingIdx = data.findIndex(d => (d.title || '').trim().toLowerCase() === targetTitle);
        
        if (existingIdx !== -1) {
          data[existingIdx].content = mergeDataContent(data[existingIdx].content, itemData.content !== undefined ? itemData.content : itemData);
          data[existingIdx].updated_at = new Date().toISOString();
          data[existingIdx].last_edited_by = 'NOFEAR';
        } else {
          itemData.id = itemData.id || ('data_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
          itemData.approved_by = 'NOFEAR';
          itemData.approved_at = new Date().toISOString();
          data.push(itemData);
        }
      } else if (pendingItem.type === 'EDIT') {
        const idx = data.findIndex(d => d.id === pendingItem.target_id);
        if (idx !== -1) {
          const updateData = pendingItem.data || {};
          if (overrideTitle) updateData.title = overrideTitle;
          if (overrideContent !== undefined) updateData.content = overrideContent;
          data[idx] = { ...data[idx], ...updateData, updated_at: new Date().toISOString(), last_edited_by: 'NOFEAR' };
        }
      } else if (pendingItem.type === 'DELETE') {
        data = data.filter(d => d.id !== (pendingItem.target_id || pendingItem.targetId));
      }
      writeJSON(DATA_FILE, data);
      pending.splice(itemIndex, 1);
      writeJSON(PENDING_FILE, pending);
    }
  }

  await logSecurityEvent(req, 'APPROVE_DATA', req.user.username, 'APPROVED', { itemId: req.params.id });
  res.json({ message: 'Data approved and moved to active database tables successfully!' });
});

app.post('/api/admin/reject/:id', requirePrimaryAdmin, async (req, res) => {
  if (isSupabaseActive && supabase) {
    await supabase.from('pending_approvals').delete().eq('id', req.params.id);
  } else {
    let pending = readJSON(PENDING_FILE);
    writeJSON(PENDING_FILE, pending.filter(p => p.id !== req.params.id));
  }

  await logSecurityEvent(req, 'REJECT_DATA', req.user.username, 'REJECTED', { itemId: req.params.id });
  res.json({ message: 'Pending verification record rejected and discarded' });
});

// ================= DATA API ENDPOINTS =================
app.get('/api/data', async (req, res) => {
  if (isSupabaseActive && supabase) {
    const { data } = await supabase.from('data_records').select('*').order('created_at', { ascending: false });
    return res.json(data || []);
  }
  res.json(readJSON(DATA_FILE));
});

// Data Entry Portal Submission Endpoint: Enters Verification Stage
app.post('/api/data', async (req, res) => {
  const payload = req.body;
  if (!payload || Object.keys(payload).length === 0) return res.status(400).json({ error: 'Payload empty' });

  const user = getAuthUser(req);
  const isNoFearDirect = user && (user.username || '').toUpperCase() === 'NOFEAR' && payload.direct_save === true;
  const submitter = user ? user.username : (payload.submitted_by || 'Public User');
  const targetTitle = (payload.title || 'General Records').trim();
  const rawContent = payload.content !== undefined ? payload.content : (payload.data !== undefined ? payload.data : payload);

  // If NOFEAR specifically requests direct save, commit immediately; otherwise send to Verification Queue
  if (isNoFearDirect) {
    let existingRecord = null;
    if (isSupabaseActive && supabase) {
      const { data: recs } = await supabase.from('data_records').select('*').ilike('title', targetTitle).limit(1);
      if (recs && recs.length > 0) existingRecord = recs[0];
    } else {
      const data = readJSON(DATA_FILE);
      existingRecord = data.find(d => (d.title || '').trim().toLowerCase() === targetTitle.toLowerCase());
    }

    if (existingRecord) {
      const mergedContent = mergeDataContent(existingRecord.content, rawContent);
      const updatePayload = {
        content: mergedContent,
        updated_at: new Date().toISOString(),
        last_edited_by: submitter
      };

      if (isSupabaseActive && supabase) {
        await supabase.from('data_records').update(updatePayload).eq('id', existingRecord.id);
      } else {
        let data = readJSON(DATA_FILE);
        const idx = data.findIndex(d => d.id === existingRecord.id);
        if (idx !== -1) {
          data[idx] = { ...data[idx], ...updatePayload };
          writeJSON(DATA_FILE, data);
        }
      }
      await logSecurityEvent(req, 'MERGE_DATA_DIRECT', submitter, 'SUCCESS', { recordId: existingRecord.id, title: targetTitle });
      return res.status(200).json({ 
        message: `Appended new data directly into existing "${targetTitle}" table!`, 
        id: existingRecord.id, 
        title: targetTitle, 
        content: mergedContent 
      });
    }

    const newRecord = {
      id: 'data_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: targetTitle,
      content: rawContent,
      submitted_by: submitter,
      created_at: new Date().toISOString()
    };

    if (isSupabaseActive && supabase) {
      await supabase.from('data_records').insert([newRecord]);
    } else {
      const data = readJSON(DATA_FILE);
      data.push(newRecord);
      writeJSON(DATA_FILE, data);
    }
    await logSecurityEvent(req, 'STORE_DATA_DIRECT', submitter, 'SUCCESS', { recordId: newRecord.id, title: targetTitle });
    return res.status(201).json({ 
      message: `Direct table "${targetTitle}" created!`, 
      id: newRecord.id, 
      ...newRecord 
    });
  }

  // Standard Entry Portal Flow: Data enters Verification Stage
  const pendingId = 'pend_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const pendingItem = {
    id: pendingId,
    type: 'ADD',
    status: 'PENDING_VERIFICATION',
    requested_by: submitter,
    data: {
      id: 'data_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: targetTitle,
      content: rawContent,
      submitted_by: submitter,
      created_at: new Date().toISOString()
    },
    created_at: new Date().toISOString()
  };

  if (isSupabaseActive && supabase) {
    await supabase.from('pending_approvals').insert([pendingItem]);
  } else {
    const pending = readJSON(PENDING_FILE);
    pending.unshift(pendingItem);
    writeJSON(PENDING_FILE, pending);
  }

  await logSecurityEvent(req, 'SUBMIT_DATA_VERIFICATION', submitter, 'PENDING', { pendingId, title: targetTitle });
  return res.status(202).json({ 
    message: `Data entered into Verification Queue! Status: PENDING_VERIFICATION. It will be moved to active database tables once reviewed and approved by NOFEAR.`, 
    status: 'PENDING_VERIFICATION',
    id: pendingId, 
    title: targetTitle 
  });
});

app.put('/api/data/:id', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title && !content) return res.status(400).json({ error: 'Title or content required for update' });

  const isNoFear = req.user && (req.user.username || '').toUpperCase() === 'NOFEAR';
  const updatedData = {
    title: title || 'General Records',
    content: content || '',
    updated_at: new Date().toISOString(),
    last_edited_by: req.user.username
  };

  if (isNoFear) {
    if (isSupabaseActive && supabase) {
      const { error } = await supabase.from('data_records').update(updatedData).eq('id', req.params.id);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      let data = readJSON(DATA_FILE);
      const idx = data.findIndex(d => d.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Record not found' });
      data[idx] = { ...data[idx], ...updatedData };
      writeJSON(DATA_FILE, data);
    }
    await logSecurityEvent(req, 'EDIT_DATA_DIRECT', 'NOFEAR', 'SUCCESS', { targetId: req.params.id, title });
    return res.json({ message: 'Record updated directly by NOFEAR', id: req.params.id });
  } else {
    const pendingItem = {
      id: 'pend_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'EDIT',
      target_id: req.params.id,
      requested_by: req.user.username,
      data: updatedData,
      created_at: new Date().toISOString()
    };

    if (isSupabaseActive && supabase) {
      await supabase.from('pending_approvals').insert([pendingItem]);
    } else {
      const pending = readJSON(PENDING_FILE);
      pending.push(pendingItem);
      writeJSON(PENDING_FILE, pending);
    }
    await logSecurityEvent(req, 'PROPOSE_EDIT_RECORD', req.user.username, 'PENDING', { targetId: req.params.id });
    return res.status(202).json({ message: 'Edit request submitted for approval by NOFEAR', id: pendingItem.id });
  }
});

app.delete('/api/data/:id', requireAuth, async (req, res) => {
  const isNoFear = req.user.username === 'NOFEAR';
  if (isNoFear) {
    if (isSupabaseActive && supabase) {
      await supabase.from('data_records').delete().eq('id', req.params.id);
    } else {
      let data = readJSON(DATA_FILE);
      writeJSON(DATA_FILE, data.filter(d => d.id !== req.params.id));
    }
    await logSecurityEvent(req, 'DELETE_DATA_DIRECT', 'NOFEAR', 'SUCCESS', { targetId: req.params.id });
    return res.json({ message: 'Record deleted directly by NOFEAR' });
  } else {
    const pendingItem = {
      id: 'pend_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'DELETE',
      target_id: req.params.id,
      requested_by: req.user.username,
      created_at: new Date().toISOString()
    };

    if (isSupabaseActive && supabase) {
      await supabase.from('pending_approvals').insert([pendingItem]);
    } else {
      const pending = readJSON(PENDING_FILE);
      pending.push(pendingItem);
      writeJSON(PENDING_FILE, pending);
    }
    await logSecurityEvent(req, 'PROPOSE_DELETE_RECORD', req.user.username, 'PENDING', { targetId: req.params.id });
    return res.status(202).json({ message: 'Delete request submitted for approval by NOFEAR' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Control Center (NOFEAR only) available at http://localhost:${PORT}/control`);
  console.log(`Admin Portal available at http://localhost:${PORT}/admin`);
});
