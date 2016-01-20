'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const child = require('child_process')

// npm
const autoImport = require('auto-import')
const runseq = require('run-sequence')
const sourcemaps = require('gulp-sourcemaps')
const browserify = require('browserify')
const gulp = require('gulp')
const util = require('gulp-util')
const del = require('del')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const uglify = require('gulp-uglify')
const babelify = require('babelify')
const watchify = require('watchify')
const browserSync = require('browser-sync').create('devServer')
const nodemon = require('nodemon')

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
    , all: 'server/public/**/*'
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
    .on('error', err => console.log(err.stack)) // TODO is this working?
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(locs.dest.scripts))
    .pipe(browserSync.stream())

const styles = () =>
  gulp.src('node_modules/mapbox.js/theme/**/*')
    .pipe(gulp.dest(locs.dest.styles))

const watch = () => {
  // server
  nodemon(
    { script: locs.server
    , ignore:
      [ 'src'
      , 'server/public'
      ]
    }
  )
  nodemon.on('restart', () => browserSync.notify('express server restarted'))

  // scripts
  gulp.watch(locs.src.scripts.modules, ['imports'])
  const stream = watchify(bundleStream)
  consume(stream)
  stream.on('update', () => consume(stream))

  // html
  gulp.watch(locs.src.html, ['html'])

  // browser-sync
  browserSync.init(
    { proxy:
      { target: 'localhost:3000'
      , ws: true
      }
    , open: false
    , port: 1337
    }
  )
}

const clean = () => del([locs.dest.root])

const html = () =>
  gulp.src(locs.src.html)
    .pipe(gulp.dest(locs.dest.root))
    .pipe(browserSync.stream())

//----------------------------------------------------------
// gulp tasks
//----------------------------------------------------------
gulp.task('styles', styles)
gulp.task('scripts', ['imports'], () => consume(bundleStream))
gulp.task('imports', () => autoImport(locs.src.scripts.root))
gulp.task('html', html)
gulp.task('watch', ['styles', 'html'], cb => watch())
gulp.task('clean', clean)
gulp.task('build', cb =>
  runseq(
    ['styles', 'scripts', 'html']
    , cb
  ))
