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
                this.swap.replaceWith(xhr.responseText);
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
            $axel.error('Bad page design to complete delete action ("data-replace-target" error)');
          }
        }
      } else {
        $axel.error(xtiger.util.getLocaleString('errServerResponse', { 'xhr' : xhr }));
      }
    }

    function errorCb (xhr, status, e) {
      var msg = $axel.oppidum.parseError(xhr, status, e);
      $axel.error(msg);
    }

    // Send delete request to server
    function doDelete () {
      var url,
          action,
          editor = $axel.command.getEditor(this.key),
          req = {
            cache : false,
            timeout : 10000,
            success : $.proxy(successCb, this),
            error : $.proxy(errorCb, this)
            };
          
      if (editor) {
        url = editor.attr('data-src'); // delete resource loaded into editor
        action = this.spec.attr('data-delete-action');
        if (action) { // HTTP DELETE verb simulated with POST
          if (! /\/$/.test(url)) {
            url  += '/';
          }
          req.url = url + action;
          req.type = 'post';
          req.data =  { '_delete' : 1 };
        } else { // HTTP DELETE verb
          req.url = url;
          req.type = 'delete';
        }
        $.ajax(req);
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
            $axel.error('Missing "data-src" parameter on the editor');
          }
        }
      }
    };
  }());

  $axel.command.register('delete', DeleteCommand, { check : true });
}());