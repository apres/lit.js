;(function() {
  var commentRe = /^\s*\/\/\s*/;
  var lit = {};

  // _Render comments to HTML_
  //
  // This defaults to showdown's makeHtml() function, if available
  // otherwise it is a no-op. Applications can plug in there
  // own function here to format comments anyway desired.
  lit.renderComment = function(src) {return src};

  // _Render code to HTML_
  //
  lit.renderCode = function(src) {return src};

  // _Parse source code into sections_
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
      if (line.match(commentRe)) {
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

  // _Create html from source, or parsed sections_
  //
  // Return an HTML fragment for the source or parsed sections
  // provided.
  lit.makeHtml = function(s) {
    var section, i, comments, code;
    if (typeof s === 'string') s = lit.parse(s).sections;
    var html = '<div class="lit">\n';
    for (i = 0; (section = s[i]); i++) {
      comments = section.comments ? lit.renderComment(section.comments) : '';
      code = section.code ? lit.renderCode(section.code) : '';
      html += ( '<section>\n' 
              + '<div class="comment">\n' + comments + '\n</div>\n'
              + '<code>\n' + code + '\n</code>\n'
              + '</section>\n' );
    }
    html += '</div>';
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
