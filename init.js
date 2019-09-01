const { fs, Log, MANIFEST_PATH, CONFIG_PATH } = require('./utilities');

Log('Initialising minimage');
Log('Generating Manifest');

const configStub = `${__dirname}/stubs/minimage.config.js`;
const configOutout = CONFIG_PATH;

// Publishing config
if (fs.existsSync(configOutout)) {
	Exception(`A config already exists - please remove first e.g`);
	Exception(`$ rm ${configOutout}`);
} else {
	fs.copyFileSync(configStub, configOutout);
	Log(`Config generated @ ${configOutout}`);
}

const manifestStub = `${__dirname}/stubs/minimage.json`;
const manifestOutout = MANIFEST_PATH

// Publishing Manifest
if (fs.existsSync(manifestOutout)) {
	Exception(`A manifest already exists - please remove first e.g`);
	Exception(`$ rm ${manifestOutout}`);
} else {
	fs.copyFileSync(manifestStub, manifestOutout);
	Log(`Manifest generated @ ${manifestOutout}`);
	Log('Please edit the minimage.comfig.js to update your paths and API keys - You can get an API key from https://tinypng.com/developers');
}



