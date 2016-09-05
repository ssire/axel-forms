/**
 * Class InputFactory
 *
 * HTML forms "input" element wrapper
 *
 * Currently handles a subset of input types (see Synopsis)
 *
 * Synopsis :
 *  - <xt:use types="input" param="type=(text|password|radio|checkbox|date)[;placeholder=string]">default value</xt:use>
 *  - placeholder parameter is only for a 'text' or 'date' input
 *
 * Limitations :
 * - you can set only one 'beforeShow' calback at a time (cf. bindings/interval.js)
 * - 'date' sub-type is only available if jQuery datepicker mdule is loaded in the SAME window as the transformed template
 * - 'date' not really inserted in AXEL tabbing (don't register to keyboard manager)
 *
 * TODO :
 *  - load empty values (undefined)
 *  - placeholder=clear
 *  - detect if HTML5 and use placeholder for 'text' input hint instead of default content
 *
 */
(function ($axel) {

  ////////////////////////////////////////////////////////////////
  // Utility functions to aggregate radio buttons / check boxes //
  ////////////////////////////////////////////////////////////////

  var _CACHE= {}; // TODO: define and subscribe to load_begin / load_end events to clear it
  var _CLOCK= {}; // Trick to generate unique names for radio button groups

  // name may be undefined in case of checkbox with unique XML tag
  var _encache = function _encache(name, value) {
    if (name) {
      if (!_CACHE[name]) {
        _CACHE[name] = {};
      }
      _CACHE[name][value] = true;
    }
  };

  // name may be undefined in case of checkbox with unique XML tag
  var _decache = function _decache (name, value) {
    var res = false;
    if (name) {
      if (_CACHE[name] && _CACHE[name][value]) {
        delete _CACHE[name][value];
        res = true;
      }
    }
    return res;
  };

  // Returns date of the day in the date_region format of the editor
  // Pre-condition: there must be a $.datepicker
  var _genTodayFor = function (editor) {
      var format = editor.getParam('date_format'); // either pre-defined constant of custom format date string
      return xtiger.util.date.convertDate(editor, $.datepicker.formatDate($.datepicker[format] || format, new Date()), 'date_format' , 'date_region');
  };

  var _getClockCount = function (name, card) {
    var tmp = parseInt(card),
        num = ((tmp === 0) || (isNaN(tmp))) ? 1 : tmp; // FIXME: could be stored once into param
    if (_CLOCK[name] === undefined) {
      _CLOCK[name] = 0;
    } else {
      _CLOCK[name] += 1;
    }
    return Math.floor(_CLOCK[name] / num);
  };

  var _formatTextBlock = function (stack, aLogger) {
    var cur;
    if (stack.length > 1) {
      aLogger.openTag('Block');
      while (cur = stack.shift()) {
        aLogger.openTag('Line');
        aLogger.write(cur);
        aLogger.closeTag('Line');
      }
      aLogger.closeTag('Block');
    } else if (1 === stack.length) {
      aLogger.openTag('Text');
      aLogger.write(stack.pop());
      aLogger.closeTag('Text');
    }
  };
  
  // returns true if node contains at least one non-empty Element children
  var _containElements = function (node) {
    var cur = node.firstChild, res = false;
    while (cur) {
      if (cur.nodeType === xtdom.ELEMENT_NODE && cur.firstChild) {
        res = true;
        break;
      }
      cur = cur.nextSibling;
    }
    return res;
  };
  
  var _normalizeEntry = function (multi, value) {
    var res;
    if (multi === 'normal') { // normalization
      res = $.trim(value).replace(/((\r\n|\n|\r)+)/gm,"$2$2").replace(/(\r\n|\n|\r)\s+(\r\n|\n|\r)/gm,"$1$2");
    } else if (multi === 'enhanced') {
      res = $.trim(value).replace(/((\r\n|\n|\r){2,})/gm,"$2$2").replace(/(\r\n|\n|\r)\s+(\r\n|\n|\r)/gm,"$1$2");
    } else {
      res = $.trim(value);
    }
    return res;
  };

  ///////////////////////////////
  // Keyboard Field Base Mixin //
  ///////////////////////////////

  var _KeyboardMixinK = {

    subscribe : function (handle) {
      var _this = this;
      var _StartEditingMixin = function(ev) {
        if (!_this.isEditing()) {
          _this.startEditing(ev);
        }
        xtdom.stopPropagation(ev);
        xtdom.preventDefault(ev);
      };
      if (this.isEditable) {
        // 'focus' event triggered either when landing from keyboard tab navigation or from 'click' event
        xtdom.addEventListener(handle, 'focus', _StartEditingMixin, true);
        xtdom.addEventListener(handle, 'mouseup', // needed on Safari to prevent unselection
          function(ev) {
            xtdom.stopPropagation(ev);
            xtdom.preventDefault(ev);
          }, true);
      }
    },

    isFocusable : function () {
      return (this.isEditable && ((!this._editor.isOptional()) || this._editor.isSet()));
    },

    // AXEL keyboard API (called from Keyboard manager instance)
    isEditing : function () {
      return this._isEditing;
    },

    // AXEL keyboard API (called from Keyboard manager instance)
    doKeyDown : function (ev) {
    },

    // AXEL keyboard API (called from Keyboard manager instance)
    doKeyUp : function (ev) {
    },

    // AXEL tab group manager API
    // Gives the focus to *this* instance. Called by the tab navigation manager.
    focus : function () {
      this._editor.getHandle().focus();
      this.startEditing();
    },

    // AXEL tab group manager API
    // Takes the focus away from *this* instance. Called by the tab navigation manager.
    unfocus : function () {
      this.stopEditing();
    },

    // Called by Keyboard manager (Esc key)
    cancelEditing : function () {
      this._editor.getHandle().value = this._legacy;
      this.stopEditing(true, false);
    },

    clear : function () {
      this._editor.getHandle().value = this.defaultData;
    },

    // Updates this model with the given data.
    // If this instance is optional and "unset", autocheck it.
    update : function (aData) {
      // 1. no change
      if (aData === this._legacy) {
        return;
      }
      // 2. normalizes text (empty text is set to _defaultData)
      if (aData.search(/\S/) === -1 || (aData === this._defaultData)) {
        this._editor.clear(true);
      } else {
        // 2. notifies data was updated
        this._editor.setModified(aData !== this.defaultData);
        this._editor.set(true);
      }
    }
  };

  /////////////////////
  // Keyboard Field  //
  /////////////////////

  // Internal class to manage an HTML input with a 'text', 'number' or 'password' type
  // Currently 'number' type is not passed to HTML but is treated as 'text' because
  // it requires extra configuration like steps some of which browser's dependent
  var _KeyboardField = function (editor, aType, aData) {
    var h = editor.getHandle(),
        t = 'number' !== aType ? aType : 'text',
        size;
    this._editor = editor;
    this.isEditable = !editor.getParam('noedit');
    this.defaultData = aData || '';
    xtdom.setAttribute(h, 'type', t);
    if (size = editor.getParam('size')) {
      xtdom.setAttribute(h, 'size', size);
    }
    h.value = this.defaultData;
    // FIXME: placeholder if HTML5 (?)
  };

  _KeyboardField.prototype = {

    awake : function () {
      var h = this._editor.getHandle();
      var _this = this;
      this.subscribe(h);
      if (this.isEditable) {
        xtdom.addEventListener(h, 'blur',
          function(ev) {
            if (_this.isEditing()) {
              _this.stopEditing(false, true);
            }
          }, true);
      }
    },

    load : function (aPoint, aDataSrc) {
      var value, fallback, multi;
      if (aPoint !== -1) {
        multi = this._editor.getParam('multilines');
        if ((multi === 'normal') || (multi === 'enhanced')) {
          if (_containElements(aPoint[0])) {
            var cur = aPoint[0].firstChild, line,
                buffer = '';
            while (cur) {
              if (cur.nodeType === xtdom.ELEMENT_NODE && cur.firstChild) {
                if ('Text' === cur.nodeName) {
                  buffer = buffer + cur.firstChild.nodeValue + '\n\n';
                } else if ('Block' === cur.nodeName) {
                  line = cur.firstChild;
                  while (line) {
                    if (line.nodeType === xtdom.ELEMENT_NODE && line.firstChild) { // assumes Line
                      buffer = buffer + line.firstChild.nodeValue + '\n';
                    }
                    line = line.nextSibling;
                  }
                  buffer = buffer + '\n';
                }
              }
              cur = cur.nextSibling;
            }
            value = buffer;
          } else { // auto-migration of legacy plain text content
            value = _normalizeEntry(multi, aDataSrc.getDataFor(aPoint));
          }
        } else {
          value = aDataSrc.getDataFor(aPoint);
        }
        fallback = this._editor.getDefaultData();
        this._editor.getHandle().value = value || fallback || '';
        this._editor.setModified(value !==  fallback);
        this._editor.set(false);
      } else {
          this._editor.clear(false);
      }
    },

    save : function (aLogger) {
      var val = $.trim(this._editor.getHandle().value),
          pending, _scanner;

      var singleLineI = function (str, found) {
        if (found.length > 0)  {
          aLogger.openTag('Text');
          aLogger.write(found);
          aLogger.closeTag('Text');
        }
      };

      var singleLineII = function (str, found) {
        var sep = str.charCodeAt(1);
        if ((sep === 10) || (sep === 13)) {
          _formatTextBlock(pending, aLogger);
          pending = [];
        }
        if (found.length > 0) {
          pending.push(found);
        }
      };

      if (val) {
        multi = this._editor.getParam('multilines');
        if (multi) {
          _scanner = new RegExp("[\n\r]{0,}(.*)", "g");
          if ('normal' === multi) {
            val.replace(_scanner, singleLineI);
          } else { // assumes enhanced
            pending = [];
            val.replace(_scanner, singleLineII);
            _formatTextBlock(pending, aLogger);
          }
        } else if ('number' === this._editor.getParam('type')) {
          aLogger.write(val.replace(',','.')); // forces decimal point representation
        } else {
          aLogger.write(val);
        }
      }
    },

    // Starts an edition process on *this* instance's device.
    startEditing : function (aEvent) {
      var h, kbd = xtiger.session(this._editor.getDocument()).load('keyboard');
      if (! this._isEditing) {
        h = this._editor.getHandle();
        this._legacy = h.value;
        this._isEditing = true;
        // registers to keyboard events
        this.kbdHandlers = kbd.register(this, h);
        kbd.grab(this, this._editor); // this._editor for Tab group manager to work
        if (this._editor.getParam('multilines')) {
          kbd.enableRC(true);
        }
        if (!this._editor.isModified()) {
          xtdom.focusAndSelect(h);
        }
      }
    },

    // Stops the ongoing edition process
    stopEditing : function (isCancel, isBlur) {
      var h, kbd, multi;
      if (this._isEditing) {
        h = this._editor.getHandle();
        kbd = xtiger.session(this._editor.getDocument()).load('keyboard');
        this._isEditing = false; // do it first to prevent any potential blur handle callback
        kbd.unregister(this, this.kbdHandlers, h);
        kbd.release(this, this._editor);
        if ('normal' === this._editor.getParam('multilines')) {
          kbd.disableRC();
        }
        if (!isCancel) {
          multi = this._editor.getParam('multilines');
          h.value = _normalizeEntry(multi, h.value);
          this._editor.update(h.value);
        }
        if ((! isBlur) && (h.blur)) {
          h.blur();
        }
      }
    }
  };

  /////////////////
  // Date Field  //
  /////////////////

  // Internal class to manage an HTML input with a 'text' or 'password' type
  var _DateField = function (editor, aType, aData) {
    xtdom.setAttribute(editor.getHandle(), 'type', 'text');
    this._editor = editor;
    this.isEditable = !editor.getParam('noedit');
    this.defaultData = aData || '';
    this.dpDone = false; // datepicker init done
  };

  _DateField.prototype = {

    // Initializes datepicker on demand because we do not want to create it from scratch
    // to avoid beeing set on shadow clone when instantiated inside a repeater
    lazyInit : function (h) {
      var tmp, _this = this;
      if ($.datepicker) {
        // trick to detect 'Esc' key since keyboard manager seem to be overriden by datepicker
        $(h).on('keydown', function(evt) {
                if (evt.keyCode === $.ui.keyCode.ESCAPE) {
                    _this.onEscape();
                }
                xtdom.stopPropagation(evt);
            });
        // turns field into a datepicker
        this.jhandle = $(h).datepicker( { 'onClose' : function () { _this.onClose(); } } );
      } else {
        alert('datepicker jQuery plugin needed for "date" input field !');
      }
      this.dpDone = true;
    },

    awake : function () {
      var h = this._editor.getHandle();
      this.subscribe(h);
      if (this.defaultData === 'today') {
        h.value = this.defaultData = $.datepicker ? _genTodayFor(this._editor) : new Date();
      } else {
        h.value = xtiger.util.date.convertDate(this._editor, this.defaultData, 'date_format' , 'date_region');
      }
      this.model = h.value;
      // size defaults (could be done once in constructor)
      if (! this._editor.getParam('size')) {
        xtdom.setAttribute(h, 'size', 8);
      }

    },

    // date picker event called before onClose if user hit Esc
    onEscape : function (num) {
      this.escape = true;
    },

    onClose : function () {
      this.stopEditing(this.escape);
      this.escape = false;
    },

    // Starts an edition session
    // Only setup field once
    startEditing : function (aEvent) {
      var min, max, before, h;
      xtiger.util.date.setRegion(this._editor.getParam('date_region'));
      if (! this.dpDone) {
        h = this._editor.getHandle();
        this.lazyInit(h);
        if (this.jhandle) {
          min = this._editor.getParam('minDate');
          max = this._editor.getParam('maxDate');
          before = this._editor.getParam('beforeShow');
          if (min) {
            min = (min === 'today') ? _genTodayFor(this._editor) : xtiger.util.date.convertDate(this._editor, min, 'date_format' , 'date_region');
            this.jhandle.datepicker('option', 'minDate', min);
          }
          if (max) {
            max = (max === 'today') ? _genTodayFor(this._editor) : xtiger.util.date.convertDate(this._editor, max, 'date_format' , 'date_region');
            this.jhandle.datepicker('option', 'maxDate', max);
          }
          if (before) {
            this.jhandle.datepicker('option', 'beforeShow', before);
          }
          $(h).datepicker('show');
        }
      }
    },

    // Stops the ongoing edition process
    stopEditing : function (isCancel) {
      var h = this._editor.getHandle();
          val = h.value;
      if (val.search(/\S/) === -1) { // space normalization
        val = ''; // will reset to default data
      }
      // incl. rough check on validity - FIXME: adjust to data_region / date_format ?
      if (val && ((val.length !== 10) || isCancel)) {
        h.value = this.model; // reset to previous value
      } else {
        this._editor.update(val);
        this.model = h.value;
      }
    },

    load : function (aPoint, aDataSrc) {
      var value, fallback,
          h = this._editor.getHandle();
      if (aPoint !== -1) {
        value = aDataSrc.getDataFor(aPoint);
        value = value ? ($.datepicker ? xtiger.util.date.convertDate(this._editor, value, 'date_format', 'date_region') : value ) : null;
        fallback = this.defaultData;
        h.value = value || fallback || '';
        this._editor.setModified(value !==  fallback);
        this._editor.set(false);
      } else {
        this.clear(false);
      }
      this.model = h.value;
    },

    save : function (aLogger) {
      var value = this._editor.getHandle().value;
      if (value) {
        value = $.datepicker ? xtiger.util.date.convertDate(this._editor, value, 'date_region', 'date_format') : value;
        aLogger.write(value);
      }
    }
  };

  //////////////////
  // Select Field //
  //////////////////

  // Internal class to manage an HTML input with a 'radio' or 'checkbox' type
  // cardinality is required for radio group when ?
  var _SelectField = function (editor, aType, aStamp) {
    var h = editor.getHandle(),
        name = editor.getParam('name'),
        card = editor.getParam('cardinality'),
        checked = editor.getParam('checked');
    this._editor = editor;
    this._type = aType;
    // xtdom.setAttribute(h, 'type', aType); (done in Generator because of IE < 9)
    if (name || (aType === 'radio')) {
      if (card) {
        aStamp = _getClockCount(name || 'void', card).toString(); // there should be a name
      }
      name = (name || '').concat(aStamp || '');
      xtdom.setAttribute(h, 'name', name);
      // xtiger.cross.log('debug', 'Created input type ' + aType + ' name=' + name);
    }
    if (checked) {
      if (checked === editor.getParam('value')) {
        h.checked = true; // xtdom.setAttribute(h, 'checked', true);
      } else {
        _encache(name, checked);
      }
    } else if (_decache(name, editor.getParam('value'))) {
      h.checked = true; // xtdom.setAttribute(h, 'checked', true);
    }
    if (editor.getParam('noedit') === 'true') {
      xtdom.addClassName(h, 'axel-input-unset');
    }
    // FIXME: transpose defaultData (checked attribute ?)
  };

  _SelectField.prototype = {

    awake : function () {
      // places an update call only for event filtering
      var h = this._editor.getHandle();
      var _this = this;
      xtdom.addEventListener(h, 'click',
        function(ev) {
          if (_this._editor.getHandle().checked) {
            _this._editor.update(_this._editor.getParam('value'));
          } else {
            _this._editor.update('');
          }
        }, true);
    },

    isFocusable : function () {
      return true;
    },

    load : function (aPoint, aDataSrc) {
      var found,
          h = this._editor.getHandle(),
          ischecked = false,
          value = this._editor.getParam('value'),
          checked;
      if (-1 !== aPoint) {
        found = aDataSrc.getDataFor(aPoint);
        ischecked = (found === value);
        if (!ischecked) { // store it for 2nd chance cache lookup
          name = this._editor.getParam('name');
          ischecked = _decache(name, value);
          _encache(name, found);
        }
        if (ischecked) { // checked
          if (! h.checked) {
            h.checked = true;
            this._editor.set(false);
            if (this._editor.getParam('noedit') === 'true') {
              xtdom.removeClassName(h, 'axel-input-unset');
            }
          }
        } else { // no checked
          this._editor.clear(false);
        }
      } else { // no value in XML input stream or 2nd chance
        checked = this._editor.getParam('checked');
        if (checked) { // MUST BE 1st input of the serie
          if (checked === value) {
            ischecked = true;
          } else {
            name = this._editor.getParam('name');
            _encache(name, checked);  // store it for 2nd chance cache lookup
          }
        } else { // try 2nd chance cache lookup
          name = this._editor.getParam('name');
          ischecked = _decache(name, value); 
        }
        if (ischecked) { // checked
          if (! h.checked) {
            h.checked = true;
            this._editor.set(false);
            if (this._editor.getParam('noedit') === 'true') {
              xtdom.removeClassName(h, 'axel-input-unset');
            }
          }
        } else { // no checked
          this._editor.clear(false);
        }
      }
      // FIXME: isModified is not accurate for this type of field since we do not track update
    },

    // FIXME: how to handle serialization to an xt:attribute
    save : function (aLogger) {
      var ed = this._editor;
      // TODO: serialize checkbox without value with no content or make value mandatory
      // si on accepte contenu vide pb est de faire le load, il faudra tester sur le nom de la balise (?)
      if (ed.getHandle().checked && (ed.getParam('noxml') !== 'true')) {
        aLogger.write(this._editor.getParam('value'));
      } else { // same as option="unset"
        aLogger.discardNodeIfEmpty();
      }
    },

    update : function (aData) {
      // nope
    },

    clear : function () {
      var h = this._editor.getHandle();
      if (this._editor.getParam('noedit') === 'true') {
        xtdom.addClassName(h, 'axel-input-unset');
      }
      h.checked = false;
    },

    focus : function () {
      this._editor.getHandle().focus();
    },

    unfocus : function () {
    }
  };

  ////////////////////////
  // The 'input' plugin //
  ////////////////////////
  var _Editor = {

    ////////////////////////
    // Life cycle methods //
    ////////////////////////

    onGenerate : function ( aContainer, aXTUse, aDocument ) {
      var pstr = aXTUse.getAttribute('param'), // IE < 9 does not render 'radio' or 'checkbox' when set afterwards
          tag = (!pstr || (pstr.indexOf('type=textarea') === -1)) ? 'input' : 'textarea',
          _handle = xtdom.createElement(aDocument, tag);
      if (pstr) {
        if (pstr.indexOf("type=radio") !== -1) {
          xtdom.setAttribute(_handle, 'type', 'radio');
        } else if (pstr.indexOf("type=checkbox") !== -1) {
          xtdom.setAttribute(_handle, 'type', 'checkbox');
        }
      }
      if (this.getParam('noedit') === 'true') {
        _handle.disabled = true;
      }
      aContainer.appendChild(_handle);
      return _handle;
    },

    onInit : function ( aDefaultData, anOptionAttr, aRepeater ) {
      var type, data;
      // create delegate
      type = this.getParam('type');
      if ((type === 'text') || (type === 'number') || (type === 'password') || (type === 'textarea')) {
        this._delegate = new _KeyboardField(this, type, aDefaultData);
      } else if ((type === 'radio') || (type === 'checkbox')) {
        this._delegate = new _SelectField(this, type, aRepeater ? aRepeater.getClockCount() : undefined);
      } else if (type === 'date') {
          this._delegate = new _DateField(this, type, aDefaultData);
      } else {
        xtdom.addClassName(this._handle, 'axel-generator-error');
        xtdom.setAttribute(this._handle, 'readonly', '1');
        xtdom.setAttribute(this._handle, 'value', 'ERROR: type "' + type + '" not recognized by plugin "input"');
        alert('Form generation failed : fatal error in "input" plugin declaration');
      }
      if (this.getParam('hasClass')) {
        xtdom.addClassName(this._handle, this.getParam('hasClass'));
      }
      // TBD: id attribute on handle (?)
    },

    onAwake : function () {
      this._delegate.awake();
    },

    onLoad : function (aPoint, aDataSrc) {
      this._delegate.load(aPoint, aDataSrc);
    },

    // Discards node if disabled (this is useful when used together with 'condition' binding)
    onSave : function (aLogger) {
      if (($(this.getHandle()).attr('disabled') === "disabled") || (this.isOptional() && !this.isSet())) {
        aLogger.discardNodeIfEmpty();
      } else {
        this._delegate.save(aLogger);
      }
    },

    ////////////////////////////////
    // Overwritten plugin methods //
    ////////////////////////////////
    api : {

      isFocusable : function () {
        return this._delegate.isFocusable();
      },

      focus : function () {
        if (this._delegate.focus) {
          this._delegate.focus();
        }
      },

      unfocus : function () {
        if (this._delegate.focus) {
          this._delegate.unfocus();
        }
      }
    },

    /////////////////////////////
    // Specific plugin methods //
    /////////////////////////////
    methods : {

      update : function (aData) {
        this._delegate.update(aData);
      },

      // Clears the model and sets its data to the default data.
      // Unsets it if it is optional and propagates the new state if asked to.
      clear : function (doPropagate) {
        this._delegate.clear();
        this.setModified(false);
        if (this.isOptional() && this.isSet()) {
          this.unset(doPropagate);
        }
      },

      // Overwrite 'optional' mixin method
      set : function(doPropagate) {
        // propagates state change in case some repeat ancestors are unset at that moment
        if (doPropagate) {
          if (!this.getParam('noedit')) {
            xtiger.editor.Repeat.autoSelectRepeatIter(this.getHandle());
          }
          xtdom.removeClassName(this._handle, 'axel-repeat-unset');
          // fix if *this* model is "placed" and the handle is outside the DOM at the moment
        }
        if (! this._isOptionSet) {
          this._isOptionSet = true;
          if (this._isOptional) {
            this._handle.disabled = false;
            this._optCheckBox.checked = true;
          }
        }
      },

      // Overwrite 'optional' mixin method
      unset : function (doPropagate) {
        if (this._isOptionSet) {
          this._isOptionSet = false;
          if (this._isOptional) {
            this._handle.disabled = true;
            this._optCheckBox.checked = false;
          }
        }
      }
    }
  };

  $axel.extend(_KeyboardField.prototype, _KeyboardMixinK);
  $axel.extend(_DateField.prototype, _KeyboardMixinK);

  $axel.plugin.register(
    'input',
    { filterable: true, optional: true },
    {
      type : 'text',
      date_region : 'fr',
      date_format : 'ISO_8601'
      // checked : 'false'
    },
    _Editor
  );
}($axel));
