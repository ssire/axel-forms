/*****************************************************************************\
|                                                                             |
|  AXEL Oppidum interface module                                              |
|                                                                             |
|  Implementation of Oppidum Ajax responses                                   |
|  Functions to be called from commands to intepret server's response         |
|                                                                             |
|  TODO: rename to neutral $axel.reponse (response.js) to support adaptation  |
|  to more server-side back-ends                                              |
|                                                                             |
\*****************************************************************************/

(function ($axel) {

  var  _Oppidum = {

    // Converts XHR response into client-side Oppidum command
    // Currently this is just a simple object containing response as an XML document
    // or as a JSON document (json) and retaining the original XHR object
    // TODO: in JSON only status makes difference between success / error (no root)
    getCommand : function ( xhr ) {
      var doc, parser, type,
          cmd = { xhr: xhr };
      if (xhr.responseXML) {
        cmd.doc = xhr.responseXML;
      } else {
        type = xhr.getResponseHeader('Content-Type');
        if ($axel.oppidum.checkJSON(type)) { // tries to parse as JSON
          try {
            cmd.json = JSON.parse(xhr.responseText);
          } catch (e) {
          }
        } else { // tries to parse as XML
          parser = xtiger.cross.makeDOMParser();
          try {
            cmd.doc = parser.parseFromString(xhr.responseText, "text/xml");
          } catch (e) { // nope
          }
        }
      }
      return cmd;
    },

    // Implements redirection with Location header
    // Returns true if no redirection or false otherwise
    // Currently redirection is supposed to supersede any other feedback
    filterRedirection : function ( cmd ) {
      var loc = cmd.xhr && cmd.xhr.getResponseHeader('Location'),
          res = true;
      if (loc) {
        window.location.href = loc;
        res = false;
      }
      return res;
    },

    // Returns the message part of an Ajax response as a string
    decodeMessage : function ( cmd ) {
      var msg;
      if (cmd.doc) {
        msg = $('success > message', cmd.doc).text();
      } else if (cmd.json) {
        msg = cmd.json.message ? cmd.json.message['#text'] : 'missing "message" element in response';
      } else {
        msg = xhr.responseText;
      }
      return msg;
    },

    // Implements the message part of an Ajax response
    handleMessage : function ( cmd ) {
      var msg = decodeMessage(cmd);
      if (msg) {
        alert(msg); // FIXME: integrate reporting with flash ?
      }
    },

    // Implements the <forward> element of an Ajax response
    handleForward : function ( cmd ) {
      var command, target, host, ev;
      if (cmd.doc) {
        host = $('success > forward', cmd.doc);
        command = host.attr('command');
        target = host.text();
      }
      if (command && target) {
        ev = { synthetic: true, command : cmd };
        $axel.command.getCommand(command, target).execute(ev);
      }
    },

    // Tests if type string represents JSON MIME Type
    checkJSON : function ( type ) {
      var json = "application/json";
      return (typeof type === 'string') && (type.slice(0, json.length) === json);
    },

    // DEPRECATED - Returns the text message of a successful response
    unmarshalMessage : function ( xhr ) {
      var text = xhr.responseXML ? $('success > message', xhr.responseXML).text() : xhr.responseText;
      return text;
    },

    // Returns the payload content as text of a successful response with payload
    // In particular payload may contain HTML for injection (e.g. 'save' command)
    // NOTE: for JSON response you should directly use cmd.json.payload (!)
    unmarshalPayload : function ( xhr ) {
      var start = xhr.responseText.indexOf('<payload>'),
          end,
          res = xhr.responseText;
      if (-1 !== start) {
        end = xhr.responseText.indexOf('</payload>');
        if (-1 !== end) {
          res = xhr.responseText.substr(start + 9, end - start - 9) ;
        }
      }
      return res;
    },

    // Returns true if the XHR response is an Oppidum error message
    // which can be returned indifferently as xml or as json
    isResponseAnOppidumError : function (xhr ) {
      var type = xhr.getResponseHeader('Content-Type'),
          res = false;
      if (xhr.responseXML) {
        res = $('error > message', xhr.responseXML).size() > 0;
      } else if ($axel.oppidum.checkJSON(type)) {
        try {
          res = JSON.parse(xhr.responseText).message !== undefined;
        } catch (e) {
        }
      }
      return res;
    },

    getOppidumErrorMsg : function (xhr ) {
      var type = xhr.getResponseHeader('Content-Type'),
          res;
      if (xhr.responseXML) {
        res = $('error > message', xhr.responseXML).text();
      } else if ($axel.oppidum.checkJSON(type)) {
        try {
          res = JSON.parse(xhr.responseText).message['#text'];
        } catch (e) {
        }
      } else {
        res = xhr.responseText;
      }
      return res || xhr.status;
    },

    // Tries to extract more info from a server error. Returns a basic error message
    // if it fails, otherwise returns an improved message
    // Compatible with eXist 1.4.x server error format (which is returned as plain HTML - no JSON)
    getExistErrorMsg : function (xhr) {
      var text = xhr.responseText, status = xhr.status;
      var msg = 'Error ! Result code : ' + status;
      var details = "";
      var m = text.match('<title>(.*)</title>','m');
      if (m) {
        details = '\n' + m[1];
      }
      m = text.match('<h2>(.*)</h2>','m');
      if (m) {
        details = details + '\n' + m[1];
      } else if ($('div.message', xhr.responseXML).size() > 0) {
        details = details + '\n' + $('div.message', xhr.responseXML).get(0).textContent;
        if ($('div.description', xhr.responseXML).size() > 0) {
          details = details + '\n' + $('div.description', xhr.responseXML).get(0).textContent;
        }
      }
      return msg + details;
    },

    // Same parameters as the one received by the jQuery Ajax error callback
    // a) XHR object, b) status message (error,timeout, notmodified, parseerror)
    // c) optional exception sometimes returned from XHR, plus d) url
    parseError : function (xhr, status, e, url) {
      var loc, msg;
      if (status === 'timeout') {
        msg = xtiger.util.getLocaleString("errServerTimeOut");
      } else if (xhr.status === 409) { // 409 (Conflict)
        loc = xhr.getResponseHeader('Location');
        if (loc) {
          window.location.href = loc;
          msg = xtiger.util.getLocaleString("msgRedirect");
        } else {
          msg = $axel.oppidum.getOppidumErrorMsg(xhr);
        }
      } else if ($axel.oppidum.isResponseAnOppidumError(xhr)) {
        // Oppidum may generate 500 Internal error, 400, 401, 404
        msg = $axel.oppidum.getOppidumErrorMsg(xhr);
      } else if (xhr.responseText.search('Error</title>') !== -1) { // HTML generated eXist-db error (empirical)
        msg = $axel.oppidum.getExistErrorMsg(xhr);
      } else if (e && (typeof e === 'string')) {
        msg = xtiger.util.getLocaleString('errException', { e : { message : e }, status : xhr.status });
      } else if (e) {
        msg = xtiger.util.getLocaleString('errException', { e : e, status : xhr.status });
      } else if (url) {
        msg = xtiger.util.getLocaleString('errLoadDocumentStatus', { url : url, xhr: xhr });
      } else if (xhr.responseText !== '') {
        msg = xhr.responseText;
      } else {
        msg = xtiger.util.getLocaleString('errLoadDocumentStatus', { xhr: xhr });
      }
      return msg;
    }
  };

  // registers 'protocol.upload' message decoder
  xtiger.registry.registerFactory('protocol.upload',
    {
      getInstance : function (doc) {
        return {
          decode_success : function (xhr) {
            var loc = xhr.getResponseHeader('Location');
            if (loc) {
              window.location.href = loc;
            }
            return (-1 !== xhr.responseText.indexOf('<payload')) ? $axel.oppidum.unmarshalPayload(xhr) : $axel.oppidum.unmarshalMessage(xhr);
          },
          decode_error : function (xhr) {
            return $axel.oppidum.parseError(xhr, xhr.status);
          }
        };
      }
    }
  );

  // exports module
  $axel.oppidum = _Oppidum;
}($axel));
