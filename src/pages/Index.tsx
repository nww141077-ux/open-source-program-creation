/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/files/b91e9987-ba19-4e46-a84b-beeb45e6aa11.jpg";

const FEATURES = [
  {
    icon: "Zap",
    title: "Молниеносная скорость",
    desc: "Обработка до 10 000 запросов в секунду. Ваши данные всегда в реальном времени.",
    color: "#00ff87",
  },
  {
    icon: "GitBranch",
    title: "Умные интеграции",
    desc: "Подключите любой сервис за минуты. REST, GraphQL, WebSocket — всё из коробки.",
    color: "#a855f7",
  },
  {
    icon: "ShieldCheck",
    title: "Безопасность данных",
    desc: "Шифрование E2E, аудит событий и контроль доступа на уровне предприятия.",
    color: "#3b82f6",
  },
  {
    icon: "BarChart3",
    title: "Аналитика в реальном времени",
    desc: "Дашборды, метрики и алерты. Видите всё что происходит в вашей системе.",
    color: "#f43f5e",
  },
  {
    icon: "RefreshCw",
    title: "Автосинхронизация",
    desc: "Данные всегда актуальны. Синхронизация между системами без ручного вмешательства.",
    color: "#f59e0b",
  },
  {
    icon: "Blocks",
    title: "Модульная архитектура",
    desc: "Масштабируйте только нужные части. Платите за то, что используете.",
    color: "#06b6d4",
  },
];

const INTEGRATIONS = [
  { name: "Salesforce", icon: "Cloud", color: "#00a1e0" },
  { name: "Slack", icon: "MessageSquare", color: "#9b59b6" },
  { name: "Google", icon: "Globe", color: "#4285f4" },
  { name: "Stripe", icon: "CreditCard", color: "#635bff" },
  { name: "PostgreSQL", icon: "Database", color: "#336791" },
  { name: "AWS", icon: "Server", color: "#ff9900" },
  { name: "GitHub", icon: "Code2", color: "#3fb950" },
  { name: "Telegram", icon: "Send", color: "#0088cc" },
];

const STATS = [
  { value: "500+", label: "Интеграций", icon: "Puzzle" },
  { value: "99.9%", label: "Uptime SLA", icon: "Activity" },
  { value: "< 50мс", label: "Задержка API", icon: "Timer" },
  { value: "10M+", label: "Запросов/день", icon: "TrendingUp" },
];

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return { ref, inView };
}

