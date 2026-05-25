import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os
import random
from sklearn.preprocessing import StandardScaler

def generate_training_data(num_samples=1000):
    data = []
    for _ in range(num_samples):
        true_class = random.randint(0, 4)  # 5 классов: 0, 1, 2, 3, 4
        signal_strength = random.uniform(0.1 + true_class * 0.15, 0.3 + true_class * 0.15)
        confidence = random.uniform(0.4 + true_class * 0.1, 0.6 + true_class * 0.1)
        frequency = random.uniform(100 + true_class * 1000, 500 + true_class * 2000)
        duration = random.uniform(0.5 + true_class * 0.5, 1.0 + true_class * 0.8)

        signal_data = {
            'signal_strength': signal_strength,
            'confidence': confidence,
            'frequency': frequency,
            'duration': duration
        }
        data.append((signal_data, true_class))
    print(f"DEBUG: Сгенерировано {len(data)} примеров данных")
    return data

class DalanNeuralNetwork(nn.Module):
    def __init__(self):
        super(DalanNeuralNetwork, self).__init__()
        self.fc1 = nn.Linear(4, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 5)  # 5 классов

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x

class DalanClassifier:
    def __init__(self):
        self.model = DalanNeuralNetwork()
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        self.criterion = nn.CrossEntropyLoss()
        self.scaler = StandardScaler()
        self.is_fitted = False

    def prepare_features(self, signal_data):
        features = np.array([
            signal_data['signal_strength'],
            signal_data['confidence'],
            signal_data['frequency'],
            signal_data['duration']
        ]).reshape(1, -1)

        scaled_features = self.scaler.transform(features)
        return torch.tensor(scaled_features, dtype=torch.float32)

    def train_step(self, features, target):
        self.optimizer.zero_grad()
        output = self.model(features)
        target = torch.tensor([target], dtype=torch.long)
        loss = self.criterion(output, target)
        loss.backward()
        self.optimizer.step()
        return loss.item()

    def classify_signal(self, signal_data):
        features = self.prepare_features(signal_data)
        with torch.no_grad():
            output = self.model(features)
            _, predicted = torch.max(output, 1)
        return predicted.item()

    def save_model(self):
        torch.save(self.model.state_dict(), 'models/dalan_nn_model.pth')

def train_neural_network():
    print("=== Запуск обучения модели DALAN ===")

    if not os.path.exists('models'):
        os.makedirs('models')
        print("Создана папка models/")

    print("1. Инициализация классификатора...")
    classifier = DalanClassifier()
    print("  → Классификатор создан успешно")

    print("2. Генерация тренировочных данных...")
    training_data = generate_training_data()
    print(f"  → Сгенерировано {len(training_data)} примеров данных")

    # Разделение данных на обучение и валидацию
    train_size = int(0.8 * len(training_data))
    train_data = training_data[:train_size]
    val_data = training_data[train_size:]
    print(f"  → Разделено на: {len(train_data)} обучающих и {len(val_data)} валидационных примеров")


    # ОБУЧЕНИЕ STANDARDSCALER НА ОБУЧАЮЩИХ ДАННЫХ
    print("  → Подготовка признаков для обучения StandardScaler...")
    train_features = np.array([
        [
            signal_data['signal_strength'],
            signal_data['confidence'],
            signal_data['frequency'],
            signal_data['duration']
        ]
        for signal_data, _ in train_data
    ])

    print(f"  → Обучаем StandardScaler на {train_features.shape[0]} примерах с {train_features.shape[1]} признаками")
    classifier.scaler.fit(train_features)
    classifier.is_fitted = True
    print("  → StandardScaler успешно обучен!")

    num_epochs = 500
    print(f"3. Начало обучения на {num_epochs} эпохах...")

    for epoch in range(num_epochs):
        total_loss = 0.0
        correct = 0
        total = 0

        for signal_data, target in train_data:
            features = classifier.prepare_features(signal_data)
            loss = classifier.train_step(features, target)
            total_loss += loss

            predicted = classifier.classify_signal(signal_data)
            if predicted == target:
                correct += 1
            total += 1

        train_accuracy = correct / total
        avg_loss = total_loss / len(train_data)

        # Валидация
        val_correct = 0
        val_total = 0
        for signal_data, target in val_data:
            predicted = classifier.classify_signal(signal_data)
            if predicted == target:
                val_correct += 1
            val_total += 1
        val_accuracy = val_correct / val_total

        if (epoch + 1) % 50 == 0:
            print(f'Epoch {epoch + 1}, Loss: {avg_loss:.4f}, '
                  f'Train Acc: {train_accuracy:.4f}, Val Acc: {val_accuracy:.4f}')


    print("4. Обучение завершено. Сохранение модели...")
    classifier.save_model()
    print("5. Модель успешно сохранена в models/dalan_nn_model.pth!")

# Запуск обучения при выполнении скрипта
if __name__ == "__main__":
    train_neural_network()
# В train_neural_network.py
def save_full_model(self):
    torch.save({
        'model_state_dict': self.model.state_dict(),
        'scaler': self.scaler
    }, 'models/dalan_full_model.pth')
def classify_signal(signal_data, model, scaler):
    features = np.array([
        signal_data['signal_strength'],
        signal_data['confidence'],
        signal_data['frequency'],
        signal_data['duration']
    ]).reshape(1, -1)
    
    scaled_features = scaler.transform(features)
    input_tensor = torch.tensor(scaled_features, dtype=torch.float32)
    
    with torch.no_grad():
        output = model(input_tensor)
        _, predicted = torch.max(output, 1)
    
    return predicted.item()
