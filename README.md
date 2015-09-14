AXEL-FORMS Library
==================

AXEL-FORMS is an extension to the [Adaptable XML Editing
Library](https://github.com/ssire/axel) that defines additional plugins and
filters to create forms, a binding mechanism and a command mechanism. Like AXEL, 
AXEL-FORMS is an open source (LGPL v2.1) library.

The binding and the command mechanisms define microformat instructions to be included
directly on the XTiger XML and application page markup. This way you can use them 
without writing Javascript code, in a fully declarative way.

Use the **binding mechanism** to dynamically constrain the authoring process
(e.g. constrain a field input space with a regexp, contrain two dates 
to follow each other, etc). This is targeted at XTiger XML authors.

Use the **command mechanism** to associate high-level commands such as __save__ 
(save the open document to a server), or __load__ (load a document into an editor) 
with user interface controls such as buttons into a page. This way it is easy 
to create editing user interfaces. This is targeted at web application developers. 
Some commands may be redundant with functionalities exposed by the **$axel** wrapped 
set object, however they do not require writing Javascript code and thus are easy 
to render in markup generation tool chains such as XSLT transformations.

Javascript developers have access to the binding and command mechanisms in the 
`$axel.binding` and `$axel.command` namespaces. Javascript developers can create
and register new bindings and commands as explained in the documenation.

Pre-requisites
--------------

AXEL-FORMS requires JQuery and AXEL.

You must checkout the AXEL-FORMS repository into a sibling directory of the AXEL
code distribution available at [https://github.com/ssire/axel]().

To clone the AXEL distribution from its git repo run :

`git clone git://github.com/ssire/axel.git`.

To clone the AXEL-FORMS distribution from its bitbucket repo run :

`git clone git@bitbucket.org:ssire/axel-forms.git`.

How to test it ?
----------------

This repository is also published as the [AXEL-FORMS web site](http://ssire.github.com/axel-forms/) 
thanks to the Git Hub project pages mechanism. From the web site you can directly
test AXEL-FORMS inside your browser without any preliminary software installation.
Follow the instructions of the section "For the impatient". 

The web site is regularly updated, however to really get the latest version checkout 
the repository. The *master* branch is where we push AXEL-FORMS more stable releases while
the *devel* branch is where we prepare the next release.

Where to start ?
----------------

This repository contains some sample templates in the `templates` folder.
You can open those templates using the editor in the `editor` folder. 
To launch the editor just open the `editor/editor.xhtml` file inside 
your browser (Firefox recommended, see the security note displayed in the launch screen).

If you are just interested in using and deploying AXEL-FORMS, all you need 
to do is to build the library (see below) and to copy the `dist/axel-forms.js`
file to your Web server. You must also have deployed AXEL onto your server.

The rule of thumb is that if you checkout the *master* branch it will contain
a built of the `dist/axel-forms.js` library file lined up with the code. Be aware that if
you checkout the *devel* branch, you will need to rebuild the `dist/axel-forms.js` file 
following the instructions of the next section.


How to build the library ?
--------------------------

To build the library with the latest sources concatenated and minified inside
the `dist` folder, run the `build.lib` target in the scripts directory:

    cd scripts
    ant build.lib

This requires that you have the [ant](http://ant.apache.org/) tool available
on your system, which is already the case on many operating systems.

This requires that you install the Yahoo UI compressor onto your machine, and
that you edit the `scripts/ant.properties` file to point to it.

You can get the Yahoo UI compressor at [http://developer.yahoo.com/yui/compressor/](http://developer.yahoo.com/yui/compressor/)

Alternatively the `build.debug` target simply concatenates source files
together, so you can use it without installing the compressor.

How to contribute to the library ? 
----------------------------------

AXEL-FORMS is an extension to AXEL developped and maintained 
by S. Sire at [Oppidoc](http://www.oppidoc.fr). 

Please [contact us](mailto:contact@oppidoc.fr) for further inquiries.

Simple web server
-----------------

You can run the demonstration editor directly from the file system, 
however this may lead to some problems transforming the templates and/or loading 
XML data on some browsers. This is because they will not allow the editor to transform 
a template loaded inside an iframe, and/or to read files from the file system because 
of a strict application of security policies.

An alternative solution is to access the AXEL distribution from a web server. 

For instance, if you have ruby installed you may run a one line command into 
a terminal to start a web server serving the current directory and below
(at http://localhost:3000 on the example below) :

    ruby -r webrick -e "m = WEBrick::HTTPUtils::DefaultMimeTypes; m.update({'xhtml' => 'application/xhtml+xml'}); s = WEBrick::HTTPServer.new(:Port => 3000, :DocumentRoot => Dir.pwd, :MimeTypes => m); trap('INT') { s.shutdown }; s.start"
    
_You need to start the web server from the AXEL-FORMS parent directory where you 
have copied an AXEL distribution too._

Don't forget to configure the server to serve XTiger XML template files with 
the 'application/xhtml+xml' MIME-TYPE, otherwise the browser will propose to save 
them as external documents and not transform them. 


Such commands exist with other languages (e.g. python).


Coding Guidelines 
-----------------
                                          
We currently do not have strong coding conventions as you will see by yourself
when browsing the source code, however respect at least these ones :

* soft tabs
* 2 spaces per tab
* remove spaces at the end of lines (you may use a filter such as `sed -E 's/[ ]+$//g'`)
* test source files with jslint

Each plugin should be documented in a self-describing template file inside 
the `templates/plugins` folder.

Each filter should be documented in a self-describing template file inside
the `templates/filters` folder.

Each binding should be documented in a self-describing template file inside
the `templates/bindings` folder.

Each command should be documented in a self-describing template file inside
the `templates/commands` folder.
