;(function() {
  var commentRe = /^\s*\/\/\s*/;
  var lit = {};
  var render = function(src) {return src};
  lit.parse = function(src) {
    var sections = [];
    var lines = src.split('\n');
    var i, line, comments = '', code = '';
    for (i = 0; (line = lines[i]); i++) {
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
  if (typeof define === 'function' && define.amd) {
    define(['showdown'], function(showdown) {
      if (showdown) render = showdown.makeHtml;
      lit.amd = true;
      return lit;
    });
  } else if (typeof require === 'function' && module) {
    var showdown = new (require('showdown').converter)()
    render = showdown.makeHtml;
    module.exports = lit;
  } else {
    window.lit = lit;
  }
}).call(this);
