/**
 * AXEL-FORMS "list" filter
 *
 * Synopsis :
 *  - <xt:use types="input" param="filter=list"/>
 *
 */

/*****************************************************************************\
|                                                                             |
|  AXEL 'list' filter                                                         |
|                                                                             |
|  Converts text entry into list entries with comma or space separator        |
|                                                                             |
|*****************************************************************************|
|  Prerequisites :                                                            |
\*****************************************************************************/
(function ($axel) {

  var _Filter = {
    
    // Turns <xvalue>X</xvalue>...<xvalue>Y</xvalue> input into 'X, ..., Y' string
    onLoad: function load (aPoint, aDataSrc) {
      var h, value, option, tmp,
          tag = this.getParam('xvalue');
      if (aDataSrc.isEmpty(aPoint) || !tag) { // default behavior
        this.__list__onLoad(aPoint, aDataSrc);
      } else { // decode content
        value = [];
        option = aDataSrc.getVectorFor(tag, aPoint);
        while (option !== -1) {
          tmp = aDataSrc.getDataFor(option);
          if (tmp) {
            value.push(tmp);
          }
          option = aDataSrc.getVectorFor(tag, aPoint);
        }
        value = value.join(', ');
        h = this.getHandle();
        fallback = this.getDefaultData() || '';
        this.getHandle().value = value || fallback || '';
        this.setModified(value !==  fallback);
        this.set(false);
      }
    },
    
    // DOES NOT forward the call unless missing 'xvalue' parameter
    onSave: function save (aLogger) {
      var tag, data, i,
          value = $.trim(this.getHandle().value);
      if ((!this.isOptional()) || this.isSet()) {
        if (value) {
          tag = this.getParam('xvalue');
          if (tag) {
            data = value.split(/\s*,\s*/);
            for (i=0; i < data.length; i++) {
              if (data[i] !== "") {
                aLogger.openTag(tag);
                aLogger.write(data[i]);
                aLogger.closeTag(tag);
              }
            }
          } else {
            this.__list__onSave(aLogger);
          }
        }
      } else {
        aLogger.discardNodeIfEmpty();
      }
    },

    methods : {
      update : function (aData) {
        var value = this.getHandle().value.split(/\s*,\s*/).join(', ');
        if ('true' === this.getParam('list_uppercase')) {
          value = value.toUpperCase();
        }
        this.getHandle().value = value;
        fallback = this.getDefaultData() || '';
        this.setModified(value !== fallback);
      }
    }
  };

  $axel.filter.register(
    'list',
    { chain : [ 'onLoad', 'onSave'] },
    null,
    _Filter);
  $axel.filter.applyTo({'list' : ['input']});
}($axel));