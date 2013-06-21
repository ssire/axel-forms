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
|*****************************************************************************|
|  Prerequisite: you must include select2.js together with AXEL               |
|  you must include select2.css with your XTiger XML template file            |
|  and select2.png and select2x2.png                                          |
\*****************************************************************************/
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
