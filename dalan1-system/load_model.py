import torch
from sklearn.preprocessing import StandardScaler
from train_neural_network import DalanNeuralNetwork
import numpy as np

def load_classifier():
    try:
        # Загружаем содержимое файла
        checkpoint = torch.load('models/dalan_nn_model.pth')  # Используем реальное имя файла
        
        # Проверяем структуру данных
        if isinstance(checkpoint, dict):
            # Если есть scaler в сохраненных данных
            if 'scaler' in checkpoint:
                scaler = checkpoint['scaler']
            else:
                scaler = StandardScaler()
                
            # Проверяем наличие model_state_dict
            if 'model_state_dict' in checkpoint:
                state_dict = checkpoint['model_state_dict']
            else:
                state_dict = checkpoint  # Если нет model_state_dict, используем checkpoint напрямую
                
        else:
            # Если загружен просто state_dict (не в словаре)
            state_dict = checkpoint
            scaler = StandardScaler()
            
            # Обучаем scaler
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
        
        # Создаем модель и загружаем в нее веса
        model = DalanNeuralNetwork()
        model.load_state_dict(state_dict)
        model.eval()
        
        return model, scaler
    
    except Exception as e:
        print(f"Ошибка при загрузке модели: {e}")
        return None, None
import torch
from sklearn.preprocessing import StandardScaler
from train_neural_network import DalanNeuralNetwork
import numpy as np

def load_classifier():
    try:
        # Загружаем содержимое файла
        checkpoint = torch.load('models/dalan_nn_model.pth')  # Используем реальное имя файла
        
        # Проверяем структуру данных
        if isinstance(checkpoint, dict):
            # Если есть scaler в сохраненных данных
            if 'scaler' in checkpoint:
                scaler = checkpoint['scaler']
            else:
                scaler = StandardScaler()
                
            # Проверяем наличие model_state_dict
            if 'model_state_dict' in checkpoint:
                state_dict = checkpoint['model_state_dict']
            else:
                # Если нет model_state_dict, используем checkpoint напрямую
                state_dict = checkpoint
                
        else:
            # Если загружен просто state_dict (не в словаре)
            state_dict = checkpoint
            scaler = StandardScaler()
            
            # Обучаем scaler
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
        
        # Создаем модель и загружаем в нее веса
        model = DalanNeuralNetwork()
        model.load_state_dict(state_dict)
        model.eval()
        
        return model, scaler
    
    except Exception as e:
        print(f"Ошибка при загрузке модели: {e}")
        return None, None
