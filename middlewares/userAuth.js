
const isLogin = async (req,res,next) => {
  try {
    if(req.session.data){}
  else{
    res.redirect('/gadgetly/login')
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
        res.redirect('/gadgetly')
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