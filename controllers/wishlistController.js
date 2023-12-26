const User = require('../models/userModel')
const Product = require('../models/productModel')

// loading wishlist ..........................................................................................

const loadWishlist = async(req,res) => {
  try {
    const userId = req.session.data._id; 
    const newuserData = await User.findOne({_id:userId})
    const userwishlist = newuserData.wishlist;
    productData = await Product.find({_id:{$in :userwishlist}},{})
    res.render('wishlist.ejs',{product:productData,user:userId})
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
  } catch (error) {
      console.error(error.message)
  }
}


module.exports = {
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
}