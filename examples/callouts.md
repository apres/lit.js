<style type="text/css">
/*
 * lit.js - https://github.com/apres/lit.js
 * Part of the Apres suite - http://apres.github.com/
 */
body {
  margin: 0;
  padding: 0;
}

.lit {
  float: left;
  background-color: #f2f2ff;
  font-family: 'Helvetica Neue', Helvetica, sans-serif;
}

.lit h1 {
  font-size: 32px;
}
.lit h2 {
  font-size: 24px;
  color: #445;
}
.lit h3 {
  font-size: 20px;
  color: #445;
}
.lit h4 {
  font-size: 18px;
  color: #445;
}
.lit h5, .lit h6 {
  font-size: 16px;
  font-style: italic;
  color: #445;
}

h1, h2, h3, h4, h5, h6 {
  margin: 5px 0 5px 0;
}

.lit section {
  position: relative;
  page-break-inside: avoid;
  text-rendering: optimizeLegibility;
  float: left;
  width: 100%;
}

.lit .comment {
  position: relative;
  float: left;
  height: 100%;
  width: 38%;
  font-size: 14px;
  padding: 0 1em 0 1em;
  background-color: white;
  border-radius: 6px;
  -moz-border-radius: 6px;
  -webkit-border-radius: 6px;
  box-shadow: 1px 1px 15px #cbcbcb;
  margin: 5px 5px 5px 10px;
  z-index: 998;
}

.lit section:after {
  /* callout shadow */
  position: absolute;
  top: 7px;
  left: 38%; /* set same as .comment width */
  margin-left: 34px;
  font-size: 27px;
  content: "►";
  color: transparent;
  text-shadow: 0 0 15px #cbcbcb;
  z-index: 997;
}

.lit .comment:after {
  /* callout arrow */
  position: absolute;
  top: 1px;
  left: 100%;
  margin-left: -7px;
  font-size: 27px;
  content: "►";
  color: white;
  z-index: 999;
}

.lit .code {
  float: left;
  height: 100%;
  width: 50%;
  font-family: Menlo, Monaco, 'Courier New', monospace;
  font-size: 14px;
  white-space: pre;
  padding: 0 1em 0 1em;
}
</style>
<div class="lit">
<section>
<div class="comment">
<h1 id="litjs">lit.js</h1>
</div>
<div class="code">


</div>
</section>
<section>
<div class="comment">
<p>lit.js - Micro-literate programming library inspired by docco
By Casey Duncan
https://github.com/apres/lit.js
Part of the Apres suite - http://apres.github.com/
Lit is freely distributable under the MIT license.</p>
</div>
<div class="code">

;(function() {
  var commentRe = /^\s*\/\/\s*/;
  var whitespaceOnlyRe = /^\s*$/;
  var lit = {};


</div>
</section>
<section>
<div class="comment">
<h2 id="rendercommentstohtml">Render comments to HTML</h2>

<p>This defaults to showdown's makeHtml() function, if available
otherwise it is a no-op. Applications can plug in their
own function here to format comments anyway desired.</p>
</div>
<div class="code">
  lit.renderComment = function(src) {return src};


</div>
</section>
<section>
<div class="comment">
<h2 id="rendercodetohtml">Render code to HTML</h2>
</div>
<div class="code">
  lit.renderCode = function(src) {
    return String(src)
      .replace(/&amp;(?!(\w+|\#\d+);)/g, '&amp;')
      .replace(/&lt;/g, '&lt;')
      .replace(/&gt;/g, '&gt;')
      .replace(/&quot;/g, '&quot;');
  }


</div>
</section>
<section>
<div class="comment">
<h2 id="parsesourcecodeintosections">Parse source code into sections</h2>

<p>Produces an object with an attribute <code>sections</code>, an array of
objects containing the code and comments for each code section.
Each section is denoted by one or more leading comments</p>
</div>
<div class="code">
  lit.parse = function(src) {
    var sections = [];
    var lines = src.split('\n');
    var i, line, comments = '', code = '';
    for (i = 0; i &lt; lines.length; i++) {
      line = lines[i];
      if (commentRe.test(line)) {
        if (code) {
          sections.push({comments: comments, code: code});
          comments = ''; code = '';
        }
        comments += line.replace(commentRe, '') + '\n';
      } else {
        code += line + '\n';
      }
    }
    if (code || comments) {
      sections.push({comments: comments, code: code});
    }
    return {sections: sections};
  }


</div>
</section>
<section>
<div class="comment">
<h2 id="createhtmlfromsourceorparsedsections">Create html from source, or parsed sections</h2>

<p>Return an HTML fragment for the source or parsed sections
provided.</p>
</div>
<div class="code">
  lit.makeHtml = function(s) {
    var section, i, comments, code;
    if (typeof s === 'string') s = lit.parse(s).sections;
    var html = '&lt;div class=&quot;lit&quot;&gt;\n';
    for (i = 0; (section = s[i]); i++) {
      comments = section.comments ? lit.renderComment(section.comments) : '';
      if (whitespaceOnlyRe.test(comments)) comments = '&nbsp;';
      code = section.code ? lit.renderCode(section.code) : '';
      html += ( '&lt;section&gt;\n' 
              + '&lt;div class=&quot;comment&quot;&gt;\n' + comments + '\n&lt;/div&gt;\n'
              + '&lt;div class=&quot;code&quot;&gt;\n' + code + '\n&lt;/div&gt;\n'
              + '&lt;/section&gt;\n' );
    }
    html += '&lt;/div&gt;\n';
    return html;
  }


</div>
</section>
<section>
<div class="comment">
<p>Loaded via AMD</p>
</div>
<div class="code">
  if (typeof define === 'function' &amp;&amp; define.amd) {
    define(['showdown'], function(showdown) {
      if (showdown) lit.renderComment = showdown.makeHtml;
      lit.amd = true;
      return lit;
    });

</div>
</section>
<section>
<div class="comment">
<p>Loaded via CommonJS/Node</p>
</div>
<div class="code">
  } else if (typeof require === 'function' &amp;&amp; module) {
    var showdown = new (require('showdown').converter)()
    lit.renderComment = showdown.makeHtml;
    module.exports = lit;

</div>
</section>
<section>
<div class="comment">
<p>Global script-include</p>
</div>
<div class="code">
  } else {
    window.lit = lit;
    if (typeof Showdown !== 'undefined') {
      lit.renderComment = new Showdown.converter().makeHtml;
    }
  }
}).call(this);


</div>
</section>
</div>
