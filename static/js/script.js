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

    //save and update in database

    //ui update
    var sub = document.getElementsByClassName('submit'); 
    var del = document.getElementsByClassName('delete');
    var edit = document.getElementsByClassName('edit');
    var file = document.getElementsByClassName('file-field');
    var org = document.getElementsByClassName('original_cmd');
    var short = document.getElementsByClassName('shortcut_cmd');

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

    //ui update
    var card = document.getElementsByClassName('card');
    card[id-1].classList.add('hide');

}