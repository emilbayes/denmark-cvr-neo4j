const req = require('../lib/req')
const level = require('level')
const series = require('run-series')
const bytespace = require('bytespace')

const VIRK_CVR_USERNAME = process.env.VIRK_CVR_USERNAME
const VIRK_CVR_PASSWORD = process.env.VIRK_CVR_PASSWORD
const DB_PATH = process.argv[2]

const pageSize = 3000

const db = level(DB_PATH, {
  // Each record is 9.45 kb on average, so we allocate a cache of the size of a
  // page plus some slack (x1.1)
  cacheSize: 8 * 1024 * 9.45 * pageSize * 1.1,
  keyEncoding: require('bytewise'),
  valueEncoding: 'json'
})

const companiesSpace = bytespace(db, 'companies')
const participantsSpace = bytespace(db, 'participants')
const entitiesSpace = bytespace(db, 'entities')

req(reqOpts(0, pageSize), function onResponse (err, request, response) {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  if (response.hits && response.hits.hits) {
    const results = response.hits.hits
    console.info('%s Retrieved row %d - %d', new Date().toISOString(), request.data.from, request.data.from + results.length)

    const companies = results
        .filter(d => d._type === 'virksomhed')
        .map(d => ({
          type: 'put',
          key: d._source.Vrvirksomhed.cvrNummer,
          value: d._source.Vrvirksomhed
        }))

    const participants = results
        .filter(d => d._type === 'deltager')
        .map(d => ({
          type: 'put',
          key: d._source.Vrdeltagerperson.enhedsNummer,
          value: d._source.Vrdeltagerperson
        }))

    const entities = results
        .filter(d => d._type === 'produktionsenhed')
        .map(d => ({
          type: 'put',
          key: d._source.VrproduktionsEnhed.enhedsNummer,
          value: d._source.VrproduktionsEnhed
        }))

    series([
      companiesSpace.batch.bind(companiesSpace, companies),
      participantsSpace.batch.bind(participantsSpace, participants),
      entitiesSpace.batch.bind(entitiesSpace, entities)
    ], function (err) {
      if (err) {
        console.error(err)
        process.exit(2)
      }

      console.info('%s Wrote row %d - %d', new Date().toISOString(), request.data.from, request.data.from + results.length)
      req(reqOpts(request.data.from + results.length, pageSize), onResponse)
    })
  }
})

function reqOpts (from, size) {
  return {
    method: 'POST',
    protocol: 'http:', host: 'distribution.virk.dk', path: '/cvr-permanent/_search',
    auth: [VIRK_CVR_USERNAME, VIRK_CVR_PASSWORD].join(':'),
    data: {
      from, size, filter: {
        not: {
          type: { value: 'produktionsenhed' }
        }
      }
    }
  }
}
