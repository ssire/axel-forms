/*****************************************************************************\
|                                                                             |
|  AXEL Oppidum interface module                                              |
|                                                                             |
|  Utility functions to interact with server side code based on Oppidum       |
|                                                                             |
\*****************************************************************************/
(function ($axel) {

  var  _Oppidum = {

    isResponseAnOppidumError : function (xhr ) {
      return $('error > message', xhr.responseXML).size() > 0;
    },

    getOppidumErrorMsg : function (xhr ) {
      var text = $('error > message', xhr.responseXML).text();
      return text || xhr.status;
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
    // and c) optional exception somteimes returned from XHR if any
    parseError : function (xhr, status, e) {
      var loc, msg;
      if (status === 'timeout') {
        msg = "Action aborted : server is taking too much time to answer. You are strongly advised to reload the page to check if the action has been executed anyway !";
      } else if (xhr.status === 409) { // 409 (Conflict)
        loc = xhr.getResponseHeader('Location');
        if (loc) {
          window.location.href = loc;
          msg = "Your are going to be redirected";
        } else {
          msg = $axel.oppidum.getOppidumErrorMsg(xhr);
        }
      } else if ($axel.oppidum.isResponseAnOppidumError(xhr)) {
        // Oppidum may generate 500 Internal error, 400, 401, 404
        msg = $axel.oppidum.getOppidumErrorMsg(xhr);
      } else if (xhr.responseText.search('Error</title>') !== -1) { // eXist-db error (empirical)
        msg = $axel.oppidum.getExistErrorMsg(xhr);
      } else if (e && (typeof e === 'string')) {
        msg =  'Exception : "' + e + '" (' + xhr.status + ')';
      } else if (e) {
        msg =  'Exception : ' + e.name + ' / ' + e.message + '\n' + ' (' + xhr.status +', line : ' + e.lineNumber + ')';
      } else {
        msg = 'Error while connecting to "' + this.url + '" (' + xhr.status + ')';
      }
      return msg;
    }
  };

  // exports module
  $axel.oppidum = _Oppidum;
}($axel));
