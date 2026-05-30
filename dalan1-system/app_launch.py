import asyncio
from aiogram import Bot, Dispatcher, types
import torch
import numpy as np
import os

# --- ТОЧКА ВХОДА ---
TOKEN = "12345:АБВГД"

async def main():
    print("🚀 Запуск ядра ARK PROTOCOL...")
    
    # 1. Загрузка нейросети (без лишних оберток)
    from load_model import load_classifier
    try:
        model, scaler = load_classifier()
        print("✓ Далан-1 в боевой готовности.")
    except Exception as e:
        print(f"❌ Ошибка загрузки модели: {e}")
        return

    # 2. Инициализация связи
    bot = Bot(token=TOKEN)
    dp = Dispatcher()

    @dp.message()
    async def echo_handler(message: types.Message):
        if message.text:
            try:
                # Анализируем 4 цифры через пробел
                data = [float(x) for x in message.text.split()]
                if len(data) != 4:
                    await message.answer("⚠️ Нужно 4 параметра: Сила Уверенность Частота Время")
                    return
                
                # Прогон через Далан-1
                features = scaler.transform([data])
                output = model(torch.tensor(features, dtype=torch.float32))
                _, predicted = torch.max(output, 1)
                
                await message.answer(f"📡 **ARK REPORT**\nКласс угрозы: {predicted.item()}\nСтатус: В очереди на взыскание ⚖️")
            except Exception as e:
                await message.answer(f"⚠️ Ошибка обработки: {e}")

    print("📡 Эфир открыт. Жду сигналы в Телеграм!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
