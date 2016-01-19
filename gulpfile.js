'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')
const child = require('child_process')

// npm
const runseq = require('run-sequence')
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
      { vendor: 'src/scripts/vendor/**/*.js'
      , bundle: 'src/scripts/bundle/**/*.js'
      }
    , html: 'src/markup/index.html'
    }
  , dist: 'server/public'
  , server: 'server/index.js'
  }

//----------------------------------------------------------
// fns
//----------------------------------------------------------
const babelOpts = [babelify.configure({presets: ['es2015']})]

const bundler = (name, transform, plugin) => entries =>
  browserify(
    { entries
    , transform
    , plugin
    , cache: {}
    , packageCache: {}
    })
    .bundle()
    .pipe(source(`${name}.js`))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(locs.dist))

const scripts = (name, transform, plugin) =>
  globby([locs.src.scripts[name]])
    .then(bundler(name, transform, plugin))

const styles = () =>
  gulp.src('node_modules/mapbox.js/theme/**/*')
    .pipe(gulp.dest(p.join(locs.dist, 'styles')))

const startServer = () =>
  child.spawn('node', [locs.server], {stdio: 'inherit'})

const restartServer = proc => {
  if (proc && proc.exitCode === null) {
    console.log('restarting server')
    proc.kill()
  }
  startServer(proc)
}

const watch = () => {
  // server
  let server = startServer()
  gulp.watch(locs.server, () => restartServer(server))

  // scripts
  gulp.watch(locs.src.scripts.bundle, () => {
    scripts('bundle', babelOpts, [watchify])
    util.log('scripts bundled')
  })
  // function bundle() {
  //   scripts('bundle', babelOpts, [watchify])
  //   util.log('scripts bundled')
  // }
  // bundle()
  // gulp.watch(locs.src.scripts.bundle, bundle)

  // html
  gulp.watch(locs.src.html, ['html'])
}

const clean = () => del([locs.dist])

const html = () => gulp.src(locs.src.html).pipe(gulp.dest(locs.dist))

//----------------------------------------------------------
// gulp tasks
//----------------------------------------------------------
gulp.task('styles', styles)
gulp.task('scripts', () => scripts('bundle', babelOpts))
gulp.task('scripts:vendor', () => scripts('vendor'))
gulp.task('html', html)
gulp.task('watch', ['build'], watch)
gulp.task('clean', clean)
gulp.task('node', startServer)
gulp.task('build', cb =>
  runseq(
    ['styles', 'scripts', 'scripts:vendor', 'html']
    , cb
  ))
gulp.task('serve', startServer)
