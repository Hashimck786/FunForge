const express = require('express');
const userRoute = express();
const session = require('express-session');
const {body,check} = require('express-validator');

const config = require('../config/config.js')
userRoute.use(session({secret:config.sessionSecret,
  resave: false, 
  saveUninitialized: true,                             
   }));

userRoute.set('view engine','ejs');
userRoute.set('views','./views/user')

userRoute.use(express.json());
userRoute.use(express.urlencoded({extended:true}))

const userController = require('../controllers/userControllers')

userRoute.get("/",userController.loadHome);
userRoute.get('/signup',userController.loadSignup);
userRoute.post('/signup',[ 
  body('username').trim().isLength({min:3,max:10}).withMessage('Enter minimum 3 characters'),
  body('email').isEmail().withMessage('invalid email'),
  body('mobile').isNumeric().isLength({min:10,max:10}).withMessage('invalid mobilenumber'),
  body('password').isLength({min:8}).withMessage('enter minimum 8 characters')
],userController.signupSubmission)
userRoute.get('/login',userController.loadLoginPage)
userRoute.post('/login',userController.loginSubmission);
userRoute.get('/logout',userController.logingOut)
userRoute.get('/forget',userController.loadForget);
userRoute.post('/forget',userController.sendOtp);
userRoute.post('/otpvalidation',userController.verifyOtp),
userRoute.post('/updatePassword',userController.updatePassword)
userRoute.get('/contact',userController.loadContact);
userRoute.get('/verify',userController.verifyMail);

userRoute.get('/shop',userController.loadProducts);
userRoute.get('/productdetail',userController.loadProductDetail)
userRoute.get('/wishlist',userController.loadWishlist)
userRoute.get('/addwishlist',userController.addToWishlist)
userRoute.get('/removewishlist',userController.removeFromWishlist)
userRoute.get('/myaccount',userController.loadProfile)
userRoute.post('/editProfile',userController.editProfile)
userRoute.get('/addAddress',userController.loadAddAddress)
userRoute.post('/addAddress',userController.addAddress);
userRoute.get('/editaddress',userController.loadEditAddress);
userRoute.post('/editaddress',userController.editAddress)
userRoute.get('/deleteaddress',userController.deleteAddress)
userRoute.get('/defaultaddress',userController.defaultAddress)

userRoute.get('/cart',userController.loadCart);
userRoute.get('/addtocart',userController.addToCart);
userRoute.get('/removefromcart',userController.removeFromCart)

module.exports = userRoute;