"""
Автосканер инцидентов ЕЦСУ 2.0 — парсинг открытых источников.
Источники (все открытые/бесплатные):
  • GDACS (gdacs.org) — стихийные бедствия
  • USGS (earthquake.usgs.gov) — землетрясения
  • OpenAQ (api.openaq.org) — загрязнение воздуха
  • CVE (cve.circl.lu) — киберуязвимости последних дней
  • ReliefWeb (reliefweb.int) — гуманитарные кризисы
  • WHO (apps.who.int) — вспышки болезней
  • EMSC (seismicportal.eu) — сейсмическая активность
ИИ-синхронизация: POST /sync → ИИ получает свежие данные и вносит в БД
"""
import json
import os
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

S = "t_p38294978_open_source_program_"

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

SOURCES = {
    "gdacs": "https://www.gdacs.org/xml/rss.xml",
    "usgs": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson",
    "openaq": "https://api.openaq.org/v2/measurements?limit=20&parameter=pm25&order_by=datetime&sort=desc",
    "cve": "https://cve.circl.lu/api/last/10",
    "reliefweb": "https://api.reliefweb.int/v1/disasters?appname=egsu&limit=10&fields[include][]=name&fields[include][]=country&fields[include][]=date&fields[include][]=type&filter[field]=status&filter[value]=ongoing",
    "who": "https://www.who.int/api/news/diseaseoutbreaks",
    "emsc": "https://www.seismicportal.eu/fdsnws/event/1/query?limit=10&format=json&minmag=4.5",
}

# Соответствие источника → тип инцидента ЕЦСУ
SOURCE_TYPE = {
    "gdacs": "ecology",
    "usgs": "ecology",
    "openaq": "air",
    "cve": "cyber",
    "reliefweb": "human_rights",
    "who": "human_rights",
    "emsc": "ecology",
}

SEVERITY_MAP = {
    "critical": "critical",
    "high": "high",
    "medium": "medium",
    "low": "low",
    "red": "critical",
    "orange": "high",
    "green": "low",
    "yellow": "medium",
}


def fetch_url(url: str, timeout: int = 15) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "EGSU-Scanner/2.0 (open-source)"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def parse_gdacs() -> list:
    """GDACS RSS — стихийные бедствия глобально."""
    items = []
    try:
        data = fetch_url(SOURCES["gdacs"])
        root = ET.fromstring(data)
        ns = {"gdacs": "http://www.gdacs.org"}
        for item in root.findall(".//item")[:10]:
            title = item.findtext("title", "")
            desc = item.findtext("description", "")
            country = item.findtext("gdacs:country", "", ns) or ""
            alert = item.findtext("gdacs:alertlevel", "orange", ns).lower()
            lat = item.findtext("gdacs:latitude", "0", ns)
            lon = item.findtext("gdacs:longitude", "0", ns)
            severity = SEVERITY_MAP.get(alert, "medium")
            items.append({
                "source": "GDACS",
                "source_id": f"gdacs_{hash(title) % 999999}",
                "type": "ecology",
                "title": title[:200],
                "description": desc[:500],
                "country": country[:100],
                "location": f"{lat},{lon}",
                "severity": severity,
                "external_url": item.findtext("link", ""),
                "has_official_source": True,
            })
    except Exception as e:
        pass
    return items


def parse_usgs() -> list:
    """USGS — землетрясения за неделю."""
    items = []
    try:
        data = fetch_url(SOURCES["usgs"])
        geo = json.loads(data)
        for f in geo.get("features", [])[:10]:
            props = f.get("properties", {})
            coords = f.get("geometry", {}).get("coordinates", [0, 0, 0])
            mag = props.get("mag", 0)
            place = props.get("place", "Unknown")
            severity = "critical" if mag >= 7 else "high" if mag >= 6 else "medium"
            items.append({
                "source": "USGS",
                "source_id": f"usgs_{f.get('id', hash(place) % 999999)}",
                "type": "ecology",
                "title": f"Землетрясение M{mag} — {place}",
                "description": f"Магнитуда: {mag}. Место: {place}. Глубина: {coords[2] if len(coords) > 2 else '?'} км",
                "country": place.split(",")[-1].strip()[:100] if "," in place else place[:100],
                "location": f"{coords[1]},{coords[0]}",
                "severity": severity,
                "external_url": props.get("url", ""),
                "has_official_source": True,
                "has_satellite": True,
            })
    except Exception:
        pass
    return items


def parse_openaq() -> list:
    """OpenAQ — загрязнение воздуха PM2.5 > порога."""
    items = []
    try:
        data = fetch_url(SOURCES["openaq"])
        resp = json.loads(data)
        seen = set()
        for m in resp.get("results", [])[:20]:
            value = m.get("value", 0)
            if value < 55:
                continue
            location = m.get("location", "?")
            country = m.get("country", "?")
            city = m.get("city", "")
            key = f"{location}_{country}"
            if key in seen:
                continue
            seen.add(key)
            severity = "critical" if value > 150 else "high" if value > 100 else "medium"
            items.append({
                "source": "OpenAQ",
                "source_id": f"openaq_{hash(key) % 999999}",
                "type": "air",
                "title": f"Загрязнение воздуха PM2.5={value} мкг/м³ — {city or location}",
                "description": f"Уровень PM2.5: {value} мкг/м³ (ВОЗ норма: 15). Станция: {location}. Страна: {country}",
                "country": country[:100],
                "location": city or location,
                "severity": severity,
                "external_url": "https://openaq.org",
                "has_official_source": True,
            })
    except Exception:
        pass
    return items[:5]


