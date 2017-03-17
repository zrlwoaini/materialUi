/* 
* @Author: ermin.zem
* @Date:   2015-06-10 10:14:35
* @Last Modified by:   gbk
* @Last Modified time: 2016-04-05 21:28:09
*/

"use strict";

var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var shutils = require("shutils");
var filesystem = shutils.filesystem;
var StringUtils = require("underscore.string");

var gulp = require("@ali/nowa-common");
var uglify = require("gulp-uglify");
var GulpCmdNice = require("gulp-cmd-nice");
var rename = require("gulp-rename");
var gulpFilter = require("gulp-filter");
var gulpif = require("gulp-if");
var less = require("gulp-less");
var minifyCSS = require("gulp-minify-css");
// var GulpChanged = require("@ali/gulp-changed");
var CmdNice = require("cmd-nice");
var getRepoInfo = require("./lib/repoInfo");
var yargs = require("yargs");

// read abc.json
try {
    var abc = {};
    if (fs.existsSync("abc.json")) {
        abc = JSON.parse(fs.readFileSync("abc.json", "utf-8"));
    }
    abc.options = abc.options || {};
    abc.options.type = abc.options.type || "web";
    yargs.alias('buildTo', 'dist').default(abc.options);
} catch (e) {
    console.log("Error parse 'abc.json'");
    process.exit(1);
}

var argv = yargs.argv;
var repoInfo = getRepoInfo(argv);

var Server = require("nodewebx-server-lite");

var isNotDebugFile = function(file) {
    var stats = fs.lstatSync(file.path);
    return stats.isFile() && !/\-debug.*?\.js/.test(file.path);
};

var isAbsolutePath = function(filePath) {
    return path.resolve(filePath) === path.normalize(filePath);
};

var findAllFilePathsByExtName = function(rootPath, extName) {
    return _.uniq(_.filter(filesystem.listTreeSync(rootPath), function(filePath) {
        return path.extname(filePath) === extName;
    }));
};

var filterByRequire = function(filePath, dependencyUtils, rootPath) {
    var keywords = StringUtils.lstrip(fs.realpathSync(filePath), {source: rootPath});
    keywords = StringUtils.lstrip(keywords, {source: "/"});
    var whoDepend = dependencyUtils.analyseWhoDepend(keywords);
    return whoDepend.length > 0;
};

var idRule = function(name, cmd) {
    cmd = cmd === undefined ? !argv.nonCmd : cmd;
    if (cmd) {
        return [
            repoInfo.group,
            repoInfo.name,
            repoInfo.version,
            name.replace(/\.jsx$/, '')
        ].join("/");
    } else {
        return name.replace(/\.jsx$/, '');
    }
}

var options = {
    transport: {
        total: null,
        success: null,
        fail: function(result) {
            if (result.error.level === 'error') {
                process.exit(1);
            }
        }
    },
    debug: {
        total: null,
        success: null,
        fail: null
    },
    concat: {
        total: null,
        success: null,
        fail: null
    },
    sourcePath: argv.src || "src",
    distPath: argv.dist || "dist"
};

