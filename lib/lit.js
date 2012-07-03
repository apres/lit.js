// lit.js - Micro-literate programming library inspired by docco
// By Casey Duncan
// https://github.com/apres/lit.js
// Part of the Apres suite - http://apres.github.com/
// Lit is freely distributable under the MIT license.

;(function() {
  var commentRe = /^\s*\/\/\s*/;
  var whitespaceOnlyRe = /^\s*$/;
  var lit = {};

  //## Utility function to escape HTML tags
  //
  // Note this does not escape entities
  lit.escapeHtml = function(src) {
    return String(src)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  //## Code renderer hook function
  //
  // This hook function processes code and returns HTML. 
  // If available it uses highlight.js to syntax highlight the source code.
  // Applications can plug in their own code renderer here.
  lit.renderCode = lit.escapeHtml;

  //## Comment renderer hook function
  //
  // This hook function processes comments into HTML.
  // If available it uses showdown to process the comments as markdown
  // into HTML. Applications can plug in their own comment renderer here.
  lit.renderComment = lit.escapeHtml;

  //## Code pre-processor hook function
  //
  // This function is used to process code strings before feeding them
  // to the syntax highlighter. The default behavior is to strip leading
  // and trailing newlines.
  lit.preprocessCode = function(s) {
    return s.replace(/^\n*/, '').replace(/\n*$/, '')
  }

  // ## Parse source code into sections
  //
  // Produces an object with an attribute `sections`, an array of
  // objects containing the code and comments for each code section.
  // Each section is denoted by one or more leading comments
  lit.parse = function(src) {
    var sections = [];
    var lines = src.split('\n');
    var i, line, comments = '', code = '', blanks = '';
    for (i = 0; i < lines.length; i++) {
      line = lines[i];
      if (commentRe.test(line)) {
        if (code) {
          sections.push({comments: comments, code: lit.preprocessCode(code)});
          comments = code = blanks = '';
        }
        comments += blanks + line.replace(commentRe, '') + '\n';
        blanks = '';
      } else if (line || code) {
        code += blanks + line + '\n';
        blanks = '';
      } else {
        // Collect blank lines before code that may be part of comments
        blanks += '\n';
      }
    }
    if (code || comments) {
      sections.push({comments: comments, code: lit.preprocessCode(code)});
    }
    return {sections: sections};
  }

  // ## Create html from source, or parsed sections
  //
  // Return an HTML fragment for the source or parsed sections provided.
  lit.makeHtml = function(s) {
    var section, i, comments, code;
    if (typeof s === 'string') s = lit.parse(s).sections;
    var html = '<div class="lit">\n';
    for (i = 0; (section = s[i]); i++) {
      comments = section.comments ? lit.renderComment(section.comments) : '';
      if (whitespaceOnlyRe.test(comments)) comments = '&nbsp;';
      code = section.code ? lit.renderCode(section.code) : '';
      html += ( '<section>\n' 
              + '<div class="lit-comment">\n' + comments + '\n</div>\n'
              + '<code class="lit-code">\n' + code + '\n</code>\n'
              + '</section>\n' );
    }
    html += '</div>\n';
    return html;
  }

  // Install default comment render hook
  var hookRenderComment = function(Showdown) {
    lit.renderComment = function(src) {
      src = lit.escapeHtml(src);
      var converter = new Showdown.converter();
      return converter.makeHtml(src);
    }
  };

  // Install default code render hook
  var hookRenderCode = function(highlight) {
    lit.renderCode = function(src) {
      var hl = highlight.highlight('javascript', src);
      return hl.value;
    }
  };

  // Loaded via AMD
  if (typeof define === 'function' && define.amd) {
    define(['showdown', 'highlight'], function(Showdown, highlight) {
      if (Showdown) hookRenderComment(Showdown);
      if (highlight) hookRenderCode(highlight);
      lit.amd = true;
      return lit;
    });
  // Loaded via CommonJS/Node
  } else if (typeof require === 'function' && module) {
    hookRenderComment(require('./showdown')); // Use local fork of ghm
    hookRenderCode(require('highlight.js'));
    module.exports = lit;
  // Global script-include
  } else {
    window.lit = lit;
    if (typeof Showdown !== 'undefined') {
      if (typeof Showdown.parse === 'function') {
        // github-flavored-markdown
        lit.renderComment = Showdown.parse;
      } else {
        lit.renderComment = function(src) {
          var converter = new Showdown.converter();
          return converter.makeHtml(src);
        }
      }
    }
  }
}).call(this);
