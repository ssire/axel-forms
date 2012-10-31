/*****************************************************************************\
|                                                                             |
|  'dump' command object                                                      |
|                                                                             |
|  Opens a popup window and dump the target editor's content into it          |
|                                                                             |
|*****************************************************************************|
|                                                                             |
|  Required attributes :                                                      |
|  - data-target : id of the editor's container                               |
|                                                                             |
\*****************************************************************************/
(function () {
  
  function openWin ( name, w, h ) {
    var params = "width=" + w + ",height=" + h + ",status=yes,resizable=yes,scrollbars=yes,title=" + name,
        win;
    if (xtiger.cross.UA.IE) {
      win = window.open('about:blank');
    } else {
      win = window.open(null, name, params);    
    }
    return win;
  }
  
  function transcode ( text ) {
    var filter1 = text.replace(/</g, '&lt;');
    var filter2 = filter1.replace(/\n/g, '<br/>');
    var filter3 = filter2.replace(/ /g, '&nbsp;');    
    return filter3;
  }
  
  function DumpCommand ( identifier, node ) {
    this.key = identifier; /* data-target */
    $(node).bind('click', $.proxy(this, 'execute'));
  }
  
  DumpCommand.prototype = {
    execute : function (event) {
      var editor = $axel.command.getEditor(this.key),
          data, buffer, doc;
      if (editor) {
        prolog = "<?xml version=\"1.0\"?>\n"; // encoding="UTF-8" ?
        data = editor.serializeData();
        // if (stylesheet) {
        //   buffer += '<?xml-stylesheet type="text/xml" href="' + stylesheet + '"?>\n';
        // }
        // if (template) {
        //   buffer += '<?xtiger template="' + template + '" version="1.0" ?>\n';
        // }              
        doc = openWin('XML', 800, 600).document;
        doc.open();
        doc.writeln(transcode(prolog));
        doc.writeln(transcode(data));
        doc.close();     
      }
    }
  };
  
  $axel.command.register('dump', DumpCommand, { check : true });
}());


