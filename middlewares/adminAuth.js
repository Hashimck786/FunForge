
// checking is login


const isLogin = async (req,res,next) => {
  try {
    if(req.session.admin_id){}
  else{
    res.redirect('/gadgetly/admin/login')
  }
  next();
  
  } catch (error) {
      console.log(error.message)
  }
  
}



// checking is logout ...................................................


const isLogout = async (req,res,next) => {
  try {
      if(req.session.admin_id){
        res.redirect('/gadgetly/admin/home')
      }
      next();
  } catch (error) {
      console.log(error.message);
  }
}


module.exports = {isLogin,isLogout};