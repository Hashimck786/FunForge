const express= require('express');
const adminRoute = express();
const session = require('express-session');

const config = require('../config/config.js')
adminRoute.use(session({secret:config.sessionSecret,
resave: false, 
saveUninitialized: true,                             
 }));

// multer start........................................................

const multer = require('multer');
const path = require('path')

const storage = multer.diskStorage({
  destination:function(req,file,cb){
      cb(null,path.join(__dirname,"../public/admin-assets/imgs/productImages"))

  },
  filename:function(req,file,cb){
    const name = Date.now()+'-'+file.originalname;
      cb(null,name)
  }
})

const upload = multer({storage:storage})

//...........................multer end ..........................................



adminRoute.set('view engine','ejs');
adminRoute.set('views','./views/admin')

adminRoute.use(express.json());
adminRoute.use(express.urlencoded({extended:true}))

const auth = require('../middlewares/adminAuth.js')

const adminController = require('../controllers/adminController')

adminRoute.get('/',auth.isLogout,adminController.loadAdminLogin);
adminRoute.get('/login',auth.isLogout,adminController.loadAdminLogin);
adminRoute.post('/',auth.isLogout,adminController.loginSubmission);
adminRoute.post('/login',auth.isLogout,adminController.loginSubmission);
adminRoute.get('/forget',auth.isLogout,adminController.loadForget);
adminRoute.post('/forget',auth.isLogout,adminController.sendResetMail);
adminRoute.post('/otpValidation',auth.isLogout,adminController.verifyOtp);
adminRoute.post('/passwordupdate',auth.isLogout,adminController.passwordUpdate)
adminRoute.get('/home',auth.isLogin,adminController.loadAdminHome);
adminRoute.get('/userlist',auth.isLogin,adminController.loadUserList);
adminRoute.get('/logout',auth.isLogin,adminController.adminLogout);
adminRoute.get('/block',auth.isLogin,adminController.blockUser);
adminRoute.get('/unblock',auth.isLogin,adminController.unblockUser);
adminRoute.get('/productList',auth.isLogin,adminController.loadProductList);
adminRoute.get('/loadAddProduct',auth.isLogin,adminController.loadAddProduct);

adminRoute.post('/addproduct',auth.isLogin,upload.array('image',5),adminController.addProduct);
adminRoute.get('/list',auth.isLogin,adminController.listProduct);
adminRoute.get('/unlist',auth.isLogin,adminController.unlistProduct);
adminRoute.get('/edit',auth.isLogin,adminController.loadEditPage);
adminRoute.post('/edit',auth.isLogin,upload.array('image',5),adminController.editProduct);

adminRoute.get('/categories',auth.isLogin,adminController.loadCategories);
adminRoute.post('/createcategory',auth.isLogin,adminController.createCategory);
adminRoute.get('/category_list',auth.isLogin,adminController.categoryList);
adminRoute.get('/category_unlist',auth.isLogin,adminController.categoryUnlist);
adminRoute.get('/category_edit',auth.isLogin,adminController.loadCategoryEdit);
adminRoute.post('/category_edit',auth.isLogin,adminController.categoryEdit);

adminRoute.get('/userorders',auth.isLogin,adminController.userOrders);
adminRoute.get('/deliver',auth.isLogin,adminController.deliverOrder)
adminRoute.get('/salesreport',auth.isLogin,adminController.salesReport)
adminRoute.get('/daily-sales',auth.isLogin,adminController.dailySales)
adminRoute.get('/weekly-sales',auth.isLogin,adminController.weeklySales)
adminRoute.get('/monthly-sales',auth.isLogin,adminController.monthlySales)
adminRoute.get('/yearly-sales',auth.isLogin,adminController.yearlySales)
adminRoute.get('/dowload-report',auth.isLogin,adminController.downloadReport)
adminRoute.post('/fetchSalesData',auth.isLogin,adminController.fetchSalesData)

module.exports = adminRoute;
