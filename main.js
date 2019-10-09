const {app, BrowserWindow, ipcMain, shell, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const request = require('request');
const sudo = require('sudo-prompt');
//
//Releases and then compile c++ to form 2 exe seperate.
//Same for the tests.While executing the tests, Ask for a switch  to ask for admin

const nedb = require('nedb');
const history = new nedb({
	filename: app.getPath('appData') + '/lazyType/data/history.db'
});
//Save the db in format
//{
//	"name":"trico",
//	"path":path
//}
history.loadDatabase();

let mainScreen;
function createMainWindow(){
	//Create login screen
	mainScreen = new BrowserWindow({
		width: 1000, height: 600, minHeight: 600,
		minWidth: 1000,webPreferences: {
		nodeIntegration: true
	},frame:false});
	mainScreen.loadFile(path.join(__dirname, 'views', 'main.html'));
	mainScreen.setMenu(null);
	mainScreen.removeMenu();
	mainScreen.openDevTools();
	mainScreen.on('closed', function(){
		loginScreen = null;
	});
	//checkUpdates();
}
ipcMain.on('finish-load', function(e, item){
	history.find({}, function (error, results) {
		if (error) throw error;
		else {
			console.log(results);
			mainScreen.webContents.send('history', results);
		}
	});
});
ipcMain.on('addItem', function(e, item){
	addItem(item);
});
ipcMain.on('deleteItem', function(e, item){
	deleteItem(item, 1);
});
function checkUpdates(e) {
	request('https://api.github.com/repos/ngudbhav/lazyType/releases/latest', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:59.0) Gecko/20100101 ' } }, function (error, html, body) {
		if (!error) {
			var v = app.getVersion().replace(' ', '');
			var latestV = JSON.parse(body).tag_name.replace('v', '');
			var changeLog = JSON.parse(body).body.replace('<strong>Changelog</strong>', 'Update available. Here are the changes:\n');
			if (latestV != v) {
				dialog.showMessageBox(
					{
						type: 'info',
						buttons: ['Open Browser to download link', 'Close'],
						title: 'Update Available',
						detail: changeLog,
					}, function (response) {
						if (response === 0) {
							shell.openExternal('https://github.com/ngudbhav/lazyType/releases/latest');
						}
					}
				);
				notifier.notify(
					{
						appName: "NGUdbhav.lazy",
						title: 'Update Available',
						message: 'A new version is available. Click to open browser and download.',
						icon: path.join(__dirname, 'images', 'logo.ico'),
						sound: true,
						wait: true
					});
				notifier.on('click', function (notifierObject, options) {
					shell.openExternal('https://github.com/ngudbhav/lazyType/releases/latest');
				});
			}
			else {
				if (e === 'f') {
					mainScreen.webContents.send('status', { name: data.name, status: 4 });					
				}
			}
		}
		else {
			if (e === 'f') {
				mainScreen.webContents.send('status', { name: data.name, status: 5 });
			}
		}
	});
}
ipcMain.on('update', function (e, item) {
	checkUpdates('f');
});
ipcMain.on('help', function(e, item){
	shell.openExternal('https://github.com/ngudbhav/lazyType');
});
ipcMain.on('config', function(e, item){
	//extract the current path
	let appDir = app.getAppPath()+'\\bin';
	//check if system is already configured
	if(!process.env.PATH.includes(appDir)){
		dialog.showMessageBox(mainScreen, {
			type: "info",
			buttons: ["Ok", "Cancel"],
			title: "Configuration",
			message: "Configuration process takes some time depending on your computer. The system may ask for admin rights."
		}, function (response) {
			//0 => Yes
			//1 => No
			if (!response) {
				mainScreen.webContents.send('status', { status: 7 });
				//ask for admin rights and invoke the output of config.cpp as new.exe
				sudo.exec('new.exe', {
					name: 'Lazy Type'
				}, function (error, stdout, stderr) {
					if (error) throw error;
					else {
						if (stdout == 0) {
							mainScreen.webContents.send('status', { status: 3 });
							dialog.showMessageBox(mainScreen, {
								type: "info",
								buttons: ["Ok"],
								title: "Configuration",
								message: "The system is configured. Please restart the software. If the commands still do not work, try reinstalling the program."
							});
						}
						else {
							dialog.showErrorBox('Lazy Type', 'There seems to be an error. ' + stdout);
						}
					}
				});
			}
		});
	}
	else{
		dialog.showMessageBox(mainScreen, {
			type: "info",
			buttons: ["Ok"],
			title: "Configuration",
			message: "The system is already configured. If the commands still do not work, try reinstalling the program."
		});
	}
});

function addItem(data){
	//{
	//	name: ""//New command name.
	//	path: ""//File path in case of file and CMD alias in case of command
	//	switch: ""//1 for command and 0 for file
	//}
	//In case updation is performed
	history.find({path: data.path}, function (error, results) {
		//The case when only the alias is updated
		if (error) throw error;
		else {
			if(results.length===1){
				updateItem(data, results[0].name);//Only rename the file
			}
			else{
				history.find({name: data.name}, function(error, results){
					//The case when the path is updated
					if(error) throw error;
					else{
						if(results.length === 1){
							//Delete the previous file with the same name
							deleteItem(data, 0);
							//Create a new file with the new path
							createItem(data);
						}
						else{
							//New command Input Case
							//Create a new File
							createItem(data);
						}
					}
				});
			}
		}
	});
}
function createItem(data){
	//Create file and add entry into the database
	//Both cases differ by switch 1/0.
	if(data.switch === 0){
		fs.writeFile('./env/'+data.name+'.cmd', '@echo off\nstart "" /B \"'+data.path+' %*\"', function (error) {
			if (error) throw error;
			else{
				//History entry
				history.insert({"name":data.name, "path":data.path}, function(error){
					if(error) throw error;
					else{
						mainScreen.webContents.send('status', { name: data.name, status: 1 });
					}
				});
			}
		});
	}
	else{
		fs.writeFile('./env/'+data.name+'.cmd', "@echo off\n"+data.path+" %*", function (error) {
			if (error) throw error;
			else{
				//History entry
				history.insert({"name": data.name,"path": data.path}, function (error) {
					if (error) throw error;
					else{
						mainScreen.webContents.send('status', {name:data.name, status:1});
					}
				});
			}
		});
	}
	//Run an existing command
}
function deleteItem(data, flag){
	//Delete the command
	fs.unlink("./env/"+data.name+".cmd", function(error){
		if(error) throw error;
		else{
			history.remove({name: data.name}, {multi: true});
			mainScreen.webContents.send('status', { name: data.name, status: 2 });
		}
	});
}
function updateItem(data, oname){
	//Just renaming the command will invoke the file
	//Previous Name -> New Name
	fs.rename('./env/'+oname+'.cmd', './env/'+data.name+'.cmd', function (error) {
		if (error) throw error;
		else{
			history.update({"name":data.oname}, {$set:{"name":data.name}}, {}, function(error){
				if(error) throw error;
				else{
					mainScreen.webContents.send('status', { name: data.name, status: 3 });
				}
			});
		}
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
