var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
var autoIncrement = require("mongoose-auto-increment");
var bcrypt = require("bcrypt");
var jwt= require("jwt-simple");
var nodemailer = require("nodemailer");
var randomstring = require("randomstring");

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


var secret = "krazylab";
var smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'petercha90@gmail.com',
        pass: 'peter4682#'
    }
};
var transporter = nodemailer.createTransport(smtpConfig);
var connection = mongoose.createConnection("mongodb://petercha:peter4682!@ds019806.mlab.com:19806/green_mate");

autoIncrement.initialize(connection);

var userSchema = new mongoose.Schema({
  
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: false
  },
  authLevel: {
    type: Number
  },
  id: {
    type: String,
    required: true,
    trim: true,
  },
  profilePicURL: {
    type : String
  },
  deviceId : {
    type : []
  },
  factory : {
    type : String
  },
  call : {
    type : String
  },
  masterManger : Boolean,
  managingPlants :{
    type : []
  },
  numberOfAnswer :{
    type : Number
  },
  plants: {
    type : []
  },
  questions : {
    type : []
  },
  
  block:{
    type: Number
  },
  // Time Stamp
  // timestamps: true 로 변경할 수 있습니다.
  created_at: {
    type: String,
    default: dateForTimezone(+540)
  },
  updated_at: {
    type: String,
    default: dateForTimezone(+540)
  }
});

userSchema.plugin(autoIncrement.plugin, {model:'User', field: 'userSeq'});

userSchema.pre("save", function(next) {
  return next();
});

//-----------------------------login----------------------------
userSchema.statics.authenticate = function() {
  
  return function(id, password, done) {
    User.findOne({$and : [{id: id}, {block : 0}]})
      .exec(function(error, user) {
        
        if (error) return done(error);
        if (user) {
          bcrypt.compare(password, user.password, function(error, result) {
              if (error) return done(error);
              if (result) {
                return done(null, user);
              } else {
                var err2 ={ 
                  "isSuccess" : 0,
                  "failStatus" : 0,
                  "statusText" : "id, password does not match.",
                  "username" : user.username
               };
                return done(err2);
              }
          });
        }
        else{
                var err ={ 
                  "isSuccess" : 0,
                  "failStatus" : 1,
                  "statusText" : "User not found."
                };
                return done(err);
        }
      });
  };
};


userSchema.statics.serialize = function() {
  return function(user, callback) {
    return callback(null, user._id);
  };
};


userSchema.statics.deserialize = function() {
  return function(id, callback) {
    User.findOne({_id: id}, function(error, user) {
      return callback(error, user);
    });
  };
};

//----------------------------------signup-----------------------------
userSchema.statics.signup = function(req,res){
    // FIXME: should validate user
    var id = req.body.id;
    
    User.findOne({$and : [{id: id}, {block : 0}]})
      .exec(function(error, user) {
        if (error) return res.status(error.code).json({isSuccess:0});
        if (user){
          return res.status(400).json({isSuccess:0, error: "that user exists already."});
        }
        if (!user) {
            var token = randomstring.generate();
            var user = this;
  
            bcrypt.hash(req.body.password, 10, function(error, hash) {
              if (error) return console.log(error);
              
              var user = new User({
                username: req.body.username,
                password: hash,
                authLevel : 0,
                accessToken : token,
                id: id,
                block : 0
              });
            
            user.save(function(error, user) {
              if(error){
                  return res.status(error.code).json({isSuccess: 0, err: error});
              } 
              return res.status(201).json({isSuccess: 1});
            });
              
            });
            
        }
        else{
          return res.status(406).json({
            isSuccess: 0,
            error: "Alreay registred member."
          })
        }
      });
};

//----------------------------------searchUser-------------------------
userSchema.statics.searchUser = function(req, res){
    
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
  
    User.find({$and : [{id: {$regex: req.body.userId}},{block: 0}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(error, users){
            if(error) {
              console.log(error); 
              return res.status(error.code).json({isSuccess: 0, err: error});
            }
            {
                var userids = [];
                
                users.forEach(function(user){
                    userids.push(user.id);
                });
                User.find({$and : [{id: {$regex: req.body.userId}},{block: 0}]}).count(function(err,count){
                    if(err) return res.status(err.code).json({isSuccess : 0, err: err});
                    if((page-1)*num+ num >= count){
                        return res.status(200).json({
                            isSuccess : 1,
                            isLast : 1,
                            userId : userids
                        });        
                    }
                    else{
                        return res.status(200).json({
                            isSuccess : 1,
                            isLast : 0,
                            userId : userids
                        });
                    }    
                }); 
                
            }
        });
};

//-------------------------- sending e-mail to reset password ------------------
userSchema.statics.sendMail = function(req,res){
  console.log("e-mail");
  console.log(req.body.id);
  
  User.findOne({id : req.body.id})
    .exec(function(err, user){
      if(err) res.status(err.code).json({isSuccess : 0});
      else if(user==null){
        console.log(user);
        res.json({"isSuccess" : 0, "error": "No user"});
      }
      else{
        
        var sendPwdReset = transporter.templateSender({
        subject: 'Password reset for {{username}}!',
              html: '<b>Hello, {{username}}! This is Green Mate✔ </b></p><p>Please <a href="{{ reset }}"><b>go here </b></a>to reset your password :)</p>'
          }, {
              from: 'green_mate@gmail.com',
        });
          
        var userid = req.body.id;
        var encodedId = jwt.encode(userid, secret);
          
        // use template based sender to send a message
        sendPwdReset({
            to: userid
          }, {
              username: user.username,
              reset: 'https://green-mate2-petercha90.c9users.io/resetuserpassword?id='+encodedId
          }, function(err, info){
              if(err) {
                  console.log(err); 
                  return res.status(err.code).json({isSuccess: 0});
              }else{
                  console.log('Password reset sent');
              }
        });
        return res.status(200).json({isSuccess : 1});
      }
    });
};

userSchema.statics.checkPassword = function(req,res){
    var id = req.query.id;
    var decodedId = jwt.decode(id, secret);
    
    User.findOne({id: decodedId})
      .exec(function(error, user) {
        if (error) {
          return res.status(error.code).json({isSuccess : 0});
        }
        if (!user) {
            return res.status(204).send({isSuccess : 0, error : "No content"});
        }
        //if user exists
        
        return res.render("../views/auth/resetpw",{id: decodedId});
    });
};


//----------------------------------- reset password ---------------------------

userSchema.statics.resetPassword = function(req,res){
  var userid = req.body.id;
  var newPassword = req.body.password;

  var hash = bcrypt.hashSync(newPassword, 10);
  var newToken = randomstring.generate();
  
  User.update({id : userid},{password : hash, accessToken : newToken},{multi:false},
    function(err,tasks){
     if(err) {
        console.log(err); 
        return res.json({isSuccess: 0});
      }
  });
  return res.status(200).json({isSuccess : 1, result: 'Password changed successfully'});
};

//------------------get user info ----------------------------
userSchema.statics.getUserInfo = function(req, res){
  var userId = req.params.userId;
        console.log(userId);
        User.findOne({id: userId},function(err, user){
            if(err) {
              console.log(err); 
              return res.status(err.code).json({isSuccess: 0});
            }
            else{
                console.log(user);
                
                
                return res.status(200).json({
                  username : user.username,
                  isSuccess : 1, 
                  bucket: user.bucket, 
                  myDiaryCount : user.myDiaryCount, 
                  questions : user.questions,
                  questionCount : user.questionCount
                });
            }
        });
};



  
var User = mongoose.model("User", userSchema);


module.exports = User;
