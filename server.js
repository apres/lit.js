var http = require('http'),
    static = require('node-static');

var file = new (static.Server)('./');

http.createServer(function(req, res) {
  req.addListener('end', function() {
    file.serve(req, res);
  });
}).listen(5000);

console.log("Lit-examples now being server at http://localhost:5000");
