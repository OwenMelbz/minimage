const fs = require('fs');
const U = require('./utilities');

if (!fs.existsSync(U.configPath())) {
	U.Err('Cannot find config - make sure you run "./node_modules/.bin/minimage init" first.');
}

if (!fs.existsSync(U.manifestPath())) {
	U.Err('Cannot find manifest - make sure you run "./node_modules/.bin/minimage init" first.');
}
