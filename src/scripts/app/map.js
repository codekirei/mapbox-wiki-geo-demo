/* global L */

import 'mapbox.js'

L.mapbox.accessToken = 'pk.eyJ1IjoiY29kZWtpcmVpIiwiYSI6ImNpamVxdnl5azAwMDB0dW01amxueGJkZHQifQ.pCGbQleCKfjcAagSQSFjSw'

const map = L.mapbox.map('map', 'mapbox.streets')
  .setView([40, -74.50], 9)
