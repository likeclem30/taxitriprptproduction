const qs = require('qs')
const url = require('url')
const ServerExtension = {}

//for custom request handler
ServerExtension.httpExtension = (req, res, body) => {
   req.body = body; //add the body as JSON BODY
   //for response status
   res.status = (code) => {
      res.statusCode = code ? code : 200;
      return res;
   }
   //add JSON response
   res.json = (param = {}) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(param))
   }
   //get the query strings from the URL
   let search = url.parse(req.url).search;
   req.query = search ? qs.parse(url.parse(req.url).search.substr(1)) : {}
}

module.exports = ServerExtension;