from modules.neural_network.dalan_nn import DalanClassifier
import random

def evaluate_model():
    classifier = DalanClassifier()
    classifier.load_model()

    # Генерируем тестовые данные (как в обучении)
    test_data = []
    for _ in range(200):  # 200 тестовых примеров
        true_class = random.randint(0, 4)
        signal_data = {
            'signal_strength': random.uniform(0.1, 1.0),
            'confidence': random.uniform(0.4, 0.9),
            'frequency': random.uniform(100, 10000),
            'duration': random.uniform(0.5, 5.0)
        }
        test_data.append((signal_data, true_class))

    # Считаем точность
    correct = 0
    total = 0
    for signal_data, true_class in test_data:
        predicted_class = classifier.classify_signal(signal_data)
        if predicted_class == true_class:
            correct += 1
        total += 1

    accuracy = correct / total
    print(f"Точность модели на тестовой выборке: {accuracy:.4f} ({correct}/{total})")

if __name__ == "__main__":
    evaluate_model()
