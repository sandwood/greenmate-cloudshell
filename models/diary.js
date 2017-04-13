var mongoose = require("mongoose");
var now = new Date();
var moment = require("moment-timezone");


var commentSchema = new mongoose.Schema({
  commentId : String,
  username : String,
  writer : Number,
  comment: String,
  published_date: {
      type: String,
      default: moment(Date.now()).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
    }
});


var diarySchema = new mongoose.Schema({
  
    userSeq : Number,
    diaryType : Number,
    plantId : String,
    diaryId : String,
    title: String,
    plantName : String,
    position : String,
    afterPlanting : Number,
    content: String,
    picUrl: String,
    factory : String,
    gateway : String,
    block : Number,
    plantInfo : {},
    // timestamps
    published_date: {
      type: String,
      default: moment().tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
    },

    comments: [commentSchema]
});


diarySchema.pre("save", function(next) {
  return next();
});

commentSchema.pre("save", function(next) {
  next();
});


var diary = mongoose.model("diary", diarySchema);


module.exports = diary;