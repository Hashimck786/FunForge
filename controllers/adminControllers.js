const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const Admin = require('../models/adminModel')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Category = require('../models/categoryModel')


// password hashing(securing)......................................
const securePassword = async(password) => {
  try {
    const passwordHash = await bcrypt.hash(password,10);
    return passwordHash
  } catch (error) {
    console.log(error.message)
  }
 
}


// AdminLoginPage loading.................................


const loadAdminLogin = async(req,res) => {
  try {
    res.render("page-account-login.ejs");
  } catch (error) {
      console.log(error.message);
  }
}


//  AdminDashboard Loading..............................


const loadAdminHome = async(req,res)=>{
  try{
    res.render('index.ejs')
  }catch(error){
    res.send(error.message)
  }
}

//  Admin login verification.......................................

const loginSubmission = async(req,res)=>{
  try {
      email = req.body.email;
      password = req.body.password;
      const adminData =await Admin.findOne({email:email});
      if(adminData){
        passwordVerified = await bcrypt.compare(password,adminData.password);
        if(passwordVerified){
          req.session.admin_id = adminData._id;
          res.redirect('/gadgetly/admin/home')
        }else{
          res.render('page-account-login.ejs',{message:"email and password is incorrect"})
        }
      }else{
        res.render('page-account-login.ejs',{message:"email and password is incorrect"})
      }

  } catch (error) {
      console.log(error.message);
  }
}


// sending reset password mail.......................................

const sendVerificationMail = async(name,email,id,otp) => {
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
    text:"your otp is "+ otp
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

// loading forget Password Page....................................................

const loadForget = async(req,res) => {
  try {
    res.render('forgetPassword')
  } catch (error) {
    console.error(error.message)
  }
}

// sending resetMail...........................................
const sendResetMail =async(req,res) =>{
  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const email = req.body.email;
    const adminData = await Admin.findOneAndUpdate({email:email},{$set : {otp:otp}});
    if(adminData){
      const name = adminData.name
      const email = adminData.email
      const id = adminData._id
      sendVerificationMail(name,email,id,otp);
      res.render('otpValidation.ejs',{admin:adminData})
    
      
    }else{
      res.render('forgetPassword',{message:"email is invalid"})
    }

  } catch (error) {
    console.error(error.message)
  }
}

// verifying otp.......................................................

const verifyOtp = async(req,res) =>{
  try {
    const otpEntered = req.body.otp;
    const id = req.query.id;
    const adminData = await Admin.findOne({_id:id})
    if(adminData.otp == otpEntered){
      const updated = await Admin.updateOne({_id:id},{$set : {otp:""}})
      res.render('passwordUpdate.ejs',{admin:adminData})
    }else{
      res.render('otpValidation.ejs',{message:"invalid otp"})
    }
  } catch (error) {
    console.error(error.message)
  }
 
}

// password Update.....................................................

const passwordUpdate = async(req,res) => {
  try {
    const id = req.query.id;
    const password = req.body.password;
    const spassword = await securePassword(password)
    const adminData =await Admin.findOne({_id:id});
    if(adminData){
      const updated = await Admin.updateOne({_id:id},{$set: {password:spassword}});
      res.redirect('/gadgetly/admin/login')
    }else{
      res.render("passwordUpdate",{message:"error changing password"})
    }
  } catch (error) {
      console.error(error.message)
  }
}

// Userlist loading.............................................



const loadUserList = async(req,res) => {
  try {
    const usersData = await User.find();
    res.render('usersList',{users:usersData})
  } catch (error) {
    console.log(error.message);
  }
}

// Admin logout...........................................

const adminLogout = async(req,res) => {
  try {
    req.session.destroy();
    res.redirect('/gadgetly/admin/login') 
  } catch (error) {
    console.log(error.message)
  }
}   

// Blocking user.....................................................

const blockUser = async(req,res) => {
  try {
    const id= req.query.id;
    await User.updateOne({_id:id},{$set :{ is_block:1}})
    res.redirect('/gadgetly/admin/userlist')
  } catch (error) {
    console.log(error.message)
  }
}
// Unblocking user.....................................................

const unblockUser = async(req,res) => {
  try {
    const id= req.query.id;
    await User.updateOne({_id:id},{$set :{ is_block:0}})
    res.redirect('/gadgetly/admin/userlist')
  } catch (error) {
    console.log(error.message)
  }
}

// loading product List.....................................................

const loadProductList = async(req,res) => {
  try {
    const products = await Product.find();
    res.render('productList.ejs',{product:products})
  } catch (error) {
    console.log(error.message)
  }
}


// view product adding page....................................................

const loadAddProduct = async(req,res) => {
  try {
    const categoryData= await Category.find({})
    res.render('addProduct.ejs',{category:categoryData})
  } catch (error) {
    console.log(error.message)
  }
}

// Adding Product...................................................................


const addProduct = async(req,res) => {
  try {
    const existingProduct = await Product.findOne({productName:req.body.product_name});
    if(existingProduct){
      return res.render('addProduct',{message:"product name exists pls try another name"})
    }
    const images = req.files.map(file=>file.filename);

    if(images.length<1 || images.length>5){
      return res.render('addProduct',{message:"please upload inbetween one to five files"})
    }

    const product =new Product ({
      productName : req.body.product_name,
      productDescription:req.body.product_description,
      productPrice:req.body.product_price,
      categoryId:req.body.product_categoryId,
      salePrice:req.body.product_sprice,
      Stock:req.body.product_stock,
      image:images
    });
    const productData = await product.save();
    if(productData){
      res.redirect('/gadgetly/admin/productList')
    }else{
      res.render('addProduct',{message:"can't add product now"})
    }
  } catch (error) {
    console.log(error.message);
  }
}

