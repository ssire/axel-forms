/**
 * AXEL-FORMS "autofill" filter
 *
 * Synopsis :
 *  - <xt:use types="choice" param="filter=autofill;autofill_url=/somewhere;autofill_target=#target"/>
 *
 */

/*****************************************************************************\
|                                                                             |
|  AXEL 'autofill' filter                                                     |
|                                                                             |
|  Listens to a change of value in its editor caused by user interaction      |
|  (and not by loading data), then submit the change to a web service         |
|  and loads its response into a target inside the editor.                    |
|                                                                             |
|*****************************************************************************|
|  Prerequisites :                                                            |
|  - the web service MUST return an XML fragment compatible with the target   |
|  - jQuery                                                                   |
\*****************************************************************************/

(function ($axel) {

  var _AutoFill = {

    onAwake : function () {
      var c = this.getParam('autofill_container');
      this.__autofill__onAwake();
      if (c) {
        $(c).bind('AXEL-TEMPLATE-READY', $.proxy(this, 'autofill' )); // FIXME: finalize some 'axel-load-done' event
      }
    },
    
    //////////////////////////////////////////////////////
    // Overriden specific plugin methods or new methods //
    //////////////////////////////////////////////////////
    methods : {
      update : function (aData) {
        if (! this._autofill_running) {
          this.__autofill__update(aData);
          this.autofill();
        } // FIXME: short-circuit to avoid reentrant calls because select2 triggers 'change' on load 
          // to synchronize it's own implementation with 'choice' model which triggers a call to update as a side effect...
      },
      autofill : function () {
        var target = this.getParam('autofill_target'),
            value = this.dump(), // FIXME: use getData ?
            url = this.getParam('autofill_url');
        if (target) { // sanity check
          if (value && url) { // sanity check
            url = url.replace(/\$_/g, value);
            this._autofill_running = true;
            $axel($(target, this.getDocument())).load(url);
            this._autofill_running = false;
          }
        }
      }
    }
  };

  $axel.filter.register(
    'autofill',
    { chain : [ 'update', 'onAwake' ] },
    { },
    _AutoFill
  );
  $axel.filter.applyTo({'autofill' : 'choice'});
}($axel));
