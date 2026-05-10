from modules.neural_network.dalan_nn import DalanClassifier

def test_classification():
    classifier = DalanClassifier()
    # Загрузка обученной модели
    classifier.model.load_state_dict(torch.load('models/dalan_nn_model.pth'))

    test_signal = {
        'signal_strength': 0.8,
        'confidence': 0.75,
        'frequency': 1500,
        'duration': 2.5
    }

    predicted_type, confidence = classifier.classify_signal(test_signal)
    type_names = ['morse', 'tv_signal', 'radio_signal',
                  'quantum_entanglement', 'neural_interface']

    print(f"Предсказанный тип: {from modules.neural_network.dalan_nn import DalanClassifier
import torch

def test_classification():
    classifier = DalanClassifier()
    # Загрузка обученной модели
    try:
        classifier.model.load_state_dict(torch.load('models/dalan_nn_model.pth'))
        print("Модель загружена успешно")
    except FileNotFoundError:
        print("Ошибка: модель не найдена. Сначала запустите train_neural_network.py")
        return

    test_signal = {
        'signal_strength': 0.8,
        'confidence': 0.75,
        'frequency': 1500,
        'duration': 2.5
    }

    predicted_type, confidence = classifier.classify_signal(test_signal)
    type_names = ['morse', 'tv_signal', 'radio_signal',
                  'quantum_entanglement', 'neural_interface']

    print(f"Предсказанный тип: {type_names[predicted_type]}")
    print(f"Достоверность классификации: {confidence:.2%}")

    # Тестирование нескольких сигналов
    print("\nТестирование нескольких тестовых сигналов:")
    test_signals = [
        {'signal_strength': 0.9, 'confidence': 0.85, 'frequency': 500, 'duration': 1.0},
        {'signal_strength': 0.3, 'confidence': 0.6, 'frequency': 8000, 'duration': 3.0},
        {'signal_strength': 0.6, 'confidence': 0.7, 'frequency': 2000, 'duration': 0.5}
    ]

    for i, signal in enumerate(test_signals):
        pred_type, conf = classifier.classify_signal(signal)
        print(f"Сигнал {i+1}: {type_names[pred_type]} (достоверность: {conf:.2%})")

if __name__ == "__main__":
    test_classification()
def train_neural_network():
    print("=== Запуск обучения модели DALAN ===")

    print("1. Инициализация классификатора...")
    classifier = DalanClassifier()
    print("  → Классификатор создан успешно")

    print("2. Генерация тренировочных данных...")
    training_data = generate_training_data()
    print(f"  → Сгенерировано {len(training_data)} примеров данных")

    num_epochs = 500
    print(f"3. Начало обучения на {num_epochs} эпохах...")

    for epoch in range(num_epochs):
        if epoch % 50 == 0:
            print(f"   Эпоха {epoch + 1}/{num_epochs}")

        # Здесь должен быть код обучения (проход по данным, вычисление потерь и т. д.)

    print("4. Обучение завершено. Сохранение модели...")
    classifier.save_model()
    print("5. Модель успешно сохранена!")
    def new_training_step(model, data, target):
    # ваш код
    pass

# Вставьте после существующих функций обучения
