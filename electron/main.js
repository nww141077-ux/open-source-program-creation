const { app, BrowserWindow, session, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Основной URL — опубликованная версия. Preview — запасной при разработке.
const TARGET_URL = 'https://open-source-program-creation.poehali.dev/egsu/os';
const FALLBACK_URL = 'https://open-source-program-creation--preview.poehali.dev/egsu/os';

let win = null;
let tray = null;

// ─── АВТОЗАПУСК ──────────────────────────────────────────────────────────────
function setAutoLaunch(enable) {
  app.setLoginItemSettings({
    openAtLogin: enable,
    name: 'ECSU OS',
    args: ['--autostart'],
  });
}

function isAutoLaunchEnabled() {
  return app.getLoginItemSettings().openAtLogin;
}

// ─── ТРЕЙ ────────────────────────────────────────────────────────────────────
function createTray() {
  // Простая иконка 16x16 зелёного цвета (PNG base64 1px)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABGSURBVDiNY/z/n+E/AymAiSRtgwYMGjBowKABgwYMGjBowKABgwYMGkBJGxMpmokaQEkbEymaQUkbEymaQUkbEymaAQDMUQnMmMkAAAAASUVORK5CYII='
  );

  tray = new Tray(icon);
  tray.setToolTip('ECSU OS v2.0');

  function buildMenu() {
    const autoEnabled = isAutoLaunchEnabled();
    return Menu.buildFromTemplate([
      { label: 'ECSU OS v2.0', enabled: false },
      { type: 'separator' },
      {
        label: 'Открыть',
        click: () => {
          if (win) { win.show(); win.setFullScreen(true); }
          else createWindow();
        },
      },
      {
        label: 'Свернуть в трей',
        click: () => { if (win) win.hide(); },
      },
      { type: 'separator' },
      {
        label: autoEnabled ? '✓ Автозапуск включён' : 'Включить автозапуск',
        click: () => {
          setAutoLaunch(!autoEnabled);
          tray.setContextMenu(buildMenu());
        },
      },
      { type: 'separator' },
      {
        label: 'Выход',
        click: () => { app.quit(); },
      },
    ]);
  }

  tray.setContextMenu(buildMenu());
  tray.on('double-click', () => {
    if (win) { win.show(); win.setFullScreen(true); }
  });
}

// ─── ОКНО ────────────────────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'ECSU OS v2.0',
    backgroundColor: '#020408',
    show: false,
    frame: false,
    fullscreen: true,
    webPreferences: {
      webSecurity: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL(TARGET_URL);

  win.webContents.on('did-finish-load', () => {
    // Если автозапуск — стартуем свёрнуто в трей
    const isAutostart = process.argv.includes('--autostart');
    if (!isAutostart) {
      win.show();
      win.setFullScreen(true);
    }
    // При автозапуске просто живём в трее — окно откроется по клику
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Загрузка не удалась:', errorCode, errorDescription);
    if (win.webContents.getURL() !== FALLBACK_URL) {
      setTimeout(() => win.loadURL(FALLBACK_URL), 2000);
    } else {
      setTimeout(() => win.loadURL(TARGET_URL), 5000);
    }
  });

  win.webContents.on('unresponsive', () => {
    win.reload();
  });

  // Закрытие — скрываем в трей вместо выхода
  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  ipcMain.on('win-minimize', () => win.minimize());
  ipcMain.on('win-maximize', () => {
    if (win.isMaximized() || win.isFullScreen()) {
      win.setFullScreen(false);
      win.unmaximize();
    } else {
      win.setFullScreen(true);
    }
  });
  ipcMain.on('win-close', () => win.hide());
}

// ─── СТАРТ ───────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Включаем автозапуск при первом запуске
  if (!isAutoLaunchEnabled()) {
    setAutoLaunch(true);
  }

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'ECSU-OS/2.0 Electron';
    callback({ requestHeaders: details.requestHeaders });
  });

  createTray();
  createWindow();
});

app.on('window-all-closed', () => {
  // Не выходим — живём в трее
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('activate', () => {
  if (!win) createWindow();
  else { win.show(); win.setFullScreen(true); }
});