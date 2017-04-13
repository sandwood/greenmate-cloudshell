var express = require("express");
var router = express.Router();
var request = require("request");
//var str2json = require("string-to-json");
var Nthing = require("../models/nthing");

//updated by 15 days
var gateway = "f4b85e0294e9";
//if token expired, you might visit below site to renew the token (15days durations)
//https://accounts.thingplus.net/api/oauth2/authorize?response_type=code&client_id=greenmate&redirect_uri=https://green-mate2-petercha90.c9users.io/

var auth ="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI0NzgxIiwiY2xpZW50SWQiOiJncmVlbm1hdGUiLCJpYXQiOjE0OTA2MDk0MTYsImV4cCI6MTQ5MTkwNTQxNn0.E5MJ15tamGlVrCcc5euIdUDs8VSSFW14fThiyj502QI"

var date = new Date();
date.setHours(date.getHours()+9);
var month = date.getMonth()+1;
var preDate = new Date();
preDate.setHours(preDate.getHours()+9);
preDate.setDate(preDate.getDate()-1);
var preMonth = preDate.getMonth()+1;
var hum1 = new Array();
var hum2 =new Array();
var hum3 =new Array();
var hum4 =new Array();
var hum5 =new Array();
var light1 =new Array();
var light2 = new Array();
var temper1=new Array();
var temper2=new Array();
if(preMonth>9&&preDate.getDate()>9){
      var datastart ="2017-"+preMonth+"-"+preDate.getDate()+"T00:00:00.000Z";
}else if(preMonth>9&&preDate.getDate()<10){
      var datastart ="2017-"+preMonth+"-0"+preDate.getDate()+"T00:00:00.000Z";
  }else if(preMonth<10&&preDate.getDate()>9){
      var datastart ="2017-0"+preMonth+"-"+preDate.getDate()+"T00:00:00.000Z";
  }else{
      var datastart ="2017-0"+preMonth+"-0"+preDate.getDate()+"T00:00:00.000Z";
  }
  
  if(month>9&&date.getDate()>9){
      var dataend ="2017-"+month+"-"+date.getDate()+"T00:00:00.000Z";
  }else if(month>9&&date.getDate()<10){
      var dataend ="2017-"+month+"-0"+date.getDate()+"T00:00:00.000Z";
  }else if(month<10&&date.getDate()>9){
      var dataend ="2017-0"+month+"-"+date.getDate()+"T00:00:00.000Z";
  }else{
      var dataend ="2017-0"+month+"-0"+date.getDate()+"T00:00:00.000Z";
  }
  //var datastart ="2017-"+preMonth+"-"+preDate.getDate()+"T00:00:00.000Z";
  //var datastart ="2017-01-01T00:00:00.000Z";
  //var dataend ="2017-"+month+"-"+date.getDate()+"T00:00:00.000Z";
  //var dataend ="2017-01-02T00:00:00.000Z";
  var interval ="30m";
  
  var sensorLen =0;


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
  if(hum1.length==0){
      sensorLen = hum2.length;
  }

  for(var j =0; j<sensorLen; j+=2){
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
      console.log("get Nthing data!");
    });
  }
  //req.flash("hi","hi");
  //res.json(newData);
  if(error)return console.log(error);
});

  res.json("hi2");
});
module.exports = router;
