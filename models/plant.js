
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



var plantSchema = new mongoose.Schema({
  userSeq: {
    type: Number,
    required: true
  },
  harvest : {
    type : Number,
    required : true
  },
  harvestDue :{
    type : Number,
    required : true
  },
  afterPlanting : {
    type : Number,
    required : true
  },
  username: {
    type : String,
    unique : false,
    required : true
  },
  userId: {
    type : String
  },
  plantId: {
    type: String,
    unique: true,
    required: true
  },
  species : {
    type : String
  },
  position : {
    type : String, 
    required : true
  },
  plantName: {
    type: String
  },
  comments:{
    type: String
  },
  diary: {
    type : [ ]
  },
  block: {
    type : Number,
    required : true
  },
  picUrl: {
    type : String
  },
  sensorData: [],
  
  published_date: {
    type: String,
    default: dateForTimezone(+540)
  }
});


plantSchema.pre("save", function(next) {
  return next();
});


plantSchema.statics.serialize = function() {
  return function(plant, callback) {
    return callback(null, plant._id);
  }
}


plantSchema.statics.deserialize = function() {
  return function(id, callback) {
    Plant.findOne({_id: id}, function(error, plant) {
      return callback(error, plant);
    });
  }
}


//----------- get plant info --------------------
plantSchema.statics.getPlantInfo = function(req,res){
  
  var position = req.body.position;
  
  Plant.findOne({$and :[{position : position},{block: 0}]}).exec(function(err, plant){
      if(err) {
          console.log(err); 
          return res.status(err.code).json({isSuccess: 0});
      }
      if(!plant){
        return res.json({isSuccess: 0,
          msg : "no such plant."
        });
      }
          
      console.log(plant);

      return res.status(200).json({
                isSuccess : 1,
                harvest : plant.harvest,
                userId : plant.userId,
                userSeq : plant.userSeq,
                plantId : plant.plantId,
                plantName : plant.plantName
            });
      
  });  
};

var Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
