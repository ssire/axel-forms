// Model data to construct template selection menus in editor application
// Please fill this data structure as you add more templates
// NOTE: do not use "_custom_" name (reserved)
function getDefaultTemplates () {
  return [
    { 
    name : 'plugins', // menu name
    path : '../templates/plugins/', // path to folder (MUST end with '/')
    files :  // available template files
      [
      "Input.xhtml",
      "Choice.xhtml"
      ]
    },
    {
    name : 'bindings',
    path : '../templates/bindings/',
    files :
      [
      "Interval.xhtml"
      ]
    },
    { 
    name : 'commands',
    path : '../templates/commands/',
    files :
      [
      "Command.xhtml",
      "Validate.xhtml"
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
