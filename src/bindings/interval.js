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
  
  function Interval (jnode, name, doc ) {
    var jmin = $('[data-min-date=' + name + ']', jnode), // doc || document
        jmax = $('[data-max-date=' + name + ']', jnode);
    today = $.datepicker.formatDate('dd/mm/yy', new Date()); // FIXME: factorize
    this.min = $axel(jmin.get(0), true);
    this.max = $axel(jmax.get(0), true);
    this.min.configure('beforeShow', $.proxy(Interval.prototype.beforeShowMinDate, this));
    this.max.configure('beforeShow', $.proxy(Interval.prototype.beforeShowMaxDate, this));
    this.max.configure('maxDate', today); // FIXME: move to 'date' date_maxDate=today param
    jmin.bind('axel-update', $.proxy(Interval.prototype.minDateChanged, this));
    jmax.bind('axel-update', $.proxy(Interval.prototype.maxDateChanged, this));
  }
  
  Interval.prototype = {
    
    beforeShowMinDate : function ( input, picker ) {
      return { 'maxDate' : parseDate(this.max.text(), today) }
    },
  
    beforeShowMaxDate : function ( input, picker ) {
      return { 'minDate' : parseDate(this.min.text(), null) }
    },
  
    minDateChanged : function ( ev, editor ) {
      var cur, max = today;
      try { cur = $.datepicker.parseDate('dd/mm/yy', editor.getData()); } catch (e) {}
      try { max = $.datepicker.parseDate('dd/mm/yy', this.max.getData()); } catch (e) {}
      if (cur && (cur > max)) {
        this.max._setData(editor.getData());
      }
    },

    maxDateChanged : function ( ev, editor ) {
      var cur, min = today;
      try { cur = $.datepicker.parseDate('dd/mm/yy', editor.getData()); } catch (e) {}
      try { min = $.datepicker.parseDate('dd/mm/yy', this.min.getData()); } catch (e) {}
      if (cur && (cur < min)) {
        this.min._setData(editor.getData());
      }
   }
  };

  $axel.binding.register('interval', 
    { 
      init : function (jnode, doc ) {
        var name = jnode.attr('data-variable');
        if (name) {
          new Interval(jnode, name, doc);
        } else {
          xtiger.cross.log('error', 'Missing attribute "data-variable" to install "interval" binding');
        }
      }
    }
  );
}($axel));