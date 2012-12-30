AXEL-FORMS Library
==================

AXEL-FORMS is an extension to the [Adaptable XML Editing
Library](https://github.com/ssire/axel) that defines additional plugins and
filters to create forms, a binding mechanism and a command mechanism. Like AXEL, 
AXEL-FORMS is an open source (LGPL v2.1) library.

With the **binding mechanism** you can dynamically constrain the authoring process
(e.g. constrain a field input space with a regexp, contrain two dates 
to follow each other, etc).

With the **command mechanism** you can insert high-level commands such as __save__ 
(save the open document to a server), or __load__ (load a document into an editor) 
into a page. This way it is easy to create editing user interfaces.

Both the binding and the command mechanisms rely on microformat instructions 
to be included into the page markup. The benefit is that you can start using 
the library without writing Javascript code, in a fully declarative way.

Javascript developers have access to the binding and command mechanisms in the 
`$axel.binding` and `$axel.command` namespaces. The documented binding API 
and command API explain how to create and register new bindings and commands.

Pre-requisites
--------------

AXEL-FORMS requires JQuery.

You must checkout this repository into a sibling directory of the AXEL
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
the repository.

Where to start ?
----------------

This repository contains some sample templates in the `templates` folder.
You can open those templates using the editor in the `editor` folder. 
To launch the editor just open the `editor/editor.xhtml` file inside 
your browser (Firefox recommended, see the security note displayed in the launch screen).

If you are just interested in using and deploying AXEL-FORMS, all you need 
to do is to build the library (see below) and to copy the `dist/axel-forms.js`
file to your Web server. You must also have deployed AXEL onto your server.

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

You can get the Yahoo UI compressor at [http://developer.yahoo.com/yui/compressor/]()

Alternatively the `build.debug` target simply concatenates source files
together, so you can use it without installing the compressor.

How to contribute to the library ? 
----------------------------------

AXEL-FORMS is an extension to AXEL developped and maintained 
by S. Sire at [Oppidoc](http://www.oppidoc.fr). 

Please [contact us](mailto:contact@oppidoc.fr) for further inquiries.

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
