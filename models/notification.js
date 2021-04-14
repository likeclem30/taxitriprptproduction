const dbConnector = require('./dbconnector');
const Schema = dbConnector.mongoose.Schema;


const ActivityLogs = new Schema({
   id: Schema.Types.ObjectId,
   user_id: {
      type: String,
      required: true
   },
   body: {
      type: String,
      required: true
   }
}, {
   minimize: true,
   id: true,
   timestamps: true
})


const Notifications = new Schema({
   id: Schema.Types.ObjectId,
   user_id: {
      type: String,
      required: true
   },
   title: {
      type: String,
   },
   body: {
      type: String,
      required: true
   },
   status: {
      type: Array,
      default: []
   }
}, {
   minimize: true,
   id: true,
   timestamps: true
})


module.exports = {
   Notifications: dbConnector.zenoTripDB.model('notifications', Notifications),
   ActivityLogs: dbConnector.zenoTripDB.model('activity_logs', ActivityLogs),
}