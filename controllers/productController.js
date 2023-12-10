const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const path = require('path');
const sharp = require('sharp');

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
    const cropOptions = {
      left: 10,   // left offset
      top: 20,    // top offset
      width: 200, // width of the cropped area
      height: 150 // height of the cropped area
    };

      // Resize and crop images using sharp
      const croppedImages = await Promise.all(images.map(async (image) => {
      const imagePath = path.join(__dirname, '../public/admin-assets/imgs/productImages', image);
      const croppedImagePath = path.join(__dirname, '../public/admin-assets/imgs/productImages/', `cropped_${image}`);

   await  sharp(imagePath)
  .rotate()
  .resize(200)
  .jpeg({ mozjpeg: true })
  .toFile(croppedImagePath)

  return  `cropped_${image}`
  
  //    return await sharp(imagePath)
  // .crop(cropOptions.width, cropOptions.height, cropOptions.left, cropOptions.top)
  // .toFile(croppedImagePath)
  // .then(info => {
  //   console.log(info);
  // })
  // .catch(err => {
  //   console.error(err);
  // });
    }));

      console.log('Image Path:', croppedImages);
    // console.log('Cropped Image Path:', croppedImagePath);

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

module.exports = {
  loadProductList,
  loadAddProduct,
  addProduct,
  listProduct,
  unlistProduct,
  editProduct,
  loadEditPage,
}