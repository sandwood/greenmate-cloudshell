var express = require("express");
var router = express.Router();
var Diary = require("../models/diary");
var Plant = require("../models/plant");
var User = require("../models/user");
var now = new Date();
var dateFormat = require("dateformat");
dateFormat.masks.hammerTime= 'yyyy-mm-dd hh:MM';
dateFormat(now,"hammerTime");


    
//---------------- writing a new diary.----------------------
router.post("/addDiary/", function(req, res, next){
    
    //factory diary registeration.
    var plantId="";
    var diaryId = "";
    var title = "";
    var plantName = "";
    var afterPlanting = 0;
    var position = "";
    var factory = "";
    var gateway ="";
    var plantInfo = [];
    
    
    if(req.body.diaryType == 0){
        
        Plant.findOne({plantId : req.body.plantId}).exec(function(err, plant){
            if(err) res.status(err.code).json({isSuccess: 0, err: err});
            else{
                
                // sensor data should be inserted!
                //Nthing.find{$and : [{factory : plant.factory},{geteway : plant.gateway}]}.sort({date: -1}).limit(1).exec(function(err,sensor){
                    var plant= plant;
                    
                    var diaryId = plant.plantId +'-'+ Date.now();
                    
                    plant.diary.push(diaryId);
                    plant.picUrl = req.body.picUrl;
                    
                    var diary = new Diary({
                        userSeq : req.headers['userseq'],
                        diaryType : req.body.diaryType,
                        afterPlanting : plant.afterPlanting,
                        plantId : plant.plantId,
                        diaryId : diaryId,
                        title : title,
                        // factory : plant.factory,
                        // gateway : plant.gateway,
                        factory : factory,
                        gateway : gateway,
                        plantName : plant.plantName,
                        position : req.body.position,
                        content : req.body.content,
                        plantInfo : plantInfo,
                        picUrl : req.body.picUrl,
                        block : 0
                    });
                                
                    diary.save(function(err, diary){
                        if(err){
                            console.log(err);
                            res.status(err.code).json({isSuccess : 0});
                        }
                        plant.save(function(err, plant){
                          if(err) return res.status(err.code).json({isSuccess: 0, err: err});
                          else{
                            return res.status(201).json({isSuccess: 1, msg: "Successfully created."});
                          }
                        })
                    });
             // })
            }
        })
    }
    //My diary registeration.
    else if(req.body.diaryType == 1){
        var diaryId = "user_"+ req.headers['userseq'] +'-'+ Date.now();
        
        var diary = new Diary({
            userSeq : req.headers['userseq'],
            diaryType : req.body.diaryType,
            diaryId : diaryId,
            title : req.body.title,
            content : req.body.content,
            picUrl : req.body.picUrl,
            userSeq : req.headers['userseq'],
            afterPlanting : afterPlanting,
            plantId : plantId,
            factory : factory,
            gateway : gateway,
            plantName : plantName,
            position : position,
            plantInfo : plantInfo,
            block : 0 
        });
                
        diary.save(function(err, diary){
            if(err){
                console.log(err);
                res.status(err.code).json({isSuccess : 0});
            }
            return res.status(201).json({isSuccess: 1, msg: "Successfully created."});
        });
    }
    else{
        res.status(400).json({isSuccess: 0, err : "Bad req"});
    }

});
  

