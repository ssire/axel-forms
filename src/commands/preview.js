/*****************************************************************************\
|                                                                             |
|  'preview' command object                                                   |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - none : currently the command is targeted at all the editors through      |
|    the body tag                                                             |
|                                                                             |
\*****************************************************************************/
(function () {  
  function PreviewCommand ( identifier, node ) {
    var spec = $(node);
    this.label = {
      'preview' : spec.attr('data-preview-label') || spec.text(),
      'edit' : spec.attr('data-edit-label') || 'Edit'
    };
    spec.on('click', $.proxy(this, 'execute'));
  }
  
  PreviewCommand.prototype = {
    execute : function (event) {
      var body = $('body'),
          gotoPreview = ! body.hasClass('preview');
      $(event.target).text(this.label[gotoPreview ? 'edit' : 'preview']);
      body.toggleClass('preview', gotoPreview);
    }
  };
  
  $axel.command.register('preview', PreviewCommand);
}());