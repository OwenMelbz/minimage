const U = require('./utilities');
const fs = require('fs');
const tinify = require('tinify');
const crypto = require('crypto');
const glob = require('glob-all');
const svgo = new (require('svgo'))({
    plugins: [
        {cleanupIDs: false},
        {removeHiddenElems: false}
    ]
});

if (!fs.existsSync(U.configPath())) {
	return U.Err('Cannot find config - make sure you run "./node_modules/.bin/minimage init" first.');
}

if (!fs.existsSync(U.manifestPath())) {
	return U.Err('Cannot find manifest - make sure you run "./node_modules/.bin/minimage init" first.');
}

const config = U.config();
config.manifest = U.manifestPath();

const minifier = function(config) {
    this.config = config;
    this.imagesToOptimise = [];
    this.imagesInFolder = [];
    this.currentlyOptimising = 0;

    if (fs.existsSync(this.config.manifest)) {
        this.imageManifest = require(this.config.manifest);
    } else {
        this.imageManifest = [];
    }

    tinify.key = this.config.tinypng_key;

    this.getImages = function() {
        let deduped = [],
            notExcluded = [];

        this.imagesInFolder = [];

        // Fetch all the images to start with
        this.config.paths.forEach(path => {
            try {
                this.imagesInFolder = this.imagesInFolder.concat(glob.sync(path));
            } catch (err) {
                U.Err(err);
            }
        });

        U.Log(`Minimage: Found ${this.imagesInFolder.length} image(s) to in total`);

        // Clean out any strangly duplicated ones
        this.imagesInFolder.forEach(file => {
            if (deduped.indexOf(file) === -1) {
                deduped.push(file);
            }
        });

        this.imagesInFolder = deduped;

        // Remove any from the exclusions
        this.imagesInFolder.forEach(file => {
            if (config.exclusions.indexOf(file) === -1) {
                notExcluded.push(file);
            }
        });

        this.imagesInFolder = notExcluded;

        // Check against the image manifest to see if it needs re-optimising
        this.imagesInFolder.forEach(file => {
            let map = this.getHashMap(file),
                addIt = true;

            this.imageManifest.forEach(prev => {
                if (prev.file == file && map.hash !== prev.hash) {
                    map.needsUpdate = true;
                } else if (prev.file == file && map.hash === prev.hash) {
                    addIt = false;
                }
            });

            if (addIt) {
                this.imagesToOptimise.push(map);
            }
        });

        U.Log(`Minimage: Found ${this.imagesToOptimise.length} image(s) to compress`);

        return this.imagesToOptimise;
    };

    this.getHashMap = function(file) {
        let data = fs.readFileSync(file),
            hash = crypto
                .createHash('md5')
                .update(data, 'utf8')
                .digest('hex');

        return {
            size: data.length / 1000 + 'kb',
            hash: hash,
            file: file,
            needsUpdate: false,
        };
    };

    this.tinyPNG = function(image, complete) {
        U.Log(`TinyPNG: Compressing ${image.file}`);

        return tinify.fromFile(image.file).toFile(image.file, () => {
            return this.singleOptimisationComplete(image, 'TinyPNG', complete);
        });
    };

    this.SVGO = function(image, complete) {
        U.Log(`SVGO: Optimising ${image.file}`);

        const originalXML = fs.readFileSync(image.file, 'utf8');

        return svgo.optimize(originalXML)
        .then(result => {
            return fs.writeFile(image.file, result.data, () => {
                return this.singleOptimisationComplete(image, 'SVGO', complete);
            });
        })
        .catch(err => {
            U.Log(err);
            
            return this.singleOptimisationComplete(image, 'SVGO', complete);
        });
    };

    this.singleOptimisationComplete = function(image, toolName, complete) {
        let newMap = this.getHashMap(image.file);

        U.Log(`${toolName}: Reduced from ${image.size} to ${newMap.size}`);

        if (image.needsUpdate) {
            this.imageManifest.forEach((old, key) => {
                if (old.file == image.file) {
                    this.imageManifest[key] = newMap;
                }
            });
        } else {
            this.imageManifest.push(newMap);
        }

        return this.saveManifest(this.imageManifest, () => {
            this.currentlyOptimising++;
            this.optimiseNow(complete);
        });
    };

    this.optimiseNow = function(complete) {
        let image = this.imagesToOptimise[this.currentlyOptimising];

        if (!image) {
            U.Log('Minimage: All images processed');
            return complete();
        }

        // Bitmap or SVG?
        if (image.file.indexOf('.svg') !== -1) {
            return this.SVGO(image, complete);
        }

        return this.tinyPNG(image, complete);
    };

    this.saveManifest = function(manifest, callback = null) {
        return fs.writeFile(this.config.manifest, JSON.stringify(manifest, null, 4), err => {
            return callback ? callback() : null;
        });
    };

    this.tidyManifest = function() {
        let cleanManifest = [];
        const fileLength = this.imagesInFolder.length;
        const manifestLength = this.imageManifest.length;

        if (manifestLength > fileLength) {
            U.Log(
                `Minimage: Manifest contains ${manifestLength} images, folders only contain ${fileLength} - cleaning manifest`
            );
        }

        this.imageManifest.forEach(image => {
            if (this.imagesInFolder.indexOf(image.file) !== -1) {
                if (cleanManifest.indexOf(image) === -1) {
                    cleanManifest.push(image);
                }
            }
        });

        //Only use this method if we're rebuilding
        //the manifest from file system.
        this.imagesInFolder.forEach(path => {
            cleanManifest.push(this.getHashMap(path));
        });

        return this.saveManifest(cleanManifest);
    };

    this.start = function() {
        this.getImages();
        this.optimiseNow(() => {
            this.tidyManifest(() => {
                U.Log(`Minimage: ${this.currentlyOptimising} image(s) compressed`);
            });
        });
    };
};

const processor = new minifier(config);

U.Log('TinyPNG: Connecting...');

tinify.validate(function(err) {
    if (err) {
        throw err;
    }

    if (tinify.compressionCount >= 500) {
        return U.Err(
            `TinyPNG: You've used ${
                tinify.compressionCount
            } compressions up - define a new api key for more`
        );
    } else {
        let left = 500 - tinify.compressionCount;

        U.Log(`TinyPNG: ${left} compressions left this month`);
    }

    return processor.start();
});
