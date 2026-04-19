import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AI_SYNC = "https://functions.poehali.dev/727882ac-0202-4bb5-9e13-fc4d1c238fb8";

type Proposal = {
  id: number;
  source: string;
  category: string;
  title: string;
  description: string;
  logic_reasoning: string;
  priority: string;
  status: string;
  owner_decision: string | null;
  owner_comment: string | null;
  tokens_required: number;
  created_at: string;
  reviewed_at: string | null;
};

type FundEntry = {
  operation_type: string;
  amount: number;
  source_description: string;
  fund_balance: number;
  created_at: string;
};

type SyncStatus = {
  status: string;
  ai_sync: { total_syncs: number; last_sync: string | null };
  proposals: { pending_review: number; approved: number };
  approvals_waiting: number;
  development_fund: { balance: number; total_collected: number; fund_percent: number };
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "#ff4444",
  critical: "#ff0000",
  normal: "#00ff87",
  low: "#6b7280",
};

const CATEGORY_LABEL: Record<string, string> = {
  incident_management: "Инциденты",
  security: "Безопасность",
  notifications: "Уведомления",
  ai_learning: "Обучение ИИ",
  general: "Общее",
};

export default function EgsuAiControl() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"status" | "proposals" | "fund" | "log">("status");
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [fund, setFund] = useState<{ fund_balance: number; fund_percent: number; history: FundEntry[] } | null>(null);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [decideId, setDecideId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [msg, setMsg] = useState("");

  const loadStatus = useCallback(async () => {
    const r = await fetch(`${AI_SYNC}/status`);
    const d = await r.json();
    setStatus(d);
  }, []);

  const loadProposals = useCallback(async () => {
    const r = await fetch(`${AI_SYNC}/proposals?status=${filterStatus}`);
    const d = await r.json();
    setProposals(d.proposals || []);
  }, [filterStatus]);

  const loadFund = useCallback(async () => {
    const r = await fetch(`${AI_SYNC}/fund`);
    const d = await r.json();
    setFund(d);
  }, []);

  const loadLog = useCallback(async () => {
    const r = await fetch(`${AI_SYNC}/sync-log`);
    const d = await r.json();
    setLogs(d.logs || []);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (tab === "proposals") loadProposals();
    if (tab === "fund") loadFund();
    if (tab === "log") loadLog();
  }, [tab, loadProposals, loadFund, loadLog]);

  useEffect(() => {
    if (tab === "proposals") loadProposals();
  }, [filterStatus]);

  const runSync = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const r = await fetch(`${AI_SYNC}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens_to_collect: 10 }),
      });
      const d = await r.json();
      setMsg(`Синхронизация завершена. Создано предложений: ${d.proposals_created}. В фонд: ${d.fund_contribution} токенов.`);
      loadStatus();
    } finally {
      setSyncing(false);
    }
  };

  const decide = async (id: number, decision: "approved" | "rejected") => {
    setLoading(true);
    await fetch(`${AI_SYNC}/proposals/${id}/decide`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });
    setDecideId(null);
    setComment("");
    setMsg(`Предложение #${id} ${decision === "approved" ? "одобрено" : "отклонено"}`);
    loadProposals();
    loadStatus();
    setLoading(false);
  };

  const collectTokens = async (amount: number) => {
    await fetch(`${AI_SYNC}/fund/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, source: "manual" }),
    });
    loadFund();
    loadStatus();
    setMsg(`${amount * 0.1} токенов добавлены в фонд развития ИИ`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e0e0", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0d1b2a,#1a0a2e)", borderBottom: "1px solid #1e3a5f", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => nav("/egsu/owner")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}>
          <Icon name="ArrowLeft" size={20} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#00ff87)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="Brain" size={20} color="#000" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>ИИ-Синхронизация</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Управление ИИ-системой и фондом развития</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {status && status.approvals_waiting > 0 && (
            <div style={{ background: "#ff4444", borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
              {status.approvals_waiting} ожидают
            </div>
          )}
          <button onClick={runSync} disabled={syncing} style={{
            background: syncing ? "#374151" : "linear-gradient(135deg,#7c3aed,#00ff87)",
            border: "none", borderRadius: 8, padding: "8px 16px", color: syncing ? "#6b7280" : "#000",
            fontWeight: 700, fontSize: 13, cursor: syncing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6
          }}>
            <Icon name={syncing ? "Loader2" : "RefreshCw"} size={14} />
            {syncing ? "Анализ..." : "Запустить синк"}
          </button>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ background: "#0d2a1a", border: "1px solid #00ff87", borderRadius: 8, margin: "12px 20px", padding: "10px 16px", fontSize: 13, color: "#00ff87" }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e3a5f", padding: "0 20px" }}>
        {([["status","Статус","Activity"],["proposals","Предложения ИИ","Lightbulb"],["fund","Фонд развития","Coins"],["log","Лог синков","ScrollText"]] as const).map(([key, label, icon]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: "none", border: "none", borderBottom: tab === key ? "2px solid #00ff87" : "2px solid transparent",
            color: tab === key ? "#00ff87" : "#6b7280", padding: "12px 16px", cursor: "pointer",
            fontSize: 13, fontWeight: tab === key ? 700 : 400, display: "flex", alignItems: "center", gap: 6
          }}>
            <Icon name={icon} size={14} />
            {label}
            {key === "proposals" && status && status.proposals.pending_review > 0 && (
              <span style={{ background: "#ff4444", borderRadius: 10, padding: "1px 7px", fontSize: 11, color: "#fff", fontWeight: 700 }}>
                {status.proposals.pending_review}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {/* STATUS TAB */}
        {tab === "status" && status && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Всего синков", value: status.ai_sync.total_syncs, icon: "RefreshCw", color: "#7c3aed" },
                { label: "Ждут одобрения", value: status.proposals.pending_review, icon: "Clock", color: "#f59e0b" },
                { label: "Одобрено", value: status.proposals.approved, icon: "CheckCircle", color: "#00ff87" },
                { label: "Фонд развития", value: `${status.development_fund.balance.toFixed(2)} т.`, icon: "Coins", color: "#3b82f6" },
              ].map((item) => (
                <div key={item.label} style={{ background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Icon name={item.icon} size={16} color={item.color} />
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#a78bfa", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="Brain" size={16} />
                Статус ИИ-синхронизации
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Статус системы", status.status === "active" ? "Активна" : "Неактивна", status.status === "active" ? "#00ff87" : "#ff4444"],
                  ["Синхронизация с редактором", "Подключена", "#00ff87"],
                  ["Самообучение", "Включено", "#00ff87"],
                  ["Отчисления в фонд", `${status.development_fund.fund_percent}% от токенов`, "#3b82f6"],
                  ["Email владельца", "nikolaevvladimir77@yandex.ru", "#6b7280"],
                  ["Последний синк", status.ai_sync.last_sync ? new Date(status.ai_sync.last_sync).toLocaleString("ru") : "Не было", "#6b7280"],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e3a5f" }}>
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>{k}</span>
                    <span style={{ color: c, fontSize: 13, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 600, color: "#6b7280", fontSize: 13, marginBottom: 8 }}>Как работает система</div>
              <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>
                • ИИ анализирует данные системы (инциденты, безопасность, уведомления)<br />
                • Генерирует предложения по улучшению с обоснованием логики<br />
                • Отправляет запрос на одобрение на email: nikolaevvladimir77@yandex.ru<br />
                • Уведомление появляется в приложении<br />
                • Вы одобряете или отклоняете каждое изменение<br />
                • 10% от всех токенов системы идут в фонд развития ИИ
              </div>
            </div>
          </div>
        )}

        {/* PROPOSALS TAB */}
        {tab === "proposals" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["pending","Ожидают"],["approved","Одобрено"],["rejected","Отклонено"],["","Все"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)} style={{
                  background: filterStatus === val ? "#7c3aed" : "#1f2937",
                  border: "none", borderRadius: 8, padding: "6px 14px", color: filterStatus === val ? "#fff" : "#6b7280",
                  fontSize: 12, cursor: "pointer", fontWeight: filterStatus === val ? 700 : 400
                }}>{label}</button>
              ))}
            </div>

            {proposals.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#4b5563" }}>
                <Icon name="Lightbulb" size={40} color="#1f2937" />
                <div style={{ marginTop: 12 }}>Предложений пока нет</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Нажмите "Запустить синк" для анализа системы</div>
              </div>
            )}

            {proposals.map((p) => (
              <div key={p.id} style={{
                background: "#111827", border: `1px solid ${p.status === "pending" ? "#f59e0b" : p.status === "approved" ? "#00ff87" : "#374151"}`,
                borderRadius: 12, padding: 20, marginBottom: 12
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ background: "#1f2937", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#6b7280" }}>
                        {CATEGORY_LABEL[p.category] || p.category}
                      </span>
                      <span style={{ color: PRIORITY_COLOR[p.priority] || "#6b7280", fontSize: 11, fontWeight: 700 }}>
                        {p.priority.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>#{p.id}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{p.title}</div>
                  </div>
                  <div style={{
                    borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700,
                    background: p.status === "pending" ? "#451a03" : p.status === "approved" ? "#0d2a1a" : "#1f2937",
                    color: p.status === "pending" ? "#f59e0b" : p.status === "approved" ? "#00ff87" : "#6b7280"
                  }}>
                    {p.status === "pending" ? "Ожидает" : p.status === "approved" ? "Одобрено" : "Отклонено"}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>{p.description}</div>

                {p.logic_reasoning && (
                  <div style={{ background: "#0d1b2a", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 2 }}>Логика ИИ:</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{p.logic_reasoning}</div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "#4b5563" }}>
                    Создано: {new Date(p.created_at).toLocaleString("ru")}
                    {p.tokens_required > 0 && ` · Требует: ${p.tokens_required} токенов`}
                  </div>
                  {p.status === "pending" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      {decideId === p.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 240 }}>
                          <input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Комментарий (необязательно)"
                            style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 12 }}
                          />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => decide(p.id, "approved")} disabled={loading} style={{
                              flex: 1, background: "#00ff87", border: "none", borderRadius: 6,
                              padding: "6px 0", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer"
                            }}>Одобрить</button>
                            <button onClick={() => decide(p.id, "rejected")} disabled={loading} style={{
                              flex: 1, background: "#374151", border: "none", borderRadius: 6,
                              padding: "6px 0", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer"
                            }}>Отклонить</button>
                            <button onClick={() => { setDecideId(null); setComment(""); }} style={{
                              background: "none", border: "1px solid #374151", borderRadius: 6,
                              padding: "6px 10px", color: "#6b7280", fontSize: 12, cursor: "pointer"
                            }}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setDecideId(p.id)} style={{
                          background: "linear-gradient(135deg,#7c3aed,#3b82f6)", border: "none", borderRadius: 8,
                          padding: "6px 16px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer"
                        }}>Принять решение</button>
                      )}
                    </div>
                  )}
                  {p.status !== "pending" && p.owner_comment && (
                    <div style={{ fontSize: 11, color: "#4b5563", fontStyle: "italic" }}>"{p.owner_comment}"</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FUND TAB */}
        {tab === "fund" && fund && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#0d1b2a,#1a0a2e)", border: "1px solid #7c3aed", borderRadius: 16, padding: 24, marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Баланс фонда развития ИИ</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: "#00ff87" }}>{fund.fund_balance.toFixed(2)}</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>токенов</div>
              <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 8 }}>
                {fund.fund_percent}% от всей активности системы
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[10, 50, 100, 500].map((a) => (
                <button key={a} onClick={() => collectTokens(a)} style={{
                  background: "#1f2937", border: "1px solid #374151", borderRadius: 8,
                  padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer"
                }}>
                  Внести {a} токенов → {a * 0.1} в фонд
                </button>
              ))}
            </div>

            <div style={{ background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#a78bfa" }}>История фонда</div>
              {fund.history.map((entry, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e3a5f", fontSize: 13 }}>
                  <div>
                    <span style={{ color: entry.operation_type === "collect" ? "#00ff87" : "#6b7280", marginRight: 8 }}>
                      {entry.operation_type === "collect" ? "+" : "="}
                    </span>
                    <span style={{ color: "#9ca3af" }}>{entry.source_description}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "#00ff87", fontWeight: 700 }}>+{Number(entry.amount).toFixed(4)}</span>
                    <span style={{ color: "#4b5563", marginLeft: 8, fontSize: 11 }}>={Number(entry.fund_balance).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOG TAB */}
        {tab === "log" && (
          <div>
            {logs.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#4b5563" }}>
                <Icon name="ScrollText" size={40} color="#1f2937" />
                <div style={{ marginTop: 12 }}>Лог пуст. Запустите синхронизацию.</div>
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} style={{ background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name={log.status === "success" ? "CheckCircle" : "XCircle"} size={16} color={log.status === "success" ? "#00ff87" : "#ff4444"} />
                    <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{log.ai_source}</span>
                    <span style={{ fontSize: 11, color: "#4b5563" }}>{log.sync_type}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#4b5563" }}>{new Date(log.created_at).toLocaleString("ru")}</span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                  <span>Создано предложений: <b style={{ color: "#a78bfa" }}>{log.proposals_created}</b></span>
                  <span>Токенов: <b style={{ color: "#3b82f6" }}>{Number(log.tokens_collected).toFixed(2)}</b></span>
                  <span>В фонд: <b style={{ color: "#00ff87" }}>+{Number(log.fund_contribution).toFixed(4)}</b></span>
                </div>
                {log.data_analyzed && (
                  <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>Анализ: {log.data_analyzed}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}