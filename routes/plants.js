var express = require("express");
var router = express.Router();
var Plant = require("../models/plant");
var User = require("../models/user");
var Diary = require("../models/diary");
var Nthing = require("../models/nthing");
var FCM = require("fcm-node");
var now = new Date();
var dateFormat = require("dateformat");
dateFormat.masks.hammerTime= 'yyyy-mm-dd hh:MM';
dateFormat(now,"hammerTime");




var apiKey = 'AAAAPTzFJJM:APA91bHMuqNIHv_IDhhsT08BoJvkWHaCzUPdXV-VzLbtPtk4v9dYJQ0jpcjYsE745dCr2pPrIA1anDx02ZTTzUAj0_2Gz588RIBb5SHbEU8QY3-3HjjhlEFu6ZReM-zF_n4Q91SEsF1WUIgdBTx2Ao_UD_NmZMRxtw';

var fcm = new FCM(apiKey);


//----------------register a new plant. with bucket name--------
router.post("/addPlant",function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    var userId = req.body.userId;
    var plantName = req.body.plantName;
    var position = req.body.position;
    var species = req.body.species;
    var harvestDue = req.body.harvestDue;
    var plantList= [];
    console.log(plantName);
            
    User.findOne({$and : [{id: userId}, {block:0}]}).exec(
    function(err, user){
        if(err){
            return res.status(err.code).json({isSuccess : 0});
        }
        else{
                  
            console.log(userId);       
            var plantId = "user_"+ user.userSeq +'-'+ Date.now();
            plantList = user.plants;
            plantList.push(plantId);
                                
            var plant = new Plant({
                harvest : 0,
                harvestDue : harvestDue,
                afterPlanting : 0,
                userId : userId,
                userSeq : user.userSeq,
                username : user.username,
                plantId : plantId,
                species : species,
                position : position,
                plantName : plantName,
                diaryCount : 0,
                published_date : now,
                block: 0,
            });
                                    
            plant.save(function(error, plant) {
                if(error){
                    console.log(error);
                    return res.status(error.code).json({isSuccess: 0});
                }
            });
                
            User.update({id : userId},{$set: {plantCount : plantCount, plants : plantList}},
                function(err,tasks){
                    if(err){
                        return res.status(err.code).json({isSuccess : 0});
                    }
                    console.log("A plant is registered!");
                    console.log(req.headers['userseq']);
                    User.findOne({userSeq: req.headers['userseq']}).exec(function(err, user){
                        if(err){
                            console.log(err);
                            return res.status(err.code).json({isSuccess: 0});
                        }
                        else{
                            user.managingPlants.push(plantId);
                            user.save();
                        }
                    });
            });
        }
    });
    console.log(plantName);
    return res.status(201).json({isSuccess : 1});
});

    
//---------------- get plant info to wirte a diary --------------------
router.post("/info/", function(req,res){
    res.setHeader("Access-Control-Allow-Origin", "*");
   Plant.getPlantInfo(req, res);
});


//----------------------- Harvest Push notification -------

router.post("/harvest", function(req,res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    var userId = req.body.userId;
    var plantId = req.body.plantId;
    var deviceId = [];
    
    console.log(userId);
    
    
    
    Plant.findOne({plantId : plantId})
        .exec(function(err, plant){
            if(err){
                console.log(err);
                return res.status(err.code).json({isSuccess : 0});
            }
            else{
                Plant.update({plantId : plantId}, {$set : {harvest : 1}},function(err, tasks){
                    if(err){
                        return res.status(err.code).json({isSuccess: 0});
                    }
                    else{
                        User.findOne({$and: [{id: userId},{block: 0}]}, function(err, user){
                            if(err){
                              return res.status(err.code).json({isSuccess : 0});
                            }
                            else{
                                deviceId = user.deviceId;
                                deviceId.forEach(function(device){
                                    var message = {
                                            to : device, // required
                                            notification : {
                                                title: "It's Green Mate :)",
                                                body : "It's time to harvest your "+ plant.plantName+"!"
                                            },
                                            data : {
                                                my_key : 'my value',
                                                my_another_key : 'my another value'
                                            }
                                    };
                                    fcm.send(message, function(err, messageId){
                                        if(err){
                                          return res.status(err.code).json({isSuccess : 0});
                                        }
                                         else {
                                            console.log("Sent with message ID: ", messageId);
                                        }
                                    });
                                });
                            }
                            return res.status(200).json({isSuccess : 1});
                        });    
                    }
                }
            );
        }
    });
    
});


router.post("/getAllPlants", function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    
    
    Plant.find().sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, plants) {
        if(err) return res.status(err.code).json({isSuccess : 0, err: err});
        
        Plant.find().count(function(err,count){
            if(err) return res.status(err.code).json({isSuccess : 0, err: err});
            if((page-1)*num+ num >= count){
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 1,
                    plants : plants
                });        
            }
            else{
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 0,
                    plants : plants
                });
            }    
        });   
    });
});

router.post("/getUserPlants", function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    var userSeq = req.headers['userseq'];
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    
    
    Plant.find({userSeq : userSeq}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, plants){
        if(err) return res.json({isSuccess : 0, err: err});
        
        Plant.find({userSeq : userSeq}).count(function(err,count){
            if(err) return res.status(err.code).json({isSuccess : 0, err: err});

            
            if((page-1)*num+ num >= count){
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 1,
                    plants : plants
                });        
            }
            else{
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 0,
                    plants : plants
                });
            }    
        }); 
    });
});

router.post("/getSpeciesPlants", function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    var species = req.body.species;
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    
    
    Plant.find({species : species}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, plants){
        if(err) return res.json({isSuccess : 0, err: err});
        
        Plant.find({species : species}).count(function(err,count){
            if(err) return res.status(err.code).json({isSuccess : 0, err: err});
            if((page-1)*num+ num >= count){
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 1,
                    plants : plants
                });        
            }
            else{
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 0,
                    plants : plants
                });
            }    
        }); 
    });
});


   
module.exports = router;
