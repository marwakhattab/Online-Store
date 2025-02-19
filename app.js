const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { redirect, render } = require("express/lib/response");
const md5 = require("md5");

const fs = require("fs");
const path = require("path")

// app.use(bodyParser.json);
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static("public"));

//connect to mongoDB
mongoose.connect("mongodb://localhost:27017/storeDB"); //connect local

//require our custom schema module
const schema = require("./models/schema");

const upload = schema.upload;
const User = schema.User;
const Product = schema.Product;
const defaultUser = schema.defaultUser;
const defaultProduct = schema.defaultProduct;






//global variables
var signedUser = defaultUser;
var signed = false;



//Main route
app.get("/main", (req, res) => {
    if (!signed) {
        console.log("You need to Sign In first!")
        res.redirect("/");
    } else {
        Product.find({}, function (err1, items) {
            if (err1) {
                console.log(err1);
            } else {
                res.render("main", { products: items, user: signedUser });
            }
        });
    }
});

//Sign In
app.get("/", (req, res) => {
    res.render("signIn", { user: signedUser });
})

app.post("/", (req, res) => {
    const email = req.body.email;
    const password = md5(req.body.password);
    User.findOne({ email: email }, (err, item) => {
        if (err) {
            console.log(err);
        } else if (item == null) {
            console.log("this email is not existed")
        }
        else {
            if (item.password == password) {
                signed = true;
                signedUser = item;
                res.redirect("/main");
            } else {
                console.log("the password is wrong!")
            }
        }
    });
});




//signUP
const countries = ["Egypt", "England", "France", "Sudan", "America"];
const states = ["Cairo", "Alexandria", "Giza", "Tanta"];
countries.sort();
states.sort();

app.get("/signUp", (req, res) => {
    res.render("signUp", { countries: countries, states: states, user: signedUser });
})

app.post("/signUp", (req, res) => {
    const user = new User({
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        password: md5(req.body.password),
        phoneNumber: req.body.phoneNumber,
        admin: false,
        img: {
            data: '',
            contentType: ''
        },
        address: {
            country: req.body.country,
            state: req.body.state,
            street: req.body.street,
            zip: req.body.zip
        },
        payments: [{
            method: req.body.paymentMethod,
            cardName: req.body.cardName,
            cardNumber: req.body.cardNumber,
            expiration: req.body.expiration,
            cvv: req.body.cvv
        }]
    });
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email }, (err, found) => {
        if (err) {
            console.log(err);
        } else {
            if (found != null) {
                console.log("This Email is already exists!")
                red.redirect("/signUp");
            } else {
                user.save(function (err1) {
                    if (err1) {
                        console.log(err1);
                    } else {
                        User.findOne({ email: email, password: md5(password) }, (err2, item) => {
                            if (err2) {
                                console.log(err2);
                            } else {
                                signed = true;
                                signedUser = item;
                                res.redirect("/main");
                            }
                        });
                    }
                });
            }
        }
    });
});


//Sign Out
app.get("/signOut", (req, res) => {
    signed = false;
    signedUser = defaultUser;
    res.redirect("/");
})




// addProduct
app.get("/addProduct", function (req, res) {
    if (!signed) {
        console.log("You need to Sign In first!")
        res.redirect("/");
    } else {
        res.render("addProduct", { user: signedUser })
    }
})
app.post("/addProduct", upload.single("image"), function (req, res) {
    const obj = new Product({
        name: req.body.name,
        price: req.body.price,
        s_description: req.body.s_description,
        l_description: req.body.l_description,
        catigory1: req.body.catigory1,
        catigory2: req.body.catigory2,
        img: {
            data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.file.filename)),
            contentType: 'image/png'
        }
    })
    obj.save((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/main");
        }
    });
});



//productPage
app.get("/productPage", (req, res) => {
    if (!signed) {
        console.log("You need to Sign In first!")
        res.redirect("/");
    } else {
        res.render("productPage", { user: signedUser });
    }
})

app.post("/productPage", (req, res) => {
    if (!signed) {
        console.log("You need to Sign In first!")
        res.redirect("/");
    } else {
        const productId = req.body.productId;
        // const catigoryId = req.body.product[1];  //we can use array or object to be passed
        Product.findOne({ _id: productId }, (err, item) => {
            if (err) {
                console.log(err);
            } else {
                res.render("ProductPage", { product: item, user: signedUser });
            }
        });
    }
});


// catigories of products
app.post("/catigory",(req,res) => {
    if (!signed) {
        console.log("You need to Sign In first!")
        res.redirect("/");
    } else {
        const catigory1 = req.body.catigory1;
        const catigory2 = req.body.catigory2;
        Product.find({catigory1: catigory1 , catigory2: catigory2}, function(err,items){
            if (err) {
                console.log(err);
            } else {
                res.render("main", { products: items, user: signedUser });
            }
        });
    }
});



// Cart
app.get("/cart", function (req, res) {
    res.render("cart",{user: signedUser})
})


//add to cart
app.post("/addToCart", (req, res) => {
    const page = req.body.page;
    const productNumber = req.body.number;
    const productId = req.body.id;
    Product.findOne({_id:productId},(err1,foundProduct) => {
        if(err1){
            console.log(err1);
        }else{
            let obj1 = {
                product: foundProduct,
                number: productNumber
            }
            User.findOneAndUpdate({ _id: signedUser._id }, { $push: { cart: obj1 } } , function (err2,item) {
                if (err2) {
                    console.log(err2);
                } else {
                    console.log("product added to cart!");
                    console.log(signedUser.cart);
                    res.render(page, { product: foundProduct, user: signedUser });
                }
            });
        }
    });
    
});


//Personal Profile
app.get("/profile", function (req, res) {
    if (!signed) {
        console.log("You need to Sign In first!")
        res.redirect("/");
    } else {
        res.render("PersonalProfile", { user: signedUser })
    }
})


// Add Pyament
// app.post("/addPayment",function(req,res){
//     User.updateOne({_id:signedUser._id},{ $push:{payments:{}} })
// })

// remove payment

// Edit payment






//listening to the Port.
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function () {
    console.log("server has started successfully");
});
