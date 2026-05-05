from fastapi import FastAPI, WebSocket, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import uuid
from datetime import datetime
import asyncio
import httpx
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
import logging
from logging.handlers import RotatingFileHandler

# --- Модели данных ---
class Incident(BaseModel):
    id: str = str(uuid.uuid4())
    description: str
    source_agent: str
    category: str
    criticality: float
    coordinates: List[float]
    priority: int
    timestamp: datetime = datetime.utcnow()
    status: str = "reported"
    region_specific_data: Optional[Dict] = None

class ConflictResolution(BaseModel):
    incident_id: str
    conflicting_agents: List[str]
    resolution_strategy: str
    resolved_by: str = "Dalan-1"
    resolution_timestamp: datetime = datetime.utcnow()

class ResourceAllocation(BaseModel):
    incident_id: str
    assigned_agents: List[str]
    resources_allocated: Dict[str, int]
    execution_plan: List[Dict]

class AgentStatus(BaseModel):
    agent_id: str
    status: str
    last_heartbeat: datetime
    incidents_processed: int
    system_load: float
# --- Настройка логирования ---
logger = logging.getLogger("Dalan1")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler(
    'dalan1.log',
    maxBytes=10*1024*1024,  # 10 МБ
    backupCount=5
)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# --- Модели полушарий ---
class LeftHemisphere(nn.Module):
    def __init__(self, hidden_size=768):
        super(LeftHemisphere, self).__init__()
        self.bert = AutoModel.from_pretrained('cointegrated/rubert-tiny2')
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128)
        )

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        return self.classifier(pooled_output)

class RightHemisphere(nn.Module):
    def __init__(self, hidden_size=128):
        super(RightHemisphere, self).__init__()
        self.criticality_predictor = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.Tanh(),
            nn.Linear(64, 32)
        )
        self.geolocation_predictor = nn.Linear(hidden_size, 2)

    def forward(self, left_features):
        criticality = self.criticality_predictor(left_features)
        geolocation = self.geolocation_predictor(left_features)
        return criticality, geolocation

class OsrvPart(nn.Module):
    def __init__(self, feature_size=32, output_size=5):
        super(OsrvPart, self).__init__()
        self.fusion = nn.Linear(feature_size + 2, 64)
        self.decision = nn.Linear(64, output_size)
        self.attention = nn.Linear(64, 2)

    def forward(self, left_out, criticality, geolocation):
        combined = torch.cat([left_out, criticality, geolocation], dim=1)
        fused = F.relu(self.fusion(combined))
        attention_weights = F.softmax(self.attention(fused), dim=1)
        final_decision = self.decision(fused)
        return final_decision, attention_weights

class Dalan1Model(nn.Module):
    def __init__(self):
        super(Dalan1Model, self).__init__()
        self.left_hemisphere = LeftHemisphere()
        self.right_hemisphere = RightHemisphere()
        self.osrv_part = OsrvPart()

    def forward(self, input_ids, attention_mask):
        left_out = self.left_hemisphere(input_ids, attention_mask)
        criticality, geolocation = self.right_hemisphere(left_out)
        final_decision, attention = self.osrv_part(left_out, criticality, geolocation)
        return {
            'decision': final_decision,
            'attention': attention,
            'criticality': criticality,
            'geolocation': geolocation
        }

# --- Координатор ---
class Dalan1Coordinator:
    def __init__(self):
        self.agents: Dict[str, str] = {
            "RusAI": "http://rusai.api:8001",
            "USAAI": "http://usai.api:8002",
            "ChinaAI": "http://chinaai.api:8003",
            "EuroAI": "http://euroai.api:8004",
            "AfriAI": "http://afriai.api:8005",
            "SAIAI": "http://saiai.api:8006",
            "OceanAI": "http://oceanai.api:8007",
            "MidEastAI": "http://mideastai.api:8008",
            "SEAsiaAI": "http://seasiaai.api:8009",
            "IndiaAI": "http://indiaai.api:8010",
            "NAmerAI": "http://namerai.api:8011"
        }
        self.global_knowledge_base: Dict[str, Incident] = {}
        self.conflict_log: List[ConflictResolution] = []
        self.model = Dalan1Model()
        self.tokenizer = AutoTokenizer.from_pretrained('cointegrated/rubert-tiny2')
        self.model.eval()

    # ... (все методы из предыдущего блока)

# Инициализация координатора
dalan1 = Dalan1Coordinator()

# --- WebSocket‑соединения ---
websocket_connections: List[WebSocket] = []

@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await websocket.accept()
    websocket_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Обработка входящих сообщений (если нужно)
    except Exception as e:
        if websocket in websocket_connections:
            websocket_connections.remove(websocket)

async def broadcast_notification(message: str):
    """Рассылка уведомлений всем подключённым клиентам"""
    disconnected = []
    for connection in websocket_connections:
        try:
            await connection.send_text(message)
        except Exception:
            disconnected.append(connection)
    # Удаляем разорванные соединения
    for conn in disconnected:
        if conn in websocket_connections:
            websocket_connections.remove(conn)

