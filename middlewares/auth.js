
function loginRequired(request, response, next) {
  if (!request.user) {
    request.flash("error", "로그인이 필요한 페이지입니다.");
    console.log("login is required");
    return response.redirect("/login/");
  }
  console.log(request.user + " is logined");

  next();
}


function logoutRequired(request, response, next) {
  if (request.user) {
    return response.redirect("/");
  }

  next();
}

function authLevelCheck(req,res, next){
  if (req.user.authLevel == 0){
    req.flash("error", "관리자 권한이 필요합니다.");
    return res.redirect("/login/");
  }
  next();
}


module.exports.loginRequired = loginRequired;
module.exports.logoutRequired = logoutRequired;
module.exports.authLevelCheck = authLevelCheck;