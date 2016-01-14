'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// npm
const get = require('got')

//----------------------------------------------------------
// logic
//----------------------------------------------------------
const base = 'https://en.wikipedia.org/w/api.php?format=json&action=query'
const wikiApi = ob => Object.keys(ob)
  .map(k => `&${k}=${ob[k]}`)
  .reverse().concat(base)
  .reverse().join('')

const getPageInfo = id => get(wikiApi(
  { pageids: id
  , prop: 'extracts|coordinates'
  , exintro: true
  , explaintext: true
  }))
  .then(res => JSON.parse(res.body).query.pages[id])

const getLatestId = () => get(wikiApi(
  { list: 'categorymembers'
  , cmtitle: 'Category:Coordinates_on_Wikidata'
  , cmprop: 'ids'
  , cmsort: 'timestamp'
  , cmdir: 'descending'
  , cmlimit: 1
  }))
  .then(res => JSON.parse(res.body).query.categorymembers[0].pageid)

getLatestId()
  .then(getPageInfo)
  .then(console.log)
  .catch(err => console.log(err))
