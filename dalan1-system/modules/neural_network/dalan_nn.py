import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from sklearn.preprocessing import StandardScaler

class DalanNeuralNetwork(nn.Module):
    def __init__(self, input_size=10, hidden_size=256, num_classes=5):
        super(DalanNeuralNetwork, self).__init__()
        
        # --- ЛЕВОЕ ПОЛУШАРИЕ (Логический блок) ---
        self.left_brain = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, hidden_size // 2)
        )

        # --- ПРАВОЕ ПОЛУШАРИЕ (Интуитивный блок / Нелинейность) ---
        self.right_brain = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.LeakyReLU(0.1), # Другая активация для "гибкости"
            nn.Dropout(0.2),
            nn.Linear(hidden_size, hidden_size // 2)
        )

        # --- ОСТРОВОК (Insula / Блок интеграции) ---
        # Соединяет два потока (hidden_size // 2 * 2)
        self.insula = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.BatchNorm1d(hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, num_classes)
        )

    def forward(self, x):
        # Активация обоих полушарий
        left_out = self.left_brain(x)
        right_out = self.right_brain(x)
        
        # Слияние потоков (Concatenation)
        combined = torch.cat((left_out, right_out), dim=1)
        
        # Финальный вердикт через Островок
        logits = self.insula(combined)
        return logits

class DalanClassifier:
    def __init__(self):
        # Теперь у нас 256 нейронов на старте и двухпоточная архитектура
        self.model = DalanNeuralNetwork(input_size=10, hidden_size=256)
        self.scaler = StandardScaler()
        self.criterion = nn.CrossEntropyLoss()
        # Немного увеличим шаг обучения для новой архитектуры
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.0005, weight_decay=1e-4)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    # Остальные методы (prepare_features, train_step, save_model) остаются прежними
    def prepare_features(self, signal_data):
        features = np.array([
            signal_data['signal_strength'],
            signal_data['confidence'],
            np.log(signal_data['frequency'] + 1e-6),
            np.sqrt(signal_data['duration'] + 1e-6),
            signal_data['signal_strength'] * signal_data['confidence'],
            signal_data['frequency'] / 1000,
            signal_data['duration'] ** 2,
            np.sin(signal_data['frequency'] * 0.01),
            signal_data['confidence'] ** 2,
            signal_data['signal_strength'] / (signal_data['duration'] + 1e-6)
        ]).reshape(1, -1)
        
        # ВАЖНО: Если скалер не обучен, в первый раз нужно сделать fit
        try:
            scaled_features = self.scaler.transform(features)
        except:
            self.scaler.fit(features)
            scaled_features = self.scaler.transform(features)
            
        return torch.tensor(scaled_features, dtype=torch.float32).to(self.device)

    def train_step(self, features, target):
        self.model.train()
        self.optimizer.zero_grad()
        outputs = self.model(features)
        loss = self.criterion(outputs, torch.tensor([target], dtype=torch.long).to(self.device))
        loss.backward()
        self.optimizer.step()
        return loss.item()

    def classify_signal(self, signal_data):
        self.model.eval()
        with torch.no_grad():
            features = self.prepare_features(signal_data)
            outputs = self.model(features)
            _, predicted = torch.max(outputs.data, 1)
            return predicted.item()

    def save_model(self, path='models/dalan_nn_model.pth'):
        torch.save(self.model.state_dict(), path)
        print(f"Модель с 'Островком' сохранена: {path}")

    def load_model(self, path='models/dalan_nn_model.pth'):
        self.model.load_state_dict(torch.load(path, map_location=self.device))
        self.model.eval()
        print(f"Двухполушарная модель загружена: {path}")
