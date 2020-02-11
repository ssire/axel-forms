(function () {
   var appController;
   // Call this method if you did not231 include the style sheet in the document you have transformed to a form
   function injectStyleSheet ( myDoc, url ) {
     var head = myDoc.getElementsByTagName('head')[0];
     if (head) {
       var link = myDoc.createElement('link');
       link.setAttribute('rel','stylesheet');
       link.setAttribute('type', 'text/css');
       link.setAttribute('href', url); 
       head.appendChild(link);
     } else {
       xtiger.cross.log('debug', "cannot inject editor's style sheet because target document has no head section");
     }
   }
   function onTemplateTransformed () {
     var iframeDoc, ed;
     var iframe = document.getElementById('container');
     if (iframe.contentDocument) {
       iframeDoc = iframe.contentDocument;
     } else if (iframe.contentWindow) { // IE7
       iframeDoc = iframe.contentWindow.document;
     }
     if (iframeDoc && ($('script[data-bundles-path]').length === 0)) { // not a self-transformed document
       if (! appController.curForm) { // template with embedded transformation skipped by editor.js
         xtiger.cross.log('debug', 'command installation (post-template transformation)');
         ed = $axel.command.install(iframeDoc);
         if (ed.length >= 1) {
           // TODO: currently manages only 1 AXEL editor per document
           xtiger.cross.log('debug', 'binding installation (post-template transformation)');
           $axel.binding.install(iframeDoc);
           injectStyleSheet(iframeDoc, appController.xttMakeLocalURLFor('../../axel/axel/axel.css'));
           appController.curForm = $axel('#container');
           appController.log('Template with embedded transformation transformed with success', 0);
           appController.activateDocumentCommands();
         } else {
           appController.log('Template with embedded transformation failed, no editor has been generated', 1);
         }
       } else {
         xtiger.cross.log('debug', 'command installation (post-template transformation)');
         appController.curForm.spec = $('#container'); // create a pseudo editor object
         $axel.command.addEditor('container', appController.curForm); // register it to be addressable in data-target 
         // FIXME: pseudo editor object should implement a complete transform.js editor facade and not just spec field 
         // but this is enough to test simple commands and bindings
         ed = $axel.command.install(iframeDoc);
         xtiger.cross.log('debug', 'binding installation (post-template transformation)');
         $axel.binding.install(iframeDoc);
       }
       xtiger.cross.log('debug', "'axel-update' event listener installation");
       $('body', iframeDoc).on('axel-update', function( ev ) { xtiger.cross.log('debug', '[evt] axel-update value="' + ev.value + '"'); });
     } else {
       xtiger.cross.log('debug', 'command and binding installation skipped (self-transformed template) ');
     }
   }
   function initApp () {
     var defaultTemplates = window.getDefaultTemplates ? getDefaultTemplates() : {};
     appController = new document.AxelDemoEditor("../templates/", defaultTemplates);
     appController.configure({
       baseUrl : '../../axel/axel/bundles',
       xtStylesheet : '../../axel/axel/axel.css',
       path2inputDlg : '../../axel/editor/extras/input.html',
       path2dumpDlg : '../../axel/editor/extras/dump.html',
       path2intro : 'intro.xhtml'
     })
     // late filter registration
     $axel.filter.applyTo({ 'optional' : ['input', 'choice'], 'event' : 'input' });
     // Install Hook to install bindings
     $(document).on('__AXEL_DEMO_EDITOR_READY', onTemplateTransformed);
     // configure command for templates with embedded transformation command
     $axel.command.configure('bundlesPath', appController.xttMakeLocalURLFor('../../axel/axel/bundles'))
     appController.run();
   }
   jQuery(function() { initApp(); });
 }());