export default function Index() {
  const navigate = useNavigate();
  const heroRef = useInView(0.1);
  const featuresRef = useInView(0.05);
  const integrationsRef = useInView(0.05);
  const statsRef = useInView(0.1);

  return (
    <div className="min-h-screen mesh-bg font-body overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,255,135,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00ff87, #a855f7)' }}>
            <Icon name="Zap" size={16} className="text-black" />
          </div>
          <span className="font-display text-xl font-bold text-white tracking-wide">NEXAFLOW</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Возможности", "Интеграции", "Тарифы"].map((item) => (
            <a key={item} href="#" className="text-sm text-white/60 hover:text-white transition-colors duration-200">{item}</a>
          ))}
        </div>
        <button onClick={() => navigate('/app')} className="px-5 py-2 rounded-lg font-semibold text-sm text-black transition-all duration-200 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #00ff87, #3b82f6)', boxShadow: '0 0 20px rgba(0,255,135,0.3)' }}>
          Начать бесплатно
        </button>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6" ref={heroRef.ref}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float"
            style={{ background: 'radial-gradient(circle, #00ff87, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float-delay"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border opacity-5 animate-spin-slow"
            style={{ borderColor: '#00ff87' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className={`space-y-8 ${heroRef.inView ? 'animate-fade-up' : 'opacity-0-init'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)', color: '#00ff87' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff87' }} />
              Платформа интеграций нового поколения
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold leading-none uppercase tracking-tight">
              <span className="text-white">Объедините</span>
              <br />
              <span className="gradient-text">всё в одном</span>
              <br />
              <span className="text-white/40">потоке данных</span>
            </h1>

            <p className="text-white/60 text-lg leading-relaxed max-w-lg">
              NexaFlow — единая платформа для интеграции всех ваших сервисов, автоматизации процессов и управления данными в реальном времени.
            </p>

            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/app')} className="px-8 py-4 rounded-xl font-semibold text-black text-base transition-all duration-300 hover:scale-105 glow-green"
                style={{ background: 'linear-gradient(135deg, #00ff87, #3b82f6)' }}>
                Попробовать бесплатно →
              </button>
              <button className="px-8 py-4 rounded-xl font-semibold text-white text-base transition-all duration-300 hover:scale-105 gradient-border"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                Смотреть демо
              </button>
            </div>

            <div className="flex items-center gap-6 pt-2">
              {["14 дней бесплатно", "Без карты", "Отмена в любое время"].map((text) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-white/40">
                  <Icon name="Check" size={12} style={{ color: '#00ff87' }} />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className={`relative ${heroRef.inView ? 'animate-slide-right delay-300' : 'opacity-0-init'}`}>
            <div className="relative rounded-2xl overflow-hidden gradient-border"
              style={{ boxShadow: '0 0 60px rgba(0,255,135,0.15), 0 0 120px rgba(168,85,247,0.1)' }}>
              <img src={HERO_IMAGE} alt="NexaFlow Dashboard" className="w-full object-cover" style={{ height: '420px' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,12,20,0.8) 0%, transparent 60%)' }} />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black" style={{ background: '#00ff87' }}>
                  ● Живое подключение
                </div>
                <div className="px-3 py-1.5 rounded-lg text-xs text-white"
                  style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  1,247 активных потоков
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl flex items-center justify-center animate-float"
              style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
              <Icon name="GitMerge" size={32} className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6" ref={statsRef.ref}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <div key={stat.label}
                className={`p-6 rounded-2xl text-center gradient-border card-hover ${statsRef.inView ? 'animate-fade-up' : 'opacity-0-init'}`}
                style={{ background: 'rgba(13,18,32,0.8)', animationDelay: `${i * 0.1}s` }}>
                <Icon name={stat.icon as any} size={24} className="mx-auto mb-3" style={{ color: '#00ff87' }} />
                <div className="font-display text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6" ref={featuresRef.ref}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 ${featuresRef.inView ? 'animate-fade-up' : 'opacity-0-init'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>
              <Icon name="Sparkles" size={12} />
              Ключевые возможности
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-tight mb-4">
              Всё что нужно<br /><span className="gradient-text">для роста</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Мощный набор инструментов для автоматизации, интеграции и масштабирования вашего бизнеса
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <div key={feat.title}
                className={`p-6 rounded-2xl card-hover gradient-border cursor-pointer group ${featuresRef.inView ? 'animate-fade-up' : 'opacity-0-init'}`}
                style={{ background: 'rgba(13,18,32,0.9)', animationDelay: `${i * 0.08}s` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}40` }}>
                  <Icon name={feat.icon as any} size={22} style={{ color: feat.color }} />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2 uppercase tracking-wide">{feat.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feat.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold transition-all duration-200 group-hover:gap-2"
                  style={{ color: feat.color }}>
                  Подробнее <Icon name="ArrowRight" size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-24 px-6" ref={integrationsRef.ref}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 ${integrationsRef.inView ? 'animate-fade-up' : 'opacity-0-init'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6' }}>
              <Icon name="Link2" size={12} />
              Экосистема интеграций
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-tight mb-4">
              500+ сервисов<br /><span className="gradient-text">под рукой</span>
            </h2>
          </div>

          <div className="relative">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,135,0.05) 0%, transparent 70%)' }} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {INTEGRATIONS.map((item, i) => (
                <div key={item.name}
                  className={`p-5 rounded-2xl flex items-center gap-4 card-hover gradient-border group cursor-pointer ${integrationsRef.inView ? 'animate-fade-up' : 'opacity-0-init'}`}
                  style={{ background: 'rgba(13,18,32,0.9)', animationDelay: `${i * 0.07}s` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${item.color}20`, border: `1px solid ${item.color}40` }}>
                    <Icon name={item.icon as any} size={18} style={{ color: item.color }} />
                  </div>
                  <span className="font-semibold text-white/80 text-sm group-hover:text-white transition-colors">{item.name}</span>
                  <Icon name="Plus" size={14} className="ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
              ))}
            </div>

            <div className={`text-center ${integrationsRef.inView ? 'animate-fade-up delay-500' : 'opacity-0-init'}`}>
              <button className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 gradient-border text-white"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                Смотреть все интеграции →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl relative overflow-hidden gradient-border"
            style={{ background: 'rgba(13,18,32,0.95)' }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20"
                style={{ background: '#00ff87' }} />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15"
                style={{ background: '#a855f7' }} />
            </div>
            <div className="relative z-10">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white uppercase tracking-tight mb-4">
                Готовы к запуску?
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
                Начните бесплатно и подключите первую интеграцию за 5 минут. Никаких ограничений на 14 дней.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button className="px-10 py-4 rounded-xl font-bold text-black text-base transition-all duration-300 hover:scale-105 glow-green"
                  style={{ background: 'linear-gradient(135deg, #00ff87, #3b82f6)' }}>
                  Начать бесплатно →
                </button>
                <button className="px-10 py-4 rounded-xl font-semibold text-white text-base transition-all duration-300 hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  Связаться с командой
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00ff87, #a855f7)' }}>
              <Icon name="Zap" size={12} className="text-black" />
            </div>
            <span className="font-display text-sm font-bold text-white/60 tracking-wide">NEXAFLOW</span>
          </div>
          <p className="text-white/30 text-xs">© 2026 NexaFlow. Все права защищены.</p>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff87' }} />
            Все системы работают
          </div>
        </div>
      </footer>
    </div>
  );
}