/*****************************************************************************\
|                                                                             |
|  AXEL 'condition' binding                                                   |
|                                                                             |
|  Implements data-avoid-{variable} to disable fields on given data values    |
|  Applies to AXEL 'input' plugin                                             |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var _Condition = {

    onInstall : function ( host ) {
      this.avoidstr = 'data-avoid-' + this.getVariable();
      this.editor = $axel(host);
      host.bind('axel-update', $.proxy(this.updateConditionals, this));
    },

    methods : {

      updateConditionals : function  (ev, editor) {
        var curval = this.editor.text();
        var fullset = $('body [' + this.avoidstr + ']', this.getDocument());
        var onset = fullset.not('[' + this.avoidstr + '*=' + curval + ']');
        var offset = fullset.filter('[' + this.avoidstr + '*=' + curval + ']');
        onset.find('input').attr('disabled', null);
        onset.css('color', 'inherit');
        offset.find('input').attr('disabled', true);
        offset.css('color', 'lightgray');
      }
    }
  };

  $axel.binding.register('condition',
    null, // no options
    null, // no parameters on host
    _Condition);

}($axel));
