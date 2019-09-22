var electron = require('electron');
var { ipcRenderer } = electron;

ipcRenderer.on('status', function(e, item){
    // item.status = 1 => Created new command
    // item.status = 2 => Deleted command
    // item.status = 3 => Updated new command
    // item.name is the name of the shortcut command
});
ipcRenderer.on('history', function(e, item){
    console.log(item);
    // item.name => name of the command
    // item.path => File path in case of file and CMD alias in case of command
});

function editContents(id){
    //ui update
    var sub = document.getElementsByClassName('submit'); 
    var del = document.getElementsByClassName('delete');
    var edit = document.getElementsByClassName('edit');
    var file = document.getElementsByClassName('file-field');
    var org = document.getElementsByClassName('original_cmd');
    var short = document.getElementsByClassName('shortcut_cmd');

    file[id-1].classList.remove('hide');
    sub[id-1].classList.remove('hide');
    del[id-1].classList.add('hide');
    edit[id-1].classList.add('hide');
    org[id-1].removeAttribute('disabled');
    short[id-1].removeAttribute('disabled');

}

function submitContents(id){
    var sub = document.getElementsByClassName('submit');
    var del = document.getElementsByClassName('delete');
    var edit = document.getElementsByClassName('edit');
    var file = document.getElementsByClassName('file-field');
    var org = document.getElementsByClassName('original_cmd');
    var short = document.getElementsByClassName('shortcut_cmd');
    var filebtn = document.getElementsByClassName('filebtn');
    // //save and update in database
    // let inf = filebtn[id-1];
    // // if(inf.files.length===0){
    // //     org[id-1].value = '';
    // // }
    // // else{
    // //     path = "";
    // // }
    // let obj = {
    //     nname: short[id - 1].value,
    //     path: org[id-1].value,
    //     switch: inf.files.length===0 ? 1 : 0 
    // };
    // ipcRenderer.send('addItem', obj);
    //ui update
    


    file[id-1].classList.add('hide');
    sub[id-1].classList.add('hide');
    del[id-1].classList.remove('hide');
    edit[id-1].classList.remove('hide');
    org[id-1].setAttribute('disabled','disabled');
    short[id-1].setAttribute('disabled','disabled');
    org[id-1].setAttribute('value', org[id-1].value);
    short[id-1].setAttribute('value', short[id-1].value);

}

function deleteContents(id){

    //delete from db
    ipcRenderer.send('deleteItem', { name: document.getElementsByClassName('shortcut_cmd')[id - 1].value});
    //ui update
    var card = document.getElementsByClassName('card');
    card[id-1].classList.add('hide');

}