/* jshint camelcase:false */
var pkg = require('./package.json');
var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var paths = require('./gulp.config.json');
var plug = require('gulp-load-plugins')();
var reload = browserSync.reload;
var bowerFiles = require('main-bower-files')({
    paths: {
        bowerrc: './.bowerrc',
        bowerJson: './bower.json'
    }
});

var colors = plug.util.colors;
var env = plug.util.env;
var log = plug.util.log;
var port = process.env.PORT || 7203;

var minHTML = 'html.tpls.js';
var minJS = pkg.name + '.min.js';
var appJS = 'app.min.js';
var vendorJS = 'vendor.min.js';
var minCSS = pkg.name + '.min.css';

gulp.task('default', ['watch'], function () {});

//Run gulp index anytime files are added or deleted to inject/remove them from the index file.
gulp.task('index', [], function () {
    log('adding JS and CSS files to  ' + paths.client + 'index.html ');
    var cssFilter = plug.filter(['**/*.css']);
    var jsFilter = plug.filter(['**/*.js']);
    var vendorCss = gulp.src(bowerFiles, {read: false, base: paths.client})
        .pipe(cssFilter);
    var css = gulp.src(paths.css, {read: false});
    var vendorjs = gulp.src([].concat(bowerFiles), {read: false})
        .pipe(jsFilter);
    var js = gulp.src([].concat(paths.js), {read: false, base: paths.client});

    return gulp.src(paths.client + 'index.html')
        // inject the files into index.html
        .pipe(plug.inject(vendorCss, {name: 'inject-vendor', ignorePath: paths.client.substring(1)}))
        .pipe(plug.inject(css, {ignorePath: paths.client.substring(1)}))
        .pipe(plug.inject(vendorjs, {name: 'inject-vendor', ignorePath: paths.client.substring(1)}))
        .pipe(plug.inject(js, {ignorePath: paths.client.substring(1)}))
        .pipe(gulp.dest(paths.client));
});

gulp.task('build',['inject'], function(){});

gulp.task('inject', ['css','vendorjs','js'], function() {
    log('building distributed index.html');
    return gulp.src(paths.client + 'index.html') //index.html
        .pipe(plug.inject(gulp.src([paths.build + minCSS]), {
            transform: function (filePath, file) {
                return '<style type="text/css">' + file.contents.toString('utf8') + '</style>';
            }
        }))
        .pipe(plug.inject(
            gulp.src([paths.build + vendorJS]), {
                name:'inject-vendor',
                transform: function (filePath, file) {
                    // return file contents as string
                    return '<script type="text/javascript">' + file.contents.toString('utf8') + '</script>';
                }
            }
        ))
        .pipe(plug.inject(
            gulp.src([paths.build + minJS]), {
                transform: function (filePath, file) {
                    // return file contents as string
                    return '<script type="text/javascript">' + file.contents.toString('utf8') + '</script>';
                }
            }
        ))
        .pipe(plug.minifyHtml({empty: true}))
        .pipe(gulp.dest(paths.build)) // remove filter, back to original stream
        //.pipe(plug.concat('dist.html', opt))
        .pipe(plug.rename('dist.html'))
        .pipe(gulp.dest(paths.client));
});
gulp.task('html', function() {
    log('Creating an AngularJS $templateCache');
    return gulp
        .src(paths.htmltemplates.paths, {base: paths.client})
        .pipe(plug.size({showFiles:true, title:'HTML'}))
        .pipe(gulp.dest(paths.build))
        .pipe(plug.minifyHtml({
            empty: true
        }))
        .pipe(plug.angularTemplatecache(minHTML, {
            module: pkg.ngRootModule,
            standalone: false,
            root: paths.htmltemplates.root
        }))
        .pipe(gulp.dest(paths.build));
});
gulp.task('js', ['html'], function() {
    log('Bundling, minifying, and copying the app\'s JavaScript');

    var source = [].concat(paths.js, [paths.build  + minHTML]);
    var opt = {newLine: '\n'};
    return gulp
        .src(source)
        .pipe(plug.ngAnnotate({
            add: true,
            single_quotes: true
        }))
        .pipe(plug.size({showFiles:true, title:'JS'}))
        .pipe(plug.uglify({
            mangle: true
        }))
        .pipe(plug.concat(minJS, opt))
        .pipe(gulp.dest(paths.build));
});
gulp.task('vendorjs', function() {
    log('Bundling, minifying, and copying the Vendor JavaScript');
    var opt = {newLine: ';\n'};
    var jsFilter = plug.filter(['**/*.js']);
    return gulp.src(bowerFiles, {base: paths.vendorjs})
        .pipe(jsFilter)
        .pipe(plug.size({showFiles:true, title:'VendorJS'}))
        .pipe(plug.concat(vendorJS, opt))
        .pipe(plug.uglify())
        .pipe(gulp.dest(paths.build));

});
gulp.task('css', function() {
    log('Bundling, minifying, and copying the app\'s CSS');
    var opt = {newLine: '\n'};
    var stream =  gulp.src(paths.css)
        .pipe(plug.size({showFiles:true, title:'CSS'}))
        .pipe(plug.concat(minCSS, opt))
        //.pipe(plug.autoprefixer('last 2 version', '> 5%'))
        .pipe(plug.minifyCss({}))
        .pipe(gulp.dest(paths.build));

    if (browserSync.active) {
        stream.pipe(browserSync.reload({stream:true}));
    }
    return stream;
});
gulp.task('nodemon', function (cb) {
    return nodemon({
        script: 'server.js',
        watch:'./server'
    }).on('start', function () {
        cb();
    });
});