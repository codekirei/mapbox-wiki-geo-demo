'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')
const child = require('child_process')

// npm
const autoImport = require('auto-import')
const runseq = require('run-sequence')
const sourcemaps = require('gulp-sourcemaps')
const browserify = require('browserify')
const gulp = require('gulp')
const util = require('gulp-util')
const del = require('del')
const globby = require('globby')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const uglify = require('gulp-uglify')
const babelify = require('babelify')
const watchify = require('watchify')
const Promise = require('bluebird')

//----------------------------------------------------------
// cfgs
//----------------------------------------------------------
const locs =
  { src:
    { scripts:
      { entries: 'src/scripts/app.js'
      , modules: 'src/scripts/*/**/*.js'
      , root: 'src/scripts'
      }
    , html: 'src/markup/index.html'
    }
  , dest:
    { root: 'server/public'
    , scripts: 'server/public/scripts'
    , styles: 'server/public/styles'
    }
  , server: 'server/index.js'
  }

//----------------------------------------------------------
// fns
//----------------------------------------------------------
const bundleStream = browserify(
  { entries: locs.src.scripts.entries
  , transform: [ babelify.configure({ presets: ['es2015'] }) ]
  , cache: {}
  , packageCache: {}
  , debug: true
  })

bundleStream.on('log', txt => util.log(`Browserify: ${txt}`))

const consume = stream =>
  stream
    .bundle()
    .on('error', err => console.log(err.stack))
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(locs.dest.scripts))

const styles = () =>
  gulp.src('node_modules/mapbox.js/theme/**/*')
    .pipe(gulp.dest(locs.dest.styles))

const startServer = () =>
  child.spawn('node', [locs.server], {stdio: 'inherit'})

const restartServer = proc => {
  if (proc && proc.exitCode === null) {
    proc.kill()
    console.log('server restarted')
  }
  startServer(proc)
}

const watch = () => {
  // server
  let server = startServer()
  gulp.watch(locs.server, () => restartServer(server))

  // scripts
  gulp.watch(locs.src.scripts.modules, ['imports'])
  const stream = watchify(bundleStream)
  consume(stream)
  stream.on('update', () => consume(stream))

  // html
  gulp.watch(locs.src.html, ['html'])
}

const clean = () => del([locs.dest.root])

const html = () => gulp.src(locs.src.html).pipe(gulp.dest(locs.dest.root))

//----------------------------------------------------------
// gulp tasks
//----------------------------------------------------------
gulp.task('styles', styles)
gulp.task('scripts', ['imports'], () => consume(bundleStream))
gulp.task('imports', () => autoImport(locs.src.scripts.root))
gulp.task('html', html)
gulp.task('watch', ['styles', 'html'], cb => watch())
gulp.task('clean', clean)
gulp.task('node', startServer)
gulp.task('build', cb =>
  runseq(
    ['styles', 'scripts', 'html']
    , cb
  ))
gulp.task('serve', startServer)
