'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')
const process = require('process')
const child = require('child_process')

// npm
const gulp = require('gulp')
const webpack = require('webpack')
const util = require('gulp-util')
const autoImport = require('auto-import')
const del = require('del')

//----------------------------------------------------------
// cfgs
//----------------------------------------------------------
const cwd = process.cwd()
const locs =
  { src:
    { get dir() {return p.join(cwd, 'src', 'scripts')}
    , modules: 'src/scripts/*/**/*.js'
    , entries: 'src/scripts/*.js'
    }
  , dist: 'server/dist'
  , server: 'server/index.js'
  }

const wpCfg =
  { context: locs.src.dir
  , entry: { bundle: './main.js' }
  , output:
    { path: locs.dist
    , filename: '[name].js'
    }
  , debug: true
  , cache: {}
  , module:
    { loaders:
      [ { loader: 'babel'
        , test: /\.js$/
        , exclude: /node_modules/
        , query:
          { cacheDirectory: true
          , presets: ['es2015']
          }
        }
      ]
    }
  }

//----------------------------------------------------------
// fns
//----------------------------------------------------------
const scripts = cb => webpack(wpCfg, (err, res) => {
  if (err) throw new util.PluginError('webpack', err)
  util.log('[webpack]', res.toString())
  cb()
})

const imports = () => autoImport(locs.src.dir)

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
  gulp.watch(locs.src.modules, ['imports'])
  gulp.watch(locs.src.entries, ['scripts'])
  gulp.watch(locs.server, () => restartServer(server))
}

const clean = () => del([locs.dist])

const html = () => gulp.src('src/index.html').pipe(gulp.dest(locs.dist))

//----------------------------------------------------------
// gulp tasks
//----------------------------------------------------------
gulp.task('imports', imports)
gulp.task('scripts', ['imports'], scripts)
gulp.task('html', html)
gulp.task('watch', watch)
gulp.task('clean', clean)
gulp.task('node', startServer)
gulp.task('build', ['scripts', 'html'])
