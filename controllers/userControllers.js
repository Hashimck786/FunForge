
const User = require('../models/userModel')
const Product = require('../models/prodectModel')
const bcrypt = require('bcrypt')
const { validationResult  } = require('express-validator');
const nodemailer = require('nodemailer');


// password bcrypting.......................

const securePassword = async(password) => {
  try {
    const passwordHash = await bcrypt.hash(password,10);
    return passwordHash
  } catch (error) {
    console.log(error.message)
  }
 
}

// sending verification mail.......................................

const sendVerificationMail = async(name,email,id) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'hashimckdev@gmail.com',
          pass: 'xzdg nfal lsyt szsg'

      }
  });
  const mailOptions = {
    from:'hashimckdev@gmail.com',
    to:email,
    subject:'Verification Email',
    html:`<p>HI ${name} <a href="http://localhost:3000/gadgetly/verify?id=${id}>click here to verify mail<a> </p>`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log(error);
        
    } else {
        console.log("Email has been send",info.response)
    }
});
  } catch (error) {
    console.log(error.message);
  }
}


// sending verification mail.......................................

const sendOtpMail = async(name,email,id,otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'hashimckdev@gmail.com',
          pass: 'xzdg nfal lsyt szsg'

      }
  });
  const mailOptions = {
    from:'hashimckdev@gmail.com',
    to:email,
    subject:'Verification Email',
    text:"This is the otp to Reset your password"+otp
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log(error);
        
    } else {
        console.log("Email has been send",info.response)
    }
});
  } catch (error) {
    console.log(error.message);
  }
}

// loading   Home page.................................

const loadHome = async (req,res) =>{
  try{
    userData=req.session.data;
    res.render('index.ejs',{user:userData})
  }catch(error){
    res.send(error.message)
  }
}

// loading loging page....................................

const loadLoginPage = async (req,res) => {
  try{
    res.render('login.ejs')
  }catch(error){
    res.send(error.message)
  }
}

// signup page loading.....................................

const loadSignup = async (req,res) => {
  try{
    res.render('signup.ejs')
  }catch(error){
    res.send(error.message)
  }
}


// login verification..............................................

const loginSubmission= async(req,res) => {
  try{
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({email:email});
    if(userData){
      const passwordverified = await bcrypt.compare(password,userData.password);
      if(passwordverified){
        if(userData.is_verified==1){
          req.session.data = userData;
          res.redirect('/gadgetly')
        }else{
          res.render('login.ejs',{message:"Please verify your email by clicking the link sent to your email."})
        }
        
        
      }else{
        res.render("login",{message:"email and password is incorrect"})
      }
    }else{
      res.render("login",{message:"email and password is incorrect"})
    }
  }catch(error){
    res.send(error.message)
  }
}

// signup submission with validation.................................

const signupSubmission = async(req,res) => {

  const errors = validationResult(req);
  
 
  if(!errors.isEmpty()){
    return res.render('signup.ejs',{error:errors.mapped()})
  }
  try {
    const sPassword = await securePassword(req.body.password)
    const user = new User({
      name : req.body.username,
      mobile : req.body.mobile,
      email : req.body.email,
      password : sPassword,
      
      
    });
  const userData = await user.save();
  sendVerificationMail(req.body.username,req.body.email,userData._id)
  if(userData){
        res.redirect('/gadgetly/login')
  }else{
       res.render('signup',{message:"submission failed"})
  }
  } catch (error) {
    res.send(error.message)
  }
}


// logging out....................................................

const logingOut = async(req,res) => {
  try {
    req.session.destroy()
    res.redirect('/gadgetly')
  } catch (error) {
      console.error(error.message)
  }
}
// loading forget password page....................................

const loadForget = async(req,res) => {
  try {
    res.render('forgetPassword.ejs')
  }catch (error) {
      console.error(error.message)
  }
}


// forgetPassword  .. sending otp.................................................

