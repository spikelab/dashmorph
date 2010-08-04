$.widget('dm.dashmorph_widget_rss', {
    _create: function() { 
        console.log('rss', this, this.element);
        this.element.html('hullo im an rss<br/>'+this.options.feed);
    }
});
