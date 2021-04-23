const request = require("request");

const helpers = {};

helpers.zenoTripDBLocal = "mongodb://localhost:27017/zeno_trip";
helpers.zenoTripDBLive = "mongodb://lagridemdb:lagridemdb@172.30.19.186:27017/lagridemdb";

// for generating token
const randomToken =
   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";
helpers.generateToken = (len) => {
   let token = "";
   let xLen = randomToken.length - 1;
   for (let i = 0; i < len; i++) {
      token += randomToken.charAt(Math.random() * xLen);
   }
   return token;
};

// for checking input fields
helpers.getInputValueString = (inputObj, field) => {
   return inputObj instanceof Object &&
      inputObj.hasOwnProperty(field) &&
      typeof inputObj[field] === "string"
      ? inputObj[field].trim()
      : "";
};

// for checking input fields
helpers.getInputValueObject = (inputObj, field) => {
   return inputObj instanceof Object &&
      inputObj.hasOwnProperty(field) &&
      typeof inputObj[field] === "object"
      ? inputObj[field]
      : "";
};

// for checking input fields
helpers.getInputValueArray = (inputObj, field) => {
   return inputObj instanceof Object &&
      inputObj.hasOwnProperty(field) &&
      typeof inputObj[field] instanceof Array
      ? inputObj[field]
      : "";
};

//for verifying user token
helpers.makeHTTPRequest = (obj = { uri: "", method: "", headers: {} }) => {
   return new Promise((resolve, reject) => {
      request(obj, (err, res, body) => {
         resolve(err ? { error: err } : body);
      });
   });
};

helpers.outputError = (response, code, message) => {
   response.statusCode = code ? code : 200;
   let outputObj = {};
   switch (code) {
      case 400:
         outputObj = {
            code: code,
            error: typeof message !== "undefined" ? message : `Bad Request`,
         };
         break;
      case 401:
         outputObj = {
            code: code,
            error: typeof message !== "undefined" ? message : `Unauthorized`,
         };
         break;
      case 404:
         outputObj = {
            code: code,
            error:
               typeof message !== "undefined"
                  ? message
                  : `Requested resources does not exist`,
         };
         break;
      case 405:
         outputObj = {
            code: code,
            error: typeof message !== "undefined" ? message : `Method Not Allowed`,
         };
         break;
      case 406:
         outputObj = {
            code: code,
            error:
               typeof message !== "undefined" ? message : `Requested Not Acceptable`,
         };
         break;
      case 500:
         outputObj = {
            code: code,
            error:
               typeof message !== "undefined"
                  ? message
                  : `Oops! Something went wrong.`,
         };
         break;
      case 503:
         outputObj = {
            code: code,
            error:
               typeof message !== "undefined" ? message : `Service unavailable.`,
         };
         break;
      default:
         outputObj = {
            error: message,
         };
   }
   response.json(outputObj);
};

module.exports = helpers;