//  list Product ........................................................

const listProduct = async(req,res) => {
  try {
    const product_id = req.query.id;
    const updated = await Product.updateOne({_id:product_id},{$set : {is_listed:1}});
    res.redirect('/gadgetly/admin/productList')

  } catch (error) {
    console.log(error.message)
  }
}

//  Unlist Product ........................................................

const unlistProduct = async(req,res) => {
  try {
    const product_id = req.query.id;
    const updated = await Product.updateOne({_id:product_id},{$set : {is_listed:0}})
    res.redirect('/gadgetly/admin/productList')
  } catch (error) {
    console.log(error.message)
  }
}

// Loading Edit Page....................................................................

const loadEditPage = async(req,res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.find()
    const productData = await Product.findById({_id:id})
    res.render('editProduct.ejs' ,{product : productData , category:categoryData})
  } catch (error) {
    console.log(error.message)
  }
}

//editing Product........................................................................

const editProduct = async(req,res) => {
  try {
    
    const images = req.files.map(file=>file.filename);
    const id = req.query.id;
    if(images.length<1 || images.length>5){
      const updated = await Product.updateOne({_id:id},{$set : {
        productName : req.body.product_name,
        productDescription:req.body.product_description,
        productPrice:req.body.product_price,
        categoryId:req.body.product_categoryId,
        salePrice:req.body.product_sprice,
        Stock:req.body.product_stock,
        
      }})
      return res.redirect('/gadgetly/admin/productList')
    }

    
    const updated = await Product.updateOne({_id:id},{$set : {
      productName : req.body.product_name,
      productDescription:req.body.product_description,
      productPrice:req.body.product_price,
      category:req.body.product_category,
      salePrice:req.body.product_sprice,
      Stock:req.body.product_stock,
      image:images
    }})

    res.redirect('/gadgetly/admin/productList')
    
  } catch (error) {
    console.log(error.message)
  }
}


//loading Categories.........................................................................

const loadCategories = async(req,res) => {
  try {
    const categoriesData = await Category.find({});
    res.render('categories.ejs',{category:categoriesData})
  } catch (error) {
    console.log(error.message)
  }
}


// creating Categories....................................................................

const createCategory = async(req,res) => {
  try {

    const name = req.body.category_name;
    const slug = req.body.category_slug;
    const parent = req.body.category_parent;
    const description = req.body.category_description;
    
    const categoriesData = await Category.find({})
    
    const existingCategory = await Category.findOne({categoryName:name});
    if(existingCategory){
      return res.render("categories",{message:"name exists pls try another name" ,category:categoriesData})
    }



    const category = new Category({
      categoryName:name,
      categorySlug:slug,
      categoryParent:parent,
      categoryDescription:description
    });

    const categoryData = await category.save();
    res.redirect('/gadgetly/admin/categories')

  } catch (error) {
    console.log(error.message)
  }
}

// category listing..............................................................

const categoryList = async(req,res) => {
  const id = req.query.id;
  const updated = await Category.updateOne({_id:id},{$set : {is_listed:1}});
  const updateproduct = await Product.updateMany({categoryId:id},{$set : {is_listed:1}})
  res.redirect('/gadgetly/admin/categories')
}

// category unlisting ................................................................

const categoryUnlist = async(req,res) => {
  const id = req.query.id;
  const updated = await Category.updateOne({_id:id},{$set : {is_listed:0}});
  const updateproduct = await Product.updateMany({categoryId:id},{$set : {is_listed:0}})
  res.redirect('/gadgetly/admin/categories')
}


// category Editing..........................................................................

const  categoryEdit = async(req,res) => {
  try {
    const id = req.query.id;
    const name = req.body.category_name;
    const slug = req.body.category_slug;
    const parent = req.body.category_parent;
    const description = req.body.category_description;
    const updated = await Category.updateOne({_id:id},{ $set : {
      categoryName:name,
      categorySlug:slug,
      categoryParent:parent,
      categoryDescription:description
    }})
    res.redirect('/gadgetly/admin/categories')
  } catch (error) {
    console.log(error);
  }
  
  
}


// loading Category editing page......................................................

const loadCategoryEdit = async(req,res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findOne({_id:id})
    res.render('editCategory.ejs',{category:categoryData})
  } catch (error) {
    console.error(error)
  }
}

// loading userOrders......................................................................

const userOrders = async(req,res) => {
  try {
    const ordersData = await Order.find({}).populate('userId');
    res.render('userorders',{orders:ordersData})
  } catch (error) {
    console.error(error)
  }
}

// deliver Order................................................................

const deliverOrder = async(req,res) => {
  try {
    const orderId = req.query.orderId;
    const updated = await Order.updateOne({_id:orderId},{$set : {orderStatus:"delivered",deliveryStatus:"delivered"}})
    res.redirect('/gadgetly/admin/userorders')
  } catch (error) {
    console.error(error.message);
  }
}

 module.exports = {
  loadAdminHome,
  loadAdminLogin,
  loginSubmission,
  loadForget,
  sendResetMail,
  verifyOtp,
  passwordUpdate,
  loadUserList,
  adminLogout,
  blockUser,
  unblockUser,
  loadProductList,
  loadAddProduct,
  addProduct,
  listProduct,
  unlistProduct,
  editProduct,
  loadEditPage,
  loadCategories,
  createCategory,
  categoryUnlist,
  categoryList,
  loadCategoryEdit,
  categoryEdit,
  userOrders,
  deliverOrder

 };

