const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      webSecurity: false,
    },
  });

  win.loadURL('https://open-source-program-creation.poehali.dev/egsu/os');
  win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
