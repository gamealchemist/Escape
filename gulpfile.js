var gulp       = require('gulp'),
    concat     = require('gulp-concat'),
    uglify     = require ('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    zip        = require('gulp-zip'),
    beautify   = require('gulp-jsbeautifier');
 // ftp

// ------------------------------------

var folders = ['core', 'parameters', 'utils', 'inputs', 'gfx', 'sound', 'levels', 'actors', 'screens'];

folders = preAndPostfix(folders, 'src/', '/*.js')

folders.push('src/main.js')

// ------------------------------------

gulp.task('concat', function(){
    return gulp.src(folders)  
        .pipe(sourcemaps.init())
        .pipe(concat('escape.js'))                
        .pipe(sourcemaps.write()) 
        .pipe(gulp.dest('dest'))  ;
});

gulp.task('copyhtml', function(){
    return gulp.src('src/html/index.html') 
        .pipe(gulp.dest('dest'))
        .pipe(gulp.dest('dest_min'))  ;
});

gulp.task('copyrsc', function(){
    return gulp.src('src/rsc/*.*') 
        .pipe(gulp.dest('dest/'))
        .pipe(gulp.dest('dest_min/'))  ;
});

gulp.task('watch', function() {
    gulp.watch(folders, ['concat']);
    gulp.watch('src/rsc/*.*', [ 'copyrsc']);
});

gulp.task('beautify', function() {
	gulp.src(folders)
	.pipe(beautify())
	.pipe(gulp.dest(folders));
});

// ------------------------------------

gulp.task('prodconcat', function(){
    return gulp.src(folders)  
        .pipe(concat('escape.js'))                
        .pipe(gulp.dest('dest'))  ;
});

gulp.task('uglify',[ 'prodconcat' ], function(){
    return gulp.src(['dest/escape.js'])  
        .pipe(uglify())
        .pipe(gulp.dest('dest_min')) ;
} );

gulp.task('build', ['uglify', 'copyhtml', 'copyrsc']);

gulp.task('zip', ['build'] , function(){
    return gulp.src(['dest_min/escape.js', 'dest_min/index.html', 'dest_min/*.png'])  
        .pipe(zip('escape.zip'))
        .pipe(gulp.dest('dest_min_zipped')) ;
});

gulp.task('default', ['concat'], function(){});
 
// ------------------------------------

 function preAndPostfix(arr, pre, post) {
 	var res = [];
 	for (var i=0; i <arr.length; i++) {
 		res.push(pre+arr[i]+post);
 	}
 	return res;
 }
