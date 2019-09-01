const fs = require('fs');

const MANIFEST_PATH = `${process.cwd()}/minimage.json`;

const CONFIG_PATH = `${process.cwd()}/minimage.config.js`;

const Log = function () {
    return console.log('📸 ', ...arguments)
}

const Exception = error => console.error('📸 \x1b[31m%s\x1b[0m', error);

const asyncForEach = async function (array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

module.exports = {
    fs,
    Log,
    Exception,
    MANIFEST_PATH,
    CONFIG_PATH,
    asyncForEach,
}
