/*****************************************************************************\
|                                                                             |
|  'add' command object                                                       |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor where to send the event                   |
|  - data-trigger-event : event name to propagate                             |
|                                                                             |
\*****************************************************************************/
(function () {
  function AddCommand ( identifier, node ) {
    this.spec = $(node);
    this.key = identifier;
    this.spec.bind('click', $.proxy(this, 'execute'));
    $('#' + identifier).bind('axel-cancel-edit', $.proxy(this, 'dismiss'));
    $('#' + identifier).bind('axel-save-done', $.proxy(this, 'saved'));
  }
  AddCommand.prototype = {
    execute : function (event) {
      if (!this.done) {
        $axel.command.getEditor(this.key).transform();
      } else if (this.cleanOnShow) {
        $axel.command.getEditor(this.key).reset();
        this.cleanOnShow = false;
      }
      if ($axel('#' + this.key).transformed()) { // assumes synchronous transform()
        this.done = true;
        this.spec.hide();
        $('#' + this.spec.attr('data-target-ui')).show();
      }
    },
    dismiss : function (event) {
      this.spec.show();
      $('#' + this.spec.attr('data-target-ui')).hide();
    },
    saved : function (event) {
      this.dismiss();
      this.cleanOnShow = true;
    }
  };
  $axel.command.register('add', AddCommand, { check : true });
}());
