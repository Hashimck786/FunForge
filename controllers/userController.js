
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Category = require('../models/categoryModel')
const bcrypt = require('bcrypt')
const { validationResult  } = require('express-validator');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: 'rzp_test_dTVkgmpPZxBcHY',
  key_secret: 'RxW23Efaou9qiPCgUxEoNxR0',
});



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
          if(userData.is_block==0){
            req.session.data = userData;
            res.redirect('/gadgetly')
          }else{
            res.render('login.ejs',{message:"You are blocked by the admin"})
          }

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
    const emailexists = await User.findOne({email:req.body.email});
    if(emailexists){
      return res.render('signup',{message:"Email already exists"})
    }
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
    
    const searchTerm = req.query.search || '';
    const category = req.query.category || '';

    const filter = {
      is_listed:1
    };
    if(searchTerm){
      filter.productName = {$regex:searchTerm,$options:'i'}
    }
    if(category){
      filter.categoryId = category;
    }

    const productData = await Product.find(filter);
    const categoryData = await Category.find({})
    res.render('productgrid.ejs',{product:productData,user:userData,search:searchTerm,category:categoryData})
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
    const updated = await User.findOneAndUpdate({_id:userId},{$addToSet:{wishlist:productId}},{new:true})

    if(updated){
      res.json({
        success:true
      })
    }else{
      res.json({
        success:false
      })
    }
    
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
    res.json({
      success:true
    })
    // res.redirect('/gadgetly/wishlist')
  } catch (error) {
      console.error(error.message)
  }
}

// loading user Profile....................................................................................................

const loadProfile = async(req,res) => {
  try {
    const userId = req.session.data._id
    const userData = await User.findOne({_id:userId})
    const userAddress = userData.address;
    const addressData = await Address.find({_id:{$in:userAddress}})
    const orders = await Order.find({userId:userId})
    res.render('userProfile.ejs',{user:userData,address:addressData,orders:orders})
  } catch (error) {
    console.error(error.message)
  }
}

// editing User Profile......................................................................................

const editProfile = async(req,res) => {
  try {

    
    // existing mail checking now commended because it want the user and address with it when rendering ....ask someone??????



    // const existingemail = await User.findOne({email:req.body.email})
    // if(existingemail){
    //   return res.render('userProfile',{message:"email already exists"})
    // }

    const id = req.query.id;
    const updated = await User.updateOne({_id:id},{
      name:req.body.name,
      mobile:req.body.mobile,
      email:req.body.email
    })
    res.redirect('/gadgetly/myaccount')
  }catch(error){
    console.error(error)
  }
}

// loading address adding page........................................................................................

const loadAddAddress = async(req,res) => {
  try {
      const userId = req.session.data._id;
      const userData = await User.findOne({_id:userId})
      res.render("addaddress.ejs",{user:userData}) 
  } catch (error) {
      console.error(error)
  }
}

// adding address...........................................................................................................

const addAddress = async(req,res) => {
  try {
    const userId = req.session.data._id;
    const address = new Address({
      addressname:req.body.addressname,
      name:req.body.name,
      streetaddress:req.body.streetaddress,
      city:req.body.city,
      state:req.body.state,
      country:req.body.country,
      pincode:req.body.pincode,
      phone:req.body.phone,
      alterphone:req.body.alterphone
    })


    // adding address.....................................................................................


    const addressData = await address.save();
    if(addressData){
      const updated = await User.updateOne({_id:userId},{$addToSet:{address:addressData._id}})
      res.redirect('/gadgetly/myaccount')
    }else{
      res.render('addaddress.ejs',{message:"Error in address adding"})
    }
  } catch (error) {
    console.error(error.message)
  }
}


// loading Edit Address page...............................................................................

const loadEditAddress = async(req,res) => {
  try {
    const id = req.query.id;
    const userId = req.session.data._id;
    const userData = await User.findOne({_id:userId})
    const addressData = await Address.findOne({_id:id})
    res.render('editAddress.ejs',{address:addressData,user:userData})
  } catch (error) {
      console.error(error.message)
  }
}


// Editting Address...........................................................................

const editAddress = async(req,res) => {
  try {
    const id = req.query.id;
    const updatad = await Address.updateOne({_id:id},{
      addressname:req.body.addressname,
      name:req.body.name,
      streetaddress:req.body.streetaddress,
      city:req.body.city,
      state:req.body.state,
      country:req.body.country,
      pincode:req.body.pincode,
      phone:req.body.phone,
      alterphone:req.body.alterphone
    })
    res.redirect('/gadgetly/myaccount')
  } catch (error) {
    console.error(error.message)
  }
}


// deleting Address..................................................................................

