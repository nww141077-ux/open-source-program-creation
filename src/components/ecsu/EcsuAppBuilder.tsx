import { useState } from "react";
import Icon from "@/components/ui/icon";

type TargetOS = "windows" | "linux" | "macos" | "crossplatform";
type AppType  = "console" | "gui" | "service" | "installer" | "script" | "web";
type Lang     = "python" | "bash" | "powershell" | "nodejs" | "csharp";

interface GeneratedApp {
  id: string;
  name: string;
  os: TargetOS;
  type: AppType;
  lang: Lang;
  description: string;
  files: { name: string; content: string }[];
  createdAt: string;
}

const STORAGE_KEY = "ecsu_appbuilder";

function loadApps(): GeneratedApp[] {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

function saveApps(apps: GeneratedApp[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

const OS_META: Record<TargetOS, { label: string; icon: string; color: string }> = {
  windows:       { label: "Windows",        icon: "Monitor",   color: "#60a5fa" },
  linux:         { label: "Linux",          icon: "Terminal",  color: "#34d399" },
  macos:         { label: "macOS",          icon: "Apple",     color: "#94a3b8" },
  crossplatform: { label: "Кросс-платформ", icon: "Globe",     color: "#a78bfa" },
};

const TYPE_META: Record<AppType, { label: string; icon: string }> = {
  console:   { label: "Консольное",  icon: "Terminal"   },
  gui:       { label: "GUI-приложение", icon: "Layout"  },
  service:   { label: "Служба/Демон", icon: "Settings2" },
  installer: { label: "Установщик",  icon: "Download"   },
  script:    { label: "Скрипт",      icon: "FileText"   },
  web:       { label: "Веб-сервер",  icon: "Globe"      },
};

const LANG_META: Record<Lang, { label: string; color: string }> = {
  python:     { label: "Python",      color: "#3b82f6" },
  bash:       { label: "Bash/Shell",  color: "#34d399" },
  powershell: { label: "PowerShell",  color: "#60a5fa" },
  nodejs:     { label: "Node.js",     color: "#f59e0b" },
  csharp:     { label: "C# (.NET)",   color: "#a78bfa" },
};

// Генерация кода
function generateCode(
  name: string, description: string,
  os: TargetOS, type: AppType, lang: Lang
): { name: string; content: string }[] {
  const safeName = name.replace(/\s+/g, "_").toLowerCase();
  const files: { name: string; content: string }[] = [];

  if (lang === "python") {
    let mainCode = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
${name}
${description}
Создано: ЕЦСУ 2.0 Конструктор приложений
"""

import sys
import os
import json
import time
`;
    if (type === "console") {
      mainCode += `
def main():
    print("=" * 50)
    print(f"  ${name}")
    print("=" * 50)
    print("${description}")
    print()
    
    # Ваш код здесь
    while True:
        cmd = input("Команда (exit — выход): ").strip()
        if cmd.lower() == "exit":
            print("Завершение работы...")
            break
        print(f"Выполнено: {cmd}")

if __name__ == "__main__":
    main()
`;
    } else if (type === "service") {
      mainCode += `import signal

running = True

def handle_signal(sig, frame):
    global running
    print(f"[${name}] Получен сигнал завершения")
    running = False

signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

def main():
    print(f"[${name}] Служба запущена")
    
    while running:
        # Основная логика службы
        print(f"[${name}] Цикл выполнения: {time.strftime('%H:%M:%S')}")
        time.sleep(10)
    
    print(f"[${name}] Служба остановлена")

if __name__ == "__main__":
    main()
`;
    } else if (type === "web") {
      mainCode += `from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 8080

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        content = f"""
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>${name}</title></head>
<body style="font-family:sans-serif;background:#080c1a;color:#fff;padding:2rem">
  <h1>${name}</h1>
  <p>${description}</p>
  <p>Создано: ЕЦСУ 2.0</p>
</body>
</html>""".encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(content)
    
    def log_message(self, format, *args):
        print(f"[${name}] {args[0]} {args[1]}")

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"[${name}] Сервер запущен на порту {PORT}")
    server.serve_forever()
`;
    } else {
      mainCode += `
def main():
    print("${name} — ${description}")
    # Ваш код здесь

if __name__ == "__main__":
    main()
`;
    }
    files.push({ name: `${safeName}.py`, content: mainCode });

    if (os === "windows") {
      files.push({
        name: `run.bat`,
        content: `@echo off\necho [${name}] Запуск...\npython ${safeName}.py\npause`,
      });
      files.push({
        name: `install.bat`,
        content: `@echo off\necho Установка зависимостей...\npip install -r requirements.txt\necho Готово!\npause`,
      });
    } else if (os === "linux" || os === "macos") {
      files.push({
        name: `run.sh`,
        content: `#!/bin/bash\necho "[${name}] Запуск..."\npython3 ${safeName}.py`,
      });
      if (type === "service") {
        files.push({
          name: `${safeName}.service`,
          content: `[Unit]\nDescription=${name}\nAfter=network.target\n\n[Service]\nType=simple\nExecStart=/usr/bin/python3 /opt/${safeName}/${safeName}.py\nRestart=always\n\n[Install]\nWantedBy=multi-user.target`,
        });
      }
    }
    files.push({ name: "requirements.txt", content: "# Зависимости\n# psutil>=5.9.0\n# requests>=2.28.0" });

  } else if (lang === "powershell") {
    files.push({
      name: `${safeName}.ps1`,
      content: `# ${name}\n# ${description}\n# Создано: ЕЦСУ 2.0\n\nWrite-Host "=== ${name} ===" -ForegroundColor Cyan\nWrite-Host "${description}" -ForegroundColor Gray\nWrite-Host ""\n\n# Ваш код здесь\nfunction Main {\n    Write-Host "Запуск ${name}..." -ForegroundColor Green\n    \n    # Основная логика\n    Get-Date | Write-Host\n}\n\nMain`,
    });
    if (type === "installer") {
      files.push({
        name: `installer.ps1`,
        content: `# Установщик ${name}\n$InstallDir = "C:\\Program Files\\${name}"\n\nif (-not (Test-Path $InstallDir)) {\n    New-Item -ItemType Directory -Path $InstallDir | Out-Null\n    Write-Host "Создана папка: $InstallDir" -ForegroundColor Green\n}\n\nCopy-Item ".\\*" -Destination $InstallDir -Recurse -Force\nWrite-Host "${name} установлен!" -ForegroundColor Green`,
      });
    }

  } else if (lang === "bash") {
    const shebang = os === "windows" ? "@echo off\n:: " : "#!/bin/bash\n# ";
    const ext     = os === "windows" ? "bat" : "sh";
    files.push({
      name: `${safeName}.${ext}`,
      content: `${shebang}${name}\n${shebang}${description}\n${shebang}Создано: ЕЦСУ 2.0\n\necho "${name} запущен"\n\n# Ваш код здесь\n\necho "Готово!"`,
    });

  } else if (lang === "nodejs") {
    files.push({
      name: `index.js`,
      content: `// ${name}\n// ${description}\n// Создано: ЕЦСУ 2.0\n\n'use strict';\n\nconst http = require('http');\nconst fs   = require('fs');\nconst path = require('path');\n\n${type === "web" ? `const PORT = 3000;\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });\n  res.end('<h1>${name}</h1><p>${description}</p>');\n});\n\nserver.listen(PORT, () => console.log(\`[${name}] Сервер запущен: http://localhost:\${PORT}\`));` : `console.log('${name} — ${description}');\n\n// Ваш код здесь`}`,
    });
    files.push({
      name: `package.json`,
      content: JSON.stringify({ name: safeName, version: "1.0.0", description, main: "index.js", scripts: { start: "node index.js" } }, null, 2),
    });

  } else if (lang === "csharp") {
    files.push({
      name: `Program.cs`,
      content: `// ${name}\n// ${description}\nusing System;\n\nclass Program\n{\n    static void Main(string[] args)\n    {\n        Console.WriteLine("=== ${name} ===");\n        Console.WriteLine("${description}");\n        Console.WriteLine();\n        \n        // Ваш код здесь\n        Console.WriteLine("Нажмите Enter для выхода...");\n        Console.ReadLine();\n    }\n}`,
    });
    files.push({
      name: `${safeName}.csproj`,
      content: `<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n    <TargetFramework>net8.0</TargetFramework>\n    <Nullable>enable</Nullable>\n  </PropertyGroup>\n</Project>`,
    });
  }

  files.push({
    name: "README.md",
    content: `# ${name}\n\n${description}\n\n## Создано\nЕЦСУ 2.0 · Конструктор приложений\n\n## Запуск\n\`\`\`\n${files[0]?.name ? `# Запустить: ${files[0].name}` : ""}\n\`\`\`\n\n## Целевая ОС\n${OS_META[os].label}\n\n## Тип\n${TYPE_META[type].label}\n`,
  });

  return files;
}

const EcsuAppBuilder = () => {
  const [apps, setApps]           = useState<GeneratedApp[]>(loadApps);
  const [step, setStep]           = useState<"list" | "create" | "view">("list");
  const [selectedApp, setSelectedApp] = useState<GeneratedApp | null>(null);
  const [activeFile, setActiveFile]   = useState(0);
  const [copied, setCopied]       = useState(false);

  // Форма
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [os, setOs]             = useState<TargetOS>("windows");
  const [type, setType]         = useState<AppType>("console");
  const [lang, setLang]         = useState<Lang>("python");

  const generate = () => {
    if (!name.trim()) return;
    const files = generateCode(name, desc, os, type, lang);
    const app: GeneratedApp = {
      id: Date.now().toString(),
      name, description: desc, os, type, lang,
      files,
      createdAt: new Date().toLocaleDateString("ru-RU"),
    };
    const updated = [app, ...apps];
    setApps(updated);
    saveApps(updated);
    setSelectedApp(app);
    setActiveFile(0);
    setStep("view");
  };

  const viewApp = (app: GeneratedApp) => {
    setSelectedApp(app);
    setActiveFile(0);
    setStep("view");
  };

  const deleteApp = (id: string) => {
    if (!confirm("Удалить приложение?")) return;
    const updated = apps.filter(a => a.id !== id);
    setApps(updated);
    saveApps(updated);
  };

  const downloadFile = (file: { name: string; content: string }) => {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = (app: GeneratedApp) => {
    app.files.forEach(f => downloadFile(f));
  };

  const copyFile = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#080c1a] text-white">
      {/* Шапка */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-blue-900/20">
        {step !== "list" && (
          <button onClick={() => setStep("list")} className="p-1 text-gray-500 hover:text-white transition-colors mr-1">
            <Icon name="ArrowLeft" size={14} />
          </button>
        )}
        <Icon name="Wand2" size={16} className="text-purple-400" />
        <span className="text-white font-bold text-sm">Конструктор приложений</span>
        <span className="text-gray-600 text-xs">— генерация кода под ОС</span>
        <div className="flex-1" />
        {step === "list" && (
          <button onClick={() => setStep("create")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-colors">
            <Icon name="Plus" size={12} />
            Создать приложение
          </button>
        )}
      </div>

      {/* Список */}
      {step === "list" && (
        <div className="flex-1 overflow-auto p-6">
          {apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-600">
              <Icon name="Wand2" size={40} className="mb-3 opacity-30" />
              <div className="text-sm">Нет созданных приложений</div>
              <button onClick={() => setStep("create")} className="mt-3 text-xs text-purple-400 hover:text-purple-300">
                + Создать первое
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {apps.map(app => (
                <div key={app.id} onClick={() => viewApp(app)}
                  className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl p-4 cursor-pointer hover:border-blue-700/50 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: OS_META[app.os].color + "22" }}>
                        <Icon name={OS_META[app.os].icon} size={15} style={{ color: OS_META[app.os].color }} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">{app.name}</div>
                        <div className="text-gray-500 text-[10px]">{OS_META[app.os].label} · {TYPE_META[app.type].label}</div>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteApp(app.id); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                  {app.description && <p className="text-gray-500 text-xs mb-2">{app.description}</p>}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded" style={{ background: LANG_META[app.lang].color + "22", color: LANG_META[app.lang].color }}>
                      {LANG_META[app.lang].label}
                    </span>
                    <span className="text-gray-700 text-[10px]">{app.files.length} файлов</span>
                    <span className="text-gray-700 text-[10px] ml-auto">{app.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Форма создания */}
      {step === "create" && (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-xl mx-auto flex flex-col gap-5">
            <div>
              <label className="text-gray-400 text-xs uppercase mb-2 block">Название приложения</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Например: Мониторинг ЦПУ"
                className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase mb-2 block">Описание / функция</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Что делает приложение..."
                rows={3}
                className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none resize-none" />
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase mb-2 block">Целевая ОС</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(OS_META) as TargetOS[]).map(o => (
                  <button key={o} onClick={() => setOs(o)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${os === o ? "border-opacity-60" : "border-blue-900/20 opacity-60"}`}
                    style={os === o ? { background: OS_META[o].color + "22", borderColor: OS_META[o].color + "66" } : {}}>
                    <Icon name={OS_META[o].icon} size={16} style={{ color: OS_META[o].color }} />
                    <span className="text-xs text-gray-300">{OS_META[o].label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase mb-2 block">Тип приложения</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TYPE_META) as AppType[]).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${type === t ? "bg-purple-900/40 border-purple-700/50 text-purple-300" : "border-blue-900/20 text-gray-500 hover:text-gray-300"}`}>
                    <Icon name={TYPE_META[t].icon} size={12} />
                    {TYPE_META[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase mb-2 block">Язык программирования</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LANG_META) as Lang[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${lang === l ? "text-white" : "border-blue-900/20 text-gray-500"}`}
                    style={lang === l ? { background: LANG_META[l].color + "22", borderColor: LANG_META[l].color + "66", color: LANG_META[l].color } : {}}>
                    {LANG_META[l].label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={!name.trim()}
              className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-colors">
              <Icon name="Wand2" size={16} />
              Сгенерировать код
            </button>
          </div>
        </div>
      )}

      {/* Просмотр сгенерированного */}
      {step === "view" && selectedApp && (
        <div className="flex flex-1 overflow-hidden">
          {/* Файлы */}
          <div className="w-44 bg-[#252526] border-r border-[#3c3c3c] flex flex-col">
            <div className="px-3 py-2 border-b border-[#3c3c3c]">
              <div className="text-[11px] text-[#cccccc] font-semibold">{selectedApp.name}</div>
              <div className="text-[10px] text-gray-500">{OS_META[selectedApp.os].label}</div>
            </div>
            <div className="flex-1 overflow-auto py-1">
              {selectedApp.files.map((f, i) => (
                <button key={i} onClick={() => setActiveFile(i)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${activeFile === i ? "bg-[#37373d] text-[#cccccc]" : "text-gray-500 hover:bg-[#2a2d2e] hover:text-gray-300"}`}>
                  {f.name}
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-[#3c3c3c]">
              <button onClick={() => downloadAll(selectedApp)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#0e639c] text-white text-[11px] rounded hover:bg-[#1177bb] transition-colors">
                <Icon name="Download" size={11} />
                Скачать всё
              </button>
            </div>
          </div>

          {/* Код файла */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
              <span className="text-[12px] text-[#cccccc]">{selectedApp.files[activeFile]?.name}</span>
              <div className="flex-1" />
              <button onClick={() => copyFile(selectedApp.files[activeFile]?.content || "")}
                className="flex items-center gap-1 text-[11px] text-[#cccccc] hover:text-white px-2 py-0.5">
                <Icon name={copied ? "Check" : "Copy"} size={11} />
                {copied ? "OK" : "Copy"}
              </button>
              <button onClick={() => downloadFile(selectedApp.files[activeFile])}
                className="flex items-center gap-1 text-[11px] text-[#cccccc] hover:text-white px-2 py-0.5">
                <Icon name="Download" size={11} />
                Скачать
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-[13px] font-mono text-[#d4d4d4] whitespace-pre leading-relaxed">
              {selectedApp.files[activeFile]?.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcsuAppBuilder;
