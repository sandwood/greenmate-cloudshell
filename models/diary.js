var mongoose = require("mongoose");
var now = new Date();

function dateForTimezone(offset, d) {

  // Copy date if supplied or use current
  d = d? new Date(+d) : new Date();

  // Use supplied offset or system
  offset = offset || -d.getTimezoneOffset();
  // Prepare offset values
  var offSign = offset < 0? '-' : '+'; 
  offset = Math.abs(offset);
  var offHours = ('0' + (offset/60 | 0)).slice(-2);
  var offMins  = ('0' + (offset % 60)).slice(-2);

  // Apply offset to d
  d.setUTCMinutes(d.getUTCMinutes() + offset);

  // Return formatted string
  return d.getUTCFullYear() + 
    '-' + ('0' + (d.getUTCMonth()+1)).slice(-2) + 
    '-' + ('0' + d.getUTCDate()).slice(-2) + 
    ' ' + ('0' + d.getUTCHours()).slice(-2) + 
    ':' + ('0' + d.getUTCMinutes()).slice(-2);
}


var commentSchema = new mongoose.Schema({
  writer : Number,
  comment: String,
  published_date: {
      type: String,
      default: dateForTimezone(+540)
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
    plantInfo : [],
  
    // timestamps
    published_date: {
      type: String,
      default: dateForTimezone(+540)
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