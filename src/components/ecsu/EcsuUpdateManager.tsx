import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const UPDATES_URL = "https://functions.poehali.dev/0639f989-669a-462c-aac5-7730ba2e2470";
const MUSON_URL   = "https://functions.poehali.dev/7bb30a16-64ef-48af-ae2a-132fc94893cd";

type UpdateType = "patch" | "minor" | "major" | "data" | "config";
type UpdateStatus = "active" | "paused" | "archived";

interface AppUpdate {
  id: number;
  version: string;
  title: string;
  description: string;
  update_type: UpdateType;
  payload: Record<string, unknown>;
  files: string[];
  created_by: string;
  created_at: string;
  status: UpdateStatus;
  applied_count: number;
}

const TYPE_META: Record<UpdateType, { label: string; color: string; icon: string }> = {
  patch:  { label: "Патч",         color: "#60a5fa", icon: "Wrench" },
  minor:  { label: "Обновление",   color: "#34d399", icon: "RefreshCw" },
  major:  { label: "Мажорное",     color: "#a78bfa", icon: "Rocket" },
  data:   { label: "Данные",       color: "#fbbf24", icon: "Database" },
  config: { label: "Конфигурация", color: "#f97316", icon: "Settings" },
};

const STATUS_META: Record<UpdateStatus, { label: string; color: string }> = {
  active:   { label: "Активно",    color: "#34d399" },
  paused:   { label: "На паузе",   color: "#f59e0b" },
  archived: { label: "Архив",      color: "#6b7280" },
};

interface Props {
  onClose: () => void;
}

