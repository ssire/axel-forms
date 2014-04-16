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
  var editors = {}; //

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
      }
  };

  // Creates 'transform' commands, note that implicit ones
  // (i.e. w/o an associated data-command='transform') will immediately generate an editor
  function _createEditor (node, doc) {
    var key = $(node).attr('id') || ('untitled' + (sindex++)),
        res = new registry['transform'].factory(key, node, doc);
    xtiger.cross.log('debug','registering editor "' + key + '"' );
    editors[key] = res;
    return res;
  }

  // Creates a new command from a DOM node
  // FIXME: data-command='template' exception (exclusion or handle it properly)
  function _createCommand (node, doc) {
    var type = $(node).attr('data-command'), // e.g. 'save', 'submit'
        key =  $(node).attr('data-target') || ('untitled' + (cindex++)),
        record = registry[type];
    // xtiger.cross.log('debug', 'create command "' + type + '"' + ' on target "' + key + '"');
    if (record) {
      if (record.check) {
        if ($axel.command.getEditor(key)) { // checks editor existence
            if (node.disabled) { // activates trigger
              node.disabled = false;
            }
            new registry[type].factory(key, node, doc); // command constructor should register to trigger event
        } else {
          node.disabled = true; // unactivates trigger
          $axel.error('Missing or invalid data-target attribute in ' + type + ' command ("' + key + '")');
        }
      } else {
        new registry[type].factory(key, node, doc); // command constructor should register to trigger event
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
          if ($(n).attr('data-command') !== 'transform') {
            buffer2.push(n);
          } else if (! $(n).attr('data-template')) {
            buffer1.push(n);
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
      _createCommand(buffer2[i], doc);
    }

    return accu;
  }

  // exports module
  $axel.command = _Command;
  $axel.command.install = _installCommands;
  
  // AXEL extension (FIXME: definitive API ?)
  $axel.resolveUrl = function resolveUrl ( url ) {
    if (url.length > 2 && url.charAt(0) === '~' && url.charAt(1) === '/') {
      if ((window.location.href.charAt(window.location.href.length - 1)) !== '/') {
        return window.location.href + '/' + url.substr(2);
      } else {
        return url.substr(2);
      }
    }
    return url;
  };

  // document ready handler to install commands (self-transformed documents only)
  jQuery(function() { 
    var path = $('script[data-bundles-path]').attr('data-bundles-path');
    if (path) { // saves 'data-bundles-path' for self-transformable templates
      _Command.configure('bundlesPath', path);
      // FIXME: load sequence ordering issue (?)
      $axel.filter.applyTo({ 'optional' : ['input', 'choice'], 'event' : 'input' });
    }
    _installCommands(document); 
    });
}($axel));
