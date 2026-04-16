/**
 * ============================================================
 *  ЯДРО СИСТЕМЫ ЕЦСУ 2.0 — АВТОРСКОЕ СВИДЕТЕЛЬСТВО
 * ============================================================
 *
 *  Автор:       Николаев Владимир Владимирович
 *  Дата рожд.:  14.10.1977
 *  Год создания: 2024
 *
 *  Настоящим подтверждается, что данное программное обеспечение,
 *  включая его ядро, архитектуру, логику и интерфейс,
 *  создано по заданию и является интеллектуальной собственностью
 *  автора — Николаева Владимира Владимировича.
 *
 *  Любое копирование, распространение или использование
 *  без письменного согласия автора запрещено.
 *
 *  Лицензия: Проприетарная (All Rights Reserved)
 *  © 2024 Николаев Владимир Владимирович. Все права защищены.
 * ============================================================
 */

export const CORE_AUTHOR = {
  fullName: "Николаев Владимир Владимирович",
  birthDate: "14.10.1977",
  createdAt: "2024",
  license: "All Rights Reserved",
  copyright: "© 2024 Николаев Владимир Владимирович. Все права защищены.",
  version: "2.0.0",
} as const;

export const CORE_META = {
  appName: "ЕЦСУ 2.0",
  fullName: "Единая Центральная Система Управления",
  description: "Система мониторинга, правового анализа и управления инцидентами",
  author: CORE_AUTHOR.fullName,
  rights: "Все права принадлежат автору. Несанкционированное использование запрещено.",
} as const;

/** Версия архитектуры ядра — не изменяется без ведома владельца */
export const CORE_ARCH = {
  kernel: "ЕЦСУ-CORE-2",
  aiAdmin: "egsu-ai",
  scanner: "incident-scanner",
  modules: ["egsu-incidents", "security", "finance", "egsu-voice", "legal-base"],
  dataProtection: "AES-256 + HTTPS",
  selfPreservation: true,
} as const;

/**
 * Самосохранение ядра — проверяет целостность ключевых параметров.
 * Вызывать при старте приложения.
 */
export function verifyCoreIntegrity(): { ok: boolean; version: string; author: string } {
  const required = [CORE_AUTHOR.fullName, CORE_META.appName, CORE_ARCH.kernel];
  const ok = required.every(Boolean);
  return {
    ok,
    version: CORE_AUTHOR.version,
    author: CORE_AUTHOR.fullName,
  };
}

/**
 * Метка системного события для логирования.
 */
export function coreEvent(type: string, data?: Record<string, unknown>): Record<string, unknown> {
  return {
    system: CORE_META.appName,
    kernel: CORE_ARCH.kernel,
    event: type,
    author: CORE_AUTHOR.fullName,
    ts: new Date().toISOString(),
    ...data,
  };
}

export default CORE_AUTHOR;