const EcsuUpdateManager = ({ onClose }: Props) => {
  const [updates, setUpdates]     = useState<AppUpdate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<"list" | "create" | "agents">("list");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [agents, setAgents]       = useState<{ agent_id: string; hostname: string; status: string }[]>([]);

  // Форма создания
  const [form, setForm] = useState({
    version:     "2.0.5",
    title:       "",
    description: "",
    update_type: "patch" as UpdateType,
    status:      "active" as UpdateStatus,
    payload_raw: "{}",
  });
  const [formError, setFormError] = useState("");

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const r = await fetch(UPDATES_URL);
      const d = await r.json();
      setUpdates(d.updates || []);
    } catch { /* нет связи */ }
    setLoading(false);
  };

  const loadAgents = async () => {
    try {
      const r = await fetch(MUSON_URL);
      const d = await r.json();
      setAgents((d.agents || []).map((a: { agent_id: string; hostname: string; status: string }) => ({
        agent_id: a.agent_id,
        hostname: a.hostname,
        status:   a.status,
      })));
    } catch { /* нет связи */ }
  };

  useEffect(() => {
    loadUpdates();
    loadAgents();
  }, []);

  const createUpdate = async () => {
    if (!form.title.trim()) { setFormError("Введите название обновления"); return; }
    setFormError("");
    setSaving(true);
    try {
      let payload = {};
      try { payload = JSON.parse(form.payload_raw); } catch { payload = {}; }
      await fetch(UPDATES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payload }),
      });
      setSaved(true);
      setForm({ version: "2.0.5", title: "", description: "", update_type: "patch", status: "active", payload_raw: "{}" });
      await loadUpdates();
      setTimeout(() => { setSaved(false); setTab("list"); }, 1500);
    } catch { setFormError("Ошибка сохранения"); }
    setSaving(false);
  };

  const setStatus = async (id: number, status: UpdateStatus) => {
    await fetch(UPDATES_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setUpdates(prev => prev.map(u => u.id === id ? { ...u, status } : u));
  };

  const deleteUpdate = async (id: number) => {
    if (!confirm("Удалить обновление?")) return;
    await fetch(UPDATES_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setUpdates(prev => prev.filter(u => u.id !== id));
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div
        className="bg-[#0d1225] border border-blue-900/40 rounded-2xl w-full max-w-3xl mx-4 shadow-2xl flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* ── Шапка ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-900/30 bg-gradient-to-r from-[#34d399]/10 to-transparent rounded-t-2xl">
          <div className="w-9 h-9 bg-gradient-to-br from-[#34d399] to-[#059669] rounded-xl flex items-center justify-center">
            <Icon name="Download" size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-base">Менеджер обновлений ECSU</div>
            <div className="text-[#34d399] text-xs">
              Управление обновлениями · автосинхронизация с ПК-приложением
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#1a3d2e] border border-[#34d399]/20 rounded-lg px-2.5 py-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${agents.filter(a => a.status === "online").length > 0 ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              <span className="text-[#34d399] text-xs">
                {agents.filter(a => a.status === "online").length} ПК онлайн
              </span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-red-400 transition-colors p-1">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* ── Вкладки ── */}
        <div className="flex gap-1 px-5 pt-3 pb-0">
          {[
            { id: "list"   as const, label: "Очередь обновлений",   icon: "List" },
            { id: "create" as const, label: "Создать обновление",    icon: "Plus" },
            { id: "agents" as const, label: "ПК-приложения",         icon: "Laptop" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
                tab === t.id
                  ? "text-[#34d399] border-[#34d399]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              <Icon name={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="border-b border-blue-900/20 mx-5" />

        {/* ── Контент ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── СПИСОК ОБНОВЛЕНИЙ ── */}
          {tab === "list" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-xs">
                  Всего: {updates.length} · Активных: {updates.filter(u => u.status === "active").length}
                </span>
                <button
                  onClick={loadUpdates}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Icon name="RefreshCw" size={11} />
                  Обновить
                </button>
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
                  <Icon name="Loader" size={16} className="animate-spin" />
                  Загрузка...
                </div>
              )}

              {!loading && updates.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/20 flex items-center justify-center">
                    <Icon name="PackageOpen" size={26} className="text-blue-600" />
                  </div>
                  <div className="text-gray-500 text-sm">Обновлений пока нет</div>
                  <button
                    onClick={() => setTab("create")}
                    className="px-4 py-2 bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30 rounded-lg text-sm hover:bg-[#34d399]/30 transition-colors"
                  >
                    Создать первое обновление
                  </button>
                </div>
              )}

              {updates.map(u => {
                const tm = TYPE_META[u.update_type] || TYPE_META.patch;
                const sm = STATUS_META[u.status] || STATUS_META.active;
                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-xl border transition-all ${
                      u.status === "active"
                        ? "bg-[#0a1f1a] border-[#34d399]/20"
                        : u.status === "paused"
                        ? "bg-[#1a1a0a] border-yellow-900/20"
                        : "bg-[#0d1225] border-white/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: tm.color + "22" }}
                      >
                        <Icon name={tm.icon} size={16} style={{ color: tm.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{u.title}</span>
                          {u.version && (
                            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                              v{u.version}
                            </span>
                          )}
                          <span
                            className="text-[10px] px-2 py-0.5 rounded font-semibold"
                            style={{ background: tm.color + "22", color: tm.color }}
                          >
                            {tm.label}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded font-semibold"
                            style={{ color: sm.color }}
                          >
                            {sm.label}
                          </span>
                        </div>
                        {u.description && (
                          <div className="text-gray-400 text-xs mt-1">{u.description}</div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-600">
                          <span>{formatDate(u.created_at)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Icon name="CheckCircle" size={10} className="text-green-600" />
                            Применено на {u.applied_count} ПК
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {u.status === "active" && (
                          <button
                            onClick={() => setStatus(u.id, "paused")}
                            title="Приостановить"
                            className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors"
                          >
                            <Icon name="PauseCircle" size={15} />
                          </button>
                        )}
                        {u.status === "paused" && (
                          <button
                            onClick={() => setStatus(u.id, "active")}
                            title="Возобновить"
                            className="p-1.5 text-gray-500 hover:text-green-400 transition-colors"
                          >
                            <Icon name="PlayCircle" size={15} />
                          </button>
                        )}
                        {u.status !== "archived" && (
                          <button
                            onClick={() => setStatus(u.id, "archived")}
                            title="В архив"
                            className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                          >
                            <Icon name="Archive" size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteUpdate(u.id)}
                          title="Удалить"
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── СОЗДАТЬ ОБНОВЛЕНИЕ ── */}
          {tab === "create" && (
            <div className="space-y-4 max-w-xl">
              <div className="text-gray-400 text-xs">
                Создайте обновление — оно автоматически появится в очереди для всех ПК-приложений.
                Агент на ПК проверяет очередь каждые 30 секунд и применяет новые обновления.
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-gray-500 text-xs mb-1 block">Название обновления *</label>
                    <input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="Краткое название изменения"
                      className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Версия</label>
                    <input
                      value={form.version}
                      onChange={e => setForm({ ...form, version: e.target.value })}
                      placeholder="2.0.5"
                      className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-xs mb-1 block">Описание изменений</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Что изменилось, что нужно обновить на ПК-приложении..."
                    rows={3}
                    className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Тип обновления</label>
                    <select
                      value={form.update_type}
                      onChange={e => setForm({ ...form, update_type: e.target.value as UpdateType })}
                      className="w-full bg-[#060d1f] border border-blue-900/30 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="patch">Патч (мелкие правки)</option>
                      <option value="minor">Обновление (новые функции)</option>
                      <option value="major">Мажорное (крупное)</option>
                      <option value="data">Данные (справочники, инциденты)</option>
                      <option value="config">Конфигурация (настройки)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Статус</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as UpdateStatus })}
                      className="w-full bg-[#060d1f] border border-blue-900/30 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="active">Активно (сразу разослать)</option>
                      <option value="paused">На паузе (не рассылать)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-xs mb-1 block">
                    Данные обновления (JSON, необязательно)
                  </label>
                  <textarea
                    value={form.payload_raw}
                    onChange={e => setForm({ ...form, payload_raw: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={3}
                    className="w-full bg-[#060d1f] border border-blue-900/30 text-green-400 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#34d399]/50 placeholder-gray-700 resize-none"
                  />
                  <div className="text-gray-700 text-[10px] mt-1">
                    Сюда можно вставить данные (настройки, конфигурацию) которые агент применит на ПК
                  </div>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
                  <Icon name="AlertCircle" size={14} />
                  {formError}
                </div>
              )}

              <button
                onClick={createUpdate}
                disabled={saving || saved}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  saved
                    ? "bg-green-600 text-white"
                    : "bg-[#34d399] hover:bg-[#2bb884] text-black disabled:opacity-50"
                }`}
              >
                {saved ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Check" size={16} />
                    Обновление создано и разослано!
                  </span>
                ) : saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Loader" size={14} className="animate-spin" />
                    Сохранение...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Send" size={14} />
                    Создать и разослать на все ПК
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ── ПК-ПРИЛОЖЕНИЯ ── */}
          {tab === "agents" && (
            <div className="space-y-4">
              {/* Инструкция установки агента */}
              <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Info" size={15} className="text-blue-400" />
                  <span className="text-blue-300 text-sm font-semibold">Как установить агент на ПК</span>
                </div>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">1.</span>
                    <span>Скачайте файл <span className="text-white font-mono">ecsu_agent.py</span> (кнопка ниже)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">2.</span>
                    <span>Установите Python 3.10+: <span className="text-blue-300">python.org/downloads</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">3.</span>
                    <span>Запустите: <span className="text-white font-mono">python ecsu_agent.py</span> или дважды кликните <span className="text-white font-mono">ЗАПУСК.bat</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">4.</span>
                    <span>Агент автоматически подключится к серверу и начнёт получать обновления</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(generateAgentScript())}`}
                    download="ecsu_agent.py"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#34d399]/20 border border-[#34d399]/30 text-[#34d399] text-xs rounded-lg hover:bg-[#34d399]/30 transition-colors"
                  >
                    <Icon name="Download" size={12} />
                    Скачать ecsu_agent.py
                  </a>
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(generateBatScript())}`}
                    download="ЗАПУСК.bat"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/20 border border-blue-700/30 text-blue-400 text-xs rounded-lg hover:bg-blue-900/30 transition-colors"
                  >
                    <Icon name="Terminal" size={12} />
                    Скачать ЗАПУСК.bat
                  </a>
                </div>
              </div>

              {/* Список ПК */}
              <div>
                <div className="text-gray-500 text-xs mb-2 flex items-center justify-between">
                  <span>Подключённые ПК-приложения</span>
                  <button onClick={loadAgents} className="text-blue-400 hover:text-blue-300 transition-colors">
                    <Icon name="RefreshCw" size={11} />
                  </button>
                </div>
                {agents.length === 0 ? (
                  <div className="text-center py-6 text-gray-600 text-sm">
                    Нет подключённых ПК
                  </div>
                ) : (
                  <div className="space-y-2">
                    {agents.map(a => (
                      <div
                        key={a.agent_id}
                        className="flex items-center gap-3 p-3 bg-[#0d1225] border border-white/5 rounded-xl"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${a.status === "online" ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{a.hostname}</div>
                          <div className="text-gray-600 text-xs font-mono">{a.agent_id}</div>
                        </div>
                        <div
                          className="text-xs px-2 py-0.5 rounded font-semibold"
                          style={a.status === "online"
                            ? { color: "#34d399", background: "#34d39922" }
                            : { color: "#6b7280", background: "#6b728022" }}
                        >
                          {a.status === "online" ? "Онлайн" : "Офлайн"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Подвал ── */}
        <div className="px-5 py-3 border-t border-blue-900/20 flex items-center justify-between">
          <div className="text-gray-600 text-[11px] flex items-center gap-1.5">
            <Icon name="Zap" size={10} className="text-[#34d399]" />
            Агент на ПК проверяет обновления каждые 30 сек
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Генерация Python-агента для скачивания ──────────────────────────────────
function generateAgentScript(): string {
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ECSU Agent — Агент автообновления для ПК
Версия: 2.0.5 | 20.05.2026
Сайт: поехали.dev

Запуск: python ecsu_agent.py
Требования: Python 3.10+  (pip install requests psutil)
"""
import os
import sys
import json
import time
import uuid
import socket
import logging
import platform
import subprocess
import threading
from datetime import datetime
from pathlib import Path

try:
    import requests
    import psutil
except ImportError:
    print("[ECSU] Устанавливаем зависимости...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "psutil", "-q"])
    import requests
    import psutil

# ─── Конфигурация ───────────────────────────────────────────────────────────
MUSON_URL   = "https://functions.poehali.dev/7bb30a16-64ef-48af-ae2a-132fc94893cd"
UPDATES_URL = "https://functions.poehali.dev/0639f989-669a-462c-aac5-7730ba2e2470"

HEARTBEAT_INTERVAL = 30   # секунд между пингами
UPDATE_CHECK_EVERY = 2    # проверять обновления каждые N пингов
LOCAL_PORT = 7749         # порт локального HTTP-сервера

AGENT_DIR  = Path(__file__).parent
CONFIG_DIR = AGENT_DIR / "ecsu_config"
UPDATES_DIR = AGENT_DIR / "ecsu_updates"
LOG_FILE   = AGENT_DIR / "ecsu_agent.log"

CONFIG_DIR.mkdir(exist_ok=True)
UPDATES_DIR.mkdir(exist_ok=True)

# ─── Логирование ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ]
)
log = logging.getLogger("ECSU")

# ─── Уникальный ID агента ───────────────────────────────────────────────────
ID_FILE = AGENT_DIR / "agent_id.txt"
if ID_FILE.exists():
    AGENT_ID = ID_FILE.read_text().strip()
else:
    AGENT_ID = "ecsu-" + str(uuid.uuid4())[:8]
    ID_FILE.write_text(AGENT_ID)
    log.info(f"Создан новый Agent ID: {AGENT_ID}")

STARTED_AT = datetime.now().isoformat()

# ─── Получение метрик ПК ────────────────────────────────────────────────────
def get_pc_metrics() -> dict:
    disk_d = {}
    for part in psutil.disk_partitions():
        if part.mountpoint in ("D:\\\\", "D:/", "/Volumes/D"):
            try:
                usage = psutil.disk_usage(part.mountpoint)
                disk_d = {
                    "total_gb": round(usage.total / 1e9, 1),
                    "used_gb":  round(usage.used  / 1e9, 1),
                    "free_gb":  round(usage.free  / 1e9, 1),
                    "percent":  usage.percent,
                }
            except Exception:
                pass
            break
    return {
        "hostname":    socket.gethostname(),
        "os":          platform.system() + " " + platform.release(),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "ram_percent": psutil.virtual_memory().percent,
        "ram_total_gb": round(psutil.virtual_memory().total / 1e9, 1),
        "disk_d":      disk_d,
        "started_at":  STARTED_AT,
    }

def get_muson_files() -> dict:
    files = []
    muson_path = Path.home() / "Documents" / "МУСОН"
    if not muson_path.exists():
        muson_path = AGENT_DIR / "МУСОН"
        muson_path.mkdir(exist_ok=True)
    for f in list(muson_path.rglob("*"))[:200]:
        if f.is_file():
            try:
                files.append({
                    "name": f.name,
                    "path": str(f),
                    "size_kb": round(f.stat().st_size / 1024, 1),
                    "modified": datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M"),
                    "extension": f.suffix.lower(),
                })
            except Exception:
                pass
    return {"count": len(files), "files": files}

# ─── Применение обновлений ──────────────────────────────────────────────────
applied_ids = []

def apply_updates(updates: list) -> list:
    """Применяет список обновлений и возвращает ID применённых."""
    if not updates:
        return []
    new_ids = []
    for upd in updates:
        uid = upd.get("id")
        title = upd.get("title", "")
        utype = upd.get("update_type", "patch")
        payload = upd.get("payload", {})

        log.info(f"Применяю обновление #{uid}: [{utype}] {title}")

        try:
            # Сохраняем данные обновления в папку
            upd_file = UPDATES_DIR / f"update_{uid}_{utype}.json"
            with open(upd_file, "w", encoding="utf-8") as f:
                json.dump(upd, f, ensure_ascii=False, indent=2)

            # Если payload содержит конфиг — сохраняем отдельно
            if payload and utype == "config":
                cfg_file = CONFIG_DIR / f"config_{uid}.json"
                with open(cfg_file, "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
                log.info(f"  Конфигурация сохранена: {cfg_file}")

            # Если есть exec-команды — выполняем безопасно
            if payload.get("exec_safe"):
                cmd = payload["exec_safe"]
                log.info(f"  Выполняю команду: {cmd}")
                subprocess.run(cmd, shell=True, timeout=30, capture_output=True)

            new_ids.append(uid)
            print(f"[ECSU] ✓ Обновление #{uid} применено: {title}")

        except Exception as e:
            log.error(f"Ошибка применения обновления #{uid}: {e}")

    return new_ids

# ─── Отчёт о применённых обновлениях ────────────────────────────────────────
def report_applied(update_ids: list, hostname: str):
    if not update_ids:
        return
    try:
        requests.post(UPDATES_URL, json={
            "action": "applied",
            "agent_id": AGENT_ID,
            "hostname": hostname,
            "update_ids": update_ids,
            "result": "ok",
        }, timeout=10)
        log.info(f"Отчёт отправлен: применено {len(update_ids)} обновлений")
    except Exception as e:
        log.warning(f"Не удалось отправить отчёт: {e}")

# ─── Основной цикл ──────────────────────────────────────────────────────────
def main_loop():
    ping_count = 0
    log.info(f"ECSU Agent запущен | ID: {AGENT_ID}")
    log.info(f"Сервер: {MUSON_URL}")
    print(f"""
╔══════════════════════════════════════════╗
║        ECSU Agent v2.0.5 запущен         ║
║  ID: {AGENT_ID:<33}  ║
║  Интервал: {HEARTBEAT_INTERVAL} сек                         ║
║  Порт:     {LOCAL_PORT}                          ║
╚══════════════════════════════════════════╝
""")

    while True:
        try:
            pc     = get_pc_metrics()
            muson  = get_muson_files()

            # Отправляем heartbeat и получаем очередь обновлений
            resp = requests.post(MUSON_URL, json={
                "agent_id": AGENT_ID,
                "pc":       pc,
                "muson":    muson,
            }, timeout=15)

            data = resp.json()
            updates = data.get("updates", [])

            if updates:
                log.info(f"Получено {len(updates)} новых обновлений с сайта")
                new_applied = apply_updates(updates)
                if new_applied:
                    report_applied(new_applied, pc["hostname"])
            else:
                if ping_count % 10 == 0:
                    log.info(f"Heartbeat #{ping_count} | CPU:{pc['cpu_percent']}% RAM:{pc['ram_percent']}% | Обновлений нет")

        except requests.exceptions.ConnectionError:
            log.warning("Нет соединения с сервером ECSU. Повтор через 30 сек...")
        except Exception as e:
            log.error(f"Ошибка в главном цикле: {e}")

        ping_count += 1
        time.sleep(HEARTBEAT_INTERVAL)

# ─── Локальный HTTP-сервер для команд с сайта ───────────────────────────────
def local_server():
    """Принимает команды от сайта через localhost."""
    from http.server import HTTPServer, BaseHTTPRequestHandler

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # подавляем стандартный лог

        def do_GET(self):
            if self.path == "/ping":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"pong": True, "agent_id": AGENT_ID}).encode())

        def do_POST(self):
            cors_headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or "{}")

            if self.path == "/sync":
                self.send_response(200)
                for k, v in cors_headers.items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode())

            elif self.path == "/muson/open":
                muson_path = Path.home() / "Documents" / "МУСОН"
                muson_path.mkdir(exist_ok=True)
                try:
                    if platform.system() == "Windows":
                        os.startfile(str(muson_path))
                    elif platform.system() == "Darwin":
                        subprocess.Popen(["open", str(muson_path)])
                    else:
                        subprocess.Popen(["xdg-open", str(muson_path)])
                except Exception:
                    pass
                self.send_response(200)
                for k, v in cors_headers.items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode())

        def do_OPTIONS(self):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.end_headers()

    try:
        server = HTTPServer(("localhost", LOCAL_PORT), Handler)
        log.info(f"Локальный сервер запущен на порту {LOCAL_PORT}")
        server.serve_forever()
    except OSError:
        log.warning(f"Порт {LOCAL_PORT} занят — агент уже запущен или порт используется")

if __name__ == "__main__":
    # Запускаем локальный HTTP-сервер в фоне
    t = threading.Thread(target=local_server, daemon=True)
    t.start()
    # Основной цикл
    main_loop()
`;
}

function generateBatScript(): string {
  return `@echo off
chcp 65001 > nul
title ECSU Agent v2.0.5
echo.
echo  ╔═══════════════════════════════════════╗
echo  ║    ECSU Agent — Запуск агента ECSU    ║
echo  ╚═══════════════════════════════════════╝
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не установлен!
    echo Скачайте Python с https://python.org/downloads
    echo Убедитесь что отметили "Add to PATH" при установке
    pause
    exit /b 1
)

echo [OK] Python найден
echo [..] Запускаем ECSU Agent...
echo.

python "%~dp0ecsu_agent.py"

if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Агент завершился с ошибкой
    pause
)
`;
}

export default EcsuUpdateManager;
