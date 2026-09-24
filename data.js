/* ETF 資料
 * sheet：資料夾試算表「高息ETF資料庫」，市價更新日 2026-09-23。
 * 簡易年化殖利率 = 最新每單位配息 × 年配息次數 ÷ 市價。
 * market：2026-09-24 網路公開行情（etf-tool.tw 近 12 個月殖利率）。沒有行情的檔別沿用試算表。
 * 1 張 = 1,000 股。
 */
window.ETF_DATA = {
  asOf: "2026-09-23",
  marketAsOf: "2026-09-24",
  lotSize: 1000,
  list: [
    { code: "0050", name: "元大台灣50", freq: "半年配", times: 2, months: [1, 7], div: 0.6, exDate: "2026-07-21", price: 112.4, marketPrice: 112.4, marketYield: 0.01423 },
    { code: "00878", name: "國泰永續高股息", freq: "季配", times: 4, months: [2, 5, 8, 11], div: 1.01, exDate: "2026-08-18", price: 35.09, marketPrice: 34.07, marketYield: 0.073085 },
    { code: "00900", name: "富邦特選高股息30", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.075, exDate: "2026-09-16", price: 19.58, marketPrice: 19.54, marketYield: 0.049898 },
    { code: "00907", name: "永豐優息存股", freq: "雙月配", times: 6, months: [2, 4, 6, 8, 10, 12], div: 0.24, exDate: "2026-08-25", price: 17.83 },
    { code: "00918", name: "大華優利高填息30", freq: "季配", times: 4, months: [3, 6, 9, 12], div: 1.75, exDate: "2026-09-18", price: 34.03 },
    { code: "00919", name: "群益台灣精選高息", freq: "季配", times: 4, months: [3, 6, 9, 12], div: 1.1, exDate: "2026-09-16", price: 32.06, marketPrice: 32.71, marketYield: 0.087435 },
    { code: "00929", name: "復華台灣科技優息", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.38, exDate: "2026-09-17", price: 29.14, marketPrice: 28.89, marketYield: 0.066805 },
    { code: "00930", name: "永豐ESG低碳高息", freq: "雙月配", times: 6, months: [1, 3, 5, 7, 9, 11], div: 0.815, exDate: "2026-09-23", price: 23.96 },
    { code: "00932", name: "兆豐永續高息等權", freq: "季配", times: 4, months: [2, 5, 8, 11], div: 0.23, exDate: "2026-08-18", price: 17.48 },
    { code: "00934", name: "中信成長高股息", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.33, exDate: "2026-09-16", price: 29.91 },
    { code: "00936", name: "台新永續高息中小", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.16, exDate: "2026-09-15", price: 21.42 },
    { code: "00939", name: "統一台灣高息動能", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.125, exDate: "2026-10-05", price: 24.23 },
    { code: "00940", name: "元大台灣價值高息", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.055, exDate: "2026-10-07", price: 13.12 },
    { code: "00943", name: "兆豐電子高息等權", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.25, exDate: "2026-09-16", price: 20.95 },
    { code: "00944", name: "野村趨勢動能高息", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.109, exDate: "2026-09-16", price: 22 },
    { code: "00946", name: "群益科技高息成長", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.058, exDate: "2026-10-07", price: 15.32 },
    { code: "00961", name: "FT臺灣永續高息", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.19, exDate: "2026-09-16", price: 13.21 },
    { code: "00962", name: "台新AI優息動能", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.25, exDate: "2026-09-15", price: 15.01 },
    { code: "00701", name: "國泰股利精選30", freq: "半年配", times: 2, months: [1, 8], div: 1.6, exDate: "2026-08-18", price: 41.97 },
    { code: "00713", name: "元大台灣高息低波", freq: "季配", times: 4, months: [3, 6, 9, 12], div: 1.25, exDate: "2026-09-21", price: 63.65, marketPrice: 63.65, marketYield: 0.052474 },
    { code: "00730", name: "富邦臺灣優質高息", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.11, exDate: "2026-09-16", price: 29.05 },
    { code: "00731", name: "復華富時高息低波", freq: "季配", times: 4, months: [3, 5, 8, 11], div: 1.458, exDate: "2026-08-19", price: 98.8 },
    { code: "00915", name: "凱基優選高股息30", freq: "季配", times: 4, months: [3, 6, 9, 12], div: 0.6, exDate: "2026-09-16", price: 33.2 },
    { code: "00702", name: "國泰標普低波高息", freq: "半年配", times: 2, months: [1, 7], div: 0.68, exDate: "2026-07-16", price: 23.62 },
    { code: "00771", name: "元大US高息特別股", freq: "季配", times: 4, months: [2, 5, 8, 11], div: 0.21, exDate: "2026-08-21", price: 15.07 },
    { code: "00882", name: "中信中國高股息", freq: "半年配", times: 2, months: [1, 7], div: 0.55, exDate: "2026-07-16", price: 14.78 },
    { code: "00956", name: "中信日經高股息", freq: "季配", times: 4, months: [1, 4, 7, 10], div: 0.3, exDate: "2026-07-16", price: 13.73 },
    { code: "00963", name: "中信全球高股息", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.1, exDate: "2026-09-16", price: 12.74 },
    { code: "00964", name: "中信亞太高股息", freq: "月配", times: 12, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], div: 0.2, exDate: "2026-09-16", price: 14.75 },
    { code: "00972", name: "野村日本動能高息", freq: "季配", times: 4, months: [3, 6, 9, 12], div: 0.22, exDate: "2026-09-16", price: 21.98 }
  ]
};
