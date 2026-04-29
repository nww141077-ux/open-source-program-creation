const { app, BrowserWindow, session, ipcMain } = require('electron');

// Основной URL — опубликованная версия. Preview — запасной при разработке.
const TARGET_URL = 'https://open-source-program-creation.poehali.dev/egsu/os';
const FALLBACK_URL = 'https://open-source-program-creation--preview.poehali.dev/egsu/os';

function createWindow() {
  const win = new BrowserWindow({
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
      preload: __dirname + '/preload.js',
    },
  });

  win.loadURL(TARGET_URL);

  win.webContents.on('did-finish-load', () => {
    win.show();
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Загрузка не удалась:', errorCode, errorDescription);
    // Пробуем preview если основной недоступен
    if (win.webContents.getURL() !== FALLBACK_URL) {
      setTimeout(() => win.loadURL(FALLBACK_URL), 2000);
    } else {
      setTimeout(() => win.loadURL(TARGET_URL), 5000);
    }
  });

  win.webContents.on('unresponsive', () => {
    win.reload();
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
  ipcMain.on('win-close', () => win.close());
}

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'ECSU-OS/2.0 Electron';
    callback({ requestHeaders: details.requestHeaders });
  });
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});