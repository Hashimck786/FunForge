const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const Admin = require('../models/adminModel')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Category = require('../models/categoryModel');
const Wallet = require('../models/walletModel')
const ejs = require('ejs');
const fs = require('fs');
const pdf = require('html-pdf');
const path = require('path');
const ExcelJS = require('exceljs');



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
    const orderData = await Order.find({orderStatus:"delivered"});
    const revenue = orderData.reduce((sum, order) => sum + order.orderValue, 0);
    const orderCount = await Order.countDocuments();
    const productCount = await Product.countDocuments();
    res.render('index.ejs', { revenue, orderCount, productCount,});
  }catch(error){
    console.error(error.message)
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

    var search = '';
    if(req.query.search){
      search = req.query.search
    }

    var page = 1;
    if(req.query.page){
      page = req.query.page
    }

    const limit = 8;

    const usersData = await User.find({
      $or:[
        {name:{$regex:'.*' +search+'.*' , $options:'i'}},
        {email:{$regex:'.*' +search+'.*', $options:'i'}},
      ]
    })
    .limit(limit*1)
    .skip((page-1)*limit)
    .exec();
    
    const count = await User.find({
      $or:[
        {name:{$regex:'.*' +search+'.*' , $options:'i'}},
        {email:{$regex:'.*' +search+'.*', $options:'i'}}
      ]
    }).countDocuments();
    res.render('usersList',{
      users:usersData,
      totalPages:Math.ceil(count/limit),
      searchTerm:search,
      Search:true
    })
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
    // res.json({
    //   success:true
    // })
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
    // res.json({
    //   success:true
    // })
    res.redirect('/gadgetly/admin/userlist')
  } catch (error) {
    console.log(error.message)
  }
}

// loading product List.....................................................

