/*****************************************************************************\
|                                                                             |
|  AXEL 'unique' binding                                                      |
|                                                                             |
|  Checks that each field in a set has a unique value                         |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
|  Limitations:                                                               |
|  Can be used only once (only one set) per document at that time             |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var _Unique = {

    onInstall : function ( host ) {
      this.editor = $axel(host);
      host.bind('axel-update', $.proxy(this.checkSet, this));
      // extends editor with a new isValid function (for validation before submission)
      // this.editor.get(0).isValid = $.proxy(this.checkOne, this);
      this.editor.get(0).axel_binding_unique = this;
      $axel.binding.setValidation(this.editor.get(0), $.proxy(this.checkOne, this));
      this.checkSet(); // FIXME: maybe skip this if called as a result of loading XML data ?
    },

    methods : {
      // same as calling checkUnique on every unique binding in the set but more optimized
      checkSet : function  (ev, data) {
        var i, j, curval, sum,
            set = $('body [data-binding~="unique"]', this.getDocument()), // TODO: data-unique-scope
            editors = $axel(set),
            vals = editors.values(),
            max = editors.length();
        for (i = 0; i < max; i++) {
          sum = 0;
          curval = vals[i];
          for (j = 0; j < max; j++) {
            if (vals[j] === curval) {
              if (++sum > 1) {
                break;
              }
            }
          }
          editors.get(i).axel_binding_unique.toggleError((sum <= 1), editors.get(i).getHandle(true));
        }
      },

      checkOne : function  (ev, data) {
        var set = $('body [data-binding~="unique"]', this.getDocument()), // TODO: data-unique-scope
            val = this.editor.text(),
            vals = $axel(set).values(),
            sum = 0, i;
        for (i = 0; i < vals.length; i++) {
          window.console.log('check ' + val + ' against ' +  vals[i]);
          if (vals[i] === val) {
            if (++sum > 1) {
              break;
            }
          }
        }
        return this.toggleError((sum === 1), this.editor.get(0).getHandle(true));
      }
    }
  };

  $axel.binding.register('unique',
    { error : true }, // uses optional mixin module error
    null, // parameters - TBD: unique-scope
    _Unique
  );

}($axel));
