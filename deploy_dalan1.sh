#!/! /bin/bash

echo "=== Развёртывание системы Далан‑1 ==="

# Создаём директорию проекта
mkdir -p dalan1-system
cd dalan1-system

# Создаём requirements.txt
cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.29.0
httpx==0.27.2
torch==2.1.0
transformers==4.35.2
pydantic==2.5.0
aiofiles==23.2.1
jinja2==3.1.2
websockets==12.0
EOF

# Создаём main.py
cat > main.py << 'EOF'
# Вставляем полный код main.py из вышеприведённого листинга
EOF

# Создаём dashboard.html
cat > dashboard.html << 'EOF'
# Вставляем полный код
# ... продолжение предыдущего кода

# Создаём dashboard.html
cat > dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Далан‑1 — Глобальная система мониторинга</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .map-container { grid-column: 1 / -1; height: 400px; background: #e0e0e0; border-radius: 8px; }
        .incident-list { grid-column: 1 / -1; }
        .incident-item { padding: 10px; margin: 5px 0; border-left: 4px solid; }
        .priority-1 { border-color: #28a745; } /* Низкий приоритет */
        .priority-3 { border-color: #ffc107; } /* Средний приоритет */
        .priority-5 { border-color: #dc3545; } /* Высокий приоритет */
        .notification-panel { position: fixed; bottom: 20px; right: 20px; width: 300px; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #ddd; padding: 10px; }
    </style>
</head>
<body>
    <h1>Далан‑1: Глобальная система мониторинга инцидентов</h1>

    <div class="dashboard">
        <div class="card">
            <h3>Всего инцидентов</h3>
            <div id="total-incidents">0</div>
        </div>
        <div class="card">
            <h3>Активные конфликты</h3>
            <div id="active-conflicts">0</div>
        </div>
        <div class="card">
            <h3>Критичные инциденты</h3>
            <div id="high-criticality">0</div>
        </div>

        <div class="map-container" id="global-map">
            <!-- Здесь будет интерактивная карта мира -->
            <p>Интерактивная глобальная карта инцидентов (интеграция с Leaflet/Mapbox)</p>
        </div>

        <div class="incident-list" id="incident-feed">
            <h3>Последние инциденты</h3>
            <!-- Список инцидентов будет загружаться через JS -->
        </div>
    </div>

    <div class="notification-panel" id="notifications">
        <h4>Уведомления</h4>
    </div>

    <script>
        // Подключение к WebSocket для уведомлений
        const socket = new WebSocket("ws://localhost:8000/ws/notifications");
        socket.onmessage = function(event) {
            const notification = document.createElement('div');
            notification.textContent = event.data;
            document.getElementById('notifications').appendChild(notification);
        };

        // Загрузка данных панели мониторинга
        async function loadDashboard() {
            const response = await fetch('/api/v1/dalan1/global-dashboard');
            const data = await response.json();
            document.getElementById('total-incidents').textContent = data.total_incidents;
            document.getElementById('active-conflicts').textContent = data.active_conflicts;
            document.getElementById('high-criticality').textContent = data.criticality_distribution.high;
        }

        loadDashboard();
        setInterval(loadDashboard, 30000); // Обновление каждые 30 секунд
    </script>
</body>
</html>
EOF

echo "Файлы созданы успешно!"

# Устанавливаем зависимости
echo "Установка зависимостей..."
pip install -r requirements.txt

# Проверяем успешность установки
if [ $? -ne 0 ]; then
    echo "Ошибка при установке зависимостей. Проверьте подключение к интернету и версию Python."
    exit 1
fi

echo "Зависимости установлены успешно!"

# Загружаем модель BERT (один раз)
echo "Загрузка модели BERT (может занять несколько минут)..."
python -c "
from transformers import AutoTokenizer, AutoModel
tokenizer = AutoTokenizer.from_pretrained('cointegrated/rubert-tiny2')
model = AutoModel.from_pretrained('cointegrated/rubert-tiny2')"

# Проверяем загрузку модели
if [ $? -ne 0 ]; then
    echo "Ошибка загрузки модели BERT. Проверьте доступ к Hugging Face."
    exit 1
fi

echo "Модель BERT загружена успешно!"

# Запускаем сервер
echo "Запуск сервера Далан‑1..."
uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info

echo "Система Далан‑1 развёрнута и запущена!"
echo "Доступ: http://localhost:8000"
echo "API документация: http://localhost:8000/docs"
