var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
var moment = require("moment-timezone");


var notiSchema = new mongoose.Schema({
    
    userSeq : String,
    notiId: String,
    read : Number,
    contents: String, 
    published_date : {
        type : String,
        default : moment(Date.now()).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
    }
  
});


notiSchema.pre("save", function(next) {
  return next();
});



var noti = mongoose.model("noti", notiSchema);

module.exports = noti;
