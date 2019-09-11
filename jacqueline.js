window.Jacqueline = window.Jacqueline || {};
(function(){
    var JacquelineUI = function(options){
        return new JacquelineUI.module.rend(options);
    }
    JacquelineUI.module = JacquelineUI.prototype = {
        renderers : {
            input:function(object, key){
                var input = document.createElement('input');
                input.value = object[key]
                input.oninput = function(){
                    object[key] = this.value;
                }
                return input;
            },
            textarea:function(object, key){
                var input = document.createElement('textarea');
                input.value = object[key]
                input.oninput = function(){
                    object[key] = this.value;
                }
                return input;
            },
            number:function(object, key){
                var input = document.createElement('input');
                input.type = 'number'
                input.value = object[key]
                input.oninput = function(){
                    object[key] = this.value;
                }
                return input;
            },
            date:function(object, key, config){
                var input = document.createElement('div');
                var format = config.format || "dddd, MMMM Do YYYY";
                input.innerHTML = moment(object[key]).format(format)
                $(input).datepicker({
                    format:format
                }).on('pick.datepicker', function(e){
                    e.preventDefault();
                    object[key] = e.date.toISOString();
                    input.innerHTML = moment(e.date).format(format)
                });
                return input;
            },
            richtext:function(object, key){
                var input = document.createElement('div');
                input.innerHTML = object[key]
                input.contentEditable = true;
                $(input).on('keydown keypress input paste', function(e){
                    if(e.keyCode == 13 && e.type == 'keydown'){
                        e.preventDefault();
                        document.execCommand('insertHTML', false, '<br>')
                    }
                    object[key] = this.innerHTML;
                })
                return input;
            },
            select:function(object, key, conf){

                var input = document.createElement('select');
                input.value = object[key];
                console.log(object, key, conf)
                var i = 0;
                for( ; i < object[key].length; i++){
                    var option = document.createElement('option');
                    option.value = object[key][i][conf.value]
                    option.innerText = object[key][i][conf.displayValue];
                    input.appendChild(option)
                    if(conf.selected){
                        if(conf.selected.call(object[key][i], object[key][i])){
                            option.selected = true;
                        }
                    }
                }

                input.onchange = function(){

                }
                return input;
            },
            __wrap:function(node, config){
                var label = document.createElement('label');
                var wrap = document.createElement('div');
                wrap.className = 'jacqueline-component'
                label.innerHTML = config.label || '';
                wrap.appendChild(label)
                wrap.appendChild(node)

                if(node.type || node.nodeName == 'TEXTAREA'){
                    node.placeholder = config.placeholder || ''
                }
                return wrap;
            }
        },
        rend: function(opt){
            var config = opt.config || {};
            var x;
            for(x in opt.data){
                var item = opt.data[x];
                if( typeof item === 'string' || typeof item === 'number' ){
                    if(opt.config[x]){
                        var node = this.renderers[opt.config[x].method](opt.data, x, opt.config[x])
                        opt.root.appendChild(this.renderers.__wrap(node, opt.config[x]))
                    }
                }
                else if(typeof item === 'object' && item.constructor === [].constructor){
                    if(opt.config[x].method == 'posts'){
                        var i = 0;
                        for( ; i < item.length ; i++){
                            var curr = item[i], c;
                            if(curr && typeof curr === 'object' && [].constructor !== curr.constructor){
                                for( c in curr){
                                    var conf = opt.config[x].scheme[c];
                                    if(conf){
                                        var node = this.renderers[conf.method](opt.data[x][i], c, conf)
                                        opt.root.appendChild(this.renderers.__wrap(node, conf))
                                    }
                                }
                            }
                            else{
                                console.error('Array items must be object literals - ' + x)
                            }
                        }
                    }
                    else if(opt.config[x].method == 'select'){
                        var node = this.renderers.select(opt.data, x,  opt.config[x], opt.config[x])
                        opt.root.appendChild(this.renderers.__wrap(node,  opt.config[x]))
                    }
                }
            }
        }
    }
    JacquelineUI.prototype.rend.prototype = JacquelineUI.prototype;
    Jacqueline.ui = JacquelineUI;
})();



