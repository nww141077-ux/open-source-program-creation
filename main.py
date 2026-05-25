from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

def find_project_path():
    # Ищем путь к рабочему столу
    desktop = os.path.join(os.path.expanduser("~"), "Desktop")
    # Проверяем возможные места расположения
    variants = [
        os.path.join(desktop, "ECSU DALAN", "dalan1"),
        os.path.join(os.path.expanduser("~"), "Desktop", "ECSU DALAN", "dalan1"),
        "C:/Users/user/Desktop/ECSU DALAN/dalan1"
    ]
    for v in variants:
        if os.path.exists(v):
            return v
    return None

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("--- ИНТЕЛЛЕКТУАЛЬНЫЙ СКАНЕР ЕЦСУ ---")
    while True:
        try:
            data = await websocket.receive_text()
            if data.lower().strip() == "scan":
                path = find_project_path()
                if not path:
                    await websocket.send_text("❌ ОШИБКА: Папка 'ECSU DALAN/dalan1' не найдена на Рабочем столе.")
                    continue
                
                await websocket.send_text(f"📡 ЦЕЛЬ ОБНАРУЖЕНА: {path}")
                files = {
                    "Frontend (src)": os.path.join(path, "src"),
                    "Backend": os.path.join(path, "backend"),
                    "Author DNA": os.path.join(path, "src/core/author.ts")
                }
                for name, p in files.items():
                    status = "✅ НАЙДЕНО" if os.path.exists(p) else "❌ ОТСУТСТВУЕТ"
                    await websocket.send_text(f"📁 {name}: {status}")
                await websocket.send_text("--- СКАН ЗАВЕРШЕН ---")
        except WebSocketDisconnect:
            break

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
