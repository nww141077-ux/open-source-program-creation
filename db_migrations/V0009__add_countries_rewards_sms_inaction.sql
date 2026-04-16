-- Страны-участницы системы ЕЦСУ
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_countries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) NOT NULL UNIQUE,
  name_ru VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  region VARCHAR(100),
  contact_ministry VARCHAR(300),
  contact_email VARCHAR(200),
  contact_phone VARCHAR(100),
  contact_address TEXT,
  appeal_url TEXT,
  un_member BOOLEAN DEFAULT TRUE,
  legal_basis TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Типы вознаграждений за содействие
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_reward_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name_ru VARCHAR(300) NOT NULL,
  description TEXT,
  legal_basis TEXT,
  min_amount_rub NUMERIC(15,2) DEFAULT 0,
  max_amount_rub NUMERIC(15,2),
  percentage_of_damage NUMERIC(5,2),
  currency VARCHAR(10) DEFAULT 'RUB',
  conditions TEXT,
  payer VARCHAR(200),
  active BOOLEAN DEFAULT TRUE
);

-- Запросы на выплату вознаграждения
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_reward_requests (
  id SERIAL PRIMARY KEY,
  reward_type_id INTEGER REFERENCES t_p38294978_open_source_program_.egsu_reward_types(id),
  incident_id INTEGER REFERENCES t_p38294978_open_source_program_.egsu_incidents(id),
  applicant_name VARCHAR(300) NOT NULL DEFAULT 'Николаев Владимир Владимирович',
  applicant_address TEXT,
  bank_name VARCHAR(300),
  bank_account VARCHAR(100),
  bank_bik VARCHAR(20),
  card_number VARCHAR(50),
  amount_requested_rub NUMERIC(15,2),
  legal_basis TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  agency_sent_to VARCHAR(200),
  agency_response TEXT,
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Мониторинг бездействия ведомств
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_inaction_monitor (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES t_p38294978_open_source_program_.egsu_incidents(id),
  agency_id VARCHAR(100) NOT NULL,
  agency_name VARCHAR(300),
  appeal_sent_at TIMESTAMP,
  deadline_at TIMESTAMP,
  response_received BOOLEAN DEFAULT FALSE,
  response_at TIMESTAMP,
  response_text TEXT,
  inaction_detected BOOLEAN DEFAULT FALSE,
  corruption_suspected BOOLEAN DEFAULT FALSE,
  ai_analysis TEXT,
  ai_recommendation TEXT,
  escalation_sent BOOLEAN DEFAULT FALSE,
  escalation_to VARCHAR(200),
  escalation_at TIMESTAMP,
  penalty_recommended_rub NUMERIC(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS-рассылки
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_sms_log (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  agency VARCHAR(200),
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(50) DEFAULT 'smsc',
  provider_id VARCHAR(100),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Вставляем базовые типы вознаграждений
INSERT INTO t_p38294978_open_source_program_.egsu_reward_types (code, name_ru, description, legal_basis, min_amount_rub, max_amount_rub, percentage_of_damage, conditions, payer) VALUES
('corruption_whistleblower', 'Вознаграждение за сообщение о коррупции', 'Выплата за предоставление сведений, подтверждённых в ходе расследования', 'ФЗ №273 «О противодействии коррупции», ст.10; Указ Президента РФ №537; Постановление Правительства №17', 10000, 5000000, NULL, 'Факт коррупции подтверждён следователем. Сведения предоставлены добровольно и своевременно.', 'ФСБ России / МВД России'),
('ecology_damage_report', 'Вознаграждение за выявление экологического ущерба', 'За информацию, повлёкшую устранение экологического нарушения', 'ФЗ №7 «Об охране окружающей среды», ст.77; КоАП ст.8.1–8.3; Орхусская конвенция', 5000, 500000, 10.00, 'Факт нарушения подтверждён Росприроднадзором. Ущерб взыскан.', 'Росприроднадзор / Орган исполнения'),
('cyber_incident_report', 'Вознаграждение за выявление киберугрозы', 'За предотвращение кибератаки на государственные системы', 'ФЗ №149 «Об информации», ст.17; Доктрина информационной безопасности РФ', 50000, 3000000, NULL, 'Угроза верифицирована НКЦКИ / ФСБ. Атака предотвращена.', 'ФСБ России / НКЦКИ'),
('human_rights_contribution', 'Компенсация за содействие в защите прав граждан', 'За документирование и сообщение о нарушениях прав человека', 'Конституция РФ ст.33; ФЗ №59; ЕКПЧ ст.13', 3000, 100000, NULL, 'Нарушение подтверждено. Гражданин содействовал восстановлению прав.', 'Уполномоченный по правам человека'),
('emergency_response_assist', 'Вознаграждение за помощь при ЧС', 'За содействие в ликвидации последствий чрезвычайной ситуации', 'ФЗ №68 «О защите населения от ЧС», ст.24; Постановление Правительства №794', 5000, 200000, NULL, 'Участие зафиксировано МЧС. Ликвидация подтверждена.', 'МЧС России');

-- Вставляем страны-участницы
INSERT INTO t_p38294978_open_source_program_.egsu_countries (code, name_ru, name_en, region, contact_ministry, contact_email, contact_phone, contact_address, appeal_url, legal_basis) VALUES
('RUS', 'Россия', 'Russia', 'Евразия', 'МЧС России / Генеральная прокуратура РФ', 'genproc@genproc.gov.ru', '8-800-250-77-55', '125993, г. Москва, ул. Большая Дмитровка, д. 15А', 'https://epp.genproc.gov.ru', 'Конституция РФ, ФЗ №59, ФЗ №273'),
('UNO', 'ООН (Организация Объединённых Наций)', 'United Nations', 'Международная', 'Управление ООН по правам человека (УВКПЧ)', 'ohchr-info@un.org', '+41 22 917 9220', 'Palais des Nations, CH-1211 Geneva 10, Switzerland', 'https://www.ohchr.org/ru/complaint-procedure', 'Устав ООН, Всеобщая декларация прав человека'),
('EUR', 'Европейский союз', 'European Union', 'Европа', 'Европейская комиссия / OLAF (антифрод)', 'olaf-fraud-notification@ec.europa.eu', '+32 2 299 11 11', 'European Commission, Rue de la Loi 200, B-1049 Brussels', 'https://ec.europa.eu/anti-fraud/contact_ru', 'Устав ЕС, GDPR, Директива о защите информаторов 2019/1937'),
('DEU', 'Германия', 'Germany', 'Европа', 'Федеральное ведомство уголовной полиции (BKA)', 'bka@bka.de', '+49 611 55 0', 'Bundeskriminalamt, 65173 Wiesbaden, Germany', 'https://www.bka.de/DE/Kontakt/kontakt_node.html', 'Strafgesetzbuch (StGB), Umweltstrafrecht'),
('FRA', 'Франция', 'France', 'Европа', 'TRACFIN (финразведка) / Министерство экологии', 'tracfin@finances.gouv.fr', '+33 1 40 04 10 00', '86-92 allée de Bercy, 75012 Paris, France', 'https://www.tracfin.gouv.fr/contact', 'Code pénal, Loi Sapin II'),
('GBR', 'Великобритания', 'United Kingdom', 'Европа', 'National Crime Agency (NCA)', 'ukhtc@nationalcrimeagency.gov.uk', '+44 370 496 7622', 'National Crime Agency, PO Box 5561, London', 'https://www.nationalcrimeagency.gov.uk/contact-us', 'Proceeds of Crime Act, Environmental Protection Act'),
('CHN', 'Китай', 'China', 'Азия', 'Министерство охраны окружающей среды Китая', 'info@mee.gov.cn', '+86 10 66556006', '5 Houyingfang Hutong, Xicheng District, Beijing 100035', 'http://www.mee.gov.cn', 'Закон об охране окружающей среды КНР'),
('USA', 'США', 'United States', 'Северная Америка', 'EPA (Агентство по охране окружающей среды) / FBI', 'r10publicnotices@epa.gov', '+1 202 564 4700', 'EPA, 1200 Pennsylvania Avenue NW, Washington DC 20460', 'https://www.epa.gov/report-environmental-violations', 'Clean Air Act, False Claims Act, Foreign Corrupt Practices Act'),
('INT', 'Интерпол', 'Interpol', 'Международная', 'Интерпол — Генеральный секретариат', 'complaints@interpol.int', '+33 4 72 44 70 00', '200 quai Charles de Gaulle, 69006 Lyon, France', 'https://www.interpol.int/en/Crimes', 'Устав Интерпола, Конвенция ООН против коррупции (UNCAC)'),
('ICC', 'МУС (Международный уголовный суд)', 'International Criminal Court', 'Международная', 'Канцелярия Прокурора МУС', 'otp.informationdesk@icc-cpi.int', '+31 70 515 8515', 'PO Box 19519, 2500 CM The Hague, Netherlands', 'https://www.icc-cpi.int/get-involved/submit-communications', 'Римский статут, Женевские конвенции');
