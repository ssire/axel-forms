/**
 * AXEL-FORMS "select2" filter
 *
 * Synopsis :
 *  - <xt:use types="choice" param="filter=select2"/>
 *
 */

/*****************************************************************************\
|                                                                             |
|  AXEL 'select2' filter                                                      |
|                                                                             |
|  Turns a 'choice' plugin into a select2 ComboBox                            |
|  See http://ivaynberg.github.io/select2/ for original select2               |
|  This is compatible with the patched version of select2 available           |
|  in the 3rd-part folder and/or at https://github.com/ssire/select2          |
|                                                                             |
|*****************************************************************************|
|  Prerequisite: check 3rd-part folder because you must include               |
|  select2.(min.)js together with AXEL-FORMS, you must also include           |
|  select2.(min.)css with your XTiger XML template file with select2.png,     |
|  select2x2.png, select2-spinner.gif available                               |
\*****************************************************************************/

// FIXME:
// a- select2 filtering is slow for long lists of options 
//    see https://github.com/ivaynberg/select2/issues/781
//    at least we could cache the full query (for static lists)
//    (see updateResults function)
// b- .select2-results max-height could be adjusted dynamically depending
//    on space left to the bottom window on initial opening

(function ($axel) {

  var _Filter = {

    onAwake : function () {
      var  _this = this,
           defval = this.getDefaultData(),
           pl = this.getParam("placeholder"),
           params = { myDoc : this.getDocument(), minimumResultsForSearch : 7, closeOnSelect : false, width: 'element' };
           // closeOnSelect : false  -> bug if then you delete while selecting
      if (pl || (! defval)) {
        pl = pl || "";
        // inserts placeholder option
        if (this.getParam('multiple') !== 'yes') {
          $(this._handle).prepend('<option></option>');
        }
        // creates default selection
        if (!defval) {
          this._param.values.splice(0,0,pl);
          if (this._param.i18n !== this._param.values) { // FIXME: check its correct
            this._param.i18n.splice(0,0,pl);
          }
        }
        params.allowClear = true;
        params.placeholder = pl;
      }
      if (this.getParam('multiple') !== 'yes') {
        if (this.getParam('typeahead') !== 'yes') {
          params.minimumResultsForSearch = -1; // no search box
        }
      }
      this._setData(defval);
      $(this._handle).select2(params).change(
        function (ev) {
         // FIXME: detect if called from onLoad to cancel
          _this.update($(this).val()); // to update model
        }
      );
    },

     onLoad : function (aPoint, aDataSrc) {
       this.__select2__onLoad(aPoint,aDataSrc);
       $(this._handle).trigger("change");
     }
  };

  $axel.filter.register(
    'select2',
    { chain : [ 'onLoad' ] },
    null,
    _Filter);
  $axel.filter.applyTo({'select2' : 'choice'});
}($axel));
