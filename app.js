const USERS_KEY = "etf_users_v1";
const SESSION_KEY = "etf_session_v1";
const PLAN_KEY = "etf_plan_v1";
const ADMIN_USER = "hunglin";
const ADMIN_HASH = "8cd3d9980233af8b35c02d99cbef78fc03a16e304e9389dd1eb79c1bc5572776";
const LOT = window.ETF_DATA.lotSize;

const $ = (id) => document.getElementById(id);
let session = null;

function money(n) {
  return Math.round(n).toLocaleString("zh-TW");
}
function pct(n) {
  return (n * 100).toFixed(2) + "%";
}
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  const users = raw ? JSON.parse(raw) : [];
  if (!users.some((u) => u.username === ADMIN_USER)) {
    users.unshift({ username: ADMIN_USER, name: "管理者", passHash: ADMIN_HASH, role: "admin" });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function etfMap() {
  return Object.fromEntries(window.ETF_DATA.list.map((e) => [e.code, e]));
}
function quote(etf, source) {
  if (source === "market" && etf.marketPrice && etf.marketYield) {
    const price = etf.marketPrice;
    const yieldRate = etf.marketYield;
    const div = (price * yieldRate) / etf.times;
    return { price, div, yieldRate, label: "近12月" };
  }
  const price = etf.price;
  const div = etf.div;
  const yieldRate = price > 0 ? (div * etf.times) / price : 0;
  return { price, div, yieldRate, label: "最新配息年化" };
}
function defaultRows() {
  return [
    { code: "0056", weight: 40, lots: 0 },
    { code: "00878", weight: 40, lots: 0 },
    { code: "00919", weight: 20, lots: 0 }
  ];
}
function loadPlan(user) {
  const all = JSON.parse(localStorage.getItem(PLAN_KEY) || "{}");
  return all[user] || { salary: 60000, rate: 100, source: "sheet", rows: defaultRows() };
}
function savePlan(user, plan) {
  const all = JSON.parse(localStorage.getItem(PLAN_KEY) || "{}");
  all[user] = plan;
  localStorage.setItem(PLAN_KEY, JSON.stringify(all));
}

function readForm() {
  const rows = [...document.querySelectorAll("#rows tr")].map((tr) => ({
    code: tr.querySelector(".code").value,
    weight: Number(tr.querySelector(".weight").value) || 0,
    lots: Math.max(0, Number(tr.querySelector(".lots").value) || 0)
  }));
  return {
    salary: Math.max(0, Number($("salary").value) || 0),
    rate: Math.max(0, Number($("rate").value) || 0),
    source: $("source").value,
    rows
  };
}

function calculate(plan) {
  const map = etfMap();
  const lines = plan.rows.filter((r) => map[r.code]).map((r) => {
    const etf = map[r.code];
    const q = quote(etf, plan.source);
    const currentCost = r.lots * LOT * q.price;
    const currentAnnual = r.lots * LOT * q.div * etf.times;
    return { ...r, etf, ...q, currentCost, currentAnnual };
  });
  const weight = lines.reduce((s, r) => s + r.weight, 0);
  const currentCost = lines.reduce((s, r) => s + r.currentCost, 0);
  const currentAnnual = lines.reduce((s, r) => s + r.currentAnnual, 0);
  const currentMonthly = currentAnnual / 12;
  const targetMonthly = plan.salary * (plan.rate / 100);
  const targetAnnual = targetMonthly * 12;
  const currentRate = plan.salary > 0 ? currentMonthly / plan.salary : 0;
  const weightedYield = weight > 0
    ? lines.reduce((s, r) => s + (r.weight / 100) * r.yieldRate, 0) / (weight / 100) * (weight / 100)
    : 0;
  const ready = Math.abs(weight - 100) < 0.01 && lines.length > 0 && weightedYield > 0;
  let theoretical = 0;
  if (ready) {
    theoretical = targetAnnual / lines.reduce((s, r) => s + (r.weight / 100) * r.yieldRate, 0);
  }
  const detailed = lines.map((r) => {
    let targetLots = r.lots;
    if (ready) {
      const slice = theoretical * (r.weight / 100);
      targetLots = Math.ceil(slice / (r.price * LOT) - 1e-9);
    }
    const extraLots = Math.max(0, targetLots - r.lots);
    const extraCost = extraLots * LOT * r.price;
    const futureLots = r.lots + extraLots;
    const futureAnnual = futureLots * LOT * r.div * r.etf.times;
    return { ...r, targetLots, extraLots, extraCost, futureLots, futureAnnual };
  });
  const extraCost = detailed.reduce((s, r) => s + r.extraCost, 0);
  const futureAnnual = detailed.reduce((s, r) => s + r.futureAnnual, 0);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const amount = detailed.reduce((s, r) => {
      return r.etf.months.includes(month) ? s + r.futureLots * LOT * r.div : s;
    }, 0);
    return { month, amount };
  });
  return {
    lines: detailed, weight, ready, currentCost, currentAnnual, currentMonthly,
    targetMonthly, targetAnnual, currentRate, theoretical, extraCost, futureAnnual, months
  };
}

