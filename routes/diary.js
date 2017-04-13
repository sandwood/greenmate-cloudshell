var express = require("express");
var router = express.Router();
var Diary = require("../models/diary");
var Plant = require("../models/plant");
var Nthing = require("../models/nthing");
var User = require("../models/user");
var moment = require("moment-timezone");
var Noti = require("../models/noti");
var FCM = require("fcm-node");

var apiKey = 'AAAAPTzFJJM:APA91bHMuqNIHv_IDhhsT08BoJvkWHaCzUPdXV-VzLbtPtk4v9dYJQ0jpcjYsE745dCr2pPrIA1anDx02ZTTzUAj0_2Gz588RIBb5SHbEU8QY3-3HjjhlEFu6ZReM-zF_n4Q91SEsF1WUIgdBTx2Ao_UD_NmZMRxtw';

var fcm = new FCM(apiKey);
    
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
    var deviceId = [];
    
    if(req.body.diaryType == 0){
        
        Plant.findOne({plantId : req.body.plantId}).exec(function(err, plant){
            if(err) res.status(err.code).json({isSuccess: 0, err: err});
            else{
                
                // sensor data should be inserted!
                // Nthing.find({$and : [{factory : plant.factory},{geteway : plant.gateway}]}.sort({date: -1}).limit(1).exec(function(err,sensor){
                //     if(err) return res.status(err.code).json({isSuccess: 0, err: err});
                    
                    var plant= plant;
                    var diaryId = plant.plantId +'-'+ Date.now();
                    
                    if(plant.factory)
                        factory = plant.factory;
                    if(plant.gateway)
                        gateway = plant.gateway;
                
                    plant.diary.push(diaryId);
                    plant.picUrl = req.body.picUrl;
                    
                    
                    
                    var diary = new Diary({
                        userSeq : req.headers['userseq'],
                        diaryType : req.body.diaryType,
                        afterPlanting : plant.afterPlanting,
                        plantId : plant.plantId,
                        diaryId : diaryId,
                        title : title,
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
                        plant.updated_at = moment(Date.now()).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm');
                        plant.save(function(err, plant){
                          if(err) return res.status(err.code).json({isSuccess: 0, err: err});
                          else{
                              /* */
                            User.findOne({$and: [{id: plant.userId},{block: 0}]}, function(err, user){
                                if(err){
                                  return res.status(err.code).json({isSuccess : 0});
                                }
                                else{
                                    deviceId = user.deviceId;
                                    deviceId.forEach(function(device){
                                        if(device.os == "android"){ // android
                                            var message = {
                                                to : device.deviceId, // required
                                                notification : {
                                                    // title: "It's Green Mate :)",
                                                    // body : "It's time to harvest your "+ plant.plantName+"!",
                                                    // sound : "default"
                                                },
                                                data : {
                                                    title: "It's Green Mate :)",
                                                    body : plant.plantName+"의 새로운 일지가 등록되었습니다!"
                                                }
                                            };
                                        } else {    // iOS
                                            var message = {
                                                to : device.deviceId, // required
                                                notification : {
                                                    title: "It's Green Mate :)",
                                                    body : plant.plantName+"의 새로운 일지가 등록되었습니다!",
                                                    sound : "default"
                                                },
                                                data : {
                                                    // title: "It's Green Mate :)",
                                                    // body : "It's time to harvest your "+ plant.plantName+"!"
                                                }
                                            };
                                        }
                                        fcm.send(message, function(err, messageId){
                                            if(err){
                                                console.log("fcm send error : "+err);
                                                // return res.status(err.code).json({isSuccess : 0});
                                            }
                                            else {
                                                var notiId = "user_" + user.userSeq + "-noti-" + Date.now();
                                                
                                                var newNoti = new Noti({
                                                    userSeq : user.userSeq,
                                                    notiId : notiId,
                                                    read : 0,
                                                    contents : message.notification.body
                                                });
                                                
                                                newNoti.save(function(err){
                                                    if(err) return res.status(err.code).json({isSuccess: 0, err: err});
                                                    console.log("Sent with message ID: ", messageId);
                                                });
                                            }
                                        });
                                    });
                                    return res.json({isSuccess: 1, msg: "Successfully created."});
                                }
                                
                            });  
  
                            
                          }
                        })
                    // });
              }
            )}
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



/* 일지 목록 조회 재구성--> */  
router.post("/getDiaryList", function(req, res){
    
    var reqUserSeq = req.headers['userseq'];
    var listType = req.body.listType;
    
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    
    var userPlants = [];
    var userDiaries = [];
    
    // ## 해당 유저의 식물 목록 조회 ##
    Plant.find({$and: [{userSeq: reqUserSeq},{block:0}]}).sort({published_date: -1}).exec(function(err, plants) {
        
        if (err) {
            console.log("error : "+err);
            return res.status(200).json({isSuccess : 0, isLast: 0, diaries: []});
            
        } else {
            // 1 카테고리 목록
            plants.forEach(function(plant) {
                console.log(plant.plantId+"/"+plant.plantName+"/"+plant.species);
                var catData = {
                    plantId : plant.plantId,
                    plantName : plant.plantName + "("+ plant.species+")"
                };
                userPlants.push(catData);
            });
            
            
            // 리스트 타입에 따라 분기하여 쿼리 작성
            var findQuery;
            if(listType == "all") {             
                // 모든 일지 조회, reqUserSeq와 user_reqUserSeq로 시작하는 모든 데이터 조회
                findQuery = {};
                findQuery["$or"] = [];    
                findQuery["$or"].push({plantId:{$regex:"user_"+reqUserSeq+"-"}});
                findQuery["$or"].push({userSeq:reqUserSeq});  // == {$or:[{plantId:{$regex:"user_"+reqUserSeq+"-"}},{userSeq:reqUserSeq}]}
            } else if(listType == "mine") {     
                // 나의 일지, reqUserSeq로 조회
                findQuery = {userSeq:reqUserSeq};
            } else {                            
                // 카테고리 선택, plantId로 조회
                findQuery = {plantId:listType};
            }
            
            // ## 일지 목록 조회 ##
            Diary.find({$and:[findQuery, {block:0}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, diaries) {
                if (err) {
                    console.log("error : "+err);
                    return res.status(200).json({isSuccess : 0, isLast: 0, diaries: []});
            
                } else {
                    // ## isLastPage 플래그 지정 ##
                    var isLastPage;
                    Diary.find({$and:[findQuery, {block:0}]}).count(function(err, count) {
                       if (err) {
                           console.log("isLastPage 플래그 지정 error : "+err);
                           return res.status(200).json({isSuccess : 0, isLast: 0, diaries: []});
                       } else {
                           isLastPage = (page-1)*num+ num >= count;
                           console.log("isLastPage : "+isLastPage);
                           
                           
                            // 2 다이어리 목록
                            diaries.forEach(function(diary){
                                
                                // 매니저 답변 존재 여부
                                var hasManagerAns = false;
                                var numOfManagerAns = 0;
                                diary.comments.forEach(function(comment){
                                    if (comment.writer == 1) {
                                        hasManagerAns = true;    
                                        numOfManagerAns++;
                                    }
                                });
                                
                                var diaryData = {
                                    diaryType : diary.diaryType,
                                    diaryId : diary.diaryId,
                                    title : (diary.diaryType == 0)? diary.plantName:diary.title,    // 공장일지는 plantName을 제목으로 사용
                                    picUrl : diary.picUrl,
                                    comments : diary.content,
                                    numOfComment: diary.comments.length,
                                    numOfManagerReply : Number(numOfManagerAns),
                                    hasManagerAnswer : Number(hasManagerAns),
                                    published_date : diary.published_date
                                };
                                userDiaries.push(diaryData);
                            });
                
                            return res.status(200).json({
                                totalCnt:Number(userDiaries.length),
                                isSuccess : 1,
                                isLast : Number(isLastPage),
                                categories : userPlants,
                                diaries : userDiaries
                            });  
                        }
                    });
                }
            });
        }
    });
});
/* <-- */

// ----------------------- listing specific user's diarys ---------------------
router.post("/getDiaryListOLD", function(req, res){
    
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    var listType = req.body.listType;
    var userSeq = req.headers['userseq'];
    var itemlist = [];
    var userPlants = [];
                                        
    if(listType == "all"){
        
        var findQuery = {$and: [{userSeq: userSeq},{block:0}]}; 
        
        Diary.find(findQuery).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, diarydiaries){
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
            
            var comment = {
                commentId : "user_"+ req.headers['userseq'] +"-"+"DiaryCmt"+"-"+Date.now(),
                username : user.username,
                writer: req.body.writer,
                comment: req.body.comment
            };
            diary.comments.push(comment);
            
            diary.save(function(err, diary){
                if(err) return res.status(err.code).json({isSuccess : 0, err: err});
                user.save(function(err){
                    if(err) return res.status(err.code).json({isSuccess : 0, err: err});
                    return res.status(201).json({isSuccess: 1});
                });
            });
        });
        
    });
});

router.delete("/deleteComment", function(req, res){
    
    var diaryId = req.body.questionId;
    var commentId = req.body.commentId;
    
    Diary.update({diaryId : diaryId},{$pull : {comments: {commentId: commentId}}}).exec(function(err){
        
        if(err) return res.status(err.code).json({isSuccess: 0});
        return res.status(200).json({isSuccess: 1});
    });
});
module.exports = router;