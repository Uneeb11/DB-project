//create a mongoose app ?
const  mongoose = require( 'mongoose');
const express = require("express");
const bodyParser = require('body-parser');
const { Decimal128 } = require('bson');
const path = require('path') ;
let session = require('express-session');
//const php = require('php');
//php.disableRegisterGlobalModel()



// Create Express app
const app = express();
const port = 3000;

// setup php templating engine
//app.set('views', path.join(__dirname, 'templates'))
//app.set('view engine', 'php')
//app.engine('php', php.__express)
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: "Your secret key"}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/pshop',{useNewUrlParser : true});


async function getshops()
{
    return await shop.find({});
}
async function getshopname(id )
{
    //console.log(id);
    const shopname =  await shop.findOne({Email : id });
    //console.log(shopname);
    return shopname;
}
async function deleteshopbyname(sname)
{
    return await shop.findOneAndDelete({name : sname});
}

async function deleteshop(id){
    return await shop.findByIdAndDelete(id);
}
async function getproducts(shopname)
{
    const products = await prod.find({shop : shopname});
    //console.log(products);
    return products;
}

async function findidproduct(id)
{
    const products =  await prod.findById(id);
    //console.log("in function");
    //console.log(products);
    return products;
}

async function updateproduct(id,product)
{
    return await prod.findByIdAndUpdate(id , {
        name : product.name, 
        shop : product.shop,
        catogry : product.catogry,
        Description : product.description,
        price : product.price,
        qunatity : product.quantity,
    });
}

async function updaterating(id,rate)
{
    return await prod.findByIdAndUpdate(id , {
        rating : rate,
    });
}

async function findidorder(id){
    return await ord.findById(id);
}

async function deleteproduct(id)
{
    return await prod.findByIdAndDelete(id);
}

async function completeorder(id,payment)
{
    return await ord.findByIdAndUpdate(id , {
        completed : true,
        paymentmethod : payment,
    });
}

app.get('/' , (req,res) => {
  res.render('login');
});

app.post('/login' , (req,res) => {
    if(!req.body.email)
    {
        res.redirect('/');
    }
    let loginuser ={ id : req.body.email};
    //user.push(loginuser);
    req.session.user = loginuser;
    //console.log(req.session.user)
    res.redirect('/home');
});


//Define customers schemma 
const Customer = new mongoose.Schema (
    {
        firstname : String,
        Secondname : String,
        address : String,
        Email : String,
        Password : String,
        City: String,
        Country : String,
        Phoneno: Number
}) ;

//create shops model
const cus = mongoose.model('customer', Customer);



app.get('/home' , (req,res) => {

    getshopname(req.session.user.id).then(function(shopnames){
         //console.log(shopnames);
            getshops().then(function(findshop) {
                findshop.forEach(function(item) {
                    //console.log(item.name);
                });
                
            res.render('index',{ findshops : findshop , id : req.session.user.id , shopname : shopnames});
           });
   });
});

//router for signup page
app.get('/signup' , (req,res) => {

    res.render('sign-up');
  
});

//route for signup create
app.post('/sign-up' , (req,res) => {

    //console.log(req.body);
   const cuss  = new cus ({
    firstname : req.body.firstName,
    Secondname : req.body.secondName,
    address : req.body.addrress,
    Email : req.body.email,
    Password : req.body.password,
    City: req.body.city,
    Country : req.body.Country,
    Phoneno: req.body.phoneNo
   });

   cuss.save();

   res.redirect('/');
  
});

//Define shop schemma 
const Shop = new mongoose.Schema (
    {
        Email : String,
        Password : String,
        City: String,
        name : String,
        address : String,
        rating : Decimal128
}) ;

//create shops model
const shop = mongoose.model('Shop', Shop);

//router for add shop
app.get('/addshop' , (req,res) => {

    res.render('add-shop', {id : req.session.user.id});
  
});

