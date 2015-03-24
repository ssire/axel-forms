/**
 * AXEL-FORMS French translation.
 *
 * Author: Stéphane Sire <s.sire@oppidoc.fr>
 */
(function ($axel) {
  $axel.addLocale('fr',
    {
      // Functions with values
      errFormRequired : function (values) {
        return "Vous devez remplir les champs suivants : " + values.fields; },
      errFormInvalid : function (values) {
        return "Vous devez corriger les champs suivants : " + values.fields; },
      hintMinInputSize : function (values) { 
        return "Entrez au moins " + values.n + " caractère" + (values.n === 1? "" : "s"); }
    }
  );
}($axel));