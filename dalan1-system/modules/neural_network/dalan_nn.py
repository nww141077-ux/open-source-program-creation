import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from sklearn.preprocessing import StandardScaler

class DalanNeuralNetwork(nn.Module):
    def __init__(self, input_size=10, hidden_size=256, num_classes=5):
        super(DalanNeuralNetwork, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.bn1 = nn.BatchNorm1d(hidden_size)
        self.relu = nn.ReLU()
        self.dropout1 = nn.Dropout(0.2)

        self.fc2 = nn.Linear(hidden_size, hidden_size // 2)
        self.bn2 = nn.BatchNorm1d(hidden_size // 2)
        self.dropout2 = nn.Dropout(0.2)
        self.fc3 = nn.Linear(hidden_size // 2, hidden_size // 4)
        self.bn3 = nn.BatchNorm1d(hidden_size // 4)
        self.dropout3 = nn.Dropout(0.2)
        self.fc4 = nn.Linear(hidden_size // 4, num_classes)

    def forward(self, x):
        out = self.fc1(x)
        out = self.bn1(out)
        out = self.relu(out)
        out = self.dropout1(out)
        out = self.fc2(out)
        out = self.bn2(out)
        out = self.relu(out)
        out = self.dropout2(out)
        out = self.fc3(out)
        out = self.bn3(out)
        out = self.relu(out)
        out = self.dropout3(out)
        out = self.fc4(out)
        return out

class DalanClassifier:
    def __init__(self):
        self.model = DalanNeuralNetwork(input_size=10)
        self.scaler = StandardScaler()
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.0003, weight_decay=1e-4)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def prepare_features(self, signal_data):
        features = np.array([
            signal_data['signal_strength'],
            signal_data['confidence'],
            np.log(signal_data['frequency']),
            np.sqrt(signal_data['duration']),
            signal_data['signal_strength'] * signal_data['confidence'],
            signal_data['frequency'] / 1000,
            signal_data['duration'] ** 2,
            np.sin(signal_data['frequency'] * 0.01),
            signal_data['confidence'] ** 2,
            signal_data['signal_strength'] / signal_data['duration']
        ]).reshape(1, -1)
        scaled_features = self.scaler.transform(features)
        return torch.tensor(scaled_features, dtype=torch.float32).to(self.device)

    def train_step(self, features, target):
        self.optimizer.zero_grad()
        outputs = self.model(features)
        loss = self.criterion(outputs, torch.tensor([target], dtype=torch.long).to(self.device))
        loss.backward()
        self.optimizer.step()
        return loss.item()

    def classify_signal(self, signal_data):
        with torch.no_grad():
            features = self.prepare_features(signal_data)
            outputs = self.model(features)
            _, predicted = torch.max(outputs.data, 1)
            return predicted.item()

    def save_model(self, path='models/dalan_nn_model.pth'):
        torch.save(self.model.state_dict(), path)
        print(f"Модель сохранена: {path}")

    def load_model(self, path='models/dalan_nn_model.pth'):
        self.model.load_state_dict(torch.load(path, map_location=self.device))
        self.model.eval()
        print(f"Модель загружена: {path}")
