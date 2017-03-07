var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');


var appInfoSchema = new mongoose.Schema({

  ios:{
    type: String,
    required: true
  },
  iosDate: {
    type: Date,
    default: Date.now
  },
  android:{
    type: String, 
    unique: true, 
    required: true
  },
  androidDate :{
    type : Date,
    default: Date.now
  },
  is_maintenance :{
    type: Number,
    required: true
  }
});


appInfoSchema.pre("save", function(next) {
  return next();
});



var appInfo = mongoose.model("appInfo", appInfoSchema);

module.exports = appInfo;