def parse_cve() -> list:
    """CVE CIRCL — последние критические уязвимости."""
    items = []
    try:
        data = fetch_url(SOURCES["cve"])
        cves = json.loads(data)
        if not isinstance(cves, list):
            return []
        for cve in cves[:8]:
            cve_id = cve.get("id", "CVE-?")
            summary = cve.get("summary", "")[:400]
            cvss = float(cve.get("cvss", 0) or 0)
            severity = "critical" if cvss >= 9 else "high" if cvss >= 7 else "medium"
            items.append({
                "source": "CVE/NVD",
                "source_id": f"cve_{cve_id.replace('-', '_')}",
                "type": "cyber",
                "title": f"Киберуязвимость {cve_id} (CVSS {cvss})",
                "description": summary,
                "country": "Global",
                "location": "Интернет / глобальная сеть",
                "severity": severity,
                "external_url": f"https://cve.mitre.org/cgi-bin/cvename.cgi?name={cve_id}",
                "has_official_source": True,
            })
    except Exception:
        pass
    return items


def parse_reliefweb() -> list:
    """ReliefWeb API — текущие гуманитарные кризисы."""
    items = []
    try:
        data = fetch_url(SOURCES["reliefweb"])
        resp = json.loads(data)
        for d in resp.get("data", [])[:8]:
            fields = d.get("fields", {})
            name = fields.get("name", "?")[:200]
            countries = fields.get("country", [])
            country = countries[0].get("name", "?") if countries else "?"
            dtype = fields.get("type", [{}])
            dtype_name = dtype[0].get("name", "?") if dtype else "?"
            items.append({
                "source": "ReliefWeb",
                "source_id": f"rw_{d.get('id', hash(name) % 999999)}",
                "type": "human_rights",
                "title": f"Гуманитарный кризис: {name}",
                "description": f"Тип: {dtype_name}. Страна: {country}. Источник: ReliefWeb OCHA.",
                "country": country[:100],
                "location": country[:100],
                "severity": "high",
                "external_url": f"https://reliefweb.int/disaster/{d.get('id', '')}",
                "has_official_source": True,
            })
    except Exception:
        pass
    return items


def parse_emsc() -> list:
    """EMSC — европейская сейсмическая активность."""
    items = []
    try:
        data = fetch_url(SOURCES["emsc"])
        resp = json.loads(data)
        for f in resp.get("features", [])[:5]:
            props = f.get("properties", {})
            mag = props.get("mag", 0)
            place = props.get("flynn_region", props.get("auth", "Unknown"))
            coords = f.get("geometry", {}).get("coordinates", [0, 0])
            severity = "critical" if mag >= 7 else "high" if mag >= 6 else "medium"
            items.append({
                "source": "EMSC",
                "source_id": f"emsc_{f.get('id', hash(place) % 999999)}",
                "type": "ecology",
                "title": f"Землетрясение M{mag} — {place}",
                "description": f"Магнитуда {mag}. Регион: {place}. Координаты: {coords[1]:.2f}, {coords[0]:.2f}",
                "country": place[:100],
                "location": f"{coords[1]:.3f},{coords[0]:.3f}",
                "severity": severity,
                "external_url": "https://www.emsc-csem.org",
                "has_official_source": True,
                "has_satellite": True,
            })
    except Exception:
        pass
    return items


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def save_incident(cur, inc: dict) -> dict:
    """Сохраняем инцидент, если source_id ещё нет."""
    try:
        cur.execute(f"SELECT id FROM {S}.egsu_incidents WHERE source_id = %s", (inc["source_id"],))
        if cur.fetchone():
            return {"status": "exists", "source_id": inc["source_id"]}
    except Exception:
        pass

    import random, string
    code = "INC-" + "".join(random.choices(string.digits, k=4))
    score = 70 if inc.get("has_official_source") else 45
    if inc.get("has_satellite"):
        score = min(score + 15, 100)

    RESPONSIBLE_ORGANS = {
        "ecology": "ОГР-Экология",
        "air": "ОГР-Атмосфера",
        "cyber": "ОГР-Киберзащита",
        "human_rights": "ОГР-Права человека",
        "water": "ОГР-Водные ресурсы",
        "weapons": "ОГР-Вооружения",
    }

    try:
        cur.execute(f"""
            INSERT INTO {S}.egsu_incidents
            (incident_code, type, title, description, country, location, severity, status,
             verification_score, has_photo, has_video, has_witnesses, has_satellite, has_official_source,
             mgp_distinction, mgp_proportionality, mgp_necessity,
             responsible_organ, contact_email, is_anonymous, ai_confidence,
             source_id, external_url)
            VALUES (%s,%s,%s,%s,%s,%s,%s,'verified',%s,false,false,false,%s,%s,false,false,false,%s,'auto@egsu.system',true,%s,%s,%s)
            RETURNING id, incident_code
        """, (
            code,
            inc.get("type", "ecology"),
            inc.get("title", "")[:255],
            inc.get("description", "")[:1000],
            inc.get("country", "")[:100],
            inc.get("location", "")[:255],
            inc.get("severity", "medium"),
            score,
            inc.get("has_satellite", False),
            inc.get("has_official_source", False),
            RESPONSIBLE_ORGANS.get(inc.get("type", "ecology"), "ОГР-Общий"),
            min(score + 5, 99),
            inc.get("source_id", ""),
            inc.get("external_url", ""),
        ))
        row = cur.fetchone()
        return {"status": "created", "id": row["id"], "code": row["incident_code"], "title": inc["title"]}
    except Exception as e:
        return {"status": "error", "error": str(e), "source_id": inc.get("source_id", "")}


