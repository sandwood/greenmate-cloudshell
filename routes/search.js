var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Question = require("../models/question");
var Guide = require("../models/guide");


router.post("/searchUser/", function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    User.searchUser(req, res);   
});

router.get("/:userId/info", function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log(req.params.userId);
    User.getUserInfo(req, res);   
});

router.post("/searchQuestion/", function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    Question.searchQuestion(req, res);
})


router.post("/searchGuide", function(req, res) {
   res.setHeader("Access-Control-Allow-Origin", "*");
   Guide.searchGuide(req,res);
    
});

module.exports = router;