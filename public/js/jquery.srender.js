/*global jQuery console*/
(function($) {
// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
// adapted from: http://ejohn.org/blog/javascript-micro-templating/
// by Greg Borenstein http://ideasfordozens.com in Feb 2009
// Dunk Fordyce 2010 for FATdrop.co.uk
//      named templates / $.fn.srender_template function 
//      changed tags from <% %> for mako niceness

// store the template text of an element for use as a template
$.fn.srender_template = function(name) {
    if( !this.length ) {
        console.warn('template not found?', name, this.selector);
    }
    //console.log('srender_template', this, name);
    if( !name ) {
        try { 
            name = this.attr('id').replace('template-', '');
        } catch (e) { 
            console.warn('error getting name for', this, name);
            throw e;
        }
    }
    $.srender.templates[name] = this.html();
    this.remove();
    return this;
};

$.srender = function(template_name, data, target){
    data = data || {};
    //console.log('srender', template_name, data, target);
    var fn;
    // target is an optional element; if provided, the result will be inserted into it
    // otherwise the result will simply be returned to the caller   
    if( $.srender.cache[template_name] ) {
        fn = $.srender.cache[template_name];
    } else {
        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        var template = $.srender.templates[template_name];
        // no template - lets try and find it ourselves
        if( !template ) {
            $('#template-'+template_name).srender_template();   
            template = $.srender.templates[template_name];
        }
        // definatly no template - error!
        if( !template ) { 
            console.error('template not found ', template_name);
            throw ("template not found "+template_name);
        }

        var funcbody = (
            //"console.log('rendering "+template_name+"', arguments);" + 
            "var p=[],print=function(){p.push.apply(p,arguments);};" +

            // Introduce the data as local variables using with(){}
            "with(obj){p.push('" +

            // Convert the template into pure JavaScript
            template
            .replace(/[\r\t\n]/g, " ")
            .split("<:").join("\t")
            .replace(/((^|:>)[^\t]*)'/g, "$1\r")
            .replace(/\t=(.*?):>/g, "',$1,'")
            .split("\t").join("');")
            .split(":>").join("p.push('")
            .split("\r").join("\\'")
            + "');}return p.join('');"
        );
        try { 
            fn = $.srender.cache[template_name] = new Function("obj", funcbody);
        } catch(e) { 
            console.warn('error compiling template', e.message, e);
            console.warn('funcbody', funcbody);
        }
    }

    // populate the optional element
    // or return the result
    if( target ) {
        target.html(fn(data));
        return false;
    } else {
        return fn(data);
    }
};

$.srender.cache = {};
$.srender.templates = {};

})(jQuery);