# --- Эндпоинты API ---
@app.post("/api/v1/dalan1/incident")
async def receive_incident(incident_data: Dict):
    """Приём инцидента от национального ИИ"""
    result = await dalan1.process_incident(incident_data)
    return result

@app.get("/api/v1/dalan1/global-dashboard")
async def global_dashboard():
    """Глобальная панель мониторинга"""
    stats = {
        "total_incidents": len(dalan1.global_knowledge_base),
        "active_conflicts": len([c for c in dalan1.conflict_log if c.resolution_strategy != "Resolved"]),
        "by_region": {},
        "by_category": {},
        "criticality_distribution": {
            "high": 0,
            "medium": 0,
            "low": 0
        }
    }
    for incident in dalan1.global_knowledge_base.values():
        region = incident.source_agent
        stats["by_region"][region] = stats["by_region"].get(region, 0) + 1
        category = incident.category
        stats["by_category"][category] = stats["by_category"].get(category, 0) + 1
        if incident.criticality >= 0.7:
            stats["criticality_distribution"]["high"] += 1
        elif incident.criticality >= 0.4:
            stats["criticality_distribution"]["medium"] += 1
        else:
            stats["criticality_distribution"]["low"] += 1
    return stats

@app.get("/api/v1/dalan1/incidents")
async def get_all_incidents():
    """Получение всех инцидентов"""
    return list(dalan1.global_knowledge_base.values())

@app.post("/api/v1/dalan1/command")
async def issue_global_command(command: Dict):
    """«Далан‑1» отдаёт глобальные команды агентам"""
    target_agent = command.get("target_agent")
    command_type = command.get("command_type")
    if target_agent and target_agent in dalan1.agents:
        agent_url = dalan1.
 # ... продолжение предыдущего кода

@app.post("/api/v1/dalan1/command")
async def issue_global_command(command: Dict):
    """«Далан‑1» отдаёт глобальные команды агентам"""
    target_agent = command.get("target_agent")
    command_type = command.get("command_type")

    if target_agent and target_agent in dalan1.agents:
        agent_url = dalan1.agents[target_agent]
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{agent_url}/command",
            json=command
        )
            logger.info(f"Команда отправлена агенту {target_agent}: {command_type}")
            return {"status": "command_sent", "target": target_agent, "command": command_type}
        except Exception as e:
            logger.error(f"Ошибка отправки команды агенту {target_agent}: {e}")
            raise HTTPException(status_code=500, detail="Failed to send command to agent")
    else:
        raise HTTPException(status_code=404, detail="Agent not found")

@app.get("/api/v1/dalan1/conflicts")
async def get_conflicts():
    """Просмотр всех конфликтов и их статусов"""
    return dalan1.conflict_log

@app.get("/api/v1/dalan1/agents/status")
async def get_all_agent_statuses():
    """Получение статусов всех агентов"""
    return list(agent_statuses.values())

@app.post("/api/v1/dalan1/agent/heartbeat")
async def agent_heartbeat(status: AgentStatus):
    """Проверка жизнеспособности агентов (heartbeat)"""
    agent_statuses[status.agent_id] = status
    logger.info(f"Heartbeat от агента {status.agent_id}: {status.status}")
    return {"status": "heartbeat_received"}

@app.get("/api/v1/dalan1/notifications/test")
async def send_test_notification():
    """Отправка тестового уведомления всем подключённым клиентам"""
    message = f"ТЕСТ: Система Далан‑1 активна. Время: {datetime.utcnow().isoformat()}"
    await broadcast_notification(message)
    return {"status": "notification_sent", "message": message}

@app.get("/")
async def serve_dashboard():
    """Главная страница — панель мониторинга"""
    with open("dashboard.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# --- Запуск приложения ---
if __name__ == "__main__":
    import uvicorn

    # Предварительная загрузка модели
    logger.info("Загрузка модели Далан‑1...")
    # Модель уже инициализирована в Dalan1Coordinator

    logger.info("Запуск сервера Далан‑1...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )import time

def handler(event, context=None):
    # event — это то, что мы присылаем из Барнаула
    # Если event не словарь (бывает в разных облаках), пробуем его понять
    data = event if isinstance(event, dict) else {}
    action = data.get('action', 'status')
    
    start_time = time.perf_counter()

    # --- ЛОГИКА ДИСПЕТЧЕРА ---
    
    if action == 'status':
        return {
            "status": "ONLINE",
            "system": "CORTEX-PRIME",
            "node": "Poehali_Cloud",
            "location": "Global",
            "msg": "Маяк активен, жду команды Архитектора"
        }

    elif action == 'call_home':
        # Команда для переключения на локальный "Муссон" на диске D
        return {
            "instruction": "REDIRECT_TO_LOCAL",
            "local_ip": "127.0.0.1:5005",
            "info": "Переходим на бортовое управление (110 ГБ)"
        }

    elif action == 'dalan_predict':
        # Здесь будет экспресс-анализ, если не хотим грузить локальный ПК
        return {
            "result": "Cloud_Analysis_Complete",
            "compute_time": f"{(time.perf_counter() - start_time):.4f}s"
        }

    return {"error": "Unknown command", "received": action}

       