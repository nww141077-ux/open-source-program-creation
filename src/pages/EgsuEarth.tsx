import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

type ModuleKey = "core_lite" | "atmos_fast" | "hydro_simple" | "bio_stat" | "climate_lite";
type TabKey = "overview" | "modules" | "config" | "simulation" | "genome" | "incidents";

const GENOME_YAML = `planet_genome:
  name: "Terra_Genome_v3.0"
  version: "3.1"
  creation_date: "4.543e9_years_BP"
  energy_budget: 1.2e34 J

segments:
  - name: "energy"
    genes:
      - id: "FUEL_GENE"
        function: "carbon_energy_storage"
        expression_rate: "anthropogenic_triggered"
      - id: "GEOTHERM_GENE"
        function: "internal_heat_generation"
        expression_rate: "constant_low"
      - id: "PHOTO_GENE"
        function: "solar_energy_conversion"
        expression_rate: "diurnal_seasonal"

  - name: "hydrological"
    genes:
      - id: "CLAY_GENE"
        function: "water_filtration"
        expression_rate: "seasonal"
      - id: "AQUIFER_GENE"
        function: "freshwater_storage"
        expression_rate: "climate_dependent"

  - name: "structural"
    genes:
      - id: "CRUST_GENE"
        function: "tectonic_framework"
        expression_rate: "geological_timescale"
      - id: "TECTONIC_GENE"
        function: "continental_movement"
        expression_rate: "slow_continuous"

  - name: "biological"
    genes:
      - id: "SOIL_GENE"
        function: "organic_decomposition"
        expression_rate: "temperature_dependent"
      - id: "FOREST_GENE"
        function: "oxygen_production"
        expression_rate: "seasonal"

  - name: "regulatory"
    genes:
      - id: "CARBON_CYCLE"
        function: "CO2_balance"
        expression_rate: "dynamic"
      - id: "NITROGEN_CYCLE"
        function: "nitrogen_fixation"
        expression_rate: "balanced"

  - name: "anthropogenic"
    genes:
      - id: "ENERGY_GENE"
        function: "resource_consumption"
        expression_rate: "exponential_growth"
      - id: "URBAN_GENE"
        function: "landscape_modification"
        expression_rate: "accelerating"

incident_monitor:
  version: "1.3"
  energy_profile: "ultra_low"

  detection_rules:
    - target_gene: "FUEL_GENE"
      condition: "expression_rate > threshold_anthropogenic"
      incident_type: "fossil_overexploitation"
      severity: "warning"
      action: "log_event"

    - target_gene: "AQUIFER_GENE"
      condition: "expression_rate < threshold_renewal"
      incident_type: "groundwater_depletion"
      severity: "critical"
      action:
        - "alert_user"
        - "activate_conservation_protocol"

    - target_gene: "CARBON_CYCLE"
      condition: "atmospheric_CO2 > 450 ppm"
      incident_type: "climate_emergency"
      severity: "critical"
      action:
        - "log_full_state"
        - "trigger_carbon_reduction_protocol"

    - target_gene: "FOREST_GENE"
      condition: "coverage < 25%"
      incident_type: "deforestation_crisis"
      severity: "high"
      action:
        - "notify_regulatory_agencies"
        - "initiate_reforestation"

    - target_gene: "ENERGY_GENE"
      condition: "consumption_rate > 2 * historical_average"
      incident_type: "energy_demand_spike"
      severity: "medium"
      action: "recommend_efficiency_measures"

  monitoring_strategy:
    frequency: "event_driven"
    sensors:
      - "gene_expression_rates"
      - "environmental_parameters"
      - "threshold_breaches"

  alert_system:
    levels:
      - level: "info"
        color: "blue"
        condition: "minor_deviation"
      - level: "warning"
        color: "yellow"
        condition: "significant_change"
      - level: "critical"
        color: "red"
        condition: "catastrophic_event"
    actions:
      critical:
        - "pause_simulation"
        - "save_state_snapshot"
        - "send_alert"
      warning:
        - "increase_monitoring_frequency"
        - "log_details"

environmental_conditions:
  temperature_range: "-89°C to +57°C"
  pressure_range: "0.006 to 1000 bar"
  habitability_index: "high"

activation_rules:
  - condition: "temperature > 273K"
    activate: ["SOIL_GENE", "FOREST_GENE"]
  - condition: "human_population > 1e6"
    activate: ["ENERGY_GENE", "URBAN_GENE"]

evolution_potential:
  natural_mutation_rate: 1e-6 per geological_epoch
  anthropogenic_influence: high`;

