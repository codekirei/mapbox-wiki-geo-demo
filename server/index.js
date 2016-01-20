'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const get = require('got')
const express = require('express')

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
app.use('/', express.static(p.join(__dirname, 'public')))
app.listen(3000, () =>
  console.log('express listening on localhost:3000')
)
