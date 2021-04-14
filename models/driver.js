const dbConnector = require('./dbconnector');
const Schema = dbConnector.mongoose.Schema;

const drivers = new Schema({
   id: Schema.Types.ObjectId,
   user_id: {
      type: String,
      required: true,
      unique: true
   },
   user_email: {
      type: String,
      required: true,
      unique: true
   },
   user_name: {
      type: String,
      maxlength: 45
   },
   user_phone: {
      type: String,
      maxlength: 16
   },
   user_approve: {
      type: Boolean,
      required: true,
   },
   car_plate_number: {
      type: String,
      required: true,
   },
   car_color: {
      type: String,
      // required: true,
   },
   car_model: {
      type: String,
      // required: true,
   },
   online: {
      type: Boolean,
      required: true,
      default: false
   },
   on_trip: {
      type: String,
      required: true,
      enum: ['waiting', 'yes', 'no'],
      default: 'no'
   },
   location: {
      type: {
         type: String,
         enum: ['Point'],
         required: true
      },
      coordinates: {
         type: [Number],
         required: true
      },
   }
}, {
   timestamps: true,
   minimize: false,
   id: true,
});

drivers.index({ location: '2dsphere' });


module.exports = dbConnector.zenoTripDB.model('drivers', drivers);