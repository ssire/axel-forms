/*****************************************************************************\
|                                                                             |
|  'reset' command object                                                     |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor's container                               |
|                                                                             |
\*****************************************************************************/

// TODO :
// currently this does not work if the data-target editor has been generated
// from the document itself (i.e. data-template="#")

(function () {
  
  function ResetCommand ( identifier, node ) {
    this.key = identifier; /* data-target */
    $(node).bind('click', $.proxy(this, 'execute'));
  }
  
  ResetCommand.prototype = {
    execute : function (event) {
      var verr, editor = $axel.command.getEditor(this.key);
      if (editor) {
        editor.reset();
        verr = editor.attr('data-validation-output'); // FIXME: document ?
        if (verr) {
          $('#' + verr).removeClass('af-validation-failed');
        }
      }
    }
  };
  
  $axel.command.register('reset', ResetCommand, { check : true });
}());