const GENOME_SEGMENTS = [
  {
    name: "energy", label: "Энергетический", color: "#f59e0b", icon: "Zap",
    genes: [
      { id: "FUEL_GENE", fn: "carbon_energy_storage", rate: "anthropogenic_triggered", status: "warning" },
      { id: "GEOTHERM_GENE", fn: "internal_heat_generation", rate: "constant_low", status: "ok" },
      { id: "PHOTO_GENE", fn: "solar_energy_conversion", rate: "diurnal_seasonal", status: "ok" },
    ],
  },
  {
    name: "hydrological", label: "Гидрологический", color: "#06b6d4", icon: "Waves",
    genes: [
      { id: "CLAY_GENE", fn: "water_filtration", rate: "seasonal", status: "ok" },
      { id: "AQUIFER_GENE", fn: "freshwater_storage", rate: "climate_dependent", status: "critical" },
    ],
  },
  {
    name: "structural", label: "Структурный", color: "#f43f5e", icon: "Mountain",
    genes: [
      { id: "CRUST_GENE", fn: "tectonic_framework", rate: "geological_timescale", status: "ok" },
      { id: "TECTONIC_GENE", fn: "continental_movement", rate: "slow_continuous", status: "ok" },
    ],
  },
  {
    name: "biological", label: "Биологический", color: "#22c55e", icon: "Leaf",
    genes: [
      { id: "SOIL_GENE", fn: "organic_decomposition", rate: "temperature_dependent", status: "ok" },
      { id: "FOREST_GENE", fn: "oxygen_production", rate: "seasonal", status: "high" },
    ],
  },
  {
    name: "regulatory", label: "Регуляторный", color: "#a855f7", icon: "Activity",
    genes: [
      { id: "CARBON_CYCLE", fn: "CO2_balance", rate: "dynamic", status: "critical" },
      { id: "NITROGEN_CYCLE", fn: "nitrogen_fixation", rate: "balanced", status: "ok" },
    ],
  },
  {
    name: "anthropogenic", label: "Антропогенный", color: "#f97316", icon: "Building2",
    genes: [
      { id: "ENERGY_GENE", fn: "resource_consumption", rate: "exponential_growth", status: "medium" },
      { id: "URBAN_GENE", fn: "landscape_modification", rate: "accelerating", status: "warning" },
    ],
  },
];

const INCIDENT_RULES = [
  {
    gene: "FUEL_GENE",
    condition: "expression_rate > threshold_anthropogenic",
    type: "fossil_overexploitation",
    label: "Сверхэксплуатация ископаемого топлива",
    severity: "warning",
    actions: ["log_event"],
    active: true,
  },
  {
    gene: "AQUIFER_GENE",
    condition: "expression_rate < threshold_renewal",
    type: "groundwater_depletion",
    label: "Истощение подземных вод",
    severity: "critical",
    actions: ["alert_user", "activate_conservation_protocol"],
    active: true,
  },
  {
    gene: "CARBON_CYCLE",
    condition: "atmospheric_CO2 > 450 ppm",
    type: "climate_emergency",
    label: "Климатическая чрезвычайная ситуация",
    severity: "critical",
    actions: ["log_full_state", "trigger_carbon_reduction_protocol"],
    active: true,
  },
  {
    gene: "FOREST_GENE",
    condition: "coverage < 25%",
    type: "deforestation_crisis",
    label: "Кризис вырубки лесов",
    severity: "high",
    actions: ["notify_regulatory_agencies", "initiate_reforestation"],
    active: false,
  },
  {
    gene: "ENERGY_GENE",
    condition: "consumption_rate > 2 * historical_average",
    type: "energy_demand_spike",
    label: "Скачок энергопотребления",
    severity: "medium",
    actions: ["recommend_efficiency_measures"],
    active: false,
  },
];

const SEV_COLOR: Record<string, string> = {
  critical: "#f43f5e",
  high: "#f97316",
  warning: "#f59e0b",
  medium: "#3b82f6",
  info: "#06b6d4",
  ok: "#00c864",
};
const SEV_LABEL: Record<string, string> = {
  critical: "Критично",
  high: "Высокий",
  warning: "Предупреждение",
  medium: "Средний",
  info: "Инфо",
  ok: "Норма",
};

