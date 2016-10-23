var fs = require('fs');
var path = require('path');

fs.chmodSync(path.join(__dirname,'bin','download'),0755);
