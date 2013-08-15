/*****************************************************************************\
|                                                                             |
|  'trigger' command object                                                   |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor where to send the event                   |
|  - data-trigger-event : event name to propagate                             |
|                                                                             |
\*****************************************************************************/
(function () {
  function TriggerCommand ( identifier, node ) {
    this.spec = $(node);
    this.key = identifier;
    this.spec.bind('click', $.proxy(this, 'execute'));
  }

  TriggerCommand.prototype = {
    execute : function (event) {
      $axel.command.getEditor(this.key).trigger(this.spec.attr('data-trigger-event'), this);
    }
  };

  $axel.command.register('trigger', TriggerCommand, { check : true });
}());