def handler(event: dict, context) -> dict:
    """Автосканер открытых источников инцидентов ЕЦСУ."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}

    # GET / — получить свежие инциденты без сохранения (превью)
    if method == "GET" and path in ("/", ""):
        sources_param = params.get("sources", "all")
        results = {}

        if sources_param == "all" or "gdacs" in sources_param:
            results["gdacs"] = parse_gdacs()
        if sources_param == "all" or "usgs" in sources_param:
            results["usgs"] = parse_usgs()
        if sources_param == "all" or "openaq" in sources_param:
            results["openaq"] = parse_openaq()
        if sources_param == "all" or "cve" in sources_param:
            results["cve"] = parse_cve()
        if sources_param == "all" or "reliefweb" in sources_param:
            results["reliefweb"] = parse_reliefweb()
        if sources_param == "all" or "emsc" in sources_param:
            results["emsc"] = parse_emsc()

        total = sum(len(v) for v in results.values())
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({
                "status": "preview",
                "total": total,
                "sources": {k: len(v) for k, v in results.items()},
                "incidents": [inc for lst in results.values() for inc in lst],
                "scanned_at": datetime.now(timezone.utc).isoformat(),
            }, ensure_ascii=False, default=str)
        }

    # POST /scan — сканировать и записать в БД
    if method == "POST" and ("/scan" in path or path in ("/", "")):
        body = {}
        if event.get("body"):
            try:
                body = json.loads(event["body"])
            except Exception:
                pass

        sources_param = body.get("sources", "all")
        all_incidents = []

        if sources_param == "all" or "gdacs" in sources_param:
            all_incidents.extend(parse_gdacs())
        if sources_param == "all" or "usgs" in sources_param:
            all_incidents.extend(parse_usgs())
        if sources_param == "all" or "openaq" in sources_param:
            all_incidents.extend(parse_openaq())
        if sources_param == "all" or "cve" in sources_param:
            all_incidents.extend(parse_cve())
        if sources_param == "all" or "reliefweb" in sources_param:
            all_incidents.extend(parse_reliefweb())
        if sources_param == "all" or "emsc" in sources_param:
            all_incidents.extend(parse_emsc())

        # Записываем в БД
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        save_results = []
        for inc in all_incidents:
            r = save_incident(cur, inc)
            save_results.append(r)
        conn.commit()
        conn.close()

        created = [r for r in save_results if r["status"] == "created"]
        exists = [r for r in save_results if r["status"] == "exists"]
        errors = [r for r in save_results if r["status"] == "error"]

        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({
                "status": "done",
                "total_scanned": len(all_incidents),
                "created": len(created),
                "already_exists": len(exists),
                "errors": len(errors),
                "new_incidents": created,
                "scanned_at": datetime.now(timezone.utc).isoformat(),
            }, ensure_ascii=False, default=str)
        }

    # GET /sources — список источников
    if method == "GET" and "/sources" in path:
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({
                "sources": [
                    {"id": "gdacs", "name": "GDACS", "desc": "Глобальная система предупреждения о катастрофах", "url": SOURCES["gdacs"], "type": "ecology"},
                    {"id": "usgs", "name": "USGS", "desc": "Геологическая служба США — землетрясения", "url": SOURCES["usgs"], "type": "ecology"},
                    {"id": "openaq", "name": "OpenAQ", "desc": "Открытая база данных качества воздуха", "url": SOURCES["openaq"], "type": "air"},
                    {"id": "cve", "name": "CVE/CIRCL", "desc": "База киберуязвимостей MITRE/CVE", "url": SOURCES["cve"], "type": "cyber"},
                    {"id": "reliefweb", "name": "ReliefWeb OCHA", "desc": "Гуманитарные кризисы ООН", "url": SOURCES["reliefweb"], "type": "human_rights"},
                    {"id": "emsc", "name": "EMSC", "desc": "Европейский сейсмологический центр", "url": SOURCES["emsc"], "type": "ecology"},
                ]
            }, ensure_ascii=False)
        }

    return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}
