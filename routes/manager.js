var express = require("express");
var router = express.Router();
var Plant = require("../models/plant");
var User = require("../models/user");
var Guide = require("../models/guide");

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

router.put('/modifyGuide',function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  var guideId = req.headers['guideid'];
  var title = req.body.title;
  var contents = req.body.contents;
  
  
  Guide.findOne({guideId : guideId}).exec(function(err,guide){
      if(err) return res.status(err.code).json({isSuccess:0, err: err});
      else{
        
          guide.title = title;
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
  
  User.find({authLevel : {$gte:1}}).exec(function(err,users){
      
      if(err) return res.status(err.code).json({isSuccess:0, err: err})
      
      users.forEach(function(user){
          var info = {
              managerName: user.username,
              factory : user.factory,
              call : user.call,
              numberOfAnswer : user.numberOfAnswer,
              authLevel : user.authLevel
          }
          managerList.push(info);
      })
      
      return res.status(200).json({
        isSuccess: 1,
        managerList: managerList
      })
      
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
