var LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var KakaoStrategy = require("passport-kakao").Strategy;
var NaverStrategy = require("passport-naver").Strategy;
var request = require("request");

var gcs = require('@google-cloud/storage')({
  projectId: "greentest-163904",
  keyFilename: '../config/keyfile',
  credentials: require('../config/keyfile')
});


var User = require("../models/user");


module.exports = function(passport){
    //local authenticationp
    passport.use(new LocalStrategy({usernameField : 'id', passwordField: 'password'},User.authenticate()));
    passport.serializeUser(User.serialize());
    passport.deserializeUser(User.deserialize());
    
    
    //facebook
    passport.use(new FacebookStrategy({
        clientID: "1805972802984860",
        clientSecret: "48c8d93553d87b2cb16f5552d54772d2",
        callbackURL: "https://greenmate-163904.appspot.com/auth/facebook/callback",
        profileFields: ['id', 'email','displayName', 'photos']
    },
    function(accessToken, refreshToken, profile, cb) {
        
        User.findOne({$and : [{id: profile.id + "@facebook.com"},{block : 0}]}, function (err, user) {
            if(err)  return cb(err, user);
            if(user) {
                console.log(profile);
                console.log(accessToken);
                
                //token check and refresh. 
                // request('https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=1805972802984860&client_secret=48c8d93553d87b2cb16f5552d54772d2&fb_exchange_token='+accessToken +'/',function(err, res, body){
                //     if(err) res.status(err.code).json({resultCode: 0});
                // });
                
                return cb(err, user, accessToken);
            }
            else if(!user){
                
                var id = profile.id + "@facebook.com";
                id = id.replace(/(\s*)/g,"").toLowerCase();
                      
                var bucketName = id.replace(/@|\./g,"-").replace(/(\s*)/g,"").toLowerCase();
                      
                gcs.createBucket(bucketName, function(err, bucket){
                    if(err) {
                        console.log(err); 
                        return cb(err);
                    }
                                  
                    var user = new User({
                        username : profile.displayName,
                        password : profile.id,
                        authLevel : 0,
                        accessToken: accessToken,
                        bucket : bucketName,
                        plantCount : 0,
                        questionCount : 0,
                        myDiaryCount : 0,
                        id : id,
                        block : 0 
                    });
                                  
                    user.save(function(error, user) {
                        if(error){
                            return cb(error);
                        } 
                        var userBucket = gcs.bucket(bucketName);
                                        
                        // Make all of the files currently in a bucket publicly readable.
                        var options = {
                            entity: 'allUsers',
                            role: gcs.acl.READER_ROLE
                        };
                                        
                        //userBucket.acl.add(options, function(err, aclObject) {if(err)throw err;});
                                        
                        // Make any new objects added to a bucket publicly readable.
                        userBucket.acl.default.add(options, function(err, aclObject){if(err) {
                            console.log(err); 
                            return cb(err);
                        }});
                                        
                        // request.flash("success", "Successfully created a user");
                        return cb(err, user);
                    });
                });
            }
            });
        })
    );
    
    
    
    //kakao
    passport.use(new KakaoStrategy({
            clientID: "df2f5c7a33d22a1115127d5e2265434d",
            callbackURL: "https://greenmate-163904.appspot.com/auth/kakao/callback"
    }, function(accessToken, refreshToken, profile, done){
            User.findOne({$and : [{id: profile.id + "@kakao.com"}, {block : 0}]}, function(err, user){
                if(err){return done(err);}

                if(user) {console.log(profile); return done(err, user, accessToken);}
                
                else{
                    
                    var id = profile.id + "@kakao.com";
          
                    var bucketName = id.replace(/@|\./g,"-").replace(/(\s*)/g,"").toLowerCase();
                       
                    gcs.createBucket(bucketName, function(err, bucket){
                        if(err) {
                            console.log(err); 
                            return done(err);
                        }
                              
                        var user = new User({
                            username : profile.displayName,
                            password : profile.id,
                            authLevel : 0,
                            accessToken: accessToken,
                            bucket : bucketName,
                            plantCount : 0,
                            questionCount : 0,
                            myDiaryCount : 0,
                            id : id,
                            block: 0
                        });
                              
                        user.save(function(error, user) {
                            if(error){
                                return done(error);
                            } 
                            var userBucket = gcs.bucket(bucketName);
                                
                            // Make all of the files currently in a bucket publicly readable.
                            var options = {
                                entity: 'allUsers',
                                role: gcs.acl.READER_ROLE
                            };
                                
                            //userBucket.acl.add(options, function(err, aclObject) {if(err)throw err;});
                                
                            // Make any new objects added to a bucket publicly readable.
                            userBucket.acl.default.add(options, function(err, aclObject){if(err) {
                                console.log(err); 
                                return done(err);
                            }});
                                
                            // request.flash("success", "Successfully created a user");
                            return done(err, user);
                        });
                    })
                }
            });
        })
    );
    
     passport.use(new NaverStrategy({
            clientID: "iK4kBMEDIkoRb_kdJIA7",
            clientSecret: "yqFVLyypmn", 
            callbackURL: "https://greenmate-163904.appspot.com/auth/naver/callback",
            svcType: 0
    }, function(accessToken, refreshToken, profile, done){
        
            User.findOne({$and : [{id: profile.emails[0].value}, {block : 0}]}, function(err, user){
                if(err)return done(err);
                if(user){ console.log(profile.emails[0].value); return done(err, user, accessToken);}
                
                else{
                    
                    var id = profile.emails[0].value;
          
                    var bucketName = id.replace(/@|\./g,"-").replace(/(\s*)/g,"").toLowerCase();
                            
                    gcs.createBucket(bucketName, function(err, bucket){
                        if(err) {
                            console.log(err); 
                            return done(err);
                        }
                              
                        var user = new User({
                            username : profile.displayName,
                            password : profile.id,
                            authLevel : 0,
                            accessToken: accessToken,
                            bucket : bucketName,
                            plantCount : 0,
                            questionCount : 0,
                            myDiaryCount : 0,
                            id : id,
                            block: 0
                        });
                              
                        user.save(function(error, user) {
                            if(error){
                                return done(error);
                            } 
                            var userBucket = gcs.bucket(bucketName);
                                
                            // Make all of the files currently in a bucket publicly readable.
                            var options = {
                                entity: 'allUsers',
                                role: gcs.acl.READER_ROLE
                            };
                                
                            //userBucket.acl.add(options, function(err, aclObject) {if(err)throw err;});
                                
                            // Make any new objects added to a bucket publicly readable.
                            userBucket.acl.default.add(options, function(err, aclObject){if(err) {
                                console.log(err); 
                                return done(err);
                            }});
                                
                            // request.flash("success", "Successfully created a user");
                            return done(err, user);
                        });
                    });
                }
            });
        }
    ));
};
