const { app, BrowserWindow, session } = require('electron');

const TARGET_URL = 'https://open-source-program-creation--preview.poehali.dev/egsu/os';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'ECSU OS v2.0',
    backgroundColor: '#020408',
    show: false,
    webPreferences: {
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: false,
    },
  });

  win.loadURL(TARGET_URL);

  win.webContents.on('did-finish-load', () => {
    win.show();
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Загрузка не удалась:', errorCode, errorDescription);
    setTimeout(() => win.loadURL(TARGET_URL), 3000);
  });

  win.webContents.on('unresponsive', () => {
    win.reload();
  });
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
