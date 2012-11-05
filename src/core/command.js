/* AXEL Command (part of AXEL-FORMS)
 *
 * author      : Stéphane Sire
 * contact     : s.sire@oppidoc.fr
 * license     : proprietary
 * last change : 2012-09-05
 *
 * Scripts to interface the AXEL library with a micro-format syntax
 * This allows to use XTiger XML templates without writing Javascript
 *
 * Prerequisites: jQuery + AXEL (https://github.com/ssire/axel)
 *
 * Copyright (c) 2012 Oppidoc SARL, <contact@oppidoc.fr>
 */

/*****************************************************************************\
|                                                                             |
|  AXEL Command                                                               |
|                                                                             |
|  manages commands bound to an HTML page with  a microformat syntax           |
|  the data-target attribute of a command identifies a target editor          |
|  that contains the result of a template transformation                      |
      exposed as $axel.command                                                |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Command support:                                                           |
|    register( name, construtor )                                             |
|             register a new command constructor                              |
|                                                                             |
|  Generic methods:                                                           |
|    logError( msg )                                                          |
|             display an error message                                        |
|    getEditor( id )                                                          |
|             returns an editor object associated with a div containing       |
|             the result of a template transformation. The editor object      |
|             has a high level API to interact with AXEL.                     |
|                                                                             |
\*****************************************************************************/
// TODO
// - factorize mandatory attributes checking (add an array of mandatory to check when calling register ?)
// - rendre id obligatoire sur Editor
// - si pas de data-target, prendre le nom du 1er Editor disponible (? legacy avec data-role ?)
// - detecter le cas du template pré-chargé dans une iframe (tester sur le tag name iframe) 
//   et dans ce cas transformer le contenu de la iframe (?)

