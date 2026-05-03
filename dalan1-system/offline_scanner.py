from modules.neural_network.dalan_nn import DalanClassifier

class OfflineScanner:
    def __init__(self):
        # ... предыдущий код
        self.neural_classifier = DalanClassifier()

    def scan_signal(self, source_type, raw_data):
        """Сканирование сигнала с классификацией нейросетью"""
        # Предварительная обработка
        processed_data = self.preprocess_signal(raw_data, source_type)

        # Классификация нейросетью
        predicted_type, nn_confidence = self.neural_classifier.classify_signal(processed_data)

        # Сохранение с учётом уверенности нейросети
        final_confidence = (processed_data['confidence'] + nn_confidence) / 2
        incident_id = self.save_incident(
            text=processed_data['text'],
            source_type=predicted_type,
            confidence=final_confidence,
            metadata=processed_data
        )
        return {
            "incident_id": incident_id,
            "predicted_type": predicted_type,
            "confidence": final_confidence
        }
