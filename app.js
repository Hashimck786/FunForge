const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.MONGODB_URL)




const express = require("express");
const app = express();

const nocache =require('nocache');
app.use(nocache())
app.use(express.static('public'))

app.set('view engine','ejs')
app.set('views','./views/user')

const userRoute = require('./routes/userRoutes');
const adminRoute = require('./routes/adminRoutes');

//for user routes

app.use('/',userRoute);

//for admin routes

app.use('/admin',adminRoute);


app.get('*',(req,res)=>{

  res.render('page-404')
})


// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send('Something went wrong!');
});

app.listen(3000,console.log("Server running successfully......"))

