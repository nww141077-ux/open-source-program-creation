-- VIP анонимные обращения
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_vip_reports (
  id SERIAL PRIMARY KEY,
  hash VARCHAR(20) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  subject_position VARCHAR(255),
  subject_org VARCHAR(255),
  description TEXT NOT NULL,
  evidence_desc TEXT,
  target_org VARCHAR(255) NOT NULL,
  urgency VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(30) DEFAULT 'registered',
  ecsu_organ_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Органы системы ECSU для приёма обращений граждан
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_organs (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name TEXT,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  competence TEXT,
  contact_email VARCHAR(255),
  contact_internal VARCHAR(100),
  response_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  icon VARCHAR(50) DEFAULT 'Shield',
  color VARCHAR(20) DEFAULT '#00ff87',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Наполнение органов ECSU
INSERT INTO t_p38294978_open_source_program_.egsu_organs
  (code, name, full_name, category, description, competence, contact_internal, response_days, icon, color, sort_order)
VALUES
  ('OGR-GENERAL',    'Главный орган ECSU',              'Главный орган реагирования ECSU 2.0',                           'general',    'Принимает все обращения, распределяет по профильным органам',        'Все категории обращений граждан',                              'ECSU-MAIN',     30, 'LayoutDashboard', '#00ff87', 1),
  ('OGR-ECOLOGY',    'Орган экологии ECSU',             'Орган мониторинга экологических нарушений ECSU 2.0',            'ecology',    'Рассматривает обращения по загрязнению, вырубке, ущербу природе',   'Экологические нарушения, ФЗ №7, Орхусская конвенция',         'ECSU-ECO',      30, 'Leaf',            '#10b981', 2),
  ('OGR-CYBER',      'Орган киберзащиты ECSU',          'Орган реагирования на кибератаки и цифровые угрозы ECSU 2.0',   'cyber',      'Фиксирует кибератаки, утечки данных, вредоносное ПО',             'Киберпреступления, УК РФ ст. 272–274, ФЗ №149',               'ECSU-CYBER',    15, 'Monitor',         '#2196F3', 3),
  ('OGR-RIGHTS',     'Орган прав человека ECSU',        'Орган защиты прав и свобод граждан ECSU 2.0',                   'rights',     'Рассматривает нарушения прав, дискриминацию, произвол',           'Конституция РФ ст. 17–64, ЕКПЧ, ФЗ №59',                      'ECSU-RIGHTS',   30, 'Heart',           '#ec4899', 4),
  ('OGR-ANTI-CORR',  'Антикоррупционный орган ECSU',    'Орган противодействия коррупции ECSU 2.0',                      'corruption', 'Принимает сообщения о взятках, превышении полномочий, злоупотреблениях','ФЗ №273, УК РФ ст. 290–291, 285, UNCAC',                  'ECSU-ACORR',    15, 'ShieldOff',       '#f59e0b', 5),
  ('OGR-SECURITY',   'Орган безопасности ECSU',         'Орган физической и информационной безопасности ECSU 2.0',       'security',   'Угрозы жизни, слежка, незаконные задержания, нарушения силовых структур','УК РФ ст. 286, 302; ФЗ «О полиции»',                     'ECSU-SEC',       7, 'Shield',          '#a855f7', 6),
  ('OGR-FINANCE',    'Финансовый орган ECSU',            'Орган мониторинга финансовых нарушений ECSU 2.0',              'finance',    'Финансовые махинации, мошенничество, незаконные операции',         'УК РФ ст. 159, 172, 174; ФЗ №115',                            'ECSU-FIN',      30, 'TrendingDown',    '#f59e0b', 7),
  ('OGR-EMERGENCY',  'Орган ЧС и экстренного реагирования ECSU','Орган чрезвычайного реагирования ECSU 2.0',            'emergency',  'Техногенные и природные катастрофы, угрозы жизни',                'ФЗ №68, ФЗ №69, КоАП РФ ст. 20.6',                            'ECSU-EMER',      3, 'AlertTriangle',   '#f43f5e', 8),
  ('OGR-LEGAL',      'Правовой орган ECSU',              'Орган правовой поддержки граждан ECSU 2.0',                    'legal',      'Правовые консультации, помощь в составлении обращений',           'Конституция РФ; ФЗ №59; международные конвенции',              'ECSU-LEGAL',    30, 'Scale',           '#3b82f6', 9),
  ('OGR-MEDIA',      'Медиа и информационный орган ECSU','Орган информационной свободы и защиты журналистов ECSU 2.0',   'media',      'Цензура, блокировки, нарушения свободы слова, давление на СМИ',   'Закон о СМИ ст. 41; Конституция РФ ст. 29; ЕКПЧ ст. 10',     'ECSU-MEDIA',    30, 'Newspaper',       '#06b6d4', 10);

-- Обращения граждан в органы ECSU
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_citizen_appeals (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(25) UNIQUE NOT NULL,
  organ_code VARCHAR(30) NOT NULL,
  category VARCHAR(50),
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  evidence_desc TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(30) DEFAULT 'new',
  response_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
