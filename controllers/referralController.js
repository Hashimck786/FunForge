const Referral = require('../models/referralModel')

const loadreferrals = async(req,res) => {
  try {
    const referralData = await Referral.find({})
    console.log(referralData)
    if(!referralData.length>0){
      const referral = new Referral({})
      referralData = referral.save()
    }
    
    
    res.render('referrals',{referral:referralData[0]})
  } catch (error) {
    console.error(error.referral)
  }
}


const editReferral = async(req,res)=>{
  try {
    const referralId = req.query.referralId;
    console.log(referralId)
    const updated = await Referral.updateOne({_id:referralId},{$set:{
      referralAmount:req.body.referral_amount,
      referrerAmount:req.body.referrer_amount
    }})
      res.redirect("/gadgetly/admin/referrals")
  } catch (error) {
    console.log(error.message)
  }
}



module.exports = {
  loadreferrals,
  editReferral
}