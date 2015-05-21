/**
 * AXEL-FORMS English translation.
 *
 * Author: Stéphane Sire <s.sire@oppidoc.fr>
 */
(function ($axel) {
  $axel.addLocale('en',
    {
      // Functions with values
      errFormRequired : function (values) {
        return "You must fill the following fields : " + values.fields; },
      errFormInvalid : function (values) {
        return "You must correct the following fields : " + values.fields; },
      hintMinInputSize : function (values) { 
        return "Type at least " + values.n + " letter" + (values.n === 1? "" : "s"); },
      errServerResponse : function (values) {
        return "Unexpected response from server (" + values.xhr ? values.xhr.status : "undefined" + "). The action may have failed"; },

      // Simple strings
      errServerTimeOut : "Action aborted: server is taking too much time to answer. You should reload the page to check if the action has been executed anyway",
      msgRedirect : "You are going to be redirected",
      editorEmpty : "The document contains no data",
      noTargetURL : "The command does not know where to send the data",
      editorNotFound : "There is no editor associated with this command"
    }
  );
}($axel));