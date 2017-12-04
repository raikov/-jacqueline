(function(){
  var JQ = function(options){
    return new JQ.module.rend(options);
  }
  JQ.module = JQ.prototype = {
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
        var input = document.createElement('input');
        var format = config.format || "MMM Do YYYY";
        input.value = moment(object[key]).format(format)
        $(input).datepicker({
          format:config.format || "MMM Do YYYY"
        }).on('pick.datepicker', function(e){
          object[key] = e.date.toISOString();
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
        for( ; i < object.data.length; i++){
          var option = document.createElement('option');
          option.value = object.data[i][conf.value]
          option.innerText = object.data[i][conf.displayValue];
          input.appendChild(option)
          if(conf.selected){
            if(conf.selected.call(object.data[i], object.data[i])){
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
  JQ.prototype.rend.prototype = JQ.prototype;
  window.jq = window.jacqueline = JQ
})();