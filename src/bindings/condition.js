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
  
  function Condition ( jnode, name, doc ) {
    this.doc = doc;
    this.avoidstr = 'data-avoid-' + name;
    this.editor = $axel(jnode.get(0));
    jnode.bind('axel-update', $.proxy(Condition.prototype.updateConditionals, this));
  }
  
  Condition.prototype = {
  
    updateConditionals : function  (ev, data) {
      var curval = this.editor.text();
      var fullset = $('body [' + this.avoidstr + ']', this.doc || document);
      var onset = fullset.not('[' + this.avoidstr + '*=' + curval + ']');
      var offset = fullset.filter('[' + this.avoidstr + '*=' + curval + ']');
      onset.find('input').attr('disabled', null);
      onset.css('color', 'inherit');
      offset.find('input').attr('disabled', true);
      offset.css('color', 'lightgray');
    }
  };

  var factory = {
     init : function (jnode, doc) {
       var name = jnode.attr('data-variable');
       if (name) {
         new Condition(jnode, name, doc);         
       } else {
         xtiger.cross.log('error', 'Missing attribute "data-variable" to install "condition" binding');
       }
     }
  };

  $axel.binding.register('condition', factory)
}($axel));