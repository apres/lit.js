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
    requirejs(['lit'], function(lit) {
      assert.isFunction(lit.parse);
      assert.ok(lit.amd);
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
  assert.deepEqual(lit.parse(''), {sections: [{comments: '', code: '\n'}]});
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
    'var foo = function() {\n  return true;\n}\n');
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
  assert.strictEqual(res.sections[0].code, 'var one;\n');
  assert.strictEqual(res.sections[1].comments, 'Two\n');
  assert.strictEqual(res.sections[1].code, 'var two;\nsomething();\n\nanother()\n\n');
  assert.strictEqual(res.sections[2].comments, 'Three\n\nMore comments\n');
  assert.strictEqual(res.sections[2].code, 'three();\n');
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
  assert.strictEqual(lines[lines.length-1], '</div>');
});

test('#section structure', function() {
  var lit = require('../lib/lit');
  var sections = [
    {comments: 'Comment 1', code: 'Code 1'},
  ];
  var html = lit.makeHtml(sections);
  var lines = html.split('\n');
  assert.strictEqual(lines[1], '<section>');
  assert.strictEqual(lines[2], '<div class="comment">');
  assert.strictEqual(lines[4], '</div>');
  assert.strictEqual(lines[5], '<code>');
  assert.strictEqual(lines[7], '</code>');
  assert.strictEqual(lines[8], '</section>');
});

test('#section content', function() {
  var lit = require('../lib/lit');
  var sections = [
    {comments: 'Comment 1', code: 'Code 1'},
    {comments: 'Comment 2', code: 'Code 2'},
    {comments: 'Comment 3', code: 'Code 3'},
  ];
  var html = lit.makeHtml(sections);
  var split = html.split('<section>');
  assert.equal(split.length, 4);
  assert.notEqual(split[1].indexOf('Code 1'), -1);
  assert.notEqual(split[1].indexOf('Comment 1'), -1);
  assert.equal(split[1].indexOf('Code 2'), -1);
  assert.equal(split[1].indexOf('Code 3'), -1);
  assert.notEqual(split[2].indexOf('Code 2'), -1);
  assert.notEqual(split[2].indexOf('Comment 2'), -1);
  assert.equal(split[2].indexOf('Code 1'), -1);
  assert.equal(split[2].indexOf('Code 3'), -1);
  assert.notEqual(split[3].indexOf('Code 3'), -1);
  assert.notEqual(split[3].indexOf('Comment 3'), -1);
  assert.equal(split[3].indexOf('Code 1'), -1);
  assert.equal(split[3].indexOf('Code 2'), -1);
});
