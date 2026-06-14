import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.orm import declarative_base
from pydantic import BaseModel
import os

Base = declarative_base()

class OwnerPasswordDB(Base):
    """Таблица для хранения пароля владельца"""
    __tablename__ = 'owner_password'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True, default="owner")
    password_hash = Column(String, nullable=False)
    salt = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    attempts_count = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

class OwnerAuthLog(Base):
    """Журнал попыток входа владельца"""
    __tablename__ = 'owner_auth_log'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True)
    attempt_time = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)
    user_agent = Column(String)
    success = Column(Boolean)
    attempt_type = Column(String)  # 'login', 'failed_attempt', etc.

class OwnerSession(Base):
    """Таблица активных сессий владельца"""
    __tablename__ = 'owner_sessions'
    __table_args__ = {'schema': 'public'}
    
    token = Column(String, primary_key=True)
    owner_id = Column(String, default="owner")
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    ip_address = Column(String)
    is_valid = Column(Boolean, default=True)

class OwnerSecurityManager:
    """Менеджер безопасности для владельца"""
    
    MAX_ATTEMPTS = 5
    LOCK_DURATION_MINUTES = 30
    SESSION_DURATION_HOURS = 8
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple:
        """Хеширование пароля с солью"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # iterations
        ).hex()
        
        return password_hash, salt
    
    @staticmethod
    def verify_password(password: str, stored_hash: str, salt: str) -> bool:
        """Проверка пароля"""
        computed_hash, _ = OwnerSecurityManager.hash_password(password, salt)
        return computed_hash == stored_hash
    
    @staticmethod
    def generate_session_token() -> str:
        """Генерирование токена сессии"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def is_account_locked(db_session, owner_id: str = "owner") -> bool:
        """Проверка, заблокирован ли аккаунт"""
        try:
            owner = db_session.query(OwnerPasswordDB).filter_by(id=owner_id).first()
            if owner and owner.locked_until:
                if owner.locked_until > datetime.utcnow():
                    return True
                else:
                    # Разблокировка если истек срок
                    owner.locked_until = None
                    owner.attempts_count = 0
                    db_session.commit()
            return False
        except Exception as e:
            print(f"Ошибка проверки блокировки: {e}")
            return False
    
    @staticmethod
    def log_auth_attempt(db_session, ip_address: str, user_agent: str, success: bool, owner_id: str = "owner"):
        """Логирование попытки входа"""
        try:
            log_entry = OwnerAuthLog(
                id=secrets.token_hex(16),
                ip_address=ip_address,
                user_agent=user_agent,
                success=success,
                attempt_type='login' if success else 'failed_attempt'
            )
            db_session.add(log_entry)
            db_session.commit()
        except Exception as e:
            print(f"Ошибка логирования: {e}")
    
    @staticmethod
    def increment_failed_attempts(db_session, owner_id: str = "owner"):
        """Увеличение счетчика неудачных попыток"""
        try:
            owner = db_session.query(OwnerPasswordDB).filter_by(id=owner_id).first()
            if owner:
                owner.attempts_count += 1
                
                if owner.attempts_count >= OwnerSecurityManager.MAX_ATTEMPTS:
                    owner.locked_until = datetime.utcnow() + timedelta(
                        minutes=OwnerSecurityManager.LOCK_DURATION_MINUTES
                    )
                
                db_session.commit()
        except Exception as e:
            print(f"Ошибка увеличения счетчика: {e}")
    
    @staticmethod
    def reset_failed_attempts(db_session, owner_id: str = "owner"):
        """Сброс счетчика неудачных попыток"""
        try:
            owner = db_session.query(OwnerPasswordDB).filter_by(id=owner_id).first()
            if owner:
                owner.attempts_count = 0
                owner.locked_until = None
                db_session.commit()
        except Exception as e:
            print(f"Ошибка сброса счетчика: {e}")

# Pydantic модели
class OwnerLoginRequest(BaseModel):
    password: str

class OwnerLoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    message: str
    session_expires_at: Optional[datetime] = None

class OwnerPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class OwnerSecurityStatus(BaseModel):
    is_locked: bool
    failed_attempts: int
    locked_until: Optional[datetime] = None
    last_auth_attempt: Optional[datetime] = None
