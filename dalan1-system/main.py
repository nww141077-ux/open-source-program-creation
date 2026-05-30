# Вставляем полный код main.py из вышеприведённого листинга
# main.py
from load_model import load_classifier

# Загрузка модели при старте приложения
model, scaler = load_classifier()

def process_new_signal(signal_data):
    try:
        predicted_class = classify_signal(signal_data, model, scaler)
        return predicted_class
    except Exception as e:
        print(f"Ошибка при классификации: {e}")
        return None
# В main.py или другом основном файле

# Импортируем необходимые компоненты
from load_model import load_classifier
import numpy as np
import torch

# Загружаем модель и scaler при старте
model, scaler = load_classifier()

def process_new_signal(signal_data):
    try:
        # Подготовка данных
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
    
    except Exception as e:
        print(f"Ошибка при обработке сигнала: {e}")
        return None

# Пример использования
if __name__ == "__main__":
    test_signal = {
        'signal_strength': 0.15,
        'confidence': 0.4,
        'frequency': 800,
        'duration': 1.5
    }
    
    predicted_class = process_new_signal(test_signal)
    print(f"Предсказанный класс: {predicted_class}")
# main.py
from load_model import load_classifier

# Загрузка модели и scaler
try:
    model, scaler = load_classifier()
    if model is not None and scaler is not None:
        print("Модель и scaler успешно загружены!")
        
        # Пример использования
        test_signal = {
            'signal_strength': 0.15,
            'confidence': 0.4,
            'frequency': 800,
            'duration': 1.5
        }
        
        # Функция для классификации сигнала
        def process_new_signal(signal_data):
            try:
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
            except Exception as e:
                print(f"Ошибка при обработке сигнала: {e}")
                return None
        
        # Тестируем классификацию
        predicted_class = process_new_signal(test_signal)
        print(f"Предсказанный класс: {predicted_class}")
        
except Exception as e:
    print(f"Ошибка: {e}")
from load_model import load_classifier
import numpy as np
import torch

try:
    model, scaler = load_classifier()
    if model is not None and scaler is not None:
        print("Модель и scaler успешно загружены!")
        
        # Пример тестового сигнала
        test_signal = {
            'signal_strength': 0.15,
            'confidence': 0.4,
            'frequency': 800,
            'duration': 1.5
        }
        
        # Функция классификации
        def process_new_signal(signal_data):
            try:
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
            except Exception as e:
                print(f"Ошибка при обработке сигнала: {e}")
                return None
        
        # Тестируем классификацию
        predicted_class = process_new_signal(test_signal)
        print(f"Предсказанный класс: {predicted_class}")
        
except Exception as e:
    print(f"Произошла ошибка: {e}")
