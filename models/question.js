var mongoose = require("mongoose");
var autoIncrement = require("mongoose-auto-increment");
var moment = require("moment-timezone");


var connection = mongoose.createConnection("mongodb://krazylab:eoqkr2014@aws-us-west-2-portal.2.dblayer.com:15914/green_mate");

autoIncrement.initialize(connection);
mongoose.Promise = require('bluebird');


var commentSchema = new mongoose.Schema({
  commentId : String,
  writer : Number,
  username : String,
  comment: String,
  published_date: {
      type: String,
      default: moment(Date.now()).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm') 
    }
});

var questionSchema = new mongoose.Schema({

  userSeq : {
    type : Number
  },
  questionSeq : Number,
  userId:{
    type: String,
    required: true
  },
  username : {
    type : String
  },
  questionId:{
    type: String, 
    unique: true, 
    required: true
  },
  
  block : Number,
  title:{
    type: String,
    required: true
  },
  contents: {
    type : String,
    required: true
  },
  picUrl: {
    type: String,
    required: true
  },
  comments:[commentSchema],
  solved : {
    type : Boolean
  },
  published_date: {
    type: String,
    default: moment(Date.now()).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
  }
  
});

questionSchema.plugin(autoIncrement.plugin, {model:'Question', field: 'questionSeq'});

questionSchema.pre("save", function(next) {
  this.questionSeq += 1;
  return next();
});


questionSchema.statics.serialize = function() {
  return function(diary, callback) {
    return callback(null, diary._id);
  }
}


questionSchema.statics.deserialize = function() {
  return function(id, callback) {
    Question.findOne({_id: id}, function(error, diary) {
      return callback(error, diary);
    });
  }
}
//----------------- get all questions ---------------------------
questionSchema.statics.getQuestions = function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
    
  var page = req.body.page;
  if(page==null) page = 0;
  var num = Number(req.body.pageNumber);
  
  Question.find({block : 0}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, questions){
    
      var questionList = [];
    
      if(err) {
          console.log(err); 
          return res.status(err.code).json({isSuccess: 0});
      }
      if(questions == null){
        return res.status(204).json({isSuccess: 0,
          msg : "no question."
        });
      }
      Question.find({block : 0}).count(function(err,count){
          if(err) return res.status(err.code).json({isSuccess : 0});
          
          questions.forEach(function(question){
              var numOfManagerReply=0;
              
              question.comments.forEach(function(comment){
                if(comment.writer == 1)
                    numOfManagerReply +=1;
              });
                  
              questionList.push({
                  questionId : question.questionId,
                  title : question.title,
                  contents : question.contents,
                  username : question.username,
                  numOfComment : question.comments.length,
                  numOfManagerReply: numOfManagerReply,
                  published_date : question.published_date
              })
          });
        
          if((page-1)*num+ num >= count){
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 1,
                  questions : questionList
              });        
                }
          else{
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 0,
                  questions : questionList
              });
          }
      });
  });  
};

questionSchema.statics.getUserQuestions = function(req,res){
    
  var userSeq= req.headers['userseq'];
  var page = req.body.page;
  var num = Number(req.body.pageNumber);
  
  
  Question.find({$and: [{userSeq : userSeq},{block: 0}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, questions){
      if(err) {
          console.log(err); 
          return res.status(err.code).json({isSuccess: 0});
      }
      if(questions == null){
        return res.json({isSuccess: 0,
          msg : "no such user."
        });
      }
      Question.find({$and: [{userSeq : userSeq}, {block: 0}]}).count(function(err,count){
          if(err) return res.status(err.code).json({isSuccess : 0});
          var questionList = [];
          questions.forEach(function(question){
              var numOfManagerReply=0;
              
              question.comments.forEach(function(comment){
                if(comment.writer == 1)
                    numOfManagerReply +=1;
              });
                  
              questionList.push({
                  questionId : question.questionId,
                  title : question.title,
                  contents : question.contents,
                  username : question.username,
                  numOfComment : question.comments.length,
                  numOfManagerReply: numOfManagerReply,
                  published_date : question.published_date
              });
          });
          
          if((page-1)*num+ num >= count){
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 1,
                  questions : questionList
              });        
          }
          else{
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 0,
                  questions : questionList
              });
          }
      });
  });  
};

questionSchema.statics.getSolved = function(req,res){
    
  var page = req.body.page;
  var num = Number(req.body.pageNumber)
  
  if(page==null) page = 0;
   
  Question.find({$and: [{solved: true},{block: 0}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, questions){
      if(err) {
          console.log(err); 
          return res.status(err.code).json({isSuccess: 0});
      }
      if(questions == null){
        return res.status(204).json({isSuccess: 0,
          msg : "no questions."
        });
      }
      Question.find({solved: true}).count(function(err,count){
          if(err) return res.status(err.code).json({isSuccess : 0});
          if((page-1)*num+ num >= count){
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 1,
                  questions : questions
              });        
                }
          else{
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 0,
                  questions : questions
              });
          }
      });
  });  
};

