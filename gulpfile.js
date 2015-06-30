/**
 * Created by kevin on 15-6-30.
 */
var gulp = require('gulp');
var jade = require('gulp-jade');
var stylus = require('gulp-stylus');

gulp.task('html', function () {
    return gulp.src('./src/index.jade').pipe(jade({
        locals: {}
    })).pipe(gulp.dest('./dist/'));
});

gulp.task('css', function () {
    return gulp.src('./src/my.styl').pipe(stylus({
        compress: true
    })).pipe(gulp.dest('./dist/assets/css/'));
});
gulp.task('js', function () {
    return gulp.src('./src/my.js').pipe(gulp.dest('./dist/assets/js/'));
});

gulp.task('default', ['html', 'css', 'js']);