const MODULES: {
  key: ModuleKey;
  name: string;
  file: string;
  icon: string;
  color: string;
  energy: string;
  energyPct: number;
  priority: string;
  desc: string;
  params: { label: string; value: string }[];
  deps: string[];
  condition: string;
  config: string;
}[] = [
  {
    key: "core_lite",
    name: "core_lite",
    file: "core/core_lite_v1.cfg",
    icon: "Layers",
    color: "#f43f5e",
    energy: "ultra_low",
    energyPct: 5,
    priority: "high",
    desc: "Упрощённая геодинамика и тектоника плит",
    deps: [],
    condition: "always",
    params: [
      { label: "Радиус ядра", value: "3 480 000 м" },
      { label: "Температура", value: "5 700 K (фикс.)" },
      { label: "Тепловой поток", value: "0.08 Вт/м²" },
      { label: "Тектоника", value: "дискрет. события / 1 млн лет" },
      { label: "Дрейф континентов", value: "2 см/год" },
      { label: "Зоны субдукции", value: "5 (фикс.)" },
      { label: "Вулканизм P", value: "0.1 / млн лет" },
    ],
    config: `module_name: "core_lite"
version: "1.0"
energy_profile: ultra_low

core_model:
  type: "uniform_sphere"
  radius: 3480000 m
  temperature: 5700 K
  heat_flow: 0.08 W/m^2

plate_tectonics:
  mode: "discrete_events"
  event_frequency: 1e6 years
  continent_drift_speed: 2 cm/year
  subduction_zones: 5

volcanism:
  probability_per_million_years: 0.1
  lava_volume_distribution: "lognormal(mu=10^6, sigma=10^5)"

dependencies: []
activation_condition: "always"`,
  },
  {
    key: "atmos_fast",
    name: "atmos_fast",
    file: "atmos/atmos_fast_v1.cfg",
    icon: "Wind",
    color: "#3b82f6",
    energy: "low",
    energyPct: 15,
    priority: "medium",
    desc: "Ускоренная модель атмосферной циркуляции",
    deps: ["core_lite"],
    condition: "surface_temp > 253K",
    params: [
      { label: "Модель циркуляции", value: "3-ячеистая (Хэдли/Феррель/Пол.)" },
      { label: "N₂", value: "78%" },
      { label: "O₂", value: "21%" },
      { label: "CO₂", value: "400 ppm (фикс.)" },
      { label: "H₂O", value: "до 4% (переменная)" },
      { label: "T экватор", value: "+28°C" },
      { label: "T полюса", value: "−30°C" },
      { label: "Облачность", value: "60% (среднее)" },
      { label: "Осадки", value: "0–5 мм/день (случ.)" },
    ],
    config: `module_name: "atmos_fast"
version: "1.1"
energy_profile: low

circulation_model: "3_cell_idealized"
wind_speeds: "fixed_zonal_bands"

composition:
  N2: 78%
  O2: 21%
  CO2: 400 ppm
  H2O: "variable_humidity(max=4%)"

temperature_profile:
  equator: 28°C
  poles: -30°C
  gradient: -0.6°C/degree_latitude

cloud_cover: 60%
precipitation: "random_uniform(0-5 mm/day)"

dependencies: ["core_lite"]
activation_condition: "surface_temp > 253K"`,
  },
  {
    key: "hydro_simple",
    name: "hydro_simple",
    file: "hydro/hydro_simple_v1.cfg",
    icon: "Waves",
    color: "#06b6d4",
    energy: "very_low",
    energyPct: 8,
    priority: "low",
    desc: "Упрощённая гидросфера и водный цикл",
    deps: ["atmos_fast"],
    condition: "liquid_water_possible()",
    params: [
      { label: "Покрытие океанами", value: "71%" },
      { label: "Ср. глубина", value: "3 688 м" },
      { label: "Гольфстрим", value: "1 м/с, +5°C локально" },
      { label: "АЦТ", value: "0.5 м/с" },
      { label: "Испарение", value: "1 м/год" },
      { label: "Осадки", value: "1 м/год" },
      { label: "Коэф. стока", value: "0.3" },
    ],
    config: `module_name: "hydro_simple"
version: "1.0"
energy_profile: very_low

ocean_coverage: 71%
average_depth: 3688 m

currents:
  - name: "Gulf_Stream_like"
    speed: 1 m/s
    temperature_effect: +5°C locally
  - name: "Antarctic_Circumpolar"
    speed: 0.5 m/s

water_cycle:
  evaporation_rate: 1 m/year
  precipitation_rate: 1 m/year
  runoff_coefficient: 0.3

dependencies: ["atmos_fast"]
activation_condition: "liquid_water_possible()"`,
  },
  {
    key: "bio_stat",
    name: "bio_stat",
    file: "bio/bio_stat_v1.cfg",
    icon: "Leaf",
    color: "#22c55e",
    energy: "ultra_low",
    energyPct: 4,
    priority: "low",
    desc: "Статистическая модель биосферы и эволюции",
    deps: ["hydro_simple"],
    condition: "temperature_in_habitable_range()",
    params: [
      { label: "Биомасса тропики", value: "50 кг/м²" },
      { label: "Биомасса умерен.", value: "20 кг/м²" },
      { label: "Биомасса полярн.", value: "2 кг/м²" },
      { label: "Продукт. океан", value: "150 гС/м²/год" },
      { label: "Продукт. суша", value: "300 гС/м²/год" },
      { label: "Эволюция", value: "раз в 10 млн лет, ×1.5 разнообр." },
      { label: "Вымирание P", value: "0.01 / 100 млн лет" },
      { label: "Сток CO₂", value: "2 Гт/год" },
    ],
    config: `module_name: "bio_stat"
version: "1.2"
energy_profile: ultra_low

biomass_distribution:
  tropical: 50 kg/m^2
  temperate: 20 kg/m^2
  polar: 2 kg/m^2

primary_productivity:
  ocean: 150 gC/m^2/year
  land: 300 gC/m^2/year

evolution_events:
  frequency: 10e6 years
  diversity_increase: 1.5x per event
  mass_extinction_probability: 0.01 per 100e6 years

carbon_cycle:
  atmospheric_CO2_sink: 2 Gt/year
  organic_burial: 0.1 Gt/year

dependencies: ["hydro_simple"]
activation_condition: "temperature_in_habitable_range()"`,
  },
  {
    key: "climate_lite",
    name: "climate_lite",
    file: "climate/climate_lite_v1.cfg",
    icon: "Thermometer",
    color: "#f59e0b",
    energy: "low",
    energyPct: 12,
    priority: "medium",
    desc: "Облегчённый климатический баланс",
    deps: ["atmos_fast", "hydro_simple", "bio_stat"],
    condition: "always",
    params: [
      { label: "Формула T", value: "T₀ + 0.8·ln(CO₂/CO₂₀)" },
      { label: "T₀ (базовая)", value: "14°C" },
      { label: "CO₂ базовый", value: "280 ppm" },
      { label: "Лёд-альбедо", value: "+0.2" },
      { label: "Водяной пар", value: "+0.6" },
      { label: "Облака", value: "−0.1" },
      { label: "Эксцентрисит.", value: "sin(t, 100 тыс. лет)" },
      { label: "Прецессия", value: "sin(t, 23 тыс. лет)" },
    ],
    config: `module_name: "climate_lite"
version: "1.0"
energy_profile: low

temperature_calculation:
  formula: "T = T0 + 0.8 * ln(CO2/CO2_0)"
  T0: 14°C
  CO2_0: 280 ppm

feedback_coefficients:
  ice_albedo: 0.2
  water_vapor: 0.6
  clouds: -0.1

milankovitch_cycles:
  eccentricity: "sin(t, period=100e3 years)"
  obliquity: "const(23.5°)"
  precession: "sin(t, period=23e3 years)"

dependencies: ["atmos_fast", "hydro_simple", "bio_stat"]
activation_condition: "always"`,
  },
];

