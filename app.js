var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session =require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var messages= require("express-messages");
var passport = require("passport");
var routes = require('./routes/index');
var authRouter = require("./routes/auth");
var plantRouter = require("./routes/plants");
var managerRouter = require("./routes/manager");
var searchRouter = require("./routes/search");
var appInfoRouter = require("./routes/appInfo");
var deleteRouter = require("./routes/delete");
var questionRouter = require("./routes/question");
var guideRouter = require("./routes/guide");
var diaryRouter = require("./routes/diary");
var nthingRouter = require("./routes/nthing");
var methodOverride = require('method-override');
var Plant = require("./models/plant");
var cors = require("cors");
//added
var str2json = require('string-to-json');
var gcs = require('@google-cloud/storage')({
  projectId: "greentest-163904",
  keyFilename: '../config/keyfile',
  credentials: require('./config/keyfile')
});
//db updated every day Nthing!
var request = require('request');

var options = {
  url: 'greenmate-163904.appspot.com/nthing',
  method: 'GET'
}

setInterval(function(){
  request(options,function(error, response, body){
  if(!error && response.statusCode ==200){
    console.log("db updated!");
  }
})
}, 24*60*60*1000);
//Nthing!

// var options = {
//     entity: 'allUsers',
//     role: gcs.acl.READER_ROLE
// };
// var bucket = gcs.bucket("test9900_images");

var mongoose = require("mongoose");

var db = mongoose.connection;

db.once("open", function() {
  
  console.log("Database is connected");
  // Make any new objects added to a bucket publicly readable.
  // bucket.acl.default.add(options, function(err, aclObject){if(err) {
  //     console.log(err); 
  // }});
});

mongoose.connect("mongodb://krazylab:eoqkr2014@aws-us-west-2-portal.2.dblayer.com:15914/green_mate");
mongoose.Promise = require('bluebird');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine' , 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//method override.
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it 
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(cookieParser());
app.use(session({
  secret: "krazylab",
  resave: true,
  saveUninitialized: true
}));

app.use(flash());
app.use(function(req,res,next){
  res.locals.messages = messages(req, res);
  next();
});

app.use(passport.initialize());
app.use(passport.session());
require("./config/passport")(passport);



app.use(function(request, response, next) {
  response.locals.user = request.user;
  next();
});


app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use("/", authRouter);
app.use("/appInfo/", appInfoRouter);
app.use('/plant/', plantRouter);
app.use('/manager/', managerRouter);
app.use('/search/', searchRouter);
app.use('/delete/', deleteRouter);
app.use('/question/', questionRouter);
app.use('/guide/', guideRouter);
app.use('/nthing/', nthingRouter);
app.use('/diary/', diaryRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

//production error handler
//no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



//timer for afterPlanting.
app.listen(process.env.PORT, function(){
    console.log("Server is running!");
    setInterval(function(){
      
      Plant.find().exec(function(err, plants){
        if(err) throw err;
        else{
          plants.forEach(function(plant){
              var afterPlanting = plant.afterPlanting;
              afterPlanting++;
              Plant.update({plantId : plant.plantId}, {$set : {afterPlanting : afterPlanting}},
                  function(err, tasks){
                      if(err){
                          throw err;
                      }
                      else{ console.log(plant.afterPlanting)}
                  }
                )
          });
        }
      });
    }, 86400000);

});

module.exports = app;
