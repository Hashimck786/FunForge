const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Gadgetly')



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

app.use('/gadgetly',userRoute);

//for admin routes

app.use('/gadgetly/admin',adminRoute);


app.get('*',(req,res)=>{

  res.render('page-404')
})


// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(3000,console.log("Server running successfully......"))

