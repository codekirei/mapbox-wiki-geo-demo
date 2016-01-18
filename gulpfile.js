'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const child = require('child_process')

// npm
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
    }
  , dist: 'server/dist'
  , server: 'server/index.js'
  }

//----------------------------------------------------------
// fns
//----------------------------------------------------------
const transforms =
  [ babelify.configure({presets: ['es2015']}) ]

const bundle = (name, transform, watch) =>
  globby([locs.src.scripts[name]])
    .then(entries => {
      const bundler = watch ? watchify : browserify
      return bundler({entries, transform})
        .bundle()
        .pipe(source(`${name}.js`))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(locs.dist))
    })

const scripts = () => Promise.all(
  [ bundle('bundle', transforms)
  , bundle('vendor')
  ])

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
  let server = startServer()
  gulp.watch(locs.src.entries, ['scripts'])
  gulp.watch(locs.server, () => restartServer(server))
}

const clean = () => del([locs.dist])

const html = () => gulp.src('src/index.html').pipe(gulp.dest(locs.dist))

//----------------------------------------------------------
// gulp tasks
//----------------------------------------------------------
gulp.task('scripts', scripts)
gulp.task('html', html)
gulp.task('watch', watch)
gulp.task('clean', clean)
gulp.task('node', startServer)
gulp.task('build', ['scripts', 'html'])
