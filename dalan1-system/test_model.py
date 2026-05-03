import torch
import numpy as np
from sklearn.preprocessing import StandardScaler
from train_neural_network import DalanNeuralNetwork, generate_training_data

# Инициализируем модель
model = DalanNeuralNetwork()

# Загружаем сохранённые веса
model.load_state_dict(torch.load('models/dalan_nn_model.pth'))
model.eval()

print("Модель успешно загружена!")

# Создаем набор тестовых сигналов
test_signals = [
    {'signal_strength': 0.25, 'confidence': 0.5, 'frequency': 1200, 'duration': 1.2},  # Пример 1
    {'signal_strength': 0.35, 'confidence': 0.6, 'frequency': 2000, 'duration': 0.8},  # Пример 2
    {'signal_strength': 0.15, 'confidence': 0.4, 'frequency': 800, 'duration': 1.5}   # Пример 3
]

# Создаем scaler
scaler = StandardScaler()
training_data = generate_training_data(num_samples=800)
train_features = np.array([
    [
        signal_data['signal_strength'],
        signal_data['confidence'],
        signal_data['frequency'],
        signal_data['duration']
    ]
    for signal_data, _ in training_data
])
scaler.fit(train_features)

# Тестируем каждый сигнал
for i, signal in enumerate(test_signals):
    print(f"\\nТестовый сигнал {i+1}: {signal}")
    
    # Подготовка данных
    features = np.array([
        signal['signal_strength'],
        signal['confidence'],
        signal['frequency'],
        signal['duration']
    ]).reshape(1, -1)
    
    # Преобразование и предсказание
    scaled_features = scaler.transform(features)
    input_tensor = torch.tensor(scaled_features, dtype=torch.float32)
    
    with torch.no_grad():
        output = model(input_tensor)
        _, predicted = torch.max(output, 1)
    
    print(f"Предсказанный класс: {predicted.item()}")
