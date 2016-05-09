/*****************************************************************************\
|                                                                             |
|  AXEL 'regexp' binding                                                      |
|                                                                             |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
\*****************************************************************************/

// TODO: make data-regexp optional if data-pattern is defined for HTML5 validation only

(function ($axel) {

  var _Regexp = {

    onInstall : function ( host ) {
      var pattern = host.attr('data-pattern'),
          root, jroot;
      this.re = new RegExp(this.getParam('regexp') || '');
      this.editor = $axel(host);
      this.spec = host;
      host.bind('axel-update', $.proxy(this.checkRegexp, this));
      if (pattern) {
        host.find('input').attr("pattern", pattern); // adds HTML5 pattern attribute on input
      }
      $axel.binding.setValidation(this.editor.get(0), $.proxy(this.validate, this));
    },

    methods : {

      // Updates inline bound tree side-effects based on current data
      checkRegexp : function  () {
        var valid = this.re.test(this.editor.text()),
            scope, label, 
            doc = this.getDocument(),
            anchor = this.spec.get(0),
            vklass = this.spec.attr('data-valid-class'),
            iklass = this.spec.attr('data-invalid-class');
        if (vklass || iklass) {
          if (! this.errScope) { // search error in full document
            label = $('body ' + this.spec.attr('data-label-selector'), doc);
          } else { // search error within scope
            scope = $(anchor, doc).closest(this.errScope);
            label = $(this.spec.attr('data-label-selector'), scope.get(0));
          }
          if (vklass) {
            valid ? label.addClass(vklass) : label.removeClass(vklass);
          }
          if (iklass) {
            valid ? label.removeClass(iklass) : label.addClass(iklass);
          }
        }
        return this.toggleError(valid, this.editor.get(0).getHandle(true));
      },
      
      // Updates inline bound tree side-effects based on current data
      // Returns true to block caller command (e.g. save) if invalid
      // unless data-validation is 'off'
      validate : function () {
        var res = this.checkRegexp();
        return (this.spec.attr('data-validation') === 'off') || res;
      }
    }
  };

  $axel.binding.register('regexp',
    { error : true  }, // options
    { 'regexp' : $axel.binding.REQUIRED }, // parameters
    _Regexp
  );

}($axel));



