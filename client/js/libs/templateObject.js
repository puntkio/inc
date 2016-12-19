/*

Sample template:

<ul id="my_list_template">
    <li data-id="name"></li>
    <li><span data-id="age"></span></li>
</ul>

var tpl = app.templateObject($('#my_list_template'));

tpl.map({name: "Test", age: "12"});  // should update the template
tpl.clearMapped(); // should clear the data-ids

 // mapping callbacks

var data = {name: "Foobar"};
tpl.map({
    name: function($el){ // $el is the current data-id="name" element;
        $el.addClass('highlight').html(data.name)
    }
})

Template with partials

<table id="my_table_template">
    <thead>
        <tr>
            <th>User</th>
            <th>Age</th>
        </tr>
    </thead>
    <tbody data-id="body">
        <tr data-partial="row">
            <td data-id="user"></td>
            <td data-id="age"></td>
        </tr>
    </tbody>
</table>

var tpl = app.templateObject($('#my_table_template'));

tpl.appendPartial('body', 'row', {user: "User 1", age: "12"});
tpl.appendPartial('body', 'row', {user: "User 2", age: "23"});

tpl.id('body').html(""); // clear the body;

 // or:

var row = tpl.renderPartial('row', {user: "User 1", age: "12"});
$('#my_table_template tbody').append(row);


*/

App.library(function(app,$){

    var _repo = {};

    app.templateObject = function(text, isPartial){

        var html;

        // text is actually a jquery element
        if(text.context && text[0])
        {
            html = text;
            text = html.html();
        }
        else
        {
            html = $(text);
        }

        var template = {text: text, hashCode: text.hashCode()};

        if(_repo[template.hashCode])
            return _repo[template.hashCode];

        template.$html = html;
        template.mapped = {};

        template.setup = function()
        {
            // try and find all fields in template
            html.find('[data-id]').each(function(el){
                _addMapping($(this));
            });

            // setup partials

            if(!isPartial)
            {
                template.partials = {};

                html.find('[data-partial]').each(function(){
                    var key = $(this).data('partial');
                    $(this).removeAttr('data-partial');
                    var html = $(this)[0].outerHTML;
                    $(this).remove();

                    template.partials[key] = html;
                });
            }
        }

        template.set = function(name, value)
        {
            var mapped = template.mapped[name];
            mapped.value = value;

            mapped.render();
        }

        template.hide = function(durr)
        {
            if(durr)
            {
                template.$html.fadeOut(durr);
            }
            else
            {
                template.$html.hide();
            }
        }

        template.show = function(durr)
        {
            if(durr)
            {
                template.$html.fadeIn(durr);
            }
            else
            {
                template.$html.show();
            }
        }

        template.render = function(data, options)
        {
            if(data)
                template.map(data, html);

            if(options === true)
                options = {html: true};
            else if(!options)
                options = {html: false};

            _.forEach(template.mapped, function(mapped, key){
                return mapped.render(options, data || template.data);
            });
        }

        template.find = function(selector)
        {
            return template.$html.find(selector);
        }

        template.id = function(id)
        {
            if(template.mapped[id])
            {
                return template.mapped[id].elem;
            }

            var $found = template.find('[data-id="'+id+'"]');

            _addMapping($found);

            return $found;
        }

        template.clear = function()
        {
            template.clearMapped();

            if(isPartial)
            {
                template.clearBody();
            }

            return template;
        }

        template.map = function(data, html)
        {
            if(typeof html === 'undefined')
                html = true;

            if(!data || !_.isObject(data))
                return false;

            _.forEach(data, function(value, key){

                if(template.mapped[key])
                {
                    template.mapped[key].value = value;
                }
            });

            template.data = data;

            return template;
        }

        template.clearMapped = function()
        {
            _.forEach(template.mapped, function(mapped, key){
                mapped.value = null;
            });

            template.render();

            return template;
        }

        template.remap = function(data, html)
        {
            return template.clearMapped().map(data, html);
        }

        // alias
        template.refresh = template.remap;

        // partials

        template.renderPartial = function(partial, callback)
        {
            if(!template.partials[partial])
            {
                return false;
            }

            partial = app.templateObject(template.partials[partial], true);

            partial.map(callback).render();

            return partial.$html;
        };

        template.appendPartial = function(parent, partial, callback)
        {
            var $parent = template.id(parent);
            $parent.append(template.renderPartial(partial, callback));
        }

        template.clearBody = function()
        {
            var $body = template.id('body');
            $body.html("");
        }

        template.bodyPartial = function(partial, callback)
        {
            var $body = template.id('body');

            if(_.isString(partial))
                partial = template.renderPartial(partial);

            $body.append(partial);
        }

        template.body = function()
        {
            return template.id('body');
        }

        var _addMapping = function(element)
        {
            var key = $(element).data('id');
            var prop = $(element).data('prop');
            template.mapped[key] = {elem: $(element), value: "", prop: prop, name: key};
            template.mapped[key].render = function(options, data)
            {
                _render(template.mapped[key], options || {}, data || {});
            }

        }

        var _render = function(mapped, options, data)
        {
            var $elem = mapped.elem;
            var value = mapped.value;
            var prop = mapped.prop;
            var key = mapped.name;
            if($elem[0])
            {
                if(_.isFunction(value))
                {
                    value = value($elem, key, data);
                }

                if(!value && value !== 0)
                    return false;

                if(options.partial)
                {
                    value = template.renderPartial(options.partial, value);
                }

                if(_.isObject(value))
                {
                    _.forEach(value, function(v,prop){

                        if(prop === 'html')
                        {
                            $elem.html(v);
                        }
                        else if(prop === 'text')
                        {
                            $elem.text(v);
                        }
                        else
                        {
                            $elem.prop(prop, v);
                        }
                    });
                }
                else if(typeof value !== 'undefined')
                {
                    if(prop)
                        $elem.prop(prop, value);
                    else if(html)
                        $elem.html(value);
                    else
                        $elem.text(value);
                }

            }
        }

        template.setup();

        if(!isPartial)
            _repo[template.hashCode] = template;

        return template;
    };

})
