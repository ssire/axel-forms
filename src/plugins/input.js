/**
 * Class InputFactory
 *
 * HTML forms "input" element wrapper
 * 
 * Currently handles a subset of input types (see Synopsis)
 *
 * Synopsis :
 *  - <xt:use types="input" param="type=(text|password|radio|checkbox)[;placeholder=string]">default value</xt:use>
 *  - placeholder parameter is only for a 'text' input
 *
 * TODO :
 *  - load empty values (undefined)
 *  - detect if HTML5 and use placeholder for 'text' input hint instead of default content
 *
 */
(function ($axel) {

  var _Generator = function ( aContainer, aXTUse, aDocument ) {
    var _handle = xtdom.createElement(aDocument, 'input'),
        pstr = aXTUse.getAttribute('param'); // IE < 9 does not render 'radio' or 'checkbox' when set afterwards
    if (pstr) {
      if (pstr.indexOf("type=radio") !== -1) {
        xtdom.setAttribute(_handle, 'type', 'radio');
      } else if (pstr.indexOf("type=checkbox") !== -1) {
        xtdom.setAttribute(_handle, 'type', 'checkbox');
      }
    }
    aContainer.appendChild(_handle);
    return _handle;
  };

  var _CACHE= {}; // TODO: define and subscribe to load_begin / load_end events to clear it
  var _CLOCK= {}; // Trick to generate unique names for radio button groups

  // Internal class to manage an HTML input with a 'text' or 'password' type
  var _KeyboardField = function (editor, aType, aData) {
    var h = editor.getHandle();
    this._editor = editor;
    this.isEditable = !editor.getParam('noedit');
    this.defaultData = aData || '';
    xtdom.setAttribute(h, 'type', aType);
    h.value = this.defaultData;
    // FIXME: placeholder if HTML5 (?)
  };

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

  _KeyboardField.prototype = {

    // FIXME: s'abonner aussi sur focus (navigation au clavier avec accessibilité ?)
    awake : function () {
      var h = this._editor.getHandle();
      var _this = this;
      if (this.isEditable) {
        xtdom.addEventListener(h, 'focus',
          function(ev) {
            if (!_this.isEditing()) {
              _this.startEditing(ev); 
            }
            xtdom.stopPropagation(ev);
            xtdom.preventDefault(ev);
          }, true);
        xtdom.addEventListener(h, 'click',
          function(ev) {
            if (!_this.isEditing()) {
              _this.startEditing(ev); 
            }
            xtdom.stopPropagation(ev);
            xtdom.preventDefault(ev);
          }, true);
        xtdom.addEventListener(h, 'mouseup', // needed on Safari to prevent unselection
          function(ev) {
            xtdom.stopPropagation(ev);
            xtdom.preventDefault(ev);
          }, true);
        xtdom.addEventListener(h, 'blur',
          function(ev) { 
            if (_this.isEditing()) {
              _this.stopEditing(false, true);
            }
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
      var h = this._editor.getHandle();
      var kbd = xtiger.session(this._editor.getDocument()).load('keyboard');
      if (this._isEditing) {
        this._isEditing = false; // do it first to prevent any potential blur handle callback
        kbd.unregister(this, this.kbdHandlers, h);
        kbd.release(this, this._editor);
        if (!isCancel) {
          // this.update(h.value);
          this._editor.update(h.value);
        }
        if ((! isBlur) && (h.blur)) {
          h.blur();
        }
      }
    },

    // Called by Keyboard manager (Esc key)
    cancelEditing : function () {
      this._editor.getHandle().value = this._legacy;
      this.stopEditing();
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
      return false;
    },

    load : function (aPoint, aDataSrc) {
      var found, value, ischecked = false;
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
          if (! this._editor.getHandle().checked) {
            this._editor.getHandle().checked = true;
            this._editor.set(false);
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
          if (! this._editor.getHandle().checked) {
            this._editor.getHandle().checked = true;
            this._editor.set(false);
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
    }
  
  };
  
  // you may add a closure to define private properties / methods
  var _Editor = {
    
    ////////////////////////
    // Life cycle methods //
    ////////////////////////

    onInit : function ( aDefaultData, anOptionAttr, aRepeater ) {
      var type, data;
      // create delegate
      type = this.getParam('type');
      if ((type === 'text') || (type === 'password')) {
        this._delegate = new _KeyboardField(this, type, aDefaultData);
      } else if ((type === 'radio') || (type === 'checkbox')) {
        this._delegate = new _SelectField(this, type, aRepeater ? aRepeater.getClockCount() : undefined);
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

    onSave : function (aLogger) {
      if (this.isOptional() && !this.isSet()) {
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
      
      dump : function () {
        return this._delegate.dump();
      },

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

  $axel.plugin.register(
    'input', 
    { filterable: true, optional: true },
    { 
      type : 'text'
      // checked : 'false'
    },
    _Generator,
    _Editor
  );
}($axel));
