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

   // items is array of the form [{ label: XXX, value : YYY }]
   function replaceOptions ( that, items ) {
     var i, o, t, handle = that.getHandle(),
         doc = that.getDocument(),
         type = that.getParam('multiple') === 'yes' ? 'checkbox' : 'radio',
         readonly = that.getParam('noedit') === 'true' ? 'disabled="true" ' : '',
         name = that.getUniqueKey(),
         full = that.getParam('appearance') === 'full';
     $('*', handle).remove(":not(.axel-choice-placeholder)"); // reset options
     if (items && (items.length > 0)) {
       for (i = 0; i < items.length; i++) {
         if (full) {
           $(handle).append('<li><label><input ' + readonly + 'type="' + type + '" value="' + items[i].value + '" name ="' + name + '"/>' + items[i].label + '</label></li>');
         } else {
           o = xtdom.createElement(doc, 'option');
           t = xtdom.createTextNode(doc, items[i].label);
           xtdom.setAttribute(o, 'value', items[i].value);
           if (that.getParam('noedit') === 'true') {
             xtdom.setAttribute(o, 'disabled', true);
           }
           o.appendChild(t);
           handle.appendChild(o);
         }
       }
       $(handle).prop('disabled', false);
     } else {
       $(handle).prop('disabled', true);
     }
   }

   // options is an array of the form [labels, values]
   function createOptions ( that, values, labels ) {
     var i, o, t, handle = that.getHandle(),
         doc = that.getDocument(),
         type = that.getParam('multiple') === 'yes' ? 'checkbox' : 'radio',
         readonly = that.getParam('noedit') === 'true' ? 'disabled="true" ' : '',
         name = that.getUniqueKey(),
         full = that.getParam('appearance') === 'full';
     if (values && (values.length > 0)) {
       for (i = 0; i < values.length; i++) {
         if (full) {
           $(handle).append('<li><label><input ' + readonly + 'type="' + type + '" value="' + values[i] + '" name ="' + name + '"/>' + labels[i] + '</label></li>');
         } else {
           o = xtdom.createElement(doc, 'option');
           t = xtdom.createTextNode(doc, labels[i]);
           xtdom.setAttribute(o, 'value', values[i]);
           if (that.getParam('noedit') === 'true') {
             xtdom.setAttribute(o, 'disabled', true);
           }
           o.appendChild(t);
           handle.appendChild(o);
         }
       }
     } else {
       $(handle).prop('disabled', true);
     }
   }

    // compute if new state is significative (i.e. leads to some non empty XML output)
   //  meaningful iff there is no default selection (i.e. there is a placeholder)
   function _calcChange (defval, model) {
     var res = true;
     if (! defval) {
       if (typeof model === "string") { // single
         res = model !== defval;
       } else { // multiple
         if (!model || ((model.length === 1) && !model[0])) {
           res = false;
         }
       }
     } else { // FIXME: assumes no multiple default values
       res = model !== defval;
     }
     return res;
   }

   return {

     ////////////////////////
     // Life cycle methods //
     ////////////////////////

     // Plugin static view: span showing current selected option
     onGenerate : function ( aContainer, aXTUse, aDocument ) {
      var viewNode;
      if (this.getParam('appearance') === 'full') {
        viewNode= xtdom.createElement (aDocument, 'ul');
      } else {
        viewNode= xtdom.createElement (aDocument, 'select');
      }
      xtdom.addClassName(viewNode,'axel-choice');
      aContainer.appendChild(viewNode);
      return viewNode;
     },

     onInit : function ( aDefaultData, anOptionAttr, aRepeater ) {
       var values = this.getParam('values');
       if (this.getParam('hasClass')) {
         xtdom.addClassName(this._handle, this.getParam('hasClass'));
       }
       if (this.getParam('multiple') === 'yes') {
         $(this._handle).attr('multiple', 'multiple');
       }
       // builds options if not cloned from a repeater
       if (! aRepeater) {
          createOptions(this, this.getParam('values'), this.getParam('i18n'));
       }
     },

     onAwake : function () {
       var  _this = this,
            defval = this.getDefaultData(),
            pl = this.getParam("placeholder"),
            handle = $(this._handle);
       if ((this.getParam('appearance') !== 'full') && (pl || (! defval))) {
         pl = pl || "";
         // inserts placeholder option (unless instantiated from a repeater and it exists)
         if (handle.find('.axel-choice-placeholder').length === 0) {
           handle.prepend('<option class="axel-choice-placeholder" selected="selected" value="">' + (pl || "") + '</option>');
         }
         // creates default selection
         if (!defval) {
           this._param.values.splice(0,0,pl);
           if (this._param.i18n !== this._param.values) { // FIXME: check its correct
             this._param.i18n.splice(0,0,pl);
           }
           if (pl) {
             handle.addClass("axel-choice-placeholder");
           }
         }
       }
       xtdom.addEventListener(this._handle, 'change',
        function (ev, data) {
          if (!(data && data.synthetic)) { // short circuit if forged event (onLoad)
            if (_this.getParam('appearance') === 'full') {
              var accu = [];
              $('input', _this.getHandle()).each(
                function(i,e) { 
                  if (e.checked) {
                    accu.push($(e).val());
                  }
                }
              );
              _this.update(accu);
            } else {
              _this.update($(xtdom.getEventTarget(ev)).val()); // with option element jQuery returns the value attribute
            }
          }
        }, true);
        this._setData(defval);
     },

     onLoad : function (aPoint, aDataSrc) {
       var value, defval, option, xval,tmp;
       if (aDataSrc.isEmpty(aPoint)) {
         this.clear(false);
       } else {
         xval = this.getParam('xvalue');
         defval = this.getDefaultData();
         if (xval) { // custom label
           value = [];
           option = aDataSrc.getVectorFor(xval, aPoint);
           while (option !== -1) {
             tmp = aDataSrc.getDataFor(option);
             if (tmp) {
               value.push(tmp);
             }
             option = aDataSrc.getVectorFor(xval, aPoint);
           }
           this._setData(value.length > 0 ? value : ""); // "string" and ["string"] are treated as equals by jQuery's val()
         } else { // comma separated list
           tmp = aDataSrc.getDataFor(aPoint);
           if (typeof tmp !== 'string') {
             tmp = '';
           }
           value = (tmp || defval).split(",");
           this._setData(value);
         }
         this.set(false);
         this.setModified(_calcChange(defval,value));
       }
     },

     onSave : function (aLogger) {
       var tag, data, i;
       if ((!this.isOptional()) || this.isSet()) {
         if (this._data && (this._data !== this.getParam('placeholder'))) {
           tag = this.getParam('xvalue');
           if (tag) {
             if (typeof this._data === "string") {
               aLogger.openTag(tag);
               aLogger.write(this._data);
               aLogger.closeTag(tag);
             } else {
               for (i=0;i<this._data.length;i++) {
                 if (this._data[i] !== "") { // avoid empty default (i.e. placeholder)
                   aLogger.openTag(tag);
                   aLogger.write(this._data[i]);
                   aLogger.closeTag(tag);
                 }
               }
             }
           } else {
             aLogger.write(this._data.toString().replace(/^,/,''));
           }
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
             _values = values ? _split(values) : [],
             _i18n = i18n ? _split(i18n) : undefined;
         this._param.values = _values; // FIXME: validate both are same lenght
         this._param.i18n = _i18n || _values;
         this._content = defval || "";
       },

       isFocusable : function () {
         return true;
       },

       focus : function () {
         // nop : currently Tab focusing seems to be done by the browser
       }
     },

     /////////////////////////////
     // Specific plugin methods //
     /////////////////////////////

     methods : {

       // dynamically constructs options list
       ajax : function ( config ) {
         replaceOptions(this, config.items);
         // TODO: change defaultData because the value may diverge
         // (remove it if placeholder or set it to first option otherwise)
         if (config.restore) {
           this._setData(this._data);
         } else {
           this.clear(false);
         }
       },

       // FIXME: modifier l'option si ce n'est pas la bonne actuellement ?
       _setData : function ( value, withoutSideEffect ) {
         var values;
         if (this.getParam('appearance') !== 'full') {
           if(!value && (this.getParam('placeholder'))) {
             $(this.getHandle()).addClass("axel-choice-placeholder");
           } else {
             $(this.getHandle()).removeClass("axel-choice-placeholder");
           }
         }
         this._data =  value || "";
         if (! withoutSideEffect) {
           if (this.getParam('appearance') === 'full') {
             values = typeof this._data === "string" ? [ this._data ] : this._data; // converts to array
             $('input', this.getHandle()).each(
               function(i,e) { 
                 if ($.inArray($(e).val(), values) > -1) {
                   e.checked = true;
                   xtdom.removeClassName(e.parentNode,'axel-choice-unset');
                 } else {
                   e.checked = false;
                   xtdom.addClassName(e.parentNode,'axel-choice-unset');
                 }
               }
             );
           } else {
             $(this.getHandle()).val(value);
           }
         }
       },

       dump : function () {
         return this._data;
       },

      // Updates the data model consecutively to user input
      // single: aData should be "" or any string value
      // multiple: aData should be null or [""] or any array of strings
       update : function (aData) {
         var meaningful = _calcChange(this.getDefaultData(), aData);
         this.setModified(meaningful);
         this._setData(aData, true);
         this.set(meaningful);
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
    _Editor
  );
  
  $axel.filter.applyTo({'event' : ['choice']});
}($axel));
