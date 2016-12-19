App.library(function(app,$){

    var DataSelectorHelper = function()
    {
        var fn = this;

        var parent = false;

        fn.in = function(element)
        {
            parent = element;

            return this;
        };

        fn.scope = function(name)
        {
            return _find('scope', name);
        };

        fn.id = function(id)
        {
            return _find('id', id);
        };

        var _find = function(data, name)
        {

            var $element;

            var $sel = (parent && parent.find) ? $(parent) : $;

            if(name) {
                $element = $sel.find('[data-'+data+'="'+name+'"]');
            } else {
                $element = $sel.find('[data-'+data+']');
            }

            if(!$element.length)
            {
                var parts = [];

                if(data !== 'id')
                    parts.push(data);

                parts.push(name);
                parts = _.join(parts,'-');

                $element = $sel.find('#'+parts);
            }

            parts = null;
            parent = false;

            return $element.length > 0 ? $($element) : 0;
        };

        return fn;
    };

    app.$data = new DataSelectorHelper();

});
