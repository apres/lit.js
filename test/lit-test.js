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
  assert.deepEqual(lit.parse(''), {sections: []});
});

test('#single block', function() {
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
