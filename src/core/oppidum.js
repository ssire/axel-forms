/*****************************************************************************\
|                                                                             |
|  AXEL Oppidum interface module                                              |
|                                                                             |
|  Utility functions to interact with server side code based on Oppidum       |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var  _Oppidum = {

    checkJSON : function ( type ) {
      var json = "application/json";
      return (typeof type === 'string') && (type.slice(0, json.length) === json);
    },

    // Returns the text message of a successful response
    unmarshalMessage : function ( xhr ) {
      var text = xhr.responseXML ? $('success > message', xhr.responseXML).text() : xhr.responseText;
      return text;
    },

    // Returns the payload content as text of a successful response with payload
    // In particular payload may contain HTML for injection (e.g. 'save' command)
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
          res = JSON.parse(xhr.responseText).error !== undefined;
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
          res = JSON.parse(xhr.responseText).error.message['#text'];
        } catch (e) {
        }
      } else {
        res = xhr.responseText;
      }
      return res || xhr.status;
    },

    // Tries to extract more info from a server error. Returns a basic error message
    // if it fails, otherwise returns an improved message
    // Compatible with eXist 1.4.x server error format
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
