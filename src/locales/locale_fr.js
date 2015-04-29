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
        return "Entrez au moins " + values.n + " caractère" + (values.n === 1? "" : "s"); },

      // Simple strings
      errServerTimeOut : "Action annulée, délai de réponse dépassé. Rechargez la page pour vérifier si votre action a été prise en compte.",
      msgRedirect : "Vous allez être redirigé"
    }
  );
}($axel));