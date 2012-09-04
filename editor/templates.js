// Model data to construct template selection menus in editor application
// Please fill this data structure as you add more templates
// NOTE: do not use "_custom_" name (reserved)
function getDefaultTemplates () {
  return [
    { 
    name : 'demos', // menu name
    path : '../templates/demos/', // path to folder (MUST end with '/')
    files :  // available template files
      [
      "Interval.xhtml"
      ]
    },
    {
    name : 'samples',
    path : '../templates/samples/',
    files : 
      [
      "Sample1.xhtml",
      "Sample2.xhtml"
      ]
    }
  ]
}
