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
|  TODO:                                                                      |
|  data-unique-scope                                                          |
|  recompute set state on ALL life cycle events                               |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var _Unique = {

    onInstall : function ( host ) {
      this.editor = $axel(host);
      host.get(0).axel_binding_unique = this;
      host.bind('axel-update', $.proxy(this.checkSet, this));
      $axel.binding.setValidation(this.editor.get(0), $.proxy(this.checkOne, this));
      this.checkOne(); // just check this one to avoid too much iterations when loading XML
    },

    methods : {
      // updates the uniqueness constraint on every element into the set
      // the alternative would be to have the legacy value in 'axel-update' callback
      checkSet : function  (ev, data) {
        var i, j, curval, sum,
        set = $('body [data-binding~="unique"]', this.getDocument()).filter(function() { return $(this).is(':visible')}),
        editors = $axel(set),
        vals = editors.values(),
        max = editors.length(),
        inerror = new Array(max);
        for (i = 0; i < max; i++) {
          if (inerror[i]) { // small optimization
            continue;
          }
          sum = 0;
          curval = vals[i];
          for (j = i + 1; j < max; j++) {
            if (!inerror[j] && (vals[j] === curval)) {
              inerror[i] = inerror[j] = true;
            }
          }
        }
        for (i = 0; i < max; i++) { // applies result
          try {
            set.get(i).axel_binding_unique.toggleError(!inerror[i], set.get(i));
          } catch (e) { }
        }
      },
      checkOne : function  (ev, data) {
        var set = $('body [data-binding~="unique"]', this.getDocument()).filter(function() { return $(this).is(':visible')}),
            editors = $axel(set),
            self = this.editor.get(0),
            val = this.editor.text(),
            vals = editors.values(),
            valid = true, i;
        for (i = 0; i < vals.length; i++) {
          if ((vals[i] === val) && (editors.get(i) !== self)) {
            try {
              set.get(i).axel_binding_unique.toggleError(false, set.get(i));
            } catch (e) { }
            valid = false;
            break;
          }
        }
        return this.toggleError(valid, this.editor.get(0).getHandle(true));
      }
    }
  };

  $axel.binding.register('unique',
    { error : true }, // uses optional mixin module error
    null, // parameters - TBD: unique-scope
    _Unique
  );

}($axel));
