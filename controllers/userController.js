
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Category = require('../models/categoryModel')
const Wallet = require('../models/walletModel')
const Coupon = require('../models/couponModel')
const Transaction = require('../models/transactionModel')
const Referral = require('../models/referralModel')


const bcrypt = require('bcrypt')
const { validationResult  } = require('express-validator');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const ejs = require('ejs');
const fs = require('fs');
const pdf = require('html-pdf');
const PDFDocument = require('pdfkit');
const path = require('path');
const { log } = require('console')


var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEYID,
  key_secret: process.env.RAZORPAY_KEYSECRET,
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

const sendOtpMail = async(name,email,id,otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASS

      }
  });
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to:email,
    subject:'Verification Email',
    text:"Here is your otp."+otp
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
    const userData= req.session.data;
    const productData = await Product.find().limit(8);
    const categoryData= await Category.find();
    let wishlistCount;
    let cartCount;
    if(typeof userData != "undefined"){
      const user = await User.findOne({_id:userData._id})
      wishlistCount = user.wishlist.length;
      const cartData = await Cart.findOne({userId:userData._id})
      if(typeof cartData != "undefined" && cartData){
        cartCount = cartData.products.length;
      }else{
        cartCount = 0
      }
      
    }

    res.render('index.ejs',{user:userData,products:productData,category:categoryData,wishlistCount,cartCount})
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
          res.redirect('/')

        }else{
          res.render('login.ejs',{message:"Please verify your email otp."})
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
  if(req.body.referralCode){
    const isreferral = await User.find({referralCode:req.body.referralCode});
    console.log(isreferral)
    console.log(isreferral.length)
    if(isreferral.length<1){
      return res.render('signup',{message:'invalid referral code'})
    }
  }
 
  if(!errors.isEmpty()){
    return res.render('signup.ejs',{error:errors.mapped()})
  }
  try {
    const emailexists = await User.findOne({email:req.body.email});
    if(emailexists){
      return res.render('signup',{message:"Email already exists"})
    }
    const sPassword = await securePassword(req.body.password)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    const user = new User({
      name : req.body.username,
      mobile : req.body.mobile,
      email : req.body.email,
      password : sPassword,
      referredBy:req.body.referralCode,
      otp:otp
      
      
      
    });
  const userData = await user.save();
  // sendVerificationMail(req.body.username,req.body.email,userData._id)

  if(userData){
    sendOtpMail(userData.name,userData.email,userData.mobile,otp);
    res.render('otpValidation.ejs',{user:userData,signup:1})
  }else{
       res.render('signup',{message:"submission failed"})
  }
  } catch (error) {
    res.send(error.message)
  }
}

// signup otp verification ...........................................................

const signupVerifyOtp = async(req,res) => {
  try {
    const userId = req.query.id;
    const otpEntered = req.body.otp;
    const userData = await User.findOne({_id:userId});
    if(userData.otp == otpEntered){
       const updated = await User.updateOne({_id:userId},{$set: {otp:"",is_verified:1}})
       if(userData.referredBy){
       const referralData = await Referral.findOne({})
       const referralAmout = referralData.referralAmount;
       const referrerAmount = referralData.referrerAmount;
       let wallet = await Wallet.findOne({user:userId}).populate('transactions');
       if(!wallet){
         wallet = new Wallet ({
         user:userId,
         transactions:[]
       })
       wallet = await wallet.save()
     }

     const transaction=new Transaction({
      wallet:wallet._id,
      amount:referralAmout,
      type:'referral'
    
     })
     const transactiondata = await transaction.save()
  
    const walletupdated = await Wallet.findOneAndUpdate({user:userId},{$inc:{balance:referralAmout},$push: { transactions: transactiondata._id }},{new:true});


    const referrerData = await User.findOne({referralCode:userData.referredBy});
    const refferrerId = referrerData._id;
    const referrertransaction=new Transaction({
      wallet:wallet._id,
      amount:referrerAmount,
      type:'referral'
    
     })
     const referrertransactiondata = await referrertransaction.save()
     const referrerwalletupdated = await Wallet.findOneAndUpdate({user:refferrerId},{$inc:{balance:referrerAmount},$push: { transactions: referrertransactiondata._id }},{new:true});
    
         }

       res.redirect('/login')
    }else{
       res.render('otpValidation.ejs',{message:"invalid Otp"})
    }
  } catch (error) {
    console.log(error.message);
  }
}


