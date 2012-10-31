/*****************************************************************************\
|                                                                             |
|  AXEL 'condition' binding                                                   |
|                                                                             |
|  Implements data-avoid-{variable} to disable fields on given data values    |
|  Applies to AXEL 'input' plugin                                             |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
\*****************************************************************************/
(function ($axel) {
  
  function Regexp ( jnode, name, expr, doc ) {
    this.key = name;
    this.doc = doc;
    this.re = new RegExp(expr);
    this.editor = $axel(jnode.get(0));
    jnode.bind('axel-update', $.proxy(Regexp.prototype.checkRegexp, this));
    // extends editor with a new isValid function
    this.editor.get(0).isValid = $.proxy(Regexp.prototype.checkRegexp, this); 
  }
  
  Regexp.prototype = {
  
    checkRegexp : function  (ev, data) {
      var valid = this.re.test(this.editor.text()),
          error = $('body [data-regexp-error="' + this.key + '"]', this.doc || document);
      if (valid) {
        error.hide();
      } else {
        error.show();
      }
      return valid;
    }
  };

  var factory = {
     init : function (jnode, doc) {
       var name = jnode.attr('data-variable'),
           expr = jnode.attr('data-regexp');
       if (name && expr) {
         new Regexp(jnode, name, expr, doc);         
       } else {
         xtiger.cross.log('error', 'Missing attribute "data-variable" or "data-regexp" to install "regexp" binding');
       }
     }
  };

  $axel.binding.register('regexp', factory)
}($axel));