if (argv.lessSource) {
    argv.lessSource = argv.lessSource.replace(/^\//, '');
}
if (argv.config) {
    argv.config = argv.config.replace(/^\//, '');
}

var sourcePath = options.sourcePath;
var distPath = options.distPath;
if (!isAbsolutePath(sourcePath)) {
    sourcePath = path.normalize(path.join(process.cwd(), sourcePath));
}
if (!isAbsolutePath(distPath)) {
    distPath = path.normalize(path.join(process.cwd(), distPath));
}

// seajs的别名和路径
var configFileContent = {
    alias: {},
    paths: {}
};
if (repoInfo.spm) {
    configFileContent.alias = repoInfo.spm.alias || {};
}
var configFile = path.join(sourcePath, argv.config || "config.js");
var isConfigFileExist = fs.existsSync(configFile);
if (isConfigFileExist) {
    configFileContent = fs.readFileSync(configFile, "utf-8");
    configFileContent = eval(configFileContent);
    // 去掉path中配置的绝对路径
    var keys = [];
    var paths = configFileContent.paths = configFileContent.paths || {};
    for (var key in paths) {
        if (/^(https?:)?\/\//.test(paths[key])) {
            keys.push(key);
        }
    }
    for (var i = 0; i < keys.length; i++) {
        delete paths[keys[i]];
    }
}

var dependencyUtils = new CmdNice.DependencyUtils({
    rootPath: sourcePath,
    alias: configFileContent.alias,
    aliasPaths: configFileContent.paths
});

var transportConfig = {
    debug: true,
    useCache: true,
    rootPath: sourcePath,
    paths: [
        sourcePath
    ],
    ignoreTplCompile: !!argv.ignoreTplCompile,
    alias: configFileContent.alias,
    aliasPaths: configFileContent.paths,
    handlebars: {
        id: configFileContent.alias.handlebars || "alinw/handlebars/1.3.0/runtime"
    },
    lessOptions: {
        paths: findAllFilePathsByExtName(sourcePath, ".less")
    },
    cssOptions: {
        paths: findAllFilePathsByExtName(sourcePath, ".css")
    },
    idRule: idRule,
    total: options.transport.total,
    success: options.transport.success,
    fail: options.transport.fail
};

var debugOptions = {
    paths: [
        distPath
    ],
    total: options.debug.total,
    success: options.debug.success,
    fail: options.debug.fail
};

var getTransportSource = function() {
    return gulp.src([
        sourcePath + "/**/*.js",
        sourcePath + "/**/*.jsx",
        sourcePath + "/**/*.handlebars",
        sourcePath + "/**/*.tpl"
    ]);
};

var handleTransport = function(source) {
    return source
        // 可能导致重复 concat
        // .pipe(GulpChanged(distPath, {
        //     extensions: {
        //         '.handlebars': '.handlebars.js'
        //     }
        // }))
        .pipe(gulpFilter(function(file) {
            var extName = path.extname(file.path);
            if (extName === ".js" || extName === ".jsx" || extName === ".handlebars" || extName === ".tpl"){
                return true;
            }else{
                if(extName === ".css") return false;
            }
            return filterByRequire(file.path, dependencyUtils, transportConfig.rootPath);
        }))
        .pipe(GulpCmdNice.cmdTransport(transportConfig))
        .pipe(uglify({
            mangle: false,
            compress: {
                warnings: false,
                drop_console: true
            },
            beautify: false,
            report: "min",
            preserveComments: false
        }))
        .pipe(rename(function(file) {
            var extName = file.extname;
            if(extName == ".handlebars"){
                file.extname = ".handlebars.js";
            }else if(extName == ".tpl"){
                file.extname = ".tpl.js";
            }else{
                file.extname = ".js";
            }
        }))
        .pipe(gulp.dest(distPath))
        .pipe(GulpCmdNice.cmdDebug(debugOptions))
        .pipe(rename(function(file) {
            var extName = path.extname(file.basename);
            if (!extName) {
                file.extname = "-debug.js"
            }
            else {
                file.basename = StringUtils.rstrip(file.basename, {source: extName});
                file.extname = "-debug" + extName + file.extname;
            }
        }))
        .pipe(gulp.dest(distPath))
};

gulp.task("transport", function() {
    return handleTransport(getTransportSource());
});

gulp.task("concat_scripts", ["transport"], function() {
    var source = distPath + "/**/*.js";
    if (repoInfo.spm && repoInfo.spm.output && repoInfo.spm.output.length) {
        source = repoInfo.spm.output.map(function(n) {
            return distPath + "/" + n;
        });
    }
    return gulp.src(source, { base: distPath + "/" })
        .pipe(gulpFilter(function(file) {
            return path.extname(file.path) === ".js";
        }))
        .pipe(GulpCmdNice.cmdConcat({
            paths: [
                distPath
            ],
            useCache: true,
            idExtractor: function(name) {
                var pattern = new RegExp(idRule("(.*)", true), "g");
                var matched = pattern.exec(name);
                if (matched) {
                    return matched[1];
                } else {
                    return name;
                }
            },
            total: options.concat.total,
            success: options.concat.success,
            fail: options.concat.fail
        }))
        // .pipe(gulp.dest(distPath))
        // .pipe(gulpif(isNotDebugFile, uglify({
        //     mangle: false,
        //     compress: {
        //         warnings: false,
        //         drop_console: true
        //     },
        //     beautify: false,
        //     report: "min",
        //     preserveComments: false
        // })))
        .pipe(gulp.dest(distPath));
});

gulp.task("less", function() {
    var base = sourcePath + "/";
    return gulp.src(base + (argv.lessSource || "**/*.less"), { base: base })
        .pipe(less({
            paths: findAllFilePathsByExtName(sourcePath, ".less"),
            cleancss: true,
            compress: false,
            ieCompat: true
        }))
        .pipe(gulp.dest(sourcePath));
});

gulp.task("cssmin", ["less"], function() {
    return gulp.src(sourcePath + "/**/*.css")
        .pipe(minifyCSS({
            keepBreaks:false,
            keepSpecialComments: 0,
            benchmark: false,
            debug: false,
            compatibility: true,
            noAdvanced: true,
            processImport: true
        }))
        .pipe(gulp.dest(distPath));
});

gulp.task("copy", function() {
    return gulp.src([
        sourcePath + "/**/*.jpg",
        sourcePath + "/**/*.jpeg",
        sourcePath + "/**/*.gif",
        sourcePath + "/**/*.png",
        sourcePath + "/**/*.eot",
        sourcePath + "/**/*.svg",
        sourcePath + "/**/*.ttf",
        sourcePath + "/**/*.woff",
        sourcePath + "/**/*.swf",
        sourcePath + "/**/*.html",
        sourcePath + "/../sea-modules/**/*"
    ]).pipe(gulp.dest(distPath));
});

// run nodewebx server
gulp.task("server", function() {
    var server = new Server({});
    server.execute();
});

gulp.task("default", [
    argv.standalone ? "concat_scripts" : "transport",
    "cssmin",
    "copy"
]);

module.exports = gulp;
