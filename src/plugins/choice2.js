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
 */

(function ($axel) {

  var _Editor = (function () {

    // Utility to convert a hash objet into an html double-quoted style attribute declaration string
    function _style( rec ) {
      var key, tmp = [];
      for (key in rec) {
        if (rec[key]) {
          tmp.push(key + ':' + rec[key]);
        }
      }
      key = tmp.join(';');
      return key  ? ' style="' + key + '"' : '';
    }

   function _createPopup ( that, menu ) {
     var k1, k2, tmp = '',
         buff = that.getParam('choice2_width1'),
         style1 = _style({ 'width' : buff }),
         config2 = { 'left' : buff, 'width' : that.getParam('choice2_width2')},
         style2;
     if (that.getParam('choice2_position') === 'left') {
       config2['margin-left'] = '-' + (parseInt(buff) + parseInt(config2.width) + 2) + 'px';
     }
     style2 = _style(config2);
     for (k1 in menu) {
       buff = '';
       for (k2 in menu[k1]) {
         if (k2 !== '_label') {
           buff += '<li class="choice2-label" data-code="' + k2 + '">' + menu[k1][k2] + '</li>';
         }
       }
       tmp += '<li class="choice2-option"><div class="choice2-item"' + style1 + '>' + k1 + ' ' + menu[k1]._label + '</div><ul class="choice2-popup2 choice2-drop-container"' + style2 + '>' + buff + '</ul></li>';
     }
     tmp = '<ul class="choice2-popup1 choice2-drop-container"' + style1 + '>' + tmp.replace(/&/g,'&amp;') + '</ul>';
     $(that.getHandle()).append(tmp);
   }

   // Utility to select level 1 option when all level 2 options selected
   function _fixItemSelection ( item ) {
     if (0 === item.find('li.choice2-label:not(.selected)').size()) {
       item.addClass('selected');
     } else {
       item.removeClass('selected');
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
      var viewNode,
          style = { 'width' : this.getParam('choice2_width0') };
      viewNode= xtdom.createElement (aDocument, 'div');
      xtdom.addClassName(viewNode,'axel-choice2');
      $(viewNode).html('<div class="select2-container-multi"' + _style(style) + '><ul class="select2-choices"></ul></div>');
      aContainer.appendChild(viewNode);
      return viewNode;
     },

     onInit : function ( aDefaultData, anOptionAttr, aRepeater ) {
       var values = this.getParam('values');
       if (this.getParam('hasClass')) {
         xtdom.addClassName(this._handle, this.getParam('hasClass'));
       }
       // builds options if not cloned from a repeater
       if (! aRepeater) {
          _createPopup(this, this.getParam('values'));
       }
     },

     onAwake : function () {
       var  _this = this,
            defval = this.getDefaultData(),
            pl = this.getParam("placeholder");
       if ((this.getParam('appearance') !== 'full') && (pl || (! defval))) {
         pl = pl || "";
         // inserts placeholder option
         // $(this._handle).prepend('<span class="axel-choice-placeholder">' + (pl || "") + '</span>');
         // creates default selection
         // if (!defval) {
           // this._param.values.splice(0,0,pl);
           // if (this._param.i18n !== this._param.values) { // FIXME: check its correct
           //   this._param.i18n.splice(0,0,pl);
           // }
           // if (pl) {
           //   $(this._handle).addClass("axel-choice-placeholder");
           // }
         // }
       }
      this._setData(defval);
      $(this._handle).children('div.select2-container-multi').click($.proxy(this, '_handleClickOnChoices'));
      $(this._handle).find('li.choice2-label').click($.proxy(this, '_handleClickOnLabel'));
      $(this._handle).find('div.choice2-item').click($.proxy(this, '_handleClickOnItem'));
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
           this._setData(value.length > 0 ? value : "");
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
         // completes parameter set
         var values = aXTNode.getAttribute('values'),
             _values = JSON.parse(values);
         this._param.values = _values;
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

       // Click on the list of current choices
       _handleClickOnChoices : function ( e ) {
         var t = $(e.target),
             h = $(e.target).closest('.axel-choice2'),
             n, pos, height, val;
         if (t.hasClass('select2-choices') || t.hasClass('select2-label')) { // open/close popup
           pos = t.hasClass('select2-label') ? t.closest('.select2-choices').offset() : t.offset();
           height = t.hasClass('select2-label') ? t.closest('.select2-choices').height() : t.height();
           n = h.children('ul.choice2-popup1');
           if (n.hasClass('show')) { // will be closed
             $('div.select2-container-multi ul', this._handle).css('minHeight', ''); // unlock height
           }
           n.toggleClass('show').offset( { top : pos.top + height + 1, left: pos.left });
           // var totalHeight = h.children('ul.choice2-popup1').height();
           // h.children('ul.choice2-popup1').offset( { top : pos.top - totalHeight, left: pos.left })
         } else if (t.hasClass('select2-search-choice-close')) { // remove single choice
           t = $(e.target).closest('li[data-code]').first();
           val = t.attr('data-code');
           n = h.find('ul.choice2-popup1 li.choice2-label[data-code="' + val +'"]').removeClass('selected');
           this.removeFromSelection(val, n);
           t.remove();
           e.stopPropagation();
         }
       },

       // Click on a popup level 1 option
       _handleClickOnItem :function (e) {
         var n = $(e.target),
             options = n.parent().find('li.choice2-label'),
             multiple = "yes" === this.getParam('multiple'),
             _this = this;
         if (multiple || (1 === options.size())) {
           if (n.parent().hasClass('selected')) {
             options.each(
               function (i,e) {
                 var n = $(e);
                 _this.removeFromSelection(n.attr('data-code'), false);
                 n.removeClass('selected');
               }
             );
           } else {
             if (! multiple) { // unselect the other
                this.setSelection([]);
             }
             options.each(
               function (i,e) {
                 var n = $(e);
                 _this.addToSelection(n.attr('data-code'), n.text());
                 n.addClass('selected');
               }
             );
           }
           n.parent().toggleClass('selected');
         }
       },

       // Click on a popup level 2 option
       _handleClickOnLabel : function (e) {
         var n = $(e.target);
         if (("yes" !== this.getParam('multiple')) && !n.hasClass('selected')) { // unselect the other
           this.setSelection([]);
         }
         n.toggleClass('selected');
         if (n.hasClass('selected')) { // has been selected
           this.addToSelection(n.attr('data-code'), n.text());
           _fixItemSelection(n.closest('.choice2-option'));
         } else { // has been unselected
           this.removeFromSelection(n.attr('data-code'), n);
         }
       },

       setSelection : function (values ) {
         var tmp = '',
             set = $('li.choice2-label', this._handle),
             i, label;
         // reset all
         set.filter('.selected').removeClass('selected');
         for (i = 0; i < values.length; i++) {
           if (values[i].length > 0) {
             label = set.filter('[data-code="' + values[i] + '"]').first().addClass('selected').text();
             tmp += '<li class="select2-search-choice" data-code="' + values[i] + '"><div class="select2-label">' + label.replace(/&/g,'&amp;') + '</div><a class="select2-search-choice-close" tabindex="-1" onclick="return false;" href="#"></a></li>';
           }
         }
         $('div.select2-container-multi > ul', this._handle).html(tmp);
         $('li.choice2-option', this._handle).each ( function (i, e) { _fixItemSelection($(e)); } );
       },

       addToSelection : function (value, name) {
         var sel = $('div.select2-container-multi > ul', this._handle);
         if ((sel.find('li.select2-search-choice[data-code="' + value + '"]')).size() === 0) {
           sel.append(
             '<li class="select2-search-choice" data-code="' + value + '"><div class="select2-label">' + name.replace(/&/g,'&amp;') + '</div><a class="select2-search-choice-close" tabindex="-1" onclick="return false;" href="#"></a></li>'
             );
           if ('true' === this.getParam('choice2_closeOnSelect')) {
             $('ul.choice2-popup1', this._handle).removeClass('show');
           }
           this.update($('li.select2-search-choice', this._handle).map( function(i, e) { return $(e).attr('data-code'); } ).get());
         }
       },

       removeFromSelection : function (value, checkParent) {
         var n = $('div.select2-container-multi ul', this._handle);
         if ($(this._handle).children('ul.choice2-popup1').hasClass('show')) {
           n.css('minHeight', n.height() + 'px'); // locks height to avoid "jump"
         }
         $('div.select2-container-multi li[data-code="' + value + '"]', this._handle).remove();
         this.update($('li.select2-search-choice', this._handle).map( function(i, e) { return $(e).attr('data-code'); } ).get());
         if (checkParent) {
           checkParent.closest('.choice2-option').removeClass('selected');
         }
       },

       // FIXME: modifier l'option si ce n'est pas la bonne actuellement ?
       _setData : function ( value, withoutSideEffect ) {
         var values;
         //if(!value && (this.getParam('placeholder'))) {
           // $(this.getHandle()).addClass("axel-choice-placeholder");
         // } else {
           // $(this.getHandle()).removeClass("axel-choice-placeholder");
         // }
         this._data =  value || "";
         if (! withoutSideEffect) {
           values = typeof this._data === "string" ? [ this._data ] : this._data; // converts to array
           this.setSelection(values);
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
    'choice2',
    { filterable: true, optional: true },
    {
    },
    _Editor
  );

  $axel.filter.applyTo({'event' : ['choice2']});
}($axel));
