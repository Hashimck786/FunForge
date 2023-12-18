
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');



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
    const discount = req.body.category_discount;
    const description = req.body.category_description;
    
    const categoriesData = await Category.find({})
    
    const existingCategory = await Category.findOne({categoryName:name});
    if(existingCategory){
      return res.render("categories",{message:"name exists pls try another name" ,category:categoriesData})
    }



    const category = new Category({
      categoryName:name,
      categoryDiscount:discount,
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
    const discount = req.body.category_discount;
    const description = req.body.category_description;
    const updated = await Category.updateOne({_id:id},{ $set : {
      categoryName:name,
      categoryDiscount:discount,
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

module.exports = {
  loadCategories,
  createCategory,
  categoryUnlist,
  categoryList,
  loadCategoryEdit,
  categoryEdit
}