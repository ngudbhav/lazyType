const {
  app, BrowserWindow, ipcMain, shell, dialog, nativeTheme, net,
} = require('electron');
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');
const path = require('path');
const fs = require('fs');
const sudo = require('sudo-prompt');
const appDir = path.dirname(app.getPath('userData')) + '\\lazyType\\bin';
const Nedb = require('nedb');
const history = new Nedb({
  filename: app.getPath('appData') + '/lazyType/data/history.db',
  autoload: true,
});
//Save the db in format
//{
//	"name":"trico",
//	"path":path
//}
const settings = new Nedb({
  filename: app.getPath('appData') + '/lazyType/data/settings.db',
  autoload: true,
});

let mainScreen;
const createMainWindow = () => {
	setupTitlebar();
  mainScreen = new BrowserWindow({
		frame: process.platform === 'darwin',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#333333' : '#ffffff',
    webPreferences: {
      devTools: true,
			sandbox: false,
      preload: path.join(__dirname, 'static', 'js', 'preload.js'),
      disableBlinkFeatures: "Auxclick",
    },
    width: 1000,
    height: 600,
    minHeight: 600,
    icon: 'icons/win/app.ico',
    minWidth: 1000,
    titleBarStyle: 'hidden',
  });
  mainScreen.loadFile(path.join(__dirname, 'views', 'main.html')).then(_ => checkUpdates());
  mainScreen.setMenu(null);
  mainScreen.removeMenu();
	mainScreen.webContents.openDevTools();
	attachTitlebarToWindow(mainScreen);
	mainScreen.on('ready-to-show', () => {
		fs.mkdir(appDir, error => {
			if(error && error.code !== 'EEXIST') {
				throw new Error(`Failed to create required system directories. Verbose information: ${error}`);
			}
		});

		history.find({}, (error, results) => {
			if (error) {
				throw new Error(`Failed to read required directories. Verbose information: ${error}`);
			} else {
				mainScreen.webContents.send('history', results);
				settings.find({}, (error, results) => {
					if (error) {
						throw new Error(`Failed to read required directories. Verbose information: ${error}`);
					}
					else {
						if (results.length === 0) {
							const response = dialog.showMessageBoxSync(mainScreen, {
								type: "info",
								buttons: ["Ok", "Cancel"],
								title: "First Run",
								message: "This seems to be the first time, the software is run on the system. We need to perform some final configuration steps once. Click Ok to begin."
							});
							if (response === 0) {
								configureSystem();
							}
						}
						settings.insert({ firstRun: false }, error => {
							if (error) {
								throw new Error(`Failed to write required directories. Verbose information: ${error}`);
							}
						});
					}
				});
			}
		});
	});
}

const checkUpdates = (source, window) => {
	const request = net.request({
		url: 'https://api.github.com/repos/ngudbhav/lazyType/releases/latest',
	});
	request.on('response', response => {
		response.on('data', body => {
			// Add error handler to send failure to renderer
			const currentVersion = app.getVersion().replace(' ', '');
			const latestVersion = JSON.parse(body).tag_name.replace('v', '');
			const changeLog = JSON.parse(body).body.replace(
				'Changelog',
				'Update available. Here are the changes:\n'
			);
			if(latestVersion !== currentVersion){
				const response = dialog.showMessageBoxSync({
					type: 'info',
					buttons:['Open Browser to download link', 'Close'],
					title: 'Update Available',
					detail: changeLog,
				});
				if(response === 0){
					shell.openExternal('https://github.com/ngudbhav/lazyType/releases/latest').then();
				}
			}
			else{
				if(source === 'user'){
					dialog.showMessageBoxSync({
						type: 'info',
						buttons:['Close'],
						title: 'No update available!',
						detail: 'You already have the latest version installed.'
					});
				}
			}
			mainScreen.webContents.send('updateCheckup', null);
		});
	});
	request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:59.0) Gecko/20100101 ');
	request.end()
};

ipcMain.on('addItem', (_, item) => addItem(item));
ipcMain.on('deleteItem', (_, item) => deleteItem(item, 1));
ipcMain.on('update',  _ => checkUpdates('f'));
ipcMain.on('help', _ => shell.openExternal('https://github.com/ngudbhav/lazyType'));
ipcMain.on('config', _ => configureSystem());

ipcMain.on('backup', _ => {
	const response = dialog.showMessageBoxSync(mainScreen, {
		type: 'info',
		buttons: ['Backup', 'Restore'],
		title: 'Backup/Restore',
		message: 'LazyType Backup and Restore utility. The backup can be used to restore the configuration on a new PC.',
	});
	if(response === 0){
		const filePath = dialog.showSaveDialogSync(mainScreen, {
			title: 'Save the backup file',
			defaultPath: 'history.db'
		});
		if (filePath) {
			fs.copyFile(app.getPath('appData') + '/lazyType/data/history.db', filePath, error => {
				if (error) {
					throw new Error(`Failed to save the Backup. Verbose information: ${error}`);
				} else {
					dialog.showMessageBoxSync(mainScreen, {
						type: 'info',
						buttons: ['Ok'],
						title: 'Backup',
						message: 'The backup file has been successfully saved.',
					});
				}
			});
		}
	} else if(response === 1){
		const filePath = dialog.showOpenDialogSync(mainScreen, {
			properties: ['openFile'],
			filters: [
				{
					name: 'LazyType Backup', extensions: ['db']
				}
			]
		});
		if (filePath[0]) {
			let tempFile = new Nedb({
				filename: filePath[0],
				autoload: true,
			});

			tempFile.find({}, function (error, results) {
				if (error) {
					throw new Error(`Invalid Backup file. Verbose information: ${error}`);
				} else {
					for (let i = 0; i < results.length; i++) {
						addItem(results[i]);
					}
				}
				dialog.showMessageBoxSync(mainScreen, {
					type: 'info',
					title: 'restore',
					buttons: ['Ok'],
					message: 'The backup has been successfully restored. The software will now restart.',
				});
				app.relaunch();
				app.quit();
			});
		}
	}
});

