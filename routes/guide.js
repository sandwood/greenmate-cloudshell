var express = require("express");
var router = express.Router();
var Guide = require("../models/guide");
var now = new Date();
var dateFormat = require("dateformat");
dateFormat.masks.hammerTime= 'yyyy-mm-dd hh:MM';
dateFormat(now,"hammerTime");


router.post('/getGuideList', function(req,res){
    var page = req.body.page;
    var num = Number(req.body.pageNumber);
    var category  = req.body.category;
    var categories = [];
    var items = [];
    var nominees = [];
    
    if(category =="all"){
        Guide.find({block : 0}).sort({published_date: -1}).skip((page-1)*num).limit(num).exec(function(err, guides){
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
                        title : guide.title
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
        Guide.find({$and: [{block: 0},{category : category}]}).sort({published_date: -1}).exec(function(err, guides){
            if(err) {
            console.log(err); 
                return res.status(err.code).json({isSuccess: 0});
            }
            if(guides == null){
                return res.status(204).json({isSuccess: 0,msg : "no guides."});
            }
            Guide.find({block: 0}).exec(function(err, secondGuides){
                
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
                        title : guide.title
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

router.post('/getGuideDetail',function(req, res){
    var guideId = req.body.guideId;
    
    Guide.findOne({guideId: guideId}).exec(function(err, guide){
    
        console.log("hi", guideId);
        if(err) {
            console.log(err); 
            return res.status(err.code).json({isSuccess: 0, err : err});
        }
        else{
            console.log(guide);
            return res.status(200).json(guide);
        }
    });
});




module.exports = router;
