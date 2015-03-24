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
        return "Type at least " + values.n + " letter" + (values.n === 1? "" : "s"); }
    }
  );
}($axel));