const sendOtp = async(req,res) => {
  try {
    const mail = req.body.email;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const userData = await User.findOneAndUpdate({email:mail},{$set :{otp:otp}})
    if(userData){
      const name = userData.name
      const email = userData.email
      const id = userData._id
      sendOtpMail(name,email,id,otp);
      res.render('otpValidation.ejs',{user:userData})
      
    }else{
      res.render('forgetPassword.ejs',{message:"error sending mail"})
    }
  } catch (error) {
    console.error(error.message)
  }
}

// verifying otp...........................................................

const verifyOtp = async(req,res) => {
  try {
     const id = req.query.id;
     const otpEntered = req.body.otp;
     const userData = await User.findOne({_id:id});
     if(userData.otp == otpEntered){
        const updated = await User.updateOne({_id:id},{$set: {otp:""}})
        res.render('updatePassword.ejs',{user:userData})
     }else{
        res.render('otpValidation.ejs',{message:"invalid Otp"})
     }
  } catch (error) {
    console.error(error.message)
  }
}

// password changing.................................................

const updatePassword = async(req,res) => {
  try {
    const id = req.query.id;
    const password = req.body.password;
    const spassword = await securePassword(password);
    const userData = await User.findOne({_id:id})
    if(userData){
      const updated = await User.updateOne({_id:id},{$set : {password:spassword}})
      res.redirect('/gadgetly/login')
    }else{
      res.render('updatepassword.ejs',{message:"password verification gone wrong"})
    }
  } catch (error) {
    console.log(error.message)
  }
}
// contact page loading...........................................

const loadContact = async(req,res) => {
  try {
    res.render('page-contact.ejs')
  } catch (error) {
     res.send(error.message)
  }
}

// verifying Email...................................................

 const verifyMail = async(req,res) => {
  try {
    const  updated = await User.updateOne({_id:req.query.id},{$set : {is_verified:1}})
    res.redirect('/gadgetly/login');
  } catch (error) {
    console.log(error.message)
  }
 }

 // loading product page in userSide............................................................

 const loadProducts = async(req,res) => {
  try {
    userData=req.session.data;
    const productData = await Product.find({is_listed:1});
    res.render('productgrid.ejs',{product:productData,user:userData})
  } catch (error) {
    console.error(error.message)
  }
 }

//  loading product detail page............................................................................

const loadProductDetail = async(req,res) => {
  try {
    const id =req.query.id;
    userData=req.session.data;
    const productData = await Product.findById({_id:id});
    res.render('productdetail.ejs',{product:productData,user:userData})
  } catch (error) {
      console.error(error.message)
  }
}

// loading wishlist ..........................................................................................

const loadWishlist = async(req,res) => {
  try {
    const userData = req.session.data; 
    const id =userData._id
    const newuserData = await User.findOne({_id:id})
    const userwishlist = newuserData.wishlist;
    productData = await Product.find({_id:{$in :userwishlist}},{})

    res.render('wishlist.ejs',{product:productData})
  }catch(error){
    console.error(error.message)
  }
}

// adding to wish list ...........................................................................................


const addToWishlist = async(req,res) => {
  try {
    const userData = req.session.data;
    const userId = userData._id;
    const productId = req.query.id;
    const updated = await User.updateOne({_id:userId},{$addToSet:{wishlist:productId}})
    res.redirect('/gadgetly/shop')
    
  } catch (error) {
      console.error(error.message);
  }
}

// removing from wish list ............................................................................................

const removeFromWishlist = async(req,res) => {
  try {
    const userData = req.session.data;
    const userId = userData._id;
    const productId = req.query.id;
    const updated = await User.updateOne({_id:userId},{$pull:{wishlist:productId}})
    res.redirect('/gadgetly/wishlist')
  } catch (error) {
      console.error(error.message)
  }
}




// exporting functions.................................
module.exports = {
  loadHome,
  loadLoginPage,
  loadSignup,
  loginSubmission,
  signupSubmission,
  logingOut,
  loadForget,
  sendOtp,
  verifyOtp,
  updatePassword,
  loadContact,
  verifyMail,
  loadProducts,
  loadProductDetail,
  loadWishlist,
  addToWishlist,
  removeFromWishlist
}