/*****************************************************************************\
|                                                                             |
|  'save' command object (XML submission with Ajax a form)                    |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor's container to generate submission data   |
|                                                                             |
|  Optional attributes :                                                      |
|  - data-replace-type : defines what to do with the servers's response       |
|    value is 'event' and/or a choice of 'all', 'swap', 'append', 'prepend'   |
|  - data-event-target : when data-replace-type is 'event' this attribute     |
|    gives the name of a second editor from which to trigger a copy cat of    |
|    'axel-save-done' event (e.g. to trigger refresh content)                 |
|  - data-validation-output (on the target editor): identifier of a target    |
|    element to use as a container for showing validation error messages,     |
|    the presence of this attribute causes validation                         |
|                                                                             |
|  HTTP Responses :                                                           |
|  - redirection with Location header                                         |
|  - <success> with <message>, <payload> and /or <forward> elements           |
|  - <error> with <message> in case of server-side error                      |
|                                                                             |
\*****************************************************************************/

(function () {
  
  function SaveCommand ( identifier, node, doc ) {
    this.doc = doc || document;
    this.spec = $(node);
    this.key = identifier;
    this.spec.on('click', $.proxy(this, 'execute'));
  }
  
  SaveCommand.prototype = (function () {

    // Implements data-replace-type feedback from ajax response
    function doIncUpdate ( type, xhr ) {
      var content;
      if (/all|swap|append|prepend/.test(type)) { // incremental update
        content = $axel.oppidum.unmarshalPayload(xhr);
        fnode = $('#' + this.spec.attr('data-replace-target'));
        if (fnode.length > 0) {
          if (type.indexOf('all') !== -1) {
            fnode.replaceWith(content);
          } else if (type.indexOf('swap') !== -1) {
            this.swap = $(content); // FIXME: document context ?
            fnode.after(this.swap);
            fnode.hide();
            this.fragment = fnode; // cached to implement data-command="continue"
            $('button[data-command="continue"]', this.swap).on('click', $.proxy(doSwap, this));
            $('button[data-command="reset"]', this.swap).on('click', $.proxy(doReset, this));
          } else if (type.indexOf('append') !== -1) {
            fnode.append(content);
          } else if (type.indexOf('prepend') !== -1) {
            fnode.prepend(content);
          } 
          // TBD: before, after
        } else { 
          xtiger.cross.log('error', 'missing "data-replace-target" attribute to report "save" command success');
        }
      }
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
        $axel.error(xtiger.util.getLocaleString("editorNotFound"));
      }
    }

    function saveSuccessCb (response, status, xhr, memo) {
      var type, msg, tmp, proceed, cmd;

      // 1) middle of transactional protocol
      if ((xhr.status === 202) && memo) {
        cmd = $axel.oppidum.getCommand(xhr);
        proceed = confirm($axel.oppidum.decodeMessage(cmd));
        if (memo.url.indexOf('?') !== -1) {
          tmp = memo.url + '&_confirmed=1';
        } else {
          tmp = memo.url + '?_confirmed=1';
        }
        if (proceed) {
          $.ajax({
            url : tmp,
            type : memo.method,
            data :  memo.payload,
            cache : false,
            timeout : 50000,
            dataType : 'xml',
            contentType : "application/xml; charset=UTF-8",
            success : $.proxy(saveSuccessCb, this),
            error : $.proxy(saveErrorCb, this)
          });
          return; // short-circuit final call to finished
        } else {
          $axel.command.getEditor(this.key).trigger('axel-save-cancel', this, xhr);
        }

      // 2) direct response or end of transactionnal protocol
      } else if ((xhr.status === 201) || (xhr.status === 200)) {
        cmd = $axel.oppidum.getCommand(xhr);
        if ($axel.oppidum.filterRedirection(cmd)) { // in page feedback
          $axel.oppidum.handleMessage(cmd); // <message> feedback
          // <payload> feedback
          type = this.spec.attr('data-replace-type') || 'all';
          doIncUpdate.call(this, type, xhr);
          // 'axel-save-done' event dispatch
          $axel.command.getEditor(this.key).trigger('axel-save-done', this, xhr);
          if (type.indexOf('event') !== -1) { // optional secondary target editor
            // FIXME: adjust editor's trigger method to add arguments... (e.g. event payload ?)
            tmp = this.spec.attr('data-event-target');
            if (tmp) {
              tmp = $axel.command.getEditor(tmp);
              if (tmp) {
                tmp.trigger('axel-save-done', this, xhr);
              }
            }
          }
        }

      // 3) untrapped server-side error or wrong Ajax protocol error
      } else {
        $axel.error(xtiger.util.getLocaleString('errServerResponse', { 'xhr' : xhr }));
        $axel.command.getEditor(this.key).trigger('axel-save-error', this, xhr);
      }

      // 4) re-enable 'save' command
      finished(this);
      
      if (cmd) {
        $axel.oppidum.handleForward(cmd); // <forward> feedback
      }
    }

    function saveErrorCb (xhr, status, e) {
      var msg,
          flags = this.spec.attr('data-save-flags');
      if ((!flags) || flags.indexOf('silentErrors') === -1) {
        msg = $axel.oppidum.parseError(xhr, status, e);
        $axel.error(msg);
      } else {
        this.spec.trigger('axel-network-error', { xhr : xhr, status : status, e : e });
      }
      $axel.command.getEditor(this.key).trigger('axel-save-error', this, xhr);
      finished(this);
    }

    function started (that) {
      var flags = that.spec.attr('data-save-flags');
      if (flags && flags.indexOf('disableOnSave') != -1) {
        that.spec.attr('disabled', 'disable');
      }
      that.spec.addClass('axel-save-running');
    }

    function finished (that) {
      var flags = that.spec.attr('data-save-flags');
      if (flags && flags.indexOf('disableOnSave') != -1) {
        that.spec.prop('disabled', false);
      }
      that.spec.removeClass('axel-save-running');
    }

    return {
      execute : function (event) {
        var method, dataUrl, transaction, data, fields, _successCb, _memo,
            _this = this,
            valid = true,
            editor = $axel.command.getEditor(this.key),
            yesNo = this.spec.attr('data-save-confirm'),
            type = this.spec.attr('data-type');
        if (editor) {
          if (!yesNo || confirm(yesNo)) {
            url = this.spec.attr('data-src') || editor.attr('data-src') || '.'; // last case to create a new page in a collection
            if (url) {
              if (editor.attr('data-validation-output') || this.spec.attr('data-validation-output')) {
                fields = $axel(editor.spec.get(0)); // FIXME: define editor.getRoot()
                valid = $axel.binding.validate(fields,
                  editor.attr('data-validation-output')  || this.spec.attr('data-validation-output'),
                  this.doc, editor.attr('data-validation-label')  || this.spec.attr('data-validation-label'),
                  editor.attr('data-no-validation-inside')  || this.spec.attr('data-no-validation-inside'));
              }
              if (valid) {
                data = editor.serializeData();
                if (data) {
                  method = editor.attr('data-method') || this.spec.attr('data-method') || 'post';
                  transaction = editor.attr('data-transaction') || this.spec.attr('data-transaction');
                  if (transaction) {
                    url = url + '?transaction=' + transaction;
                  }
                  url = $axel.resolveUrl(url, this.spec.get(0));
                  started(this);
                  $axel.command.getEditor(this.key).trigger('axel-save', this);
                  _memo = { url : url, payload : data, method : method };
                  _successCb = function (data, textStats, jqXHR) {
                                 saveSuccessCb.call(_this, data, textStats, jqXHR, _memo);
                               };
                  $.ajax({
                    url : url,
                    type : method,
                    data : data,
                    dataType : type || 'xml', // FIXME: _memo
                    cache : false,
                    timeout : 50000,
                    contentType : "application/xml; charset=UTF-8",
                    success : _successCb,
                    error : $.proxy(saveErrorCb, this)
                    });
                    editor.hasBeenSaved = true; // trick to cancel the "cancel" transaction handler
                } else {
                  $axel.error(xtiger.util.getLocaleString("editorEmpty"));
                }
              }
            } else {
              $axel.error(xtiger.util.getLocaleString("noTargetURL"));
            }
          }
        } else {
          $axel.error(xtiger.util.getLocaleString("editorNotFound"));
        }
      }
    };
  }());

  $axel.command.register('save', SaveCommand, { check : false });
}());
