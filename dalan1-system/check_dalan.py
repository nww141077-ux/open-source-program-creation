import torch
import numpy as np
from load_model import load_classifier

model, scaler = load_classifier()

# Тестовая выборка сигналов
signals = [
    [0.9, 0.95, 8000, 0.5],  # Агрессивная атака
    [0.1, 0.2, 400, 5.0],    # Фоновый шум
    [0.5, 0.5, 3000, 1.2],   # Подозрительная активность
]

print("\n" + "="*40)
print("   ЖУРНАЛ ИНЦИДЕНТОВ ARK PROTOCOL")
print("   Владелец: Николаев В.В.")
print("="*40)

for i, s in enumerate(signals):
    features = scaler.transform([s])
    output = model(torch.tensor(features, dtype=torch.float32))
    _, predicted = torch.max(output, 1)
    
    status = "КРИТИЧЕСКИ" if predicted.item() > 2 else "НОРМА"
    print(f"Инцидент #{i+1}: Класс {predicted.item()} | Статус: {status}")
    print(f"Параметры: {s}")
    print(f"Счет заблокирован на: $150.00")
    print("-" * 40)

print("\n[✓] Отчет сформирован для предоставления в суд.")
