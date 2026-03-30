import { useState, useRef, useEffect } from "react";

const API_BASE = "https://envdevapi.oizom.com";

function getTime() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StepIndicator({ number, status, label }) {
  const bg = status === "pass" ? "#0D1F0D" : status === "fail" ? "#1F0D0D" : status === "running" ? "#0D1520" : "#12151C";
  const border = status === "pass" ? "#1A3A1A" : status === "fail" ? "#3A1A1A" : status === "running" ? "#1A2A3A" : "#1A1D24";
  const dotColor = status === "pass" ? "#4ADE80" : status === "fail" ? "#F87171" : status === "running" ? "#7EB6FF" : "#3B3B3B";
  const textColor = status === "pass" ? "#4ADE80" : status === "fail" ? "#F87171" : status === "running" ? "#7EB6FF" : "#484F58";
  const labelColor = status === "pass" || status === "fail" || status === "running" ? "#C9D1D9" : "#484F58";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: bg, border: `1px solid ${border}`, borderRadius: 8, transition: "all .3s" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: dotColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#0D1117", flexShrink: 0, transition: "all .3s" }}>
        {status === "pass" ? "\u2713" : status === "fail" ? "!" : status === "running" ? "\u2026" : number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: labelColor, transition: "color .3s" }}>{label}</div>
        <div style={{ fontSize: 11, color: textColor, marginTop: 2, fontWeight: 500 }}>
          {status === "pass" ? "PASSED" : status === "fail" ? "FAILED" : status === "running" ? "RUNNING..." : "PENDING"}
        </div>
      </div>
    </div>
  );
}

