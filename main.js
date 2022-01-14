const {
  app, BrowserWindow, ipcMain, shell, dialog, nativeTheme,
} = require('electron');
const path = require('path');
const fs = require('fs');
const request = require('node-fetch');
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
  mainScreen = new BrowserWindow({
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#333333' : '#ffffff',
    frame: false,
    webPreferences: {
      devTools: false,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../web', 'preload.js'),
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
  fs.mkdir(appDir, error => {
    if(error && error.code !== 'EEXIST') {
      throw error;
    }
  });
}
ipcMain.on('finish-load', () => {
  history.find({}, (error, results) => {
    if (error) throw error;
    else {
      mainScreen.webContents.send('history', results);
      //Detect first run and perform config steps initially.
      settings.find({}, (error, results) => {
        if (error) throw error;
        else {
          if (results.length === 0) {
            dialog.showMessageBox(mainScreen, {
              type: "info",
              buttons: ["Ok", "Cancel"],
              title: "First Run",
              message: "This seems to be the first time, the software is run on the system. We need to perform some final configuration steps once. Click Ok to begin."
            }).then(response =>{
              if (response === 0) {
                configureSystem();
              }
            });
          }
          settings.insert({ firstRun: false }, error => {
            if (error) throw error;
          });
        }
      });
    }
  });
});

const checkUpdates = e => {
  request(
    'https://api.github.com/repos/ngudbhav/lazyType/releases/latest',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:59.0) Gecko/20100101 ' } }
  ).then(res => res.text()).then(body => {
    const currentVersion = app.getVersion().replace(' ', '');
    const latestVersion = JSON.parse(body).tag_name.replace('v', '');
    const changeLog = JSON.parse(body).body.replace(
      'Changelog',
      'Update available. Here are the changes:\n'
    );
    if (latestVersion !== currentVersion) {
      dialog.showMessageBox(
        {
          type: 'info',
          buttons: ['Open Browser to download link', 'Close'],
          title: 'Update Available',
          detail: changeLog,
        }).then(response => {
        if (response === 0) {
          shell.openExternal('https://github.com/ngudbhav/lazyType/releases/latest').then();
        }
      });
    }
    if (e === 'f') {
      mainScreen.webContents.send('status', { status: 4 });
    }
  });
}

ipcMain.on('addItem', (_, item) => addItem(item));
ipcMain.on('deleteItem', (_, item) => deleteItem(item, 1));
ipcMain.on('update',  _ => checkUpdates('f'));
ipcMain.on('help', _ => shell.openExternal('https://github.com/ngudbhav/lazyType'));
ipcMain.on('config', _ => configureSystem());

ipcMain.on('backup', () => {
  dialog.showMessageBox(mainScreen, {
    type: "info",
    buttons: ["Backup", "Restore", "Cancel"],
    title: "Backup/Restore",
    message: "Choose the directory where you want to keep your backup file. While restoring, Browse to the file."
  }).then(response => {
    if(response === 0){
      //Backup
      dialog.showSaveDialog(mainScreen, {
        title: 'Save the backup file',
        defaultPath: 'history.db'
      }).then(filePath => {
        if (filePath) {
          fs.copyFile(app.getPath('appData') + '/lazyType/data/history.db', filePath, error => {
            if (error) throw error;
            else {
              dialog.showMessageBox(mainScreen, {
                type: 'info',
                buttons: ["Ok"],
                title: 'Backup',
                message: "The backup file has been successfully saved."
              }).then();
            }
          });
        }
      });
    }
    else if(response === 1){
      //restore
      dialog.showOpenDialog(mainScreen, {
        properties: ['openFile'],
        filters: [
          {
            name: 'LazyType Backup', extensions: ['db']
          }
        ]
      }).then(filePath => {
        if (filePath[0]) {
          let tempFile = new Nedb({
            filename: filePath[0]
          });
          tempFile.loadDatabase();
          tempFile.find({}, function (error, results) {
            if (error) throw error;
            else {
              results.forEach(item => {
                addItem(item);
              });
            }
            dialog.showMessageBox(mainScreen, {
              type: "info",
              title: "restore",
              buttons: ["Ok"],
              message: "The backup has been successfully restored. App will now restart."
            }).then(() => {
              app.relaunch();
              app.quit();
            });
          });
        }
      });
    }
  });
});

const configureSystem = () => {
  if (!process.env.PATH.includes(appDir)) {
    dialog.showMessageBox(mainScreen, {
      type: "info",
      buttons: ["Ok", "Cancel"],
      title: "Configuration",
      message: "Configuration process takes some time depending on your computer. The system may ask for admin rights."
    }).then((response) => {
      //0 => Yes
      //1 => No
      if (!response) {
        mainScreen.webContents.send('status', { status: 7 });
        //ask for admin rights and invoke the output of config.cpp as new.exe
        sudo.exec('ConfigUtility.exe '+appDir, {
          name: 'Lazy Type'
        }, (error, stdout) => {
          if (error) throw error;
          else {
            if (parseInt(stdout, 10) === 0) {
              mainScreen.webContents.send('status', { status: 3 });
              dialog.showMessageBox(mainScreen, {
                type: "info",
                buttons: ["Ok"],
                title: "Configuration",
                message: "The system is configured. The software must be restarted to save the new configuration changes. Click Ok to quit the app."
              }).then(() => {
                app.relaunch();
                app.quit();
              });
            }
            else {
              dialog.showErrorBox('Lazy Type', 'There seems to be some error. ' + stdout);
            }
          }
        });
      }
    });
  }
  else {
    dialog.showMessageBox(mainScreen, {
      type: "info",
      buttons: ["Ok"],
      title: "Configuration",
      message: "The system is already configured. If the commands still do not work, file an issue over at the 'Get Help' link."
    }).then();
  }
}

const addItem = data => {
  //{
  //	name: ""//New command name.
  //	path: ""//File path in case of file and CMD alias in case of command
  //	switch: ""//1 for command and 0 for file
  //}
  //In case updation is performed
  history.find({path: data.path}, (error, results) => {
    //The case when only the alias is updated
    if (error) throw error;
    else {
      if(results.length===1){
        updateItem(data, results[0].name);//Only rename the file
      }
      else{
        history.find({name: data.name}, (error, results) => {
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
const createItem = data => {
  //Create file and add entry into the database
  //Both cases differ by switch 1/0.
  if(data.switch === 0){
    fs.writeFile(appDir+'\\'+data.name+'.cmd', '@echo off\nstart "" /B \"'+data.path+' %*\"', error => {
      if (error) throw error;
      else{
        //History entry
        history.insert({ "name": data.name, "path": data.path, "switch": data.switch}, error => {
          if(error) throw error;
          else{
            mainScreen.webContents.send('status', { name: data.name, status: 1 });
          }
        });
      }
    });
  }
  else{
    fs.writeFile(appDir + '\\' +data.name+'.cmd', "@echo off\n"+data.path+" %*", error => {
      if (error) throw error;
      else{
        //History entry
        history.insert({ "name": data.name, "path": data.path, "switch": data.switch}, error =>{
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
const deleteItem = data => {
  //Delete the command
  fs.unlink(appDir + '\\' +data.name+".cmd", error => {
    if(error) throw error;
    else{
      history.remove({name: data.name}, {multi: true});
      mainScreen.webContents.send('status', { name: data.name, status: 2 });
    }
  });
}
const updateItem = (data, oname) => {
  //Just renaming the command will invoke the file
  //Previous Name -> New Name
  fs.rename(appDir + '\\' + oname + '.cmd', appDir + '\\' +data.name+'.cmd', error => {
    if (error) throw error;
    else{
      history.update({"name":oname}, {$set:{"name":data.name}}, {multi: true}, error => {
        if(error) throw error;
        else{
          mainScreen.webContents.send('status', { name: data.name, status: 3 });
        }
      });
    }
  });
}

app.on('ready', () => createMainWindow());
app.on('window-all-closed', () => app.quit());
app.on('activate', () => createMainWindow());
