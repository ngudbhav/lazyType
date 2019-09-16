const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');

let mainScreen;
function createMainWindow(){
	//Create login screen
	mainScreen = new BrowserWindow({width: 1000, height: 600, webPreferences: {
		nodeIntegration: true
	}});
	mainScreen.loadFile(path.join(__dirname, 'views', 'main.html'));
	mainScreen.openDevTools();
	mainScreen.on('closed', function(){
		loginScreen = null;
	});
}
app.on('ready', ()=>{
	createMainWindow();
});
app.on('window-all-closed', function(){
	if(process.platform!=='darwin'){
		app.quit();
	}
});
app.on('activate', function(){
	createMainWindow();
});
