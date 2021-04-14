const router = {}
const helpers = require('./assets/helpers');
const fs = require('fs')

router.use = async (req, res, urlPath) => {
   let url = urlPath.replace(/^\/+|\/+$/gi, ''); //sanitize the url
   let endpointParts = url.split('/'); //split the url
   //if the url path not complete
   if (endpointParts.length === 1) {
      res.setHeader('Content-Type', 'text/html')
      res.end(fs.readFileSync('./doc.html'))
      return
   }
   if (endpointParts.length !== 2) {
      return helpers.outputError(res, 404);
   }

   let reqHeader = req.headers.authorization
   // if there's no auth
   if (!reqHeader) {
      return helpers.outputError(res, 401, "Authorization header missing")
   }
   //if it does not start with bearer
   if (!reqHeader.match(/^Bearer /)) {
      return helpers.outputError(res, 401, "Authorization header missing")
   }
   // run authentication
   let getAuth = await helpers.makeHTTPRequest({
      uri: 'http://taxiusersbackend-microservices.apps.waaron.com/api/verify/',
      method: 'GET',
      headers: { Authorization: reqHeader }
   })
   let DataReturn;
   try {
      DataReturn = typeof getAuth === "object" ? getAuth : JSON.parse(getAuth)
   } catch (e) {
      return helpers.outputError(res, 401, "Could not verify your access to this service")
   }
   //check if there's an error
   if (DataReturn && DataReturn.error) {
      return helpers.outputError(res, 401, "Could not verify your access to this service")
   }
   //check if the service does not return a valid data
   if (!DataReturn || !DataReturn.auth_id) {
      return helpers.outputError(res, 401)
   }

   //include the class if exist
   var controller = null
   try {
      controller = require('./controllers/' + endpointParts[0])
   } catch (e) {
      console.log(e)
      return helpers.outputError(res, 404);
   }
   //parse the payload if it's a post request
   let body = ''
   if (req.method === 'post') {
      try {
         body = typeof req.body === 'object' ? req.body : JSON.parse(req.body)
      } catch (e) {
         return helpers.outputError(res, 400);
      }
   }

   //execute the method 
   let classParent = new controller(req, res, body, DataReturn)
   //check if the method exist
   if (typeof classParent[endpointParts[1]] === 'function') {
      try {
         return classParent[endpointParts[1]]()
      } catch (e) {
         helpers.outputError(res, 503)
      }
   } else {
      return helpers.outputError(res, 404);
   }
}

module.exports = router