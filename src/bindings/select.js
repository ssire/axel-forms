/*****************************************************************************\
|                                                                             |
|  AXEL 'select' binding                                                      |
|                                                                             |
|  Turns checked property of target editors to true (iff target is enabled)   |
|  Applies to AXEL 'input' plugin with type to checkbox                       |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var _Select = {

    onInstall : function ( host ) {
      this.host = host;
      this.editors = $axel(host);
      $('[data-select="' + this.getVariable() + '"]', this.getDocument()).on('click', $.proxy(this, 'execute'));
    },

    methods : {
      execute : function  () {
        // FIXME: we should use the editor's API to change it's state instead
        this.editors.apply(function(n){ if (! n.disabled) { n.checked = true}}, true);
        $(this.host).triggerHandler('axel-select-all', [this]);
      }
    }
  };

  $axel.binding.register('select',
    null, // options
    null, // parameters
    _Select
  );

}($axel));
