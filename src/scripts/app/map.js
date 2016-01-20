/* global L */

import 'mapbox.js'

L.mapbox.accessToken = 'pk.eyJ1IjoiY29kZWtpcmVpIiwiYSI6ImNpamVxdnl5azAwMDB0dW01amxueGJkZHQifQ.pCGbQleCKfjcAagSQSFjSw'

const zoom = 14
const coordinates = [[44.56, -123.28], [35.68, 139.68]]

const map = L.mapbox.map('map', 'mapbox.streets')
  .setView(coordinates[0], zoom)

const marker = L.marker(coordinates[0]).addTo(map)

const popup = L.popup(
  { closeButton: false
  })
  .setContent('<span>Hello world!</span>')

marker.bindPopup(popup).openPopup()

// artificial loop
const t = 5000
const len = coordinates.length
let i = 0
const loop = () => setTimeout(() => {
  i = (i + 1) % len
  marker.setLatLng(coordinates[i])
  map.panTo(coordinates[i])
  loop()
}, t)
// loop()
