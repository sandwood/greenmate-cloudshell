var express = require("express");
var router = express.Router();
var Plant = require("../models/plant");
var User = require("../models/user");
var Guide = require("../models/guide");
var Diary = require("../models/diary");


// user registration. 
router.post('/addManager', function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  var id = req.body.id;
    
    User.findOne({$and : [{id: id}, {block : 0}]})
      .exec(function(error, user) {
        if (error) return res.status(error.code).json({isSuccess:0});
        if (user){
          return res.status(400).json({isSuccess:0, error: "that user exists already."});
        }
        if (!user) {
          
            var user = new User({
              username: req.body.username,
              password: req.body.password,
              authLevel : 1,
              factory : req.body.factory,
              call : req.body.call,
              masterManager : false,
              id: id,
              block : 0
            });
            
            user.save(function(error, user) {
              if(error){
                  return res.status(error.code).json({isSuccess: 0, err: error});
              } 
              return res.status(201).json({isSuccess: 1});
            });
        }
        else{
          return res.status(406).json({
            isSuccess: 0,
            error: "Alreay registred user."
          })
        }
      });
  
});

router.post('/addGuide',function(req,res){
    res.setHeader("Access-Control-Allow-Origin", "*");
  
    var title = req.body.title;
    var guideId = "guide-"+ Date.now();
    var species = req.body.species;
    var category = req.body.category;
    var writer = req.body.managerName;
    var contents = req.body.contents;
    
    console.log("before: "+ contents);
    contents = JSON.parse(contents);
    console.log("after: "+ contents);


    var guide = new Guide({
      title : title,
      guideId : guideId,
      category : category,
      species : species,
      writer : writer,
      contents : contents,
      block : 0
    });
    
    guide.save(function(err, guide){
      if(err) return res.status(err.code).json({isSuccess:0, err: err});
      else{
        return res.status(201).json({isSuccess:1, msg: "Successfully created."});
      }
    });
    
    
});


router.post('/getGuideList', function(req,res){
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    var category  = req.body.category;
    var categories = [];
    var items = [];
    var nominees = [];
    
    if(category =="all"){
        Guide.find({}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, guides){
        if(err) {
            console.log(err); 
                return res.status(err.code).json({isSuccess: 0});
            }
            if(guides == null){
                return res.status(204).json({isSuccess: 0,msg : "no guides."});
            }
            Guide.find().exec(function(err, secondGuides){
                
                if(err) return res.status(err.code).json({isSuccess : 0});
                
                secondGuides.forEach(function(guide){
                    
                    if(nominees.indexOf(guide.category) <0){
                        nominees.push(guide.category);
                        categories.push({
                            category : guide.category
                        });
                    };
    
                });
                
                guides.forEach(function(guide){
                   items.push({
                        guideId : guide.guideId,
                        title : guide.title,
                        writer : guide.writer,
                        block : guide.block,
                        published_date: guide.published_date
                    }); 
                });
                
                if((page-1)*num+ num >= secondGuides.length){
                    
                    return res.status(200).json({
                        isSuccess : 1,
                        isLast : 1,
                        categories : categories,
                        guideList : items
                    });        
                }
                else{
                    return res.status(200).json({
                        isSuccess : 1,
                        isLast : 0,
                        categories : categories,
                        guideList : items
                    });
                }
            });
        });
    }
    else{
        Guide.find({category : category}).sort({published_date: -1}).exec(function(err, guides){
            if(err) {
            console.log(err); 
                return res.status(err.code).json({isSuccess: 0});
            }
            if(guides == null){
                return res.status(204).json({isSuccess: 0,msg : "no guides."});
            }
            Guide.find().exec(function(err, secondGuides){
                
                if(err) return res.status(err.code).json({isSuccess : 0});
                
                secondGuides.forEach(function(guide){
                    
                    if(nominees.indexOf(guide.category) <0){
                        nominees.push(guide.category);
                        categories.push({
                            category : guide.category
                        });
                    };
    
                });
                
                guides.forEach(function(guide){
                    items.push({
                        guideId : guide.guideId,
                        title : guide.title,
                        writer : guide.writer,
                        block : guide.block,
                        published_date: guide.published_date
                    }); 
                });
                
                if((page-1)*num +num>= guides.length){
                    
                    return res.status(200).json({
                        isSuccess : 1,
                        isLast : 1,
                        categories : categories,
                        guideList : items.slice((page-1)*num,(page-1)*num+num)
                    });        
                }
                else{
                    
                    return res.status(200).json({
                        isSuccess : 1,
                        isLast : 0,
                        categories : categories,
                        guideList : items.slice((page-1)*num,(page-1)*num+num)
                    });
                }
            });
        });
    }
});


