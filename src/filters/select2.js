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

// TODO:
// a- add a select2_ignoreAccents=true to decide wether or not to ignore accents
//    (now this is always the case)
// b- integrate filter parameters typing directly into AXEL (?)

// FIXME:
// a- select2 filtering is slow for long lists of options
//    see https://github.com/ivaynberg/select2/issues/781
//    at least we could cache the full query (for static lists)
//    (see updateResults function)
// b- .select2-results max-height could be adjusted dynamically depending
//    on space left to the bottom window on initial opening (using dropdownCss parameter)

(function ($axel) {
  
  // conversion table for extras select2 parameters
  var decodeTypes = {
    dropdownAutoWidth : 'bool',
    minimumResultsForSearch : 'int',
    closeOnSelect : 'bool',
    width : 'str',
    maximumSelectionSize : 'int',
    minimumInputLength : 'int'
  };

  function translate(source) {
    var i, cur, pos, res = '',
        from = 'ÀÁÂÃÄÅÒÓÔÕÕÖØÈÉÊËÇÐÌÍÎÏÙÚÛÜÑŠŸŽ',
        to = 'AAAAAAOOOOOOOEEEECDIIIIUUUUNSYZ';
    for (i = 0; i < source.length; i++) {
      cur = source.charAt(i).toUpperCase();
      pos = from.indexOf(cur);
      res += (pos >= 0) ? to.charAt(pos) : cur;
    }
    return res;
  }

  /* Copied and adapted from select2 
  */
  function markMatch(text, term, markup, escapeMarkup, match) {
    var tl=term.length;
    markup.push(escapeMarkup(text.substring(0, match)));
    markup.push("<span class='select2-match'>");
    markup.push(escapeMarkup(text.substring(match, match + tl)));
    markup.push("</span>");
    markup.push(escapeMarkup(text.substring(match + tl, text.length)));
  }

  function formatSelection (state, container) {
    var text, i, res;
    if ($.isArray(state) && state[0]) { // tags option for free text entry
      text = state[0].text || ''; // currently only multiple = 'no' supported
    } else {
      text = (state && state.text) ? state.text : '';
    }
    i = text.indexOf('::');      
    res = (i != -1) ? text.substr(0, i) : text;
    return res
  }

  function formatResult(state, container, query, escapeMarkup, openTag) {
    var text = (state && state.text) ? state.text : '',
        i = text.indexOf('::'),
        oTag = openTag || ' - <span class="select2-complement">',
        cTag = '</span>',
        qTerm = translate(query.term),
        match, markup;
    if (text) {
      markup=[];
      if (i != -1 ) { // with complement
        if (query.term.length > 0) {
          match=translate(text).indexOf(qTerm);
          //match=$(state.element).data('key').indexOf(qTerm);
          if (match < i) {
            markMatch(text.substr(0, i), qTerm, markup, escapeMarkup, match);
            markup.push(oTag + escapeMarkup(text.substr(i + 2)) + cTag);
          } else if (match > i+1) {
            markup.push(text.substr(0, i));
            markup.push(oTag);
            markMatch(text.substr(i + 2), qTerm, markup, escapeMarkup, match-i-2);
            markup.push(cTag);
          } else {
            return escapeMarkup(text.substr(0, i)) + oTag + escapeMarkup(text.substr(i + 2)) + cTag;
          }
        } else {
          return escapeMarkup(text.substr(0, i)) + oTag + escapeMarkup(text.substr(i + 2)) + cTag;
        }
      } else if (query.term.length > 0) { // w/o complement with term
        match=translate(text).indexOf(qTerm);
        //match=$(state.element).data('key').indexOf(qTerm);
        if (match >= 0) {
          markMatch(text, qTerm, markup, escapeMarkup, match);
        } else {
          return text;
        }
      } else {
        return text;
      }
      return markup.join("");
    }
  }

  // Special matcher that does not care about latin accents 
  // uses a caching mechanism in case of option based selector
  // FIXME: update select2 to version 3.4.5 with stripDiacritics function
  function accentProofMatcher(term, text, option) {
    var key;
    if (option) {
      key = option.data("key");
      if (! key) {
        key = translate(text);
        option.data("key",key);
      }
    } else {
      key = translate(text);
    }
    return key.indexOf(translate(term))>=0;
  }
  
  /* FIXME: to be internationalized */
  function formatInputTooShort(input, min) { 
    var n = min - input.length; return "Entrez au moins " + n + " caractère" + (n == 1? "" : "s"); 
  }

  var _Filter = {

    // rick to prevent cloning 'select2' shadow list when instantiated inside a repetition
    // the guard is needed to persist xttOpenLabel if planted on plugin
    onGenerate : function ( aContainer, aXTUse, aDocument ) {
      var res;
      if (this.getParam("select2_tags") === 'yes') { // do not take appearance into account
        res = xtdom.createElement (aDocument, 'input');
      } else {
        res = this.__select2__onGenerate(aContainer, aXTUse, aDocument);
      }
      aContainer.appendChild(res);
      $(res).wrap('<span class="axel-guard"/>');
      return res;
    },

    onAwake : function () {
      var  _this = this,
           defval = this.getDefaultData(),
           pl = this.getParam("placeholder"),
           klass = this.getParam("select2_complement"),
           tag = klass ? ' - <span class="' + klass + '">' : undefined,
           formRes = klass ? function (s, c, q, e) { return formatResult(s, c, q, e, tag) } : formatResult,
           params = {
             myDoc : this.getDocument(),
             formatResult: formRes,
             formatSelection : formatSelection,
             matcher : accentProofMatcher,
             formatInputTooShort : formatInputTooShort
           }, k, curVal, typVal;
      for (k in decodeTypes) { // FIXME: typing system to be integrated with AXEL
        curVal = this.getParam('select2_' + k);
        if (curVal) {
          if (decodeTypes[k] === 'bool') {
            typVal = curVal === 'true' ? true : false;
          } else if (decodeTypes[k] === 'int') {
            typVal = parseInt(curVal);
          } else {
            typVal = curVal;
          }
          params[k] = typVal;
        }
      }
      if (this.getParam("select2_tags") === 'yes') { // not compatible with placeholder
        params.multiple = false;
        params.tags = this.getParam('i18n');
        delete params.minimumResultsForSearch;
      } else {
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
      }
      this._setData(defval);
      $(this._handle).select2(params).change(
        function (ev, data) {
         if (!(data && data.synthetic)) { // short circuit if forged event (onLoad)
           _this.update($(this).val()); // tells 'choice' instance to update its model
         }
        }
      );
      $(this._handle).prev('.select2-container').get(0).xttNoShallowClone = true; // prevent cloning
    },

     // Triggers DOM 'change' event to tell model has changed to select2 implementation
     onLoad : function (aPoint, aDataSrc) {
       this.__select2__onLoad(aPoint,aDataSrc);
       $(this._handle).trigger("change", { synthetic : true });
     },
     
     ////////////////////////////////
     // Overwritten plugin methods //
     ////////////////////////////////
     
     api : {
       
       update : function (aData) {
         var _this = this;
         this.__select2__update(aData);
         setTimeout(function() { $(_this._handle).select2('focus'); }, 50);
         // keeps focus to be able to continue tabbing after drop list closing
       },

       focus : function () {
         $(this._handle).select2('focus');
       }
     },
     
     methods : {
     
       _setData : function ( value, withoutSideEffect ) {
         var filtered = value, i;
         if (this.getParam("select2_tags")) { // remove complement (see formatSelection)
           i = value.indexOf('::');
           if (i != -1) {
             filtered = value.substr(0, i);
           }
         }
         this.__select2___setData(filtered, withoutSideEffect);
       }
      }
  };

  $axel.filter.register(
    'select2',
    { chain : [ 'update', 'onGenerate', 'onLoad', '_setData' ] },
    {
      select2_dropdownAutoWidth : 'false',
      select2_minimumResultsForSearch : '7',
      select2_closeOnSelect : 'false',
      select2_width : 'element',
      select2_maximumSelectionSize : '-1',
      select2_minimumInputLength : undefined,
    },
    _Filter);
  $axel.filter.applyTo({'select2' : 'choice'});
}($axel));
