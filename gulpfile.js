var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var mainBowerFiles = require('main-bower-files');
 
/*
  Compile bower js files into one file
*/
gulp.task('bower', function() {
  return gulp.src(mainBowerFiles('**/*.js'))
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('public/js'));
});
 
/*
  Uglify client side scripts
*/
gulp.task('clientjs', function(){
  return gulp.src('client/*.js')
    .pipe(sourcemaps.init())
      .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/js'));
});

// Rerun the task when a file changes 
gulp.task('watch', function() {
  gulp.watch('client/*.js', ['clientjs']);
});
 
gulp.task('default', ['bower', 'clientjs']);
