from sqlalchemy.orm import Session
from datetime import datetime
from app.auth.owner_security import OwnerPasswordDB, OwnerSecurityManager
import os

def initialize_owner_password(db: Session):
    """
    Инициализация пароля владельца при первом запуске
    """
    existing_owner = db.query(OwnerPasswordDB).filter_by(id="owner").first()
    
    if not existing_owner:
        # Получить пароль из переменной окружения или использовать по умолчанию
        default_password = os.getenv("OWNER_PASSWORD", "admin123456")  # ИЗМЕНИТЕ НА БЕЗОПАСНЫЙ!
        
        password_hash, salt = OwnerSecurityManager.hash_password(default_password)
        
        owner = OwnerPasswordDB(
            id="owner",
            password_hash=password_hash,
            salt=salt,
            is_active=True
        )
        
        db.add(owner)
        db.commit()
        
        print("[INFO] Аккаунт владельца инициализирован")
        print(f"[WARNING] Пароль по умолчанию: {default_password}")
        print("[WARNING] ИЗМЕНИТЕ ПАРОЛЬ НЕМЕДЛЕННО!")
    else:
        print("[INFO] Аккаунт владельца уже существует")
