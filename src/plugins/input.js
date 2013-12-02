/**
 * Class InputFactory
 *
 * HTML forms "input" element wrapper
 *
 * Currently handles a subset of input types (see Synopsis)
 *
 * Synopsis :
 *  - <xt:use types="input" param="type=(text|password|radio|checkbox|date)[;placeholder=string]">default value</xt:use>
 *  - placeholder parameter is only for a 'text' input
 *
 * Limitations :
 * - 'date' sub-type is only available if jQuery datepicker mdule is loaded in the SAME window as the transformed template
 *
 * TODO :
 *  - load empty values (undefined)
 *  - detect if HTML5 and use placeholder for 'text' input hint instead of default content
 *
 */
(function ($axel) {

  ////////////////////////////////////////////////////////////////
  // Utility functions to aggregate radio buttons / check boxes //
  ////////////////////////////////////////////////////////////////

  var _CACHE= {}; // TODO: define and subscribe to load_begin / load_end events to clear it
  var _CLOCK= {}; // Trick to generate unique names for radio button groups

  var _encache = function _encache(name, value) {
    // xtiger.cross.log('debug', 'encache of ' + name + '=' + value);
    if (!_CACHE[name]) {
      _CACHE[name] = {};
    }
    _CACHE[name][value] = true;
  };

  var _decache = function _decache (name, value) {
    // xtiger.cross.log('debug', 'decache of ' + name + '=' + value);
    if (_CACHE[name] && _CACHE[name][value]) {
      delete _CACHE[name][value];
      // xtiger.cross.log('debug', 'decache success of ' + name + '=' + value);
      return true;
    }
    // xtiger.cross.log('debug', 'decache failure of ' + name + '=' + value);
    return false;
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

  ///////////////////////////////
  // Keyboard Field Base Mixin //
  ///////////////////////////////

  var _KeyboardMixinK = {

    // FIXME: s'abonner aussi sur focus (navigation au clavier avec accessibilité ?)
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
        xtdom.addEventListener(handle, 'focus', _StartEditingMixin, true);
        xtdom.addEventListener(handle, 'click', _StartEditingMixin, true);
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
    // FIXME: call editor.update() method for filtering ? (implies to reestablish getData() and getDefaultData()) ?
    update : function (aData) {
      // 1. no change
      if (aData === this._legacy) {
        return;
      }
      // 2. normalizes text (empty text is set to _defaultData)
      if (aData.search(/\S/) === -1 || (aData === this._defaultData)) {
        this._editor.clear(true);
      } else {
        // 3. notifies data was updated
        this._editor.setModified(aData !== this.defaultData);
        this._editor.set(true);
      }
    }
  };

  /////////////////////
  // Keyboard Field  //
  /////////////////////

  // Internal class to manage an HTML input with a 'text' or 'password' type
  var _KeyboardField = function (editor, aType, aData) {
    var h = editor.getHandle(), size;
    this._editor = editor;
    this.isEditable = !editor.getParam('noedit');
    this.defaultData = aData || '';
    xtdom.setAttribute(h, 'type', aType);
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
      var value, fallback;
      if (aPoint !== -1) {
        value = aDataSrc.getDataFor(aPoint);
        fallback = this._editor.getDefaultData();
        this._editor.getHandle().value = value || fallback || '';
        this._editor.setModified(value !==  fallback);
        this._editor.set(false);
      } else {
          this._editor.clear(false);
      }
    },

    save : function (aLogger) {
      var val = this._editor.getHandle().value;
      if (val) {
        aLogger.write(val);
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
        if (!this._editor.isModified()) {
          xtdom.focusAndSelect(h);
        }
      }
    },

    // Stops the ongoing edition process
    stopEditing : function (isCancel, isBlur) {
      var h, kbd;
      if (this._isEditing) {
        h = this._editor.getHandle();
        kbd = xtiger.session(this._editor.getDocument()).load('keyboard');
        this._isEditing = false; // do it first to prevent any potential blur handle callback
        kbd.unregister(this, this.kbdHandlers, h);
        kbd.release(this, this._editor);
        if (!isCancel) {
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
                    _this.cancelEditing();
                }
                xtdom.stopPropagation(evt);
            });
        // turns field into a datepicker
        this.jhandle = $(h).datepicker().datepicker('option', 'onClose', function () { _this.onClose(); });
        this.constrained = false; // flag to avoid configuration
      } else {
        alert('datepicker jQuery plugin needed for "date" input field !')
      }
      this.dpDone = true;
    },

    awake : function () {
      var tmp, h = this._editor.getHandle();
      this.subscribe(h);
      if (this.defaultData === 'today') {
        tmp = new Date();
        h.value = this.defaultData = $.datepicker ? $.datepicker.formatDate('dd/mm/yy', tmp) : tmp;
      } else {
        h.value = this.defaultData; // FIXME: placeholder if HTML5 (?)
      }
      // size defaults (could be done once in constructor)
      if (! this._editor.getParam('size')) {
        xtdom.setAttribute(h, 'size', 8);
      }
    },

    onClose : function () {
      this.stopEditing(false, true);
    },

    // Starts an edition process on *this* instance's device.
    startEditing : function (aEvent) {
      var min, max, before, h, 
          kbd = xtiger.session(this._editor.getDocument()).load('keyboard');
      if (! this._isEditing) {
        h = this._editor.getHandle();
        this._legacy = h.value;
        this._isEditing = true;
        // registers to keyboard events
        this.kbdHandlers = kbd.register(this, h);
        kbd.grab(this, this._editor);
        if (!this._editor.isModified()) {
          xtdom.focusAndSelect(h);
        }
        if (! this.dpDone) {
          this.lazyInit(h);
        }
        if (this.jhandle) {
          min = this._editor.getParam('minDate');
          max = this._editor.getParam('maxDate');
          before = this._editor.getParam('beforeShow');
          if (this.constrained || min || max || before) {
            if (min === 'today') {
              min = $.datepicker.formatDate('dd/mm/yy', new Date());
            }
            this.jhandle.datepicker('option', 'minDate', min || null);
            if (max === 'today') {
              max = $.datepicker.formatDate('dd/mm/yy', new Date());
            }
            this.jhandle.datepicker('option', 'maxDate', max || null);
            this.jhandle.datepicker('option', 'beforeShow', before || null);
            this.constrained = true;
          }
          xtiger.util.date.setRegion(this._editor.getParam('date_region'));        
          $(h).datepicker('show');
        }
      }
    },

    // Stops the ongoing edition process
    stopEditing : function (isCancel, isBlurOrClose) {
      var h = this._editor.getHandle();
      var kbd = xtiger.session(this._editor.getDocument()).load('keyboard');
      if (this._isEditing) {
        this._isEditing = false; // do it first to prevent any potential blur handle callback
        kbd.unregister(this, this.kbdHandlers, h);
        kbd.release(this, this._editor);
        if (!isCancel) {
          this._editor.update(h.value);
        }
        if ((! isBlurOrClose) && (h.blur)) {
          h.blur();
        }
        if (this.jhandle) {
          this.jhandle.datepicker('hide');
        }
      }
    },

    load : function (aPoint, aDataSrc) {
      var value, fallback;
      if (aPoint !== -1) {
        value = aDataSrc.getDataFor(aPoint);
        value = value ? ($.datepicker ? xtiger.util.date.convertDate(this._editor, value, 'date_format', 'date_region') : value ) : null;
        fallback = this.defaultData;
        this._editor.getHandle().value = value || fallback || '';
        this._editor.setModified(value !==  fallback);
        this._editor.set(false);
      } else {
        this.clear(false);
      }
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
        card = editor.getParam('cardinality');
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
    if (editor.getParam('checked') === 'true') {
      xtdom.setAttribute(h, 'checked', true); // FIXME: does not work ?
    } else {
      if (editor.getParam('noedit') === 'true') {
        xtdom.addClassName(h, 'axel-input-unset');
      }
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
          value = this._editor.getParam('value');
      if (-1 !== aPoint) {
        found = aDataSrc.getDataFor(aPoint);
        ischecked = (found === value);
        if (!ischecked) { // second chance : cache lookup
          name = this._editor.getParam('name');
          if (name) {
            ischecked = _decache(name, value);
            _encache(name, found);
          } // otherwise anonymous checkbox with unique XML tag
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
      } else { // second chance
        // xtiger.cross.log('debug', 'aPoint is -1');
        name = this._editor.getParam('name');
        if (name) {
          ischecked = _decache(name, value);
        } // otherwise anonymous checkbox with unique XML tag
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
      // TODO: serialize checkbox without value with no content or make value mandatory
      // si on accepte contenu vide pb est de faire le load, il faudra tester sur le nom de la balise (?)
      if (this._editor.getHandle().checked) {
        aLogger.write(this._editor.getParam('value'));
      } else { // same as option="unset"
        aLogger.discardNodeIfEmpty();
      }
    },

    update : function (aData) {
      // nope
    },

    clear : function () {
      this._editor.getHandle().checked = false;
      if (this._editor.getParam('noedit') === 'true') {
        xtdom.addClassName(this._editor.getHandle(), 'axel-input-unset');
      }
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
      var _handle = xtdom.createElement(aDocument, 'input'),
          pstr = aXTUse.getAttribute('param'); // IE < 9 does not render 'radio' or 'checkbox' when set afterwards
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
      if ((type === 'text') || (type === 'password')) {
        this._delegate = new _KeyboardField(this, type, aDefaultData);
      } else if ((type === 'radio') || (type === 'checkbox')) {
        this._delegate = new _SelectField(this, type, aRepeater ? aRepeater.getClockCount() : undefined);
      } else if (type === 'date') {
          this._delegate = new _DateField(this, type, aDefaultData);
      } else {
        xtdom.addClassName(this._handle, 'axel-generator-error');
        xtdom.setAttribute(this._handle, 'readonly', '1');
        xtdom.setAttribute(this._handle, 'value', 'ERROR: type "' + type + '" not recognized by plugin "input"');
        alert('Form generation failed : fatal error in "input" plugin declaration')
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
