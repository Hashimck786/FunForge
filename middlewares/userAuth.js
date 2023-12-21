const User = require('../models/userModel')
const isLogin = async (req,res,next) => {
  try {
    if(req.session.data){
      const userData = await User.findOne({_id:req.session.data._id});
      if(userData.is_block){
        return res.render('blockeduser.ejs')
      }
    }
  else{
    res.redirect('/login')
  }
  next();
  
  } catch (error) {
      console.log(error.message)
  }
  
}



const isLogout = async(req,res,next) => {
  try {
      if(req.session.data){
        console.log("is logout middleware")
        res.redirect('/')
      }
      next();
  } catch (error) {
      console.log(error.message)
  }
}

module.exports = {
  isLogin,
  isLogout
}