# 📸 Minimage

Minimage is a CLI tool to optimise raster and SVG images with a bit of a differenace, its main 3 differences are

- It uses a manifest allowing you to resume stop/start at any time
- It uses a remote optimisation system - TinyPNG
- Can be run server side on cron jobs

### Manifest

The manifest itself is a JSON collection of all the images it has processed - this should be commited to your version control to make sure other team members don't double compress images.

Each file that is processed will have an entry in the manifest storing a hash of it, allowing us to detect if the file has changed before re-optimising, if the hash has not changed it will skip to make sure you do not lose more quality.

### Tinypng

We've optied to use TinyPNG as it is much faster than running it on your local machine, it also allows you to get the latest optimisation techniques as soon as they're available without updating your local systems. It also means you only have to have Node installed on your system to use it, rather than all the optimisation binaries.

The downside is that the free plan only has 500 optimisations a month (svg is not included)

### Server side

As it is just a nodejs script, if you have the node binaries on your server, you can set up a cron job to run the script every day or so keep user uploaded content optimised as well.

# Installation

To add to your project do a normal `npm i minimage` or `yarn add minimage`

Once installed you can setup a script alias within the "scripts" section of your package.json or access the binary directly via `./node_modules/.bin/minimage`

First you'll need to generate the manifest and config file with `minimage init`

This will create you a
- .minimage
- minimage.json

The `.minimage` is your config, you can use normal glob patterns and the `minimage.json` will contain an empty array to start with and will be built up over time.

# Configuration

Your config will look something like:

```
{
    "tinypng_key": "XXXXXXXXXXXXXXXXX",
    "paths": [
      "./web/assets/**/*.{png,jpg,gif,svg}",
      "./web/uploads/**/*.{png,jpg,gif,svg}",
    ],
    "exclusions": []
  }
```
- Add your TinyPNG key to the config which you can get from https://tinypng.com/developers
- Add your array of paths to check for images
- Enter the full path to specific images you want to exclude

# Usage

Once installed you should simply run `./node_modules/.bin/minimage` and it will process your images one by one.

