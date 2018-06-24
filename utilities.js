const U = {};

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

module.exports = U;