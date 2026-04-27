/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const ORGANS_API = "https://functions.poehali.dev/e47c4dc6-578b-4069-8827-85cba5b8d930";

const ORGANS_LIST = [
  { code: "OGR-GENERAL",   name: "Главный орган EGSU",           color: "#00ff87" },
  { code: "OGR-SECURITY",  name: "Орган безопасности",           color: "#a855f7" },
  { code: "OGR-RIGHTS",    name: "Орган прав человека",          color: "#ec4899" },
  { code: "OGR-ANTI-CORR", name: "Антикоррупционный орган",      color: "#f59e0b" },
  { code: "OGR-LEGAL",     name: "Правовой орган",               color: "#3b82f6" },
  { code: "OGR-FINANCE",   name: "Финансовый орган",             color: "#f97316" },
  { code: "OGR-ECOLOGY",   name: "Орган экологии",               color: "#10b981" },
  { code: "OGR-CYBER",     name: "Орган киберзащиты",            color: "#2196F3" },
  { code: "OGR-EMERGENCY", name: "Орган ЧС",                     color: "#f43f5e" },
  { code: "OGR-MEDIA",     name: "Медиа-орган",                  color: "#06b6d4" },
];

const PRIORITY_MAP: Record<string,{label:string;color:string}> = {
  critical: { label: "Критический", color: "#f43f5e" },
  high:     { label: "Высокий",     color: "#f59e0b" },
  normal:   { label: "Нормальный",  color: "#3b82f6" },
  low:      { label: "Низкий",      color: "#6b7280" },
};

const STATUS_MAP: Record<string,{label:string;color:string}> = {
  active:   { label: "Активна",    color: "#00ff87" },
  draft:    { label: "Черновик",   color: "#6b7280" },
  done:     { label: "Выполнена",  color: "#3b82f6" },
  archived: { label: "Архив",      color: "#4b5563" },
};

interface StratItem {
  id: number; section: string; title: string; description: string;
  priority: string; status: string; tags: string; author: string;
  sort_order: number; created_at: string;
}

interface StratOrder {
  id: number; strategy_item_id: number; title: string; order_text: string;
  target_organ: string; target_external: string; priority: string;
  status: string; author: string; organ_response: string; forwarded_to: string;
  created_at: string; initiative_title?: string;
}

