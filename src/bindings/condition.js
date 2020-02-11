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
|  Limitations: one editor per page since it uses $('body') selector          |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var _Condition = {

    onInstall : function ( host ) {
      this.avoidstr = 'data-avoid-' + this.getVariable();
      this.editor = $axel(host);
      host.on('axel-update', $.proxy(this.updateConditionals, this));
      // command installation is post-rendering, hence we can change editor's state
      this.updateConditionals();
      // FIXME: should be optional (condition_container=selector trick as 'autofill' ?)
      $(document).on('axel-content-ready', $.proxy(this, 'updateConditionals'));
      
    },

    methods : {

      updateConditionals : function  (ev, editor) {
        var onset, offset;
        var curval = this.editor.text();
        var fullset = $('body [' + this.avoidstr + ']', this.getDocument());
        onset = (curval != '') ? fullset.not('[' + this.avoidstr + '*="' + curval + '"]') : fullset.not('[' + this.avoidstr + '=""]');
        offset = (curval != '') ? fullset.filter('[' + this.avoidstr + '*="' + curval + '"]') : fullset.filter('[' + this.avoidstr + '=""]');
        onset.find('input').prop('disabled', false);
        onset.css('color', 'inherit');
        offset.find('input').attr('disabled', 'disabled');
        offset.css('color', 'lightgray');
      }
    }
  };

  $axel.binding.register('condition',
    null, // no options
    null, // no parameters on host
    _Condition);

}($axel));
