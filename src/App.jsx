import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ZELLE_SENDERS = [
  "Mike Johnson", "Sarah Chen", "David Rodriguez", "Kevin Park",
  "Anthony Russo", "James Williams", "Carlos Mendez", "Tyler Brown",
  "Malik Thompson", "Danny Ortiz", "Chris Lee", "Marcus Green"
];

const FAKE_TRANSACTIONS = (() => {
  const txns = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const count = Math.random() < 0.35 ? (Math.random() < 0.3 ? 2 : 1) : 0;
    for (let c = 0; c < count; c++) {
      const sender = ZELLE_SENDERS[Math.floor(Math.random() * ZELLE_SENDERS.length)];
      txns.push({
        date: dateStr,
        amount: Math.round((Math.random() * 1200 + 150) * 100) / 100,
        sender,
        initials: sender.split(" ").map(w => w[0]).join(""),
      });
    }
  }
  return txns;
})();

const fmt = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n) => n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : fmt(n);

function groupBy(txns, mode) {
  const map = {};
  txns.forEach(({ date, amount }) => {
    const d = new Date(date + "T00:00:00");
    let key;
    if (mode === "daily") key = date;
    else if (mode === "weekly") {
      const mon = new Date(d);
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      key = mon.toISOString().split("T")[0];
    } else if (mode === "monthly") key = date.slice(0, 7);
    else key = date.slice(0, 4);
    map[key] = (map[key] || 0) + amount;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ label: k, amount: Math.round(v * 100) / 100 }));
}

