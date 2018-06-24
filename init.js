const fs = require('fs');
const U = require('./utilities');

U.Log('Initialising minimage');
U.Log('Generating Manifest');

const configStub = `${__dirname}/stubs/.minimage`;
const configOutout = U.configPath();

// Publishing config
if (fs.existsSync(configOutout)) {
	U.Err(`A config already exists - please remove first e.g`);
	U.Err(`$ rm ${configOutout}`);
} else {
	fs.copyFileSync(configStub, configOutout);
	U.Log(`Config generated @ ${configOutout}`);
}

const manifestStub = `${__dirname}/stubs/minimage.json`;
const manifestOutout = U.manifestPath();

// Publishing Manifest
if (fs.existsSync(manifestOutout)) {
	U.Err(`A manifest already exists - please remove first e.g`);
	U.Err(`$ rm ${manifestOutout}`);
} else {
	fs.copyFileSync(manifestStub, manifestOutout);
	U.Log(`Manifest generated @ ${manifestOutout}`);
	U.Log('Please edit the .minimage config to add your paths and API keys - You can get an API key from https://tinypng.com/developers');
}



