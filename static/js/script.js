let countCards = 0;

window.api.receive('status', item => {
    switch(item.status){
        case 1: M.toast({html: 'Created Successfully &nbsp<i class="material-icons">check_circle</i>',classes:'orange white-text left',displayLength:2000});
                break;
        case 2: M.toast({html: 'Deleted Successfully &nbsp<i class="material-icons">check_circle</i>',classes:'orange white-text left',displayLength:2000});
                break;
        case 3:M.toast({html: 'Updated Successfully &nbsp<i class="material-icons">check_circle</i>',classes:'orange white-text left',displayLength:2000});
                break;
        case 4:M.toast({html: 'No updates Available &nbsp<i class="material-icons">check_circle</i>',classes:'orange white-text left',displayLength:2000});
                break;
        case 5: M.toast({ html: 'Connection Error &nbsp<i class="material-icons">cancel</i>', classes: 'orange white-text left', displayLength: 2000 });
                break;
        case 6: M.toast({ html: 'Backup Created Successfully &nbsp<i class="material-icons">cancel</i>', classes: 'orange white-text left', displayLength: 2000 });
                break;
        case 7: M.toast({ html: 'Loading ...&nbsp', classes: 'orange white-text left', displayLength: 2000 });
                break;
    }  
});

const addCard = `<div class="col s12">
<div class="card">
    <div class="card-content">
        <span class="card-title">
                <div class="row">
                    <form action="" class="col s12">

                            <div class="input-field col s4 orgcmd">
                                <input  placeholder="Original Command"  type="text" class=" original_cmd">
                            </div>

                            <div class= "file-field input-field col s2 filediv">
                                    <div class="btn">
                                            <span>Choose File</span>
                                            <input type="file" class="filebtn" onchange="fileNameUpdate(this)">
                                    </div>
                            </div>
                            <div class="input-field col s1 center">
                                    <i class=" medium material-icons" id="arrow">arrow_forward</i>
                            </div>
                            <div class="input-field col s4 shortcmd">
                                    <input placeholder="Shortcut Command"  type="text" class=" shortcut_cmd" onkeyup="preSubmit(this, event);">
                            </div>
                            <div class="input-field col s1 center submit">
                                <i class="material-icons submit-icon" onclick="submitContents(this)">send</i>
                            </div>
                            <div class="input-field col s1 right delete hide">
                                <i class="material-icons delete-icon" onclick="deleteContents(this)">delete</i>
                            </div>
                            <div class="input-field col right center edit hide">
                                    <i class="material-icons edit-icon" onclick="editContents(this)">edit</i>
                            </div>																	
                    </form>
                </div>		
        </span>
    </div>
</div>
</div> `;

const cardHtml =
        ` <div class="col s12">
        <div class="card">
            <div class="card-content">
                <span class="card-title">
                        <div class="row">
                            <form action="" class="col s12">

                                    <div class="input-field col s4 orgcmd">
                                        <input disabled value="%%org_cmd%%" placeholder="Original Command"  type="text" class=" original_cmd" >
                                    </div>

                                    <div class= "file-field input-field col s2  hide filediv" >
                                            <div class="btn">
                                                    <span>Choose File</span>
                                                    <input type="file" class="filebtn" onchange="fileNameUpdate(this)">
                                            </div>
                                    </div>
                                    <div class="input-field col s1 center">
                                            <i class=" medium material-icons" id="arrow">arrow_forward</i>
                                    </div>
                                    <div class="input-field col s4 shortcmd">
                                            <input disabled value="%%short_cmd%%" placeholder="Shortcut Command"  type="text" class=" shortcut_cmd" >
                                    </div>
                                    <div class="input-field col s1 center hide submit">
                                            <i class="material-icons submit-icon" onclick="submitContents(this, %%id%%)">send</i>
                                    </div>
                                    <div class="input-field col s1 right delete ">
                                            <i class="material-icons delete-icon" onclick="deleteContents(this)">delete</i>
                                    </div>
                                    <div class="input-field col right center edit">
                                        <i class="material-icons edit-icon" onclick="editContents(this)">edit</i>
                                    </div>																	
                            </form>
                        </div>		
                </span>
            </div>
        </div>
    </div>`;

window.api.receive('history', item => {
    const card = document.getElementById('cardBody');
    countCards = item.length;
    if(item.length === 0){
        let newHtml = addCard;
        newHtml = newHtml.replace(/%%id%%/gi, '1');
        card.innerHTML += newHtml;
        document.getElementsByClassName('extraText')[0].classList.remove('hide');
        document.getElementsByClassName('extraText')[1].classList.remove('hide');

    }

    for (let i = 0; i < item.length; i++) {
        let newHtml = cardHtml;
        newHtml = newHtml.replace(/%%id%%/gi, (i+1).toString());
        newHtml = newHtml.replace(/%%org_cmd%%/gi, item[i].path);
        newHtml = newHtml.replace(/%%short_cmd%%/gi, item[i].name);
        card.innerHTML += newHtml;
    }
});

