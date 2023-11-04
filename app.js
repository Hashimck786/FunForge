const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Gadgetly')



const express = require("express");
const app = express();

const nocache =require('nocache');
app.use(nocache())
app.use(express.static('public'))

const userRoute = require('./routes/userRoutes');
const adminRoute = require('./routes/adminRoutes');

//for user routes

app.use('/gadgetly',userRoute);

//for admin routes

app.use('/gadgetly/admin',adminRoute);



app.listen(3000,console.log("Server running successfully......"))

