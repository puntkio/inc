
var gulp        = require('gulp'),
    watch       = require('gulp-watch'),
    liveReload  = require('gulp-livereload'),
    concat      = require('gulp-concat'),
    uglify      = require('gulp-uglify'),
    moment      = require('moment'),
    notify      = require('gulp-notify'),
    rename      = require('gulp-rename');
    copy      = require('gulp-copy');

var sourcemaps = require('gulp-sourcemaps');
var uglifycss = require('gulp-uglifycss');
var jshint = require('gulp-jshint');
var jshint_stylish = require('jshint-stylish');

require('gulp-help')(gulp, {
        description: 'Help listing.'
});

var src = [
    'client/js/init.js',
    'client/js/app.js',
    'client/js/libs/**/*.js',
    'client/js/libs/*.js',
    'client/js/**/init.js',
    'client/js/**/*.js',
    'client/js/main.js',
];
var dest = 'public/js';

var vendorSrc = [
    'client/vendor/js/*.js',
    'client/vendor/js/**/*.js',
];
var vendorDest = 'public/js';

var cssSrc = [
    'client/css/style.css',
    'client/css/pages/*.css',
    'client/css/components/*.css',
    'client/css/media/**/style.css',
    'client/css/media/**/*.css',
];
var cssDest = 'public';

gulp.task('build-js', 'Concat, Ng-Annotate, Uglify JavaScript into a single app.min.js.', function() {
    gulp.src(src)
    .pipe(sourcemaps.init())
    .pipe(concat('app'))
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(rename({
        extname: ".js"
     }))
    .pipe(gulp.dest(dest))
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(uglify())
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(rename({
        extname: ".min.js"
     }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dest))
    .pipe(notify('Uglified JavaScript (' + moment().format('MMM Do h:mm:ss A') + ')'));
});

gulp.task('build-css', '', function() {
    gulp.src(cssSrc)
    .pipe(sourcemaps.init())
    .pipe(concat('app'))
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(rename({
        extname: ".css"
     }))
    .pipe(gulp.dest(cssDest))
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(uglifycss())
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(rename({
        extname: ".min.css"
     }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(cssDest))
    .pipe(notify('Uglified CSS (' + moment().format('MMM Do h:mm:ss A') + ')'));
});

gulp.task('build-vendor-js', '', function() {
    gulp.src(vendorSrc)
    .pipe(concat('vendor'))
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(rename({
        extname: ".js"
     }))
    .pipe(gulp.dest(vendorDest))
    .on('error', notify.onError("Error: <%= error.message %>"))


    .pipe(uglify())
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(rename({
        extname: ".min.js"
     }))
    .pipe(gulp.dest(vendorDest))
    .pipe(notify('Uglified JavaScript (' + moment().format('MMM Do h:mm:ss A') + ')'));
});

gulp.task('lint', function() {
  return gulp.src(src)
    .pipe(jshint())
    .pipe(jshint.reporter(jshint_stylish));
});

gulp.task('watch', 'Watch for changes and live reloads Chrome. Requires the Chrome extension \'LiveReload\'.', function() {

    liveReload.listen();

    watch('client/js/**/*.js', function() {
        gulp.start('build-js');
    });

    watch('client/css/**/*.css', function() {
        gulp.start('build-css');
    });

    watch('client/vendor/js/**/*.js', function() {
        gulp.start('build-vendor-js');
    });
});

gulp.task('default', ['watch']);