const help = () => {
    window.api.send('help', 'null');
    M.toast({ html: 'Check your Browser &nbsp<i class="material-icons">circle_check</i>', classes: 'orange white-text left', displayLength: 2000 });
}

const checkUpdates = () => {
    window.api.send('update', 'null');
}

const config = () => {
    window.api.send('config');
}

const backup = () => {
    window.api.send('backup');
}

const preSubmit = (f, e) => {
    if(e.keyCode === 13){
        submitContents(f);
    }
    else{
        return false;
    }
}

const editContents = e => {
    let p = $(e).parent();
    p.siblings('.file-field').removeClass('hide');
    p.siblings('.submit').removeClass('hide');
    p.siblings('.delete').addClass('hide');
    p.addClass('hide');
    p.siblings('.orgcmd').children()[0].removeAttribute('disabled');
    p.siblings('.shortcmd').children()[0].removeAttribute('disabled');
}

const submitContents = e => {
    let p = $(e).parent();
    let orgcmd = p.siblings('.orgcmd').children().val();
    let shortcmd = p.siblings('.shortcmd').addBack().children().val();
        
    if(orgcmd && shortcmd){
        let inf = p.siblings('.filediv').children('.btn').children("input")[0];
        // //save and update in database
        let obj = {
            name: shortcmd,
            path: orgcmd,
            switch: inf.files.length === 0 ? 1 : 0
        };
        window.api.send('addItem', obj);
        p.siblings('.file-field').addClass('hide');
        if(p.siblings('.shortcmd').length == 0){
            p.siblings('.submit').addClass('hide');
        }
        else{
            p.siblings('.submit').addBack().addClass('hide');
        }
        p.siblings('.delete').removeClass('hide');
        p.siblings('.edit').removeClass('hide');
        p.siblings('.orgcmd').children()[0].setAttribute('disabled', 'disabled');
        p.siblings('.shortcmd').addBack().children()[0].setAttribute('disabled', 'disabled');
        p.siblings('.orgcmd').children().val(orgcmd);
        p.siblings('.shortcmd').addBack().children().val(shortcmd);    
        countCards++;
    }
    else{
        M.toast({ html: 'Incomplete Details &nbsp<i class="material-icons">cancel</i>', classes: 'orange white-text left', displayLength: 2000 });
    }
}

const deleteContents = e => {
    let sure = confirm('Are you sure you want to delete shortcut ?');
    if(sure){
        let p = $(e).parent();
        //delete from db
        window.api.send('deleteItem', { name: p.siblings('.shortcmd').children().val()});
        //ui update
        p.parents('.card').parent().remove();
    }
    
}

const fileNameUpdate = e => {
    let p = $(e).parents('.filediv');
    p.siblings('.orgcmd').children().val($(e)[0].files[0].path)  
}

const addNewCard = () => {
    if(countCards > 0){
        const card = document.getElementById('cardBody');
        let newHtml = addCard;
        newHtml = newHtml.replace(/%%id%%/gi, countCards);
        card.innerHTML = newHtml + card.innerHTML;
    }
}

const hideCards = () => {
    const cards = document.getElementsByClassName('card');
    for(let i=0;i< cards.length;i++) cards[i].classList.add('hide');
}
const showCards = () => {
    const cards = document.getElementsByClassName('card');
    const search_text  = document.getElementById("search");
    search_text.value = "";
    for(let i=0;i< cards.length;i++) cards[i].classList.remove('hide');
}
const searchCards = () => {
    const cards = document.getElementsByClassName('card');
    const short = document.getElementsByClassName('shortcut_cmd');
    const org = document.getElementsByClassName('original_cmd');
    const search_text  = document.getElementById("search").value;

    for(let i=0;i<short.length;i++){
        if(((short[i].value.includes(search_text)) || (org[i].value.includes(search_text))) && search_text !== ""){
            $(cards[i]).removeClass('hide');
        }
        else if(!cards[i].classList.contains('hide')){
            cards[i].classList.add('hide');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const elems = document.querySelectorAll('.fixed-action-btn');
    M.FloatingActionButton.init(elems, {
      direction: 'bottom'
    });
    const elems2 = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(elems2, {});
    window.api.send('finish-load');
});