const loadProductList = async(req,res) => {
  try {

    var search = '';
    if(req.query.search){
      search = req.query.search
    }

    var page = 1;
    if(req.query.page){
      page = req.query.page
    }

    const limit = 5;

    const productsData = await Product.find({
      productName:{$regex:'.*' +search+'.*' , $options:'i'}
    })
    .limit(limit*1)
    .skip((page-1)*limit)
    .exec();
    const count = await Product.find({
      productName:{$regex:'.*' +search+'.*' , $options:'i'}
    }).countDocuments();
    res.render('productList.ejs',{
      product:productsData,
      totalPages:Math.ceil(count/limit),
      searchTerm:search,
      Search:true
      
    })
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
    // res.json({
    //   success:true
    // })
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
    // res.json({
    //   success:true
    // })
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
  // res.json({
  //   success:true
  // })
}

// category unlisting ................................................................

const categoryUnlist = async(req,res) => {
  const id = req.query.id;
  const updated = await Category.updateOne({_id:id},{$set : {is_listed:0}});
  const updateproduct = await Product.updateMany({categoryId:id},{$set : {is_listed:0}})
  res.redirect('/gadgetly/admin/categories')
  // res.json({
  //   success:true
  // })
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
    
    var page = 1;
    if(req.query.page){
      page = req.query.page
    }

    const limit = 15;


    const ordersData = await Order.find({})
    .limit(limit*1)
    .skip((page-1)*limit)
    .populate('userId')
    .exec();
    const count = await Order.find({}).countDocuments();
    res.render('userorders',{
      orders:ordersData,
      totalPages:Math.ceil(count/limit)
    })
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


// view order details.....................................................................
const viewOrderDetails = async(req,res) =>{
  try {
      const orderId = req.query.orderId;
      const orderData = await Order.findOne({_id:orderId});
      res.render('vieworderdetails',{orderData})
  } catch (error) {
      console.error(error.message);
  }
}

// loading salesReport.................................................................

const salesReport = async(req,res) => {
  try {
    var page = 1;
    if(req.query.page){
      page = req.query.page
    }

    const limit = 7;

    const salesData = await Order.find({deliveryStatus:"delivered"})
    .limit(limit*1)
    .skip((page-1)*limit)
    .populate('userId')
    .exec();
    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()
    res.render('salesReport',{salesData , message:"TotalSales",type:"total",totalPages:Math.ceil(count/limit)})
  } catch (error) {
    console.error(error.message);
  }
}

// daily sales................................................................................

const dailySales = async (req, res) => {

  var page = 1;
  if(req.query.page){
    page = req.query.page
  }

  const limit = 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Create a new date object for tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    
    const salesData = await Order.find({
      orderStatus:'delivered',
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    })
    .limit(limit*1)
    .skip((page-1)*limit)
    .populate('userId')
    .exec();

    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()
    res.render('salesReport', { salesData, message:"DailySales",type:"daily" ,totalPages:Math.ceil(count/limit)});
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};

// monthly sales .............................................................

const monthlySales = async (req, res) => {

  var page = 1;
  if(req.query.page){
    page = req.query.page
  }

  const limit = 7;

  const today = new Date();

  // Set the day of the month to the first day
  today.setDate(1);

  try {
    const salesData = await Order.find({
      orderStatus:'delivered',
      date: {
        $gte: today,
        $lt: new Date(), // Represents the current date
      },
    })
    .limit(limit*1)
    .skip((page-1)*limit)
    .populate('userId')
    .exec();

    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()

    res.render('salesReport', { salesData ,message:"MonthlySales",type:"month",totalPages:Math.ceil(count/limit)});
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};

// weekly sales report ..............................................................

async function weeklySales(req, res) {

  var page = 1;
  if(req.query.page){
    page = req.query.page
  }

  const limit = 7;

  const today = new Date();

  // Set the day of the week to Sunday (0 represents Sunday, 1 represents Monday, and so on)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  try {
    const salesData = await Order.find({
      orderStatus: 'delivered',
      date: {
        $gte: startOfWeek,
        $lt: today,
      },
    })
    .limit(limit*1)
    .skip((page-1)*limit)
    .populate('userId')
    .exec();

    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()

    res.render('salesReport', { salesData,message:"WeeklySales",type:"week",totalPages:Math.ceil(count/limit)});
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
}

//  yearly sales report...........................................................

const yearlySales = async (req, res) => {
  var page = 1;
  if(req.query.page){
    page = req.query.page
  }

  const limit = 7;

  const today = new Date();

  // Set the month and day to January 1st
  const startOfYear = new Date(today);
  startOfYear.setMonth(0,1)

  try {
    const salesData = await Order.find({
      orderStatus:'delivered',
      date: {
        $gte:startOfYear ,
        $lt: today, // Represents the current date
      },
    })
    .limit(limit*1)
    .skip((page-1)*limit)
    .populate('userId')
    .exec();

    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()

    res.render('salesReport', { salesData,message:"YearlySales",type:"year" ,totalPages:Math.ceil(count/limit)});
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};

// custom sales............................................................

const customSales = async(req,res)=>{
    var page = 1;
    if(req.query.page){
      page = req.query.page
    }

    const limit = 7;

    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    try {
      const salesData = await Order.find({
        orderStatus:'delivered',
        date: {
          $gte:startDate ,
          $lt: endDate, // Represents the current date
        },
      })
      .limit(limit*1)
      .skip((page-1)*limit)
      .populate('userId')
      .exec();
  
      const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()
  
      res.render('salesReport', { salesData,message:"CustomSales",type:"custom" ,totalPages:Math.ceil(count/limit)});
    } catch (error) {
      console.error('Error fetching sales data:', error);
      res.status(500).send('Internal Server Error');
    }
}
// dowloading Report ............................................................

const downloadReport = async(req,res) => {
  try {
    const type = req.query.type;
    let salesData ;
    switch (type) {
        case "week":
          salesData = await weeklySalesData();
            break;
    
        case "year":
          salesData = await yearlySalesData();
            break;
    
        case "daily":
          salesData = await dailySalesData();
            break;
    
        case "month":
          salesData = await monthlySalesData();
            break;
        case "total":
          salesData = await totalSalesData();
            break;
    
        // default:
        //   salesData = weeklySalesData();
        //     break;
    }
    
     const data = {
      salesData : salesData
     }
     const filePathName = path.resolve(__dirname,'../views/admin/downloadReport.ejs');
     const htmlString = fs.readFileSync(filePathName).toString();
     const ejsData = ejs.render(htmlString,data);

     let options = {
      format : 'A4',
      orientation:'portrait',
      border:'10mm'
     }

     pdf.create(ejsData,options).toFile('report.pdf',(err,response)=>{
      if(err){
        console.error(err.message)
      }
      else{
        const filePath = path.resolve(__dirname,'../report.pdf');
        fs.readFile(filePath,(err,file)=>{
          if(err){
            return res.status(500).send("can't dowload pdf")
          }else{
            res.setHeader('Content-type','application/pdf');
            res.setHeader('Content-Disposition','attachment;filename="report.pdf"');

            res.send(file);

          }
        })
      }
     })
  } catch (error) {
     console.error(error.message)
  }
}
// dowload ExcelReport.........................................................

const dowloadExcel = async(req,res) =>{
  try{
    const type = req.query.type;
    let salesData ;
    switch (type) {
        case "week":
          salesData = await weeklySalesData();
            break;
    
        case "year":
          salesData = await yearlySalesData();
            break;
    
        case "daily":
          salesData = await dailySalesData();
            break;
    
        case "month":
          salesData = await monthlySalesData();
            break;
        case "total":
          salesData = await totalSalesData();
            break;
    
        // default:
        //   salesData = weeklySalesData();
        //     break;
    }

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add headers to the worksheet
    worksheet.addRow(['Order ID', 'Billing Name', 'Date', 'Total', 'Payment Status', 'Payment Method']);

    // Add data to the worksheet
    salesData.forEach((order) => {
      worksheet.addRow([
        order._id,
        order.userId,
        order.date.toLocaleString(),
        order.orderValue,
        order.deliveryStatus,
        order.paymentMethod,
      ]);
    });

        // Generate a unique filename for the Excel file
        const filename = `sales_report_${new Date().toISOString()}.xlsx`;

        // Set the response headers to trigger a download in the browser
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Write the Excel file to the response stream
        await workbook.xlsx.write(res);

        // End the response
        res.end();


  }catch(error){
    console.error(error.message);
  }
}
// weeklySalesDatafunction >>>>>>>>>>>>>>>>>>>>>>>

const weeklySalesData = async()=>{
  const today = new Date();

  // Set the day of the week to Sunday (0 represents Sunday, 1 represents Monday, and so on)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  try {
    const salesData = await Order.find({
      deliveryStatus: 'delivered',
      date: {
        $gte: startOfWeek,
        $lt: today,
      },
    });

    return salesData
  }catch(error){
    console.error(error.message);
  }

}

const monthlySalesData = async()=>{
  const today = new Date();

  // Set the day of the month to the first day
  today.setDate(1);

  try {
    const salesData = await Order.find({
      deliveryStatus:'delivered',
      date: {
        $gte: today,
        $lt: new Date(), // Represents the current date
      },
    });
    return salesData
  }catch(error){
    console.error(error.message);
  }
}

const yearlySalesData = async()=>{
  const today = new Date();

  // Set the month and day to January 1st
  const startOfYear = new Date(today);
  startOfYear.setMonth(0,1)

  try {
    const salesData = await Order.find({
      deliveryStatus:'delivered',
      date: {
        $gte:startOfYear ,
        $lt: today, // Represents the current date
      },
    });
    return salesData
  }catch{
    console.error(error.message)
  }
}


const dailySalesData = async() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create a new date object for tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    
    const salesData = await Order.find({
      deliveryStatus:'delivered',
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });
    return salesData;
  }catch(error){
    console.error(error.message)
  }
}


 const totalSalesData = async() =>{
  try {
    const salesData = await Order.find({deliveryStatus:'delivered'});
    return salesData;
  } catch (error) {
    error.message
  }
 }
 
 const customSalesData = async(startDate,endDate) =>{
    try {
      const salesData = await Order.find({
        orderStatus:'delivered',
        date: {
          $gte:startDate ,
          $lt: endDate, // Represents the current date
        },
      });
      return salesData;

    }catch(error){
      console.error(error.message)
    }
  }

//  fetching sales Data to chart js...........................................................

const fetchSalesData = async (req,res) => {
  try {
    const type = req.query.type;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    let salesData ;
    switch (type) {
        case "week":
          salesData = await weeklySalesData();
            break;
    
        case "year":
          salesData = await yearlySalesData();
            break;
    
        case "daily":
          salesData = await dailySalesData();
            break;
    
        case "month":
          salesData = await monthlySalesData();
            break;
        case "custom":
          salesData = await customSalesData(startDate,endDate); 
            break;   
        case "total":
          salesData = await totalSalesData();
            break;
    
        default:
          salesData = totalSalesData();
            break;
    }
    totalSales = salesData.reduce((sum, order) => sum + order.orderValue, 0)
    return res.json({
      salesData:totalSales,
      count:0
    })
  } catch (error) {
     console.error(error.message)
  }
}


// allow cancel ..........................................................

const allowCancel = async(req,res)=>{
  try{
    const orderId = req.query.orderId;
    const orderData = await Order.findOneAndUpdate({_id:orderId},{$set:{deliveryStatus:"cancelled" ,cancellationStatus:"allowed"}});
    if(orderData.paymentMethod != "Cash On Delivery"){
      const walletupdated = await Wallet.updateOne({user:orderData.userId},{$inc:{balance:orderData.orderValue}}) 
    }
    res.redirect('/gadgetly/admin/userorders')
  }catch(error){
    console.error(error.message);
  }
}
// denieying cancel ..........................................................
const denyCancel = async(req,res)=>{
  try {
    const orderId = req.query.orderId;
    const updated = await Order.updateOne({_id:orderId},{$set:{cancellationStatus:"denied"}});
    res.redirect('/gadgetly/admin/userorders')
  } catch (error) {
      console.error(error.message)
  }
}

// allowing Return.................................................

const allowReturn = async(req,res)=>{
  try {
    const orderId = req.query.orderId;
    const orderData = await Order.findOneAndUpdate({_id:orderId},{$set:{deliveryStatus:"returned" ,cancellationStatus:"return allowed"}});
    const walletupdated = await Wallet.updateOne({user:orderData.userId},{$inc:{balance:orderData.orderValue}})
    res.redirect('/gadgetly/admin/userorders')
  } catch (error) {
    console.error(error.message);
  }
}

const denyReturn = async(req,res)=>{
  try {
    const orderId = req.query.orderId;
    const updated = await Order.updateOne({_id:orderId},{$set:{cancellationStatus:"return denied"}});
    res.redirect('/gadgetly/admin/userorders')
  } catch (error) {
     console.error(error.message)
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
  deliverOrder,
  salesReport,
  dailySales,
  monthlySales,
  weeklySales,
  yearlySales,
  customSales,
  downloadReport,
  dowloadExcel,
  fetchSalesData,
  allowCancel,
  denyCancel,
  viewOrderDetails,
  allowReturn,
  denyReturn
 };
