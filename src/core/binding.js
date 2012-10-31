 /* ***** BEGIN LICENSE BLOCK *****
  *
  * Copyright (C) 2012 S. Sire
  *
  * This file contains files from the AXEL-FORMS extension to the Adaptable XML Editing Library (AXEL)
  * Version @VERSION@
  *
  * AXEL-FORMS is licensed by Oppidoc SARL 
  *
  * Web site : http://www.oppidoc.fr, https://bitbucket.org/ssire/axel-forms
  * 
  * Contributors(s) : S. Sire
  * 
  * ***** END LICENSE BLOCK ***** */
 
/*****************************************************************************\
|                                                                             |
|  AXEL Binding                                                               |
|                                                                             |
|  manages bindings life cycle (registration)                                 |
|  exposed as $axel.binding                                                   |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL                                                |
|                                                                             |
|  Global functions:                                                          |
|    $axel.binding.register                                                   |
|        registers a binding object                                           |
|                                                                             |
\*****************************************************************************/
(function ($axel) {
 
  var registry = {};
  
  function _registerBinding ( name, binding ) {
    registry[name] = binding;
  }
  
  function _installBindings (doc) {
    $('body [data-binding]', doc || document).each( 
      function(index, n) { 
        var el = $(n), 
            name = el.attr('data-binding');
        if (registry[name]) {
          registry[name].init(el, doc);
          xtiger.cross.log('debug', 'installing binding "' + name + '"');  
        } else {
          xtiger.cross.log('error', 'unregistered binding "' + name + '"');
        }
      }
    );
  }
 
 $axel.binding = $axel.binding || {};
 
 // exports functions
 $axel.binding.register = _registerBinding;
 $axel.binding.install = _installBindings;
}($axel));
   
