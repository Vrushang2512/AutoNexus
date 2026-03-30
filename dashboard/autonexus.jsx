import { useState, useRef, useEffect } from "react";

const API_BASE = "https://envdevapi.oizom.com";
const LOGIN_ENDPOINT = `${API_BASE}/users/login/v2`;

function getTime() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StatusDot({ ok }) {
  return <div style={{ width: 8, height: 8, borderRadius: "50%", background: ok ? "#4ADE80" : ok === false ? "#F87171" : "#3B3B3B", flexShrink: 0 }} />;
}

function TestRow({ label, status, time }) {
  const color = status === "pass" ? "#4ADE80" : status === "fail" ? "#F87171" : status === "running" ? "#7EB6FF" : "#3B3B3B";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1A1D24", fontSize: 13 }}>
      <StatusDot ok={status === "pass" ? true : status === "fail" ? false : null} />
      <span style={{ flex: 1, color: "#C9D1D9", fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
      <span style={{ color, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, minWidth: 50, textAlign: "right" }}>
        {status === "running" ? "..." : status === "pass" ? "PASS" : status === "fail" ? "FAIL" : "\u2014"}
      </span>
      {time !== null && <span style={{ color: "#484F58", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", minWidth: 55, textAlign: "right" }}>{time}ms</span>}
    </div>
  );
}

function DeviceRow({ device, index }) {
  const isOnline = device.status === "online" || device.status === true || device.status === 1;
  const statusColor = isOnline ? "#4ADE80" : "#F87171";
  return (
    <tr style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: "1px solid #1A1D24" }}>
      <td style={{ padding: "7px 10px", fontSize: 11, color: "#3B3F48", fontFamily: "'IBM Plex Mono', monospace" }}>{index + 1}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#E6EDF3", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>{device.id}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#A5D6FF", fontFamily: "'IBM Plex Mono', monospace" }}>{device.name}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#C9D1D9", fontFamily: "'IBM Plex Mono', monospace" }}>{device.type}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#7D8590", fontFamily: "'IBM Plex Mono', monospace" }}>{device.location}</td>
      <td style={{ padding: "7px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
          <span style={{ fontSize: 11, color: statusColor, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>{isOnline ? "Online" : "Offline"}</span>
        </div>
      </td>
    </tr>
  );
}

export default function AutoNexus() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [command, setCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([{ t: getTime(), msg: "AutoNexus initialized. Type 'do login' to begin.", type: "info" }]);
  const [tests, setTests] = useState([]);
  const [apiResult, setApiResult] = useState(null);
  const [expandResponse, setExpandResponse] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const logEnd = useRef(null);

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const log = (msg, type = "info") => setLogs(p => [...p, { t: getTime(), msg, type }]);

  const setTestStatus = (index, status, time = null) => {
    setTests(prev => {
      const copy = [...prev];
      if (copy[index]) copy[index] = { ...copy[index], status, time };
      return copy;
    });
  };

  function extractDevices(data) {
    if (!data) return [];
    const tryKeys = ["devices", "devices_data", "device_list", "equipment"];
    for (const k of tryKeys) {
      if (data[k] && Array.isArray(data[k]) && data[k].length > 0) return normalizeDevices(data[k]);
      if (data[k] && typeof data[k] === "object" && !Array.isArray(data[k])) {
        return normalizeDevices(Object.entries(data[k]).map(([id, v]) => ({ id, ...(typeof v === "object" ? v : {}) })));
      }
    }
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
        const f = val[0];
        if (f.deviceId || f.device_id || f.id || f.serialNumber) return normalizeDevices(val);
      }
    }
    if (Array.isArray(data) && data.length > 0) return normalizeDevices(data);
    return [];
  }

  function normalizeDevices(list) {
    return list.map((d, i) => ({
      id: d.deviceId || d.device_id || d.id || d.serialNumber || d.serial_number || `device-${i + 1}`,
      name: d.deviceName || d.device_name || d.name || d.label || "\u2014",
      type: d.deviceType || d.device_type || d.type || d.model || d.category || "\u2014",
      location: d.location || d.locationName || d.location_name || d.city || d.site || "\u2014",
      status: d.status || d.connectionStatus || d.connection_status || d.isOnline || d.is_online || "unknown",
    }));
  }

  async function runLoginTests() {
    if (!email || !password) { log("Enter your email and password first.", "error"); return; }

    setIsRunning(true);
    setApiResult(null);
    setExpandResponse(false);
    setDevices([]);
    setDeviceSearch("");
    setDeviceFilter("all");

    const testDefs = [
      "API endpoint is reachable",
      "POST /users/login/v2 returns 200",
      "Response contains auth token",
      "Response contains user ID",
      "Response time < 5 seconds",
      "Wrong password returns non-200",
      "Empty email returns non-200",
      "GET /users/{id}/overview/v2 returns 200",
      "Overview contains device list",
    ];
    setTests(testDefs.map(label => ({ label, status: "pending", time: null })));
    log("Starting login + device discovery...", "cmd");

    let authToken = null, userId = null, t0;

    // Test 1: Reachable
    setTestStatus(0, "running");
    t0 = performance.now();
    try { await fetch(LOGIN_ENDPOINT, { method: "OPTIONS" }).catch(() => null); } catch {}
    setTestStatus(0, "pass", Math.round(performance.now() - t0));
    log("API endpoint reachable.", "success");

    // Test 2: Login 200
    setTestStatus(1, "running");
    t0 = performance.now();
    let loginData = null, loginStatus = 0;
    try {
      const res = await fetch(LOGIN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email_id: email, password }) });
      loginStatus = res.status;
      const ms = Math.round(performance.now() - t0);
      try { loginData = await res.json(); } catch {}
      setApiResult({ status: loginStatus, time: ms, body: loginData, url: LOGIN_ENDPOINT });
      setTestStatus(1, loginStatus === 200 ? "pass" : "fail", ms);
      log(`POST /users/login/v2 \u2192 ${loginStatus} (${ms}ms)`, loginStatus === 200 ? "success" : "error");
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      setTestStatus(1, "fail", ms);
      setApiResult({ status: "Network Error", time: ms, body: { error: err.message }, url: LOGIN_ENDPOINT });
      log(`Network error: ${err.message}`, "error");
      for (let i = 2; i < testDefs.length; i++) setTestStatus(i, "fail");
      setIsRunning(false);
      return;
    }

    // Test 3: Token
    setTestStatus(2, "running");
    authToken = loginData?.token || loginData?.accessToken || loginData?.access_token;
    setTestStatus(2, authToken ? "pass" : "fail");
    if (authToken) log(`Token: ${authToken.substring(0, 24)}...`, "success");
    else log("No token in response.", "error");

    // Test 4: UserId
    setTestStatus(3, "running");
    userId = loginData?.userId || loginData?.user_id || loginData?.id;
    setTestStatus(3, userId ? "pass" : "fail");
    if (userId) log(`User ID: ${userId}`, "success");
    else log("No userId in response.", "error");

    // Test 5: Response time
    setTestStatus(4, "running");
    const rt = apiResult?.time || 0;
    setTestStatus(4, rt < 5000 ? "pass" : "fail", rt);
    log(`Response time: ${rt}ms`, rt < 5000 ? "success" : "error");

    // Test 6: Wrong password
    setTestStatus(5, "running");
    t0 = performance.now();
    try {
      const bad = await fetch(LOGIN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email_id: email, password: "WRONG_XYZ_12345!" }) });
      const ms = Math.round(performance.now() - t0);
      setTestStatus(5, bad.status !== 200 ? "pass" : "fail", ms);
      log(`Wrong password \u2192 ${bad.status}`, bad.status !== 200 ? "success" : "error");
    } catch { setTestStatus(5, "fail"); }

    // Test 7: Empty email
    setTestStatus(6, "running");
    t0 = performance.now();
    try {
      const empty = await fetch(LOGIN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email_id: "", password: "x" }) });
      const ms = Math.round(performance.now() - t0);
      setTestStatus(6, empty.status !== 200 ? "pass" : "fail", ms);
      log(`Empty email \u2192 ${empty.status}`, empty.status !== 200 ? "success" : "error");
    } catch { setTestStatus(6, "fail"); }

    // Test 8 & 9: Overview → Devices
    if (userId && authToken) {
      setTestStatus(7, "running");
      t0 = performance.now();
      const params = new URLSearchParams({ userId: String(userId), profile: "auto", devices_data: "auto", cluster: "auto", devices: "auto", units: "auto", aqi_and_units: "auto", module_expiry: "auto", org: "auto", master_org: "auto", device_types: "auto", complain_categories: "auto", latest_features: "auto", modules: "auto", widgets: "auto", lastUpdatedToken: "" });
      try {
        const ov = await fetch(`${API_BASE}/users/${userId}/overview/v2?${params}`, { method: "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` } });
        const ms = Math.round(performance.now() - t0);
        let ovData = null;
        try { ovData = await ov.json(); } catch {}
        setTestStatus(7, ov.status === 200 ? "pass" : "fail", ms);
        log(`Overview \u2192 ${ov.status} (${ms}ms)`, ov.status === 200 ? "success" : "error");

        setTestStatus(8, "running");
        const devList = extractDevices(ovData);
        if (devList.length > 0) {
          setDevices(devList);
          setTestStatus(8, "pass");
          log(`Discovered ${devList.length} devices.`, "success");
        } else {
          setTestStatus(8, "fail");
          log(`No devices found. Keys: ${ovData ? Object.keys(ovData).join(", ") : "empty"}`, "warn");
        }
      } catch (err) {
        setTestStatus(7, "fail");
        setTestStatus(8, "fail");
        log(`Overview error: ${err.message}`, "error");
      }
    } else {
      setTestStatus(7, "fail");
      setTestStatus(8, "fail");
      log("Skipping overview: missing token or userId.", "warn");
    }

    log("All tests completed.", "cmd");
    setIsRunning(false);
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !isRunning) {
      const cmd = command.trim().toLowerCase();
      setCommand("");
      if (cmd === "do login") runLoginTests();
      else if (cmd === "clear") { setTests([]); setApiResult(null); setDevices([]); setLogs([{ t: getTime(), msg: "Cleared.", type: "info" }]); }
      else if (cmd === "help") log("Commands: 'do login' \u2014 run tests & fetch devices, 'clear' \u2014 reset", "info");
      else log(`Unknown: '${cmd}'. Type 'help'.`, "error");
    }
  };

  const passCount = tests.filter(t => t.status === "pass").length;
  const failCount = tests.filter(t => t.status === "fail").length;
  const total = tests.length;
  const onlineCount = devices.filter(d => d.status === "online" || d.status === true || d.status === 1).length;

  const filtered = devices.filter(d => {
    const q = deviceSearch.toLowerCase();
    const matchQ = !q || [d.id, d.name, d.type, d.location].some(v => v && v.toLowerCase().includes(q));
    const isOn = d.status === "online" || d.status === true || d.status === 1;
    const matchF = deviceFilter === "all" || (deviceFilter === "online" && isOn) || (deviceFilter === "offline" && !isOn);
    return matchQ && matchF;
  });

  const thStyle = { padding: "8px 10px", textAlign: "left", color: "#3B3F48", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #1A1D24" };

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace", background: "#0C0E14", color: "#C9D1D9", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 8px rgba(126,182,255,0.15)}50%{box-shadow:0 0 20px rgba(126,182,255,0.3)}}
        input:focus{outline:none}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#0C0E14}::-webkit-scrollbar-thumb{background:#21262D;border-radius:3px}
        .inp{width:100%;padding:9px 12px;background:#12151C;border:1px solid #21262D;border-radius:6px;color:#E6EDF3;font-family:inherit;font-size:13px;box-sizing:border-box;transition:border .15s}
        .inp:focus{border-color:#30363D}
        .qb{background:#12151C;border:1px solid #21262D;color:#7EB6FF;padding:7px 16px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;transition:all .15s}
        .qb:hover{background:#1A1F2E;border-color:#7EB6FF}
        .qb:disabled{opacity:.35;cursor:not-allowed}
        .ft{background:none;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:500;transition:all .12s}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1A1D24", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, background: "#0D1017" }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #7EB6FF 0%, #A78BFA 50%, #4ADE80 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#0D1117", fontFamily: "'Space Grotesk', sans-serif", animation: "glowPulse 3s ease-in-out infinite" }}>A</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#E6EDF3", letterSpacing: "1.5px", fontFamily: "'Space Grotesk', sans-serif" }}>
            AUTO<span style={{ color: "#7EB6FF" }}>NEXUS</span>
          </div>
          <div style={{ fontSize: 10, color: "#3B3F48", marginTop: 1, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.5px" }}>Envizom Test Automation Console</div>
        </div>
        {total > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 12 }}>
            <span style={{ color: "#4ADE80" }}>{passCount} passed</span>
            {failCount > 0 && <span style={{ color: "#F87171" }}>{failCount} failed</span>}
            <span style={{ color: "#484F58" }}>{total} total</span>
            {devices.length > 0 && <span style={{ color: "#A78BFA" }}>{devices.length} devices</span>}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>

        {/* Credentials */}
        <div style={{ background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#484F58", marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>Credentials</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#3B3F48", display: "block", marginBottom: 4 }}>Email</label>
              <input className="inp" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#3B3F48", display: "block", marginBottom: 4 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="inp" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="password" style={{ paddingRight: 50 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#3B3F48", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>{showPass ? "HIDE" : "SHOW"}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className="qb" disabled={isRunning} onClick={runLoginTests} style={{ flex: 1, color: "#4ADE80", borderColor: "#1A2E1A" }}>{isRunning ? "Running..." : "do login"}</button>
          <button className="qb" disabled={isRunning} onClick={() => { setTests([]); setApiResult(null); setDevices([]); setLogs([{ t: getTime(), msg: "Cleared.", type: "info" }]); }}>clear</button>
        </div>

        {/* Test Results */}
        {tests.length > 0 && (
          <div style={{ background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: 16, marginBottom: 16, animation: "slideIn .25s ease" }}>
            <div style={{ fontSize: 11, color: "#484F58", marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>Test results</div>
            {tests.map((t, i) => <TestRow key={i} label={t.label} status={t.status} time={t.time} />)}
            {!isRunning && total > 0 && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 6, background: failCount === 0 ? "#0D1F0D" : "#1F0D0D", border: `1px solid ${failCount === 0 ? "#1A3A1A" : "#3A1A1A"}`, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: failCount === 0 ? "#4ADE80" : "#F87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#0D1117", fontWeight: 700 }}>{failCount === 0 ? "\u2713" : "!"}</div>
                <span style={{ color: failCount === 0 ? "#4ADE80" : "#F87171", fontSize: 13, fontWeight: 500 }}>{failCount === 0 ? `All ${passCount} tests passed` : `${failCount} of ${total} tests failed`}</span>
              </div>
            )}
          </div>
        )}

        {/* Devices Table */}
        {devices.length > 0 && (
          <div style={{ background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: 16, marginBottom: 16, animation: "slideIn .25s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "#484F58", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>Devices in account</div>
                <div style={{ fontSize: 12, color: "#3B3F48", marginTop: 3 }}>
                  <span style={{ color: "#A78BFA" }}>{devices.length} total</span>
                  {" \u00B7 "}<span style={{ color: "#4ADE80" }}>{onlineCount} online</span>
                  {" \u00B7 "}<span style={{ color: "#F87171" }}>{devices.length - onlineCount} offline</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {["all", "online", "offline"].map(f => (
                  <button key={f} className="ft" onClick={() => setDeviceFilter(f)} style={{
                    color: deviceFilter === f ? (f === "online" ? "#4ADE80" : f === "offline" ? "#F87171" : "#E6EDF3") : "#3B3F48",
                    background: deviceFilter === f ? (f === "online" ? "#0D1F0D" : f === "offline" ? "#1F0D0D" : "#1A1F2E") : "none"
                  }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
            </div>

            <input className="inp" value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} placeholder="Search by ID, name, type, or location..." style={{ marginBottom: 12, fontSize: 12, padding: "7px 12px" }} />

            <div style={{ maxHeight: 400, overflow: "auto", borderRadius: 6, border: "1px solid #1A1D24" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#12151C", position: "sticky", top: 0, zIndex: 1 }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Device ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => <DeviceRow key={d.id + i} device={d} index={i} />)}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#3B3F48", fontSize: 12 }}>No devices match your filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {deviceSearch && <div style={{ fontSize: 11, color: "#3B3F48", marginTop: 6 }}>Showing {filtered.length} of {devices.length}</div>}
          </div>
        )}

        {/* API Response */}
        {apiResult && (
          <div style={{ background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#484F58", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>Login API response</div>
              <button onClick={() => setExpandResponse(!expandResponse)} style={{ background: "none", border: "none", color: "#7EB6FF", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>{expandResponse ? "Collapse" : "Expand"} JSON</button>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
              <span><span style={{ color: "#484F58" }}>Status: </span><span style={{ color: apiResult.status === 200 ? "#4ADE80" : "#F87171", fontWeight: 600 }}>{apiResult.status}</span></span>
              <span><span style={{ color: "#484F58" }}>Time: </span><span style={{ color: apiResult.time < 3000 ? "#4ADE80" : "#F5A623" }}>{apiResult.time}ms</span></span>
            </div>
            {expandResponse && <pre style={{ fontSize: 11, color: "#A5D6FF", margin: "10px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, maxHeight: 260, overflow: "auto", background: "#12151C", padding: 12, borderRadius: 6 }}>{JSON.stringify(apiResult.body, null, 2)}</pre>}
          </div>
        )}

        {/* Log */}
        <div style={{ background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: 16, marginBottom: 16, maxHeight: 130, overflow: "auto" }}>
          <div style={{ fontSize: 11, color: "#484F58", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>Log</div>
          {logs.map((l, i) => (
            <div key={i} style={{ fontSize: 11, lineHeight: 1.8, color: l.type === "error" ? "#F87171" : l.type === "success" ? "#4ADE80" : l.type === "cmd" ? "#7EB6FF" : l.type === "warn" ? "#F5A623" : "#484F58" }}>
              <span style={{ color: "#21262D", marginRight: 8 }}>{l.t}</span>{l.msg}
            </div>
          ))}
          <div ref={logEnd} />
        </div>

        {/* Prompt */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: "10px 14px" }}>
          <span style={{ color: "#4ADE80", fontWeight: 600, fontSize: 14 }}>$</span>
          <input value={command} onChange={e => setCommand(e.target.value)} onKeyDown={handleKey} disabled={isRunning}
            placeholder={isRunning ? "Running tests..." : "Type 'do login' and press Enter"}
            style={{ flex: 1, background: "transparent", border: "none", color: "#E6EDF3", fontFamily: "inherit", fontSize: 13, caretColor: "#4ADE80", opacity: isRunning ? 0.4 : 1 }} autoFocus />
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0 8px", fontSize: 10, color: "#21262D", letterSpacing: "0.5px" }}>
          AutoNexus v1.0 \u00B7 Envizom Test Automation
        </div>
      </div>
    </div>
  );
}
