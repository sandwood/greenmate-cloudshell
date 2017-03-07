var express = require('express');
var router = express.Router();
var appInfo = require("../models/appInfo");


/* GET home page. */
router.get('/', function(req, res, next) {
    appInfo.findOne().sort({published_date: -1}).exec(function(err, info){
        if(err) res.status(err.code).json({isSuccess: 0});
        else {
            res.status(200).json(info);
            
        }
    });
});

router.post('/', function(req, res){
    
    var ios = req.body.ios; 
    var iosDate = req.body.iosDate; 
    var android = req.body.android; 
    var androidDate = req.body.androidDate;
    var is_maintenance = req.body.is_maintenance;
    
    var appInfo1 = new appInfo({
        ios : ios,
        iosDate : iosDate,
        android : android,
        androidDate : androidDate,
        is_maintenance : is_maintenance
    });
    
    appInfo1.save(function(error, plant) {
        if(error){
            console.log(error);
        }
    });
    
    return res.json({isSuccess : 1});
});


module.exports = router;