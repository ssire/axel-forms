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
|  - data-replace-type : defines what to do with the servers's response       |
|  - data-event-target : when data-replace-type is 'event' this attribute     |
|    gives the name of a second editor from which to trigger a copy cat of    |
|    'axel-save-done' event                                                   |
|  - data-validation-output (on the target editor): identifier of a target    |
|    element to use as a container for showing validation error messages,     |
|    the presence of this attribute causes validation                         |
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

    function unmarshalMessage( xhr ) {
      var text = $('success > message', xhr.responseXML).text();
      return text;
    }
    
    function unmarshalPayload( xhr ) {
      var start = xhr.responseText.indexOf('<payload>'),
          end,
          res = xhr.responseText;
      if (start != -1) {
        end = xhr.responseText.indexOf('</payload>');
        if (end != -1) {
          res = xhr.responseText.substr(start + 9, end - start - 9) ;
        }
      }
      return res;
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
        $axel.error('Cannot find the document editor to reset', this.errTarget);
      }
    }

    function saveSuccessCb (response, status, xhr, memo) {
      var loc = xhr.getResponseHeader('Location'),
          type, fnode, msg, tmp, proceed;
      if ((xhr.status === 202) && memo) { // middle of transactional protocol FIXME: success -> confirm
        proceed = confirm($('success > message', xhr.responseXML).text());
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
        } else {
          $axel.command.getEditor(this.key).trigger('axel-save-cancel', this, xhr);
        }
      } else if ((xhr.status === 201) || (xhr.status === 200)) {
        if (loc) {
          window.location.href = loc;
        } else {
          msg = unmarshalMessage(xhr); // side effect message
          if (msg) {
            alert(msg); // FIXME: use a reporting function !!!
          }
          type = this.spec.attr('data-replace-type') || 'all';
          if (type === 'event') {
            // FIXME: adjust editor's trigger method to add arguments...
            // FIXME: pass xhr.responseXML.getElementsByTagName("payload")[0] instead of xhr ?
            $axel.command.getEditor(this.key).trigger('axel-save-done', this, xhr);
            tmp = this.spec.attr('data-event-target');
            if (tmp) {
              tmp = $axel.command.getEditor(tmp);
              if (tmp) {
                tmp.trigger('axel-save-done', this, xhr);
              }
            }
          } else {
            fnode = $('#' + this.spec.attr('data-replace-target'));
            if (fnode.length > 0) {
              if (type === 'all') {
                fnode.replaceWith(unmarshalPayload(xhr));
              } else if (type === 'swap') {
                this.swap = $(unmarshalPayload(xhr)); // FIXME: document context ?
                fnode.after(this.swap);
                fnode.hide();
                this.fragment = fnode; // cached to implement data-command="continue"
                $('button[data-command="continue"]', this.swap).bind('click', $.proxy(doSwap, this));
                $('button[data-command="reset"]', this.swap).bind('click', $.proxy(doReset, this));
              } else if (type === 'append') {
                fnode.append(unmarshalPayload(xhr));
              } else if (type === 'prepend') {
                fnode.prepend(unmarshalPayload(xhr));
              } // 'before', 'after'
              $axel.command.getEditor(this.key).trigger('axel-save-done', this, xhr);
            } else {
              xtiger.cross.log('error', 'missing "data-replace-target" attribute to report "save" command success');
            }
          }
        }
      } else {
        $axel.error('Unexpected response from server (' + xhr.status + '). Save action may have failed', this.errTarget);
        $axel.command.getEditor(this.key).trigger('axel-save-error', this, xhr);
      }
      finished(this);
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
        that.spec.removeAttr('disabled');
      }
      that.spec.removeClass('axel-save-running');
    }

    return {
      execute : function (event) {
        var method, dataUrl, transaction, data, errtarget, fields, _successCb, _memo,
            _this = this,
            valid = true,
            editor = $axel.command.getEditor(this.key),
            yesNo = this.spec.attr('data-save-confirm');
        if (editor) {
          if (!yesNo || confirm(yesNo)) {
            url = this.spec.attr('data-src') || editor.attr('data-src') || '.'; // last case to create a new page in a collection
            if (url) {
              if (editor.attr('data-validation-output') || this.spec.attr('data-validation-output')) {
                fields = $axel(editor.spec.get(0)); // FIXME: define editor.getRoot()
                valid = $axel.binding.validate(fields,
                  editor.attr('data-validation-output')  || this.spec.attr('data-validation-output'),
                  this.doc, editor.attr('data-validation-label')  || this.spec.attr('data-validation-label'));
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
                    dataType : 'xml',
                    cache : false,
                    timeout : 50000,
                    contentType : "application/xml; charset=UTF-8",
                    success : _successCb,
                    error : $.proxy(saveErrorCb, this)
                    });
                    editor.hasBeenSaved = true; // trick to cancel the "cancel" transaction handler
                } else {
                  $axel.error('The editor did not generate any data');
                }
              }
            } else {
              $axel.error('The command does not know where to send the data');
            }
          }
        } else {
          $axel.error('There is no editor associated with this command');
        }
      }
    };
  }());

  $axel.command.register('save', SaveCommand, { check : false });
}());