function renderRows(rows) {
  const options = window.ETF_DATA.list.map((e) => `<option value="${e.code}">${e.code} ${e.name}</option>`).join("");
  $("rows").innerHTML = rows.map((r) => `
    <tr>
      <td><select class="code">${options}</select></td>
      <td><input class="weight" type="number" min="0" max="100" step="1" value="${r.weight}"></td>
      <td><input class="lots" type="number" min="0" step="1" value="${r.lots}"></td>
      <td class="px"></td>
      <td class="yd"></td>
      <td><button type="button" class="linkish remove">移除</button></td>
    </tr>
  `).join("");
  [...$("rows").querySelectorAll("tr")].forEach((tr, i) => {
    tr.querySelector(".code").value = rows[i].code;
  });
}

function render() {
  const plan = readForm();
  const result = calculate(plan);
  const map = etfMap();
  [...$("rows").querySelectorAll("tr")].forEach((tr) => {
    const etf = map[tr.querySelector(".code").value];
    const q = quote(etf, plan.source);
    tr.querySelector(".px").textContent = q.price.toFixed(2);
    tr.querySelector(".yd").textContent = pct(q.yieldRate);
  });
  $("weight-note").textContent = result.ready ? "" : `配置合計 ${result.weight}% ，要到 100% 才估算達標本金。目前持股的年配息仍會計算。`;
  $("target-line").textContent = `目標每月配息 ${money(result.targetMonthly)} 元（所得 ${money(plan.salary)} × ${plan.rate}%），全年 ${money(result.targetAnnual)} 元。`;
  const gapText = result.ready
    ? (result.extraCost <= 0 ? "已達成" : money(result.extraCost) + " 元")
    : "待配置 100%";
  $("cards").innerHTML = `
    <article class="card"><span>目前預估年配息</span><b>${money(result.currentAnnual)}</b></article>
    <article class="card"><span>目前替代率</span><b>${plan.salary > 0 ? pct(result.currentRate) : "—"}</b></article>
    <article class="card"><span>達標後預估年配息</span><b>${result.ready ? money(result.futureAnnual) : "—"}</b></article>
    <article class="card need"><span>還要再投入</span><b>${gapText}</b></article>
  `;
  $("plan").innerHTML = result.lines.map((r) => `
    <tr>
      <td>${r.code} ${r.etf.name}</td>
      <td>${r.lots}</td>
      <td>${result.ready ? r.targetLots : "—"}</td>
      <td>${result.ready ? r.extraLots : "—"}</td>
      <td>${result.ready ? money(r.extraCost) : "—"}</td>
      <td>${money(result.ready ? r.futureAnnual : r.currentAnnual)}</td>
    </tr>
  `).join("");
  const max = Math.max(...result.months.map((m) => m.amount), 1);
  $("months").innerHTML = result.months.map((m) => `
    <div class="bar">
      <strong>${m.amount ? money(m.amount) : ""}</strong>
      <i style="height:${Math.max(4, (m.amount / max) * 130)}px"></i>
      <em>${m.month}月</em>
    </div>
  `).join("");
  if (session.role === "admin") {
    $("admin").hidden = false;
    $("members").innerHTML = loadUsers().map((u) => `<tr><td>${u.username}</td><td>${u.name}</td><td>${u.role === "admin" ? "管理者" : "會員"}</td></tr>`).join("");
  }
}

