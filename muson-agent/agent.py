"""
ECSU Мусон-Агент v1.0
Запускается на ПК при старте Windows.
Открывает локальный сервер, подключается к ECSU и передаёт данные о ПК и папке D:\Мусон.

Установка:
  1. Установи Python 3.10+ с python.org
  2. pip install flask flask-cors requests psutil watchdog
  3. Запусти: python agent.py
  4. Для автозапуска: добавь ярлык в Пуск -> Автозагрузка (Win+R -> shell:startup)
"""

import os
import sys
import json
import time
import hashlib
import platform
import threading
import subprocess
from pathlib import Path
from datetime import datetime

import psutil
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ============================================================
# КОНФИГУРАЦИЯ
# ============================================================
MUSON_PATH = Path("D:/Мусон")
AGENT_PORT = 7749
ECSU_SYNC_URL = "https://functions.poehali.dev/muson-agent-sync"
AGENT_ID = hashlib.md5(platform.node().encode()).hexdigest()[:12]
SYNC_INTERVAL = 30  # секунд между авто-синхронизацией

app = Flask(__name__)
CORS(app, origins="*")

# ============================================================
# СОСТОЯНИЕ АГЕНТА
# ============================================================
state = {
    "started_at": datetime.now().isoformat(),
    "last_sync": None,
    "files_synced": 0,
    "status": "online",
}


# ============================================================
# УТИЛИТЫ
# ============================================================
def get_pc_info():
    cpu = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    disk_d = None
    try:
        disk_d = psutil.disk_usage("D:/")
        disk_d = {
            "total_gb": round(disk_d.total / 1e9, 1),
            "used_gb":  round(disk_d.used  / 1e9, 1),
            "free_gb":  round(disk_d.free  / 1e9, 1),
            "percent":  disk_d.percent,
        }
    except Exception:
        disk_d = {"error": "Диск D не найден"}

    return {
        "hostname":    platform.node(),
        "os":          platform.system() + " " + platform.release(),
        "agent_id":    AGENT_ID,
        "cpu_percent": cpu,
        "ram_total_gb": round(mem.total / 1e9, 1),
        "ram_used_gb":  round(mem.used  / 1e9, 1),
        "ram_percent":  mem.percent,
        "disk_d":       disk_d,
        "uptime_sec":   int(time.time() - psutil.boot_time()),
        "status":       state["status"],
        "started_at":   state["started_at"],
        "last_sync":    state["last_sync"],
    }


def scan_muson_folder():
    if not MUSON_PATH.exists():
        return {"error": f"Папка {MUSON_PATH} не найдена", "files": []}
    files = []
    for f in MUSON_PATH.rglob("*"):
        if f.is_file():
            try:
                stat = f.stat()
                files.append({
                    "name":         f.name,
                    "path":         str(f.relative_to(MUSON_PATH)),
                    "size_kb":      round(stat.st_size / 1024, 1),
                    "modified":     datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "extension":    f.suffix.lower(),
                })
            except Exception:
                pass
    return {"path": str(MUSON_PATH), "count": len(files), "files": files}


def push_to_ecsu():
    """Отправляет данные ПК и папки на ECSU-сервер."""
    try:
        payload = {
            "agent_id": AGENT_ID,
            "pc":       get_pc_info(),
            "muson":    scan_muson_folder(),
            "ts":       datetime.now().isoformat(),
        }
        r = requests.post(ECSU_SYNC_URL, json=payload, timeout=10)
        state["last_sync"] = datetime.now().isoformat()
        state["files_synced"] = payload["muson"].get("count", 0)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Синхронизация OK — файлов: {state['files_synced']}")
        return True
    except Exception as e:
        print(f"[WARN] Синхронизация не удалась: {e}")
        return False


# ============================================================
# WATCHDOG — следит за изменениями в D:\Мусон
# ============================================================
class MusonWatcher(FileSystemEventHandler):
    def on_any_event(self, event):
        if not event.is_directory:
            print(f"[Мусон] Изменение: {event.src_path}")
            threading.Thread(target=push_to_ecsu, daemon=True).start()


# ============================================================
# FLASK API (сайт обращается сюда напрямую)
# ============================================================
@app.route("/", methods=["GET"])
def index():
    return jsonify({"agent": "ECSU Мусон-Агент", "version": "1.0", "status": "online"})

@app.route("/status", methods=["GET"])
def status():
    return jsonify(get_pc_info())

@app.route("/muson", methods=["GET"])
def muson():
    return jsonify(scan_muson_folder())

@app.route("/muson/open", methods=["POST"])
def open_muson():
    """Открывает папку D:\Мусон в Проводнике."""
    try:
        subprocess.Popen(f'explorer "{MUSON_PATH}"')
        return jsonify({"ok": True, "message": "Папка открыта"})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/muson/run", methods=["POST"])
def run_file():
    """Запускает файл из папки D:\Мусон по имени."""
    data = request.json or {}
    filename = data.get("file", "")
    filepath = MUSON_PATH / filename
    if not filepath.exists():
        return jsonify({"ok": False, "error": "Файл не найден"}), 404
    try:
        os.startfile(str(filepath))
        return jsonify({"ok": True, "message": f"Запущено: {filename}"})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/sync", methods=["POST"])
def sync():
    """Принудительная синхронизация."""
    ok = push_to_ecsu()
    return jsonify({"ok": ok, "last_sync": state["last_sync"]})

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"pong": True, "agent_id": AGENT_ID, "ts": datetime.now().isoformat()})


# ============================================================
# ФОНОВАЯ АВТО-СИНХРОНИЗАЦИЯ
# ============================================================
def auto_sync_loop():
    time.sleep(3)
    while True:
        push_to_ecsu()
        time.sleep(SYNC_INTERVAL)


# ============================================================
# ЗАПУСК
# ============================================================
def main():
    print("=" * 50)
    print("  ECSU Мусон-Агент v1.0")
    print(f"  Агент ID: {AGENT_ID}")
    print(f"  Папка Мусон: {MUSON_PATH}")
    print(f"  Порт: {AGENT_PORT}")
    print("=" * 50)

    # Watchdog на папку Мусон
    if MUSON_PATH.exists():
        observer = Observer()
        observer.schedule(MusonWatcher(), str(MUSON_PATH), recursive=True)
        observer.start()
        print(f"[OK] Слежу за изменениями в {MUSON_PATH}")
    else:
        print(f"[WARN] Папка {MUSON_PATH} не найдена — создай её на диске D")

    # Авто-синхронизация в фоне
    threading.Thread(target=auto_sync_loop, daemon=True).start()

    # Flask-сервер
    print(f"[OK] Агент запущен на http://localhost:{AGENT_PORT}")
    app.run(host="0.0.0.0", port=AGENT_PORT, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
