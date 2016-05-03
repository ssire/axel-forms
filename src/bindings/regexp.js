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

// TODO: make data-regexp optional if data-pattern is defined for HTML5 validation only

(function ($axel) {

  var _Regexp = {

    onInstall : function ( host ) {
      var pattern = host.attr('data-pattern'),
          target = host.attr('data-target'),
          root, jroot;
      this.re = new RegExp(this.getParam('regexp') || '');
      this.editor = $axel(host);
      this.spec = host;
      host.bind('axel-update', $.proxy(this.checkRegexp, this));
      if (pattern) {
        host.find('input').attr("pattern", pattern); // adds HTML5 pattern attribute on input
      }
      if (this.spec.attr('data-validation') !== 'off') {
        $axel.binding.setValidation(this.editor.get(0), $.proxy(this.checkRegexp, this));
      }
      if (target === 'document') {
        jroot = $(document);
      } else {
        root = $axel.command.getEditor(target);
        if (root) {
          jroot = root.spec; // FIXME: $(root.getHost())
        }
      }
      if (jroot) {
        jroot.bind('axel-content-ready', $.proxy(this.checkRegexp, this));
      }
    },

    methods : {

      checkRegexp : function  () {
        var valid = this.re.test(this.editor.text()),
            scope, label, doc = this.getDocument(),
            anchor = this.spec.get(0),
            klass = this.spec.attr('data-valid-class');
        if (klass) {
          if (! this.errScope) { // search error in full document
            label = $('body ' + this.spec.attr('data-label-selector'), doc);
          } else { // search error within scope
            scope = $(anchor, doc).closest(this.errScope);
            label = $(this.spec.attr('data-label-selector'), scope.get(0));
          }
          if (valid) {
            label.addClass(klass);
          } else {
            label.removeClass(klass);
          }
        }
        return this.toggleError(valid, this.editor.get(0).getHandle(true));
      }
    }
  };

  $axel.binding.register('regexp',
    { error : true  }, // options
    { 'regexp' : $axel.binding.REQUIRED }, // parameters
    _Regexp
  );

}($axel));



