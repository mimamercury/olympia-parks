import * as fs from 'fs/promises'
import * as path from 'path'

import got from 'got'
import { join } from 'desm'
import proj4 from 'proj4'
import { arcgisToGeoJSON } from '@terraformer/arcgis'
import { featureCollection  } from '@turf/helpers'

proj4.defs([
  [
    'EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
  [
    'EPSG:2286',
    'PROJCS["NAD83 / Washington South (ftUS)", GEOGCS["NAD83", DATUM["North_American_Datum_1983", SPHEROID["GRS 1980",6378137,298.257222101, AUTHORITY["EPSG","7019"]], AUTHORITY["EPSG","6269"]], PRIMEM["Greenwich",0, AUTHORITY["EPSG","8901"]], UNIT["degree",0.01745329251994328, AUTHORITY["EPSG","9122"]], AUTHORITY["EPSG","4269"]], UNIT["US survey foot",0.3048006096012192, AUTHORITY["EPSG","9003"]], PROJECTION["Lambert_Conformal_Conic_2SP"], PARAMETER["standard_parallel_1",47.33333333333334], PARAMETER["standard_parallel_2",45.83333333333334], PARAMETER["latitude_of_origin",45.33333333333334], PARAMETER["central_meridian",-120.5], PARAMETER["false_easting",1640416.667], PARAMETER["false_northing",0], AUTHORITY["EPSG","2286"], AXIS["X",EAST], AXIS["Y",NORTH]]'
  ]
])

const dataDirectory = join(import.meta.url, '..', 'data')
const url = 'https://olympiawa.maps.arcgis.com/sharing/rest/content/items/acfb53941af74ff6acbe80bf85570042/data?f=json'

async function main () {
  const res = await got(url, { })
  const body = JSON.parse(res.body)
  const json = body.operationalLayers[1]

  await fs.writeFile(
    path.join(dataDirectory, 'source', 'parks.json'),
    JSON.stringify(json)
  )

  const features = json.featureCollection.layers[0].featureSet.features.map((feature) => {
    const geo = arcgisToGeoJSON(feature)
    geo.geometry.coordinates = proj4('EPSG:2286', 'EPSG:4326', geo.geometry.coordinates)
    return geo
  })

  const geojson = featureCollection(features)

  await fs.writeFile(
    path.join(dataDirectory, 'processed', 'parks.geojson'),
    JSON.stringify(geojson)
  )
}

main ()
