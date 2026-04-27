-- Персонал органов EGSU (гражданская позиция)
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_organ_members (
  id SERIAL PRIMARY KEY,
  organ_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'Участник',
  position VARCHAR(255),
  is_owner BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Диалог / чат внутри органа (гражданская позиция)
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_organ_dialog (
  id SERIAL PRIMARY KEY,
  organ_code VARCHAR(50) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(100) DEFAULT 'Участник',
  is_owner BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  msg_type VARCHAR(30) DEFAULT 'message',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Внешние контакты органов власти для взаимодействия
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_external_contacts (
  id SERIAL PRIMARY KEY,
  agency_name VARCHAR(255) NOT NULL,
  agency_short VARCHAR(50),
  country VARCHAR(50) DEFAULT 'РФ',
  category VARCHAR(50),
  address TEXT,
  phone VARCHAR(100),
  email VARCHAR(255),
  website VARCHAR(255),
  reception_info TEXT,
  online_form_url VARCHAR(500),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organ_members_code ON t_p38294978_open_source_program_.egsu_organ_members(organ_code);
CREATE INDEX IF NOT EXISTS idx_organ_dialog_code ON t_p38294978_open_source_program_.egsu_organ_dialog(organ_code);

-- Владелец системы — добавляем во все органы как участника
INSERT INTO t_p38294978_open_source_program_.egsu_organ_members
  (organ_code, full_name, role, position, is_owner)
VALUES
  ('OGR-GENERAL',   'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-ECOLOGY',   'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-CYBER',     'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-RIGHTS',    'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-ANTI-CORR', 'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-SECURITY',  'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-FINANCE',   'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-EMERGENCY', 'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-LEGAL',     'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true),
  ('OGR-MEDIA',     'Николаев Владимир Владимирович', 'Владелец системы', 'Основатель EGSU 2.0', true);

-- Реальные внешние контакты органов власти
INSERT INTO t_p38294978_open_source_program_.egsu_external_contacts
  (agency_name, agency_short, country, category, address, phone, email, website, reception_info, online_form_url, notes)
VALUES
  -- МВД России
  ('Министерство внутренних дел РФ', 'МВД России', 'РФ', 'law_enforcement',
   '119049, Москва, ул. Житная, д. 16', '8-800-222-74-47', NULL,
   'https://мвд.рф', 'Телефон доверия: 8-800-222-74-47 (бесплатно)',
   'https://мвд.рф/request_main', 'Интернет-приёмная работает круглосуточно'),

  -- ФСБ России
  ('Федеральная служба безопасности РФ', 'ФСБ России', 'РФ', 'security',
   '107031, Москва, Лубянская пл., д. 2', '8 (495) 224-22-22', NULL,
   'https://www.fsb.ru', 'Приёмная ФСБ: пн-пт 10:00-17:00',
   'https://www.fsb.ru/fsb/webreception.htm', 'Обращения принимаются через интернет-приёмную'),

  -- Министерство обороны России
  ('Министерство обороны РФ', 'Минобороны России', 'РФ', 'defense',
   '119160, Москва, ул. Знаменка, д. 19', '8 (495) 696-88-88', NULL,
   'https://function.mil.ru', 'Приёмная Минобороны: 8 (495) 696-88-88',
   'https://mil.ru/petition.htm', NULL),

  -- Генеральная прокуратура
  ('Генеральная прокуратура РФ', 'Генпрокуратура', 'РФ', 'justice',
   '125993, Москва, ул. Большая Дмитровка, д. 15а', '8 (800) 250-08-03', 'genproc@genproc.gov.ru',
   'https://epp.genproc.gov.ru', 'Телефон: 8-800-250-08-03 (бесплатно)',
   'https://epp.genproc.gov.ru/web/app/citizens/reception', NULL),

  -- Следственный комитет
  ('Следственный комитет РФ', 'СК России', 'РФ', 'justice',
   '105005, Москва, Технический пер., д. 2', '8 (495) 986-28-80', 'priemnaya@sledcom.ru',
   'https://sledcom.ru', 'Приём граждан: пн-пт 9:00-18:00',
   'https://sledcom.ru/reception/internet_reception', NULL),

  -- Росгвардия
  ('Федеральная служба войск национальной гвардии РФ', 'Росгвардия', 'РФ', 'security',
   '111250, Москва, ул. Красноказарменная, д. 9А', '8 (495) 542-00-01', NULL,
   'https://rosgvard.ru', 'Приёмная: 8 (495) 542-00-01',
   'https://rosgvard.ru/ru/page/index/obrashheniya-grazhdan', NULL),

  -- ЦРУ (США)
  ('Central Intelligence Agency', 'CIA', 'США', 'intelligence',
   'CIA, Washington, D.C. 20505, USA', '+1-703-482-0623', NULL,
   'https://www.cia.gov', 'Public Affairs Office: +1-703-482-0623',
   'https://www.cia.gov/contact-cia/', 'Контактная форма на официальном сайте'),

  -- ФБР (США)
  ('Federal Bureau of Investigation', 'FBI', 'США', 'law_enforcement',
   'J. Edgar Hoover Building, 935 Pennsylvania Ave NW, Washington, DC 20535', '+1-202-324-3000', NULL,
   'https://www.fbi.gov', 'Main switchboard: +1-202-324-3000',
   'https://tips.fbi.gov', 'Подача информации через tips.fbi.gov'),

  -- Интерпол
  ('International Criminal Police Organization', 'ИНТЕРПОЛ', 'Международная', 'international',
   '200 quai Charles de Gaulle, 69006 Lyon, France', '+33-4-72-44-70-00', NULL,
   'https://www.interpol.int', 'Штаб-квартира в Лионе, Франция',
   'https://www.interpol.int/en/Who-we-are/Legal-framework/Contact-INTERPOL', NULL),

  -- ООН
  ('Организация Объединённых Наций', 'ООН / UN', 'Международная', 'international',
   'United Nations Headquarters, New York, NY 10017, USA', '+1-212-963-1234', NULL,
   'https://www.un.org', 'Центральные учреждения в Нью-Йорке',
   'https://www.un.org/en/about-us/contact-us', NULL),

  -- ОБСЕ
  ('Организация по безопасности и сотрудничеству в Европе', 'ОБСЕ / OSCE', 'Международная', 'international',
   'Wallnerstrasse 6, A-1010 Vienna, Austria', '+43-1-514-36-0', 'info@osce.org',
   'https://www.osce.org', 'Секретариат: Вена, Австрия',
   'https://www.osce.org/contacts', NULL),

  -- МУС
  ('Международный уголовный суд', 'МУС / ICC', 'Международная', 'justice',
   'Oude Waalsdorperweg 10, 2597 AK The Hague, Netherlands', '+31-70-515-8515', 'informationdesk@icc-cpi.int',
   'https://www.icc-cpi.int', 'Гаага, Нидерланды',
   'https://www.icc-cpi.int/about/contact', NULL),

  -- МИД России
  ('Министерство иностранных дел РФ', 'МИД России', 'РФ', 'diplomacy',
   '119200, Москва, Смоленская-Сенная пл., д. 32/34', '8 (499) 244-16-06', 'mid@mid.ru',
   'https://www.mid.ru', 'Консульский департамент: 8 (499) 244-16-06',
   'https://www.mid.ru/ru/reception/', NULL),

  -- Уполномоченный по правам человека
  ('Уполномоченный по правам человека в РФ', 'Омбудсмен РФ', 'РФ', 'rights',
   '101000, Москва, ул. Мясницкая, д. 47', '8 (495) 607-18-64', 'info@ombudsmanrf.org',
   'https://ombudsmanrf.org', 'Приём: пн-пт 10:00-17:00',
   'https://ombudsmanrf.org/citizens/request/new', NULL);
