console.log('in calendar widget');
$.widget('dm.dashmorph_widget_calendar', {
    _create: function() { 
        console.log('calendar', this, this.element);
        this.element.text('hullo im a calendar');
    }
});
