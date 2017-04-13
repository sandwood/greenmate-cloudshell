var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Question = require("../models/question");
var Guide = require("../models/guide");
var Plant = require("../models/plant");

router.post("/searchUser/", function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    User.searchUser(req, res);   
});

router.get("/:userId/info", function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log(req.params.userId);
    User.getUserInfo(req, res);   
});

router.post("/searchPlant", function(req, res) {
    var keyword = (req.body.keyword).toLowerCase();
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    var items = [];
    
    
    if(!page && !num){
        Plant.find({block:0}).sort({published_date: -1}).exec(function(err, plants){
            if(err) return res.json({isSuccess : 0, err: err});
            console.log(keyword);
            plants.forEach(function(plant){
                if(plant.plantName.toLowerCase().indexOf(keyword) > -1){
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
                }else if(plant.manager &&plant.manager.toLowerCase().indexOf(keyword) > -1){
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
                }else if(plant.username.toLowerCase().indexOf(keyword) > -1){
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
                }else if(plant.factory!=null &&plant.factory.toLowerCase().indexOf(keyword) > -1){
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
                }
            });
            if(true){
                return res.status(200).json({
                    isSuccess : 1,
                    isLast : 1,
                    plants : items
                });        
            }
        }) ;        
    }
    else{
    Plant.find({block:0}).sort({published_date: -1}).exec(function(err, plants){
        if(err) return res.json({isSuccess : 0, err: err});
        console.log(keyword);
        plants.forEach(function(plant){
            if(plant.plantName.toLowerCase().indexOf(keyword) > -1){
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
            }else if(plant.manager &&plant.manager.toLowerCase().indexOf(keyword) > -1){
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
            }else if(plant.username.toLowerCase().indexOf(keyword) > -1){
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
            }else if(plant.factory!=null &&plant.factory.toLowerCase().indexOf(keyword) > -1){
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
            }
        });
        if((page-1)*num+ num >= items.length){
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
    }) ;
    }
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