export function SectionMission() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6" style={{ background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.2)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,255,135,0.15)" }}>
            <Icon name="Target" size={20} style={{ color: "#00ff87" }} />
          </div>
          <div className="text-lg font-bold text-white">Миссия</div>
        </div>
        <p className="text-white/80 leading-relaxed">
          Создание прозрачной, технологичной и эффективной системы глобального управления
          для решения современных вызовов — климат, кибербезопасность, пандемии и устойчивое развитие.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: "Eye",   color: "#06b6d4", label: "Прозрачность",    desc: "Блокчейн-верификация всех решений" },
          { icon: "Zap",   color: "#f59e0b", label: "Скорость",        desc: "ИИ-автоматизация принятия решений" },
          { icon: "Users", color: "#a855f7", label: "Участие граждан", desc: "Цифровые платформы для всех" },
          { icon: "Leaf",  color: "#00ff87", label: "Устойчивость",    desc: "Долгосрочные системные изменения" },
        ].map(({ icon, color, label, desc }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name={icon as any} size={16} style={{ color }} />
              <span className="font-semibold text-white text-sm">{label}</span>
            </div>
            <p className="text-white/50 text-xs">{desc}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Ключевые ресурсы</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Цифровая платформа с ИИ и блокчейном",
            "Глобальная сеть данных (спутники, дроны, IoT)",
            "Команда экспертов: IT, юристы, аналитики",
            "Партнёрская экосистема организаций",
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-white/60">
              <span style={{ color: "#00ff87" }}>▸</span>{r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SectionAudience() {
  const segments = [
    { icon: "Landmark",    color: "#f59e0b", label: "Государства и МО",     desc: "Правительства, ООН, ЕС, региональные союзы", share: 40 },
    { icon: "Building2",   color: "#3b82f6", label: "Корпоративный сектор", desc: "Крупный и средний бизнес (ESG, кибербез.)", share: 30 },
    { icon: "FlaskConical",color: "#a855f7", label: "Наука и НКО",          desc: "Институты, фонды, экологические организации", share: 20 },
    { icon: "User",        color: "#00ff87", label: "Граждане",             desc: "Через цифровые платформы и мобильные приложения", share: 10 },
  ];
  return (
    <div className="space-y-4">
      <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Распределение целевой аудитории</div>
      {segments.map(({ icon, color, label, desc, share }) => (
        <div key={label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon name={icon as any} size={16} style={{ color }} />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{label}</div>
                <div className="text-white/40 text-xs">{desc}</div>
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{share}%</div>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${share}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionRevenue() {
  const rows = [
    { source: "Платные подписки",      desc: "Доступ к аналитике, центрам задач, отчётам",       share: 35, color: "#f59e0b" },
    { source: "Транзакционные сборы",  desc: "0,01% от сделок с цифровыми и углеродными активами", share: 25, color: "#3b82f6" },
    { source: "Лицензирование ИИ",     desc: "Продажа лицензий на ИИ-модули и блокчейн",           share: 20, color: "#a855f7" },
    { source: "Гранты и субсидии",     desc: "Финансирование от международных фондов",              share: 15, color: "#00ff87" },
    { source: "Партнёрские программы", desc: "Доходы от совместных проектов с бизнесом и НКО",      share: 5,  color: "#f43f5e" },
  ];
  const total = rows.reduce((a, b) => a + b.share, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-1 mb-2 rounded-xl overflow-hidden h-8">
        {rows.map(r => (
          <div key={r.source} className="flex items-center justify-center text-[10px] font-bold text-black" style={{ background: r.color, flex: r.share }}>
            {r.share}%
          </div>
        ))}
      </div>
      {rows.map(({ source, desc, share, color }) => (
        <div key={source} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-2 h-10 rounded-full shrink-0" style={{ background: color }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">{source}</div>
            <div className="text-white/40 text-xs mt-0.5">{desc}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold" style={{ color }}>{share}%</div>
            <div className="text-white/30 text-[10px]">от {total}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionCosts() {
  const rows = [
    { label: "Разработка и IT-платформа", share: 40, color: "#a855f7", note: "ИИ, блокчейн, интерфейсы" },
    { label: "Персонал",                  share: 30, color: "#3b82f6", note: "Эксперты, разработчики, аналитики" },
    { label: "Операционные расходы",      share: 15, color: "#f59e0b", note: "Офисы, связь, юридические услуги" },
    { label: "Маркетинг и PR",            share: 10, color: "#00ff87", note: "Продвижение, конференции, партнёры" },
    { label: "Резервный фонд",            share: 5,  color: "#f43f5e", note: "Непредвиденные расходы и кризисы" },
  ];
  return (
    <div className="space-y-3">
      {rows.map(({ label, share, color, note }) => (
        <div key={label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-white font-semibold text-sm">{label}</div>
              <div className="text-white/40 text-xs">{note}</div>
            </div>
            <div className="text-xl font-bold" style={{ color }}>{share}%</div>
          </div>
          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${share}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionPhases() {
  const phases = [
    { num: "01", label: "Запуск и пилоты", period: "0–2 года", color: "#f43f5e", status: "Отрицательный денежный поток", statusColor: "#f43f5e", income: ["Гранты и субсидии", "Стартовые подписки ранних партнёров"], costs: ["Высокие затраты на разработку", "Маркетинг и найм персонала"], focus: "Привлечение первых 3–5 стран/секторов, доказательство концепции" },
    { num: "02", label: "Масштабирование", period: "2–4 года", color: "#f59e0b", status: "Выход на безубыточность", statusColor: "#f59e0b", income: ["Рост подписок", "Транзакционные сборы", "Лицензирование ИИ"], costs: ["Оптимизация IT-инфраструктуры", "Расширение команды"], focus: "Масштабирование платформы, построение партнёрской экосистемы" },
    { num: "03", label: "Устойчивый рост", period: "4+ лет", color: "#00ff87", status: "Положительная прибыль", statusColor: "#00ff87", income: ["Стабильный поток подписок", "Транзакции", "Партнёрства"], costs: ["Снижение доли IT за счёт автоматизации"], focus: "Инвестиции в новые направления, выход на глобальный рынок" },
  ];
  return (
    <div className="space-y-4">
      {phases.map(({ num, label, period, color, status, statusColor, income, costs, focus }) => (
        <div key={num} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}30` }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-black text-sm" style={{ background: color }}>{num}</div>
              <div>
                <div className="text-white font-bold">{label}</div>
                <div className="text-white/40 text-xs">{period}</div>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${statusColor}20`, color: statusColor }}>{status}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg p-3" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.12)" }}>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Доходы</div>
              {income.map((i, idx) => <div key={idx} className="flex items-start gap-1.5 text-xs text-white/60 mb-1"><span style={{ color: "#00ff87" }}>+</span>{i}</div>)}
            </div>
            <div className="rounded-lg p-3" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.12)" }}>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Затраты</div>
              {costs.map((c, idx) => <div key={idx} className="flex items-start gap-1.5 text-xs text-white/60 mb-1"><span style={{ color: "#f43f5e" }}>−</span>{c}</div>)}
            </div>
          </div>
          <div className="text-xs text-white/50 italic border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-white/30">Фокус: </span>{focus}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionKpi() {
  const kpis = [
    { icon: "Users",       color: "#a855f7", label: "Активные пользователи",      desc: "Государства, компании, граждане" },
    { icon: "Clock",       color: "#06b6d4", label: "Время реакции",              desc: "Часы/дни с момента инцидента" },
    { icon: "Brain",       color: "#00ff87", label: "Точность ИИ-прогнозов",      desc: "% верных предсказаний системы" },
    { icon: "CheckCircle", color: "#f59e0b", label: "Исполнение решений",         desc: "Доля автоматически исполненных (блокчейн)" },
    { icon: "TrendingUp",  color: "#f97316", label: "Рост доходов по сегментам",  desc: "Подписки, транзакции, лицензии" },
    { icon: "DollarSign",  color: "#f43f5e", label: "ROI IT-разработки",          desc: "Соотношение затрат на IT к доходам" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3">
      {kpis.map(({ icon, color, label, desc }, i) => (
        <div key={label} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
            <Icon name={icon as any} size={18} style={{ color }} />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold text-sm">{label}</div>
            <div className="text-white/40 text-xs">{desc}</div>
          </div>
          <div className="text-white/20 font-bold text-lg shrink-0">KPI {i + 1}</div>
        </div>
      ))}
    </div>
  );
}

export function SectionRisks() {
  const risks = [
    { risk: "Недостаток финансирования", color: "#f43f5e", level: "Высокий", mitigation: "Стратегические инвесторы, краудфандинг, гранты" },
    { risk: "Сопротивление государств",  color: "#f59e0b", level: "Средний", mitigation: "Постепенное внедрение, пилоты с добровольным участием" },
    { risk: "Кибератаки на систему",     color: "#f43f5e", level: "Высокий", mitigation: "Многоуровневая защита, децентрализация, аудит безопасности" },
    { risk: "Цифровой разрыв",          color: "#f59e0b", level: "Средний", mitigation: "Бесплатные базовые модули, обучение, партнёрство с НКО" },
    { risk: "Этические проблемы ИИ",    color: "#3b82f6", level: "Низкий",  mitigation: "Прозрачные алгоритмы, общественный совет по этике, право вето" },
  ];
  return (
    <div className="space-y-3">
      {risks.map(({ risk, color, level, mitigation }) => (
        <div key={risk} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="text-white font-semibold text-sm">{risk}</div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${color}20`, color }}>{level}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-white/50">
            <Icon name="ShieldCheck" size={12} className="mt-0.5 shrink-0" style={{ color: "#00ff87" }} />
            {mitigation}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionSalary() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div className="text-white font-bold mb-4 flex items-center gap-2">
          <Icon name="PieChart" size={16} style={{ color: "#8b5cf6" }} />
          Структура ФОТ
        </div>
        <div className="space-y-3">
          {[
            { label: "Оклады (грейды: Junior → Lead)", share: 60, color: "#3b82f6" },
            { label: "Премии за KPI",                  share: 25, color: "#f59e0b" },
            { label: "Бонусы за успешные проекты",     share: 10, color: "#00ff87" },
            { label: "Опционы на участие в прибыли",   share: 5,  color: "#a855f7" },
          ].map(({ label, share, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">{label}</span>
                <span className="font-bold" style={{ color }}>{share}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${share}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {[
          { role: "Разработчики и аналитики", system: "Грейдинговая система (Junior/Middle/Senior/Lead)", icon: "Code",     color: "#3b82f6" },
          { role: "Полевые сотрудники",        system: "Сдельная оплата + бонусы за эффективность",        icon: "Activity", color: "#f59e0b" },
          { role: "Топ-менеджмент",            system: "Фиксированный оклад + доля от прибыли",            icon: "Crown",    color: "#a855f7" },
        ].map(({ role, system, icon, color }) => (
          <div key={role} className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
              <Icon name={icon as any} size={16} style={{ color }} />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{role}</div>
              <div className="text-white/40 text-xs mt-0.5">{system}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionStrategy() {
  const [items, setItems] = useState<StratItem[]>([]);
  const [orders, setOrders] = useState<StratOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "orders">("list");
  const [editItem, setEditItem] = useState<StratItem | null>(null);
  const [newItem, setNewItem] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", description: "", priority: "normal", status: "draft", tags: "" });
  const [saving, setSaving] = useState(false);
  const [orderModal, setOrderModal] = useState<StratItem | null>(null);
  const [orderForm, setOrderForm] = useState({ title: "", order_text: "", target_organ: "OGR-GENERAL", target_external: "", priority: "normal" });
  const [sendingOrder, setSendingOrder] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  async function loadItems() {
    setLoading(true);
    try {
      const r = await fetch(`${ORGANS_API}/strategy?section=humanity`);
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      setItems(p.items || []);
    } catch (_e) { console.error(_e); } finally { setLoading(false); }
  }

  async function loadOrders() {
    try {
      const r = await fetch(`${ORGANS_API}/strategy-orders`);
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      setOrders(p.orders || []);
    } catch (_e) { console.error(_e); }
  }

  useEffect(() => { loadItems(); loadOrders(); }, []);

  async function saveItem() {
    setSaving(true);
    try {
      if (editItem) {
        await fetch(`${ORGANS_API}/strategy`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editItem.id, ...newForm })
        });
        showToast("✓ Инициатива обновлена");
      } else {
        await fetch(`${ORGANS_API}/strategy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "humanity", ...newForm })
        });
        showToast("✓ Инициатива создана");
      }
      setEditItem(null);
      setNewItem(false);
      setNewForm({ title: "", description: "", priority: "normal", status: "draft", tags: "" });
      loadItems();
    } catch (_e) { console.error(_e); } finally { setSaving(false); }
  }

  async function sendOrder() {
    if (!orderModal || !orderForm.order_text) return;
    setSendingOrder(true);
    try {
      await fetch(`${ORGANS_API}/strategy-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy_item_id: orderModal.id, ...orderForm })
      });
      showToast(`✓ Распоряжение направлено в ${ORGANS_LIST.find(o => o.code === orderForm.target_organ)?.name || orderForm.target_organ}`);
      setOrderModal(null);
      setOrderForm({ title: "", order_text: "", target_organ: "OGR-GENERAL", target_external: "", priority: "normal" });
      loadOrders();
    } catch (_e) { console.error(_e); } finally { setSendingOrder(false); }
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.3)" }}>
          {toast}
        </div>
      )}

      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {[["list","Инициативы"],["orders","Распоряжения"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v as "list"|"orders")}
              className="px-4 py-2 text-xs font-semibold transition-colors"
              style={{ background: view === v ? "rgba(16,185,129,0.15)" : "transparent", color: view === v ? "#10b981" : "rgba(255,255,255,0.35)" }}>
              {l} {v === "orders" && orders.length > 0 && <span className="ml-1 px-1.5 rounded-full text-[10px]" style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>{orders.length}</span>}
            </button>
          ))}
        </div>
        {view === "list" && (
          <button onClick={() => { setNewItem(true); setEditItem(null); setNewForm({ title: "", description: "", priority: "normal", status: "draft", tags: "" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
            <Icon name="Plus" size={13} />
            Новая инициатива
          </button>
        )}
      </div>

      {/* Форма создания/редактирования */}
      {(newItem || editItem) && (
        <div className="p-4 rounded-2xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-3">
            {editItem ? "Редактирование инициативы" : "Новая стратегическая инициатива"}
          </div>
          <input value={newForm.title} onChange={e => setNewForm(f => ({...f, title: e.target.value}))}
            placeholder="Название инициативы"
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
          <textarea value={newForm.description} onChange={e => setNewForm(f => ({...f, description: e.target.value}))}
            placeholder="Описание — цели, механизмы, ожидаемый эффект..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-2 resize-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
          <div className="grid grid-cols-3 gap-2 mb-3">
            <select value={newForm.priority} onChange={e => setNewForm(f => ({...f, priority: e.target.value}))}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: PRIORITY_MAP[newForm.priority]?.color || "#fff" }}>
              {Object.entries(PRIORITY_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={newForm.status} onChange={e => setNewForm(f => ({...f, status: e.target.value}))}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: STATUS_MAP[newForm.status]?.color || "#fff" }}>
              {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input value={newForm.tags} onChange={e => setNewForm(f => ({...f, tags: e.target.value}))}
              placeholder="теги через запятую"
              className="px-3 py-2 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setNewItem(false); setEditItem(null); }}
              className="flex-1 py-2 rounded-xl text-xs transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Отмена
            </button>
            <button onClick={saveItem} disabled={saving || !newForm.title}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
              {saving ? "Сохранение..." : editItem ? "Сохранить изменения" : "Создать инициативу"}
            </button>
          </div>
        </div>
      )}

      {/* Список инициатив */}
      {view === "list" && (
        <div>
          {loading && <div className="text-white/30 text-sm text-center py-8">Загрузка...</div>}
          <div className="space-y-3">
            {items.map((item) => {
              const pr = PRIORITY_MAP[item.priority] || PRIORITY_MAP.normal;
              const st = STATUS_MAP[item.status] || STATUS_MAP.draft;
              return (
                <div key={item.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-white text-sm">{item.title}</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: `${pr.color}15`, color: pr.color }}>
                          {pr.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: `${st.color}15`, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{item.description}</p>
                      )}
                      {item.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-lg text-[10px]" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setEditItem(item); setNewItem(false); setNewForm({ title: item.title, description: item.description || "", priority: item.priority, status: item.status, tags: item.tags || "" }); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Icon name="Pencil" size={11} />
                      Редактировать
                    </button>
                    <button onClick={() => { setOrderModal(item); setOrderForm({ title: `По инициативе: ${item.title.slice(0,40)}`, order_text: "", target_organ: "OGR-GENERAL", target_external: "", priority: item.priority }); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <Icon name="Send" size={11} />
                      Направить распоряжение
                    </button>
                  </div>
                </div>
              );
            })}
            {!loading && items.length === 0 && (
              <div className="text-center py-10 text-white/25 text-sm">Инициативы не добавлены. Нажмите «Новая инициатива»</div>
            )}
          </div>
        </div>
      )}

      {/* Список распоряжений */}
      {view === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 && (
            <div className="text-center py-10 text-white/25 text-sm">Распоряжения ещё не направлялись</div>
          )}
          {orders.map(ord => {
            const pr = PRIORITY_MAP[ord.priority] || PRIORITY_MAP.normal;
            const organ = ORGANS_LIST.find(o => o.code === ord.target_organ);
            const statusColors: Record<string,string> = { pending: "#f59e0b", approved: "#00ff87", forwarded: "#3b82f6", done: "#10b981" };
            return (
              <div key={ord.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">{ord.title || "Распоряжение #" + ord.id}</div>
                    {ord.initiative_title && <div className="text-white/30 text-xs mt-0.5">По инициативе: {ord.initiative_title}</div>}
                  </div>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0"
                    style={{ background: `${statusColors[ord.status] || "#6b7280"}15`, color: statusColors[ord.status] || "#6b7280" }}>
                    {ord.status === "pending" ? "Ожидает" : ord.status === "approved" ? "Утверждено" : ord.status === "forwarded" ? "Переправлено" : "Выполнено"}
                  </span>
                </div>
                <div className="text-white/60 text-xs mb-3 leading-relaxed">{ord.order_text}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: organ ? `${organ.color}12` : "rgba(255,255,255,0.05)", color: organ?.color || "rgba(255,255,255,0.4)" }}>
                    <Icon name="Building2" size={10} />
                    {organ?.name || ord.target_organ}
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: `${pr.color}12`, color: pr.color }}>
                    {pr.label}
                  </span>
                  <span className="text-white/25 text-xs py-1">
                    {new Date(ord.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                {ord.organ_response && (
                  <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: "rgba(0,255,135,0.06)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.15)" }}>
                    Ответ органа: {ord.organ_response}
                  </div>
                )}
                {ord.forwarded_to && (
                  <div className="mt-2 text-white/30 text-xs">
                    Переправлено в: {ord.forwarded_to}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно распоряжения */}
      {orderModal && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full md:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl p-5"
            style={{ background: "#0d1220", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-white font-bold text-base">Направить распоряжение</div>
                <div className="text-white/40 text-xs mt-0.5 truncate max-w-xs">{orderModal.title}</div>
              </div>
              <button onClick={() => setOrderModal(null)} className="text-white/30 hover:text-white/70">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-3 rounded-xl text-xs mb-4" style={{ background: "rgba(245,158,11,0.07)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}>
              Распоряжение будет направлено в орган EGSU для рассмотрения и утверждения. После утверждения — в международные и государственные ведомства.
            </div>

            <input value={orderForm.title} onChange={e => setOrderForm(f => ({...f, title: e.target.value}))}
              placeholder="Название распоряжения"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />

            <textarea value={orderForm.order_text} onChange={e => setOrderForm(f => ({...f, order_text: e.target.value}))}
              placeholder="Текст распоряжения — что необходимо рассмотреть, утвердить и продвинуть в действующие органы..."
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3 resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />

            <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Орган EGSU для рассмотрения</div>
            <div className="grid grid-cols-2 gap-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {ORGANS_LIST.map(org => (
                <button key={org.code} onClick={() => setOrderForm(f => ({...f, target_organ: org.code}))}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-all"
                  style={{
                    background: orderForm.target_organ === org.code ? `${org.color}15` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${orderForm.target_organ === org.code ? org.color + "40" : "rgba(255,255,255,0.07)"}`,
                    color: orderForm.target_organ === org.code ? org.color : "rgba(255,255,255,0.5)",
                  }}>
                  {orderForm.target_organ === org.code && <Icon name="CheckCircle" size={11} />}
                  {org.name}
                </button>
              ))}
            </div>

            <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Для дальнейшего продвижения (опционально)</div>
            <input value={orderForm.target_external} onChange={e => setOrderForm(f => ({...f, target_external: e.target.value}))}
              placeholder="МВД, ФСБ, ООН, Интерпол, МУС..."
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />

            <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Приоритет</div>
            <div className="flex gap-2 mb-4">
              {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                <button key={k} onClick={() => setOrderForm(f => ({...f, priority: k}))}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: orderForm.priority === k ? `${v.color}20` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${orderForm.priority === k ? v.color + "50" : "rgba(255,255,255,0.07)"}`,
                    color: orderForm.priority === k ? v.color : "rgba(255,255,255,0.3)",
                  }}>
                  {v.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setOrderModal(null)}
                className="flex-1 py-3 rounded-2xl text-sm transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Отмена
              </button>
              <button onClick={sendOrder} disabled={sendingOrder || !orderForm.order_text}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
                {sendingOrder ? "Отправка..." : "Направить в орган EGSU"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}