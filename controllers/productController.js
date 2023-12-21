const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const path = require('path');
const sharp = require('sharp');

// loading product List.....................................................

const loadProductList = async(req,res) => {
  try {



 

    const productsData = await Product.find({})

    res.render('productList.ejs',{
      product:productsData
      
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
  .resize(300,300)
  .jpeg({ mozjpeg: true })
  .toFile(croppedImagePath)

  return  `cropped_${image}`
  

    }));

      console.log('Image Path:', croppedImages);
      let discount ;
      if(categoryDiscount > req.body.product_discount){
        discount = Math.floor((req.body.product_price*categoryDiscount)/100);
      }else{
        discount = Math.floor((req.body.product_price*req.body.product_discount)/100);
      }
    const salePrice = req.body.product_price-discount;
    const product =new Product ({
      productName : req.body.product_name,
      productDescription:req.body.product_description,
      productPrice:req.body.product_price,
      productDiscount:req.body.product_discount,
      categoryId:req.body.product_categoryId,
      salePrice:salePrice,
      Stock:req.body.product_stock,
      image:croppedImages
    });
    const productData = await product.save();
    if(productData){
      res.redirect('/admin/productList')
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
    res.redirect('/admin/productList')

  } catch (error) {
    console.log(error.message)
  }
}

//  Unlist Product ........................................................

const unlistProduct = async(req,res) => {
  try {
    const product_id = req.query.id;
    const updated = await Product.updateOne({_id:product_id},{$set : {is_listed:0}})
    res.redirect('/admin/productList')
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
      const categoryData = await Category.findOne({_id:req.body.product_categoryId})
      const categoryDiscount = categoryData.categoryDiscount;
      let discount ;
      if(categoryDiscount > req.body.product_discount){
        discount = Math.floor((req.body.product_price*categoryDiscount)/100);
      }else{
        discount = Math.floor((req.body.product_price*req.body.product_discount)/100);
      }
      

      const salePrice = req.body.product_price-discount;

      const updated = await Product.updateOne({_id:id},{$set : {
        productName : req.body.product_name,
        productDescription:req.body.product_description,
        productPrice:req.body.product_price,
        categoryId:req.body.product_categoryId,
        productDiscount:req.body.product_discount,
        salePrice:salePrice,
        Stock:req.body.product_stock,
        
      }})
      return res.redirect('/admin/productList')
    }
    const discount = (req.body.product_price*req.body.product_discount)/100;
    const salePrice = req.body.product_price-discount;
    
    const updated = await Product.updateOne({_id:id},{$set : {
      productName : req.body.product_name,
      productDescription:req.body.product_description,
      productPrice:req.body.product_price,
      category:req.body.product_category,
      productDiscount:req.body.product_discount,
      salePrice:salePrice,
      Stock:req.body.product_stock,
      image:images
    }})

    res.redirect('/admin/productList')
    
  } catch (error) {
    console.log(error.message)
  }
}


// delete image ..............................

const deleteImage = async (req, res) => {
  try {
    const imageId = req.query.imageId;
    const productId = req.query.productId;

    const result = await Product.findOneAndUpdate(
      { _id: productId },
      { $pull: { image: imageId } },
      { new: true } 
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  loadProductList,
  loadAddProduct,
  addProduct,
  listProduct,
  unlistProduct,
  editProduct,
  loadEditPage,
  deleteImage
}