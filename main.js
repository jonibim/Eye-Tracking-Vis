const { app, BrowserWindow } = require('electron');

function createWindow () {
    // Create the browser window.
    let window = new BrowserWindow({
        width: 800,
        height: 600,
        icon: './public/resources/favicon_visualization.png'
    });

    window.loadURL('http://localhost:3000/');
    window.focus();
    // window.webContents.openDevTools();
    window.maximize();

    window.webContents.on('page-favicon-updated', (event, favicons) => {
        window.setIcon('./public/' + favicons[0].substr('http://localhost:3000/'.length));
    });
}

app.whenReady().then(() => {
    require('./bin/www');
    createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {

    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})