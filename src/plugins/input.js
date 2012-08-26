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
 *  - detect if HTML5 and use placeholder for 'text' input hint instead of default content
 *
 */
(function () {

  var _CACHE= {}; // TODO: define and subscribe to load_begin / load_end events to clear it

  var _DEFAULT_PARAMS = {
    type : 'text'
  };

  // Internal class to manage an HTML input with a 'text' or 'password' type
  var _KeyboardField = function (editor, aType, aData) {
    var h = editor.getHandle();
    this._editor = editor;
    this.isEditable = !editor.getParam('noedit');
    this.defaultData = aData || 'click to edit';
    xtdom.setAttribute(h, 'type', aType);
    h.value = aData;
    // FIXME: placeholder if HTML5 (?)
  };

  var _encache = function _encache(name, value) {
    // window.console.log('encache ', name, '=', value);
    if (!_CACHE[name]) {
      _CACHE[name] = {};
    }
    _CACHE[name][value] = true;
  };

  var _decache = function _decache(name, value) {
    // window.console.log('decache of ', name, '=', value);
    if (_CACHE[name] && _CACHE[name][value]) {
      delete _CACHE[name][value];
      // window.console.log('decache success of ', name, '=', value);
      return true;
    }
    // window.console.log('decache failure of ', name, '=', value);
    return false;
  };

  _KeyboardField.prototype = {

    awake : function () {
      var h = this._editor.getHandle();
      var _this = this;
      if (this.isEditable) {
        xtdom.addEventListener(h, 'click',
          function(ev) {
            if (!_this.isEditing()) {
              _this.startEditing(ev); 
            }
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
    
    /**
     * AXEL keyboard API (called from Keyboard manager instance)
     */
    isEditing : function () {
      return this._isEditing;
    },

    /**
     * AXEL keyboard API (called from Keyboard manager instance)
     */
    doKeyDown : function (ev) { 
    },

    /**
     * AXEL keyboard API (called from Keyboard manager instance)
     */
    doKeyUp : function (ev) { 
    },  

    /**
     * AXEL tab group manager API
     * Gives the focus to *this* instance. Called by the tab navigation manager.
     */
    focus : function () {
      var m = this._editor.isModified();
      if (m) {
        this._editor.getHandle().focus();
      }
      this.startEditing({shiftKey: !m});
    },

    /**
     * AXEL tab group manager API
     * Takes the focus away from *this* instance. Called by the tab navigation manager.
     */
    unfocus : function () {
      this.stopEditing();
    },

    /**
     * AXEL plugin API
     */
    load : function (aPoint, aDataSrc) {
      var value;
      if (aPoint !== -1) { 
        value = aDataSrc.getDataFor(aPoint);
        this._editor.getHandle().value = value || this._defaultData;
        this._editor.setModified(value !==  this._defaultData);
        this._editor.set(false);
      } else {
          this._editor.clear(false);
      }
    },

    /**
     * AXEL plugin API
     * Writes the editor's current data into the given logger.
     */
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
        if (aEvent.shiftKey || !this._editor.isModified()) {
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
        this._editor.setModified(true);
        this._editor.set(true);
      }
    }

  };

  // Internal class to manage an HTML input with a 'radio' or 'checkbox' type
  var _SelectField = function (editor, aType, aStamp) {
    var h = editor.getHandle(), 
        name = editor.getParam('name');
    this._editor = editor;
    this._type = aType;
    xtdom.setAttribute(h, 'type', aType);
    if (name || (aType === 'radio')) {
      name = (name || '').concat(aStamp || '');
      xtdom.setAttribute(h, 'name', name);
      editor._params['name'] = name;
    }
    if (editor.getParam('checked')) {
      xtdom.setAttribute(h, 'checked', editor.getParam('checked'));
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

    /**
     * AXEL plugin API
     */
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
        // this._editor.clear(false);
      }
      // FIXME: isModified is not accurate for this type of field since we do not track update
    },

    /**
     * AXEL plugin API
     * Writes the editor's current data into the given logger.
     * FIXME: how to handle serialization to an xt:attribute
     */
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
  
  var _InputModel = function(aHandleNode, aDocument) {
    this._handle = aHandleNode;
    this._document = aDocument;
    this._params = [];
    this._isModified = false;
    this._delegate = null;
  };    
  
  _InputModel.prototype = {

    /**
     * AXEL plugin API
     * Init function, called by the model's factory after object's instanciation
     */
    init : function (aDefaultData, aParams, aOption, aUniqueKey, aRepeater) {
      var type, data;
      // 1. parses parameters (FIXME: factorize !)
      if (aParams) { 
        if (typeof (aParams) === 'string') {
          xtiger.util.decodeParameters(aParams, this._params);
        }
        else if (typeof (aParams) === 'object') {
          this._params = aParams;
        }
      }
      // 2. creates delegate
      type = this.getParam('type');
      if ((type === 'text') || (type === 'password')) {
        this._delegate = new _KeyboardField(this, type, aDefaultData);
      } else if ((type === 'radio') || (type === 'checkbox')) {
        this._delegate = new _SelectField(this, type, aRepeater ? aRepeater.getClockCount() : undefined);
      } else {
        xtdom.addClassName(this._handle, 'axel-generator-error');
        xtdom.setAttribute(this._handle, readonly, '1');
        xtdom.setAttribute(this._handle, value, 'ERROR: type "' + type + '" not recognized by plugin "input"');
      }
      // 3. manages optionality (FIXME: cleanup !)
      this._isOptional = aOption ? true : false;
      if (aOption) { /* the editor is optional */
        this._optCheckBox = this._handle.previousSibling;
        if (aOption === 'unset') {
          this._isOptionSet = true; // Quirk to prevent unset to return immediately
        }
        (aOption === 'set') ? this.set(false) : this.unset(false);
      }
      // 4. installs class attribute on handle
      if (this.getParam('hasClass')) {
        xtdom.addClassName(this._handle, this.getParam('hasClass'));
      }
      // 5. installs id attribute on handle 
      // FIXME: to be done
      this.awake();
    },
    
    /**
     * AXEL plugin API
     * Awakes the editor to DOM's events, registering the callbacks for them.
     */
    awake : function () {
      var _this = this;
      this._delegate.awake();
      // manages optionality
      if (this.isOptional()) {
        xtdom.addEventListener(this._optCheckBox, 'click', function(ev) { _this.onToggleOpt(ev); }, true);
      }
    },

    /**
     * AXEL plugin API
     * Creates (lazy creation) an array to "seed" *this* model. Seeding occurs in a repeat context. 
     */
    makeSeed : function () {
      if (!this._seed) {
        this._seed = [ _InputFactory, this._defaultData, this._params, this._isOptional ];
      }
      return this._seed;
    },
    
    /**
     * AXEL plugin API
     * Called when the editor is removed by a repeater. Does nothing by default,
     * it is declared so that it can be filtered.
     */
    remove : function () {
    },

    /**
     * AXEL plugin API (see also execute)
     * Returns true if this object is able to perform the function whose name is given as parameter.
     */
    can : function (aFunction) {
      return typeof this[aFunction] === 'function';
    },

    /**
     * AXEL plugin API
     * Calls on this instance the function whose name is given as parameter with the provided parameter
     * (which may be null). Returns the result.
     */
    execute : function (aFunction, aParam) {
      return this[aFunction](aParam);
    },

    /**
     * AXEL plugin API
     * Returns true if the model's editor is able to be put into a chain of focus. 
     */
    isFocusable : function () {
      return this._delegate.isFocusable();
    },
    
    /**
     * AXEL tab group manager API
     * Gives the focus to *this* instance. Called by the tab navigation manager.
     */
    focus : function () {
      if (this._delegate.focus) {
        this._delegate.focus();
      }
    },

    /**
     * AXEL tab group manager API
     * Takes the focus away from *this* instance. Called by the tab navigation manager.
     */
    unfocus : function () {
      if (this._delegate.focus) {
        this._delegate.unfocus();
      }
    },

    /**
     * AXEL plugin API
     * Loads the editor with data in the point in the data source passed as parameters.
     * Unsets the editor and shows the default content if the point is -1 
     * (i.e. it doesn't exists in the source tree). Shows the default content and considers
     * the editor as set if the point is not -1 but is empty. This can happen for instance 
     * with empty tags in the source tree (e.g. <data/>).
     */
    load : function (aPoint, aDataSrc) {
      this._delegate.load(aPoint, aDataSrc);
    },

    /**
     * AXEL plugin API
     * Writes the editor's current data into the given logger.
     */
    save : function (aLogger) {
      if (this.isOptional() && !this._isOptionSet) {
        aLogger.discardNodeIfEmpty();
      } else {
        this._delegate.save(aLogger);
      }
    },
    
    update : function (aData) {
      this._delegate.update(aData);
    },

    // Clears the model and sets its data to the default data.
    // Unsets it if it is optional and propagates the new state if asked to.     
    clear : function (doPropagate) {
      this._delegate.clear();
      this._isModified = false;
      if (this.isOptional() && this.isSet()) {
        this.unset(doPropagate);
      }
    },
    
    dump : function () {
      return this._delegate.dump();
    },

    getHandle : function () {
      return this._handle;
    },

    getDocument : function () {
      return this._document;
    },

    getParam : function (aKey) {
      return this._params[aKey];
    },

    /**
     * Returns true if the model contains data which is no longer the defaut
     * data, either because a load() call modified it or because an user's
     * interaction has occured.
     */
    isModified : function () {
      return this._isModified;
    },

    /**
     * Sets the isModified flag. Useless unless the update or load methods
     * are filtered by a filter which need to control the isModified
     * behavior.
     */
    setModified : function (isModified) {
      this._isModified = isModified;
    },

    /**
     * Returns the optionality status of *this* instance. True if the model
     * is optional, false otherwise.
     */
    isOptional : function () {
      return this._isOptional;
    },

    /**
     * Returns the optionality status of *this* model, that is, if it
     * is set or unset. Only relevant if the model IS optional
     */
    isSet : function () {
      return this._isOptional && (this._isOptionSet ? true : false);
    },

    /**
     * Sets the editor option status to "set" (i.e. true) if it is optional.
     * Also propagates the change to the repeater chain if asked too and this either it is optional or not.
     */
    set : function(doPropagate) {
      // propagates state change in case some repeat ancestors are unset at that moment
      if (doPropagate) {
        if (!this._params['noedit']) {
          xtiger.editor.Repeat.autoSelectRepeatIter(this.getHandle());
        }
        xtdom.removeClassName(this._handle, 'axel-repeat-unset'); // fix if *this* model is "placed" and the handle is outside the DOM at the moment
      }
      if (this._isOptionSet) { // Safety guard (defensive)
        return;
      }
      this._isOptionSet = true;
      if (this._isOptional) {
        this._handle.disabled = false;
        this._optCheckBox.checked = true;
      }            
    },
  
    /**
     * Sets the editor option status to "unset" (i.e. false) if it is optional.
     */
    unset : function (doPropagate) {
      if (!this._isOptionSet) { // Safety guard (defensive)
        return;
      }
      this._isOptionSet = false;
      if (this._isOptional) {
        this._handle.disabled = true;
        this._optCheckBox.checked = false;
      }
    },

    /**
     * Handler for the option checkbox, toggles the selection state.
     */
    onToggleOpt : function (ev) {
      this._isOptionSet ? this.unset(true) : this.set(true);
    }
  }; /* END of _InputModel class */

  var _BASE_KEY = 'input'; // Base string for key
  var _keyCounter = 0; // Key generation
  var _InputFactory = {

    /**
     * AXEL plugin factory API
     * Creates a DOM model for the text editor. This DOM model represents
     * the default content for the text editor. If a default content is
     * specified in the template, the content is updated later, in the
     * init() function. Returns the created element.
     */
    createModel : function createModel (aContainer, aXTUse, aDocument) {
      var _handle = xtdom.createElement(aDocument, 'input');
      var option = aXTUse.getAttribute('option');
      if (option) {
        var check = xtdom.createElement(aDocument, 'input');
        xtdom.setAttribute(check, 'type', 'checkbox');
        xtdom.addClassName(check, 'axel-option-checkbox');
        aContainer.appendChild(check);
      }
      aContainer.appendChild(_handle);
      return _handle;
    },

    /**
     * AXEL plugin factory API
     * Creates the editor's from an XTiger &lt;xt:use&gt; element. This
     * method is responsible to extract the default content as well as the
     * optional parameters from the &lt;xt:use&gt; element. See the method
     * implementation for the supported default content formats.
     * Returns a new instance of the _InputModel class
     */
    createEditorFromTree : function createEditorFromTree (aHandleNode, aXTUse, aDocument) {
      var _model = new _InputModel(aHandleNode, aDocument);
      var _param = {};
      xtiger.util.decodeParameters(aXTUse.getAttribute('param'), _param);
      if (_param['filter']) {
        xtiger.cross.log('debug', 'applying filter ' + _param['filter']);
        _model = this.applyFilters(_model, _param['filter']);
      }
      _model.init(xtdom.extractDefaultContentXT(aXTUse), aXTUse.getAttribute('param'), aXTUse.getAttribute('option'), this.createUniqueKey());
      return _model;
    },

    /**
     * AXEL plugin factory API    
     * Creates an editor from a seed. The seed must carry the default data
     * content as well as the parameters (as a string) information. Those
     * infos are used to init the new editor.
     */
    createEditorFromSeed : function createEditorFromSeed (aSeed, aClone, aDocument, aRepeater) {
      var _model = new _InputModel(aClone, aDocument);
      var _defaultData = aSeed[1];
      var _params = aSeed[2];
      var _option = aSeed[3];
      if (_params['filter']) {
        _model = this.applyFilters(_model, _params['filter']);
      }
      _model.init(_defaultData, _params, _option, this.createUniqueKey(), aRepeater);
      return _model;
    },
  
    // Create a unique string. Each call to this method returns a different one.
    // FIXME: to be factorized (xtiger.util.createUniqueKey ?)
    createUniqueKey : function createUniqueKey () {
      return _BASE_KEY + (_keyCounter++);
    }
  };
  
  xtiger.editor.Plugin.prototype.pluginEditors['input'] = xtiger.util.filterable('input', _InputFactory);
}());

