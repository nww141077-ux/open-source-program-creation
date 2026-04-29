const { app, BrowserWindow, Menu, Tray, shell, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tray;

const ECSU_URL = 'https://open-source-program-creation.poehali.dev/egsu/os';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,          // Без системной рамки — своя titlebar из ОС
    titleBarStyle: 'hidden',
    backgroundColor: '#060a12',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: 'ECSU OS v2.0 · Nikolaev V.V.',
  });

  mainWindow.loadURL(ECSU_URL);

  // Открывать внешние ссылки в браузере
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('https://open-source-program-creation.poehali.dev')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  // Иконка в системном трее
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const menu = Menu.buildFromTemplate([
    { label: 'ECSU OS v2.0 · Nikolaev V.V.', enabled: false },
    { type: 'separator' },
    { label: 'Открыть ECSU OS', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: 'Рабочий стол 1 (ОС)', click: () => mainWindow?.loadURL(ECSU_URL) },
    { label: 'Рабочий стол 2 (ECSU)', click: () => mainWindow?.loadURL(ECSU_URL) },
    { type: 'separator' },
    { label: 'Dashboard', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/dashboard') },
    { label: 'ЦПВОА', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/cpvoa') },
    { label: 'Безопасность', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/security') },
    { label: 'Монетизация', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/monetize') },
    { type: 'separator' },
    { label: 'Выход', click: () => app.quit() },
  ]);
  tray.setToolTip('ECSU OS v2.0');
  tray.setContextMenu(menu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Меню
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'ECSU OS',
      submenu: [
        { label: 'О системе', click: () => mainWindow?.loadURL(ECSU_URL) },
        { type: 'separator' },
        { label: 'Выход', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Полный экран', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
        { label: 'Обновить', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: 'DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.openDevTools() },
      ],
    },
    {
      label: 'Переход',
      submenu: [
        { label: 'ECSU OS (главный)', accelerator: 'CmdOrCtrl+Home', click: () => mainWindow?.loadURL(ECSU_URL) },
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/dashboard') },
        { label: 'ЦПВОА', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/cpvoa') },
        { label: 'Безопасность', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/security') },
        { label: 'Монетизация', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/monetize') },
        { label: 'Далан-1', accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.loadURL('https://open-source-program-creation.poehali.dev/egsu/dalan1') },
      ],
    },
  ]));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
