const { app, BrowserWindow, globalShortcut, ipcMain, shell, ipcRenderer } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		title: 'VRig Electron',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			backgroundThrottling: false,
			contextIsolation: true,
			enableRemoteModule: false,
			nodeIntegration: false
		}
	});

	mainWindow.loadURL(
		isDev ? 'http://localhost:3000'
			  : `file://${path.join(__dirname, '../build/index.html')}`
	);

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
	
	if (isDev) {
		mainWindow.openDevTools({ mode: 'detach' });
	}
}

// When the application has loaded create the browser window
app.whenReady().then(() => {
	createWindow();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// Disable opening the debug console if we are in release mode
if (!isDev) {
	app.on('browser-window-focus', function () {
		globalShortcut.register("CommandOrControl+R", () => {});
	});

	app.on('browser-window-blur', function () {
		globalShortcut.unregister('CommandOrControl+R');
	});
}

/*
ipcMain.handle('openVRMFile', async (event, enable) => {
	let win = BrowserWindow.fromId(event.sender.id);
	return dialog.showOpenDialog(win, {
		properties: [ 'openFile' ],
		filters: [
			{ name: 'VRM', extensions: [ 'vrm' ] },
		],
	});
});

ipcMain.handle('openBrowserLink', async (event, href) => {
	shell.openExternal(href);
});
*/
