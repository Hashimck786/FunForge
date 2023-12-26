const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
const Coupon = require('../models/couponModel')
const User = require('../models/userModel')




// showing cart.......................................................................................................

const loadCart = async(req,res) => {
  try {
      const userId = req.session.data._id;
      const cart =await  Cart.findOne({userId:userId}).populate('products.productId')
      const coupons = await Coupon.find({is_Active:true,usageLimit:{$gt:0}})

      if(cart){
        cart.cartSubTotal = cart.products.reduce((cartSubTotal,product)=> cartSubTotal += product.total,0);
        if(!cart.cartSubTotal == 0){
          cart.cartGrandtotal = cart.cartSubTotal-cart.couponDiscount;
        }else{
          cart.cartGrandtotal = cart.cartSubTotal
        }
        
        await cart.save()
      }

      
      
      res.render('cart.ejs',{cart:cart,user:userId,coupons})
  } catch (error) {
      console.error(error.message)
  }
}

// Adding product To Cart..........................................................................................

const addToCart = async(req,res) =>{
  try {
      const userId = req.session.data._id;
      const wishlist = req.query.wishlist;
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
          if(wishlist){
            const updated = await User.updateOne({_id:userId},{$pull:{wishlist:productId}})
          }
  
          res.json({
            success:true
          })

        }else{

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
        if(!cart.cartSubTotal == 0){
          cart.cartGrandtotal = cart.cartSubTotal-cart.couponDiscount;
        }else{
          cart.cartGrandtotal = cart.cartSubTotal
        }
        await cart.save()


      const oldQuantity = cart.products[productIndex].quantity;
      const removed =await Cart.findOneAndUpdate({userId:userId},{$pull:{products:{productId:productId}}},{new:true});

      if(removed){
        // performed quantity updation.................................
        const updatedQuantity = productData.Stock + oldQuantity ;
        const stockIncrease = await Product.updateOne({_id:productId},{$set : {Stock:updatedQuantity}})
        res.json({
          success:true,
          subtotal:cart.cartSubTotal,
          grandtotal:cart.cartGrandtotal
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

  if(cart.couponId){
    const coupon = await Coupon.findOne({_id:cart.couponId})
    const originalGrandTotal = cart.cartSubTotal;
    const discountPercentage = coupon.couponDiscount;
    console.log(originalGrandTotal);
    console.log(discountPercentage);
  
    // Calculate the discounted amount
    cart.couponDiscount = (originalGrandTotal * discountPercentage) / 100;
    
  
    // Calculate the new grandtotal after applying the discount
    // const newGrandTotal = originalGrandTotal - discountAmount;
  }

  
  
  cart.cartGrandtotal = cart.cartSubTotal-cart.couponDiscount
  await cart.save();

  res.json({
    success:true,
    total:cart.products[productIndex].total,
    subtotal:cart.cartSubTotal,
    grandtotal:cart.cartGrandtotal,
    couponDiscount:cart.couponDiscount
  })
  





}


module.exports = {
  loadCart,
  addToCart,
  removeFromCart,
  updateQuantity
}

