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
    var card = document.getElementById('cardBody');
    var cardHtml =
        ` <div class="col s12">
        <div class="card">
            <div class="card-content">
                <span class="card-title">
                        <div class="row">
                            <form action="" class="col s12">

                                    <div class="input-field col s4">
                                        <input disabled value="dir /b" placeholder="Original Command"  type="text" class="validate original_cmd" >
                                    </div>

                                    <div class= "file-field input-field col s2  hide" >
                                            <div class="btn">
                                                    <span>Choose File</span>
                                                    <input type="file" class="filebtn" onchange="fileNameUpdate(%%id%%)">
                                            </div>
                                    </div>
                                    <div class="input-field col s1 center">
                                            <i class=" medium material-icons" id="arrow">arrow_forward</i>
                                    </div>
                                    <div class="input-field col s4">
                                            <input disabled value="ls" placeholder="Shortcut Command"  type="text" class="validate shortcut_cmd" >
                                    </div>
                                    <div class="input-field col s1 center hide submit">
                                            <i class="material-icons submit-icon" onclick="submitContents(%%id%%)">send</i>
                                        </div>
                                        <div class="input-field col s1 right delete ">
                                            <i class="material-icons delete-icon" onclick="deleteContents(%%id%%)">delete</i>
                                        </div>
                                        <div class="input-field col right center edit">
                                                <i class="material-icons edit-icon" onclick="editContents(%%id%%)">edit</i>
                                        </div>																	
                            </form>
                        </div>		
                </span>
            </div>
        </div>
    </div>`;

    for (let i = 1; i <= 10; i++) {
        var newHtml = cardHtml;
        newHtml = newHtml.replace(/%%id%%/gi, i);
        card.innerHTML += newHtml;
    }
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
    let inf = filebtn[id-1];
    
    let obj = {
        name: short[id - 1].value,
        path: org[id-1].value,
        switch: inf.files.length===0 ? 1 : 0 
    };
    ipcRenderer.send('addItem', obj);
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

function fileNameUpdate(id){
    var filebtn = document.getElementsByClassName('filebtn');    
    var org = document.getElementsByClassName('original_cmd');
    org[id-1].setAttribute('value',filebtn[id-1].files[0].path);    
}

$(document).ready(function(){
    ipcRenderer.send('finish-load');
});