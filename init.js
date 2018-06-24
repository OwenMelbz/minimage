const fs = require('fs');
const U = require('./utilities');

U.Log('Initialising minimage');
U.Log('Generating Manifest');

const configStub = `${__dirname}/stubs/.minimage`;
const configOutout = `${process.cwd()}/.minimage`;

// Publishing config
if (fs.existsSync(configOutout)) {
	U.Log(`A config already exists - please remove first e.g`);
	return U.Log(`$ rm ${configOutout}`);
}

fs.copyFileSync(configStub, configOutout);

U.Log(`Config generated @ ${configOutout}`);

const manifestStub = `${__dirname}/stubs/minimage-manifest.json`;
const manifestOutout = `${process.cwd()}/minimage-manifest.json`;

// Publishing Manifest
if (fs.existsSync(manifestOutout)) {
	U.Log(`A manifest already exists - please remove first e.g`);
	return U.Log(`$ rm ${manifestOutout}`);
}

fs.copyFileSync(manifestStub, manifestOutout);

U.Log(`Manifest generated @ ${manifestOutout}`);
