var express = require("express");
var router = express.Router();
var Plant = require("../models/plant");
var User = require("../models/user");
var Diary = require("../models/diary");
var mydiary = require("../models/mydiary");
var Nthing = require("../models/nthing");
var multiparty=require('multiparty');
var gcs = require('@google-cloud/storage')({
  projectId: "greentest-159305",
  keyFilename: '../config/keyfile',
  credentials: require('../config/keyfile')
});

var FCM = require("fcm-node");
var apiKey = 'AAAAPTzFJJM:APA91bHMuqNIHv_IDhhsT08BoJvkWHaCzUPdXV-VzLbtPtk4v9dYJQ0jpcjYsE745dCr2pPrIA1anDx02ZTTzUAj0_2Gz588RIBb5SHbEU8QY3-3HjjhlEFu6ZReM-zF_n4Q91SEsF1WUIgdBTx2Ao_UD_NmZMRxtw';

var fcm = new FCM(apiKey);


//--------------------- listing all plants.-------------------
router.get("/", function(req, res){
    var page = req.query.page;
    var num = Number(req.query.num);
    
    Plant.find().sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, plants){
        if(err){
            return res.status(err.code).json({isSuccess : 0});
        }
        
        Plant.find().count(function(err,count){
            if(err) return res.status(err.code).json({isSuccess : 0});
            console.log(count);
            
            if((page-1)*num+ num >= count){
                return res.json({
                    isSuccess : 1,
                    isLast : 1,
                    items : plants
                });        
            }
            else{
                return res.json({
                    isSuccess : 1,
                    isLast : 0,
                    items : plants
                });
            }
        });
        // for mobile app    
        
    });
});
// ----------------------- listing specific user's diarys ---------------------
router.post("/getDiaryList", function(req, res){
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    var listType = req.body.listType;
    var userSeqNum = req.headers['seqnum'];
    var itemlist = [];
    var userPlants = [];
                                        
    if(listType == "all"){
        
        Diary.find({userSeqNum: userSeqNum}).sort({published_date: -1}).exec(function(err, diaryItems){
            if(err) res.status(err.code).json({
                isSuccess : 0,
                isLast: 0,
                items: []
            });
            else{
                mydiary.find({userSeqNum: userSeqNum}).sort({published_date: -1}).exec(function(err, mydiaryItems){
                    if(err) res.status(err.code).json({
                        isSuccess : 0,
                        isLast: 0,
                        items: []
                    });
                    else{
                        Plant.find({userSeqNum : userSeqNum}).sort({published_date: 1}).exec(function(err, plants){
                            if(err) res.status(err.code).json({
                                isSuccess : 0,
                                isLast: 0,
                                items: []
                            });
                            else{
                                plants.forEach(function(plant){
                                    var json = {
                                        plantId : plant.plantId,
                                        plantName : plant.plantName
                                    };
                                    userPlants.push(json);
                                });
                                        
                                mydiaryItems.forEach(function(item){
                                    var hasManagerAnswer;
                                    if(item.comments != []){
                                        item.comments.forEach(function(comment){
                                            if(comment.writer == 1)
                                                hasManagerAnswer = 1;
                                        });
                                    };
                                            
                                    var newItem = {
                                        itemType : 1,
                                        itemId : item.mydiaryId,
                                        title : item.title,
                                        picUrl : item.picUrl,
                                        comments : item.comments[this.length],
                                        hasManagerAnswer : hasManagerAnswer,
                                        published_date : item.published_date
                                    };
                                        
                                    itemlist.push(newItem);
                                });
                                    
                                diaryItems.forEach(function(item){
                                    var newItem = {
                                        itemType : 0,
                                        itemId : item.diaryId,
                                        title : item.plantName,
                                        picUrl : item.picUrl,
                                        comments : {},
                                        hasManagerAnswer : 0,
                                        published_date : item.published_date
                                    };
                                            
                                    itemlist.push(newItem);
                                });
                                        
                                if((page-1)*num+ num >= itemlist.length){
                                    return res.status(200).json({
                                        isSuccess : 1,
                                        isLast : 1,
                                        categories : userPlants,
                                        items : itemlist.slice((page-1)*num, itemlist.length)
                                    });        
                                }
                                else{
                                    return res.status(200).json({
                                        isSuccess : 1,
                                        isLast : 0,
                                        categories : userPlants,
                                        items : itemlist.slice((page-1)*num, (page-1)*num+num)
                                    });
                                }
                            }
                        });
                    }
                });
            }
        })
    }
    else if(listType == "mine"){
        mydiary.find({userSeqNum: userSeqNum}).sort({published_date: -1}).exec(function(err, mydiaryItems){
            if(err) res.status(err.code).json({
                isSuccess : 0,
                isLast: 0,
                items: []
            });
            else{
                
                Plant.find({userSeqNum : userSeqNum}).sort({published_date: 1}).exec(function(err, plants){
                    if(err) res.status(err.code).json({
                        isSuccess : 0,
                        isLast: 0,
                        items: []
                    });
                    else{
                        plants.forEach(function(plant){
                            var json = {
                                plantId : plant.plantId,
                                plantName : plant.plantName
                            };
                            userPlants.push(json);
                        });
                        
                        mydiaryItems.forEach(function(item){
                            var hasManagerAnswer;
                            if(item.comments != []){
                                item.comments.forEach(function(comment){
                                    if(comment.writer == 1)
                                        hasManagerAnswer = 1;
                                });
                            };
                                            
                            var newItem = {
                                itemType : 1,
                                itemId : item.mydiaryId,
                                title : item.title,
                                picUrl : item.picUrl,
                                comments : item.comments[this.length],
                                hasManagerAnswer : hasManagerAnswer,
                                published_date : item.published_date
                            };
                                        
                            itemlist.push(newItem);
                        });
                
                        if((page-1)*num+ num >= itemlist.length){
                            return res.status(200).json({
                                isSuccess : 1,
                                isLast : 1,
                                categories : userPlants,
                                items : itemlist.slice((page-1)*num, itemlist.length)
                            });        
                        }
                        else{
                            return res.status(200).json({
                                isSuccess : 1,
                                isLast : 0,
                                categories : userPlants,
                                items : itemlist.slice((page-1)*num, (page-1)*num+num)
                            });
                        }
                    }
                })
            }
        });    
    }
    else{
        Diary.find({plantId: listType}).sort({published_date: -1}).exec(function(err, diaryItems){
            if(err) res.status(err.code).json({
                isSuccess : 0,
                isLast: 0,
                items: []
            });
            else{
                
                Plant.find({userSeqNum : userSeqNum}).sort({published_date: 1}).exec(function(err, plants){
                    if(err) res.status(err.code).json({
                        isSuccess : 0,
                        isLast: 0,
                        items: []
                    });
                    else{
                        plants.forEach(function(plant){
                            var json = {
                                plantId : plant.plantId,
                                plantName : plant.plantName
                            };
                            userPlants.push(json);
                        });
                        
                        diaryItems.forEach(function(item){
                            var newItem = {
                                itemType : 0,
                                itemId : item.diaryId,
                                title : item.plantName,
                                picUrl : item.picUrl,
                                comments : {},
                                hasManagerAnswer : 0,
                                published_date : item.published_date
                            };
                                            
                            itemlist.push(newItem);
                        });
                                        
                        if((page-1)*num+ num >= itemlist.length){
                            console.log("last");
                            return res.status(200).json({
                                isSuccess : 1,
                                isLast : 1,
                                categories : userPlants,
                                items : itemlist.slice((page-1)*num, itemlist.length)
                            });        
                        }
                        else{
                            console.log("hi");
                            return res.status(200).json({
                                isSuccess : 1,
                                isLast : 0,
                                categories : userPlants,
                                items : itemlist.slice((page-1)*num, (page-1)*num+num)
                            });
                        }        
                    }
                })
   
            }
        });
    }
});


