/**
 * ЕЦСУ 2.0 — Service Worker (Офлайн-режим)
 * Кешируем базовые страницы и активы для работы без интернета.
 * Приоритет: Cache First для статики, Network First для API.
 */

const CACHE = "egsu-v2";
const OFFLINE_URL = "/offline.html";

// Страницы и ресурсы для офлайн-кеша
const PRECACHE = [
  "/",
  "/egsu",
  "/egsu/dashboard",
  "/egsu/cpvoa",
  "/egsu/emergency",
  "/egsu/appeal",
  "/offline.html",
  "/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // API-запросы: Network first, при ошибке возвращаем офлайн-ответ
  if (url.hostname === "functions.poehali.dev") {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(
          JSON.stringify({ error: "offline", mode: "offline", status: "OFFLINE_MODE" }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        )
      )
    );
    return;
  }

  // Статика: Cache first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== "opaque") {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (e.request.mode === "navigate") {
            return caches.match(OFFLINE_URL) || caches.match("/egsu");
          }
          return new Response("", { status: 408 });
        });
    })
  );
});

// Получение push-уведомлений (экстренные оповещения)
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : { title: "ЕЦСУ", body: "Новое уведомление" };
  e.waitUntil(
    self.registration.showNotification(data.title || "ЕЦСУ 2.0", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "egsu",
      requireInteraction: data.critical || false,
      vibrate: data.critical ? [200, 100, 200, 100, 200] : [200],
      data: { url: data.url || "/egsu/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((cs) => {
      const url = e.notification.data?.url || "/egsu/dashboard";
      for (const c of cs) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});