function bindRows() {
  $("rows").onclick = (e) => {
    if (!e.target.classList.contains("remove")) return;
    if ($("rows").children.length <= 1) return;
    e.target.closest("tr").remove();
    render();
  };
  $("rows").oninput = render;
  $("rows").onchange = render;
}

function showApp() {
  $("auth").hidden = true;
  $("app").hidden = false;
  $("who").textContent = `${session.name}（${session.username}）`;
  const plan = loadPlan(session.username);
  $("salary").value = plan.salary;
  $("rate").value = plan.rate;
  $("source").value = plan.source;
  renderRows(plan.rows);
  bindRows();
  render();
}

function showAuth() {
  session = null;
  sessionStorage.removeItem(SESSION_KEY);
  $("app").hidden = true;
  $("auth").hidden = false;
}

$("tab-login").onclick = () => {
  $("tab-login").classList.add("on");
  $("tab-register").classList.remove("on");
  $("login-form").hidden = false;
  $("register-form").hidden = true;
};
$("tab-register").onclick = () => {
  $("tab-register").classList.add("on");
  $("tab-login").classList.remove("on");
  $("register-form").hidden = false;
  $("login-form").hidden = true;
};

$("login-form").onsubmit = async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const username = String(data.get("username")).trim();
  const hash = await sha256(String(data.get("password")));
  const user = loadUsers().find((u) => u.username === username && u.passHash === hash);
  $("login-error").textContent = user ? "" : "帳號或密碼不正確";
  if (!user) return;
  session = { username: user.username, name: user.name, role: user.role };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  showApp();
};

$("register-form").onsubmit = async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const username = String(data.get("username")).trim();
  const name = String(data.get("name")).trim();
  const password = String(data.get("password"));
  const password2 = String(data.get("password2"));
  const users = loadUsers();
  if (!/^[\w\u4e00-\u9fff.-]{3,20}$/.test(username)) {
    $("register-error").textContent = "帳號請用 3 到 20 個字，可用中文、英文或數字";
    return;
  }
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    $("register-error").textContent = "這個帳號已經有人使用";
    return;
  }
  if (password.length < 6 || password !== password2) {
    $("register-error").textContent = "密碼至少 6 碼，且兩次要相同";
    return;
  }
  const passHash = await sha256(password);
  users.push({ username, name, passHash, role: "member" });
  saveUsers(users);
  session = { username, name, role: "member" };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  showApp();
};

$("logout").onclick = showAuth;
["salary", "rate", "source"].forEach((id) => { $(id).oninput = render; });
$("add-row").onclick = () => {
  if ($("rows").children.length >= 8) return;
  const plan = readForm();
  plan.rows.push({ code: "00929", weight: 0, lots: 0 });
  renderRows(plan.rows);
  bindRows();
  render();
};
$("save").onclick = () => {
  savePlan(session.username, readForm());
  $("save").textContent = "已儲存";
  setTimeout(() => { $("save").textContent = "儲存這個組合"; }, 1200);
};
$("reset").onclick = () => {
  const plan = { salary: 60000, rate: 100, source: "sheet", rows: defaultRows() };
  $("salary").value = plan.salary;
  $("rate").value = plan.rate;
  $("source").value = plan.source;
  renderRows(plan.rows);
  bindRows();
  render();
};

loadUsers();
const saved = sessionStorage.getItem(SESSION_KEY);
if (saved) {
  session = JSON.parse(saved);
  showApp();
}
