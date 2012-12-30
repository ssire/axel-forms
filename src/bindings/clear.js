/*****************************************************************************\
|                                                                             |
|  AXEL 'select' binding                                                      |
|                                                                             |
|  Turns checked property of target editors to true (iff target is enabled)   |
|  Applies to AXEL 'input' plugin of 'checkbox' type                          |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
|  TODO: find a way to track duplicate / paste / cut / remove / load events   |
|        to recompute the controls state to hide / display the trigger        |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var _Clear = {

    onInstall : function ( host ) {
      var trigger = $('[data-clear="' + this.getVariable() + '"]', this.getDocument());
      this.editors = $axel(host);
      this.ui = trigger;
      trigger.bind('click', $.proxy(this, 'execute'));
      host.bind('axel-update', $.proxy(this, 'update'));
      host.bind('axel-select-all', $.proxy(this, 'update'));
      trigger.hide();
    },

    methods : {
      execute : function  () {
        this.editors.clear(false);
        this.ui.hide();
      },
      update : function  () {
        var content = this.editors.text();
        if (content.length > 0) {
          this.ui.show();
        } else {
          this.ui.hide();
        }
      }
    }
  };

  $axel.binding.register('clear',
    null, // options
    null, // parameters
    _Clear
  );

}($axel));
