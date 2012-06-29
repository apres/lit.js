Lit.js
======

Lit is a micro-literate programming library for Javascript inspired by docco.
Lit was created for the [Apres project](http://apres.github.com) but is
released separately for easy integration with any project wanting to display
annotated Javascript code. Lit features:

- Pure Javascript implementation, no shell-outs.
- Runs in browser, or via node.js.
- Can be loaded as an AMD module via requirejs, a CommonJS module via node.js,
  or via a simple `<script>` include.
- Table-free, simple, and readable html structure.
- Multiple css styles.
- Pluggable comment and code parsers.
- MIT License.

Installation
------------

To use Lit on the command-line, use `npm install lit`, use the global option
to be able to run it anywhere. 

CLI
---

The command-line script `litjs` is provided to create annotated web pages from
Javascript source files.

<code><pre>
Create annotated web page from JS source

Usage: litjs [infile]

Options:
  -t, --template  HTML template file name, defaults to columns.html 
  -o, --out       Output file, defaults to stdout                   
  --title         Title for output page, defaults to input file name
  --style, -s     Page style, one of "columns" or "callouts"          [default: "columns"]
</pre></code>