(function ($axel) {

  /////////////////////////////////////////////////
  // <div> Hosted editor
  /////////////////////////////////////////////////
  function Editor (identifier, node, axelPath ) {
    var spec = $(node),
        name;

    this.axelPath = axelPath;
    this.key = identifier;
    this.templateUrl = spec.attr('data-template');
    this.dataUrl = spec.attr('data-src');
    this.cancelUrl = spec.attr('data-cancel');
    this.transaction = spec.attr('data-transaction');
    this.spec = spec;

    if (this.templateUrl) {
      // 1. adds a class named after the template on 'body' element
      // FIXME: could be added to the div domContainer instead ?
      if (this.templateUrl !== '#') {
        name = this.templateUrl.substring(this.templateUrl.lastIndexOf('/') + 1);
        if (name.indexOf('?') !== -1) {
          name = name.substring(0, name.indexOf('?'));
        }
        $('body').addClass('edition').addClass(name);
      } // otherwise special case with document as template

      // 2. loads and transforms template and optionnal data
      this.initialize();

      // 3. registers optionnal unload callback if transactionnal style
      if (this.cancelUrl) {
        $(window).bind('unload', $.proxy(this, 'reportCancel'));
      }
    } else {
      $axel.command.logError('Missing data-template attribute to generate the editor "' + this.key + '"');
    }

    // 4. triggers completion event
    $(document).triggerHandler('AXEL-TEMPLATE-READY', [this]);
  }

  Editor.prototype = {

    attr : function (name) {
      return this.spec.attr(name);
    },

    initialize : function () {
      var errLog = new xtiger.util.Logger(),
          template, data, dataFeed;
      if (this.templateUrl === "#") {
        template = document;
      } else {
        template = xtiger.debug.loadDocument(this.templateUrl, errLog);
      }
      if (template) {
        this.form = new xtiger.util.Form(this.axelPath);
        this.form.setTemplateSource(template);
        if (template !== document) {
          this.form.setTargetDocument(document, this.key, true); // FIXME: "untitled" does not work
        }
        // FIXME: currently "#" notation limited to body (document is the template)
        // because setTemplateSource only accept a document
        this.form.enableTabGroupNavigation();
        this.form.transform(errLog);
        if (this.dataUrl) {
          // loads XML data inside the editor
          data = xtiger.cross.loadDocument(this.dataUrl, errLog);
          if (data) {
            if ($('error > message', data).size() > 0) {
              $axel.command.logError($('error > message', data).text());
              // FIXME: disable commands targeted at this editor ?
            } else {
              dataFeed = new xtiger.util.DOMDataSource(data);
              this.form.loadData(dataFeed, errLog);
            }
          }
        }
      }
      if (errLog.inError()) {
        $axel.command.logError(errLog.printErrors());
      }
    },

    // Removes all data in the editor and starts a new editing session
    // Due to limitations in AXEL it reloads the templates and transforms it again
    reset : function () {
      var errLog = new xtiger.util.Logger();
      if (this.form) {
        this.form.transform(errLog);
      }
      if (errLog.inError()) {
        $axel.command.logError(errLog.printErrors());
      }
    },

    serializeData : function () {
      var logger, res;
      if (this.form) {
        logger = new xtiger.util.DOMLogger();
        this.form.serializeData(logger);
        res = logger.dump();
      }
      return res;
    },

    reportCancel : function (event) {
      if (! this.hasBeenSaved) { // trick to avoid cancelling a transaction that has been saved
        $.ajax({
          url : this.cancelUrl,
          data : { transaction : this.transaction },
          type : 'GET',
          async : false
          });
      }
    }
  };

  var sindex = 0, cindex = 0;
  var registry = {}; // Command class registry to instantiates commands
  var editors = {}; //

  var  _Command = {
      // Reports error to the user either in a predefined DOM node (jQuery selector) or as an alert
      logError : function (msg, optSel) {
        var log = optSel ? $(optSel) : undefined;
        if (log && (log.length > 0)) {
          log.text(msg);
        } else {
          alert(msg);
        }
      },

      // Adds a new command factory
      register : function (name, factory, params) {
        var record = { factory : factory };
        if (params) {
          $axel.extend(record, params);
        }
        registry[name] = record;
      },

      getEditor : function (key) {
        return editors[key];
      }
  };

  // Creates a new editor from a DOM node and the path to use with AXEL
  function _createEditor (node, axelPath) {
    var key = $(node).attr('id') || ('untitled' + (sindex++));
    editors[key] = new Editor(key, node, axelPath);
  }

  // Creates a new command from a DOM node
  function _createCommand (node) {
    var type = $(node).attr('data-command'), // e.g. 'save', 'submit'
        key =  $(node).attr('data-target') || ('untitled' + (cindex++)),
        record = registry[type];
    if (record) {
      if (record.check) {
        if ($axel.command.getEditor(key)) { // checks editor existence
            if (node.disabled) { // activates trigger
              node.disabled = false;
            }
            new registry[type].factory(key, node); // command constructor should register to trigger event
        } else {
          node.disabled = true; // unactivates trigger
          $axel.command.logError('Missing or invalid data-target attribute in ' + type + ' command ("' + key + '")');
        }
      } else {
        new registry[type].factory(key, node); // command constructor should register to trigger event
      }
    } else {
      $axel.command.logError('Attempt to create an unkown command "' + type + '"');
    }
  }

  function _installCommands () {
    var axelPath = $('script[data-bundles-path]').attr('data-bundles-path'),
        editors = $('div[data-template]').add('body[data-template="#"]');

    // FIXME: use micro-format for that or solve load sequence ordering issue (?)
    $axel.filter.applyTo({ 'optional' : 'input', 'event' : 'input' });

    // creates editors (div with 'data-template')
    if (editors.length > 0) {
      if (axelPath) {
        editors.each(
          function (index, elt) {
            _createEditor(elt, axelPath);
          }
        );
      } else {
        $axel.command.logError('Cannot start editing because AXEL library path is unspecified');
      }
    }
    
    // creates commands
    $('*[data-command]').each(
      function (index, elt) {
        _createCommand(elt);
      }
    );
    
    // FIXME: use micro-format for that or solve load sequence ordering issue (?)
    $axel.binding.install(document); // FIXME: narrow to installed editors
  }

  // exports module
  $axel.command = _Command;

  // document ready handler to install commands
  jQuery(function() { _installCommands(); });
}($axel));
