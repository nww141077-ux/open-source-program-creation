import os
import math
import uuid
import smtplib
import asyncio
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict

import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoTokenizer

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# РАБОТА С БАЗОЙ ДАННЫХ (PostgreSQL & Схема)
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Boolean, Text, desc, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Название схемы из вашего SQL-скрипта
DB_SCHEMA = "t_p38294978_open_source_program_"

Base = declarative_base()

# ==========================================
# 1. СТРУКТУРА ТАБЛИЦ ИЗ НОВОГО SQL-СКРИПТА
# ==========================================

class IncidentDB(Base):
    __tablename__ = 'incidents'
    __table_args__ = {'schema': DB_SCHEMA}

    id = Column(String, primary_key=True)
    description = Column(String)
    category = Column(String)
    criticality = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    priority = Column(Integer)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String)

class AppSettingDB(Base):
    __tablename__ = 'app_settings'
    __table_args__ = {'schema': DB_SCHEMA}

    key = Column(String, primary_key=True)
    value = Column(Text)
    category = Column(String, default='general')
    label = Column(String)

class AppModuleDB(Base):
    __tablename__ = 'app_modules'
    __table_args__ = {'schema': DB_SCHEMA}

    name = Column(String, primary_key=True)
    label = Column(String)
    enabled = Column(Boolean, default=True)

class DalanConfigDB(Base):
    __tablename__ = 'dalan_config'
    __table_args__ = {'schema': DB_SCHEMA}

    id = Column(Integer, primary_key=True, autoincrement=True)
    param_key = Column(String, unique=True, nullable=False)
    param_value = Column(Text)
    param_label = Column(String)
    param_type = Column(String, default='text')
    updated_at = Column(DateTime, default=datetime.utcnow)

# Подключение к PostgreSQL (Замените user, password, host, dbname на ваши актуальные данные)
# Для работы требуется библиотека psycopg2-binary (pip install psycopg2-binary)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:admin123@localhost:5432/dbname")

engine = create_engine(DATABASE_URL, connect_args={"options": f"-c search_path={DB_SCHEMA}"} if "postgresql" in DATABASE_URL else {})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# ==========================================
# 2. ДИНАМИЧЕСКАЯ ИИ-МОДЕЛЬ (Dalan1Model)
# ==========================================
class Dalan1Model(nn.Module):
    def __init__(self, input_size: int = 10, hidden_size: int = 256, num_classes: int = 5):
        super().__init__()
        # Использование параметров динамической конфигурации из SQL
        self.network = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, num_classes)
        )
        self.criticality_head = nn.Linear(hidden_size, 1)
        self.geo_head = nn.Linear(hidden_size, 2)
        
    def forward(self, input_ids, attention_mask):
        # Имитация инференса на основе входных эмбеддингов
        # В реальной модели здесь будет проход по токенам RuBERT
        batch_size = input_ids.size(0)
        # Создаем фиктивный скрытый слой для заглушки
        device = input_ids.device
        hidden = torch.randn(batch_size, 256, device=device)
        
        return {
            'decision': self.network[3](hidden), 
            'criticality': torch.sigmoid(self.criticality_head(hidden)),
            'geolocation': self.geo_head(hidden)
        }

# ==========================================
# 3. СХЕМЫ ДАННЫХ (Pydantic)
# ==========================================
class IncidentRequest(BaseModel):
    description: str
    source_agent: str = Field(..., alias="source")
    timestamp: Optional[datetime] = None
    location_hint: Optional[str] = None

    class Config:
        populate_by_name = True

class IncidentResponse(BaseModel):
    incident_id: str
    category: str
    criticality: float
    coordinates: List[float]
    priority: int
    status: str
    global_priority: int
    resource_allocation: dict

