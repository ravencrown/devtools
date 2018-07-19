/**
 * @file
 * @author tanghao
 * @date 2018/4/25
 */

const pkg = require('../package.json');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2), {
    string: ['output', 'swan-core-path', 'work-path', 'sourcemap', 'uglify']
});

if (argv.v || argv.version) {
    console.info(pkg.version);
    process.exit(0);
}

if (argv.h || argv.help) {
    const help = `
    Options:
        -v, --version                   output the version number
        -h, --help                      output usage information
        --output                        File name where to store the resulting output
        --swan-core-path                swan-core lib path
        --work-path                     setting up your work-path
        --compiled-core-path            compiled core path，default null
        --sourcemap [boolean]           default true
        --compile-subpackage [boolean]  default false
        --compile-old-html [boolean]    default false
        --uglify [boolean]              default false
        --san-dev-hook [boolean]        default false
        --no-color                      will force to not display colors even when color support is detected
        watch                           gulp watch
        watchremote                     gulp watchremote
        compilefull                     gulp compilefull
    `;
    console.info(help);
    process.exit(0);
}

const gulpFilePath = path.resolve(__dirname, '../gulpfile.js');
console.log('argv[compile-subpackage]:::', argv['compile-subpackage']);
global.SWAN_CLI_ARGV = {
    OUTPUT: argv.output,
    WORK_PATH: argv['work-path'] || process.cwd(),
    SWAN_CORE_PATH: argv['swan-core-path'],
    SOURCEMAP: argv['sourcemap'],
    UGLIFY: argv['uglify'],
    SAN_DEV_HOOK: argv['san-dev-hook'],
    COMPILED_CORE_PATH: argv['compiled-core-path'],
    COMPILE_SUBPACKAGE: argv['compile-subpackage'],
    USE_OLD_HTML: argv['compile-old-html'],
    SWAN_CLI_PROCESS: process,
    COMMAND: argv._
};

process.argv.splice(2, 0, '--gulpfile', gulpFilePath);
require('../lib/run');