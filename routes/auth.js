var express = require("express");
var router = express.Router();
var passport = require('passport');
var multiparty=require('multiparty');
var User = require("../models/user");
var Noti = require("../models/noti");
var authMiddleware = require("../middlewares/auth");
var gcs = require('@google-cloud/storage')({
  projectId: "greentest-163904",
  keyFilename: '../config/keyfile',
  credentials: require('../config/keyfile')
});
//sign-up part ----------------------------------------------------------------

router.route("/signup/")
  .all(authMiddleware.logoutRequired)
  .get(function(request, response) {
    return response.render("../views/auth/signup");
  })
  .post(function(request, response, next) {
      User.signup(request, response);
  });
  
router.get('/signupSuccess/',
  function(req,res){
     res.send("");
  });



//login part ---------------------------------------------------

router.route("/login/")
  .get(function(request, response) {
    console.log('hello');
    return response.render("../views/auth/login",{title: "Home"});
  })
  .post(
    passport.authenticate('local'),
    function(req,res,next){
      res.setHeader("Access-Control-Allow-Origin", "*");
      var deviceId = req.body.deviceToken;
      var userId = req.body.id;
      var os = req.body.os;
      console.log("-> received deviceId : "+deviceId);
      
      if(deviceId!=null){
        User.update({id : userId},{$addToSet: {deviceId : {os : os, deviceId : deviceId}}},function(err,tasks){
            if(err) {
                console.log(err); 
                return res.json({isSuccess: 0});
            }
        });
      }
      
      //for mobile app
      return res.json({
        "isSuccess" : 1,
        "id": req.user.id,
        "userSeq" : req.user.userSeq,
        "token": req.user.accessToken,
        "authLevel" : req.user.authLevel,
        "username" : req.user.username
      });
      
      //for web test
      // return res.render("../views/index",{
      //   "id": req.user.id,
      //   "token": req.user.accessToken,
      //   "authLevel" : req.user.authLevel,
      //   "username" : req.user.username,
      //   "bucket" : req.user.bucket
      // });
    },
    function(err, req, res, next){
      res.setHeader("Access-Control-Allow-Origin", "*");
      if(err.status == 1)
        return res.json(err);
      else{
        return res.json(err);
      }
    }
  );


router.get("/auth/facebook/", passport.authenticate("facebook"));

router.get("/auth/facebook/callback",
  passport.authenticate("facebook", {failureRedirect: 'http://m.facebook.com/logout.php?confirm=1'}),
  function(req,res,next){
    
    return res.status(200).json({isSuccess : 1,userSeq : req.user.userSeq, id : req.user.id, username : req.user.username, authLevel : req.user.authLevel});
  },
  function(err, req, res){
    if(err) console.log(err);
    return res.status(400).json({isSuccess : 0});
  }
);


router.get("/auth/kakao/", passport.authenticate("kakao"));

router.get("/auth/kakao/callback",
  passport.authenticate("kakao",{
    failureRedirect:"http://www.kakao.com/main"
}),
  function(req,res,next){
    return res.status(200).json({isSuccess : 1, userSeq : req.user.userSeq, id : req.user.id, username : req.user.username, authLevel : req.user.authLevel});
  },
  function(err, req, res){
      if(err) console.log(err);
      return res.status(400).json({isSuccess : 0});
  }
);


router.get("/auth/naver/", passport.authenticate("naver"));

router.get("/auth/naver/withdrawal/", function(req, res){
  res.status(200).json({isSuccess: 1, msg: "app disconnected successfully."});
});

router.get("/auth/naver/callback",
  passport.authenticate("naver",{failureRedirect: 'http://www.naver.com/'}),
  function(req,res,next){
    
    return res.status(201).json({isSuccess : 1, userSeq : req.user.userSeq, id : req.user.id, username : req.user.username, authLevel : req.user.authLevel});
  },
  function(err, req, res){
      if(err) console.log(err);
      return res.status(400).json({isSuccess : 0});
  }
);

router.put("/deviceToken/",
    function(req,res,next){
        var userSeq = req.headers['userseq'];
        
        User.findOne({userSeq : userSeq},function(err,user){
            if(err) {
                console.log(err); 
                return res.json({isSuccess: 0});
            }
            // console.log("=> userSeq:"+userSeq+" os:"+req.body.os+" key:"+req.body.token);
            var devices = user.deviceId;
            if(devices.length < 1) {
              // console.log("=> has no token");
              user.deviceId.push({
                os : req.body.os,
                deviceId : req.body.token
              });
            } else {
              // console.log("=> has tokens");
              devices.forEach(function(device){
                if(device.deviceId.indexOf(req.body.token) < 0){
                  // console.log("=> add more tokens");
                  user.deviceId.push({
                    os : req.body.os,
                    deviceId : req.body.token
                  });
                }
              });
            }
            
            
            user.save();
            // req.logout();
            return res.status(200).json({isSuccess: 1, result : "registered successfully"});
        });
    },
    function(err, req, res, next){
      if(err.status == 1)
        return res.status(err.code).json(err);
      else{
        return res.status(err.code).json(err);
      }
    }
);


//upload Images. 
router.post("/uploadImage", function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");  
    var form = new multiparty.Form();
    var bucket, bucketName = "greenmate_images";
    var picUrl= [];
    
    // get field name & value
    form.on('field', function(name, value){
        console.log('normal field /name ='+ name +', value=' + value); 
    });
        
    //file upload handling
    form.on('part', function(part){

        var filename; 
        var size;
        
        bucket = gcs.bucket(bucketName);
        
        if(part.filename) {
    
            size = part.byteCount;
            filename = String(Date.now()).replace(/(\s*)/g,"") + part.filename;
            var tempPicUrl = "https://storage.googleapis.com/"+bucketName+"/"+ filename;
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
        console.log(picUrl);
        return res.status(201).json({
              isSuccess : 1,
              picUrl : picUrl
        });
        
    });
    
    //track progress
    form.on('progress',function(byteRead,byteExpected){
        console.log(' Reading total  '+byteRead+'/'+byteExpected);
    });
        
    form.parse(req);
});




//emailing in case forgot password ---------------------------------------------------------------

router.route('/resetuserpassword/')
  .get(function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    User.checkPassword(req,res);
  })
  .post(function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    User.sendMail(req, res);
  });
  
  
//reset password -------------------------------------------------------------------
router.post('/patchuserpassword/',function(req,res,next){
  res.setHeader("Access-Control-Allow-Origin", "*");
  User.resetPassword();
});
  

//-------------------------- mypage -----------------------------
router.get(
  "/mypage/", checkId, 
  authMiddleware.loginRequired,
  function(req, res, next) {
    return res.send(res.user.username);
});


//------------------ userNotificationList --------------

router.post('/userNotificationList', function(req, res, next) {
  
  var userSeq = req.headers['userseq'];
  var page = req.body.page;
  var pageNumber = Number(req.body.pageNumber);
  
  Noti.find({userSeq: userSeq}).exec(function(err, notis){
    
    if(err) return res.status(err.code).json({isSuccess:0, err: err});
    return res.status(200).json({
      isSuccess : 1,
      notis : notis
    });
  });
});



//------------------- checkId middleware ----------------------------
function checkId(req, res, next) {
    
    var id = req.headers["id"];
   
    if (typeof id !== "undefined") {
        console.log("id is given");
        next();
    } else {
        res.send(403);
    }
}






module.exports = router;