router.get('/deleteGuide', function(req, res) {
    Guide.remove({guideId : req.headers['guideid']}).exec(function(err){
      console.log(req.headers['guideid']);
      if(err) return res.status(err.code).json({isSuccess:0, err:err});
      else return res.status(200).json({isSuccess: 1});
    }); 
});



router.get('/guideOnOff',function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  var guideId = req.headers['guideid'];
  
  Guide.findOne({guideId : guideId}).exec(function(err, guide){
      if(err) return res.status(err.code).json({isSuccess:0, err: err});
      else{
          if(guide.block == 0) guide.block = 1;
          else guide.block = 0;
          
          guide.save(function(err){
              if(err) return res.status(err.code).json({isSuccess:0, err: err});
          });
          return res.status(201).json({isSuccess:1, msg: "Successfully changed."});
      }
  })
});



router.get('/mypage', function(req, res) {
   
   
    User.findOne({userSeq : req.headers['userseq']}).exec(function(err, user){
      
        if(err) return res.status(err.code).json({isSuccess:0, err: err});
        else{
            return res.json({
                username : user.username,
                call : user.call,
                email : user.id, 
                factory : user.factory
            })
        }
      
       
    });
   
    
});

router.post('/modifyMyInfo', function(req, res) {
    User.update({userSeq : req.headers['userseq']}, {$set: {username : req.body.name, call : req.body.call, id : req.body.email, factory : req.body.factory}}).exec(function(err, user){
      
        if(err) return res.status(err.code).json({isSuccess:0, err: err});
        else{
            return res.json({
                isSuccess : 1
            })
        }
      
       
    });
});





router.post('/plantDetail', function(req, res) {
   
    var plantId = req.body.plantId;
    var diaryList = [];
    
    
    Plant.findOne({plantId : plantId}).exec(function(err, plant){
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
    //   console.log("plant:"+plant);
      if(plant.sensorData)
          sensor = plant.sensorData;
      
      Diary.find({plantId : plant.plantId}).exec(function(err, diaries) {
          
        if(err) {
          console.log(err); 
          return res.status(err.code).json({isSuccess: 0});
        }
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
                published_date : plant.published_date,
                updated_at : plant.updated_at,
                diaries : diaries
            });
      })
      
      
      
      
  });  
   
    
});


router.post('/managingPlants', function(req, res) {
        
    Plant.find({$and: [{userSeq : req.headers['userseq']},{block : 0}]}).exec(function(err,plants){
        if(err) return res.status(err.code).json({isSuccess: 0, err:err})
        
        Plant.find({$and: [{userSeq : req.headers['userseq']},{block : 0}]}).count(function(err,count){
            if(err) return res.status(err.code).json({isSuccess: 0, err:err})
            console.log(count);
            var items = [];
            var page = req.body.page;
            var num = Number(req.body.pageNumber);
            
            plants.forEach(function(plant){
                
                items.push({
                    plantId : plant.plantId,
                    factory : plant.factory,
                    manager : plant.manager,
                    username : plant.username,
                    plantName : plant.plantName,
                    position : plant.position,
                    published_date : plant.published_date,
                    updated_at : plant.updated_at
                }); 
            })
            if(isNaN(num)){
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 1,
                    plants : items
                });      
            }
            if((page-1)*num+ num >= count){
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 1,
                    plants : items.slice((page-1)*num,(page-1)*num+num)
                });        
            }
            else{
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 0,
                    plants : items.slice((page-1)*num,(page-1)*num+num)
                });
            } 
        });            
    });
});


router.put('/modifyGuide',function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  var guideId = req.headers['guideid'];
  var title = req.body.title;
  var species  = req.body.species;
  var category = req.body.category;
  var managerName = req.body.managerName;
  var contents = req.body.contents;
  
  
  Guide.findOne({guideId : guideId}).exec(function(err,guide){
      if(err) return res.status(err.code).json({isSuccess:0, err: err});
      else{
          contents = JSON.parse(contents);
          
          guide.title = title;
          guide.species = species;
          guide.category = category;
          guide.managerName = managerName;
          guide.contents = contents;
          
          
          guide.save(function(err){
              if(err) return res.status(err.code).json({isSuccess:0, err: err});
          });
          return res.status(201).json({isSuccess:1, msg: "Successfully changed."});
        
      }
  });
});