// logging out....................................................

const logingOut = async(req,res) => {
  try {
    req.session.destroy()
    res.redirect('/')
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
      const id = userData._id;
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
    console.log('enteringverifyOtp')
     const id = req.query.id;
     console.log(id)
     const otpEntered = req.body.otp;
     console.log(otpEntered);
     const userData = await User.findOne({_id:id});
     console.log(userData)
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
      res.redirect('/login')
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
    res.redirect('/login');
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
    const sort = req.query.sort || 'default';
    
    var page = 1;
    if(req.query.page){
      page = req.query.page
    }

    const limit = 6;


    const filter = {
      is_listed:1
    };
    if(searchTerm){
      filter.productName = {$regex:searchTerm,$options:'i'}
    }
    if(category){
      filter.categoryId = category;
    }
    const sortOptions = {};

    if (sort === 'lowToHigh') {
      sortOptions.salePrice = 1;
    } else if (sort === 'highToLow') {
      sortOptions.salePrice = -1;
    }

    

    const productData = await Product.find(filter)
    .sort(sortOptions)
    .limit(limit*1)
    .skip((page-1) * limit)
    .exec();
    const count = await Product.find(filter)
    .countDocuments();
    const categoryData = await Category.find({})
    res.render('productgrid.ejs',{
      product:productData,
      user:userData,
      search:searchTerm,
      sort:sort,
      category:categoryData,
      categorySearch:filter.categoryId,
      totalCount:Math.ceil(count/limit),
      currentPage:page,
      productSearch:true
    })
  } catch (error) {
    console.error(error.message)
  }
 }

//  loading product detail page............................................................................

const loadProductDetail = async(req,res) => {
  try {
    const id =req.query.id;
    userData=req.session.data;
    const productData = await Product.findById({_id:id})
    res.render('productdetail.ejs',{product:productData,user:userData})
  } catch (error) {
      console.error(error.message)
  }
}


// loading user Profile....................................................................................................

const loadProfile = async(req,res) => {
  try {
    const userId = req.session.data._id

    res.render('userProfile.ejs',{user:userId})
  } catch (error) {
    console.error(error.message)
  }
}

// editing User Profile......................................................................................

const editProfile = async(req,res) => {
  try {
    const id = req.query.id;
    const userData = await User.findOne({_id:id})
    const existingemail = await User.findOne({email:req.body.email})
    if(existingemail){
      return res.render('useraccount',{message:"email already exists",user:userData})
    }

    
    const updated = await User.updateOne({_id:id},{
      name:req.body.name,
      mobile:req.body.mobile,
      email:req.body.email
    })
    res.redirect('/useraccount')
  }catch(error){
    console.error(error)
  }
}

// loading address adding page........................................................................................

const loadAddAddress = async(req,res) => {
  try {
      const userId = req.session.data._id;
      const checkout = req.query.checkout || '';
      const userData = await User.findOne({_id:userId})
      res.render("addaddress.ejs",{user:userData,checkout}) 
  } catch (error) {
      console.error(error)
  }
}

// adding address...........................................................................................................

