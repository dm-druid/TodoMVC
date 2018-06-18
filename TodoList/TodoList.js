var $ = function(sel) {
    return document.querySelector(sel);
};

var $All = function(sel) {
    return document.querySelectorAll(sel);
};
var makeArray = function(likeArray) {
    var array = [];
    for (var i = 0; i < likeArray.length; ++i) {
       array.push(likeArray[i]);
    }
    return array;
};

// state const
const STATE_COMPLETED = 'completed';
const STATE_PENDING = 'pending';
const STATE_ACTIVE = 'active';
const STATE_SELECTED = 'selected';
const STATE_EDIT = 'edit';


function updateActive() {
    var list = $('#list');
    var active = $('#todo-count');
    active.innerHTML = list.children.length + ' items left';
}


function updateList(filter) {
    var filter = model.data.filter;
    var items = model.data.items;
    var list = $('#list');
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }
    for (var i=0; i<items.length; ++i) {
        var item = items[i];
        if (item.state === filter || filter === 'all') {
            var itemNode = createItem(item.msg);
            itemNode.id = 'item-' + i;
            itemNode.classList.add(item.state);
            list.insertBefore(itemNode, list.firstChild);
        }
    }
    updateActive();
}


function initData() {
    updateList();
    var filterName = model.data.filter;
    var filter = $('#' + filterName);
    filter.classList.add(STATE_SELECTED);
}


window.onload = function() {
    // data init from local storage
    
    model.init(initData);

    // bind the add event
    $('#todo').addEventListener('keyup', function(event) {
        if (event.keyCode != 0xd) return;
        addTodo();
    }, false);
    // add by button
    $('#add').addEventListener('click', addTodo, false);

    // bind the filters' select event
    var filters = makeArray($All('.filters li a'));
    filters.forEach(function(filter) {
        filter.addEventListener('click', function() {
            for (var f of filters) {
                f.classList.remove(STATE_SELECTED);
            }
            filter.classList.add(STATE_SELECTED);
            model.data.filter = filter.id;
            model.flush();
            updateList();
        }, false);
    });

    // bind clear completed event
    $('.clear-completed').addEventListener('click', clearCompleted, false);
    $('.toggle-all').addEventListener('click', completeAll, false);
    // $('#list').style.height = Math.floor(window.innerHeight * 0.7);
    
}


function addTodo() {
    var todo = $('#todo');
    var list = $('#list');
    var msg = todo.value;
    if (msg === '') {
        // alert('The message is empty.');
        return;
    }
    
    // every change needs a flush
    model.data.items.push({msg: msg, state:STATE_PENDING});
    model.flush();
    updateList();
    todo.value = '';
}


function createItem(msg) {
    var item = document.createElement('div');
    item.className = 'list-item'; 

    var itemCheck = document.createElement('div');
    // itemCheck.setAttribute('type', "checkbox");
    itemCheck.classList.add('item-toggle');

    var itemContent = document.createElement('div');
    itemContent.innerHTML = msg;
    itemContent.className = 'item-content';

    var itemDelete = document.createElement('div');
    itemDelete.innerHTML = '+';
    itemDelete.className = 'item-delete';

    item.appendChild(itemCheck);
    item.appendChild(itemContent);
    item.appendChild(itemDelete);

    // bind the event
    itemCheck.addEventListener('click', function() {
        // var item = itemCheck.parentNode;
        var id = item.id.split('-')[1];
        if(item.classList.contains(STATE_COMPLETED)){
            item.classList.remove(STATE_COMPLETED);
            // itemCheck.classList.remove(STATE_SELECTED);
            model.data.items[id].state = STATE_PENDING;
        }
        else {
            item.classList.add(STATE_COMPLETED);
            // itemCheck.classList.add(STATE_SELECTED);
            model.data.items[id].state = STATE_COMPLETED;
        }
        model.flush();
        updateList();
    }, false);

    itemDelete.addEventListener('click', function(event) {
        var id = item.id.split('-')[1];
        model.data.items.splice(id, 1);
        // list.removeChild(item);
        model.flush();
        updateList();
        event.stopPropagation();
    }, false);


    var manager = new Hammer.Manager(itemContent);

    // Create a recognizer
    var DoubleTap = new Hammer.Tap({
    event: 'doubletap',
    taps: 2
    });
    // Add the recognizer to the manager
    manager.add(DoubleTap);
    // Subscribe to desired event
    manager.on('doubletap', function(e) {
        console.log('double click');
        item.classList.add(STATE_EDIT);

        var edit = document.createElement('input');
        var finished = false;
        edit.setAttribute('type', 'text');
        edit.setAttribute('class', 'edit');
        edit.setAttribute('value', itemContent.innerHTML);

        function finish() {
            if (finished) return;
            finished = true;
            item.removeChild(edit);
            item.classList.remove(STATE_EDIT); 
        }

        // edit.addEventListener('blur', function() {
        //     finish();
        // }, false);

        edit.addEventListener('keyup', function(ev) {
            if (ev.keyCode == 27) { // Esc
                finish();
            }
            else if (ev.keyCode == 13) {
                itemContent.innerHTML = this.value;
                var id = item.id.split('-')[1];
                model.data.items[id].msg = this.value;
                model.flush();
                updateList();
            }
        }, false);

        item.appendChild(edit);
        edit.focus();
    });

    return item;
}

function clearCompleted() {
    var items = model.data.items;
    for (var i=items.length-1; i>=0; --i) {
        var item = items[i];
        if (item.state === STATE_COMPLETED) {
            items.splice(i, 1);
        }
    }
    model.flush();
    updateList();
}

function completeAll() {
    var state;
    var toggleAll = $('.toggle-all');
    if (toggleAll.classList.contains(STATE_SELECTED)) { 
        state = STATE_PENDING; 
        toggleAll.classList.remove(STATE_SELECTED);
    }
    else { 
        state = STATE_COMPLETED;
        toggleAll.classList.add(STATE_SELECTED);
    }
    var items = model.data.items;
    for (var item of items) {
        item.state = state;
    }
    model.flush();
    updateList();
}