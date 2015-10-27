const duplexify = require('duplexify')
const http = require('http-https')
const concat = require('concat-stream')

function duplexReqStream (opts) {
  const req = http.request(opts)
  const dup = duplexify(req)
  req.on('response', function (res) {
    dup.setReadable(res)
  })

  return dup
}

module.exports = function req (request, callback) {
  const s = duplexReqStream(request)

  s.end(JSON.stringify(request.data))

  s.on('error', e => callback(e, request))
  s.pipe(concat(body => {
    try {
      const response = JSON.parse(body.toString())
      callback(null, request, response)
    } catch (ex) {
      return callback(ex, request)
    }
  }))
}
