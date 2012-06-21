AXEL-FORMS Library
==================

AXEL-FORMS is an extension to the Adaptable XML Editing Library that 
defines some plugins for generating forms based on HTML forms elements.

Pre-requisites
--------------

You must use this library as a sibling folder to the AXEL source 
code distribution available at [https://github.com/ssire/axel]().

To clone the AXEL distribution from its git repo run `git
clone git://github.com/ssire/axel.git`.

To clone the AXEL-FORMS distribution from its bitbucket repo run `git
clone git@bitbucket.org:ssire/axel-forms.git`.

Where to start ?
----------------

This repository contains some sample templates in the `templates` folder.
You can open those templates using the editor in the `editor` folder. 
To launch the editor just open the `editor/editor.xhtml` file inside 
your browser (Firefox recommended, see the security note displayed by 
the original AXEL editor).

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

AXEL-FORMS is a proprietary extension to AXEL developped and maintained 
by S. Sire at [Oppidoc SARL](http://www.oppidoc.fr). 

Please [contact us](mailto:contact@oppidoc.fr) for further inquiries.
