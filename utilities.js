const U = {};
const fs = require('fs');

U.Log = function () {
	console.log('📸 ', ...arguments)
}

U.Err = function (error) {
	console.error('📸 \x1b[31m%s\x1b[0m', error);
}

U.manifestPath = function () {
	return `${process.cwd()}/minimage.json`;
}

U.configPath = function () {
	return `${process.cwd()}/.minimage`;
}

U.config = function () {
	const config = JSON.parse(
		fs.readFileSync(U.configPath(), 'utf8')
	);

	return config;
}

module.exports = U;