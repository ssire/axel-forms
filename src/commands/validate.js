/*****************************************************************************\
|                                                                             |
|  'validate' command object                                                  |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor's container to validate                   |
|  - data-validation: id of the DOM node where to display errors              |
|                                                                             |
\*****************************************************************************/

// TODO
// - customize server error decoding for Orbeon 3.8, eXist-DB, etc.

(function () {

  function ValidateCommand ( identifier, host, doc ) {
    var jhost = $(host);
    this.doc = doc;
    this.key = identifier;
    this.errid = jhost.attr('data-validation-output'); // FIXME: this.getParam('validate-output') (search param on host then on editor)
    this.cssrule = jhost.attr('data-validation-label');
    if (this.errid) {
      jhost.bind('click', $.proxy(this, 'execute'));
    } else {
      xtiger.cross.log('error', 'Missing "data-validation-output" attribute in "validation" command');
    }
  }

  ValidateCommand.prototype =  {
    
    execute : function (event) {
      var err, editor = $axel.command.getEditor(this.key);
      if (editor) {
        fields = $axel(editor.spec.get(0)); // FIXME: define editor.getRoot()
        $axel.binding.validate(fields, this.errid, this.doc, this.cssrule);
      }
    }
  };

  $axel.command.register('validate', ValidateCommand, { check : true });
}());