app.post('/addshops' , (req,res) => {

    console.log(req.body);
    
    const Shops = new shop ({
            name : req.body.name, 
            Email : req.body.email,
            Password : req.body.password,
            City: req.body.city,
            Country : req.body.State,
            address : req.body.addrress,
        });
        
        Shops.save();
  
        res.redirect('/home');  
});

//Define products schemma 
const Product = new mongoose.Schema (
    {
        name : String,
        shop : String,
        catogry : String,
        Description : String,
        price : Number,
        qunatity : Number,
        rating : Number,
}) ;

//create product model
const prod = mongoose.model('product', Product);

//router for add product page
app.get('/addproduct' , (req,res) => {

    getshopname(req.session.user.id).then(function(data) {
        res.render('add-product' , {id : req.session.user.id, shopid : data , uflag : false});
    });
});

app.post('/addproducts' , (req,res) => {
    console.log(req.body);
    const products = new prod ({
        name : req.body.name, 
        shop : req.body.shop,
        catogry : req.body.catogry,
        Description : req.body.description,
        price : req.body.price,
        qunatity : req.body.quantity,
        rating : null,
    });

    products.save();
    res.redirect('/home');  
});

app.get('/product/:shopsname' ,(req,res) => {
    getshopname(req.session.user.id).then(function(shopnames) {
        getproducts(req.params.shopsname).then(function(items){
            res.render('product', {products : items , id : req.session.user.id, shopname : shopnames});
        });
    });
});

app.get('/deleteshop/:shopsname' ,(req,res) => {
      
        deleteshopbyname(req.params.shopsname);
        getproducts(req.params.shopsname).then(function(items){
            items.forEach( function(item){
                deleteproduct(item._id);      
            });
            res.render('product', {products : items , id : req.session.user.id, shopname : shopnames});
        });
        res.redirect('/home');
});

app.get('/updateproduct/:id' , (req,res) => {
    findidproduct(req.params.id).then(function(item)
    {
        //console.log("item here ");
        //console.log(item);
        getshopname(req.session.user.id).then(function(data) {
            
            res.render('add-product' , {id : req.session.user.id, shopid : data, product : item, uflag : true});
        });
    });
    
})

app.post('/updateproducts/:id' , (req,res) => {
      updateproduct(req.params.id , req.body);
      res.redirect('/home');
});

app.get('/deleteproducts/:id' , (req,res) => {
    deleteproduct(req.params.id);
    res.redirect('/home');
});

//Define order schemma 
const Order = new mongoose.Schema (
    {
        customerid : String,
        productid : String,
        totalprice : Number,
        completed : Boolean,
        paymentmethod : String,
        createddate : Date,
}) ;

//create order model
const ord = mongoose.model('order', Order);

//Define catogry schemma 
const Catogry = new mongoose.Schema (
    {
        name : String,
}) ;

//create order model
const catog = mongoose.model('catogry', Catogry);

const cat = new catog({
    name : "Frozenfood" ,
});

cat.save();

app.get('/cart' , (req,res) => {
   res.render('shoping-cart');
});

app.get('/detail/:id' , (req,res) => {
    findidproduct(req.params.id).then(function(item) {
        res.render('shop-details' , {product : item , email : req.params.id });
    });
    
});

app.post('/check' , (req,res) => {
    console.log(req.body);
    const orderss = new ord({
        customerid : req.session.user.id,
        productid : req.body.id,
        totalprice : ((req.body.price) * (req.body.piece)),
        completed : false,
        paymentmethod : null,
        createddate : new Date(),
    });

    orderss.save();
    res.render('checkout' , {order : orderss , name : req.body.name , price : req.body.price});
});

app.post('/completeorder' , (req,res) => {
  completeorder(req.body.id,req.body.payment);
  res.render('rating', {orderid : req.body.id});
});

app.post('/rating' , (req,res) => {
      findidorder(req.body.id).then(function(item){
         updaterating(item.productid,req.body.rate);
      })

    res.redirect('/home')
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
