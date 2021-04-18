const http = require('http')
const https = require('https')
const url = require('url')
const API_ROUTE = require('./router')
const tripModel = require('./models/driver')
const SERVER_EXTENSION = require('./serverExtension')

// const port = 6500;
const app = http.createServer((req, res) => {
   // Allow CORS
   res.setHeader('Access-Control-Allow-Origin', '*')
   res.setHeader('Access-Control-Allow-Credentials', true)
   res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
   //if the method is option; allow
   if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      res.statusCode = 200
      return res.end()
   }

   let urlRoute = url.parse(req.url).pathname

   let body = '';
   req.on('data', (chunk) => {
      body += chunk
   })

   req.on('end', () => {
      SERVER_EXTENSION.httpExtension(req, res, body)
      API_ROUTE.use(req, res, urlRoute)
   })
})

const port = process.env.PORT || 8080;
// Listen port
app.listen(port, (error) => {
   if (error) {
      console.log(error)
   } else {
      console.log("Server Running on " + port)
   }
})
