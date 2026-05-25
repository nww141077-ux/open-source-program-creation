import torch
import sklearn
import numpy as np
import scipy
import joblib

print("✓ PyTorch установлен, версия:", torch.__version__)
print("✓ scikit-learn установлен, версия:", sklearn.__version__)
print("✓ NumPy установлен, версия:", np.__version__)
print("✓ SciPy установлен, версия:", scipy.__version__)
print("✓ Joblib установлен, версия:", joblib.__version__)

# Проверка доступности GPU
print("CUDA доступен:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(torch.cuda.current_device()))
else:
    print("Используется CPU для вычислений")
