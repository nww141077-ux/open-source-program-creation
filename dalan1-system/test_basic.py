print("Тест: скрипт запускается!")

import sys
print(f"Python версия: {sys.version}")

try:
    import torch
    print(f"PyTorch версия: {torch.__version__}")
except ImportError as e:
    print(f"Ошибка импорта PyTorch: {e}")

try:
    import numpy as np
    print("NumPy успешно импортирован")
except ImportError as e:
    print(f"Ошибка импорта NumPy: {e}")

try:
    from sklearn.preprocessing import StandardScaler
    print("Scikit‑learn успешно импортирован")
except ImportError as e:
    print(f"Ошибка импорта Scikit‑learn: {e}")

print("Тестовый скрипт выполнен успешно!")
