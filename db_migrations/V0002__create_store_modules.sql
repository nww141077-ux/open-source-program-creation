CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.store_modules (
  id VARCHAR(60) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  version VARCHAR(20),
  size VARCHAR(20),
  icon VARCHAR(60),
  popular BOOLEAN DEFAULT false,
  installed BOOLEAN DEFAULT false,
  installed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO t_p38294978_open_source_program_.store_modules
  (id, name, description, category, version, size, icon, popular, installed)
VALUES
  ('firewall-pro','Firewall Pro','Расширенный межсетевой экран с фильтрацией трафика по правилам и геолокации','Безопасность','2.4.1','1.2 MB','Shield',true,false),
  ('intrusion-detect','IDS Monitor','Система обнаружения вторжений в реальном времени с уведомлениями','Безопасность','1.8.0','890 KB','Eye',false,false),
  ('analytics-core','Analytics Core','Сбор и визуализация метрик системы: CPU, RAM, сеть, диск','Аналитика','3.1.2','2.1 MB','BarChart3',true,false),
  ('log-analyzer','Log Analyzer','Парсинг и анализ системных логов с поиском аномалий','Аналитика','1.5.3','650 KB','FileSearch',false,false),
  ('telegram-notify','Telegram Alerts','Отправка уведомлений о событиях системы в Telegram-бот','Интеграции','1.2.0','320 KB','Send',true,false),
  ('webhook-bridge','Webhook Bridge','Проброс событий ECSU во внешние системы через HTTP Webhook','Интеграции','2.0.1','410 KB','Webhook',false,false),
  ('vpn-gateway','VPN Gateway','Туннелирование трафика через защищённый VPN-шлюз','Сеть','1.9.0','3.4 MB','Network',false,false),
  ('dns-filter','DNS Filter','Фильтрация DNS-запросов и блокировка вредоносных доменов','Сеть','1.1.4','780 KB','Globe',false,false),
  ('backup-scheduler','Backup Scheduler','Автоматическое резервное копирование конфигураций по расписанию','Утилиты','2.2.0','540 KB','CalendarClock',false,false),
  ('crypto-vault','Crypto Vault','Шифрование чувствительных данных и управление ключами','Безопасность','1.0.5','1.8 MB','KeyRound',false,false)
ON CONFLICT (id) DO NOTHING;
