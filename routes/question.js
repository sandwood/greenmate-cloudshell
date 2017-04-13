var express = require("express");
var router = express.Router();
var Question = require("../models/question");
var User = require("../models/user");
var cors = require("cors");

router.use(cors());
//-------- get a user's questions -----------------
router.post("/getUserQuestion",function(req, res) {
    
    Question.getUserQuestions(req, res);
});

//----------------register a new question. ------------------
router.post("/addQuestion",function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    
        
    var userSeq= req.headers['userseq'];
    var content = req.body.content; 
    var title = req.body.title;
    var picUrl= req.body.picUrl;
    
    User.findOne({userSeq : userSeq}, function(err, user) {
        if(err) return res.status(err.code).json({isSuccess:0, err: err});
            var question = new Question({
                userSeq : userSeq,
                userId : user.id,
                username : user.username,
                questionId : "user_"+ userSeq + "-Q-"+ Date.now(),
                title : title,
                contents : content,
                picUrl : picUrl,
                block : 0, 
                solved: false
            })
        
            question.save(function(error, plant) {
                if(error){
                    console.log(error);
                    return res.status(error.code).json({isSuccess: 0});
                }
                
            });
            return res.status(201).json({isSuccess : 1});
    })    
         
    
});
    
//------------------get all questions -------------------
router.post("/getQuestions", function(req,res){
    
   Question.getQuestions(req, res); 
});
router.post("/getQuestionDetail", function(req, res) {
   
   Question.findOne({questionId: req.body.questionId}).exec(function(err, question){
        if(err) return res.status(err.code).json({isSuccess: 0, err: err});
        
        return res.status(200).json(question);
   });
   
});


//-------------- get solved questions -------------------------- 
router.post("/getUserSolved", function(req,res){
    
   Question.getUserSolved(req,res);
});
router.post("/getSolved", function(req,res){
   
    Question.getSolved(req,res); 
});

//------------------ get unsolved questions -------------------
router.post("/getUserUnsolved", function(req,res){
    
   Question.getUserUnsolved(req,res);
});
router.post("/getUnsolved", function(req,res){
    
   Question.getUnsolved(req,res); 
});  



  
//----------------- reply to the question ----------------------

router.post("/getComments", function(req,res){
    
    var questionId = req.body.questionId;
    var page = req.body.page;
    var num = Number(req.body.num);
    
    Question.findOne({questionId: questionId}, function(error, question) {
        if (error) return res.status(error.code).json({isSuccess: 0, err: error});
        else if (question == null) return res.status(204).json({isSuccess: 0, error: "No content"});
        
        return res.status(200).json({
            isSuccess: 1,
            comments : question.comments
        });
    });
});


router.post("/addComment",function(req, res) {
    
    var questionId = req.body.questionId;
    
    console.log(questionId);
    
    Question.findOne({$and :[{questionId: questionId},{block:0}]}, function(error, question) {
        
        if (error) return res.status(error.code).json({isSuccess: 0, err: error});
        else if (question == null) return res.status(204).json({isSuccess: 0, error: "No content"});
        else{
            User.findOne({userSeq: req.headers['userseq']}).exec(function(err,user){
                if(err) return res.status(err.code).json({isSuccess : 0, err: err});
                if(user.authLevel == 1){
                    user.numberOfAnswer =+ 1;
                }
                
                var comment = {
                    commentId : "user_"+ req.headers['userseq'] +"-"+"QuestionCmt"+"-"+Date.now(),
                    writer: req.body.writer,
                    username : user.username,
                    comment: req.body.comment
                };
                if(comment.writer == 1)
                    question.solved = true;
                question.comments.push(comment);
                
                question.save(function(error) {
                    if(error) {console.log(error); return res.json({isSuccess : 0, err: error});}
                    
                    user.save(function(err){
                        if(err) return res.status(err.code).json({isSuccess : 0, err: err});
                        return res.status(201).json({isSuccess: 1});
                    }); 
                });
            });
        }
    });
});

router.delete("/deleteComment", function(req, res){
    
    var questionId = req.body.questionId;
    var commentId = req.body.commentId;
    
    Question.update({questionId : questionId},{$pull : {comments: {commentId: commentId}}}).exec(function(err){
        
        if(err) return res.status(err.code).json({isSuccess: 0});
        return res.status(200).json({isSuccess: 1});
    });
});

module.exports = router;
