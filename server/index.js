'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')
const http = require('http')

// npm
const get = require('got')
const express = require('express')
const socketio = require('socket.io')

//----------------------------------------------------------
// logic
//----------------------------------------------------------
const base = 'https://en.wikipedia.org/w/api.php?format=json&action=query'
const wikiApi = ob => Object.keys(ob)
  .map(k => `&${k}=${ob[k]}`)
  .reverse().concat(base)
  .reverse().join('')

const wiki = ob => get(wikiApi(ob))

const getPageInfo = id => wiki(
  { pageids: id
  , prop: 'extracts|coordinates|info'
  , exintro: true
  , explaintext: true
  , inprop: 'url'
  })
  .then(res => JSON.parse(res.body).query.pages[id])

const getLatestId = () => wiki(
  { list: 'categorymembers'
  , cmtitle: 'Category:Coordinates_on_Wikidata'
  , cmprop: 'ids'
  , cmsort: 'timestamp'
  , cmdir: 'descending'
  , cmlimit: 1
  })
  .then(res => JSON.parse(res.body).query.categorymembers[0].pageid)

// getLatestId()
//   .then(getPageInfo)
//   // .then(console.log)
//   .catch(err => console.log(err))

// express
//----------------------------------------------------------
const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use('/', express.static(p.join(__dirname, 'public')))

io.on('connection', sock => {
  console.log('a client connected')
  sock.on('disconnect', () => console.log('a client disconnected'))
})

server.listen(3000, () =>
  console.log('server listening on localhost:3000')
)