class Incident(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    source_agent: str
    category: str
    criticality: float
    coordinates: List[float]
    priority: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "reported"
    region_specific_data: Optional[Dict] = None

class ConflictResolution(BaseModel):
    incident_id: str
    conflicting_agents: List[str]
    resolution_strategy: str
    resolved_by: str = "Dalan-1"
    resolution_timestamp: datetime = Field(default_factory=datetime.utcnow)

class ResourceAllocation(BaseModel):
    incident_id: str
    assigned_agents: List[str]
    resources_allocated: Dict[str, int]
    execution_plan: List[Dict]

class MessageType(str, Enum):
    INCIDENT_REPORT = "incident_report"
    STATUS_UPDATE = "status_update"
    RESOURCE_REQUEST = "resource_request"

class AgentMessageEnvelope(BaseModel):
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str
    target: str = "Dalan-1"
    type: MessageType
    payload: dict

# ==========================================
# 4. СИСТЕМА УВЕДОМЛЕНИЙ (WebSocket МЕНЕДЖЕР)
# ==========================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

async def broadcast_notification(message: str):
    await manager.broadcast(message)

def _sync_send_email(incident: IncidentResponse, source_agent: str):
    msg = MIMEMultipart()
    msg['Subject'] = f"КРИТИЧЕСКИЙ ИНЦИДЕНТ #{incident.incident_id}"
    msg['From'] = "dalan1@system.com"
    msg['To'] = "command-center@gov.ru"

    body = f"\nНовый инцидент зарегистрирован системой Далан‑1:\n\nID: {incident.incident_id}\nКатегория: {incident.category}\nКритичность: {incident.criticality:.2%}\nПриоритет: {incident.priority}/5\nКоординаты: {incident.coordinates}\nИсточник: {source_agent}\n\nАвтоматически сгенерировано системой мониторинга.\n"
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP('localhost')
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Email не отправлен: {e}")

async def send_to_command_center(incident: IncidentResponse, source_agent: str):
    await asyncio.to_thread(_sync_send_email, incident, source_agent)
    print(f"[TELEGRAM] | Уведомление штаба | Инцидент {incident.incident_id}: {incident.category}, приоритет {incident.priority}")

def _sync_save_db(incident_data: dict, source_agent: str, description: str):
    session = SessionLocal()
    try:
        incident = IncidentDB(
            id=incident_data['incident_id'], description=description, category=incident_data['category'],
            criticality=incident_data['criticality'], latitude=incident_data['coordinates'][0], longitude=incident_data['coordinates'][1],
            priority=incident_data['priority'], status=incident_data['status'], source=source_agent
        )
        session.add(incident)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"❌ Ошибка сохранения в PostgreSQL: {e}")
    finally:
        session.close()

async def save_incident_to_db(incident_data: dict, source_agent: str, description: str):
    await asyncio.to_thread(_sync_save_db, incident_data, source_agent, description)

# ==========================================
# 5. ПОЛНАЯ ЛОГИКА КООРДИНАТОРА «ДАЛАН-1»
# ==========================================
class Dalan1Coordinator:
    def __init__(self):
        self.agents: Dict[str, str] = {
            "RusAI": "http://rusai.api:8001", "USAAI": "http://usai.api:8002",
            "ChinaAI": "http://chinaai.api:8003", "EuroAI": "http://euroai.api:8004",
            "AfriAI": "http://afriai.api:8005", "SAIAI": "http://saiai.api:8006",
            "OceanAI": "http://oceanai.api:8007", "MidEastAI": "http://mideastai.api:8008",
            "SEAsiaAI": "http://seasiaai.api:8009", "IndiaAI": "http://indiaai.api:8010",
            "NAmerAI": "http://namerai.api:8011"
        }
        self.global_knowledge_base: Dict[str, Incident] = {}
        self.conflict_log: List[ConflictResolution] = []
        
        # Динамическая загрузка конфигурации нейросети из новой таблицы dalan_config
        db = SessionLocal()
        try:
            input_size = int(db.query(DalanConfigDB).filter_by(param_key='input_size').first().param_value or 10)
            hidden_size = int(db.query(DalanConfigDB).filter_by(param_key='hidden_size').first().param_value or 256)
            num_classes = int(db.query(DalanConfigDB).filter_by(param_key='num_classes').first().param_value or 5)
            use_gpu = db.query(DalanConfigDB).filter_by(param_key='use_gpu').first().param_value == 'true'
            
            self.device = torch.device("cuda" if use_gpu and torch.cuda.is_available() else "cpu")
