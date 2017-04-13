var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require("../models/user");
var Plant = require("../models/plant");
var Diary = require("../models/diary");
var Question = require("../models/question");


//-------------------------- delete User ---------------------------
router.get("/userDropOut/",
    function(req,res,next){
        User.update({userSeq : req.headers['userseq']},{$set: {block: 1}},function(err, user){
            if(err) {
                console.log(err); 
                return res.json({isSuccess: 0});
            }
                req.logout();
                return res.status(200).json({isSuccess: 1, result : "delete successfully"});
        });
    }
);

router.put("/deleteQuestion",function(req, res){
   
    var questionId = req.body.questionId;
    var userSeq = req.headers['userseq'];
    
    
    Question.findOne({questionId : questionId}).exec(function(err, question){
        if(err) return res.status(err.code).json({isSuccess:0, err:err});
        
        
            question.block = 1;
            question.save();
            return res.status(200).json({isSuccess : 1});
                
    });
    
});

router.put("/deleteDiary", function(req, res) {
    var diaryId = req.body.diaryId;
    var userSeq = req.headers['userseq'];
    
    
    Diary.findOne({diaryId : diaryId}).exec(function(err, diary){
        if(err) return res.status(err.code).json({isSuccess:0, err:err});
        
        if(diary.userSeq != userSeq){
            return  res.json({isSuccess:0, err: "Not matched diary owner."});
        }
        else{ 
            diary.block = 1;
            diary.save();
            return res.status(200).json({isSuccess : 1});
        }        
    });
});

router.put("/deletePlant", function(req, res) {
    var plantId = req.body.plantId;
    var userSeq = req.headers['userseq'];
    
    
    Plant.findOne({plantId : plantId}).exec(function(err, plant){
        if(err) return res.status(err.code).json({isSuccess:0, err:err});
        
        if(plant.userSeq != userSeq){
            return  res.json({isSuccess:0, err: "Not matched plant owner."});
        }
        else{ 
            plant.block = 1;
            plant.save();
            return res.status(200).json({isSuccess : 1});
        }        
    });
});
module.exports = router;