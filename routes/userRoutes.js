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
const userAuth = require('../middlewares/userAuth.js')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const wishlistController = require('../controllers/wishlistController')


userRoute.get("/",userController.loadHome);
userRoute.get('/signup',userController.loadSignup);
userRoute.post('/signup',[ 
  body('username').trim().isLength({min:3,max:10}).withMessage('Enter minimum 3 characters'),
  body('email').isEmail().withMessage('invalid email'),
  body('mobile').isNumeric().isLength({min:10,max:10}).withMessage('invalid mobilenumber'),
  body('password').isLength({min:8}).withMessage('enter minimum 8 characters')
],userController.signupSubmission)
userRoute.get('/login',userAuth.isLogout,userController.loadLoginPage)
userRoute.post('/login',userController.loginSubmission);
userRoute.get('/logout',userController.logingOut)
userRoute.get('/forget',userAuth.isLogout,userController.loadForget);
userRoute.post('/forget',userController.sendOtp);
userRoute.post('/otpvalidation',userController.verifyOtp),
userRoute.post('/updatePassword',userController.updatePassword)
userRoute.get('/contact',userController.loadContact);
userRoute.get('/verify',userController.verifyMail);

userRoute.get('/shop',userController.loadProducts);
userRoute.get('/productdetail',userController.loadProductDetail)


userRoute.get('/wishlist',userAuth.isLogin,wishlistController.loadWishlist)
userRoute.get('/addwishlist',userAuth.isLogin,wishlistController.addToWishlist)
userRoute.get('/removewishlist',userAuth.isLogin,wishlistController.removeFromWishlist)

userRoute.get('/myaccount',userAuth.isLogin,userController.loadProfile)
userRoute.post('/editProfile',userAuth.isLogin,userController.editProfile)
userRoute.get('/addAddress',userAuth.isLogin,userController.loadAddAddress)
userRoute.post('/addAddress',userController.addAddress);
userRoute.get('/editaddress',userAuth.isLogin,userController.loadEditAddress);
userRoute.post('/editaddress',userController.editAddress)
userRoute.get('/deleteaddress',userAuth.isLogin,userController.deleteAddress)
userRoute.get('/defaultaddress',userAuth.isLogin,userController.defaultAddress)

userRoute.get('/cart',userAuth.isLogin,cartController.loadCart);
userRoute.get('/addtocart',userAuth.isLogin,cartController.addToCart);
userRoute.get('/removefromcart',userAuth.isLogin,cartController.removeFromCart);
userRoute.post('/updatequantity',userAuth.isLogin,cartController.updateQuantity)

userRoute.get('/checkout',userAuth.isLogin,userController.loadCheckout)
userRoute.post('/placeorder',userAuth.isLogin,userController.placeOrder)
userRoute.post('/verifypayment',userAuth.isLogin,userController.verifyPayment)
userRoute.get('/ordersummary',userAuth.isLogin,userController.loadOrderSummary)
userRoute.get('/orderdetails',userAuth.isLogin,userController.orderDetails)
userRoute.get('/orderDowloadPdf',userAuth.isLogin,userController.orderDowloadPdf)
userRoute.post('/cancelorder',userAuth.isLogin,userController.cancelOrder)




module.exports = userRoute;