router.post('/getAllManager',function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  var managerList = [];
  var page = req.body.page;
  var num = Number(req.body.pageNumber);
  console.log("page: "+ page);
  console.log(isNaN(num));
  
  if(isNaN(num)){
      User.find({authLevel : {$gte:1}}).sort({userSeq: -1}).exec(function(err,users){
      
          if(err) return res.status(err.code).json({isSuccess:0, err: err})
          var number=0;
          var factory="nowhere";
          var call="0000000000"
          users.forEach(function(user){
              
             if(user.numberOfAnswer)
                number = user.numberOfAnswer;
            if(user.factory)
                factory = user.factory;
            if(user.call)
                call = user.call;
              var info = {
                  managerName: user.username,
                  factory : factory,
                  call : call,
                  managingPlants : user.managingPlants.length,
                  numberOfAnswer : number,
                  authLevel : user.authLevel
              }
              managerList.push(info);
          })
          
          return res.status(200).json({
            isSuccess: 1,
            isLast :1,
            managerList: managerList
          })
          
      });
  }
  else{
      User.find({authLevel : {$gte:1}}).sort({userSeq: -1}).skip((page-1)*num).limit(num).exec(function(err,users){
          if(err) return res.status(err.code).json({isSuccess:0, err: err})
          User.find({authLevel : {$gte:1}}).count(function(count){
              var number=0;
              var factory="nowhere";
              var call="0000000000"
              users.forEach(function(user){
                  
                  if(user.numberOfAnswer)
                    number = user.numberOfAnswer;
                if(user.factory)
                    factory = user.factory;
                if(user.call)
                    call = user.call;
                  var info = {
                      managerName: user.username,
                      factory : factory,
                      call : call,
                      managingPlants : user.managingPlants.length,
                      numberOfAnswer : number,
                      authLevel : user.authLevel
                  }
                  managerList.push(info);
              })
              if((page-1)*num+ num >= count){     
                  return res.status(200).json({
                    isSuccess: 1,
                    isLast:0,
                    managerList: managerList
                  })
              }
              else{
                    return res.status(200).json({
                        isSuccess : 1,
                        isLast : 0,
                        managerList : managerList
                    });
                }    
          });
          
          
      });
  }
});


router.post('/managingUser', function(req, res) {
  var managerList = [];
  var page = req.body.page;
  var num = Number(req.body.pageNumber);
  
    if(isNaN(num)){
        User.find().sort({userSeq: -1}).exec(function(err,users){
      
          if(err) return res.status(err.code).json({isSuccess:0, err: err})
          users.forEach(function(user){
              
              var info = {
                  username: user.username,
                  published_date : user.created_at,
                  managingPlants : user.plants.length
              }
              managerList.push(info);
          })
          
          return res.status(200).json({
            isSuccess: 1,
            isLast : 1, 
            userList: managerList
          })
          
      });
  }
  else{
      User.find().sort({userSeq: -1}).skip((page-1)*num).limit(num).exec(function(err,users){
          
          if(err) return res.status(err.code).json({isSuccess:0, err: err})
          User.find().count(function(count){
              users.forEach(function(user){
    
                  var info = {
                      username: user.username,
                      published_date : user.created_at,
                      managingPlants : user.plants.length
                  }
                  managerList.push(info);
              })
              if((page-1)*num+ num >= count){     
                  return res.status(200).json({
                    isSuccess: 1,
                    isLast:0,
                    userList: managerList
                  })
              }
              else{
                    return res.status(200).json({
                        isSuccess : 1,
                        isLast : 0,
                        userList : managerList
                    });
                }    
          });
      });
  }
});


router.post('/activePlantUserList', function(req, res) {
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    var userList = [];
    var userInfoList = [];
    
    User.find().exec(function(err, users){
        if(err) return res.status(err.code).json({isSuccess:0, err: err})
        
        users.forEach(function(user){
            
            if(user.plants.length > 0 && userList.indexOf(user.username) < 0) {
                userList.push(user.username);
                userInfoList.push({
                    userSeq : user.userSeq,
                    username : user.username,
                    created_at : user.created_at,
                    numberOfPlants : user.plants.length
                });
            }

        });
      
        if(isNaN(num)){
            return res.status(200).json({
                isSuccess : 1,
                isLast : 1,
                users : userInfoList
            });      
        }
        if((page-1)*num+ num >= userInfoList.length){
            return res.status(200).json({
                isSuccess : 1,
                isLast : 1,
                plants : userInfoList.slice((page-1)*num,(page-1)*num+num)
            });        
        }
        else{
            return res.status(200).json({
                isSuccess : 1,
                isLast : 0,
                plants : userInfoList.slice((page-1)*num,(page-1)*num+num)
            });
        }
    });
});


router.post('/authAdmin',function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  User.update({userSeq : req.headers['userseq']}, {$set: {masterManager : true}}).exec(function(err,user){
      if(err) return res.status(err.code).json({isSuccess:0, err: err})
      return res.status(200).json({
        isSuccess: 1
      })
      
  });
});

module.exports = router;
