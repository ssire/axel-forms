/*****************************************************************************\
|                                                                             |
|  AXEL 'interval' binding                                                    |
|                                                                             |
|  Implements data-min-date, data-max-date to define an interval              |
|  Applies to AXEL 'date' filter and 'input' sub-type 'date'                  |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
\*****************************************************************************/

(function ($axel) {

  // FIXME: currenlty works only if date format on watched fields is ISO_8601 (aka YYYY-MM-DD)
  function parseDate(editor, date, defaults) {
    try {
      return date ? xtiger.util.date.convertDate(editor, date, 'date_format' , 'date_region') : defaults;
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
      this.min = $axel(jmin.get(0), true);
      this.max = $axel(jmax.get(0), true);
      this.min.configure('beforeShow', $.proxy(this.beforeShowMinDate, this));
      this.max.configure('beforeShow', $.proxy(this.beforeShowMaxDate, this));
    },

    methods : {

      // FIXME: adapt to format
      beforeShowMinDate : function ( input, picker ) {
        return { 'maxDate' : parseDate(this.max.get(0), this.max.text(), null) };
      },

      // FIXME: adapt to format
      beforeShowMaxDate : function ( input, picker ) {
        return { 'minDate' : parseDate(this.min.get(0), this.min.text(), null) };
      }
    }
  };

  $axel.binding.register('interval',
    null, // no options
    null, // no parameters on host
    _Interval
  );

}($axel));