const deleteAddress = async(req,res) =>{
  try {
    const userId = req.session.data._id;
    const id = req.query.id ;
    const updated = await User.updateOne({_id:userId},{$pull:{address:id}})
    const deleted = await Address.deleteOne({_id:id})
    res.redirect('/gadgetly/myaccount')
  } catch (error) {
    console.error(error.message)
  }
}


// making default Address...................................................................................

const defaultAddress = async(req,res) => {
  try {
      const id = req.query.id ;
      const userId = req.session.data._id;
      const userData = await User.findOne({_id:userId})
      const userAddress = userData.address
      const remove = await Address.updateMany({_id:{$in:userAddress}},{$set:{is_Default:false}})
      const updated = await Address.updateOne({_id:id},{$set :{is_Default:true}})
      res.redirect('/gadgetly/myaccount')
  } catch (error) {
      console.error(error.message)
  }
}


// showing cart.......................................................................................................

const loadCart = async(req,res) => {
  try {
      const userId = req.session.data._id;
      const cart =await  Cart.findOne({userId:userId}).populate('products.productId')

      
      cart.cartSubTotal = cart.products.reduce((cartSubTotal,product)=> cartSubTotal += product.total,0);
      await cart.save()
      
      
      res.render('cart.ejs',{cart:cart})
  } catch (error) {
      console.error(error.message)
  }
}

// Adding product To Cart..........................................................................................

const addToCart = async(req,res) =>{
  try {
      const userId = req.session.data._id;
      const productId = req.query.id;
      const productData = await Product.findOne({_id:productId});
      let cart = await Cart.findOne({userId:userId});

      if(!cart){
        cart = new Cart({
          userId:userId,
          product:[]
        })
        await cart.save();

      }


      if(productData.Stock>0){
        // find Index iterates through all the product and returns the index of the product that equals to the productId we are given
        const existingProductIndex = cart.products.findIndex(product => product.productId.toString() === productId)
          

        if(existingProductIndex == -1) {
          
            cart.products.push({productId:productId,quantity:1})
            await Product.updateOne({_id:productId},{$set:{Stock:productData.Stock -1 }})
  
            
        }else{
          cart.products[existingProductIndex].quantity += 1
          await Product.updateOne({_id:productId},{$set:{Stock:productData.Stock -1 }})
        } 
  
        
  
        const productIndex = cart.products.findIndex(product => product.productId.toString() === productId)
        cart.products[productIndex].total = productData.salePrice * cart.products[productIndex].quantity;
  
  
        const cartData =  await cart.save()
  
        if(cartData){
          // res.redirect('/gadgetly/shop')
          res.json({
            success:true
          })
        }else{
          // res.redirect('/gadgetly/shop')
          res.json({
            success:false
          })
        }
      }else{
        console.log("out of stock backend json sending")
        res.json({
          outofstock:true
        })
      }

      
  } catch (error) {
      console.error(error.message)
  }
}

// removing product from Cart....................................................................................


const removeFromCart = async(req,res) => {
  try {
      console.log("arrived at removal")
      const userId = req.session.data._id;
      const productId = req.query.id;
      let productData = await Product.findOne({_id:productId})
      let cart = await Cart.findOne({userId:userId});

      const productIndex = cart.products.findIndex(product => product.productId.toString() === productId)
        cart.cartSubTotal = cart.cartSubTotal - cart.products[productIndex].total;
        await cart.save()


      const oldQuantity = cart.products[productIndex].quantity;
      const removed =await Cart.findOneAndUpdate({userId:userId},{$pull:{products:{productId:productId}}},{new:true});

      if(removed){
        // performed quantity updation.................................
        const updatedQuantity = productData.Stock + oldQuantity ;
        const stockIncrease = await Product.updateOne({_id:productId},{$set : {Stock:updatedQuantity}})
        res.json({
          success:true
        })
      }else{
        res.json({
          success:false
        })
      }


  } catch (error) {
      console.error(error.message)
  }
}

// updating product Quantity in Cart page................................................................

const updateQuantity = async(req,res)=>{
  const productId = req.query.productId;
  const newQuantity = req.query.quantity;
  const userId = req.session.data._id;
  const cart = await Cart.findOne({userId:userId});
  const productData = await Product.findOne({_id:productId})
  const productIndex = cart.products.findIndex(product=>product.productId.toString()===productId)





  const quantityDifference = newQuantity - cart.products[productIndex].quantity;

  if(quantityDifference > productData.Stock){
    return res.json({
      outofstock:true
    })
  }
  const newStock = productData.Stock - quantityDifference;
  const updateStock = await Product.updateOne({_id:productId},{$set : {Stock: newStock}})
  
  cart.products[productIndex].quantity = newQuantity
  cart.products[productIndex].total = productData.salePrice * cart.products[productIndex].quantity;
  cart.cartSubTotal = cart.products.reduce((cartSubTotal,product)=> cartSubTotal += product.total,0);
  await cart.save();

  res.json({
    success:true,
    total:cart.products[productIndex].total,
    subtotal:cart.cartSubTotal,
    grandtotal:cart.cartSubTotal
  })
  





}


