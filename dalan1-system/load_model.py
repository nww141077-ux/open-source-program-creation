import torch
import numpy as np
from sklearn.preprocessing import StandardScaler
from train_neural_network import DalanNeuralNetwork

def load_classifier():
    model = DalanNeuralNetwork()
    path = 'models/dalan_full_model.pth'
    
    import os
    if not os.path.exists(path):
        path = 'models/dalan_nn_model.pth'
        
    checkpoint = torch.load(path, map_location=torch.device('cpu'))

    # Загружаем веса напрямую, игнорируя отсутствие словаря
    if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.eval()
    
    # Создаем и пристреливаем скалер
    scaler = StandardScaler()
    scaler.fit(np.array([[0.5, 0.5, 3000, 1.0]])) 
    
    return model, scaler
