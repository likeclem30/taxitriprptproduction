const helpers = require('../assets/helpers')
const tripModel = require('../models/trip_request')
const dbConnector = require('../models/dbconnector')

class trip {
   constructor(req, res, body, userData) {
      this.method = req.method.toLowerCase()
      this.req = req
      this.res = res
      this.userData = userData;
      this.body = body
   }

   async getTrips() {
      if (this.method !== 'get') {
         return helpers.outputError(this.res, 405)
      }
      let tripID = helpers.getInputValueString(this.req.query, 'trip_id')
      let driverID = helpers.getInputValueString(this.req.query, 'driver_auth_id')
      let riderID = helpers.getInputValueString(this.req.query, 'rider_auth_id')
      let startDate = helpers.getInputValueString(this.req.query, 'start_date')
      let endDate = helpers.getInputValueString(this.req.query, 'end_date')
      let status = helpers.getInputValueString(this.req.query, 'trip_status')
      let rideClass = helpers.getInputValueString(this.req.query, 'trip_class')
      let rideClassComplete = helpers.getInputValueString(this.req.query, 'trip_class_complete')
      let page = helpers.getInputValueString(this.req.query, 'page')
      let itemPage = helpers.getInputValueString(this.req.query, 'item_per_page')

      let queryBuilder = {}

      if (tripID) {
         if (tripID.length !== 24) {
            return helpers.outputError(this.res, null, "A valid trip id is required")
         }
         //add to the query builder
         queryBuilder._id = tripID
      }

      if (driverID) {
         if (driverID.length < 10) {
            return helpers.outputError(this.res, null, "Driver auth id is not valid")
         }
         //add to the query builder
         queryBuilder.driver_id = driverID
      }
      if (riderID) {
         if (riderID.length < 10) {
            return helpers.outputError(this.res, null, "Rider auth id is not valid")
         }
         //add to the query builder
         queryBuilder.riders = { $elemMatch: { rider_id: riderID } }
      }
      //if start date is submitted
      if (startDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            return helpers.outputError(this.res, null, "Invalid start date format. e.g 2020-09-02")
         }
         //convert the date to a date formate
         startDate = new Date(startDate + ' 01:00:00').toISOString()
         //add to the query builder
         queryBuilder.createdAt = { $gte: startDate }
      }
      //if end date is sunmitted
      if (endDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            return helpers.outputError(this.res, null, "Invalid end date format. e.g 2020-09-02")
         }
         //if there's not start date submitted
         if (!startDate) {
            return helpers.outputError(this.res, null, `start date not submitted. 
            To use end date you must submit a start date`)
         }
         //if there's a start date and end data, check if there are valid
         if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
               return helpers.outputError(this.res, null, "Start date can not be higher than end date")
            }
         }
         endDate = new Date(endDate + ' 23:59:00').toISOString()
         //add to the query builder
         queryBuilder.createdAt.$lte = endDate
      }
      //if there's a status requested
      if (status) {
         if (["completed", "on_ride", "waiting", "cancel", "delay", "on_pickup"].indexOf(status) === -1) {
            return helpers.outputError(this.res, null, `Invalid status. must be either of the following 'completed, on_ride, waiting, cancel, delay, on_pickup'`)
         }
         //add to the query builder
         queryBuilder.ride_status = status
      }
      //check the class type
      if (rideClass) {
         if (["A", "B", "C", "D"].indexOf(rideClass) === -1) {
            return helpers.outputError(this.res, null, "Invalid ride class. Most be either A, B ,C or D")
         }
         //add to the query builder
         queryBuilder.ride_class = rideClass
      }
      //check for class Complete
      if (rideClassComplete) {
         if (["yes", "no"].indexOf(rideClassComplete) === -1) {
            return helpers.outputError(this.res, null, "Request for trip class complete must be either yes or no")
         }
         if (!rideClass) {
            return helpers.outputError(this.res, null, "Trip class is required to process class complete request")
         }
         //add to the query builder
         queryBuilder.ride_class_complete = rideClassComplete === "yes" ? true : false
      }
      //if there's an item page requested
      if (itemPage) {
         if (!/^\d+/.test(itemPage)) {
            return helpers.outputError(this.res, null, "Item per page must be a numberic string")
         }
         //if the requested number if items is more than 200, limit the data to 200
         if (parseInt(itemPage) > 200) {
            itemPage = 200
         }
      } else {
         itemPage = 50
      }
      //if there's a page number needed
      if (page) {
         if (!/^\d+/.test(page)) {
            return helpers.outputError(this.res, null, "Page must be a numberic string")
         }
      } else {
         //if 
         page = 1
      }
      itemPage = parseInt(itemPage)
      let skipPage = (page - 1) * itemPage

      //if it's not admin
      if (parseInt(this.userData.admin) !== 1) {
         //if the request does not have a driver's 
         if (!queryBuilder.driver_id && (!queryBuilder.riders || !queryBuilder.riders.$elemMatch)) {
            return helpers.outputError(this.res, null, "driver or rider_id is required to retrieve resource")
         }
         //if it's driver that is requesting
         if (driverID) {
            if (this.userData.auth_id !== driverID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
         //if it's comming from the rider
         if (riderID) {
            if (this.userData.auth_id !== riderID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
      }

      let getData = await tripModel.TripRequests.find(queryBuilder).
         skip(skipPage).select({ location: 0, created: 0, __v: 0 }).
         sort("-createdAt").limit(itemPage).catch(e => ({ error: e }))
      //check if there's an error
      if (getData && getData.error) {
         return helpers.outputError(this.res, 500)
      }
      //send response
      this.res.json(getData)
   }

   async getTripCounts() {
      if (this.method !== 'get') {
         return helpers.outputError(this.res, 405)
      }
      let driverID = helpers.getInputValueString(this.req.query, 'driver_auth_id')
      let riderID = helpers.getInputValueString(this.req.query, 'rider_auth_id')
      let startDate = helpers.getInputValueString(this.req.query, 'start_date')
      let endDate = helpers.getInputValueString(this.req.query, 'end_date')
      let status = helpers.getInputValueString(this.req.query, 'trip_status')
      let rideClass = helpers.getInputValueString(this.req.query, 'trip_class')
      let rideClassComplete = helpers.getInputValueString(this.req.query, 'trip_class_complete')
      let tripID = helpers.getInputValueString(this.req.query, 'trip_id')

      let queryBuilder = {}

      if (tripID) {
         if (tripID.length !== 24) {
            return helpers.outputError(this.res, null, "A valid trip id is required")
         }
         //add to the query builder
         queryBuilder._id = tripID
      }
      if (driverID) {
         if (driverID.length < 10) {
            return helpers.outputError(this.res, null, "Driver auth id is not valid")
         }
         //add to the query builder
         queryBuilder.driver_id = driverID
      }
      if (riderID) {
         if (riderID.length < 10) {
            return helpers.outputError(this.res, null, "Rider auth id is not valid")
         }
         //add to the query builder
         queryBuilder.riders = { $elemMatch: { rider_id: riderID } }
      }
      //if start date is submitted
      if (startDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            return helpers.outputError(this.res, null, "Invalid start date format. e.g 2020-09-02")
         }
         //convert the date to a date formate
         startDate = new Date(startDate + ' 01:00:00').toISOString()
         //add to the query builder
         queryBuilder.createdAt = { $gte: startDate }
      }
      //if end date is sunmitted
      if (endDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            return helpers.outputError(this.res, null, "Invalid end date format. e.g 2020-09-02")
         }
         //if there's not start date submitted
         if (!startDate) {
            return helpers.outputError(this.res, null, `start date not submitted. 
            To use end date you must submit a start date`)
         }
         //if there's a start date and end data, check if there are valid
         if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
               return helpers.outputError(this.res, null, "Start date can not be higher than end date")
            }
         }
         endDate = new Date(endDate + ' 23:59:00').toISOString()
         //add to the query builder
         queryBuilder.createdAt.$lte = endDate
      }
      //if there's a status requested
      if (status) {
         if (["completed", "on_ride", "waiting", "cancel", "delay", "on_pickup"].indexOf(status) === -1) {
            return helpers.outputError(this.res, null, `Invalid status. must be either of the following 'completed, on_ride, waiting, cancel, delay, on_pickup'`)
         }
         //add to the query builder
         queryBuilder.ride_status = status
      }
      //check the class type
      if (rideClass) {
         if (["A", "B", "C", "D"].indexOf(rideClass) === -1) {
            return helpers.outputError(this.res, null, "Invalid ride class. Most be either A, B ,C or D")
         }
         //add to the query builder
         queryBuilder.ride_class = rideClass
      }
      //check for class Complete
      if (rideClassComplete) {
         if (["yes", "no"].indexOf(rideClassComplete) === -1) {
            return helpers.outputError(this.res, null, "Request for trip class complete must be either yes or no")
         }
         if (!rideClass) {
            return helpers.outputError(this.res, null, "Trip class is required to process class complete request")
         }
         //add to the query builder
         queryBuilder.ride_class_complete = rideClassComplete === "yes" ? true : false
      }

      //if it's not admin
      if (parseInt(this.userData.admin) !== 1) {
         //if the request does not have a driver's 
         if (!queryBuilder.driver_id && (!queryBuilder.riders || !queryBuilder.riders.$elemMatch)) {
            return helpers.outputError(this.res, null, "driver or rider_id is required to retrieve resource")
         }
         //if it's driver that is requesting
         if (driverID) {
            if (this.userData.auth_id !== driverID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
         //if it's comming from the rider
         if (riderID) {
            if (this.userData.auth_id !== riderID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
      }


      let getData = await tripModel.TripRequests.collection.countDocuments(queryBuilder).catch(e => ({ error: e }))
      //check if there's an error
      if (getData && getData.error) {
         return helpers.outputError(this.res, 500)
      }
      //send response
      this.res.json({ total: getData })
   }

   async getTotalFare() {
      if (this.method !== 'get') {
         return helpers.outputError(this.res, 405)
      }
      let driverID = helpers.getInputValueString(this.req.query, 'driver_auth_id')
      let riderID = helpers.getInputValueString(this.req.query, 'rider_auth_id')
      let startDate = helpers.getInputValueString(this.req.query, 'start_date')
      let endDate = helpers.getInputValueString(this.req.query, 'end_date')
      let status = helpers.getInputValueString(this.req.query, 'trip_status')
      let rideClass = helpers.getInputValueString(this.req.query, 'trip_class')
      let rideClassComplete = helpers.getInputValueString(this.req.query, 'trip_class_complete')
      let tripID = helpers.getInputValueString(this.req.query, 'trip_id')

      let queryBuilder = {}

      if (tripID) {
         if (tripID.length !== 24) {
            return helpers.outputError(this.res, null, "A valid trip id is required")
         }
         //add to the query builder
         queryBuilder._id = tripID
      }
      if (driverID) {
         if (driverID.length < 10) {
            return helpers.outputError(this.res, null, "Driver auth id is not valid")
         }
         //add to the query builder
         queryBuilder.driver_id = driverID
      }
      if (riderID) {
         if (riderID.length < 10) {
            return helpers.outputError(this.res, null, "Rider auth id is not valid")
         }
         //add to the query builder
         queryBuilder.riders = { $elemMatch: { rider_id: riderID } }
      }
      //if start date is submitted
      if (startDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            return helpers.outputError(this.res, null, "Invalid start date format. e.g 2020-09-02")
         }
         //convert the date to a date formate
         startDate = new Date(startDate + ' 01:00:00').toISOString()
         //add to the query builder
         queryBuilder.createdAt = { $gte: startDate }
      }
      //if end date is sunmitted
      if (endDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            return helpers.outputError(this.res, null, "Invalid end date format. e.g 2020-09-02")
         }
         //if there's not start date submitted
         if (!startDate) {
            return helpers.outputError(this.res, null, `start date not submitted. 
            To use end date you must submit a start date`)
         }
         //if there's a start date and end data, check if there are valid
         if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
               return helpers.outputError(this.res, null, "Start date can not be higher than end date")
            }
         }
         endDate = new Date(endDate + ' 23:59:00').toISOString()
         //add to the query builder
         queryBuilder.createdAt.$lte = endDate
      }
      //if there's a status requested
      if (status) {
         if (["completed", "on_ride", "waiting", "cancel", "delay", "on_pickup"].indexOf(status) === -1) {
            return helpers.outputError(this.res, null, `Invalid status. must be either of the following 'completed, on_ride, waiting, cancel, delay, on_pickup'`)
         }
         //add to the query builder
         queryBuilder.ride_status = status
      }
      //check the class type
      if (rideClass) {
         if (["A", "B", "C", "D"].indexOf(rideClass) === -1) {
            return helpers.outputError(this.res, null, "Invalid ride class. Most be either A, B ,C or D")
         }
         //add to the query builder
         queryBuilder.ride_class = rideClass
      }
      //check for class Complete
      if (rideClassComplete) {
         if (["yes", "no"].indexOf(rideClassComplete) === -1) {
            return helpers.outputError(this.res, null, "Request for trip class complete must be either yes or no")
         }
         if (!rideClass) {
            return helpers.outputError(this.res, null, "Trip class is required to process class complete request")
         }
         //add to the query builder
         queryBuilder.ride_class_complete = rideClassComplete === "yes" ? true : false
      }

      //if it's not admin
      if (parseInt(this.userData.admin) !== 1) {
         //if the request does not have a driver's 
         if (!queryBuilder.driver_id && (!queryBuilder.riders || !queryBuilder.riders.$elemMatch)) {
            return helpers.outputError(this.res, null, "driver or rider_id is required to retrieve resource")
         }
         //if it's driver that is requesting
         if (driverID) {
            if (this.userData.auth_id !== driverID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
         //if it's comming from the rider
         if (riderID) {
            if (this.userData.auth_id !== riderID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
      }


      let getData = await tripModel.TripRequests.aggregate([
         { $match: queryBuilder },
         { $unwind: "$riders" },
         {
            $group: {
               _id: null,
               total: { $sum: "$riders.fare" }
            }
         }
      ])

      //send response
      this.res.json(getData)
   }

   async getTotalDistant() {
      if (this.method !== 'get') {
         return helpers.outputError(this.res, 405)
      }
      let driverID = helpers.getInputValueString(this.req.query, 'driver_auth_id')
      let riderID = helpers.getInputValueString(this.req.query, 'rider_auth_id')
      let startDate = helpers.getInputValueString(this.req.query, 'start_date')
      let endDate = helpers.getInputValueString(this.req.query, 'end_date')
      let status = helpers.getInputValueString(this.req.query, 'trip_status')
      let rideClass = helpers.getInputValueString(this.req.query, 'trip_class')
      let rideClassComplete = helpers.getInputValueString(this.req.query, 'trip_class_complete')
      let tripID = helpers.getInputValueString(this.req.query, 'trip_id')

      let queryBuilder = {}


      if (tripID) {
         if (tripID.length !== 24) {
            return helpers.outputError(this.res, null, "A valid trip id is required")
         }
         //add to the query builder
         queryBuilder._id = dbConnector.mongoose.Types.ObjectId(tripID)
      }

      if (driverID) {
         if (driverID.length < 10) {
            return helpers.outputError(this.res, null, "Driver auth id is not valid")
         }
         //add to the query builder
         queryBuilder.driver_id = driverID
      }
      if (riderID) {
         if (riderID.length < 10) {
            return helpers.outputError(this.res, null, "Rider auth id is not valid")
         }
         //add to the query builder
         queryBuilder.riders = { $elemMatch: { rider_id: riderID } }
      }
      //if start date is submitted
      if (startDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            return helpers.outputError(this.res, null, "Invalid start date format. e.g 2020-09-02")
         }
         //convert the date to a date formate
         startDate = new Date(startDate + ' 01:00:00').toISOString()
         //add to the query builder
         queryBuilder.createdAt = { $gte: startDate }
      }
      //if end date is sunmitted
      if (endDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            return helpers.outputError(this.res, null, "Invalid end date format. e.g 2020-09-02")
         }
         //if there's not start date submitted
         if (!startDate) {
            return helpers.outputError(this.res, null, `start date not submitted. 
            To use end date you must submit a start date`)
         }
         //if there's a start date and end data, check if there are valid
         if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
               return helpers.outputError(this.res, null, "Start date can not be higher than end date")
            }
         }
         endDate = new Date(endDate + ' 23:59:00').toISOString()
         //add to the query builder
         queryBuilder.createdAt.$lte = endDate
      }
      //if there's a status requested
      if (status) {
         if (["completed", "on_ride", "waiting", "cancel", "delay", "on_pickup"].indexOf(status) === -1) {
            return helpers.outputError(this.res, null, `Invalid status. must be either of the following 'completed, on_ride, waiting, cancel, delay, on_pickup'`)
         }
         //add to the query builder
         queryBuilder.ride_status = status
      }
      //check the class type
      if (rideClass) {
         if (["A", "B", "C", "D"].indexOf(rideClass) === -1) {
            return helpers.outputError(this.res, null, "Invalid ride class. Most be either A, B ,C or D")
         }
         //add to the query builder
         queryBuilder.ride_class = rideClass
      }
      //check for class Complete
      if (rideClassComplete) {
         if (["yes", "no"].indexOf(rideClassComplete) === -1) {
            return helpers.outputError(this.res, null, "Request for trip class complete must be either yes or no")
         }
         if (!rideClass) {
            return helpers.outputError(this.res, null, "Trip class is required to process class complete request")
         }
         //add to the query builder
         queryBuilder.ride_class_complete = rideClassComplete === "yes" ? true : false
      }

      //if it's not admin
      if (parseInt(this.userData.admin) !== 1) {
         //if the request does not have a driver's 
         if (!queryBuilder.driver_id && (!queryBuilder.riders || !queryBuilder.riders.$elemMatch)) {
            return helpers.outputError(this.res, null, "driver or rider_id is required to retrieve resource")
         }
         //if it's driver that is requesting
         if (driverID) {
            if (this.userData.auth_id !== driverID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
         //if it's comming from the rider
         if (riderID) {
            if (this.userData.auth_id !== riderID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
      }


      let getData = await tripModel.TripRequests.aggregate([
         { $match: queryBuilder },
         { $unwind: "$riders" },
         {
            $group: {
               _id: null,
               total: { $sum: "$riders.total_distance" }
            }
         }
      ])

      //send response
      this.res.json(getData)
   }

}

module.exports = trip