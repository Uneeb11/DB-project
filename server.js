const express = require("express");
const bodyParser = require('body-parser');
const { Decimal128 } = require('bson');
const path = require('path') ;
let session = require('express-session');
const mysql = require('mysql');
const { promises } = require("dns");
const { get } = require("http");
const { Console } = require("console");

// Create Express app
const app = express();
const port = 3000;

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: "Your secret key"}));
app.use(express.static("public"));

var con = mysql.createConnection({
    host: "localhost",
    port: 3306,
    database: "pshop",
    user: "root",
    password: ""
  });
  
  con.connect(function(err) {
    if (err) {
    console.log("Connected!");
    }
    else{
        console.log("connection created with Mysql successfully");
    }
  });

  getemailid = function(email){
    return new Promise(function(resolve, reject){
      con.query(
          'SELECT * FROM customers WHERE email = ? ', email,
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}

  getshops = function(id){
    return new Promise(function(resolve, reject){
      con.query(
          'SELECT * FROM shops WHERE userid = ?', id,
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}

  getallshops = function(){
    return new Promise(function(resolve, reject){
      con.query(
          'SELECT * FROM shops ',
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}


  gettenshops = function(id){
    return new Promise(function(resolve, reject){
      con.query(
          'SELECT * FROM shops LIMIT 10',
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}

  getcategorys = function(){
    return new Promise(function(resolve, reject){
      con.query(
          'SELECT * FROM categorys ',
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}
  
  getproductcategory = function(id){
    return new Promise(function(resolve, reject){
      con.query(
          'SELECT categorys.categoryid,categorys.name FROM categorys INNER JOIN products ON categorys.categoryid=products.categoryid WHERE products.productid = ?', id,
          function(err, rows){                                                
              if(rows === undefined){
                  console.log(err);
              }else{
                  resolve(rows);
              }
          }
      )}
  )}
  
  getcategory = function(id){
    return new Promise(function(resolve, reject){
      con.query(
          'SELECT * FROM categorys WHERE categoryid = ?', id,
          function(err, rows){                                                
              if(rows === undefined){
                  console.log(err);
              }else{
                  resolve(rows);
              }
          }
      )}
  )}


  
  getproductbyshops = function(id){
    return new Promise(function(resolve, reject){
      //console.log(id);
      con.query(
          'SELECT * FROM products WHERE shopid = ?', id,
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}

  getproduct = function(id){
    return new Promise(function(resolve, reject){
      con.query(
          'SELECT * FROM products WHERE productid = ?', id,
          function(err, rows){                                                
              if(rows === undefined){
                  reject(new Error("Error rows is undefined"));
              }else{
                  resolve(rows);
              }
          }
      )}
  )}

  function distance(lat1,lat2, lon1, lon2){

    // The math module contains a function
    // named toRadians which converts from
    // degrees to radians.
    lon1 =  lon1 * Math.PI / 180;
    lon2 = lon2 * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;

    // Haversine formula
    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.pow(Math.sin(dlat / 2), 2)+ Math.cos(lat1) * Math.cos(lat2)* Math.pow(Math.sin(dlon / 2),2);

    let c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956
    // for miles
    let r = 6371;

    // calculate the result
    return(c * r);
  }


  app.get('/' , (req,res) => {
    res.render('login');
  });

  
  

  app.post('/login' , (req,res) => {
      if(!req.body.email)
      {
          res.redirect('/');
      }
      //console.log(req.body.email);
      let loginuser;
      getemailid(req.body.email ).then( function(data){
        //console.log(data);
        loginuser = {id: data[0].userid , email : data[0].email , lat : data[0].lat , lon : data[0].lon };
        // console.log(loginuser);
        req.session.user = loginuser;
        //console.log(req.session.user);
        res.redirect('/home');
      });
      
  });

  //router for signup page
app.get('/signup' , (req,res) => {

    res.render('sign-up');
  
});

//route for signup create
app.post('/sign-up' , (req,res) => {
  
    let data = {
        firstname : req.body.firstName,
        lastname : req.body.secondName,
        address : req.body.addrress,
        email : req.body.email,
        password : req.body.password,
        city: req.body.city,
        country : req.body.Country,
        phoneno: req.body.phoneNo
       };

    let sqlQuery = "INSERT INTO customers SET ?";

    let query = con.query(sqlQuery, data,(err, results) => {
        if(err) throw err;
        ///console.log(results);
      });


   res.redirect('/');
  
});


app.get('/home' , (req,res) => {

  let nearshop = [];
  getallshops().then(function(shop){
   
    shop.forEach(result => {
      const distances = distance(result.lat,req.session.user.lat,result.lon,req.session.user.lon);
      //console.log(distances);
      if( distances < 5)
      {
         //console.log(nearshop);
         //console.log(result);
         nearshop.push(result);
      }
     });
    if(nearshop == null)
    {
      gettenshops().then(function(tenshop){
        res.render('index',{ findshops : tenshop , id : req.session.user , shopname : null});
      });
      
    }
    else {
      //console.log(nearshop);
        getshops(req.session.user.id).then(function(shop){
          con.query("SELECT * FROM products where rating >= 4" , function(err,product){ 
            res.render('index',{ findshops : nearshop , id : req.session.user , shopname : shop[0] , products : product });
          })
          //console.log(nearshop);
          
      });
    } 
  })
});

//router for add shop
app.get('/addshop' , (req,res) => {

  res.render('add-shop', {id : req.session.user});

});

app.post('/addshops' , (req,res) => {

  console.log(req.body);
  
   let shop = {
          name : req.body.name, 
          email : req.body.email,
          password : req.body.password,
          city: req.body.city,
          country : req.body.state,
          address : req.body.addrress,
          userid : req.body.userid
      };
      
     let sqlQuery = "INSERT INTO shops SET ?";

     let query = con.query(sqlQuery, shop , (err, results) => {
      if(err) throw err;
      //console.log(results);
    });

      res.redirect('/home');  
});

//router for add product page
app.get('/addproduct' , (req,res) => {

  getcategorys().then(function(categorys){
    getshops(req.session.user.id).then(function(data) {
       //console.log(categorys);
       res.render('add-product' , {id : req.session.user, shopid : data[0] , catgrys : categorys ,uflag : false});
   });
  });
  
});

app.post('/addproducts' , (req,res) => {
  //console.log(req.body);
  let product = {
      name : req.body.name, 
      description : req.body.description,
      price : req.body.price,
      categoryid : req.body.catogry,
      shopid : req.body.shopid,
      quantity : req.body.quantity,
      rating : 1,
  };

  let sqlQuery = "INSERT INTO products SET ?";

     let query = con.query(sqlQuery, product , (err, results) => {
      if(err) throw err;
      //console.log(results);
    });

  res.redirect('/home');  
});

app.get('/product/:id' ,(req,res) => {
  getshops(req.session.user.id).then(function(shop) {
      getproductbyshops(req.params.id).then(function(items){
          res.render('product', {products : items , id : req.session.user.id, shopname : shop});
      });
  });
});

app.get('/deleteshop/:id' ,(req,res) => {
     
  let id = req.params.id;
  con.query('DELETE FROM products WHERE shopid = ' + req.params.id, function(err, result) {
    if(err) console.log(err);
  })

  con.query('DELETE FROM shops WHERE shopid = ' + id, function(err, result) {
    if(err) console.log(err);
  })
  res.redirect('/home');
});

app.get('/updateproduct/:id' , (req,res) => {
  //getproductcategory(1).then(function(items){console.log(items)});
  getproduct(req.params.id).then(function(item)
  {
    getproductcategory(req.params.id).then(function(catgry){

  
      getshops(req.session.user.id).then(function(data) {
          
          res.render('add-product' , {id : req.session.user.id, shopid : data[0], product : item[0], uflag : true , productcatgry : catgry[0]});
      });
    });
  });

})

app.post('/updateproducts/:id' , (req,res) => {
  let product = {
    name : req.body.name, 
    description : req.body.description,
    price : req.body.price,
    categoryid : req.body.catogry,
    shopid : req.body.shopid,
    quantity : req.body.quantity,
    };

    // update query
    con.query('UPDATE products SET ? WHERE productid = ' + req.params.id, product, function(err, result) {
      if(err) {console.log(err)};
     })
     res.redirect('/home');
});

app.get('/deleteproducts/:id' , (req,res) => {
  con.query('DELETE FROM products WHERE productid = ' + req.params.id, function(err, result) {
    if(err) console.log(err);
  })
  res.redirect('/home');
});

app.post('/search' , (req,res) => {
   if(req.body.choice == 2)
   {
      con.query('SELECT * FROM categorys INNER JOIN products ON categorys.categoryid=products.categoryid WHERE categorys.name LIKE "%'+req.body.search+'%"',function(err,result){
        if(err){console.log(err)};
        //console.log(result) ;
        res.render('product', {products : result , id : req.session.user.id, shopname : null});
      })
   }
   else{
      con.query('SELECT * FROM products WHERE name LIKE "%'+req.body.search+'%"',function(err,result){
        if(err){console.log(err)};
        //console.log(result[0]);
        res.render('product', {products : result , id : req.session.user.id, shopname : null});
      })
  }
})

app.get('/map/:id' , (req,res)=>{
  res.render('map', {id  : req.params.id});
})

app.post('/addmap/:id' , (req,res) =>{
  if(req.params.id == 0)
  {
    let data = {
      lat : req.body.lat,
      lon : req.body.long,
    }
    con.query('UPDATE customers SET ? WHERE userid = ' + req.session.user.id , data ,function(err, result) {
      if(err) {console.log(err)};
     })
  }
  else{
    let data = {
      lat : req.body.lat,
      lon : req.body.long,
    }
    con.query('UPDATE shops SET ? WHERE shopid = ' + req.params.id , data ,function(err, result) {
      if(err) {console.log(err)};
     })
  }

  res.redirect('/logout');
})

app.get('/nearshop/:id' , (req,res) =>{
  getproductbyshops(req.params.id).then(function(items){
    res.render('product', {products : items , id : req.session.user.id, shopname : null});
  });
})

app.get('/cart' , (req,res) => {
  res.render('shoping-cart');
});

app.get('/detail/:id' , (req,res) => {
   getproduct(req.params.id).then(function(item) {
       //console.log(item);
       res.render('shop-details' , {product : item[0] , email : req.params.id });
   });
   
});

app.post('/check' , (req,res) => {
   //console.log(req.body);
   let orderss = {
       userid : req.session.user.id,
       productid : req.body.id,
       payment_method : null,
       total_price : ((req.body.price) * (req.body.piece)),
       created_at : new Date(),
       completed : false,
   };

   let sqlQuery = "INSERT INTO orders SET ?";

     let query = con.query(sqlQuery, orderss , (err, results) => {
      if(err) throw err;
      //console.log(results);
    });

   con.query('SELECT MAX(orderid) AS orderid FROM orders',function(err,results){
    //console.log(results[0])
    res.render('checkout' , {order : orderss , name : req.body.name , price : req.body.price , orderid : results[0].orderid , piece: req.body.piece });
   })
   
});

app.post('/completeorder' , (req,res) => {
  let complete = {
    completed : false,
    payment_method : req.body.payment,
  }
  //console.log(req.body);
  con.query('UPDATE orders SET ? WHERE orderid = ' + req.body.id , complete ,function(err, result) {
    if(err) {console.log(err)};
   })
   con.query('SELECT quantity FROM products where productid = ? ' , req.body.pid,function(err,item){
    //console.log(item[0].quantity);
    //console.log(req.body.piece);
    let quantity = {
      quantity : item[0].quantity - (req.body.piece),
    }
    con.query('UPDATE products SET ? WHERE productid = ' + req.body.pid , quantity , function(err,result){
      if(err) {console.log(err)};
    })
   })
   
 res.render('rating', {productid : req.body.pid});
});

app.post('/rating' , (req,res) => {
  con.query('SELECT rating FROM products where productid = ? ' , req.body.id,function(err,rat){
    let rating;
    if(rat[0].rating < req.body.rate){
       rating = {
        rating : rat[0].rating + 1,
      }
    }
    else{
      rating = {
        rating : rat[0].rating - 1,
      }
    }
    //console.log(rating);
    if(rat[0].rating < 5)
    {
      con.query('UPDATE products SET ? WHERE productid = ' + req.body.id, rating, function(err, result) {
        if(err) {console.log(err)};
      });
   }
  })
   res.redirect('/home')
});

app.get('/logout' , (req,res)=>{
  req.session.destroy();
  res.redirect('/');
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
