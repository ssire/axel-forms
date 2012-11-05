/**
 * AXEL-FORMS "choice" plugin
 *
 * HTML forms "select/option" element wrapper
 *
 * Synopsis :
 *  - <xt:use types="choice" param="noselect=---" values="one two three"/>
 *
 * TODO :
 *  - insert in keyboard manager focus chain
 *  - factorize code with "select" plugin or merge all into a "list" plugin
 *
 */

(function ($axel) {

  // Plugin static view: span showing current selected option
  var _Generator = function ( aContainer, aXTUse, aDocument ) {
   var viewNode = xtdom.createElement (aDocument, 'select');
   aContainer.appendChild(viewNode);
   return viewNode;
  };

  var _Editor = (function () {

   // Splits string s on every space not preceeded with a backslash "\ "
   // Returns an array
   // FIXME: move to xtiger.util
   function _split ( s ) {
     var res;
     if (s.indexOf("\\ ") === -1) {
       return s.split(' ');
     } else {
       res = s.replace(/\\ /g, "&nbsp;");
       return xtiger.util.array_map(res.split(' '),
          function (e) { return e.replace(/&nbsp;/g, " "); }
        );
     }
   }

   // options is an array of the form [labels, values]
   function createOptions ( that, values, labels ) {
     var i, o, t, handle = that.getHandle(),
         doc = that.getDocument();
     for (i = 0; i < values.length; i++) {
       o = xtdom.createElement(doc, 'option');
       t = xtdom.createTextNode(doc, labels[i]);
       xtdom.setAttribute(o, 'value', values[i]);
       o.appendChild(t);
       handle.appendChild(o);
     }
   }

   return {

     ////////////////////////
     // Life cycle methods //
     ////////////////////////

     onInit : function ( aDefaultData, anOptionAttr, aRepeater ) {
       var handle, values = this.getParam('values');
       if (this.getParam('hasClass')) {
         xtdom.addClassName(this._handle, this.getParam('hasClass'));
       }
       // builds options if not cloned from a repeater
       if (! aRepeater) {
          createOptions(this, this.getParam('values'), this.getParam('i18n'));
       }
       this._setData(aDefaultData);
     },

     onAwake : function () {
       var _this = this;
       xtdom.addEventListener(this._handle, 'change',
        function (ev) {
          var rank = xtdom.getSelectedOpt(_this.getHandle()),
              values = _this.getParam('values');
          _this.update(values[rank]);
        }, true);
     },

     onLoad : function (aPoint, aDataSrc) {
       var value, fallback;
       if (aPoint !== -1) {
         value = aDataSrc.getDataFor(aPoint);
         fallback = this.getDefaultData();
         if (value) {
           this._setData(value);
         } else {
           this._setData(fallback);
         }
         this.set(false);
         this.setModified(value !==  fallback);
       } else {
         this.clear(false);
       }
     },

     onSave : function (aLogger) {
       if ((!this.isOptional()) || this.isSet()) {
         if (this._data !== "---") { // FIXME: getParam("noselect")
           aLogger.write(this._data);
         }
       } else {
         aLogger.discardNodeIfEmpty();
       }
     },

     ////////////////////////////////
     // Overwritten plugin methods //
     ////////////////////////////////

     api : {

       // FIXME: first part is copied from Plugin original method,
       // an alternative is to use derivation and to call parent's method
       _parseFromTemplate : function (aXTNode) {
         var tmp, defval;
         this._param = {};
         xtiger.util.decodeParameters(aXTNode.getAttribute('param'), this._param);
         defval = xtdom.extractDefaultContentXT(aXTNode); // value space (not i18n space)
         tmp = aXTNode.getAttribute('option');
         this._option = tmp ? tmp.toLowerCase() : null;
         // completes the parameter set
         var values = aXTNode.getAttribute('values'),
             i18n = aXTNode.getAttribute('i18n'),
             _values = values ? _split(values) : ['undefined'],
             _i18n = i18n ? _split(i18n) : undefined;
         if (! defval) { // creates default selection if undefined
           _values.splice(0,0,"---"); // FIXME: getParam("noselect")
           if (_i18n) {
             _i18n.splice(0,0,"---");
           }
           defval = "---";
         }
         this._param.values = _values; // FIXME: validate both are same lenght
         this._param.i18n = _i18n || _values;
         this._content = defval;
       },

       isFocusable : function () {
         return true;
       }

     },

     /////////////////////////////
     // Specific plugin methods //
     /////////////////////////////

     methods : {

       // FIXME: modifier l'option si ce n'est pas la bonne actuellement ?
       _setData : function ( value, withoutSideEffect ) {
         var i, values = this.getParam('values');
         this._data =  value;
         if (! withoutSideEffect) {
           for (i = 0; i < values.length; i++) {
             if (value === values[i]) {
               xtdom.setSelectedOpt (this.getHandle(), i);
             }
           }
         }
       },

       dump : function () {
         return this._data;
       },

       // aData is the universal value and not the localized one
       update : function (aData) {
         this._setData(aData, true);
         // updates isModified, a priori this is meaningful only in case of an empty default selection
         this.setModified (aData !== this.getDefaultData());
         this.set(true);
       },

       clear : function (doPropagate) {
         this._setData(this.getDefaultData());
         if (this.isOptional()) {
           this.unset(doPropagate);
         }
       }
     }
   };
  }());

  $axel.plugin.register(
    'choice',
    { filterable: true, optional: true },
    {
     choice : 'value'  // alternative is 'display'
    },
    _Generator,
    _Editor
  );
}($axel));
