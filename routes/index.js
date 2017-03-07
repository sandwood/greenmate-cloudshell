var express = require('express');
var router = express.Router();
var authMiddleware = require("../middlewares/auth");


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
});

router.get("/logout/", function(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  request.logout();
  //혹시나 로그아웃이 잘 안되었을 경우 ! 
  if(request.user) return response.status(500).json({isSuccess: 0});
  else return response.status(200).json({isSuccess: 1});
});

router.get("/profile/", authMiddleware.loginRequired, function(request, response) {
  return response.redirect("/");
});




module.exports = router;
