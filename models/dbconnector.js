const mongoose = require('mongoose');
const helpers = require('../assets/helpers')

let zenoTripDBURL = process.env.NODE_ENV === 'dev' ? helpers.zenoTripDBLocal : helpers.zenoTripDBLive

let options = {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   useCreateIndex: true,
   useFindAndModify: false
}
//create a connection to the database
let zenoTripDB = mongoose.createConnection(zenoTripDBURL, options)


zenoTripDB.on('open', (open) => {
   console.log('Zeno Trip database Connected at ' + new Date());
});

//catch error that might occur during connection
zenoTripDB.catch(e => {
   console.log('Zeno Trip database error occurred at ' + new Date())
   console.log(e)
})

zenoTripDB.on('error', (error) => {
   console.log('Zeno Trip database error occurred at ' + new Date());
   console.log(error)
});


module.exports = { mongoose, zenoTripDB };