(function(){
    var JacquelineAdmin = function(options){
        return new JacquelineAdmin.module.rend(options);
    }
    JacquelineAdmin.module = JacquelineAdmin.prototype = {
        createRoot:function(){
            var root = document.createElement('ul');
            root.className = 'jq-admin-root';
            return root;
        },
        validateKey:function(newValue, object){
            if(!newValue) {console.warn("Value must not be empty");return false; }
            newValue = newValue.trim()
            if(!newValue) {console.warn("Value must not be empty");return false; }
            for(var i in object){
                if(i == newValue){
                    console.warn("Value must be unique in it's scope");
                    return false;
                }
            }
            return newValue;
        },
        createItemCTRL:function(li){
            var el = document.crateElement('div');
            el.className = 'controller'
        },
        createItem:function(key, value, obj){
            var li = document.createElement('li');
            if(obj.constructor !== [].constructor){
                var lb = document.createElement('input');
                lb.value = key;
                var scope = this;
                lb.onkeydown = function(){
                    this._prev = this.value;
                }
                lb.oninput = function(){
                    var val = scope.validateKey(this.value, obj);
                    clearTimeout(this._clearTime)
                    if(!val){
                        (function(el){
                            el._clearTime = setTimeout(function(){
                                el.value = el._prev
                            }, 777)
                        })(this)
                        return;
                    }
                    delete obj[lb._jqdata.key];
                    lb._jqdata.key = val;
                    obj[val] = lb._jqdata.valueNode.value ? lb._jqdata.valueNode.value : lb._jqdata.valueNode;
                }
            }
            else{
               var lb = document.createElement('label');
                lb.innerHTML = key;
                lb.className = 'jq-array-index';
            }

            li.appendChild(lb);

            lb._jqdata = {object:obj, key:key, value:value} ;

            if(value && typeof value === 'object'){
                var root = this.createRoot();
                li.appendChild(this.rendObject(value, root));
                lb._jqdata.valueNode = value
                return li;
            }
            else{
                var inp = document.createElement('input');
                inp.id = this.id();
                inp.value = value;
                lb._jqdata.valueNode = inp
                inp.oninput = function(){

                    obj[lb._jqdata.key] = this.value;
                }
                li.appendChild(inp);
                return li
            }
        },
        id:function(){
            if(!this._id){
                this._id = new Date().getTime();
            }
            this._id++;
            return 'jq-id-'+this._id;
        },
        rendObject: function(obj, root){
            var i, root = root || this.createRoot();
            if(typeof obj.length !== 'undefined'){
                root.className += ' jq-root-array';
                for(i=0; i<obj.length; i++){
                    root.appendChild(this.createItem(i, obj[i], obj))
                }
            }
            else if(obj instanceof Object && obj.constructor === Object){
                root.className += ' jq-root-object-literal';
                for(i in obj){
                    root.appendChild(this.createItem(i, obj[i], obj))
                }
            }
            root._jqdata = {object:obj} ;
            return root;
        },
        _normalizeIndexes: function(from, to){
            if(to === from) to = null;
            console.log(from.children)
            Array.from(from.children).forEach(function(el, i){
                el.querySelector('label').innerHTML = i
            });
            if(to) {
                Array.from(to.children).forEach(function(el, i){
                    el.querySelector('label').innerHTML = i
                });
            }
        },
        createSortables: function(root){
            var scope = this;
            Array.from(root.querySelectorAll('.jq-root-array')).forEach(function(el){
                new Sortable(el, {
                    group: 'shared',
                    animation: 150,
                    onSort: function (evt,b,c) {
                        var oldIndex = evt.oldIndex;
                        var newIndex = evt.newIndex;
                        scope.arrayMove(evt.item.parentNode._jqdata.object, oldIndex, newIndex) ;
                        scope._normalizeIndexes(evt.from, evt.to);
                    }
                });
            });
        },
        arrayMove: function(arr, old_index, new_index) {
            while (old_index < 0) {
                old_index += arr.length;
            }
            while (new_index < 0) {
                new_index += arr.length;
            }
            if (new_index >= arr.length) {
                var k = new_index - arr.length + 1;
                while (k--) {
                    arr.push(undefined);
                }
            }
            arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
            return arr;
        },
        rend:function(opt){
            opt.root.appendChild(this.rendObject(opt.data));
            this.createSortables(opt.root)
        }
    }
    JacquelineAdmin.prototype.rend.prototype = JacquelineAdmin.prototype;
    Jacqueline.admin = JacquelineAdmin;
})();