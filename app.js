const PLAN_KEY = "etf_plan_light_v2";
const LOT = window.ETF_DATA.lotSize;
const $ = (id) => document.getElementById(id);

function money(n) {
  return Math.round(n).toLocaleString("zh-TW");
}
function pct(n) {
  return (n * 100).toFixed(2) + "%";
}
function etfMap() {
  return Object.fromEntries(window.ETF_DATA.list.map((e) => [e.code, e]));
}
function quote(etf, source) {
  if (source === "market" && etf.marketPrice && etf.marketYield) {
    const price = etf.marketPrice;
    const yieldRate = etf.marketYield;
    return { price, div: (price * yieldRate) / etf.times, yieldRate };
  }
  const price = etf.price;
  const div = etf.div;
  return { price, div, yieldRate: price > 0 ? (div * etf.times) / price : 0 };
}
function defaultPlan() {
  return {
    salary: 60000,
    rate: 100,
    source: "sheet",
    rows: [
      { code: "0050", weight: 40, lots: 0 },
      { code: "0056", weight: 30, lots: 0 },
      { code: "00878", weight: 30, lots: 0 }
    ]
  };
}
function loadPlan() {
  try {
    return JSON.parse(localStorage.getItem(PLAN_KEY)) || defaultPlan();
  } catch {
    return defaultPlan();
  }
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
    return {
      ...r,
      etf,
      ...q,
      currentCost: r.lots * LOT * q.price,
      currentAnnual: r.lots * LOT * q.div * etf.times
    };
  });
  const weight = lines.reduce((s, r) => s + r.weight, 0);
  const yieldSum = lines.reduce((s, r) => s + (r.weight / 100) * r.yieldRate, 0);
  const ready = Math.abs(weight - 100) < 0.01 && lines.length > 0 && yieldSum > 0;
  const currentCost = lines.reduce((s, r) => s + r.currentCost, 0);
  const currentAnnual = lines.reduce((s, r) => s + r.currentAnnual, 0);
  const currentMonthly = currentAnnual / 12;
  const targetMonthly = plan.salary * (plan.rate / 100);
  const targetAnnual = targetMonthly * 12;
  const theoretical = ready ? targetAnnual / yieldSum : 0;
  const detailed = lines.map((r) => {
    const targetLots = ready ? Math.ceil(theoretical * (r.weight / 100) / (r.price * LOT) - 1e-9) : r.lots;
    const extraLots = Math.max(0, targetLots - r.lots);
    return {
      ...r,
      targetLots,
      extraLots,
      extraCost: extraLots * LOT * r.price,
      futureLots: r.lots + extraLots,
      futureAnnual: (r.lots + extraLots) * LOT * r.div * r.etf.times
    };
  });
  const need = ready ? currentCost + detailed.reduce((s, r) => s + r.extraCost, 0) : 0;
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const amount = detailed.reduce((s, r) => (
      r.etf.months.includes(month) ? s + r.futureLots * LOT * r.div : s
    ), 0);
    return { month, amount };
  });
  return {
    lines: detailed, weight, ready, currentCost, currentAnnual, currentMonthly,
    targetMonthly, targetAnnual, need, months
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
    const q = quote(map[tr.querySelector(".code").value], plan.source);
    tr.querySelector(".px").textContent = q.price.toFixed(2);
    tr.querySelector(".yd").textContent = pct(q.yieldRate);
  });
  $("weight-note").textContent = result.ready ? "" : `配置合計 ${result.weight}% ，要到 100% 才估算要投資多少。目前持股的配息仍會計算。`;
  $("target-line").textContent = `目標收益是每月 ${money(result.targetMonthly)} 元（所得 ${money(plan.salary)} × ${plan.rate}%），全年 ${money(result.targetAnnual)} 元。`;
  const rate = result.ready && result.need > 0 ? result.currentCost / result.need : 0;
  $("cards").innerHTML = `
    <article class="card need"><span>要投資多少</span><b>${result.ready ? money(result.need) : "—"}</b></article>
    <article class="card"><span>目前已投資多少</span><b>${money(result.currentCost)}</b></article>
    <article class="card"><span>目前每月可以收益多少</span><b>${money(result.currentMonthly)}</b></article>
    <article class="card"><span>目標收益（每月）</span><b>${money(result.targetMonthly)}</b></article>
  `;
  $("plain").textContent = result.ready
    ? `達成率 ${pct(rate)}。已投入的錢占達標本金的比例。還要再投入 ${money(Math.max(0, result.need - result.currentCost))} 元，每月配息才會接近目標。平均每月收益是一年配息除以 12，不是每個月都入帳同一筆。`
    : "把配置比例加到 100% 後，就會算出要投資多少。";
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
}
function bindRows() {
  $("rows").onclick = (e) => {
    if (!e.target.classList.contains("remove") || $("rows").children.length <= 1) return;
    e.target.closest("tr").remove();
    render();
  };
  $("rows").oninput = render;
  $("rows").onchange = render;
}
function applyPlan(plan) {
  $("salary").value = plan.salary;
  $("rate").value = plan.rate;
  $("source").value = plan.source;
  renderRows(plan.rows);
  bindRows();
  render();
}
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
  localStorage.setItem(PLAN_KEY, JSON.stringify(readForm()));
  $("save").textContent = "已儲存";
  setTimeout(() => { $("save").textContent = "儲存這個組合"; }, 1200);
};
$("reset").onclick = () => {
  localStorage.removeItem(PLAN_KEY);
  applyPlan(defaultPlan());
};
applyPlan(loadPlan());
