   const User = require('../models/userModel')
   
   const userBlockMiddleware = async(req,res,next)=>{
    try{
      // const userId = req.session.data._id;
      const email = req.body.email;
      const userData = await User.findOne({email:email});
      // userData = await User.findOne({_id:userId})
      if(userData){
        if(userData.is_block=== 1){
          return res.render('blockeduser.ejs')
       }
      }
      next()
    }catch(error){
      console.error(error.message);
    }
   }     

   module.exports = userBlockMiddleware
        