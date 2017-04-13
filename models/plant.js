var nthing = require("../models/nthing");
var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
var moment = require("moment-timezone");


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
  manager : String,
  factory : String,
  gateway : String,
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
    default: moment(Date.now()).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
  },
  updated_at : String
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
      
        var sensor = [];  
        console.log(plant);
        if(plant.sensorData)
            sensor = plant.sensorData;
        
        
        return res.status(200).json({
                  isSuccess : 1,
                  harvest : plant.harvest,
                  username : plant.username,
                  userId : plant.userId,
                  userSeq : plant.userSeq,
                  manager : plant.manager,
                  factory : plant.factory,
                  plantId : plant.plantId,
                  plantName : plant.plantName,
                  sensorData : sensor,
                  // 센서데이터가 다 들어 갔을 때 위의 sensorData : sensor코드를 아래 코드로 대체할 것 
                  // sensorData : plant.sensorData,
                  published_date : plant.published_date,
                  updated_at : plant.updated_at
              });
   
      });
    
};

var Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
