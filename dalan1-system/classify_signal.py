# classify_signal.py

# Импортируем необходимые компоненты
from load_model import load_classifier
from main import process_new_signal  # Если функция в main.py

# Загружаем модель и scaler
model, scaler = load_classifier()

def classify_new_signal(signal_data):
    try:
        # Создаем тестовый сигнал
        test_signal = {
            'signal_strength': signal_data.get('signal_strength', 0.15),
            'confidence': signal_data.get('confidence', 0.4),
            'frequency': signal_data.get('frequency', 800),
            'duration': signal_data.get('duration', 1.5)
        }
        
        # Вызываем функцию классификации
        predicted_class = process_new_signal(test_signal, model, scaler)
        return predicted_class
    
    except Exception as e:
        print(f"Ошибка при классификации: {e}")
        return None

if __name__ == "__main__":
    # Пример использования
    test_signal = {
        'signal_strength': 0.15,
        'confidence': 0.4,
        'frequency': 800,
        'duration': 1.5
    }
    
    predicted_class = classify_new_signal(test_signal)
    print(f"Предсказанный класс: {predicted_class}")
