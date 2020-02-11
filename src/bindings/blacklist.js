/*****************************************************************************\
|                                                                             |
|  AXEL 'blacklist' binding                                                   |
|                                                                             |
|  Implements list of values to avoid                                         |
|  Applies to AXEL 'input' plugin                                             |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var _Blacklist = {

    onInstall : function ( host ) {
      this.terms = this.getParam('blacklist').split(' ');
      this.editor = $axel(host);
      host.on('axel-update', $.proxy(this.filter, this));
      $axel.binding.setValidation(this.editor.get(0), $.proxy(this.filter, this));
    },

    methods : {

      filter : function  () {
        var i, cur = this.editor.text(), valid = true;
        for (i = 0; i < this.terms.length; i++) {
          if (cur === this.terms[i]) {
            valid = false;
            break;
          }
        }
        return this.toggleError(valid, this.editor.get(0).getHandle(true));
      }
    }
  };

  $axel.binding.register('blacklist',
    { error : true  }, // options
    { 'blacklist' : $axel.binding.REQUIRED }, // parameters
    _Blacklist
  );

}($axel));
