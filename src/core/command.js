/* AXEL Command (part of AXEL-FORMS)
 *
 * author      : Stéphane Sire
 * contact     : s.sire@oppidoc.fr
 * license     : LGPL v2.1
 * last change : 2015-05-15
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

(function ($axel) {

  var sindex = 0, cindex = 0;
  var registry = {}; // Command class registry to instantiates commands
  var editors = {};
  var commands = {};

  var  _Command = {

      // FIXME: replace with $axel.defaults ?
      defaults : {},

      configure : function (key, value) {
        this.defaults[key] = value;
      },

      // DEPRECATED : replace with $axel.error instead
      logError : function (msg, opt) {
        $axel.error(msg, opt);
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
      },
      
      getCommand : function (name, key) {
        var _name = name,
            _key = key,
            c = commands[key],
            found = c ? c[name] : undefined;
        return found || { execute : function () { alert('Command ' + _name  + ' not found on ' + _key) }  };
      }
  };

  function _addEditor (key, editor) {
    xtiger.cross.log('debug',"adding editor " + key);
    editors[key] = editor; // stores editor for getEditor
  }

  // Creates 'transform' commands, note that implicit ones
  // (i.e. w/o an associated data-command='transform') will immediately generate an editor
  function _createEditor (node, doc) {
    var key = $(node).attr('id') || ('untitled' + (sindex++)),
        res = new registry['transform'].factory(key, node, doc);
    xtiger.cross.log('debug',"registering editor " + key);
    editors[key] = res; // stores editor for getEditor
    return res;
  }

  // Creates a new command from a DOM node
  // FIXME: data-command='template' exception (exclusion or handle it properly)
  function _createCommand (node, type, doc) {
    var key =  $(node).attr('data-target') || ('untitled' + (cindex++)),
        id = $(node).attr('id'),
        record = registry[type],
        done;
    // xtiger.cross.log('debug', 'create command "' + type + '"' + ' on target "' + key + '"');
    if (record) {
      if (record.check) {
        if ($axel.command.getEditor(key)) { // checks editor existence
            if (node.disabled) { // activates trigger
              node.disabled = false;
            }
            done = new registry[type].factory(key, node, doc); // command constructor should register to trigger event
        } else {
          node.disabled = true; // unactivates trigger
          $axel.error('Missing or invalid data-target attribute in ' + type + ' command ("' + key + '")');
        }
      } else {
        done = new registry[type].factory(key, node, doc); // command constructor should register to trigger event
      }
      if (done && id) { // stores command for getCommand
        if (! commands[id]) {
          commands[id] = {};
        }
        commands[id][type] = done;
      }
    } else {
      $axel.error('Attempt to create an unkown command "' + type + '"');
    }
    // xtiger.cross.log('debug', 'created command "' + type + '"' + ' on target "' + key + '"');
  }

  // when sliceStart/sliceEnd is defined installs on a slice
  // works with snapshot since execution may change document tree structure
  function _installCommands ( doc, sliceStart, sliceEnd ) {
    var i, cur, sel,
        start = sliceStart || doc,
        stop = sliceEnd || sliceStart,
        buffer1 = [],
        buffer2 = [],
        accu = [];

    // xtiger.cross.log('debug', 'installing commands ' + (sliceStart ? 'slice mode' :  'document mode'));
    // make a snapshot of nodes with data-template command over a slice or over document body
    sel = sliceStart ? '[data-template]' : '* [data-template]'; // body to avoid head section
    cur = start;
    do {
      $(sel, cur).each( function(index, n) { buffer1.push(n); } );
      cur = sliceStart ? cur.nextSibling : undefined;
    } while (cur && (cur !== sliceEnd) && (stop != sliceStart));

    // make a snapshot of nodes with data-command over a slice or over document body
    sel= '[data-command]';
    cur = start;
    do {
      $(sel, cur).each( 
        function(index, n) {
          var tokens = $(n).attr('data-command');
          if (/\btransform\b/.test(tokens)) {
            if (! $(n).attr('data-template')) {
              buffer1.push(n); // complete implicit editors with explicit ones
            }
          } 
          if (!/^\s*\btransform\b\s*$/.test(tokens)) { // there are other commands too
            buffer2.push(n);
          }
        });
      cur = sliceStart ? cur.nextSibling : undefined;
    } while (cur && (cur !== sliceEnd) && (stop != sliceStart));

    // create editors - FIXME: merge with other commands (?)
    if (_Command.defaults.bundlesPath) {
      for (i = 0; i < buffer1.length; i++) {
        accu.push(_createEditor(buffer1[i], doc));
      }
    } else if (buffer1.length > 0) {
      $axel.error('Cannot start editing because AXEL bundles path is unspecified');
    }

    // create other commands
    for (i = 0; i < buffer2.length; i++) {
      buffer1 = $(buffer2[i]).attr('data-command').split(' ');
      for (cur = 0; cur < buffer1.length; cur++) {
        if (buffer1[cur] !== 'transform') { // avoid creating twice
          _createCommand(buffer2[i], buffer1[cur], doc);
        }
      }
    }

    return accu;
  }

  // exports module
  $axel.command = _Command;
  $axel.command.install = _installCommands;
  $axel.command.addEditor = _addEditor;

  // AXEL extension that rewrites url taking into account special notations :
  // ~/ to inject current location path
  // ^/ to inject data-axel-base base URL (requires a node parameter to look updwards for data-axel-basee)
  // $^ to be replaced with the latest location path segment (could be extended with $^^ for second before the end, etc.)
  // Note that it removes any hash tag or search parameters
  $axel.resolveUrl = function resolveUrl ( url, node ) {
    var res = url, tmp;
    if (url && (url.length > 2)) {
      if (url.charAt(0) === '~' && url.charAt(1) === '/') {
        if ((window.location.href.charAt(window.location.href.length - 1)) !== '/') {
          res = window.location.href.split('#')[0] + '/' + url.substr(2);
        } else {
          res = url.substr(2);
        }
      } else if (url.charAt(0) === '^' && url.charAt(1) === '/') {
        res = ($(node).closest('*[data-axel-base]').attr('data-axel-base') || '/') + url.substr(2);
      }
      if (res.indexOf('$^') !== -1) {
        tmp = window.location.href.split('#')[0].match(/([^\/]+)\/?$/); // FIXME: handle URLs with parameters  
        if (tmp) {
          res = res.replace('$^', tmp[1]);
        }
      }
    }
    return res;
  };

  // document ready handler to install commands (self-transformed documents only)
  jQuery(function() { 
    var script = $('script[data-bundles-path]'),
        path = script.attr('data-bundles-path'),
        when = script.attr('data-when'),
        lang;
    if (path) { // saves 'data-bundles-path' for self-transformable templates
      _Command.configure('bundlesPath', path);
      // FIXME: load sequence ordering issue (?)
      $axel.filter.applyTo({ 'optional' : ['input', 'choice'], 'event' : 'input' });
    }
    // browser language detection
    if (navigator.browserLanguage) {
      lang = navigator.browserLanguage;
    } else {
      lang = navigator.language;
    }
    if (lang) {
      lang = lang.substr(0,2);
      if (xtiger.defaults.locales[lang]) {
        $axel.setLocale(lang);
        xtiger.cross.log('debug','set lang to ' + lang);
      }
    }
    // command(s) installation
    if ('deferred' !== when) {
      _installCommands(document);
    }
  });
}($axel));
