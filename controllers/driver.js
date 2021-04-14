const helpers = require('../assets/helpers')
const tripModel = require('../models/trip_request')

class driver {
   constructor(req, res, body, userData) {
      this.method = req.method.toLowerCase()
      this.req = req
      this.res = res
      this.userData = userData;
      this.body = body
   }

   async getTotalTimeDistant() {
      if (this.method !== 'get') {
         return helpers.outputError(this.res, 405)
      }
      let driverID = helpers.getInputValueString(this.req.query, 'driver_auth_id')
      let startDate = helpers.getInputValueString(this.req.query, 'start_date')
      let endDate = helpers.getInputValueString(this.req.query, 'end_date')

      let queryBuilder = {}



      if (driverID) {
         if (driverID.length < 10) {
            return helpers.outputError(this.res, null, "Driver auth id is not valid")
         }
         //add to the query builder
         queryBuilder.driver_id = driverID
      }
      //if start date is submitted
      if (startDate) {
         if (startDate === "today") {
            let t = new Date()
            startDate = `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`
         } else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
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
      //if it's not admin
      if (parseInt(this.userData.admin) !== 1) {
         //if the request does not have a driver's 
         if (!queryBuilder.driver_id) {
            return helpers.outputError(this.res, null, "driver or rider_id is required to retrieve resource")
         }
         //if it's driver that is requesting
         if (driverID) {
            if (this.userData.auth_id !== driverID) {
               return helpers.outputError(this.res, null, "Request token does not match the auth id submitted")
            }
         }
      }

      let getData = await tripModel.DriverWorkHours.aggregate([
         { $match: queryBuilder },
         {
            $group: {
               _id: null,
               time: { $sum: "$time" },
               distant: { $sum: "$km" }
            }
         },
         { $addFields: { "time_value": "sec", "distant_value": "km" } }
      ])
      //check if there's an error
      if (getData && getData.error) {
         return helpers.outputError(this.res, 500)
      }
      //send response
      this.res.json(getData)
   }
}

module.exports = driver