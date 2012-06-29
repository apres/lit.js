// lit.js - Micro-literate programming library inspired by docco
// By Casey Duncan
// https://github.com/apres/lit.js
// Part of the Apres suite - http://apres.github.com/
// Lit is freely distributable under the MIT license.

;(function() {
  var commentRe = /^\s*\/\/\s*/;
  var whitespaceOnlyRe = /^\s*$/;
  var lit = {};

  // ##Render comments to HTML##
  //
  // This defaults to showdown's makeHtml() function, if available
  // otherwise it is a no-op. Applications can plug in their
  // own function here to format comments anyway desired.
  lit.renderComment = function(src) {return src};

  // ##Render code to HTML##
  //
  lit.renderCode = function(src) {
    return String(src)
      .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  //## pre-process code
  //
  // This function is used to process code strings before feeding them
  // to the syntax highlighter. The default behavior is to strip leading
  // and trailing newlines.
  lit.preprocessCode = function(s) {
    return s.replace(/^\n*/, '').replace(/\n*$/, '')
  }

  // ##Parse source code into sections##
  //
  // Produces an object with an attribute `sections`, an array of
  // objects containing the code and comments for each code section.
  // Each section is denoted by one or more leading comments
  lit.parse = function(src) {
    var sections = [];
    var lines = src.split('\n');
    var i, line, comments = '', code = '';
    for (i = 0; i < lines.length; i++) {
      line = lines[i];
      if (commentRe.test(line)) {
        if (code) {
          sections.push({comments: comments, code: lit.preprocessCode(code)});
          comments = ''; code = '';
        }
        comments += line.replace(commentRe, '') + '\n';
      } else {
        code += line + '\n';
      }
    }
    if (code || comments) {
      sections.push({comments: comments, code: lit.preprocessCode(code)});
    }
    return {sections: sections};
  }

  // ##Create html from source, or parsed sections##
  //
  // Return an HTML fragment for the source or parsed sections
  // provided.
  lit.makeHtml = function(s) {
    var section, i, comments, code;
    if (typeof s === 'string') s = lit.parse(s).sections;
    var html = '<div class="lit">\n';
    for (i = 0; (section = s[i]); i++) {
      comments = section.comments ? lit.renderComment(section.comments) : '';
      if (whitespaceOnlyRe.test(comments)) comments = '&nbsp;';
      code = section.code ? lit.renderCode(section.code) : '';
      html += ( '<section>\n' 
              + '<div class="comment">\n' + comments + '\n</div>\n'
              + '<div class="code">\n' + code + '\n</div>\n'
              + '</section>\n' );
    }
    html += '</div>\n';
    return html;
  }

  // Loaded via AMD
  if (typeof define === 'function' && define.amd) {
    define(['showdown'], function(showdown) {
      if (showdown) lit.renderComment = showdown.makeHtml;
      lit.amd = true;
      return lit;
    });
  // Loaded via CommonJS/Node
  } else if (typeof require === 'function' && module) {
    var showdown = new (require('showdown').converter)()
    lit.renderComment = showdown.makeHtml;
    module.exports = lit;
  // Global script-include
  } else {
    window.lit = lit;
    if (typeof Showdown !== 'undefined') {
      lit.renderComment = new Showdown.converter().makeHtml;
    }
  }
}).call(this);
