var express = require("express");
const userModel = require("../models/userModel");
var nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const { authenticated } = require("../middleware/userAuth");
const router = express.Router();
const locations = ["Toronto", "Montreal", "Vancouver"]

router.get("/", function (req, res) {
    if (req.session.user) {
      res.locals.user = req.session.user;
      res.render('home', 
      { 
        fname: req.session.user.fname, 
        lname: req.session.user.lname, 
        isAdmin: req.session.user.isAdmin,
        locations  
    });
    } else {
      res.render('home', {locations});
    }
});
  

router.get("/registration",(req,res)=>{
    res.render("registration");
});
router.post("/registration", (req, res) => {

    const errors = [];
    const {fname,lname, email, password2, pwdMatch} = req.body;
    if (fname === "" || lname === "") {
        errors.push("Enter your name");
    }
  
    if (password2 === "") {
        errors.push("Enter your password" );
    }
    else {
        const passwd = /(?=.*[A-Z])/;   
        if(password2.length < 6 || password2.length > 12)
        {
        errors.push("Please enter between 6 - 12 characters");
        }
       if (!passwd.test(`${password2}`)) 
       {
        errors.push( "Please contain at least one uppercase");
       }
    }
    if (`${pwdMatch}` !== `${password2}`) {
        errors.push("Password is not matching");
    }

    if (email === "") {
        errors.push( "Enter your email");
    }

    //There is an error
    if (errors.length > 0) {
        res.render("registration", {
            messages: errors,
         
        })
    }
    // there is no error
    else {
        userModel.findOne({ email: req.body.email })
            .then((user) => {
                //there was matching email
                if (user) {
                    errors.push("This email is already in use");
                    res.render("registration", {
                        messages: errors,
                    })

                } else {

                   const newUser = {
                        fname: fname,
                        lname: lname,
                        email: email,
                        password2: password2
                    }

                    const register = new userModel(newUser);
                    register.save()
                        .then(() => {
                            console.log('Your information was successfully inserted into database')
                        })
                        .catch(err => {
                            console.log(`Error occurs while inserting data into database ${err}`);
                    });
                        
                    //Sending email when registered successfully
                    var transporter = nodemailer.createTransport({
                        service:'gmail',
                        host: 'smtp.gmail.com',
                        secure: false,
                        port: 587,
                        ignoreTLS: false,
                        auth: {
                            user:process.env.NODEMAILER_EMAIL,
                            pass:process.env.NODEMAILER_PWD
                        }
                    });
      
                    var emailOptions = {
                        from:process.env.NODEMAILER_EMAIL,
                        to: req.body.email,
                        subject:'Tamhome',
                        html: '<p>Hello '+req.body.fname + '</p><p>Thank you for signing up at Tamhome. </p>'
                    }
    
                    transporter.sendMail(emailOptions, (error, info)=> {
                        if (error) { 
                        console.log("Error: " + error); 
                        }
                        console.log("Success: " + info.response);
                });
                res.redirect('/login');
            }
        });
    }           
});

router.get("/login",(req,res)=>{
    res.render("login");
});

router.post("/login", (req,res)=>{
    const errors = [];
    const email = req.body.email;
    const password2 = req.body.password2;

    if (email === "" || password2 === "" ) {
        errors.push( "Both are required");
    }
  
    //There is an error
    if (errors.length > 0) {
        res.render("login", {
            messages: errors,
        })
    }
    // there is no error
    else {
        userModel.findOne({ email: req.body.email })
        .exec()    
        .then((user) => {
                //there was no matching username
                //Cannot find user
                console.log("user:", user)
                if (user === null) {
                    errors.push("You enter wrong email");
                    res.render("login", {
                        messages: errors
                    })

                }
                //Email matching
                else {
                    bcrypt.compare(req.body.password2, user.password2)
                        .then((isCorrect) => {
                            if (isCorrect == true) {
                                // req.session.userInfo = {
                                //     isAdmin:user.isAdmin,
                                //     fname:user.fname,
                                //     lname:user.lname,
                                //     email: user.email ,
                                //     password2: user.password2
                                // };
                                req.session.user = user;
                                console.log("session:", req.session.user);

                                
                                if(!user.isAdmin)
                                {
                                    res.redirect('/userDashboard');
                                //   res.render('userDashboard', { fname: user.fname, lname: user.lname, isAdmin: user.isAdmin });
                                }
                                else 
                                {
                                    res.redirect('/adminDashboard');
                                //   res.render('adminDashboard', { fname: user.fname, lname: user.lname, isAdmin: user.isAdmin });
                                }
                            }
                            //password doesn't match
                            else {
                                errors.push( "Your password does not match" );
                                res.render("login", {
                                    messages: errors
                                })
                            }
                        })
                        .catch(err =>{
                            errors.push(`Error happened while verifying password ${err}`)
                            res.render("login", {
                                messages: errors
                            })
                        
                        });
        
                     }
                })
            .catch(err => {
               errors.push(`Error happened while verifying email ${err}`)
                res.render("login", {
                    messages: errors
                })
            });
         }
});


router.get("/logout", authenticated, (req,res)=>{
    req.session.destroy();
    req.session.reset();
    res.redirect('/');
})


router.get("/userDashboard", authenticated, function (req, res) {
    res.render('userDashboard', { fname: req.session.user.fname, lname: req.session.user.lname});
});

router.get("/adminDashboard", authenticated, function (req, res) {
    res.render('adminDashboard', { fname: req.session.user.fname, lname: req.session.user.lname, isAdmin: req.session.user.isAdmin });
});

  
module.exports=router;






