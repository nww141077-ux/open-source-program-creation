import sys
import os
import json
import datetime
import time
import psutil
from rich.console import Console
from rich.table import Table

class HybridOS:
    def __init__(self):
        self.config = self.load_config()
        self.start_time = datetime.datetime.now()
        self.monitoring_data = [] 
        self.console = Console()

    def load_config(self):
        """Загрузка конфигурации"""
        try:
            with open('config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Добавлена обработка ошибки формата JSON
            print("⚠️ Файл config.json не найден или поврежден. Использую настройки по умолчанию.")
            return {
                "version": "1.0.0",
                "debug_mode": True
            }

    def status(self):
        """Проверка статуса системы"""
        uptime = datetime.datetime.now() - self.start_time
        print(f"Система Hybrid OS работает нормально")
        print(f"Версия: {self.config.get('version', 'unknown')}")
        print(f"Режим отладки: {self.config.get('debug_mode', False)}")
        print(f"Время работы: {uptime}")

    def log_to_file(self, message):
        """Запись сообщения в лог-файл"""
        with open("hybrid_os_monitor.log", "a", encoding="utf-8") as f:
            f.write(f"{datetime.datetime.now()}: {message}\n")

    def resources(self):
        """Мониторинг ресурсов"""
        try:
            cpu_percent = psutil.cpu_percent(interval=None)
            memory = psutil.virtual_memory()

            if cpu_percent > 85:
                self.console.print("[bold red]🚨 КРИТИЧЕСКАЯ ЗАГРУЗКА CPU: более 85%![/bold red]")
            if memory.percent > 80:
                self.console.print("[bold red]🚨 КРИТИЧЕСКАЯ ЗАГРУЗКА ПАМЯТИ: более 80%![/bold red]")

            self.log_to_file(f"CPU: {cpu_percent}%, Memory: {memory.percent}%")
            
            print(f"\nМониторинг ресурсов:")
            print(f" CPU: {cpu_percent}%")
            print(f" Память: {memory.percent}% ({memory.used // 1024 // 1024}MB / {memory.total // 1024 // 1024}MB)")

            table = Table(title="💾 Информация о дисках", show_header=True, header_style="bold magenta")
            table.add_column("Диск", style="cyan")
            table.add_column("Использование", justify="right")
            table.add_column("Свободно", justify="right", style="green")
            table.add_column("Тип ФС", style="yellow")

            disks_checked = False
            try:
                partitions = psutil.disk_partitions()
            except Exception as e:
                print(f" Ошибка получения списка разделов: {e}")
                return

            for partition in partitions:
                # Пропускаем проблемные типы и устройства
                if any(opt in partition.opts for opt in ['cdrom', 'loop']) or partition.fstype == '' or partition.device in ['J:\\']:
                    continue

                try:
                    disk = psutil.disk_usage(partition.mountpoint)
                    if disk.total == 0: continue # Защита от деления на ноль

                    total_gb = disk.total // (1024 ** 3)
                    used_gb = disk.used // (1024 ** 3)
                    free_gb = total_gb - used_gb
                    disk_usage_percent = (disk.used / disk.total) * 100

                    if disk_usage_percent > 80:
                        print(f"🚨 КРИТИЧЕСКОЕ ЗАПОЛНЕНИЕ ДИСКА: {partition.device} ({disk_usage_percent:.1f}%)")

                    table.add_row(
                        partition.device,
                        f"{disk_usage_percent:.1f}% ({used_gb}GB / {total_gb}GB)",
                        f"{free_gb}GB",
                        partition.fstype
                    )
                    disks_checked = True
                except (PermissionError, OSError):
                    continue 

            if disks_checked:
                self.console.print(table)

            self.monitoring_data.append({
                'timestamp': datetime.datetime.now(),
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent
            })

        except Exception as e:
            print(f"⚠️ Критическая ошибка мониторинга ресурсов: {e}")

    def plot_usage(self):
        """Построение графика (импорт внутри для ускорения запуска)"""
        if not self.monitoring_data:
            print("Нет данных для построения графика")
            return
        
        try:
            import pandas as pd
            import matplotlib.pyplot as plt
            
            df = pd.DataFrame(self.monitoring_data)
            plt.figure(figsize=(10, 6))
            plt.plot(df['timestamp'], df['cpu_percent'], label='CPU %', color='red')
            plt.plot(df['timestamp'], df['memory_percent'], label='Память %', color='blue')
            plt.title('Мониторинг загрузки системы')
            plt.legend()
            plt.grid(True)
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.show()
        except ImportError:
            print("Для графиков установите: pip install pandas matplotlib")

    def monitor_loop(self, interval=30):
        print(f"\n🚀 Запуск мониторинга с интервалом {interval} сек. (Ctrl+C для остановки)")
        try:
            while True:
                self.resources()
                print("-" * 50)
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n🛑 Мониторинг остановлен.")
            # По желанию можно вызвать self.plot_usage() здесь

if __name__ == "__main__":
    hybrid_os = HybridOS()
    hybrid_os.status()
    hybrid_os.monitor_loop(interval=5) # Уменьшил интервал для теста
