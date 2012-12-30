/*****************************************************************************\
|                                                                             |
|  AXEL 'interval' binding                                                    |
|                                                                             |
|  Implements data-min-date, data-max-date to define an interval              |
|  Applies to AXEL 'date' filter                                              |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var today;

  function parseDate(date, defaults) {
    try {
      return date ? $.datepicker.formatDate('dd/mm/yy',$.datepicker.parseDate('yy-mm-dd', date)) : defaults;
    }
    catch (e) {
      return defaults;
    }
  }

  var _Interval = {

    onInstall : function (host ) {
      var key = this.getVariable(),
          jmin = $('[data-min-date=' + key + ']', host.get(0)),
          jmax = $('[data-max-date=' + key + ']', host.get(0));
      today = $.datepicker.formatDate('dd/mm/yy', new Date()); // FIXME: factorize
      this.min = $axel(jmin.get(0), true);
      this.max = $axel(jmax.get(0), true);
      this.min.configure('beforeShow', $.proxy(this.beforeShowMinDate, this));
      this.max.configure('beforeShow', $.proxy(this.beforeShowMaxDate, this));
      this.max.configure('maxDate', today); // FIXME: move to 'date' date_maxDate=today param
      jmin.bind('axel-update', $.proxy(this.minDateChanged, this));
      jmax.bind('axel-update', $.proxy(this.maxDateChanged, this));
    },

    methods : {

      beforeShowMinDate : function ( input, picker ) {
        return { 'maxDate' : parseDate(this.max.text(), today) };
      },

      beforeShowMaxDate : function ( input, picker ) {
        return { 'minDate' : parseDate(this.min.text(), null) };
      },

      minDateChanged : function ( ev, editor ) {
        var cur, max = today;
        try { cur = $.datepicker.parseDate('dd/mm/yy', editor.getData()); } catch (e1) {}
        try { max = $.datepicker.parseDate('dd/mm/yy', this.max.getData()); } catch (e2) {}
        if (cur && (cur > max)) {
          this.max._setData(editor.getData());
        }
      },

      maxDateChanged : function ( ev, editor ) {
        var cur, min = today;
        try { cur = $.datepicker.parseDate('dd/mm/yy', editor.getData()); } catch (e1) {}
        try { min = $.datepicker.parseDate('dd/mm/yy', this.min.getData()); } catch (e2) {}
        if (cur && (cur < min)) {
          this.min._setData(editor.getData());
        }
      }
    }
  };

  $axel.binding.register('interval',
    null, // no options
    null, // no parameters on host
    _Interval
  );

}($axel));
