import gulp from 'gulp';
import runSequence from 'run-sequence';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();

gulp.task('scripts', () =>
  gulp.src([
    // Note: Since we are not using useref in the scripts build pipeline,
    //       you need to explicitly list your scripts here in the right order
    //       to be correctly concatenated
    'libs/lodash/lodash-3.9.0.min.js',
    'libs/jquery/jquery-1.11.1.min.js',
    'libs/opencpu/opencpu-0.5.js',
    'libs/d3/d3.min.js',
    'libs/d3/d3.svg.multibrush.js',
    'libs/d3/colorbrewer.js',
    'libs/parcoords/d3.parcoords.js',
    'libs/angularjs/angular-1.2.21.min.js',
    'libs/ui-bootstrap/ui-bootstrap-tpls-0.12.1.min.js',

    'libs/dimredplot/dimredplot.js',
    'libs/dimredplot/scatterplot.js',
    'libs/dimredplot/barplot.js',
    'libs/dimredplot/variancepercentageplot.js',
    'libs/dimredplot/colourmap.js',

    'js/app.js',

    'js/controllers/chartsctrl.js',
    'js/controllers/clusterconfigctrl.js',
    'js/controllers/clusterctrl.js',
    'js/controllers/colorctrl.js',
    'js/controllers/colourmapctrl.js',
    'js/controllers/dataindicatorctrl.js',
    'js/controllers/dimredctrl.js',
    'js/controllers/dimreddisplayctrl.js',
    'js/controllers/dimredplotctrl.js',
    'js/controllers/escgctrl.js',
    'js/controllers/exportctrl.js',
    'js/controllers/filterctrl.js',
    'js/controllers/manualcoloringctrl.js',
    'js/controllers/namehighlightctrl.js',
    'js/controllers/nameselectionctrl.js',
    'js/controllers/parcoordsctrl.js',
    'js/controllers/parcoordsvarsctrl.js',
    'js/controllers/plotctrl.js',
    'js/controllers/tagctrl.js',
    'js/controllers/themectrl.js',
    'js/controllers/variableselectionctrl.js',

    'js/services/analytics.js',
    'js/services/assert.js',
    'js/services/color.js',
    'js/services/dataset.js',
    'js/services/dimredplot.js',
    'js/services/opencpu.js',
    'js/services/parcoords.js',
    'js/services/r.js',
    'js/services/tag.js'
  ])
    .pipe($.concat('app.min.js'))
    .pipe($.uglify({preserveComments: 'some', mangle: false}))
    // Output files
    .pipe(gulp.dest('.'))
    .pipe($.size({title: 'scripts'}))
);

// Scan your HTML for assets & optimize them
gulp.task('html', () => {
  const assets = $.useref.assets({searchPath: '{., ./css}'});

  return gulp.src('index-raw.html')
    .pipe($.rename('index.html'))
    .pipe(assets)
    // Remove any unused CSS
    .pipe($.if('css/*.css', $.uncss({
      html: ['index-raw.html']
    })))

    // Concatenate and minify styles
    // In case you are still using useref build blocks
    .pipe($.if('**/*.css', $.minifyCss()))
    .pipe(assets.restore())
    .pipe($.useref())

    // Minify any HTML
    .pipe($.if('*.html', $.minifyHtml()))
    // Output files
    .pipe(gulp.dest('.'))
    .pipe($.size({title: 'html'}));
});

gulp.task('default', [], cb =>
  runSequence(
    ['scripts', 'html'],
    cb
  )
);
