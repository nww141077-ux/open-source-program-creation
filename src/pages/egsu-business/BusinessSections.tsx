/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";

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
    { source: "Платные подписки",      desc: "Доступ к аналитике, дашбордам, отчётам",           share: 35, color: "#f59e0b" },
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
  const steps = [
    { n: "1", label: "Регистрация юрлица",       desc: "Юрисдикция с благоприятным климатом для IT — Сингапур или Швейцария" },
    { n: "2", label: "Устав ЕЦСУ",               desc: "Чёткие правила управления, финансирования, защиты данных" },
    { n: "3", label: "Пилотные проекты",         desc: "Мониторинг климата в ЕС, кибербезопасность в Юго-Восточной Азии" },
    { n: "4", label: "Партнёрские программы",    desc: "ООН (блокчейн ВОЗ), корпорации (ИИ-лицензии), НКО (продбез., миграция)" },
    { n: "5", label: "Международное признание",  desc: "Статус наблюдателя в ООН, участие в форумах G20 и ВЭФ" },
  ];
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {steps.map(({ n, label, desc }) => (
          <div key={n} className="flex items-start gap-4 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}>{n}</div>
            <div>
              <div className="text-white font-semibold text-sm">{label}</div>
              <div className="text-white/40 text-xs mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-5" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="text-white font-bold mb-3 flex items-center gap-2">
          <Icon name="CheckCircle" size={16} style={{ color: "#10b981" }} />
          Условия выхода на прибыльность (4–5 лет)
        </div>
        <div className="space-y-2">
          {[
            "Успешное привлечение стартового финансирования",
            "Запуск пилотов в 3–5 странах / секторах в первые 2 года",
            "Масштабирование платформы на основе обратной связи",
            "Построение партнёрской экосистемы с бизнесом и МО",
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/70">
              <Icon name="Check" size={14} className="mt-0.5 shrink-0" style={{ color: "#10b981" }} />
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