const configureSystem = () => {
	if (!process.env.PATH.includes(appDir)) {
		const response = dialog.showMessageBoxSync(mainScreen, {
			type: 'info',
			buttons: ['Ok', 'Cancel'],
			title: 'Configuration',
			message: 'Configuration process takes some time depending on your computer. The system may ask for admin rights.'
		});
		if (!response) {
			mainScreen.webContents.send('status', { status: 7 });
			//ask for admin rights and invoke the output of config.cpp as new.exe
			sudo.exec('ConfigUtility.exe ' + appDir, {
				name: 'Lazy Type',
			}, (error, stdout) => {
				if (error) {
					throw new Error(`Failed to execute Configuration Utility. Re-installing may fix this problem. Verbose information: ${error}`);
				} else {
					if (stdout === '0') {
						mainScreen.webContents.send('status', { status: 3 });
						dialog.showMessageBoxSync(mainScreen, {
							type: 'info',
							buttons: ['Ok'],
							title: 'Configuration',
							message: 'The system is configured. The software must be restarted to save the new configuration changes. Click Ok to quit the app.',
						});
						app.quit();
					} else {
						dialog.showErrorBox('Lazy Type', 'There seems to be an error. ' + stdout);
					}
				}
			});
		}
	} else {
		dialog.showMessageBoxSync(mainScreen, {
			type: 'info',
			buttons: ['Ok'],
			title: 'Configuration',
			message: 'The system is already configured. If the commands still do not work, file an issue over at the \'Get Help\' link.'
		});
	}
}

/** data = {
 *	name: ""//New command name.
 *	path: ""//File path in case of file and CMD alias in case of command
 *	switch: ""//1 for command and 0 for file
 * }
 * In case updating is performed
 */
const addItem = data => {
	history.find({ path: data.path }, (error, results) => {
		if (error) {
			throw new Error(`An error occurred while adding the command. Verbose information: ${error}`);
		} else {
			if(results.length === 1){
				updateItem(data, results[0].name);
			} else{
				history.find({ name: data.name }, (error, results) => {
					if(error) {
						throw new Error(`An error occurred while adding the command. Verbose information: ${error}`);
					} else{
						if(results.length === 1){
							deleteItem(data, 0);
							createItem(data);
						} else{
							createItem(data);
						}
					}
				});
			}
		}
	});
}

const createItem = data => {
	if(data.switch === 0){
		fs.writeFile(appDir+'\\'+data.name+'.cmd', '@echo off\nstart "" /B \"'+data.path+' %*\"', error => {
			if (error) {
				throw new Error(`An error occurred while adding the command. Verbose information: ${error}`);
			} else {
				history.insert({ "name": data.name, "path": data.path, "switch": data.switch }, error => {
					if(error) {
						throw new Error(`An error occurred while adding the command. Verbose information: ${error}`);
					} else {
						mainScreen.webContents.send('status', { name: data.name, status: 1 });
					}
				});
			}
		});
	} else {
		fs.writeFile(appDir + '\\' +data.name+'.cmd', '@echo off\n' + data.path+' %*', error => {
			if (error) {
				throw new Error(`An error occurred while adding the command. Verbose information: ${error}`);
			} else {
				history.insert({ "name": data.name, "path": data.path, "switch": data.switch }, error => {
					if (error) {
						throw new Error(`An error occurred while adding the command. Verbose information: ${error}`);
					} else {
						mainScreen.webContents.send('status', {name:data.name, status:1});
					}
				});
			}
		});
	}
}

const deleteItem = data => {
	//Delete the command
	fs.unlink(appDir + '\\' + data.name + '.cmd', error => {
		if(error) {
			throw new Error(`Failed to delete command. Verbose information: ${error}`);
		} else{
			history.remove({ name: data.name }, { multi: true });
			mainScreen.webContents.send('status', { name: data.name, status: 2 });
		}
	});
}

const updateItem = (data, oldName) => {
	fs.rename(appDir + '\\' + oldName + '.cmd', appDir + '\\' +data.name+'.cmd', error => {
		if (error) {
			throw new Error(`Failed to update the command. Verbose information: ${error}`);
		} else {
			history.update({ "name":oldName }, { $set:{ "name":data.name } }, { multi: true }, error => {
				if(error) {
					throw new Error(`Failed to update the command. Please delete and try again. Verbose information: ${error}`);
				}
				else{
					mainScreen.webContents.send('status', { name: data.name, status: 3 });
				}
			});
		}
	});
}

app.whenReady().then(() => {
	createMainWindow();
	app.setAppUserModelId('NGUdbhav.LazyType');
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
	});
});
app.on('window-all-closed', () => app.quit());
