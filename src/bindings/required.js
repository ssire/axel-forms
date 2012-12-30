/*****************************************************************************\
|                                                                             |
|  AXEL 'required' binding                                                    |
|                                                                             |
|  Makes a group of radio buttons or checkboxes required.                     |
|                                                                             |
|  Applies to a group of children AXEL 'input' plugins of type 'radio'        |
|  or 'checkbox'                                                              |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
|  WARNING: experimental and tricky !                                         |
|  The binding registers itself on the DOM tree as a fake primitive editor    |
\*****************************************************************************/
(function ($axel) {

  var _Required = {

    onInstall : function ( host ) {
      this.editors = $axel(host);
      this.handle = host.get(0);
      if (this.handle.xttPrimitiveEditor) {
        xtiger.cross.log('error','Failed attempt to attach a "required" binding directly onto a primitive editor');
      } else {
        this.handle.xttPrimitiveEditor = this;
      }
    },

    methods : {

      isModified : function  () {
        var res = (this.editors.text() !== '')
        window.console.log('Test required ' + res);
        return res;
      },
      
      isFocusable : function () {
        var relay = this.editors.get(0);
        return relay ? relay.isFocusable() : false;
      },
      
      focus : function () {
        var relay = this.editors.get(0);
        if (relay) {
          this.editors.get(0).focus()
        }
      },

      unfocus : function () {
        // should never be called
      },
      
      // DEPRECATED
      can : function (aFunction) {
        return false;
      },
      
      // required to display field name in validation
      getHandle : function () {
        return this.handle;
      },
      
      onInit : function ( aDefaultData, anOptionAttr, aRepeater ) {
      },
      
      onAwake : function () {
      },

      // FIXME: to be replaced by onSave
      load : function (aPoint, aDataSrc) {
      },
      
      // FIXME: to be replaced by onSave
      save : function (aLogger) {
      }      
    }
  };

  $axel.binding.register('required',
    { error : true  }, // options
    { 'required' : 'true' }, // parameters
    _Required
  );

}($axel));