questionSchema.statics.getUserSolved = function(req,res){
  res.setHeader("Access-Control-Allow-Origin", "*");
    
  var userSeq = req.headers['userseq'];
  var page = req.body.page;
  var num = Number(req.body.pageNumber)
  
  if(page==null) page = 0;
   
  Question.find({$and:[{userSeq : userSeq}, {solved: true},{block:0}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, questions){
      if(err) {
          console.log(err); 
          return res.status(err.code).json({isSuccess: 0});
      }
      if(questions == null){
        return res.status(204).json({isSuccess: 0,
          msg : "no such user."
        });
      }
      Question.find({$and:[{userSeq : userSeq}, {solved: true}]}).count(function(err,count){
          if(err) return res.status(err.code).json({isSuccess : 0});
          if((page-1)*num+ num >= count){
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 1,
                  questions : questions
              });        
                }
          else{
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 0,
                  questions : questions
              });
          }
      });
  });  
};

questionSchema.statics.getUnsolved = function(req,res){
    
  var page = req.body.page;
  var num = Number(req.body.pageNumber)
  
  if(page==null) page = 0;
  
  Question.find({$and: [{solved : false},{block: 0}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, questions){
      if(err) {
          console.log(err); 
          return res.status(err.code).json({isSuccess: 0});
      }
      if(questions == null){
        return res.status(204).json({isSuccess: 0,
          msg : "no such user."
        });
      }
      Question.find({$and: [{solved : false},{block: 0}]}).count(function(err,count){
          if(err) return res.status(err.code).json({isSuccess : 0});
          var questionList= [];
          questions.forEach(function(question){
              
              questionList.push({
                  questionId : question.questionId,
                  title : question.title,
                  contents : question.contents,
                  username : question.username,
                  numOfComment : question.comments.length,
                  numOfManagerReply: 0,
                  published_date : question.published_date
              })
          });
          
          
          if((page-1)*num+ num >= count){
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 1,
                  questions : questionList
              });        
                }
          else{
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 0,
                  questions : questionList
              });
          }
      });
  });  
};


questionSchema.statics.getUserUnsolved = function(req,res){
    
  var userSeq = req.headers['userseq'];
  var page = req.body.page;
  var num = Number(req.body.pageNumber);
  
  if(page==null) page = 0;
  
  Question.find({$and:[{userSeq : userSeq},{block:0}, {solved: false}]}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, questions){
      if(err) {
          console.log(err); 
          return res.status(err.code).json({isSuccess: 0});
      }
      if(questions == null){
        return res.json({isSuccess: 0,
          msg : "no such user."
        });
      }
          
      Question.find({$and:[{userSeq : userSeq}, {solved: false}]}).count(function(err,count){
          if(err) return res.status(err.code).json({isSuccess : 0});
          if((page-1)*num+ num >= count){
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 1,
                  questions : questions
              });        
                }
          else{
              return res.status(200).json({
                  isSuccess : 1,
                  isLast : 0,
                  questions : questions
              });
          }
      });
  });  
};

commentSchema.pre("save", function(next) {
  next();
});

questionSchema.statics.searchQuestion = function(req, res){
    
  var page = req.body.page;
  var num = Number(req.body.pageNumber);
  var keyword = (req.body.keyword).toLowerCase();
 
  console.log(keyword);
  console.log(num, page);
  
  Question.find({block:0}).sort({published_date: -1}).exec(function(error, questions){
            if(error) {
              console.log(error); 
              return res.status(error.code).json({isSuccess: 0});
            }
            else if(questions == null){
              return res.status(204).json({isSuccess : 0});
            }
            if(questions)
            {
                    
                Question.find({block:0}).sort({published_date: -1}).count(function(error, count){
                    if(error) {
                        console.log(error); 
                        return res.status(error.code).json({isSuccess: 0});
                    }
                    
                    if(keyword != null){
                     
                      var newData = [];
                      
                      
                      questions.forEach(function(question){
                          
                          if(question.title.toLowerCase().indexOf(keyword) > -1 || question.contents.toLowerCase().indexOf(keyword) >-1 || question.username.toLowerCase().indexOf(keyword) >-1){
                            
                            var numOfManagerReply=0;
              
                            question.comments.forEach(function(comment){
                                if(comment.writer == 1)
                                    numOfManagerReply +=1;
                            });
                            
                            newData.push({
                                questionId : question.questionId,
                                title : question.title,
                                contents: question.contents,
                                username: question.username,
                                numOfComment: question.comments.length,
                                numOfManagerReply : numOfManagerReply,
                                published_date : question.published_date
                              });
                          }
                      });
                      
                      if((page-1)*num+ num >= newData.length){
                        return res.status(200).json({
                            isSuccess : 1,
                            isLast : 1,
                            questions : newData.slice((page-1)*num,(page-1)*num+num)
                        });        
                      }
                      else{
                          return res.status(200).json({
                              isSuccess : 1,
                              isLast : 0,
                              questions : newData.slice((page-1)*num,(page-1)*num+num)
                            });
                      }
                    }else{
                      return res.json({keyword: keyword});
                    }
                }); 
              }
        });
};

var Question = mongoose.model("Question", questionSchema);

module.exports = Question;