function labelFor(key, mode) {
  if (mode === "daily") return new Date(key + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (mode === "weekly") return new Date(key + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (mode === "monthly") {
    const [y, m] = key.split("-");
    return new Date(+y, +m - 1).toLocaleDateString("en-US", { month: "short" });
  }
  return key;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "8px 12px" }}>
        <div style={{ color: "#666", fontSize: 10, marginBottom: 2 }}>{label}</div>
        <div style={{ color: "#00e5a0", fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>
          {fmt(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
};

const SENDER_COLORS = ["#00e5a0","#00b4d8","#f472b6","#fb923c","#a78bfa","#facc15","#34d399","#60a5fa","#f87171","#c084fc","#4ade80","#38bdf8"];
function senderColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return SENDER_COLORS[Math.abs(h) % SENDER_COLORS.length];
}

export default function App() {
  const [mode, setMode] = useState("monthly");
  const [animKey, setAnimKey] = useState(0);
  const [excluded, setExcluded] = useState(new Set());

  const activeTxns = FAKE_TRANSACTIONS.filter((_, i) => !excluded.has(i));
  const toggleExclude = (i) => setExcluded((prev) => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const allData = groupBy(activeTxns, mode);
  const sliceMap = { daily: 14, weekly: 10, monthly: 12, yearly: 5 };
  const data = allData.slice(-sliceMap[mode]).map((d) => ({ ...d, label: labelFor(d.label, mode) }));

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const today     = activeTxns.filter(t => t.date === todayStr).reduce((s, t) => s + t.amount, 0);
  const thisWeek  = activeTxns.filter(t => new Date(t.date + "T00:00:00") >= monday).reduce((s, t) => s + t.amount, 0);
  const thisMonth = activeTxns.filter(t => t.date.startsWith(ym)).reduce((s, t) => s + t.amount, 0);
  const thisYear  = activeTxns.reduce((s, t) => s + t.amount, 0);

  const recentTxns = FAKE_TRANSACTIONS.map((t, i) => ({ ...t, i })).reverse().slice(0, 12);

  useEffect(() => { setAnimKey(k => k + 1); }, [mode]);

  const modes = ["daily", "weekly", "monthly", "yearly"];
  const modeLabels = { daily: "Day", weekly: "Week", monthly: "Month", yearly: "Year" };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif", maxWidth: 430, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        .mode-pill { background: none; border: none; color: #555; padding: 7px 0; border-radius: 18px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; transition: all 0.18s; flex: 1; text-align: center; }
        .mode-pill.active { background: #00e5a0; color: #080808; font-weight: 700; border-radius: 16px; }
        .txn-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #111; transition: background 0.1s; }
        .txn-row:last-child { border-bottom: none; }
        .txn-row:active { background: #0f0f0f; }
        .x-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #1e1e1e; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; touch-action: manipulation; }
        .x-btn:active { background: #1a1a1a; transform: scale(0.92); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .chart-anim { animation: fadeUp 0.3s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "48px 16px 16px", background: "linear-gradient(180deg, #0c0c0c 0%, #080808 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.16em", color: "#00e5a0", fontFamily: "'Bebas Neue'", marginBottom: 3 }}>
              CAPITAL ONE · ZELLE
            </div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: "0.02em", color: "#fff", lineHeight: 1 }}>
              MONEY IN
            </div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#0f0f0f", border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            ⚡
          </div>
        </div>

        {/* Hero card */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 18, padding: "18px", marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>
            This Month
          </div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 40, fontWeight: 500, color: "#00e5a0", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {fmt(thisMonth)}
          </div>
          <div style={{ fontSize: 11, color: "#3a3a3a", marginTop: 6 }}>
            {activeTxns.filter(t => t.date.startsWith(ym)).length} Zelle payments
          </div>
        </div>

        {/* 4 mini stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { label: "Today", val: today },
            { label: "Week", val: thisWeek },
            { label: "Month", val: thisMonth },
            { label: "Year", val: thisYear },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 14, padding: "11px 8px" }}>
              <div style={{ fontSize: 9, color: "#3a3a3a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 13, fontWeight: 500, color: val > 0 ? "#d4d4d4" : "#2a2a2a" }}>
                {fmtShort(val)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: "10px 16px 0" }}>
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 18, padding: "14px 12px 12px" }}>
          <div style={{ display: "flex", background: "#111", borderRadius: 14, padding: "3px", marginBottom: 14, gap: 2 }}>
            {modes.map(m => (
              <button key={m} className={`mode-pill ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>
                {modeLabels[m]}
              </button>
            ))}
          </div>
          <div className="chart-anim" key={animKey} style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 2, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5a0" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#00e5a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#141414" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#2e2e2e", fontSize: 9, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#2e2e2e", fontSize: 9, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => "$" + (v >= 1000 ? (v/1000).toFixed(0)+"k" : v)} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1e1e1e", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="amount" stroke="#00e5a0" strokeWidth={2} fill="url(#g)" dot={false} activeDot={{ r: 4, fill: "#00e5a0", stroke: "#080808", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div style={{ padding: "14px 16px 40px" }}>
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px 11px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #111" }}>
            <span style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Recent Payments</span>
            {excluded.size > 0 && (
              <button onClick={() => setExcluded(new Set())} style={{ background: "none", border: "none", color: "#00e5a0", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans'", padding: 0 }}>
                Restore all ({excluded.size})
              </button>
            )}
          </div>

          {recentTxns.map(({ i, ...t }) => {
            const isExcluded = excluded.has(i);
            const color = senderColor(t.sender);
            return (
              <div key={i} className="txn-row" style={{ opacity: isExcluded ? 0.28 : 1, transition: "opacity 0.2s" }}>
                {/* Avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: color + "1a", border: `1.5px solid ${color}33`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'DM Mono'" }}>{t.initials}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, color: isExcluded ? "#3a3a3a" : "#d4d4d4",
                      fontWeight: 500, textDecoration: isExcluded ? "line-through" : "none",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {t.sender}
                    </div>
                    <div style={{ fontSize: 10, color: "#2e2e2e", marginTop: 2, fontFamily: "'DM Mono'" }}>
                      Zelle · {new Date(t.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'DM Mono'", fontSize: 15, fontWeight: 500,
                    color: isExcluded ? "#2e2e2e" : "#00e5a0",
                    textDecoration: isExcluded ? "line-through" : "none"
                  }}>
                    +{fmt(t.amount)}
                  </div>
                  <button className="x-btn" onClick={() => toggleExclude(i)}>
                    {isExcluded
                      ? <span style={{ fontSize: 13, color: "#444" }}>↩</span>
                      : <span style={{ fontSize: 18, color: "#333", lineHeight: 1 }}>×</span>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "#1a1a1a", letterSpacing: "0.08em" }}>DEMO · FAKE DATA</div>
      </div>
    </div>
  );
}
