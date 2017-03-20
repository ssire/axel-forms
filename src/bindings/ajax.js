/*****************************************************************************\
|                                                                             |
|  AXEL 'ajax' binding                                                        |
|                                                                             |
|  Implements data-ajax-trigger={variable} to dynamically load a 'choice'     |
|  list of options depending on the master host field value                   |
|                                                                             |
|*****************************************************************************|
|  Prerequisites: jQuery, AXEL, AXEL-FORMS                                    |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var _Ajax = {

    onInstall : function ( host ) {
      var cache, container;
      this.spec = host;
      this.editor = $axel(host);
      cache = this.spec.attr('data-ajax-cache');
      this.cache = cache ? JSON.parse(cache) : {}; // TODO: validate cache
      this.scope = this.spec.attr('data-ajax-scope');
      host.bind('axel-update', $.proxy(this.execute, this));
      container = this.spec.attr('data-ajax-container');
      if (container) {
        this.spec.closest(container).bind('axel-content-ready', $.proxy(this, 'synchronize'));
      } else {
        $(document).bind('axel-content-ready', $.proxy(this, 'synchronize'));
      }
      if (this.scope) {
        this.spec.closest(this.scope).bind('axel-add',  $.proxy(this, 'add'));
      }
    },

    methods : {

      wrapper : function ( ) {
        var sel = '[data-ajax-trigger*="' + this.getVariable() + '"]';
        if (this.scope) {
          return this.spec.closest(this.scope).find(sel);
        } else {
          return $('body ' + sel, this.getDocument());
        }
      },

      saveSuccessCb : function (restoreFlag, response, status, xhr) {
        if (response.cache) {
          this.cache[response.cache] = response.items;  
        }
        this.load(restoreFlag, response.items);
      },

      saveErrorCb : function (xhr, status, e) {
        var msg = $axel.oppidum.parseError(xhr, status, e);
        $axel.error(msg);
      },
      
      // loads the array of options into all dependent editors
      load : function ( restoreFlag, options ) {
        // TODO: scope CSS rule with data-ajax-container
        var set = this.wrapper();
        set.each( function (i, e) {
          $axel(e).get(0).ajax({ 'items' : options, restore : restoreFlag });
        });
        this.last = options
      },

      // restoreFlag to keep the editor's content (after loading XML content)
      update : function ( restoreFlag ) {
        var val = this.editor.text(),
            href = this.spec.attr('data-ajax-url');
        if (val == "") {
          this.load(false);
        } else if (this.cache[val]) {
          this.load(restoreFlag, this.cache[val]);
        } else if (href) {
          href = $axel.resolveUrl(href.replace('$_', val), this.spec.get(0));
          $.ajax({
            url : href,
            type : 'GET',
            async : false,
            dataType : 'json',
            cache : false,
            timeout : 25000,
            success : $.proxy(this, 'saveSuccessCb', restoreFlag),
            error : $.proxy(this, 'saveErrorCb')
            });
        }
      },

      execute : function  (ev, editor) {
        this.update(false);
        this.wrapper().trigger({ type: 'axel-update', value : this.editor.text() }, this);
      },
      
      synchronize : function  () {
        this.update(true);
      },
      
      add : function ( ev, repeater ) {
        var set = this.wrapper();
        $axel(set.eq(ev.position)).get(0).ajax({ 'items' : this.last, restore : ev.position === 0 ? true : false  });
      }
    }
  };

  $axel.binding.register('ajax',
    null, // no options
    null, // no parameters on host
    _Ajax);

}($axel));