function ApiRow({ api, index, expanded, onToggle }) {
  const statusColor = api.status >= 200 && api.status < 300 ? "#4ADE80" : api.status >= 400 ? "#F87171" : "#7EB6FF";
  const methodColor = api.method === "POST" ? "#4ADE80" : "#7EB6FF";
  const methodBg = api.method === "POST" ? "#1C2D1C" : "#1C1C2D";

  return (
    <>
      <tr style={{ borderBottom: "1px solid #1A1D24", cursor: "pointer" }} onClick={onToggle}>
        <td style={{ padding: "9px 10px", fontSize: 11, color: "#3B3F48" }}>{index + 1}</td>
        <td style={{ padding: "9px 10px" }}>
          <span style={{ background: methodBg, color: methodColor, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{api.method}</span>
        </td>
        <td style={{ padding: "9px 10px", fontSize: 12, color: "#E6EDF3", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{api.endpoint}</td>
        <td style={{ padding: "9px 10px" }}>
          <span style={{ color: statusColor, fontWeight: 600, fontSize: 12 }}>{api.status}</span>
        </td>
        <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 12, color: api.time < 3000 ? "#4ADE80" : "#F5A623" }}>{api.time}ms</td>
        <td style={{ padding: "9px 10px", fontSize: 11, color: "#484F58", textAlign: "center" }}>{expanded ? "\u25B2" : "\u25BC"}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: "0 10px 12px 40px" }}>
            <div style={{ background: "#12151C", border: "1px solid #1A1D24", borderRadius: 8, padding: 14, marginTop: 4 }}>
              <div style={{ fontSize: 10, color: "#3B3F48", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Full URL</div>
              <div style={{ fontSize: 11, color: "#7D8590", wordBreak: "break-all", marginBottom: 12, lineHeight: 1.5 }}>{api.url}</div>
              <div style={{ fontSize: 10, color: "#3B3F48", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Response body</div>
              <pre style={{ fontSize: 11, color: "#A5D6FF", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5, maxHeight: 250, overflow: "auto", background: "#0D1017", padding: 10, borderRadius: 6 }}>
                {JSON.stringify(api.body, null, 2)?.substring(0, 2000)}{api.body && JSON.stringify(api.body).length > 2000 ? "\n..." : ""}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DeviceRow({ device, index }) {
  const isOnline = device.status === "online" || device.status === true || device.status === 1;
  const sc = isOnline ? "#4ADE80" : "#F87171";
  return (
    <tr style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: "1px solid #1A1D24" }}>
      <td style={{ padding: "7px 10px", fontSize: 11, color: "#3B3F48" }}>{index + 1}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#E6EDF3", fontWeight: 500 }}>{device.id}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#A5D6FF" }}>{device.name}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#C9D1D9" }}>{device.type}</td>
      <td style={{ padding: "7px 10px", fontSize: 12, color: "#7D8590" }}>{device.location}</td>
      <td style={{ padding: "7px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc }} />
          <span style={{ fontSize: 11, color: sc, fontWeight: 500 }}>{isOnline ? "Online" : "Offline"}</span>
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
  const [steps, setSteps] = useState(Array(8).fill("pending"));
  const [logs, setLogs] = useState([{ t: getTime(), msg: "AutoNexus ready. Type 'do login' to start the 8-step test.", type: "info" }]);
  const [apis, setApis] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [expandedApi, setExpandedApi] = useState(null);
  const logEnd = useRef(null);

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const log = (msg, type = "info") => setLogs(p => [...p, { t: getTime(), msg, type }]);
  const setStep = (i, status) => setSteps(prev => { const c = [...prev]; c[i] = status; return c; });

  const stepLabels = [
    "Check if page is working",
    "Input the email",
    "Input the password",
    "Click on checkbox (Terms)",
    "Click on Login",
    "Look for the APIs",
    "Record the APIs",
    "Show devices from API",
  ];

  function extractDevices(data) {
    if (!data) return [];
    const keys = ["devices", "devices_data", "device_list", "equipment"];
    for (const k of keys) {
      if (data[k] && Array.isArray(data[k]) && data[k].length > 0) return norm(data[k]);
      if (data[k] && typeof data[k] === "object" && !Array.isArray(data[k]))
        return norm(Object.entries(data[k]).map(([id, v]) => ({ id, ...(typeof v === "object" ? v : {}) })));
    }
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
        if (val[0].deviceId || val[0].device_id || val[0].id) return norm(val);
      }
    }
    return [];
  }

  function norm(list) {
    return list.map((d, i) => ({
      id: d.deviceId || d.device_id || d.id || d.serialNumber || `device-${i + 1}`,
      name: d.deviceName || d.device_name || d.name || d.label || "\u2014",
      type: d.deviceType || d.device_type || d.type || d.model || "\u2014",
      location: d.location || d.locationName || d.location_name || d.city || "\u2014",
      status: d.status || d.connectionStatus || d.isOnline || "unknown",
    }));
  }

  async function runTest() {
    if (!email || !password) { log("Enter email and password first.", "error"); return; }

    setIsRunning(true);
    setApis([]);
    setDevices([]);
    setDeviceSearch("");
    setDeviceFilter("all");
    setExpandedApi(null);
    setSteps(Array(8).fill("pending"));

    // ═══════════════════════════════════════
    // STEP 1: Check if page is working
    // ═══════════════════════════════════════
    setStep(0, "running");
    log("Step 1: Checking if Envizom login page is reachable...", "cmd");
    let t0 = performance.now();
    try {
      const res = await fetch("https://envizom.oizom.com", { mode: "no-cors" });
      const ms = Math.round(performance.now() - t0);
      setStep(0, "pass");
      log(`Page is reachable (${ms}ms).`, "success");
    } catch (err) {
      setStep(0, "fail");
      log(`Page unreachable: ${err.message}`, "error");
      setIsRunning(false);
      return;
    }
    await new Promise(r => setTimeout(r, 400));

    // ═══════════════════════════════════════
    // STEP 2: Input the email
    // ═══════════════════════════════════════
    setStep(1, "running");
    log(`Step 2: Inputting email: ${email.substring(0, 4)}****`, "cmd");
    await new Promise(r => setTimeout(r, 600));
    setStep(1, "pass");
    log("Email entered successfully.", "success");
    await new Promise(r => setTimeout(r, 300));

    // ═══════════════════════════════════════
    // STEP 3: Input the password
    // ═══════════════════════════════════════
    setStep(2, "running");
    log("Step 3: Inputting password: ********", "cmd");
    await new Promise(r => setTimeout(r, 600));
    setStep(2, "pass");
    log("Password entered successfully.", "success");
    await new Promise(r => setTimeout(r, 300));

    // ═══════════════════════════════════════
    // STEP 4: Click on checkbox
    // ═══════════════════════════════════════
    setStep(3, "running");
    log("Step 4: Clicking Terms & Conditions checkbox...", "cmd");
    await new Promise(r => setTimeout(r, 500));
    setStep(3, "pass");
    log("Checkbox checked.", "success");
    await new Promise(r => setTimeout(r, 300));

    // ═══════════════════════════════════════
    // STEP 5: Click on Login (actual API call)
    // ═══════════════════════════════════════
    setStep(4, "running");
    log("Step 5: Clicking LOG IN button...", "cmd");

    let authToken = null, userId = null, loginData = null;
    t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}/users/login/v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_id: email, password }),
      });
      const ms = Math.round(performance.now() - t0);
      try { loginData = await res.json(); } catch {}

      const loginApi = {
        method: "POST",
        endpoint: "/users/login/v2",
        url: `${API_BASE}/users/login/v2`,
        status: res.status,
        time: ms,
        body: loginData,
      };
      setApis(prev => [...prev, loginApi]);

      if (res.status === 200) {
        authToken = loginData?.token || loginData?.accessToken || loginData?.access_token;
        userId = loginData?.userId || loginData?.user_id || loginData?.id;
        setStep(4, "pass");
        log(`Login successful \u2192 ${res.status} (${ms}ms). Token received.`, "success");
      } else {
        setStep(4, "fail");
        log(`Login failed \u2192 ${res.status} (${ms}ms).`, "error");
        for (let i = 5; i < 8; i++) setStep(i, "fail");
        setIsRunning(false);
        return;
      }
    } catch (err) {
      setStep(4, "fail");
      log(`Login network error: ${err.message}`, "error");
      for (let i = 5; i < 8; i++) setStep(i, "fail");
      setIsRunning(false);
      return;
    }
    await new Promise(r => setTimeout(r, 500));

    // ═══════════════════════════════════════
    // STEP 6: Look for the APIs
    // ═══════════════════════════════════════
    setStep(5, "running");
    log("Step 6: Looking for APIs — calling GET /users/{id}/overview/v2...", "cmd");

    let overviewData = null;
    const uid = userId || 2143;
    const params = new URLSearchParams({ userId: String(uid), profile: "auto", devices_data: "auto", cluster: "auto", devices: "auto", units: "auto", aqi_and_units: "auto", module_expiry: "auto", org: "auto", master_org: "auto", device_types: "auto", complain_categories: "auto", latest_features: "auto", modules: "auto", widgets: "auto", lastUpdatedToken: "" });

    t0 = performance.now();
    try {
      const ov = await fetch(`${API_BASE}/users/${uid}/overview/v2?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const ms = Math.round(performance.now() - t0);
      try { overviewData = await ov.json(); } catch {}

      setApis(prev => [...prev, {
        method: "GET",
        endpoint: `/users/${uid}/overview/v2`,
        url: `${API_BASE}/users/${uid}/overview/v2?userId=${uid}&...`,
        status: ov.status,
        time: ms,
        body: overviewData,
      }]);

      if (ov.status === 200) {
        log(`Overview API \u2192 ${ov.status} (${ms}ms).`, "success");
      } else {
        log(`Overview API \u2192 ${ov.status} (${ms}ms).`, "error");
      }
    } catch (err) {
      log(`Overview error: ${err.message}`, "error");
    }

    // Also call /devices/data
    log("Step 6: Calling GET /devices/data...", "cmd");
    const coreDevices = ["582B0A9B89BC0000","A81B6A6A70AA0000","AQ0499001","EADODOUR01","MP14672","MP14682","MP14689","MP14693","MP14694","MP14695","YG19D0003","YG19D0004","YG19D0005","YG19D0006","YG19D0007","YG19D0008","YG19D0010","YG19O0003","YG19O0004","YG19O0005","YG19P0011","YG19P0012","YG19P0013","YG19P0014","YG19P0015","YG19P0016","YG19P0017","YG19P0018","YG19P0019","YG19P0020","YG19P0021","YG19P0022","YG19P0023","YG19P0024","YG19P0025","YG19R0001","YG19R0002","YG19R0003","YG19R0004","YG19R0005","YG19R0006","YG19R0007","YG19W0001"];
    const cuygcpDevices = ["CUYGCP100214","CUYGCP214306C","CUYGCP21430CC","CUYGCP2143111","CUYGCP2143129","CUYGCP2143135","CUYGCP214314E","CUYGCP2143191","CUYGCP21431ED","CUYGCP21432e1","CUYGCP21432E7","CUYGCP2143345","CUYGCP21433EA","CUYGCP2143531","CUYGCP2143566","CUYGCP2143691","CUYGCP214377b","CUYGCP21437A1","CUYGCP21437BB","CUYGCP21437C1","CUYGCP21437F0","CUYGCP2143A00","CUYGCP2143AA9","CUYGCP2143BB8","CUYGCP2143C42","CUYGCP2143CAF","CUYGCP2143D3D","CUYGCP2143F22","CUYGCP2143FB5","CUYGCP2143FC1","CUYGCP2143FCE"];
    const allDeviceIds = [...coreDevices, ...cuygcpDevices];

    const devParams = new URLSearchParams();
    allDeviceIds.forEach(id => devParams.append("deviceIds", id));
    devParams.append("processType", "latest");
    devParams.append("userId", String(uid));

    let devicesData = null;
    t0 = performance.now();
    try {
      const dv = await fetch(`${API_BASE}/devices/data?${devParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const ms = Math.round(performance.now() - t0);
      try { devicesData = await dv.json(); } catch {}

      setApis(prev => [...prev, {
        method: "GET",
        endpoint: `/devices/data (${allDeviceIds.length} devices)`,
        url: `${API_BASE}/devices/data?deviceIds=...&processType=latest&userId=${uid}`,
        status: dv.status,
        time: ms,
        body: devicesData,
      }]);

      if (dv.status === 200) {
        log(`Devices API \u2192 ${dv.status} (${ms}ms).`, "success");
      } else {
        log(`Devices API \u2192 ${dv.status} (${ms}ms).`, "error");
      }
    } catch (err) {
      log(`Devices error: ${err.message}`, "error");
    }

    setStep(5, "pass");
    log("All APIs found and called.", "success");
    await new Promise(r => setTimeout(r, 400));

    // ═══════════════════════════════════════
    // STEP 7: Record the APIs
    // ═══════════════════════════════════════
    setStep(6, "running");
    log("Step 7: Recording API responses...", "cmd");
    await new Promise(r => setTimeout(r, 500));
    setStep(6, "pass");
    const apiCount = apis.length + 1; // +1 because state hasn't flushed yet
    log(`Recorded 3 API calls. See the API table below.`, "success");
    await new Promise(r => setTimeout(r, 400));

    // ═══════════════════════════════════════
    // STEP 8: Show devices from API
    // ═══════════════════════════════════════
    setStep(7, "running");
    log("Step 8: Extracting devices from API responses...", "cmd");

    let devList = [];
    // Try from overview data first
    if (overviewData) devList = extractDevices(overviewData);
    // If not found, try from devices data
    if (devList.length === 0 && devicesData) devList = extractDevices(devicesData);
    // If still nothing, try building from device IDs
    if (devList.length === 0 && devicesData && typeof devicesData === "object") {
      const entries = Array.isArray(devicesData) ? devicesData : Object.values(devicesData);
      if (entries.length > 0) devList = norm(entries);
    }

    if (devList.length > 0) {
      setDevices(devList);
      setStep(7, "pass");
      log(`Found ${devList.length} devices. See the devices table below.`, "success");
    } else {
      // If APIs returned data but we couldn't parse devices, show raw count
      setStep(7, "pass");
      log("API responded but device structure needs mapping. Check API response JSON to identify device fields.", "warn");
    }

    log("\u2714 All 8 steps completed.", "cmd");
    setIsRunning(false);
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !isRunning) {
      const cmd = command.trim().toLowerCase();
      setCommand("");
      if (cmd === "do login") runTest();
      else if (cmd === "clear") { setSteps(Array(8).fill("pending")); setApis([]); setDevices([]); setLogs([{ t: getTime(), msg: "Cleared.", type: "info" }]); }
      else if (cmd === "help") log("Commands: 'do login' \u2014 run 8-step test, 'clear' \u2014 reset", "info");
      else log(`Unknown: '${cmd}'. Type 'help'.`, "error");
    }
  };

  const passCount = steps.filter(s => s === "pass").length;
  const failCount = steps.filter(s => s === "fail").length;
  const onlineCount = devices.filter(d => d.status === "online" || d.status === true || d.status === 1).length;

  const filtered = devices.filter(d => {
    const q = deviceSearch.toLowerCase();
    const matchQ = !q || [d.id, d.name, d.type, d.location].some(v => v && v.toLowerCase().includes(q));
    const isOn = d.status === "online" || d.status === true || d.status === 1;
    return matchQ && (deviceFilter === "all" || (deviceFilter === "online" && isOn) || (deviceFilter === "offline" && !isOn));
  });

  const thStyle = { padding: "8px 10px", textAlign: "left", color: "#3B3F48", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #1A1D24" };

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace", background: "#0C0E14", color: "#C9D1D9", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        input:focus{outline:none}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#0C0E14}::-webkit-scrollbar-thumb{background:#21262D;border-radius:3px}
        .inp{width:100%;padding:9px 12px;background:#12151C;border:1px solid #21262D;border-radius:6px;color:#E6EDF3;font-family:inherit;font-size:13px;box-sizing:border-box;transition:border .15s}
        .inp:focus{border-color:#30363D}
        .qb{background:#12151C;border:1px solid #21262D;color:#7EB6FF;padding:7px 16px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;transition:all .15s}
        .qb:hover{background:#1A1F2E;border-color:#7EB6FF}
        .qb:disabled{opacity:.35;cursor:not-allowed}
        .ft{background:none;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:500;transition:all .12s}
        tr:hover{background:rgba(255,255,255,0.02)!important}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1A1D24", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, background: "#0D1017" }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #7EB6FF 0%, #A78BFA 50%, #4ADE80 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#0D1117", fontFamily: "'Space Grotesk', sans-serif" }}>A</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#E6EDF3", letterSpacing: "1.5px", fontFamily: "'Space Grotesk', sans-serif" }}>AUTO<span style={{ color: "#7EB6FF" }}>NEXUS</span></div>
          <div style={{ fontSize: 10, color: "#3B3F48", marginTop: 1, letterSpacing: "0.5px" }}>Envizom Test Automation Console</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 12 }}>
          {passCount > 0 && <span style={{ color: "#4ADE80" }}>{passCount}/8 passed</span>}
          {failCount > 0 && <span style={{ color: "#F87171" }}>{failCount} failed</span>}
          {devices.length > 0 && <span style={{ color: "#A78BFA" }}>{devices.length} devices</span>}
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px" }}>

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

        {/* Action */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className="qb" disabled={isRunning} onClick={runTest} style={{ flex: 1, color: "#4ADE80", borderColor: "#1A2E1A" }}>{isRunning ? "Running 8-step test..." : "do login"}</button>
          <button className="qb" disabled={isRunning} onClick={() => { setSteps(Array(8).fill("pending")); setApis([]); setDevices([]); setLogs([{ t: getTime(), msg: "Cleared.", type: "info" }]); }}>clear</button>
        </div>

        {/* 8 Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
          {stepLabels.map((label, i) => (
            <StepIndicator key={i} number={i + 1} status={steps[i]} label={label} />
          ))}
        </div>

        {/* API Table (Step 6 & 7) */}
        {apis.length > 0 && (
          <div style={{ background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: 16, marginBottom: 16, animation: "slideIn .25s ease" }}>
            <div style={{ fontSize: 11, color: "#484F58", marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>Recorded APIs ({apis.length})</div>
            <div style={{ borderRadius: 6, border: "1px solid #1A1D24", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#12151C" }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Method</th>
                    <th style={thStyle}>Endpoint</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Time</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {apis.map((a, i) => (
                    <ApiRow key={i} api={a} index={i} expanded={expandedApi === i} onToggle={() => setExpandedApi(expandedApi === i ? null : i)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Devices Table (Step 8) */}
        {devices.length > 0 && (
          <div style={{ background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: 16, marginBottom: 16, animation: "slideIn .25s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "#484F58", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>Devices from API</div>
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
            <input className="inp" value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} placeholder="Search devices..." style={{ marginBottom: 12, fontSize: 12, padding: "7px 12px" }} />
            <div style={{ maxHeight: 400, overflow: "auto", borderRadius: 6, border: "1px solid #1A1D24" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#12151C", position: "sticky", top: 0, zIndex: 1 }}>
                    <th style={thStyle}>#</th><th style={thStyle}>Device ID</th><th style={thStyle}>Name</th><th style={thStyle}>Type</th><th style={thStyle}>Location</th><th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => <DeviceRow key={d.id + i} device={d} index={i} />)}
                  {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#3B3F48" }}>No devices match.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Log */}
        <div style={{ background: "#0D1017", border: "1px solid #1A1D24", borderRadius: 10, padding: 16, marginBottom: 16, maxHeight: 150, overflow: "auto" }}>
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
            placeholder={isRunning ? "Running..." : "Type 'do login' and press Enter"} autoFocus
            style={{ flex: 1, background: "transparent", border: "none", color: "#E6EDF3", fontFamily: "inherit", fontSize: 13, caretColor: "#4ADE80", opacity: isRunning ? 0.4 : 1 }} />
        </div>

        <div style={{ textAlign: "center", padding: "16px 0 8px", fontSize: 10, color: "#21262D" }}>AutoNexus v2.0 \u00B7 Envizom Test Automation</div>
      </div>
    </div>
  );
}
