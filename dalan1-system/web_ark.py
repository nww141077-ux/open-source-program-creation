from flask import Flask, request, jsonify
from load_model import load_classifier
import torch

app = Flask(__name__)
model, scaler = load_classifier()

@app.route('/scan')
def scan():
    # Пример: http://твой_ip:5000/scan?data=0.5,0.8,1500,2.1
    raw_data = request.args.get('data').split(',')
    data = [float(x) for x in raw_data]
    features = scaler.transform([data])
    output = model(torch.tensor(features, dtype=torch.float32))
    _, predicted = torch.max(output, 1)
    
    return jsonify({
        "status": "ARK REPORT",
        "class": int(predicted.item()),
        "message": "Инцидент зафиксирован в реестре В.В."
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
