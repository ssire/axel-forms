/*****************************************************************************\
|                                                                             |
|  'submit' command object (XML submission through a form)                    |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor's container                               |
|  - data-form : id of the form to use for submission to the serevr           |
|                                                                             |
\*****************************************************************************/
(function () {

  function SubmitCommand ( identifier, node ) {
    var spec = $(node);
    this.key = identifier; /* data-target */
    this.formid = spec.attr('data-form');
    if (this.formid && ($('form#' + this.formid).length > 0)) { // checks form element existence
      node.disabled = false;
      spec.on('click', $.proxy(this, 'execute'));
    } else {
      node.disabled = true;
      $axel.error('Missing or invalid data-form attribute in submit command ("' + this.formid + '")');
    }
  }

  SubmitCommand.prototype = {
    // Saves using a pre-defined form element identified by its id
    // using a 'data' input field (both must be defined)
    // Note in that case there is no success/error feedback
    execute : function () {
      var f = $('#' + this.formid),
          d = $('#' + this.formid + ' > input[name="data"]' ),
          editor = $axel.command.getEditor(this.key);
      if (editor && (f.length > 0) && (d.length > 0)) {
        d.val(editor.serializeData());
        f.submit();
      } else {
        $axel.error('Missing editor or malformed form element to submit data');
      }
    }
  };

  $axel.command.register('submit', SubmitCommand, { check : true });
}());