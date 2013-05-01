/*****************************************************************************\
|                                                                             |
|  'delete' command object                                                    |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor's container                               |
|                                                                             |
|  Optional attributes :                                                      |
|  - data-replace-target                                                      |
|  - data-replace-type                                                        |
|                                                                             |
\*****************************************************************************/

// TODO
// - customize server error decoding for Orbeon 3.8, eXist-DB, etc.

(function () {

  function DeleteCommand ( identifier, node, doc ) {
    this.doc = doc || document;
    this.spec = $(node);
    this.key = identifier;
    this.spec.bind('click', $.proxy(this, 'execute'));
  }

  DeleteCommand.prototype = (function () {

    // FIXME: Factorize
    function isResponseAnOppidumError (xhr) {
      return $('error > message', xhr.responseXML).size() > 0;
    }

    // FIXME: Factorize
    function getOppidumErrorMsg (xhr) {
      var text = $('error > message', xhr.responseXML).text();
      return text || xhr.status;
    }

    // FIXME: Factorize
    // Tries to extract more info from a server error. Returns a basic error message
    // if it fails, otherwise returns an improved message
    // Compatible with eXist 1.4.x server error format
    function getExistErrorMsg (xhr) {
      var text = xhr.responseText, status = xhr.status;
      var msg = 'Error ! Result code : ' + status;
      var details = "";
      var m = text.match('<title>(.*)</title>','m');
      if (m) {
        details = '\n' + m[1];
      }
      m = text.match('<h2>(.*)</h2>','m');
      if (m) {
        details = details + '\n' + m[1];
      } else if ($('div.message', xhr.responseXML).size() > 0) {
        details = details + '\n' + $('div.message', xhr.responseXML).get(0).textContent;
        if ($('div.description', xhr.responseXML).size() > 0) {
          details = details + '\n' + $('div.description', xhr.responseXML).get(0).textContent;
        }
      }
      return msg + details;
    }

    // FIXME: Factorize subparts
    function successCb (response, status, xhr) {
      var loc = xhr.getResponseHeader('Location'),
          type, fnode, newblock;
      if (xhr.status === 200) {
        if (loc) { // implicit data-replace="location" behavior
          window.location.href = loc;
        } else { // implicit data-replace="fragment" behavior
          type = this.spec.attr('data-replace-type') || 'all';
          fnode = $('#' + this.spec.attr('data-replace-target'));
          if (fnode.length > 0) {
            if (type === 'all') {
              newblock =  fnode.replaceWith(xhr.responseText);
            } else if (type === 'swap') {
              if (this.swap) { // confirmation dialog already there
                this.swap.replaceWith(xhr.responseText)
              } else {
                this.swap = $(xhr.responseText); // FIXME: document context ?
                fnode.after(this.swap);
                fnode.hide();
                this.fragment = fnode; // cached to implement followup command returning to initial view
              }
              newblock = this.swap;
            }
            // followup actions protocol
            $('button[data-command="proceed"]', newblock).bind('click', $.proxy(doDelete, this));
            $('button[data-command="cancel"]', newblock).bind('click', $.proxy(doCancel, this));
          } else {
            $axel.command.logError('Bad page design to complete delete action ("data-replace-target" error)');
          }
        }
      } else {
        $axel.command.logError('Unexpected response from server (' + xhr.status + '). Delete action may have failed');
      }
    }

    // FIXME: Factorize subpart
    function errorCb (xhr, status, e) {
      var s;
      if (status === 'timeout') {
        $axel.command.logError("Delete action taking too much time, it has been aborted, however it is possible that the resource has been deleted", this.errTarget);
      } else if (isResponseAnOppidumError(xhr)) {
        // Oppidum may generate 500 Internal error, 400, 401, 404
        $axel.command.logError(getOppidumErrorMsg(xhr), this.errTarget);
      } else if (xhr.responseText.search('Error</title>') !== -1) { // eXist-db error (empirical)
        $axel.command.logError(getExistErrorMsg(xhr), this.errTarget);
      } else if (e) {
        $axel.command.logError('Exception : ' + e.name + ' / ' + e.message + "\n" + ' (line ' + e.lineNumber + ')', this.errTarget);
      } else {
        $axel.command.logError('Error while talking to server (' + xhr.status + ')', this.errTarget);
      }
    }

    // Send delete request to server
    function doDelete () {
      var url, editor = $axel.command.getEditor(this.key);
      if (editor) {
        url = editor.attr('data-src'); // delete resource loaded into editor
        $.ajax({
          url : url,
          type : 'delete',
          cache : false,
          timeout : 10000,
          success : $.proxy(successCb, this),
          error : $.proxy(errorCb, this)
        });
        
      }
    }

    // Cancel delete, redisplays original fragment (usually the editor)
    function doCancel () {
      if (this.swap) {
        this.swap.remove();
        delete this.swap;
      }
      if (this.fragment) {
        this.fragment.show();
      }
    }

    return {
      // TODO: directly delete when 'data-confirm-action' missing !
      execute : function (event) {
        var url, editor = $axel.command.getEditor(this.key);
        if (editor) {
          url = editor.attr('data-src');
          if (url) {
            if (! /\/$/.test(url)) {
              url  += '/';
            }
            // pre-flight request obtained from adding : FIXME: data-preflight-action ? 
            url += (this.spec.attr('data-confirm-action') || 'delete');
            $.ajax({
              url : url,
              type : 'get',
              cache : false,
              timeout : 10000,
              success : $.proxy(successCb, this),
              error : $.proxy(errorCb, this)
            });
          } else {
            $axel.command.logError('Missing "data-src" parameter on the editor');
          }
        }
      }
    };
  }());

  $axel.command.register('delete', DeleteCommand, { check : true });
}());