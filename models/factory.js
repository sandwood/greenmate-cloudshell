var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
var moment = require("moment-timezone");


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
    default: moment(Date.now()).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
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
