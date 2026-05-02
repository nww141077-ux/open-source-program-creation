from fastapi import FastAPI, WebSocket, HTTPException
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

# --- Создание приложения FastAPI ---
app = FastAPI(title="Dalan-1 Global Incident Management System")

# Список WebSocket‑соединений
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
        logger.error(f"WebSocket error: {e}")
        if websocket in websocket_connections:
            websocket_connections.remove(websocket)

async def broadcast_notification(message: str):
    """Рассылка уведомлений всем подключённым клиентам"""
    disconnected = []
    for connection in websocket_connections:
        try:
            await connection.send_text(message)
        except Exception as e:
            logger.warning(f"Не удалось отправить уведомление: {e}")
            disconnected.append(connection)
    # Удаляем разорванные соединения
    for conn in disconnected:
        if conn in websocket_connections:
            websocket_connections.remove(conn)

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

    async def process_incident(self, incident_data: Dict) -> Dict:
        inputs = self.tokenizer(
            incident_data['description'],
            return
# ... продолжение предыдущего кода

    async def process_incident(self, incident_data: Dict) -> Dict:
        """Обработка инцидента от любого агента"""
        # Токенизация текста
        inputs = self.tokenizer(
            incident_data['description'],
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        )

        # Инференс модели
        with torch.no_grad():
            result = self.model(
                inputs['input_ids'],
                inputs['attention_mask']
            )

        # Конвертация результатов
        category_id = result['decision'].argmax().item()
        categories = ["Природные", "Техногенные", "Социальные", "Медицинские", "Прочие"]
        priority = int(torch.sigmoid(result['criticality']).mean() * 5) + 1

        incident = Incident(
            id=str(uuid.uuid4()),
            description=incident_data['description'],
            source_agent=incident_data['source_agent'],
            category=categories[category_id],
            criticality=result['criticality'].mean().item(),
            coordinates=result['geolocation'][0].tolist(),
            priority=priority,
            status="reported"
        )

        # Сохраняем в глобальную базу
        self.global_knowledge_base[incident.id] = incident

        # Проверяем на конфликты
        conflict_check = await self._check_conflicts(incident)
        if conflict_check['has_conflict']:
            resolution = await self.resolve_conflict(incident, conflict_check['conflicting_agents'])
            self.conflict_log.append(resolution)

        # Распределяем ресурсы
        allocation = await self._allocate_resources(incident)

        # Рассылка уведомления
        await broadcast_notification(f"Новый инцидент: {incident.category}, приоритет {incident.priority}")

        return {
            "status": "processed",
            "incident_id": incident.id,
            "conflict_resolved": conflict_check['has_conflict'],
            "resource_allocation": allocation,
            "global_priority": self._calculate_global_priority(incident)
        }

    async def _check_conflicts(self, incident: Incident) -> Dict:
        """Проверка на пространственные и тематические конфликты"""
        conflicting = []
        for inc_id, inc in self.global_knowledge_base.items():
            if inc_id != incident.id:
                distance = self._calculate_distance(incident.coordinates, inc.coordinates)
                if distance < 100:  # в километрах
                    conflicting.append(inc_id)
        return {"has_conflict": len(conflicting) > 0, "conflicting_agents": conflicting}

    async def resolve_conflict(self, incident: Incident, conflicting_ids: List[str]) -> ConflictResolution:
        """Разрешение конфликта — отдаём приоритет более критичному инциденту"""
        main_incident = max(
            [self.global_knowledge_base[cid] for cid in conflicting_ids + [incident.id]],
            key=lambda x: x.priority
        )
        resolution = ConflictResolution(
            incident_id=main_incident.id,
            conflicting_agents=[self.global_knowledge_base[cid].source_agent for cid in conflicting_ids],
            resolution_strategy="Priority-based resolution"
        )
        return resolution

    def _calculate_global_priority(self, incident: Incident) -> int:
        """Расчёт глобального приоритета с учётом региона"""
        base_priority = incident.priority
        # Повышаем приоритет для стратегически важных регионов
        if incident.source_agent in ["RusAI", "USAAI", "ChinaAI"]:
            base_priority += 1
        return min(base_priority, 5)  # максимум 5

    async def _allocate_resources(self, incident: Incident) -> ResourceAllocation:
        """Распределение ресурсов на устранение инцидента"""
        target_agents = [incident.source_agent]
        # Если инцидент глобальный — привлекаем соседние регионы
        if incident.category in ["Природные", "Техногенные"]:
            target_agents.extend(self._get_neighboring_agents(incident.source_agent))
        return ResourceAllocation(
            incident_id=incident.id,
            assigned_agents=target_agents,
            resources_allocated={"personnel": 100, "equipment": 50},
            execution_plan=[{"phase": "assessment", "deadline": "2h"}]
        )

    def _get_neighboring_agents(self, source_agent: str) -> List[str]:
        """Определяем соседние регионы для привлечения ресурсов"""
        neighbors = {
            "RusAI": ["ChinaAI", "EuroAI"],
            "USAAI": ["NAmerAI", "SAIAI"],
            "ChinaAI": ["SEAsiaAI", "IndiaAI"],
            "EuroAI": ["RusAI", "MidEastAI"],
            "AfriAI": ["MidEastAI", "SAIAI"],
            "SAIAI": ["AfriAI", "OceanAI"],
            "OceanAI": ["SAIAI", "AfriAI"],
            "MidEastAI": ["EuroAI", "AfriAI"],
            "SEAsiaAI": ["ChinaAI", "IndiaAI"],
            "IndiaAI": ["ChinaAI", "SEAsiaAI"],
            "NAmerAI": ["USAAI"]
        }
        return neighbors.get(source_agent, [])

    def _calculate_distance(self, coord1: List[float], coord2: List[float]) -> float:
        """Рассчёт расстояния между двумя точками (упрощённо)"""
        import math
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        # Упрощённый расчёт (для демонстрации)
        return math.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2) * 111  # км