const BOOT_CONFIG = `simulation_name: "Earth_UltraLite_v1"
energy_budget: 1% of_full_simulation

modules:
  - file: "core/core_lite_v1.cfg"
    priority: high
  - file: "atmos/atmos_fast_v1.cfg"
    priority: medium
  - file: "hydro/hydro_simple_v1.cfg"
    priority: low
  - file: "bio/bio_stat_v1.cfg"
    priority: low
  - file: "climate/climate_lite_v1.cfg"
    priority: medium

execution_strategy:
  time_step: 1000 years
  parallelism: disabled
  precision: single_float

output:
  data_frequency: 1e6 years
  variables: [temperature, CO2, biodiversity_index]
  format: CSV`;

const ENERGY_COLOR: Record<string, string> = {
  ultra_low: "#00ff87",
  very_low: "#22c55e",
  low: "#f59e0b",
  medium: "#f97316",
  high: "#f43f5e",
};
const ENERGY_LABEL: Record<string, string> = {
  ultra_low: "Ультра-низкое",
  very_low: "Очень низкое",
  low: "Низкое",
  medium: "Среднее",
  high: "Высокое",
};

export default function EgsuEarth() {
  const nav = useNavigate();
  const [tab, setTab] = useState<TabKey>("overview");
  const [activeModule, setActiveModule] = useState<ModuleKey>("core_lite");
  const [simYear, setSimYear] = useState(0);
  const [simRunning, setSimRunning] = useState(false);
  const [simInterval, setSimIntervalRef] = useState<ReturnType<typeof setInterval> | null>(null);
  const [copied, setCopied] = useState(false);

  const mod = MODULES.find(m => m.key === activeModule)!;

  const totalEnergy = MODULES.reduce((s, m) => s + m.energyPct, 0);

  const startSim = () => {
    if (simRunning) {
      if (simInterval) clearInterval(simInterval);
      setSimIntervalRef(null);
      setSimRunning(false);
      return;
    }
    setSimRunning(true);
    const iv = setInterval(() => {
      setSimYear(y => {
        if (y >= 4600000000) { clearInterval(iv); setSimRunning(false); return y; }
        return y + 1000000;
      });
    }, 120);
    setSimIntervalRef(iv);
  };

  const resetSim = () => {
    if (simInterval) clearInterval(simInterval);
    setSimIntervalRef(null);
    setSimRunning(false);
    setSimYear(0);
  };

  const copyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getSimState = () => {
    const pct = simYear / 4600000000;
    if (simYear === 0) return { era: "Начало", t: "—", co2: "—", bio: "—" };
    if (pct < 0.1) return { era: "Хадей / Архей", t: "70°C", co2: "10 000 ppm", bio: "Абиотическая среда" };
    if (pct < 0.3) return { era: "Архей", t: "50°C", co2: "3 000 ppm", bio: "Прокариоты" };
    if (pct < 0.5) return { era: "Протерозой", t: "35°C", co2: "1 000 ppm", bio: "Эукариоты, водоросли" };
    if (pct < 0.7) return { era: "Палеозой", t: "22°C", co2: "500 ppm", bio: "Многоклеточные, растения" };
    if (pct < 0.85) return { era: "Мезозой", t: "20°C", co2: "1 200 ppm", bio: "Динозавры, рептилии" };
    if (pct < 0.98) return { era: "Кайнозой", t: "15°C", co2: "400 ppm", bio: "Млекопитающие, homo" };
    return { era: "Современность", t: "14°C", co2: "420 ppm", bio: "Цивилизация" };
  };

  const st = getSimState();
  const fmtYear = (y: number) => y === 0 ? "0" : y >= 1_000_000 ? `${(y / 1_000_000).toFixed(0)} млн лет` : `${y.toLocaleString()} лет`;
  const fmtAgo = (y: number) => y === 0 ? "—" : `${((4_600_000_000 - y) / 1_000_000).toFixed(0)} млн лет назад`;

  const [genomeView, setGenomeView] = useState<"visual" | "yaml">("visual");
  const [genomeCopied, setGenomeCopied] = useState(false);

  const copyGenome = () => {
    navigator.clipboard.writeText(GENOME_YAML);
    setGenomeCopied(true);
    setTimeout(() => setGenomeCopied(false), 1500);
  };

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "Обзор", icon: "Globe" },
    { key: "modules", label: "Модули", icon: "Layers" },
    { key: "genome", label: "Геном", icon: "Dna" },
    { key: "incidents", label: "Мониторинг", icon: "AlertTriangle" },
    { key: "config", label: "Конфиг", icon: "FileCode" },
    { key: "simulation", label: "Симуляция", icon: "Play" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e0e0", fontFamily: "Arial, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(0,200,100,0.2)", backdropFilter: "blur(20px)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => nav("/egsu/owner")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ArrowLeft" size={20} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#00c864,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🌍</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>Земля — Энергоэффективная симуляция</div>
          <div style={{ fontSize: 11, color: "#4b5563" }}>Earth UltraLite v1 · 5 модулей · ~1–5% от полной симуляции</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "rgba(0,200,100,0.1)", border: "1px solid rgba(0,200,100,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#00c864", fontWeight: 700 }}>
            ⚡ {totalEnergy}% энергии
          </div>
        </div>
      </nav>

      {/* TABS */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 2 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 18px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.key ? "#00c864" : "transparent"}`, color: tab === t.key ? "#00c864" : "rgba(255,255,255,0.35)", cursor: "pointer", fontWeight: tab === t.key ? 700 : 400, fontSize: 13, transition: "all 0.15s" }}>
              <Icon name={t.icon as "Globe"} size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── ОБЗОР ── */}
        {tab === "overview" && (
          <div>
            {/* Главная карточка */}
            <div style={{ background: "linear-gradient(135deg,rgba(0,200,100,0.06),rgba(14,165,233,0.06))", border: "1px solid rgba(0,200,100,0.2)", borderRadius: 16, padding: 28, marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Earth UltraLite v1</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 16 }}>
                    Энергоэффективная симуляция планеты Земля. Заменяет сложные уравнения на эмпирические зависимости, использует дискретные события вместо непрерывных расчётов и табличные данные вместо детального моделирования.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      { label: "Энергопотребление", value: "1–5% от полной", color: "#00c864" },
                      { label: "Ускорение", value: "в 1000× раз", color: "#3b82f6" },
                      { label: "Шаг расчёта", value: "1 000 лет", color: "#f59e0b" },
                      { label: "Запись данных", value: "раз в 1 млн лет", color: "#a855f7" },
                    ].map(b => (
                      <div key={b.label} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 14px" }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{b.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: b.color }}>{b.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ width: 180, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 8, textTransform: "uppercase" }}>Потребление по модулям</div>
                  {MODULES.map(m => (
                    <div key={m.key} style={{ marginBottom: 7 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: m.color }}>{m.name}</span>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>{m.energyPct}%</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(m.energyPct / 20) * 100}%`, background: m.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Стратегия экономии */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { icon: "Zap", color: "#f59e0b", title: "Упрощение физики", desc: "Эмпирические зависимости и табличные данные вместо сложных уравнений" },
                { icon: "Clock", color: "#3b82f6", title: "Редкая дискретизация", desc: "Тектоника — раз в 1 млн лет, климат — каждые 1 000 лет" },
                { icon: "MapPin", color: "#00c864", title: "Локальные расчёты", desc: "Моделирование только нужных регионов, не всей планеты сразу" },
                { icon: "BarChart", color: "#a855f7", title: "Статистические модели", desc: "Средние значения и распределения вместо отслеживания каждого объекта" },
                { icon: "Download", color: "#06b6d4", title: "Отложенная загрузка", desc: "Модуль биосферы активируется только при подходящей температуре" },
              ].map(s => (
                <div key={s.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <Icon name={s.icon as "Zap"} size={16} color={s.color} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Применение */}
            <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#00c864", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="Target" size={14} color="#00c864" /> Где применять
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { icon: "GraduationCap", label: "Образовательные симуляции", color: "#3b82f6" },
                  { icon: "Code", label: "Быстрые прототипы", color: "#a855f7" },
                  { icon: "Search", label: "Предварительные исследования", color: "#f59e0b" },
                  { icon: "Gamepad2", label: "Игры и интерактивные приложения", color: "#00c864" },
                ].map(a => (
                  <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                    <Icon name={a.icon as "Code"} size={14} color={a.color} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── МОДУЛИ ── */}
        {tab === "modules" && (
          <div style={{ display: "flex", gap: 20 }}>
            {/* Список модулей */}
            <div style={{ width: 220, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: "#4b5563", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Порядок загрузки</div>
              {MODULES.map((m, i) => (
                <button key={m.key} onClick={() => setActiveModule(m.key)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: activeModule === m.key ? `${m.color}12` : "rgba(255,255,255,0.02)", border: `1px solid ${activeModule === m.key ? m.color + "50" : "rgba(255,255,255,0.05)"}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", marginBottom: 6, textAlign: "left" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `${m.color}18`, border: `1px solid ${m.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={m.icon as "Layers"} size={13} color={m.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: activeModule === m.key ? m.color : "#e0e0e0" }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: "#4b5563" }}>#{i + 1} · {m.priority}</div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: ENERGY_COLOR[m.energy], flexShrink: 0 }} />
                </button>
              ))}

              {/* Легенда энергии */}
              <div style={{ marginTop: 14, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 8 }}>ПОТРЕБЛЕНИЕ</div>
                {Object.entries(ENERGY_LABEL).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: ENERGY_COLOR[k] }} />
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Детали модуля */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: `${mod.color}08`, border: `1px solid ${mod.color}30`, borderRadius: 16, overflow: "hidden" }}>
                {/* Шапка */}
                <div style={{ background: `${mod.color}12`, borderBottom: `1px solid ${mod.color}20`, padding: "16px 22px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${mod.color}18`, border: `2px solid ${mod.color}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={mod.icon as "Layers"} size={22} color={mod.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{mod.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{mod.file}</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <div style={{ background: `${ENERGY_COLOR[mod.energy]}15`, border: `1px solid ${ENERGY_COLOR[mod.energy]}40`, borderRadius: 20, padding: "4px 12px", fontSize: 11, color: ENERGY_COLOR[mod.energy], fontWeight: 700 }}>
                      {ENERGY_LABEL[mod.energy]}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      {mod.energyPct}% бюджета
                    </div>
                  </div>
                </div>

                <div style={{ padding: "20px 22px" }}>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>{mod.desc}</div>

                  {/* Параметры */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                    {mod.params.map(p => (
                      <div key={p.label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{p.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: mod.color }}>{p.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Зависимости и условие */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", marginBottom: 6 }}>Зависимости</div>
                      {mod.deps.length === 0 ? (
                        <span style={{ fontSize: 12, color: "#00c864" }}>Нет (базовый модуль)</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {mod.deps.map(d => (
                            <span key={d} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 200, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", marginBottom: 6 }}>Условие активации</div>
                      <code style={{ fontSize: 12, color: mod.color, fontFamily: "monospace" }}>{mod.condition}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ГЕНОМ ── */}
        {tab === "genome" && (
          <div>
            {/* Шапка */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Terra_Genome_v3.0</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>4.543 млрд лет · 6 сегментов · 13 генов · energy_budget: 1.2×10³⁴ Дж</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setGenomeView("visual")}
                  style={{ padding: "6px 14px", background: genomeView === "visual" ? "rgba(0,200,100,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${genomeView === "visual" ? "rgba(0,200,100,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, color: genomeView === "visual" ? "#00c864" : "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 12, fontWeight: genomeView === "visual" ? 700 : 400 }}>
                  Визуально
                </button>
                <button onClick={() => setGenomeView("yaml")}
                  style={{ padding: "6px 14px", background: genomeView === "yaml" ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${genomeView === "yaml" ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, color: genomeView === "yaml" ? "#a855f7" : "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 12, fontWeight: genomeView === "yaml" ? 700 : 400 }}>
                  YAML
                </button>
                <button onClick={copyGenome}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>
                  <Icon name={genomeCopied ? "Check" : "Copy"} size={12} color={genomeCopied ? "#00c864" : undefined} />
                  {genomeCopied ? "Скопировано" : "Копировать"}
                </button>
              </div>
            </div>

            {genomeView === "visual" && (
              <div>
                {/* Сегменты генома */}
                {GENOME_SEGMENTS.map(seg => (
                  <div key={seg.name} style={{ background: `${seg.color}06`, border: `1px solid ${seg.color}25`, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ background: `${seg.color}10`, borderBottom: `1px solid ${seg.color}20`, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${seg.color}18`, border: `1px solid ${seg.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={seg.icon as "Zap"} size={14} color={seg.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: seg.color }}>{seg.label}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>segment: {seg.name} · {seg.genes.length} генов</div>
                      </div>
                    </div>
                    <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8 }}>
                      {seg.genes.map(gene => (
                        <div key={gene.id} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: SEV_COLOR[gene.status] || "#374151", marginTop: 4, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 3 }}>
                              <code style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{gene.id}</code>
                              <span style={{ fontSize: 10, color: SEV_COLOR[gene.status] || "#374151", background: `${SEV_COLOR[gene.status] || "#374151"}15`, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>{SEV_LABEL[gene.status] || gene.status}</span>
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{gene.fn.replace(/_/g, " ")}</div>
                            <code style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{gene.rate}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Параметры среды */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 4 }}>
                  {[
                    { label: "Диапазон температур", value: "−89°C … +57°C", color: "#f43f5e", icon: "Thermometer" },
                    { label: "Диапазон давления", value: "0.006 … 1 000 бар", color: "#3b82f6", icon: "Gauge" },
                    { label: "Индекс обитаемости", value: "Высокий", color: "#00c864", icon: "Heart" },
                  ].map(e => (
                    <div key={e.label} style={{ background: `${e.color}08`, border: `1px solid ${e.color}25`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon name={e.icon as "Thermometer"} size={16} color={e.color} />
                      <div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{e.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: e.color }}>{e.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {genomeView === "yaml" && (
              <div style={{ background: "#0d1117", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ background: "rgba(168,85,247,0.06)", borderBottom: "1px solid rgba(168,85,247,0.15)", padding: "10px 18px" }}>
                  <code style={{ fontSize: 12, color: "#a855f7" }}>terra_genome_v3.0.yaml</code>
                </div>
                <pre style={{ margin: 0, padding: "20px 24px", fontSize: 12, lineHeight: 1.7, color: "#e2e8f0", overflowX: "auto", fontFamily: "monospace", maxHeight: 600, overflowY: "auto" }}>{GENOME_YAML}</pre>
              </div>
            )}
          </div>
        )}

        {/* ── МОНИТОРИНГ ИНЦИДЕНТОВ ── */}
        {tab === "incidents" && (
          <div>
            {/* Шапка статуса */}
            <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>incident_monitor v1.3</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>energy_profile: ultra_low · strategy: event_driven</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 20, padding: "6px 14px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f43f5e", animation: "pulse 1.5s infinite" }} />
                  <span style={{ fontSize: 12, color: "#f43f5e", fontWeight: 700 }}>2 критических инцидента активны</span>
                </div>
              </div>

              {/* Счётчики по уровням */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {[
                  { label: "Критично", count: 2, color: "#f43f5e", icon: "AlertOctagon" },
                  { label: "Высокий", count: 1, color: "#f97316", icon: "AlertTriangle" },
                  { label: "Предупреждение", count: 1, color: "#f59e0b", icon: "Bell" },
                  { label: "Средний", count: 1, color: "#3b82f6", icon: "Info" },
                ].map(s => (
                  <div key={s.label} style={{ background: `${s.color}08`, border: `1px solid ${s.color}25`, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                    <Icon name={s.icon as "Bell"} size={16} color={s.color} />
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.count}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правила мониторинга */}
            <div style={{ fontSize: 11, color: "#4b5563", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Правила обнаружения ({INCIDENT_RULES.length})
            </div>
            {INCIDENT_RULES.map((rule, idx) => (
              <div key={rule.type} style={{ background: rule.active ? `${SEV_COLOR[rule.severity]}06` : "rgba(255,255,255,0.02)", border: `1px solid ${rule.active ? SEV_COLOR[rule.severity] + "30" : "rgba(255,255,255,0.05)"}`, borderRadius: 13, padding: "16px 20px", marginBottom: 10, position: "relative", overflow: "hidden" }}>
                {rule.active && (
                  <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: SEV_COLOR[rule.severity] }} />
                )}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${SEV_COLOR[rule.severity]}15`, border: `1px solid ${SEV_COLOR[rule.severity]}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: SEV_COLOR[rule.severity] }}>{idx + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{rule.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: SEV_COLOR[rule.severity], background: `${SEV_COLOR[rule.severity]}15`, borderRadius: 4, padding: "1px 7px", border: `1px solid ${SEV_COLOR[rule.severity]}35` }}>
                        {SEV_LABEL[rule.severity]}
                      </span>
                      {rule.active && (
                        <span style={{ fontSize: 10, color: "#f43f5e", background: "rgba(244,63,94,0.1)", borderRadius: 4, padding: "1px 7px", border: "1px solid rgba(244,63,94,0.3)" }}>● АКТИВЕН</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>ГЕН: </span>
                        <code style={{ color: "#a855f7" }}>{rule.gene}</code>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>УСЛОВИЕ: </span>
                        <code style={{ color: "#f59e0b" }}>{rule.condition}</code>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>ДЕЙСТВИЯ:</span>
                      {rule.actions.map(a => (
                        <code key={a} style={{ fontSize: 10, color: "#06b6d4", background: "rgba(6,182,212,0.08)", borderRadius: 5, padding: "1px 7px", border: "1px solid rgba(6,182,212,0.2)" }}>{a}</code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Как работает */}
            <div style={{ background: "rgba(0,200,100,0.04)", border: "1px solid rgba(0,200,100,0.15)", borderRadius: 13, padding: 18, marginTop: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#00c864", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="Cpu" size={14} color="#00c864" /> Стратегия мониторинга
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8 }}>
                {[
                  { icon: "Zap", color: "#f59e0b", title: "Event-driven", desc: "Проверки только при изменениях, не постоянно — экономия ресурсов" },
                  { icon: "Database", color: "#3b82f6", title: "Минимум данных", desc: "Только ключевые параметры генов, без лишних метрик" },
                  { icon: "ArrowUpDown", color: "#a855f7", title: "Приоритеты", desc: "Критические инциденты обрабатываются в первую очередь" },
                  { icon: "Code", color: "#06b6d4", title: "Простая логика", desc: "Простые сравнения вместо сложных вычислений" },
                  { icon: "FileJson", color: "#00c864", title: "YAML-формат", desc: "Компактный формат — меньше памяти и нагрузки на парсер" },
                ].map(s => (
                  <div key={s.title} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Icon name={s.icon as "Zap"} size={12} color={s.color} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.title}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── КОНФИГ ── */}
        {tab === "config" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {MODULES.map(m => (
                <button key={m.key} onClick={() => setActiveModule(m.key)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: activeModule === m.key ? `${m.color}15` : "rgba(255,255,255,0.03)", border: `1px solid ${activeModule === m.key ? m.color + "50" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: activeModule === m.key ? 700 : 400, color: activeModule === m.key ? m.color : "rgba(255,255,255,0.4)" }}>
                  <Icon name={m.icon as "Layers"} size={12} color={activeModule === m.key ? m.color : undefined} />
                  {m.name}
                </button>
              ))}
              <button onClick={() => setActiveModule("core_lite")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,200,100,0.2)", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#00c864", marginLeft: "auto" }}>
                <Icon name="FileCode" size={12} color="#00c864" /> boot-файл ↓
              </button>
            </div>

            {/* Конфиг текущего модуля */}
            <div style={{ background: "#0d1117", border: `1px solid ${mod.color}30`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ background: `${mod.color}0a`, borderBottom: `1px solid ${mod.color}20`, padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name={mod.icon as "Layers"} size={14} color={mod.color} />
                  <code style={{ fontSize: 12, color: mod.color }}>{mod.file}</code>
                </div>
                <button onClick={() => copyConfig(mod.config)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "4px 10px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 11 }}>
                  <Icon name={copied ? "Check" : "Copy"} size={11} color={copied ? "#00c864" : undefined} />
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              </div>
              <pre style={{ margin: 0, padding: "18px 22px", fontSize: 12, lineHeight: 1.7, color: "#e2e8f0", overflowX: "auto", fontFamily: "monospace" }}>{mod.config}</pre>
            </div>

            {/* Boot-файл */}
            <div style={{ background: "#0d1117", border: "1px solid rgba(0,200,100,0.2)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "rgba(0,200,100,0.05)", borderBottom: "1px solid rgba(0,200,100,0.15)", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <code style={{ fontSize: 12, color: "#00c864" }}>earth_sim_ultra_lite.boot</code>
                <button onClick={() => copyConfig(BOOT_CONFIG)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "4px 10px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 11 }}>
                  <Icon name="Copy" size={11} /> Копировать
                </button>
              </div>
              <pre style={{ margin: 0, padding: "18px 22px", fontSize: 12, lineHeight: 1.7, color: "#e2e8f0", overflowX: "auto", fontFamily: "monospace" }}>{BOOT_CONFIG}</pre>
            </div>
          </div>
        )}

        {/* ── СИМУЛЯЦИЯ ── */}
        {tab === "simulation" && (
          <div>
            {/* Управление */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
              <button onClick={startSim}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: simRunning ? "rgba(244,63,94,0.15)" : "linear-gradient(135deg,#00c864,#0ea5e9)", border: simRunning ? "1px solid rgba(244,63,94,0.4)" : "none", borderRadius: 10, color: simRunning ? "#f43f5e" : "#000", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                <Icon name={simRunning ? "Pause" : "Play"} size={16} />
                {simRunning ? "Пауза" : "Запустить"}
              </button>
              <button onClick={resetSim}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>
                <Icon name="RotateCcw" size={14} /> Сброс
              </button>
              <div style={{ marginLeft: "auto", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                Шаг: <span style={{ color: "#fff", fontWeight: 700 }}>1 000 лет/тик</span>
              </div>
            </div>

            {/* Прогресс времени */}
            <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
                <span>4.6 млрд лет назад</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{fmtAgo(simYear)}</span>
                <span>Сейчас</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ height: "100%", width: `${(simYear / 4_600_000_000) * 100}%`, background: "linear-gradient(90deg,#f43f5e,#f59e0b,#22c55e,#3b82f6,#00c864)", borderRadius: 8, transition: "width 0.1s" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#00c864" }}>{fmtYear(simYear)}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>от начала формирования планеты</div>
              </div>
            </div>

            {/* Текущее состояние */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Геологическая эра", value: st.era, icon: "Mountain", color: "#f59e0b" },
                { label: "Средняя температура", value: st.t, icon: "Thermometer", color: "#f43f5e" },
                { label: "CO₂ в атмосфере", value: st.co2, icon: "Wind", color: "#3b82f6" },
                { label: "Биосфера", value: st.bio, icon: "Leaf", color: "#22c55e" },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}08`, border: `1px solid ${s.color}25`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Icon name={s.icon as "Mountain"} size={14} color={s.color} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Активные модули */}
            <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: "#4b5563", textTransform: "uppercase", marginBottom: 12 }}>Активные модули</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {MODULES.map(m => {
                  const active = simYear > 0 && (m.condition === "always" || simYear > 500_000_000);
                  return (
                    <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: active ? `${m.color}12` : "rgba(255,255,255,0.02)", border: `1px solid ${active ? m.color + "40" : "rgba(255,255,255,0.05)"}`, borderRadius: 8, fontSize: 12 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: active ? m.color : "#374151" }} />
                      <span style={{ color: active ? m.color : "#374151", fontWeight: active ? 700 : 400 }}>{m.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}