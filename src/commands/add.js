/*****************************************************************************\
|                                                                             |
|  'add' command object                                                       |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor where to send the event                   |
|                                                                             |
|  Then choose one of the two editing modes below :                           |
|  - data-target-ui : id of the div to show when editing                      |
|   (and to hide when not editing)                                            |
|  - data-target-modal : id of the (Bootstrap) modal window to use for        |
|    editing                                                                  |
|                                                                             |
|  Optional attribute :                                                       |
|  - data-src : url of the controller where to send the edited data           |
|   use this if the target editor's data-src is not pre-defined               |
|  - data-edit-action (create | update) : when using data-src this mandatory  |
|   attribute defines if the data-src attribute must be pre-loaded (update)   |
|   or not (create)                                                           |
|  - data-add-key="xxx" : works in conjunction with data-title-scope          |
|    to locate data-when-{xxx} and change an optional editor's window title   |
|                                                                             |
\*****************************************************************************/
(function () {
  function AddCommand ( identifier, node ) {
    this.spec = $(node);
    this.key = identifier;
    this.spec.on('click', $.proxy(this, 'execute'));
    $('#' + identifier).on('axel-cancel-edit', $.proxy(this, 'dismiss'));
    $('#' + identifier).on('axel-save-done', $.proxy(this, 'saved'));
  }
  AddCommand.prototype = {
    execute : function (event) {
      var dial, tmp, title,
          ed = $axel.command.getEditor(this.key),
          action = this.spec.attr('data-edit-action');
      if (action) {
        if (action === 'update') {
          ed.attr('data-src', this.spec.attr('data-src')); // preload XML data
        } else if (action === 'create') {
          ed.attr('data-src', ''); // to prevent XML data loading
        }
      }
      if (!this.done || !ed.getDefaultTemplate()) { // most probably a shared editor
        // resolves optional data-with-template relatively to command button host else falls back to 'transform' data-template
        tmp = this.spec.attr('data-with-template');
        ed.transform(tmp ? $axel.resolveUrl(tmp, this.spec.get(0)) : undefined ); 
      } else if (this.cleanOnShow) {
        ed.reset();
        this.cleanOnShow = false;
      }
      // try to change editor's title using a mode key
      tmp = this.spec.attr('data-add-key');
      if (tmp) {
        tmp = 'data-when-' + tmp;
        title = $('#' + this.spec.attr('data-title-scope')).find('[' + tmp + ']');
        title.text(title.attr(tmp));
      }
      if ($axel('#' + this.key).transformed()) { // assumes synchronous transform()
        this.done = true;
        dial = this.spec.attr('data-target-modal');
        if (action === 'create') {
          ed.attr('data-src', this.spec.attr('data-src'));
        }
        if (dial) {
          $('#' + dial).modal('show').one('hidden', $.proxy(this, 'hidden'));
          this.spec.get(0).disabled = true;
        } else {
          $('#' + this.spec.attr('data-target-ui')).show();
          this.spec.hide();
        }
      }
    },
    dismiss : function (event) {
      var dial;
      dial = this.spec.attr('data-target-modal');
      if (dial) {
        $('#' + dial).modal('hide');
      } else {
        $('#' + this.spec.attr('data-target-ui')).hide();
        this.spec.show();
      }
    },
    saved : function (event) {
      this.dismiss();
      this.cleanOnShow = true;
    },
    hidden : function () { // modal hidden
      this.spec.get(0).disabled = false;
    }
  };
  $axel.command.register('add', AddCommand, { check : true });
}());
