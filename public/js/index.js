// cached stuff 
var $document = $(document),
    $window = $(window),
    // following set in document.ready():
    $body = null,
    $body_left = null,
    $body_center = null;

// singleton for loading widget code 
var WidgetManager = {
    loaded_state: {},
    _load: function(name) { 
        var p = Futures.promise();
        $.ajax({
            url: '/js/dashmorph.widget.'+name+'.js',
            dataType: 'script',
            cache: false,
            success: function() { 
                console.log('done widget load', name);
                p.fulfill();
            }
        });
        return p;
    },
    // call this to make sure we have widget code loaded for the specified widget
    get: function(name) { 
        var state = WidgetManager.loaded_state[name],
            p;
        // no entry at all - load the code 
        if( state === undefined ) {
            p = WidgetManager._load(name);
            WidgetManager.loaded_state[name] = p;
        // already loaded - effectivly just return
        } else if( state === true ) { 
            p = Futures.promise();
            p.fulfill();
        // state must be a promise for an existing load request 
        // return that 
        } else {
            p = state;
        }
        return p;
    }
};


// left side menu widget 
$.widget('dm.dashmorph_menu', {
    _create: function() { 
        var self = this;
        this.items = null;
        // fetch remote then 
        this._fetch_data()
            // then render the divs to put different menu widgets in 
            .when(function() { return self._render_menu_items(); })
            // then setup the accoridion widget 
            .when(function() { 
                self.element.accordion({fillSpace: true});
            })
            // then tell child widgets to render now we have divs for them 
            .when(function() { return self._setup_children(); })
        ;
    },
    // loads menu data from /menu 
    _fetch_data: function() { 
        var p = Futures.promise(),
            self = this;
        $.ajax({
            url: '/menu', 
            dataType: 'json',
            success: function(data) { 
                console.log(data);
                self.items = data;
                p.fulfill();
            }
        });
        return p;
    },
    _render_menu_items: function() { 
        var self = this,
            p = Futures.promise();
       
        console.log(this);
        this.element.html(
            $.srender('dashmorph-menu', self)
        );

        // ok... we *could* be async...
        p.fulfill();

        return p;
    },
    _setup_children: function() { 
        $.each(this.items, function(idx, item) { 
            $('#menu-item-'+idx)['dashmorph_menu_'+item.type](item);
        });
    }
});

// menu widget for simple lists of links 
$.widget('dm.dashmorph_menu_link_list', {
    _create: function() { 
        this.element.html(
            $.srender('dashmorph-menu-link-list', this)
        );
    }
});

// menu widget for lists of widgets we can put into tabs 
$.widget('dm.dashmorph_menu_widget_list', {
    _create: function() { 
        var self = this;
        this.widgets = null;
        this.widget_lookup = {};
        this._fetch_data()
            .when(function() { return self._render(); })
        ;

        // emit an event if a widget button is clicked on 
        // we dont actually do anything with the click here 
        this.element.delegate('div.widget-button', 'click', function(e) { 
            var widget = self.widget_lookup[this.id.replace('widget-list-', '')];
            self._trigger('_create_widget', e, {widget: widget});
        });
    },
    _fetch_data: function() { 
        var self = this,
            p = Futures.promise();
        $.ajax({
            url: '/widgets',
            dataType: 'json',
            success: function(data) { 
                self.widgets = data;    
                $.each(self.widgets, function(idx, widget) { 
                    self.widget_lookup[widget.name] = widget;
                });
                p.fulfill();
            }
        });   
        return p;
    },
    _render: function() { 
        this.element.html(
            $.srender('dashmorph-menu-widget-list', this)
        );
    }
});

// widget for rendering center frame tabs
$.widget('dm.dashmorph_tabs', {
    _create: function() { 
        var self = this;
        self.current_tab_body = null;
        // fetch the data for the tabs 
        this._fetch_data()
            // then render the tabs and the tab bodys
            .when(function() { return self._render(); })
            // then setup the tabs widget 
            .when(function() { 
                self.element.tabs({
                    show: function(event, ui) { 
                        self.current_tab_body = $(ui.panel).find('div.tab-inner');
                    }
                }); 
            })
            // then load windows into the tabs 
            .when(function() { return self._setup_children(); })
        ;
    },
    _fetch_data: function() { 
        var self = this,
            p = Futures.promise();
        $.ajax({
            url: '/tabs',
            dataType: 'json',
            success: function(data) { 
                self.tabs = data;
                p.fulfill();
            }
        });
        return p;
    },
    _render: function() { 
        var p = Futures.promise();
        this.element.html(
            $.srender('dashmorph-tabs', this)
        );
        p.fulfill();
        return p;
    },
    _setup_children: function() { 
        var self = this;
        $.each(this.tabs, function(idx, tab) { 
            // find the target div we are putting the window into 
            var $target = $('#tabs-'+tab.id+'-body');
            // create each window listed in the tab 
            $.each(tab.windows, function(idx, win) { 
                self.create_window(win, $target);
            });
        });
    },
    create_window: function(opts, $target) { 
        // use the current tab as the target if one wasnt supplied 
        if( !$target ) {
            $target = this.current_tab_body;
        }        

        // create an empty div to act as the window 
        var $win = ($('<div/>')
            // give it the right id and title - title is used by the dialog widget
            .attr({
                id: 'window-'+opts.id,
                title: opts.label
            })
            // turn the div into a real dialog window 
            .dialog({
                position: [opts.x, opts.y],
                width: opts.width,
                height: opts.height
            })
        );
        // reparent the window into the tab body - defaults to the document.body 
        // otherwise
        $win.dialog('widget').appendTo($target);
        // make sure we have the code loaded for the widget thats inside this window 
        WidgetManager.get(opts.type).when(function() { 
            // create the widget inside the window 
            $win['dashmorph_widget_'+opts.type](opts);
        });
    }
});


$document.ready(function () {
    // save cached stuff 
    $body = $('#body');
    $body_left = $('#body-left');
    $body_center = $('#body-center');

    // make it so that we resize the accordion when the window changes size 
    // to keep it filling the space correctly 
    $window.resize(function() { 
        $body_left.accordion('resize');
    });

    // setup the center tab window 
    $body_center.dashmorph_tabs();

    $body_left
        // setup the left hand menu 
        .dashmorph_menu()
        // bind to the event emitted when a widget button is clicked 
        // (zomg stupid event names...)
        .bind('dashmorph_menu_widget_list_create_widget', function(e, ui) { 
            // create the new widget in the current tab 
            // this should probably call out to the server to get a new window instance 
            // and save it to the correct tab etc...
            $body_center.dashmorph_tabs('create_window', {
                type: ui.widget.name,
                id: 'newone',
                label: ui.widget.label
            });
        })
    ;
});