# Инициализация координатора
dalan1 = Dalan1Coordinator()
agent_statuses: Dict[str, AgentStatus] = {}

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
        agent_url = dalan1.agents[target_agent]
        try:
            async with http
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
    try:
        with open("dashboard.html", "r", encoding="utf-8") as f:
            content = f.read()
        return HTMLResponse(content=content)
    except FileNotFoundError:
        return HTMLResponse(
            "<h1>Панель мониторинга недоступна</h1><p>Файл dashboard.html не найден</p>",
            status_code=500
        )

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
    )from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

app = FastAPI()

# Разрешаем CORS для работы локального HTML-файла
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ДАННЫЕ ИЗ МАНИФЕСТА ---
SYSTEM_DATA = {
    "owner": "Николаев Владимир Владимирович",
    "birth_date": "14.10.1977",
    "email": "nikolaevvladimir77@yandex.ru",
    "version": "2.0 (NexaFlow)",
    "copyright": "© 2026",
    "colors": {"base": "#060a12", "brand": "#00ff87", "danger": "#f43f5e"}
}

CHECKLIST = [
    "Код (ZIP/GitHub)", "Buid (dist/)", ".env файлы", "Дамп БД (SQL)", 
    "S3 Медиа", "DNS записи", "SPA Redirects", "Backend (Railway)"
]

@app.get("/")
async def health_check():
    return {"status": "ARK_CORE_ONLINE", "owner": SYSTEM_DATA["owner"]}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Стартовый лог при подключении
    await websocket.send_text(f"--- ИНИЦИАЦИЯ ECSU 2.0 ---")
    await websocket.send_text(f"ВЛАДЕЛЕЦ: {SYSTEM_DATA['owner']}")
    await websocket.send_text(f"СТАТУС: Экстерриториальный субъект подтвержден.")

    try:
        while True:
            data = await websocket.receive_text()
            cmd = data.lower().strip()

            if cmd == "migrate":
                await websocket.send_text("🚀 ЗАПУСК ПРОТОКОЛА МИГРАЦИИ...")
                for item in ["Упаковка /src", "Защита author.ts", "Сборка dist/", "S3 Sync"]:
                    await asyncio.sleep(0.5)
                    await websocket.send_text(f"📦 {item}... [OK]")
                await websocket.send_text("✅ СИСТЕМА ГОТОВА К ПЕРЕБРОСКЕ.")

            elif cmd == "checklist":
                await websocket.send_text("📋 ЧЕК-ЛИСТ ПЕРЕДАЧИ ПРОЕКТА:")
                for i, item in enumerate(CHECKLIST, 1):
                    await websocket.send_text(f"{i}. [ ] {item}")

            elif "author" in cmd:
                await websocket.send_text(f"👤 ДАННЫЕ ВЛАДЕЛЬЦА: {SYSTEM_DATA['owner']} | {SYSTEM_DATA['email']}")
                await websocket.send_text("⚠️ ИЗМЕНЕНИЕ ЗАПРЕЩЕНО ДИРЕКТИВОЙ №1.")

            elif cmd == "help":
                await websocket.send_text("Доступные команды: migrate, checklist, author, help")

            else:
                await websocket.send_text(f"ЯДРО: Команда '{data}' принята в обработку...")

    except WebSocketDisconnect:
        print("Клиент отключился")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