// -----------------------listing specific plant's diarys --------------------
router.get("/:plantId/plantDiary", function(req, res){
    var page = req.query.page;
    var num = Number(req.query.num);
    
   Diary.find({plantId : req.params.plantId}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, diaries){
        if(err){
            return res.status(err.code).json({isSuccess : 0});
        }
        else{
            Diary.find({plantId : req.params.plantId}).count(function(err,count){
                if(err) return res.status(err.code).json({isSuccess : 0});
                if((page-1)*num+ num >= count){
                    return res.status(200).json({
                        isSuccess : 1,
                        isLast : 1,
                        items : diaries
                    });        
                }
                else{
                    return res.status(200).json({
                        isSuccess : 1,
                        isLast : 0,
                        items : diaries
                    });
                }
            });
        }  
    }); 
});



//----------------register a new plant. with bucket name--------
router.route("/newPlant")

    .get(function(req, res) {
        User.getUserInfo(req, res);
    })
    
    .post(function(req, res){
          var userId = req.body.userId;
          var plantName = req.body.plantName;
          var position = req.body.position;
          var harvestDue = req.body.harvestDue
          var plantList= [];
          console.log(plantName);
                
          User.findOne({$and : [{id: userId}, {block:0}]}).exec(
            function(err, user){
              if(err){
                  return res.status(err.code).json({isSuccess : 0});
                }
              else{
                  
                console.log(userId);        
                var plantCount = user.plantCount;
                plantCount++;
                var plantId = "user_"+ user.seqNum +'-'+plantCount;
                plantList = user.plants;
                plantList.push(plantId);
                                
                var plant = new Plant({
                  harvest : 0,
                  harvestDue : harvestDue,
                  afterPlanting : 0,
                  userSeqNum : user.seqNum,
                  username : user.username,
                  plantId : plantId,
                  position : position,
                  plantName : plantName,
                  diaryCount : 0,
                  block: 0,
                  bucket : user.bucket,
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
                });
              }
            }
          );
          console.log(plantName);
          return res.status(200).json({isSuccess : 1});
    });

    
