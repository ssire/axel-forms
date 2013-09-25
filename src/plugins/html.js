(function ($axel) {

  // you may use the closure to declare private objects and methods here

  var _Editor = {

    ////////////////////////
    // Life cycle methods //
    ////////////////////////
    onGenerate : function ( aContainer, aXTUse, aDocument ) {
      var viewNode = xtdom.createElement (aDocument, 'div');
      xtdom.addClassName(viewNode,'af-html');
      aContainer.appendChild(viewNode);
      return viewNode;
    },
    
    onInit : function ( aDefaultData, anOptionAttr, aRepeater ) {
      if (this.getParam('hasClass')) {
        xtdom.addClassName(this._handle, this.getParam('hasClass'));
      }
    },

    // Awakes the editor to DOM's events, registering the callbacks for them
    onAwake : function () {
    },

    onLoad : function (aPoint, aDataSrc) {
      var i, h;
      if (aDataSrc.isEmpty(aPoint)) {
        $(this.getHandle()).html('');
       } else {
         h = $(this.getHandle());
         h.html('');
         for (i = 1; i < aPoint.length; i++) {
           h.append(aPoint[i]);
         }
      }
    },

    onSave : function (aLogger) {
      aLogger.write('HTML BLOB');
    },

    ////////////////////////////////
    // Overwritten plugin methods //
    ////////////////////////////////
    api : {
    },

    /////////////////////////////
    // Specific plugin methods //
    /////////////////////////////
    methods : {
    }
  };

  $axel.plugin.register(
    'html', 
    { filterable: false, optional: false },
    { 
     key : 'value'
    },
    _Editor
  );

}($axel));