// ----------------------- listing specific user's diarys ---------------------
router.post("/getDiaryList", function(req, res){
    
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    var listType = req.body.listType;
    var userSeq = req.headers['userseq'];
    var itemlist = [];
    var userPlants = [];
                                        
    if(listType == "all"){
        
        Diary.find({$and: [{userSeq: userSeq},{block:0}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, diarydiaries){
            if(err) res.status(err.code).json({
                isSuccess : 0,
                isLast: 0,
                diaries: []
            });
            else{
                Plant.find({$and: [{userSeq: userSeq},{block:0}]}).sort({published_date: -1}).exec(function(err, plants){
                    if(err) res.status(err.code).json({
                        isSuccess : 0,
                        isLast: 0,
                        diaries: []
                    });
                    else{
                      Diary.find({$and: [{userSeq: userSeq},{block:0}]}).count(function(err,count){
                        if(err) return res.status(err.code).json({isSuccess: 0, err: err});

                        plants.forEach(function(plant){
                            var json = {
                                plantId : plant.plantId,
                                plantName : plant.plantName + "("+ plant.species+")"
                            };
                            userPlants.push(json);
                        });
                                
                        diarydiaries.forEach(function(item){
                            
                            // factory diary case.
                            if(item.diaryType == 0){
                                var comment  = "";
                                var numOfManagerReply=0;
                                
                                if(item.content)
                                  comment = item.content;
                                
                                item.comments.forEach(function(comment){
                                    if(comment.writer == 1)
                                        numOfManagerReply +=1;
                                });  
                                
                                var newItem = {
                                    diaryType : 0,
                                    diaryId : item.diaryId,
                                    title : item.plantName,
                                    picUrl : item.picUrl,
                                    comments : comment,
                                    numOfComment: item.comments.length,
                                    numOfManagerReply : numOfManagerReply,
                                    hasManagerAnswer : 0,
                                    published_date : item.published_date
                                };
                                
                                itemlist.push(newItem);
                            }
                            //my diary case.
                            else if(item.diaryType==1){
                                var comment = "";
                                var hasManagerAnswer = 0;
                                var numOfManagerReply=0;
                                
                                if(item.comments.length == 0){
                                    comment = item.content;
                                }
                                else {
                                  item.comments.forEach(function(message){
                                    if(message.writer == 1){
                                        hasManagerAnswer = 1;
                                        numOfManagerReply +=1;
                                    }
                                    comment = message.comment;
                                  });
                                  
                                }
                                
                                var newItem = {
                                    diaryType : 1,
                                    diaryId : item.diaryId,
                                    title : item.title,
                                    picUrl : item.picUrl,
                                    comments : comment,
                                    numOfComment: item.comments.length,
                                    numOfManagerReply : numOfManagerReply,
                                    hasManagerAnswer : hasManagerAnswer,
                                    published_date : item.published_date
                                };
                                
                                itemlist.push(newItem);
                            }
                        });
                                    
                                  
                        if((page-1)*num+ num >= count){
                            return res.status(200).json({
                                isSuccess : 1,
                                isLast : 1,
                                categories : userPlants,
                                diaries : itemlist
                            });        
                        }
                        else{
                            return res.status(200).json({
                                isSuccess : 1,
                                isLast : 0,
                                categories : userPlants,
                                diaries : itemlist
                            });
                        }
                      })
                        
                    }
                });
            }
        });
    }
    else if(listType == "mine"){
        Diary.find({$and : [{userSeq: userSeq},{diaryType : 1},{block: 0}]}).skip((page-1)*num).limit(num).sort({published_date: -1}).exec(function(err, diarydiaries){
            if(err) res.status(err.code).json({
                isSuccess : 0,
                isLast: 0,
                diaries: []
            });
            else{
                Plant.find({$and: [{userSeq: userSeq},{block:0}]}).sort({published_date: 1}).exec(function(err, plants){
                    if(err) res.status(err.code).json({
                        isSuccess : 0,
                        isLast: 0,
                        diaries: []
                    });
                    else{
                      Diary.find({$and : [{userSeq: userSeq},{diaryType : 1},{block: 0}]}).count(function(err,count){
                        if(err) return res.status(err.code).json({isSuccess: 0, err: err});
                        var numOfManagerReply=0;
                        var hasManagerAnswer=0;
                        var comment;
                        
                        plants.forEach(function(plant){
                            var json = {
                                plantId : plant.plantId,
                                plantName : plant.plantName+ "("+ plant.species+")"
                            };
                            userPlants.push(json);
                        });
                        
                        diarydiaries.forEach(function(item){
                            
                            if(item.comments.length == 0){
                                    console.log(typeof(item.comments));
                                    comment = item.content;
                                }
                            else {
                                    item.comments.forEach(function(message){
                                        if(message.writer == 1)
                                            hasManagerAnswer = 1;
                                            numOfManagerReply +=1;
                                            comment = message.comment;
                                        });
                                }
                          
                                            
                            var newItem = {
                                diaryType : 1,
                                diaryId : item.diaryId,
                                title : item.title,
                                picUrl : item.picUrl,
                                comments : comment,
                                numOfComment: item.comments.length,
                                numOfManagerReply : numOfManagerReply,
                                hasManagerAnswer : hasManagerAnswer,
                                published_date : item.published_date
                            };
                                        
                            itemlist.push(newItem);
                        });
                
                        if((page-1)*num+ num >= count){
                            return res.status(200).json({
                                isSuccess : 1,
                                isLast : 1,
                                categories : userPlants,
                                diaries : itemlist
                            });        
                        }
                        else{
                            return res.status(200).json({
                                isSuccess : 1,
                                isLast : 0,
                                categories : userPlants,
                                diaries : itemlist
                            });
                        }
                      });
                    }
                })
            }
        });    
    }
    else{
        Diary.find({$and: [{plantId: listType},{block:0}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, diarydiaries){
            if(err) res.status(err.code).json({
                isSuccess : 0,
                isLast: 0,
                diaries: []
            });
            else{
                
                Plant.find({$and: [{userSeq: userSeq},{block:0}]}).sort({published_date: 1}).exec(function(err, plants){
                    if(err) res.status(err.code).json({
                        isSuccess : 0,
                        isLast: 0,
                        diaries: []
                    });
                    else{
                      
                      Diary.find({$and: [{plantId: listType},{block:0}]}).count(function(err,count){
                        if(err) return res.status(err.code).json({isSuccess: 0, err: err});
                            
                          plants.forEach(function(plant){
                            var json = {
                                plantId : plant.plantId,
                                plantName : plant.plantName + "("+ plant.species+")"
                            };
                            userPlants.push(json);
                          });
                          
                          diarydiaries.forEach(function(item){
                                var numOfManagerReply=0;
                                var comment  = "";
                                var hasManagerAnswer = 0;
                              
                                if(item.content)
                                    comment = item.content;
                                    
                                item.comments.forEach(function(message){
                                    if(message.writer == 1){
                                        numOfManagerReply +=1;
                                        comment = message.comment;
                                    }
                                });
                                
                                var newItem = {
                                    diaryType : 0,
                                    diaryId : item.diaryId,
                                    title : item.plantName,
                                    picUrl : item.picUrl,
                                    comments : comment,
                                    numOfComment: item.comments.length,
                                    numOfManagerReply : numOfManagerReply,
                                    hasManagerAnswer : 0,
                                    published_date : item.published_date
                                };
                                              
                                itemlist.push(newItem);
                          });
                                          
                          if((page-1)*num+ num >= count){
                              console.log("last");
                              return res.status(200).json({
                                  isSuccess : 1,
                                  isLast : 1,
                                  categories : userPlants,
                                  diaries : itemlist
                              });        
                          }
                          else{
                              console.log("hi");
                              return res.status(200).json({
                                  isSuccess : 1,
                                  isLast : 0,
                                  categories : userPlants,
                                  diaries : itemlist
                              });
                          }
                      })
                    }
                })
            }
        });
    }
});



router.post("/getDiaryDetail", function(req,res){
    
    var diaryId = req.body.diaryId;
    
    Diary.findOne({$and: [{diaryId: diaryId},{block:0}]}).exec(function(err, diary){
        if(err) return res.status(err.code).json({isSuccess : 0, err: err});
        return res.status(200).json(diary);
    });

});

router.post("/getComments/",function(req, res, next) {
    
    var diaryId = req.body.diaryId;

    Diary.findOne({$and: [{diaryId: diaryId},{block:0}]}).exec(function(err, diary){
          if(err) return res.status(err.code).json({isSuccess : 0, err: err});
          return res.json(diary.comments);
    });
})

router.post("/addComment",function(req, res, next) {
    
    var diaryId = req.body.diaryId;
    
    Diary.findOne({$and: [{diaryId: diaryId},{block:0}]}).exec(function(err, diary){
        if(err) return res.status(err.code).json({isSuccess : 0, err: err});
        
        User.findOne({userSeq : req.headers['userseq']}).exec(function(err, user){
            if(err) return res.status(err.code).json({isSuccess : 0, err: err});
            if(user.authLevel == 1){
                user.numberOfAnswer =+ 1;
            }
            
            user.save(function(err){
                if(err) return res.status(err.code).json({isSuccess : 0, err: err});
                
            });
            
        });
        var comment = {
                writer: req.body.writer,
                comment: req.body.comment
        };
        diary.comments.push(comment);
        
        diary.save(function(err, diary){
            if(err) return res.status(err.code).json({isSuccess : 0, err: err});
        
            return res.status(201).json({isSuccess: 1});
        });
    });
});


module.exports = router;