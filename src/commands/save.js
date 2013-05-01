/*****************************************************************************\
|                                                                             |
|  'save' command object (XML submission with Ajax a form)                    |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor's container                               |
|                                                                             |
|  Optional attributes :                                                      |
|  - data-validation-output (on the target editor): identifier of a target    |
|    element to use as a container for showing validation error messages,     |
|    the presence of this attributes causes validation                        |
|                                                                             |
\*****************************************************************************/

// TODO
// - customize server error decoding for Orbeon 3.8, eXist-DB, etc.

(function () {

  function SaveCommand ( identifier, node, doc ) {
    this.doc = doc || document;
    this.spec = $(node);
    this.key = identifier;
    this.spec.bind('click', $.proxy(this, 'execute'));
  }

  SaveCommand.prototype = (function () {

    function isResponseAnOppidumError (xhr) {
      return $('error > message', xhr.responseXML).size() > 0;
    }

    function getOppidumErrorMsg (xhr) {
      var text = $('error > message', xhr.responseXML).text();
      return text || xhr.status;
    }
    
    function doSwap () {
      this.swap.remove();
      this.fragment.show();
    }

    function doReset () {
      var editor = $axel.command.getEditor(this.key);
      if (editor) {
        editor.reset();
        this.swap.remove();
        this.fragment.show();
      } else {
        $axel.command.logError('Cannot find the document editor to reset', this.errTarget);
      }
    }

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

    function saveSuccessCb (response, status, xhr) {
      var loc = xhr.getResponseHeader('Location'),
          type, fnode;
      if (xhr.status === 201) {
        if (loc) { // implicit data-replace="location" behavior
          window.location.href = loc;
        } else { // implicit data-replace="fragment" behavior
          type = this.spec.attr('data-replace-type') || 'all';
          fnode = $('#' + this.spec.attr('data-replace-target'));
          if (fnode.length > 0) {
            if (type === 'all') {
              fnode.replaceWith(xhr.responseText);
            } else if (type === 'swap') {
              this.swap = $(xhr.responseText); // FIXME: document context ?
              fnode.after(this.swap);
              fnode.hide();
              this.fragment = fnode; // cached to implement data-command="continue"
              $('button[data-command="continue"]', this.swap).bind('click', $.proxy(doSwap, this));
              $('button[data-command="reset"]', this.swap).bind('click', $.proxy(doReset, this));
            } // FIXME: implement other types like before|after|prepend|append
          } else {
            xtiger.cross.log('error', 'missing "data-replace-target" attribute to report "save" command success');
          }
        }
      } else {
        $axel.command.logError('Unexpected response from server (' + xhr.status + '). Save action may have failed', this.errTarget);
      }
    }

    function saveErrorCb (xhr, status, e) {
      var s;
      if (status === 'timeout') {
        $axel.command.logError("Save action taking too much time, it has been aborted, however it is possible that your page has been saved", this.errTarget);
      } else if (xhr.status === 409) { // 409 (Conflict)
        s = xhr.getResponseHeader('Location');
        if (s) {
          window.location.href = s;
        } else {
          $axel.command.logError(getOppidumErrorMsg(xhr), this.errTarget);
        }
      } else if (isResponseAnOppidumError(xhr)) {
        // Oppidum may generate 500 Internal error, 400, 401, 404
        $axel.command.logError(getOppidumErrorMsg(xhr), this.errTarget);
      } else if (xhr.responseText.search('Error</title>') !== -1) { // eXist-db error (empirical)
        $axel.command.logError(getExistErrorMsg(xhr), this.errTarget);
      } else if (e) {
        $axel.command.logError('Exception : ' + e.name + ' / ' + e.message + "\n" + ' (line ' + e.lineNumber + ')', this.errTarget);
      } else {
        $axel.command.logError('Error while connecting to "' + this.url + '" (' + xhr.status + ')', this.errTarget);
      }
    }

    return {
      execute : function (event) {
        var editor = $axel.command.getEditor(this.key),
            valid = true, method, dataUrl, transaction, data, errtarget, fields;
        if (editor) {
          url = editor.attr('data-src') || this.spec.attr('data-src') || '.'; // last case to create a new page in a collection
          if (url) {
            if (editor.attr('data-validation-output')) {
              fields = $axel(editor.spec.get(0)); // FIXME: define editor.getRoot()
              valid = $axel.binding.validate(fields, editor.attr('data-validation-output'), this.doc, editor.attr('data-validation-label'));
            }
            if (valid) {
              data = editor.serializeData();
              if (data) {
                method = editor.attr('data-method') || this.spec.attr('data-method') || 'post';
                transaction = editor.attr('data-transaction') || this.spec.attr('data-transaction');
                if (transaction) {
                  url = url + '?transaction=' + transaction;
                }
                $.ajax({
                  url : url,
                  type : method,
                  data : data,
                  dataType : 'xml',
                  cache : false,
                  timeout : 10000,
                  contentType : "application/xml; charset=UTF-8",
                  success : $.proxy(saveSuccessCb, this),
                  error : $.proxy(saveErrorCb, this)
                  });
                  editor.hasBeenSaved = true; // trick to cancel the "cancel" transaction handler
                  // FIXME: shouldn't we disable the button while saving ?
              } else {
                $axel.command.logError('The editor did not generate any data');
              }
            }
          } else {
            $axel.command.logError('The command does not know where to send the data');
          }
        } else {
          $axel.command.logError('There is no editor associated with this command');
        }
      }
    };
  }());

  $axel.command.register('save', SaveCommand, { check : true });
}());