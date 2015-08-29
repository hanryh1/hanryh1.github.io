var gulp           = require('gulp');
var concat         = require('gulp-concat');
var minifyCss      = require('gulp-minify-css');
var uglify         = require('gulp-uglify');
var sourcemaps     = require('gulp-sourcemaps');
var mainBowerFiles = require('main-bower-files');

/*
 * Compile bower js files into one file
 */
gulp.task('bowerjs', function() {
  return gulp.src(mainBowerFiles('**/*.js'))
    .pipe(concat('bundle.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

/*
 * Compile bower css files into one file
 */
gulp.task('bowercss', function() {
  return gulp.src(['bower_components/bootstrap/dist/css/bootstrap.css'
                 , 'bower_components/font-awesome/css/font-awesome.css'])
    .pipe(concat('bundle.css'))
    .pipe(minifyCss())
    .pipe(gulp.dest('public/stylesheets'));
});

/*
 * Move fonts to public directory
 */
gulp.task('bowerfonts', function () {
  return gulp.src(['bower_components/font-awesome/fonts/*'
                 , 'bower_components/bootstrap/fonts/*'])
    .pipe(gulp.dest('public/fonts'));
});

/*
 * Uglify client side scripts
 */
gulp.task('clientjs', function() {
  if (process.env.NODE_ENV === 'dev') {
    return gulp.src('client/js/*.js')
    .pipe(sourcemaps.init())
      .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/js'));
  } else {
    return gulp.src('client/js/*.js')
      .pipe(uglify())
    .pipe(gulp.dest('public/js'));
  }
});

/*
 * Uglify client side css
 */
gulp.task('clientcss', function() {
  if (process.env.NODE_ENV === 'dev') {
    return gulp.src('client/css/*.css')
    .pipe(sourcemaps.init())
      .pipe(minifyCss())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/stylesheets'));
  } else {
    return gulp.src('client/css/*.css')
      .pipe(minifyCss())
    .pipe(gulp.dest('public/stylesheets'));
  }
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch('client/*.js', ['clientjs']);
});

gulp.task('default', ['bowerjs', 'bowercss', 'bowerfonts', 'clientjs', 'clientcss']);
