from fastapi import APIRouter, HTTPException, Depends, Request, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import uuid

from app.auth.owner_security import (
    OwnerSecurityManager,
    OwnerPasswordDB,
    OwnerSession,
    OwnerLoginRequest,
    OwnerLoginResponse,
    OwnerPasswordChangeRequest,
    OwnerSecurityStatus
)
from app.core.database import get_db

router = APIRouter(prefix="/api/owner", tags=["owner"])

def get_client_ip(request: Request) -> str:
    """Получить IP адрес клиента"""
    if request.client:
        return request.client.host
    return "unknown"

def get_user_agent(user_agent: Optional[str] = Header(None)) -> str:
    """Получить User-Agent"""
    return user_agent or "unknown"

def verify_owner_token(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> str:
    """Проверка токена владельца"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Отсутствует токен авторизации")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        session = db.query(OwnerSession).filter_by(token=token, is_valid=True).first()
        
        if not session:
            raise HTTPException(status_code=401, detail="Неверный токен")
        
        if session.expires_at < datetime.utcnow():
            session.is_valid = False
            db.commit()
            raise HTTPException(status_code=401, detail="Токен истек")
        
        return session.owner_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Ошибка проверки токена: {str(e)}")

@router.post("/login", response_model=OwnerLoginResponse)
async def owner_login(
    request: Request,
    login_data: OwnerLoginRequest,
    user_agent: str = Depends(get_user_agent),
    db: Session = Depends(get_db)
):
    """
    Вход владельца приложения с проверкой пароля
    """
    client_ip = get_client_ip(request)
    owner_id = "owner"
    
    # Проверка блокировки
    if OwnerSecurityManager.is_account_locked(db, owner_id):
        owner = db.query(OwnerPasswordDB).filter_by(id=owner_id).first()
        OwnerSecurityManager.log_auth_attempt(db, client_ip, user_agent, False, owner_id)
        raise HTTPException(
            status_code=429,
            detail=f"Аккаунт заблокирован до {owner.locked_until.isoformat()}. Слишком много неудачных попыток входа."
        )
    
    # Получение данных владельца
    owner = db.query(OwnerPasswordDB).filter_by(id=owner_id).first()
    
    if not owner or not owner.is_active:
        OwnerSecurityManager.log_auth_attempt(db, client_ip, user_agent, False, owner_id)
        raise HTTPException(status_code=401, detail="Владелец не найден или неактивен")
    
    # Проверка пароля
    if not OwnerSecurityManager.verify_password(login_data.password, owner.password_hash, owner.salt):
        OwnerSecurityManager.increment_failed_attempts(db, owner_id)
        OwnerSecurityManager.log_auth_attempt(db, client_ip, user_agent, False, owner_id)
        
        remaining_attempts = OwnerSecurityManager.MAX_ATTEMPTS - owner.attempts_count
        raise HTTPException(
            status_code=401,
            detail=f"Неверный пароль. Осталось попыток: {max(0, remaining_attempts)}"
        )
    
    # Успешный вход
    OwnerSecurityManager.reset_failed_attempts(db, owner_id)
    
    # Создание сессии
    token = OwnerSecurityManager.generate_session_token()
    session_duration = timedelta(hours=OwnerSecurityManager.SESSION_DURATION_HOURS)
    expires_at = datetime.utcnow() + session_duration
    
    owner_session = OwnerSession(
        token=token,
        owner_id=owner_id,
        expires_at=expires_at,
        ip_address=client_ip,
        is_valid=True
    )
    
    db.add(owner_session)
    OwnerSecurityManager.log_auth_attempt(db, client_ip, user_agent, True, owner_id)
    db.commit()
    
    return OwnerLoginResponse(
        success=True,
        token=token,
        message="Успешный вход",
        session_expires_at=expires_at
    )

@router.post("/logout")
async def owner_logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Выход владельца
    """
    owner_id = await verify_owner_token(authorization, db)
    
    if authorization:
        token = authorization.replace("Bearer ", "")
        session = db.query(OwnerSession).filter_by(token=token).first()
        if session:
            session.is_valid = False
            db.commit()
    
    return {"success": True, "message": "Успешный выход"}

@router.get("/security-status", response_model=OwnerSecurityStatus)
async def get_security_status(db: Session = Depends(get_db)):
    """
    Получить статус безопасности
    """
    owner_id = "owner"
    owner = db.query(OwnerPasswordDB).filter_by(id=owner_id).first()
    
    if not owner:
        raise HTTPException(status_code=404, detail="Владелец не найден")
    
    is_locked = OwnerSecurityManager.is_account_locked(db, owner_id)
    
    return OwnerSecurityStatus(
        is_locked=is_locked,
        failed_attempts=owner.attempts_count,
        locked_until=owner.locked_until,
        last_auth_attempt=None  # Можно добавить из логов
    )

@router.post("/change-password")
async def change_password(
    password_data: OwnerPasswordChangeRequest,
    owner_id: str = Depends(verify_owner_token),
    db: Session = Depends(get_db)
):
    """
    Изменение пароля владельца
    """
    owner = db.query(OwnerPasswordDB).filter_by(id=owner_id).first()
    
    if not owner:
        raise HTTPException(status_code=404, detail="Владелец не найден")
    
    # Проверка текущего пароля
    if not OwnerSecurityManager.verify_password(password_data.current_password, owner.password_hash, owner.salt):
        raise HTTPException(status_code=401, detail="Неверный текущий пароль")
    
    # Проверка совпадения новых паролей
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(status_code=400, detail="Новые пароли не совпадают")
    
    # Проверка сложности пароля
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 8 символов")
    
    # Хеширование и сохранение
    new_hash, new_salt = OwnerSecurityManager.hash_password(password_data.new_password)
    owner.password_hash = new_hash
    owner.salt = new_salt
    owner.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"success": True, "message": "Пароль успешно изменен"}

@router.get("/verify-session")
async def verify_session(
    owner_id: str = Depends(verify_owner_token),
    db: Session = Depends(get_db)
):
    """
    Проверка валидности текущей сессии
    """
    return {
        "valid": True,
        "owner_id": owner_id,
        "message": "Сессия активна"
    }
