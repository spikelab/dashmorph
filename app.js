var connect = require('connect');


var ex_menu = [
    {
        type: 'link_list',
        label: 'Main Menu',
        items: [
            {label: 'Services', href: '/services'},
            {label: 'Hosts', href: '/hosts'},
            {label: 'Problems', href: '/problems'},
            {label: 'Help', href: '/help'}
        ]
    },   
    {
        type: 'widget_list',
        label: 'Widgets',
        items_url: '/widgets'
    }
];

var ex_tabs = [
    {
        id: 'tab20100702',
        label: 'First Tab', 
        windows: [
            {
                id: 'calendar20100702',
                type: 'calendar',
                label: 'My Calendar',
                x: 10, y: 10, width: 100, height: 50
            },
            {
                id: 'rss20100702',
                type: 'rss',
                label: 'My RSS', 
                x: 50, y: 50, width: 200, height: 100,
                feed: 'http://mysss.org/feed.rss'
            }
        ]
    },
    {
        id: 'tab2010070021',
        label: 'Second tab', 
        windows: {
          
        }
    }
];

var ex_widgets = [   
    {
        name: 'calendar',
        label: 'Calendar',
        icon: 'calendar.png',
    },
    {
        name: 'rss',
        label: 'RSS',
        icon: 'rss.png'
    }   
];

var server = module.exports = connect.createServer();
server.use('/', 
    connect.bodyDecoder(),
    //connect.cookieDecoder(),
    //connect.session({ 
    //    store: new MemoryStore({ reapInterval: minute, maxAge: minute * 500 }) 
    //}),
    connect.compiler({ src: __dirname + '/public', enable: ['less'] }),
    connect.staticProvider(__dirname + '/public'),
    connect.router(function(app) { 
        app.get('/widgets', function(req, resp) { 
            resp.simpleBody(200, ex_widgets);
        });
        app.get('/menu', function(req, resp) { 
            resp.simpleBody(200, ex_menu);
        });
        app.get('/tabs', function(req, resp) { 
            resp.simpleBody(200, ex_tabs);
        });
    })
);
