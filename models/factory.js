var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');

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

var factorySchema = new mongoose.Schema({

  location:{
    type: String,
    unique: true,
    required: true
  },
  auth:{
    type: String, 
    unique: true, 
    required: true
  },
  managers : {
    type : [],
  },
  gates:{
    type: [],
  },
  published_date: {
    type: String,
    default: dateForTimezone(+540)
  }
  
});


factorySchema.pre("save", function(next) {
  return next();
});


//----------------- get all factorys ---------------------------
factorySchema.statics.getfactorys = function(req,res){
  var page = req.query.page;
  if(page==null) page = 0;
  
  factory.find().sort({published_date: -1}).skip((page-1)*10).limit(10).exec(function(err, factorys){
      if(err) {
          console.log(err); 
          return res.status(err.code).json({resultCode: 0});
      }
      if(factorys == null){
        return res.json({resultCode: 0,
          msg : "no factory."
        });
      }
          
      return res.status(200).json(factorys);
  });  
};



var factory = mongoose.model("factory", factorySchema);

module.exports = factory;
