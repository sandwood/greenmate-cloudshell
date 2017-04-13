var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
var moment = require("moment-timezone");



var guideSchema = new mongoose.Schema({

  title:{
    type: String,
    required: true
  },
  guideId:{
    type: String, 
    unique: true, 
    required: true
  },
  species:{
    type: String,
    required: true
  },
  category : {
    type: String,
    required: true
  },
  writer: {
    type : String,
    required: true
  },
  contents : {
    type : []  
  },
  block: {
    type : Number
  },
  published_date: {
    type: String,
    default: moment(Date.now()).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm')
  }
  
});


guideSchema.pre("save", function(next) {
  return next();
});



guideSchema.statics.searchGuide = function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
    
  var page = req.body.page;
  var num = Number(req.body.pageNumber);
  var keyword = (req.body.keyword).toLowerCase();
  var categories = [];
  var nominees = [];
  
  
  console.log(keyword);
  console.log(num, page);
  
  Guide.find({block:0}).sort({published_date: -1}).exec(function(error, guides){
    
            if(error) {
              console.log(error); 
              return res.status(error.code).json({isSuccess: 0});
            }
            else if(guides == null){
              return res.status(204).json({isSuccess : 0});
            }
            if(guides)
            {
                  guides.forEach(function(guide){
                    if(nominees.indexOf(guide.category) <0){
                        nominees.push(guide.category);
                        categories.push({
                            category : guide.category
                        });
                    };
                  });
                  
                  if(keyword != null){
                      var data = guides;
                      var newData = [];
                      
                      data.forEach(function(guide){
                          
                          if(guide.title.toLowerCase().indexOf(keyword) > -1){
                            newData.push({
                              guideId : guide.guideId,
                              title : guide.title,
                              writer : guide.writer,
                              block : guide.block,
                              published_date: guide.published_date
                            });
                          }
                          else{
                            guide.contents.forEach(function(content){
                              if(content.text.toLowerCase().indexOf(keyword) >-1)
                                newData.push({
                                  guideId : guide.guideId,
                                  title : guide.title,
                                  writer : guide.writer,
                                  block : guide.block,
                                  published_date: guide.published_date
                                });
                            })
                          }
                      });
                      
                      if((page-1)*num+ num >= newData.length){
                        return res.status(200).json({
                            isSuccess : 1,
                            isLast : 1,
                            categories :  categories,
                            guideList : newData.slice((page-1)*num,(page-1)*num+num)
                        });        
                      }
                      else{
                          return res.status(200).json({
                              isSuccess : 1,
                              isLast : 0,
                              categories :  categories,
                              guideList : newData.slice((page-1)*num,(page-1)*num+num)
                            });
                      }
                    }else{
                      return res.json({keyword: keyword});
                    }
              }
        });
};

var Guide = mongoose.model("Guide", guideSchema);

module.exports = Guide;
