var express = require("express");
var router = express.Router();
var request = require("request");
//var str2json = require("string-to-json");
var Nthing = require("../models/nthing");

var gateway = "f4b85e0294e9";
var auth ="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI0NzgxIiwiY2xpZW50SWQiOiJncmVlbm1hdGVzIiwiaWF0IjoxNDg2MDg1OTI3LCJleHAiOjE0ODczODE5Mjd9.3HeQKhmA9sBmqCZeW3IIOJWikFq_nqj1ekIH1BpSE0Y"
var date = new Date();
var hum1 =[];
var hum2 =[];
var hum3 =[];
var hum4 =[];
var hum5 =[];
var light1 =[];
var light2 = [];
var temper1=[];
var temper2=[];
var datastart ="2017-01-01T00:00:00.000Z";
var dataend ="2017-01-31T00:00:00.000Z";
var interval ="30m";

var options = {
      url: "https://api.thingplus.net/v1/gateways/"+gateway+"/sensors?embed=series&series[dataStart]="+datastart+"&series[dataEnd]="+dataend+"&series[interval]="+interval,
      method:'GET',
      auth :{
          "bearer":auth
      }
    };

// for(var j=0; j<keyword.length;j++){
    
//     var options = {
//     url: "https://api.thingplus.net/v1/gateways/f4b85e0294e9/sensors?embed=series&series[dataStart]=2016-11-30T01:14:00.000Z&series[dataEnd]=2016-12-05T00:00:00.000Z&series[interval]=30m",
//     method:'GET',
//     auth :{
//         "bearer":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI0NzgxIiwiY2xpZW50SWQiOiJncmVlbm1hdGVzIiwiaWF0IjoxNDg2MDg1OTI3LCJleHAiOjE0ODczODE5Mjd9.3HeQKhmA9sBmqCZeW3IIOJWikFq_nqj1ekIH1BpSE0Y"
//     }
// }
//     request(options,function(error, response){
//       var data = JSON.parse(response.body);
      
//       var newData = data.series.data;
      
//       for (var i = 0; i < newData.length; i+=2){
//         var nthing = new Nthing({
//             name : newData[i],
//             owner : newData[i+1]
//             data: 
//         });
        
//         // nthing.save(function(error){
//         //   if(error)return next(error);
//         //   req.flash("singup","success!");
//         //    console.log(message);
//         // });
//       }
//       console.log(newData.length);
//     });
// }



router.get("/", function(req, res,next){
request(options,function(error, response){
  var data = JSON.parse(response.body);
  for (var i = 0; i < data.length; i++){
     var newData = data[i];
     if(newData.name=="humidity-1"){
         hum1=newData.series.data;
     }else if(newData.name=="humidity-2"){
         hum2=newData.series.data;
     }else if(newData.name=="humidity-3"){
         hum3=newData.series.data;
     }else if(newData.name=="humidity-4"){
         hum4=newData.series.data;
     }else if(newData.name=="humidity-5"){
         hum5=newData.series.data;
     }else if(newData.name=="light-1"){
         light1=newData.series.data;
     }else if(newData.name=="light-2"){
         light2=newData.series.data;
     }else if(newData.name=="temperature-1"){
         temper1=newData.series.data;
     }else if(newData.name=="temperature-2"){
         temper2=newData.series.data;
     }
  }
  
  for(var j =0; j<hum1.length; j+=2){
    var nthing = new Nthing({
        factory:"daekyo",
        gateway:gateway,
        date:hum1[j+1],
        humidity1:hum1[j],
        humidity2 : hum2[j],
        humidity3 : hum3[j],
        humidity4 : hum4[j],
        humidity5 : hum5[j],
        temperature1:temper1[j],
        temperature2:temper2[j],
        light1 : light1[j],
        light2 : light2[j]
    });
    nthing.save(function(error){
      if(error)return console.log(error);
      console.log("success!");
    });
  }
  //req.flash("hi","hi");
  //res.json(newData);
  console.log('dododo');
  if(error)return console.log(error);
});

  res.json("hi");
});
module.exports = router;
