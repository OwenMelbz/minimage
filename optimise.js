const { Log, Exception, MANIFEST_PATH, CONFIG_PATH, fs, asyncForEach } = require('./utilities');
const tinify = require('tinify');
const uniq = require('lodash/uniq');
const filter = require('lodash/filter');
const map = require('lodash/map');
const find = require('lodash/find');
const crypto = require('crypto');
const glob = require('glob-all');
const svgo = new (require('svgo'))({
    plugins: [
        { cleanupIDs: true },
        { prefixIds: true },
        { prefixClassNames: true },
        { removeHiddenElems: false },
        { removeViewBox: false },
    ]
});


if (!fs.existsSync(CONFIG_PATH)) {
    return Exception('Cannot find config - make sure you run "npx minimage init" first.');
}

if (!fs.existsSync(MANIFEST_PATH)) {
    return Exception('Cannot find manifest - make sure you run "npx minimage init" first.');
}

const manifest = require(MANIFEST_PATH);
const config = require(CONFIG_PATH);

// Adds backwards support for configs without "compress_if_larger_than_in_kb"
if (!('compress_if_larger_than_in_kb' in config)) {
    config.compress_if_larger_than_in_kb = 0;
}

class Processor
{

    constructor(config, manifest)
    {
        this.config = config;
        this.manifest = manifest;
        this.images = [];
        this.queue = [];
        this.currentIndex = 0;
    }

    prepareImages()
    {
        Log(`Minimage: Scanning ${this.config.paths.length} directories for files...`);
        this.images = glob.sync(this.config.paths);
        this.images = uniq(this.images);
        this.images = filter(this.images, path => this.config.exclusions.indexOf(path) === -1);

        Log(`Minimage: Found ${this.images.length} image(s) in total`);

        this.queue = map(this.images, path => {
            return this.parsePath(path);
        });

        this.queue = filter(this.queue, file => {
            // It's normally null if the file has been skipped during this.parsePath();
            if (!file) {
                return false;
            }

            const previous = find(this.manifest, f => f.path === file.path);

            if (!previous) {
                return true;
            }

            if (previous.hash !== file.hash) {
                return true;
            }

            return false;
        });

        Log(`Minimage: Found ${this.queue.length} new/updated image(s) to compress`);

        return this;
    }

    parsePath(path)
    {
        const data = fs.readFileSync(path);

        const hash = crypto
            .createHash('md5')
            .update(data, 'utf8')
            .digest('hex');

        const sizeInKb = data.length / 1000;

        if (sizeInKb <= this.config.compress_if_larger_than_in_kb) {
            Log(`Minimage: Skipped ${path} as only ${sizeInKb}kb which is smaller than ${this.config.compress_if_larger_than_in_kb}kb`);
            return null;
        }

        return {
            path,
            hash,
            size: `${sizeInKb}kb`,
        };
    };

    async startOptimising()
    {
        await asyncForEach(this.queue, async item => {
            this.currentIndex++;
            await this.optimiseItem(item);
            await this.updateManifest(item);
        });

        Log('Minimage: All images processed');

        this.cleanupManifest();

        return this;
    }

    optimiseItem(item)
    {
        if (item.path.indexOf('.svg') !== -1) {
            return this.optimiseSvg(item);
        }

        return this.optimiseBitmap(item);
    }

    optimiseSvg({ path })
    {
        return new Promise(async (done, failed) => {
            Log(`SVGO: Optimising ${path} :: ${this.currentIndex}/${this.queue.length}`);

            try {
                const originalXML = fs.readFileSync(path, 'utf8');
                const { data } = await svgo.optimize(originalXML, { path });

                fs.writeFile(path, data, () => done(path));
            } catch (error) {
                Log(error);

                return failed(path);
            }
        })
    }

    optimiseBitmap({ path })
    {
        return new Promise((done, failed) => {
            try {
                Log(`TinyPNG: Compressing ${path} :: ${this.currentIndex}/${this.queue.length}`);
                tinify.fromFile(path).toFile(path, () => done(path))
            } catch (error) {
                Log(error);

                return failed(path);
            }
        })
    }

    updateManifest({ path, size })
    {
        return new Promise(async (done, failed) => {
            const file = this.parsePath(path);
            const previous = find(this.manifest, f => f.path === file.path);

            const toolName = path.indexOf('.svg') === -1 ? 'TinyPNG' : 'SVGO';

            Log(`${toolName}: Reduced from ${size} to ${file.size}`);

            if (!previous) {
                this.manifest.push(file);
            } else {
                Object.assign(previous, file);
            }

            try {
                await this.saveManifest(path);

                return done(path);
            } catch (e) {
                Log(error);

                return failed(path);
            }
        })
    }

    async cleanupManifest()
    {
        if (this.images.length === this.manifest.length) {
            return this;
        }

        Log(`Minimage: Manifest contains ${this.manifest.length} files - but only ${this.images.length} images exist - Cleaning manifest now`);

        this.manifest = filter(this.manifest, file => {
            return find(this.images, f => f === file.path);
        });

        await this.saveManifest();

        Log('Minimage: Manifest cleaned 👍')
    }

    saveManifest(data)
    {
        return new Promise((done, failed) => {
            fs.writeFile(MANIFEST_PATH, JSON.stringify(this.manifest, null, 4), error => {
                if (error) {
                    Log(error);
                    return failed(data);
                }

                return done(data);
            });
        })
    }

    finish()
    {
        Log(`Minimage: ${this.queue.length} image(s) successfully optimised`);

        return this;
    }

}

Log('TinyPNG: Connecting...');

tinify.key = process.env.TINYPNG_KEY || config.tinypng_key;

tinify.validate(err => {
    if (err) throw err;

    if (tinify.compressionCount >= 500) {
        return Exception(
            `TinyPNG: You've used ${
                tinify.compressionCount
            } compressions up - define a new api key for more`
        );
    } else {
        let left = 500 - tinify.compressionCount;

        Log(`TinyPNG: ${left} compressions left this month`);
    }

    const processor = new Processor(config, manifest);

    processor
        .prepareImages()
        .startOptimising();
});