//---------------- get plant info to wirte a diary --------------------
router.post("/info/", function(req,res){
   Plant.getPlantInfo(req, res);
});

//---------------- writing a new diary.----------------------
router.post("/newDiary/", function(req, res, next){
    
    var form = new multiparty.Form();
    var bucketName, bucket;
    var plantId, comments, position;
    var diaryCount;
    var picUrl= [];
    var diaries = [];
    // var plantInfo = [];
    
    // for sensor data 
    // var factory, gateway;
    
    // get field name & value
    form.on('field', function(name, value){
        console.log('normal field /name ='+ name +', value=' + value); 
        switch (name) {
            
            case 'plantId' :
                plantId = value; break;
            case 'comments' :
                comments = value; break;
            case 'bucketName' :
                bucketName = value; break;
            case 'diaryCount' :
                diaryCount = value; diaryCount++; break;
            case 'position' : 
                position = value; break;
            // case 'factory' :
            //     factory = value; break;
            // case 'gateway' :
            //     gateway = value; break;
            default:
                break;
        }
    });
        
    //file upload handling
    form.on('part', function(part){

        var filename; 
        var size;
        
        bucket = gcs.bucket(bucketName);
        
        if(part.filename) {
            
            size = part.byteCount;
            filename = "diary/"+ plantId +"/diary-"+ diaryCount + "/" + part.filename;
            var tempPicUrl = "storage.googleapis.com/"+bucketName+"/"+ filename;
            picUrl.push(tempPicUrl);
            
          // console.log(req.user);
        }else{
            part.resume();
        }
          
        console.log("Write Streaming file : " + filename);
         
        // pipe connection
        var remoteWriteStream = bucket.file(filename).createWriteStream();
        part.pipe(remoteWriteStream);
         
         
        part.on('data', function(chunk){
          console.log(filename + ' read '+chunk.length + 'bytes'); 
        });
         
        part.on('end', function(){
            console.log(filename + 'Part read complete');
            remoteWriteStream.end();
        });
    });
       
    //all uploads are completed 
    form.on('close', function(){
        Plant.findOne({plantId : plantId})
        .exec(function(err,plant){
          if(err){
              return res.status(err.code).json({isSuccess : 0});
          }
          else{
              
            //----getting nthing sensor data.
            // Nthing.find({ $and : [{factory : factory}, {gateway : gateway}]}).sort({date: -1}).limit(1)
            // .exec(function(err, sensorData){
            //     if(err) {
            //         console.log(err); 
            //         return res.status(err.code).json({isSuccess: 0});
            //     }
            //     if(sensorData == null){
            //         return res.json({isSuccess: 0, msg : "no such data."});
            //     }
            //     else{
                    // --- set diary count
                    console.log(plant);
                    
                    var diaryCount = plant.diaryCount;
                    diaryCount++;
                    var diaryId = plantId + '-' +diaryCount;
                    diaries = plant.diary;
                    diaries.push(diaryId);
                    // plantInfo.push(sensorData);
                    
                    
                //   }
                // });
                return res.json({isSuccess : 1});
            }
          });
            
    });
    
    //track progress
    form.on('progress',function(byteRead,byteExpected){
        console.log(' Reading total  '+byteRead+'/'+byteExpected);
    });
        
    form.parse(req);
});
    

//----------------------- Harvest Push notification -------

router.get("/:userId/:plantId/harvest", function(req,res){
    var userId = req.params.userId;
    var plantId = req.params.plantId;
    var deviceId = [];
    
    console.log(userId);
    
    User.findOne({id: userId}, function(err, user){
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
                            body : "It's time to harvest your plant!"
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
            
            Plant.findOne({plantId : plantId})
            .exec(function(err, plant){
                if(err){
                    console.log(err);
                    return res.status(err.code).json({isSuccess : 0});
                }
                else{
                    Plant.update({plantId : plantId}, {$set : {harvest : 1}},
                        function(err, tasks){
                            if(err){
                              return res.status(err.code).json({isSuccess: 0});
                            }
                            else{}
                        }
                    );
                }
            });
        }
        return res.status(200).json({isSuccess : 1});
    });
    
});


   
module.exports = router;
