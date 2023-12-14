const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const Admin = require('../models/adminModel')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Category = require('../models/categoryModel');
const Wallet = require('../models/walletModel')
const Transaction = require('../models/transactionModel')
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

    // var search = '';
    // if(req.query.search){
    //   search = req.query.search
    // }

    // var page = 1;
    // if(req.query.page){
    //   page = req.query.page
    // }

    // const limit = 8;
    const usersData = await User.find({})
    // const usersData = await User.find({
    //   $or:[
    //     {name:{$regex:'.*' +search+'.*' , $options:'i'}},
    //     {email:{$regex:'.*' +search+'.*', $options:'i'}},
    //   ]
    // })
    // .limit(limit*1)
    // .skip((page-1)*limit)
    // .exec();
    
    // const count = await User.find({
    //   $or:[
    //     {name:{$regex:'.*' +search+'.*' , $options:'i'}},
    //     {email:{$regex:'.*' +search+'.*', $options:'i'}}
    //   ]
    // }).countDocuments();
    res.render('usersList',{
      users:usersData,
      // totalPages:Math.ceil(count/limit),
      // searchTerm:search,
      // Search:true
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



// loading userOrders......................................................................

const userOrders = async(req,res) => {
  try {
    
    // var page = 1;
    // if(req.query.page){
    //   page = req.query.page
    // }

    const paymentMethod = req.query.paymentMethod || '';
    const deliveryStatus = req.query.deliveryStatus || '';
    const cancellationStatus = req.query.cancellationStatus || '';

    const filter = {}
    if(paymentMethod){
      filter.paymentMethod = paymentMethod
    }
    if(deliveryStatus){
      filter.deliveryStatus = deliveryStatus
    }
    if(cancellationStatus){
      filter.cancellationStatus = cancellationStatus
    }

    


    const limit = 10;


    const ordersData = await Order.find(filter)
    // .sort({ date: -1 })
    // .limit(limit * 1)
    // .skip((page - 1) * limit)
    // .populate('userId')
    // .exec();
    // const count = await Order.find(filter).countDocuments();
    res.render('userorders',{
      orders:ordersData,
      // totalPages:Math.ceil(count/limit)
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


    const salesData = await Order.find({deliveryStatus:"delivered"})
    .populate('userId')
 
    // const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()
    res.render('salesReport',{salesData , message:"TotalSales",type:"total",})
  } catch (error) {
    console.error(error.message);
  }
}

// daily sales................................................................................

const dailySales = async (req, res) => {


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
    .populate('userId')


    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()
    res.render('salesReport', { salesData, message:"DailySales",type:"daily" });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};

// monthly sales .............................................................

const monthlySales = async (req, res) => {


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
    .populate('userId')

    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()

    res.render('salesReport', { salesData ,message:"MonthlySales",type:"month",});
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};

// weekly sales report ..............................................................

async function weeklySales(req, res) {


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
    .populate('userId')


    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()

    res.render('salesReport', { salesData,message:"WeeklySales",type:"week"});
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
}

//  yearly sales report...........................................................

const yearlySales = async (req, res) => {

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
    .populate('userId')


    const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()

    res.render('salesReport', { salesData,message:"YearlySales",type:"year" });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};

// custom sales............................................................

const customSales = async(req,res)=>{


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
      .populate('userId')

  
      const count = await Order.find({deliveryStatus:"delivered"}).countDocuments()
  
      res.render('salesReport', { salesData,message:"CustomSales",type:"custom" ,startDate,endDate,});
    } catch (error) {
      console.error('Error fetching sales data:', error);
      res.status(500).send('Internal Server Error');
    }
}
// dowloading Report ............................................................

const downloadReport = async(req,res) => {
  try {
    const type = req.query.type;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
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
        case "custom":
          salesData = await customSalesData(startDate,endDate);
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
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
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
        case "custom":
          salesData = await customSalesData(startDate,endDate);
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


const salesDataFunction = async(startDate,endDate) =>{
  const salesData = await Order.aggregate([
    {
      $match: {
        orderStatus: 'delivered',
        date: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
    },
  ]);
  return salesData
}
// weeklySalesDatafunction >>>>>>>>>>>>>>>>>>>>>>>

const weeklySalesData = async()=>{
  const today = new Date();

  // Set the day of the week to Sunday (0 represents Sunday, 1 represents Monday, and so on)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  try {
    const salesData = await salesDataFunction(startOfWeek,new Date())

    return salesData
  }catch(error){
    console.error(error.message);
  }

}

const monthlySalesData = async()=>{
  const today = new Date();

  // Set the day of the month to the first day
  today.setDate(1);
  endDate = new Date()

  try {
    const salesData = await salesDataFunction(today,endDate)
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
    const salesData = await salesDataFunction(startOfYear,today)
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
    
    const salesData = await salesDataFunction(today,tomorrow)
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
      const salesData = await salesDataFunction(startDate,endDate)
      return salesData
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

// allowing Return.................................................

const allowReturn = async(req,res)=>{
  try {
    const orderId = req.query.orderId;
    const orderData = await Order.findOneAndUpdate({_id:orderId},{$set:{deliveryStatus:"returned" ,cancellationStatus:"return allowed"}});
    const wallet = await Wallet.findOne({user:orderData.userId})
    const transaction=new Transaction({
      wallet:wallet._id,
      amount:orderData.orderValue,
      type:'credit'
    
     })
     const transactiondata = await transaction.save()
    const walletupdated = await Wallet.updateOne({user:orderData.userId},{$inc:{balance:orderData.orderValue},$push: { transactions: transactiondata._id }})
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
  viewOrderDetails,
  allowReturn,
  denyReturn,
 };
