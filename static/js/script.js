var electron = require('electron');
var { ipcRenderer } = electron;
var countCards = 0;
ipcRenderer.on('status', function(e, item){
    // item.status = 1 => Created new command
    // item.status = 2 => Deleted command
    // item.status = 3 => Updated new command
    // item.name is the name of the shortcut command
    switch(item.status){
        case 1: M.toast({html: 'Created Successfully &nbsp<i class="material-icons">check_circle</i>',classes:'orange white-text left',displayLength:2000});
                break;
        case 2: M.toast({html: 'Deleted Successfully &nbsp<i class="material-icons">check_circle</i>',classes:'orange white-text left',displayLength:2000});
                break;
        case 3:M.toast({html: 'Updated Successfully &nbsp<i class="material-icons">check_circle</i>',classes:'orange white-text left',displayLength:2000});
                break;
    }  
});

var addCard = `<div class="col s12">
<div class="card">
    <div class="card-content">
        <span class="card-title">
                <div class="row">
                    <form action="" class="col s12">

                            <div class="input-field col s4">
                                <input  placeholder="Original Command"  type="text" class="validate original_cmd" >
                            </div>

                            <div class= "file-field input-field col s2 ">
                                    <div class="btn">
                                            <span>Choose File</span>
                                            <input type="file" class="filebtn" onchange="fileNameUpdate(%%id%%)">
                                    </div>
                            </div>
                            <div class="input-field col s1 center">
                                    <i class=" medium material-icons" id="arrow">arrow_forward</i>
                            </div>
                            <div class="input-field col s4">
                                    <input placeholder="Shortcut Command"  type="text" class="validate shortcut_cmd" >
                            </div>
                            <div class="input-field col s1 center submit">
                                <i class="material-icons submit-icon" onclick="submitContents(%%id%%)">send</i>
                            </div>
                            <div class="input-field col s1 right delete hide">
                                <i class="material-icons delete-icon" onclick="deleteContents(%%id%%)">delete</i>
                            </div>
                            <div class="input-field col right center edit hide">
                                    <i class="material-icons edit-icon" onclick="editContents(%%id%%)">edit</i>
                            </div>																	
                    </form>
                </div>		
        </span>
    </div>
</div>
</div> `;

var cardHtml =
        ` <div class="col s12">
        <div class="card">
            <div class="card-content">
                <span class="card-title">
                        <div class="row">
                            <form action="" class="col s12">

                                    <div class="input-field col s4">
                                        <input disabled value="%%org_cmd%%" placeholder="Original Command"  type="text" class="validate original_cmd" >
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
                                            <input disabled value="%%short_cmd%%" placeholder="Shortcut Command"  type="text" class="validate shortcut_cmd" >
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

ipcRenderer.on('history', function(e, item){
    console.log(item);
    var card = document.getElementById('cardBody');
    countCards = item.length;
    if(item.length == 0){
        var newHtml = addCard;
        newHtml = newHtml.replace(/%%id%%/gi, 1);
        card.innerHTML += newHtml;
        document.getElementsByClassName('extraText')[0].classList.remove('hide');
        document.getElementsByClassName('extraText')[1].classList.remove('hide');

    }

    for (let i = 0; i < item.length; i++) {
        var newHtml = cardHtml;
        newHtml = newHtml.replace(/%%id%%/gi, i+1);
        newHtml = newHtml.replace(/%%org_cmd%%/gi, item[i].path);
        newHtml = newHtml.replace(/%%short_cmd%%/gi, item[i].name);

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

function addNewCard(){
    if(countCards > 0){
        var card = document.getElementById('cardBody');
        var newHtml = addCard;
        countCards++;
        newHtml = newHtml.replace(/%%id%%/gi, countCards);
        card.innerHTML = newHtml + card.innerHTML;
    }
}

$(document).ready(function(){
    ipcRenderer.send('finish-load');
});
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, {
      direction: 'bottom'
    });
    var elems2 = document.querySelectorAll('.tooltipped');
    var instances = M.Tooltip.init(elems2, {});
});

