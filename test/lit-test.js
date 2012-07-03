var chai = require('chai');
var assert = chai.assert;
var requirejs = require('requirejs');
var fs = require('fs');
window = undefined;

suite('lit module');
test('#node require', function() {
  var lit = require('../lib/lit');
  assert.isFunction(lit.parse);
  assert.ok(!lit.amd);
});

test('#requirejs require', function(done) {
  requirejs.config({baseUrl: 'lib', nodeRequire: requirejs});
    requirejs(['lit', 'showdown', 'highlight'], function(lit, showdown, highlight) {
      assert.isFunction(lit.parse);
      assert.ok(lit.amd, 'lit not amd');
      assert.ok(showdown, 'showdown not loaded');
      assert.ok(highlight, 'highlight not loaded');
      done();
    }, 
    function(err) {done(err)});
});

test('#old-skool browser global', function() {
  var src = fs.readFileSync(__dirname + '/../lib/lit.js');
  var node_module = module;
  module = undefined;
  window = {};
  try {
    eval(src.toString());
    assert.isFunction(window.lit.parse);
  } finally {
    module = node_module;
    window = undefined;
  }
});

suite('lit.parse()');

test('#empty doc', function() {
  var lit = require('../lib/lit');
  assert.deepEqual(lit.parse(''), {sections: []});
});

test('#single section', function() {
  var lit = require('../lib/lit');
  var src = ( '// First Line\n'
            + '// Second Line\n'
            + 'var foo = function() {\n'
            + '  return true;\n'
            + '}');
  var res = lit.parse(src);
  assert.equal(res.sections.length, 1);
  assert.strictEqual(res.sections[0].comments, 'First Line\nSecond Line\n');
  assert.strictEqual(res.sections[0].code, 
    'var foo = function() {\n  return true;\n}');
});

test('#multi section', function() {
  var lit = require('../lib/lit');
  var src = ( '// One\n'
            + 'var one;\n'
            + '// Two\n'
            + 'var two;\n'
            + 'something();\n\n'
            + 'another()\n\n'
            + '// Three\n'
            + '//\n'
            + '// More comments\n'
            + 'three();');
  var res = lit.parse(src);
  assert.equal(res.sections.length, 3);
  assert.strictEqual(res.sections[0].comments, 'One\n');
  assert.strictEqual(res.sections[0].code, 'var one;');
  assert.strictEqual(res.sections[1].comments, 'Two\n');
  assert.strictEqual(res.sections[1].code, 'var two;\nsomething();\n\nanother()');
  assert.strictEqual(res.sections[2].comments, 'Three\n\nMore comments\n');
  assert.strictEqual(res.sections[2].code, 'three();');
});

suite('lit.makeHtml()');

test('#div wrapper', function() {
  var lit = require('../lib/lit');
  var sections = [
    {comments: 'Comment 1', code: 'Code 1'},
    {comments: 'Comment 2', code: 'Code 2'}
  ];
  var html = lit.makeHtml(sections);
  var lines = html.split('\n');
  assert.strictEqual(lines[0], '<div class="lit">');
  assert.strictEqual(lines[lines.length-2], '</div>');
});

test('#section structure', function() {
  var lit = require('../lib/lit');
  var sections = [
    {comments: 'Comment 1', code: 'Code 1'},
  ];
  var html = lit.makeHtml(sections);
  var lines = html.split('\n');
  assert.strictEqual(lines[1], '<section>');
  assert.strictEqual(lines[2], '<div class="lit-comment">');
  assert.strictEqual(lines[4], '</div>');
  assert.strictEqual(lines[5], '<code class="lit-code">');
  assert.strictEqual(lines[7], '</code>');
  assert.strictEqual(lines[8], '</section>');
});

test('#section content', function() {
  var lit = require('../lib/lit');
  var sections = [
    {comments: 'Comment 1', code: 'Code One'},
    {comments: 'Comment 2', code: 'Code Two'},
    {comments: 'Comment 3', code: 'Code Three'},
  ];
  var html = lit.makeHtml(sections);
  var split = html.split('<section>');
  assert.equal(split.length, 4);
  assert.include(split[1], 'Code One');
  assert.include(split[1], 'Comment 1');
  assert.equal(split[1].indexOf('Code Two'), -1);
  assert.equal(split[1].indexOf('Code Three'), -1);
  assert.include(split[2], 'Code Two');
  assert.include(split[2], 'Comment 2');
  assert.equal(split[2].indexOf('Code One'), -1);
  assert.equal(split[2].indexOf('Code Three'), -1);
  assert.include(split[3], 'Code Three');
  assert.include(split[3], 'Comment 3');
  assert.equal(split[3].indexOf('Code One'), -1);
  assert.equal(split[3].indexOf('Code Two'), -1);
});

test('#preprocess collapses empty lines', function() {
  var lit = require('../lib/lit');
  var src = '// Comments\n\n\nSome\n\nCode';
  var html = lit.makeHtml(src);
  assert.include(html, '<code class="lit-code">\nSome\n\nCode\n</code>');
});

test('#html escaped in comments', function() {
  var lit = require('../lib/lit');
  var src = '// <a> anchor';
  var html = lit.makeHtml(src);
  assert.include(html, '&lt;a&gt; anchor');
});

test('#empty lines between comments collapsed', function() {
  var lit = require('../lib/lit');
  var src = '// Comment One\n\n// Comment Two\n// Comment Two More\n\n\n\n// Comment Three';
  var sections = lit.parse(src).sections;
  assert.equal(sections.length, 1);
  assert.strictEqual(sections[0].code, '');
  assert.strictEqual(sections[0].comments, 
    'Comment One\n\nComment Two\nComment Two More\n\n\n\nComment Three\n');
});