const addAddress = async(req,res) => {
  try {
    const userId = req.session.data._id;
    const checkout = req.query.checkout;
    const address = new Address({
      addressname:req.body.addressname,
      name:req.body.name,
      streetaddress:req.body.streetaddress,
      city:req.body.city,
      state:req.body.state,
      country:req.body.country,
      pincode:req.body.pincode,
      phone:req.body.phone,
      alterphone:req.body.alterphone,
      is_Default:true
    })


    // adding address.....................................................................................


    const addressData = await address.save();
    if(addressData){
      const userData = await User.findOne({_id:userId})
      const userAddress = userData.address
      const remove = await Address.updateMany({_id:{$in:userAddress}},{$set:{is_Default:false}})
      const updated = await User.updateOne({_id:userId},{$addToSet:{address:addressData._id}})
      if(checkout){
        res.redirect('/checkout')
      }else{
        res.redirect('/useraddresses')
      }
        

      
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
    res.redirect('/useraddresses')
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
    res.redirect('/useraddresses')
  } catch (error) {
    console.error(error.message)
  }
}


// making default Address...................................................................................

const defaultAddress = async(req,res) => {
  try {
      const id = req.query.id ;
      const checkout = req.query.checkout;
      const userId = req.session.data._id;
      const userData = await User.findOne({_id:userId})
      const userAddress = userData.address
      const remove = await Address.updateMany({_id:{$in:userAddress}},{$set:{is_Default:false}})
      const updated = await Address.updateOne({_id:id},{$set :{is_Default:true}})
      if(checkout){
        res.redirect('/checkout')
      }else{
        res.redirect('/useraddresses')
      }

  } catch (error) {
      console.error(error.message)
  }
}




// loading checkout page...............................................................................


const loadCheckout = async(req,res) => {
  try {
      const userId = req.session.data._id;
      const user = await User.findOne({_id:userId});
      const cart = await Cart.findOne({userId:userId})
      const defaultAddress = await Address.find({_id:{$in:user.address},is_Default:true})
      if(cart.products.length >0){
        const cartData = await Cart.findOne({userId:userId}).populate('products.productId')
        res.render('checkout.ejs',{cart:cartData,user:userId,address:defaultAddress[0]})
      }else{
        res.redirect('/cart')
      }
      
  } catch (error) {
      console.error(error.message);
  }
}


// placing order...................................................................................................
const placeOrder = async(req,res) =>{
  try {
    const userId = req.session.data._id;
    const user = await User.findOne({_id:userId});
    const wallet = await Wallet.findOne({user:userId})
    const date = Date.now();
    const cart = await Cart.findOne({userId:userId})
    const orderedProducts = cart.products
    const orderedProductDetails = [];
    const paymentMethod = req.query.paymentmethod;
    let orderStatus = "pending";
    const addressArray = await Address.find({_id:{$in:user.address},is_Default:true});
    const address = addressArray[0]

    if(typeof addressArray != "undefined" && addressArray.length>0){

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
  
  
  
      
      
  
      const order = new Order({
        userId:userId,
        date:date,
        couponDiscount:cart.couponDiscount,
        couponId:cart.couponId,
        preDiscountAmount:cart.cartSubTotal,
        orderValue:cart.cartGrandtotal,
        paymentMethod:paymentMethod,
        orderStatus:orderStatus,
        deliveryStatus:orderStatus,
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
      }else if(paymentMethod === "Wallet"){
        if(wallet.balance >= orderData.orderValue){
           await Order.updateOne({_id:orderData._id},{$set:{deliveryStatus:"placed"}});
           const transaction=new Transaction({
            wallet:wallet._id,
            amount:orderData.orderValue,
            type:'debit'
          
           })
           const transactiondata = await transaction.save()

           await Wallet.updateOne(
            { user: userId },
            {
              $inc: { balance: -orderData.orderValue },
              $push: { transactions: transactiondata._id }
            }
          );
          
           res.json({
             walletSuccess:true,
             orderId:orderData._id
           })
        }else{
          res.json({
            insufficientBalance:true
          })
        }
      }else{
        var options = {
          amount: orderData.orderValue*100,  // amount in the smallest currency unit
          currency: "INR",
          receipt: orderData._id
        };
        const order = instance.orders.create(options, function(err, order) {
          return res.json({
            onlineSuccess:true,
            order:order
          })
        });

       
      }
    }else{
      res.json({
        noaddress:true
      })
    }

    
} catch (error) {
    console.error(error.message)
}
}

// load orderSummary ....................................................

const loadOrderSummary = async(req,res) => {
  try {
      const userId = req.session.data._id;
      const cart = await Cart.findOne({userId:userId})
      const couponlimit = await Coupon.updateOne({_id:cart.couponId},{$inc:{usageLimit:-1}})
      const updateuser = await User.updateOne({_id:userId},{$addToSet:{coupons:cart.couponId}})
      const deleted = await Cart.deleteOne({userId:userId})
      res.render('ordersummary',{orderId:req.query.orderId,user:userId})
  } catch (error) {
      console.error(error.message)
  }
}

// verifying payment................................................................

const verifyPayment = async(req,res) => {
  try {
    const crypto = require('crypto');
    let hmac = crypto.createHmac('sha256',process.env.RAZORPAY_KEYSECRET)

    hmac.update(req.body.payment.razorpay_order_id + '|' + req.body.payment.razorpay_payment_id);
    hmac =hmac.digest('hex')
    if(hmac == req.body.payment.razorpay_signature){
      let orderId = req.body.order.receipt;
      paymentStatusUpdate = await Order.updateOne({_id:orderId},{$set :{orderStatus:'placed',deliveryStatus:'placed'}})
      return res.json({
        success:true,
        orderId:orderId
      })
    }else{
      return res.json({
        success:false,
      })
    }
  } catch (error) {
    console.error(error.message)
  }
}

// loading order details................................................................


const orderDetails = async(req,res) => {
  try {
      const orderId = req.query.orderId;
      const userId = req.session.data._id;
      const orderData = await Order.findOne({_id:orderId})
      res.render('orderdetails',{orderData:orderData,user:userId})
  } catch (error) {
      console.error(error.message);
  }
}

// order reciept dowloading............................................................................

const orderDowloadPdf = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderData = await Order.findOne({ _id: orderId });

    const pdfDoc = new PDFDocument({
      size: 'A4',
      margin: 10
    });

    // Pipe the PDF to a file stream
    const fileStream = fs.createWriteStream('order.pdf');
    pdfDoc.pipe(fileStream);

    // Add content to the PDF manually
    pdfDoc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor('#007bff')
      .text('INVOICE', { align: 'center' })
      .moveDown(1);

    // Order Information Section
    pdfDoc
      .fontSize(18)
      .fillColor('#333') // Change to your preferred color
      .text('Order Information', { underline: true })
      .moveDown(0.5);

    pdfDoc
      .fontSize(14)
      .fillColor('#333') // Change to your preferred color
      .text(`Order ID: ${orderData._id}`)
      .text(`Order Date: ${orderData.date}`)
      .text(`Order Value: $${orderData.orderValue.toFixed(2)}`)
      .moveDown(1);

    // Ordered Products Section
    pdfDoc
      .fontSize(18)
      .fillColor('#333') // Change to your preferred color
      .text('Ordered Products', { underline: true })
      .moveDown(0.5);

    // Product Details
    pdfDoc.font('Helvetica').fillColor('#007bff');

    orderData.products.forEach((product, index) => {
      pdfDoc.fillColor('#333').text(`Product ID: ${product.productId}`);
      pdfDoc.fillColor('#333').text(`Product Name: ${product.productName}`);
      pdfDoc.fillColor('#333').text(`Quantity: ${product.quantity}`);
      pdfDoc.fillColor('#333').text(`Product Price: $${product.productPrice.toFixed(2)}`);
      pdfDoc.fillColor('#333').text(`Total: $${(product.quantity * product.productPrice).toFixed(2)}`).moveDown(0.5);
    });

    pdfDoc.moveDown(1);

    // Shipping Address Section
    pdfDoc
      .fontSize(18)
      .fillColor('#333') // Change to your preferred color
      .text('Shipping Address', { underline: true })
      .moveDown(0.5);

    // Shipping Address Details
    pdfDoc.font('Helvetica');
    pdfDoc.fillColor('#333').text(`Name: ${orderData.addressDetails.name}`);
    pdfDoc.fillColor('#333').text(`Postcode: ${orderData.addressDetails.postcode}`);
    pdfDoc.fillColor('#333').text(`Phone: ${orderData.addressDetails.phone}`);
    pdfDoc.fillColor('#333').text(`Street Address: ${orderData.addressDetails.streetaddress}`);
    pdfDoc.fillColor('#333').text(`City: ${orderData.addressDetails.city}`);
    pdfDoc.fillColor('#333').text(`State: ${orderData.addressDetails.state}`);
    pdfDoc.fillColor('#333').text(`Country: ${orderData.addressDetails.country}`).moveDown(1);

    // Finalize the PDF and close the stream
    pdfDoc.end();

    fileStream.on('finish', () => {
      const filePath = path.resolve(__dirname, '../order.pdf');
      fs.readFile(filePath, (err, file) => {
        if (err) {
          return res.status(500).send("Can't download pdf");
        } else {
          res.setHeader('Content-type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment;filename="order.pdf"');
          res.send(file);
        }
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
};







// requesting for cancel order..............................................................

const cancelOrder = async(req,res)=>{
  try {
    const orderId = req.query.orderId;
    const orderData = await Order.findOneAndUpdate({_id:orderId},{$set:{deliveryStatus:'cancelled'}});
    if(orderData.paymentMethod != 'Cash On Delivery'){
      const wallet = await Wallet.findOne({user:orderData.userId})
      const amount = orderData.orderValue;
      const transaction=new Transaction({
        wallet:wallet._id,
        amount:amount,
        type:'credit'
    
      })
      const transactiondata = await transaction.save()
  
      const walletupdated = await Wallet.findOneAndUpdate({user:orderData.userId},{$inc:{balance:amount},$push: { transactions: transactiondata._id }},{new:true});
    }
    

    return res.redirect('/myaccount')
  } catch (error) {
    console.error(error.message);
  }
}

// requesting for returning order............................................................

const returnOrder = async (req,res)=>{
  try {
    const orderId = req.query.orderId;
    const updated = await Order.updateOne({_id:orderId},{$set:{cancellationStatus:'return requested'}})
    return res.redirect('/myaccount') 
  } catch (error) {
    console.error(error.message)
  }
}


// loading user wallet.......................................................

const userWallet = async (req,res) => {
  try {
    const userId = req.session.data._id;

    let wallet = await Wallet.findOne({user:userId}).populate('transactions');
    if(!wallet){
      wallet = new Wallet ({
      user:userId,
      transactions:[]
    })
    wallet = await wallet.save()
  }

  res.render('userwallet',{wallet,user:userId})
  } catch (error) {
    console.error(error.message)
  }
  

}

// adding money to wallet.............................................................

const AddMoneyToWallet = async(req,res) =>{
  const userId = req.session.data._id;
  const wallet = await Wallet.findOne({user:userId})
  const amount = req.body.rechargeAmount;
  const transaction=new Transaction({
    wallet:wallet._id,
    amount:amount,
    type:'credit'
  
   })
   const transactiondata = await transaction.save()

  const updated = await Wallet.findOneAndUpdate({user:userId},{$inc:{balance:amount},$push: { transactions: transactiondata._id }},{new:true});
  res.json({
    updated
  })
}



// userprofile modified.............................................................


const loadUserAddress = async (req,res) => {
  const userId = req.session.data._id;
  const checkout = req.query.checkout || '';
  const userData = await User.findOne({_id:userId})
  const userAddress = userData.address;
  const addressData = await Address.find({_id:{$in:userAddress}})

  return res.render('address',{address:addressData,checkout,user:userId})
}

const loadUserAccount = async (req,res)=>{
  const userId = req.session.data._id;
  const userData = await User.findOne({_id:userId})
  return res.render('useraccount',{user:userData})
}

const loadUserOrders = async (req,res) =>{
  const userId = req.session.data._id;
  const orders = await Order.find({userId:userId}).sort({date: -1})
  return res.render('orders',{orders:orders,user:userId})
}

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
  loadProfile,
  editProfile,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
  defaultAddress,
  loadCheckout,
  placeOrder,
  orderDetails,
  loadOrderSummary,
  verifyPayment,
  orderDowloadPdf,
  cancelOrder,
  returnOrder,
  userWallet,
  AddMoneyToWallet,
  signupVerifyOtp,
  loadUserAddress,
  loadUserAccount,
  loadUserOrders

}