// loading checkout page...............................................................................


const loadCheckout = async(req,res) => {
  try {
      const userId = req.session.data._id;
      const user = await User.findOne({_id:userId});
      const cart = await Cart.findOne({userId:userId}).populate('products.productId')
      const defaultAddress = await Address.find({_id:{$in:user.address},is_Default:true})
      res.render('checkout.ejs',{cart:cart,address:defaultAddress[0]})
  } catch (error) {
      console.error(error.message);
  }
}


// placing order...................................................................................................
const placeOrder = async(req,res) =>{
  try {
    const userId = req.session.data._id;
    const user = await User.findOne({_id:userId});
    const date = Date.now();
    const cart = await Cart.findOne({userId:userId})
    const orderedProducts = cart.products
    const orderedProductDetails = [];
    const paymentMethod = req.query.paymentmethod;
    let orderStatus = "pending";

    if(paymentMethod === 'Cash On Delivery'){
      orderStatus = "placed"
    }
      for( const product of orderedProducts){
        const productDetails = await Product.findById(product.productId);
  
        if(productDetails){
          const orderedProductDetail = {
            productId:productDetails._id,
            productName:productDetails.productName,
            productPrice:productDetails.salePrice,
            productDescription:productDetails.productDescription,
            productImage:productDetails.image[0],
            quantity:product.quantity,
            total:product.total
          }
  
          orderedProductDetails.push(orderedProductDetail);
        }
      }
  
  
  
      const addressArray = await Address.find({_id:{$in:user.address},is_Default:true});
      const address = addressArray[0]
      
      
  
      const order = new Order({
        userId:userId,
        date:date,
        orderValue:cart.cartSubTotal,
        paymentMethod:paymentMethod,
        orderStatus:orderStatus,
        products:orderedProductDetails,
        addressDetails:{
          name:address.name,
          postcode:address.pincode,
          country:address.country,
          state:address.state,
          city:address.city,
          streetaddress:address.streetaddress,
          phone:address.phone
        }
      })
  
      const orderData = await order.save();
  
      // const deleted = await Cart.deleteOne({userId:userId})
  
      // passing the orderid to ordersummary page

      if(paymentMethod === "Cash On Delivery"){
        return res.json({
          codSuccess:true,
          orderId:orderData._id
        })
      }else{
        var options = {
          amount: orderData.orderValue*100,  // amount in the smallest currency unit
          currency: "INR",
          receipt: orderData._id
        };
        const order = instance.orders.create(options, function(err, order) {
          console.log("new order;",order);
          return res.json({
            onlineSuccess:true,
            order:order
          })
        });

       
      }


    
} catch (error) {
    console.error(error.message)
}
}

// load orderSummary ....................................................

const loadOrderSummary = async(req,res) => {
  try {
      res.render('ordersummary',{orderId:req.query.orderId})
  } catch (error) {
      console.error(error.message)
  }
}

// verifying payment................................................................

const verifyPayment = async(req,res) => {
  try {
    const crypto = require('crypto');
    let hmac = crypto.createHmac('sha256','RxW23Efaou9qiPCgUxEoNxR0')

    hmac.update(req.body.payment.razorpay_order_id + '|' + req.body.payment.razorpay_payment_id);
    hmac =hmac.digest('hex')
    if(hmac == req.body.payment.razorpay_signature){
      paymentStatusUpdate = await Order.updateOne({_id:req.body.order.receipt},{$set :{orderStatus:'placed',deliveryStatus:'placed'}})
      return res.json({
        success:true
      })
    }
    console.log(req.body.payment.razorpay_payment_id)
  } catch (error) {
    console.error(error.message)
  }
}

// loading order details................................................................


const orderDetails = async(req,res) => {
  try {
      const orderId = req.query.orderId;
      const orderData = await Order.findOne({_id:orderId})
      res.render('orderdetails',{orderData:orderData})
  } catch (error) {
      console.error(error.message);
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
  removeFromWishlist,
  loadProfile,
  editProfile,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
  defaultAddress,
  loadCart,
  addToCart,
  removeFromCart,
  loadCheckout,
  placeOrder,
  orderDetails,
  updateQuantity,
  loadOrderSummary,
  verifyPayment
}