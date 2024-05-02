const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcrypt');
const multer = require('multer')
// const sequelize = require('sequelize');
const db = require("./models");
const { Users, Department } = require("./models");

const app = express()
const port = 5000

const {createtoken, validatetoken} = require('./jwt');

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser());

// app.use(validatetoken);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

var loginValidate = [check('password').isLength({ min: 6 }).withMessage('Password Must Be at Least 6 Characters'),
                    check('email').isLength({ min: 4 }).withMessage('Email Must Be at Least 4 Characters'),
                    check('email').isEmail().withMessage('Email Wrong'),
                    ];

// app.post('/register',[check('body.username').isLength(8).withMessage("Username is too short")], (req, res) => {
// app.post('/register',loginValidate, (req, res) => {

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});
const upload1 = multer({ storage: storage });
// const upload = upload1.single('file');
var errors = '';
// const loginValidate1 = function (req,res,next) {
//     try {
//         errors = validationResult(req);
//         console.log(errors);
//         if(!errors.isEmpty()) {
//             // return res.status(422).jsonp(errors.array())
//             const alert = errors.array();
//             var alertm = alert[0].msg;
//             res.render('profile', {
//                 username,alertm
//             });
//             // next();
//             validationResult(req).throw();
//         } else {
//             next();
//             // validationResult(req).throw();
//         }
//         // validationResult(req).throw();
        
//     } catch(error) {
//         res.send(error);
//     }
// }
app.post('/register',upload1.single('file'),loginValidate, async (req, res) => {
    console.log(req.body);
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var filename = req.file.filename;
    // console.log(username);
    errors = validationResult(req);
    console.log(errors);
    if(!errors.isEmpty()) {
        // return res.status(422).jsonp(errors.array())
        const alert = errors.array();
        var alertm = alert[0].msg;
        res.send(alertm);
        return;
    }
    const user = await Users.findOne({ where: { email: email } });

    if (user) res.status(400).json({ error: "User Already Exist" });
    // connection.query(`SELECT id FROM users WHERE email = '${email}'`, function (error, results, fields) {

    if(!user) {
        // if (error) res.send(error);
        // if(Object.keys(results).length>0) {
        //     console.log(results);
        //     res.send("Multiple records are there");
        // } else {
            

            bcrypt.hash(password, 10, function(err, hash) {
                // upload(req, res, function (err) {
                // });
                Users.create({
                    email: email,
                    username: username,
                    password: hash,
                    profile: filename,
                });
                
                res.send("SUCCESS");
            });
        // }
        // console.log('The solution is: ', results[0].solution);
    }
})
app.post('/login', async (req, res) => {
    console.log(req.body.email);
    var email = req.body.email;
    var password = req.body.password;

    const user = await Users.findOne({ where: { email: email } });
    if (!user) res.status(400).json({ error: "No User" });
    if(user) {
        // console.log(user.username);
            var hash = user.password;
            bcrypt.compare(password, hash, function(err, result) {
                if(result==true) {
                    const accessToken = createtoken(email);

                    if(accessToken) {
                        res.cookie("access-token", accessToken, {
                            maxAge: 60 * 60 * 24 * 30 * 1000,
                            httpOnly: true,
                        });

                        // req.session.user = email;
                        // req.session.save();
                        res.send("SUCCESS");
                        // res.render('index',{email: email})
                    } else {
                        res.send("TOKEN MISMATCH");
                        // res.render('index',{email: ''})
                    }
                } else {
                    res.send("Password not match");
                }
            });
        }
})

app.get('/profile', validatetoken, (req, res) => {
    res.send("Hello"+ req.data);
});

app.post('/update', validatetoken, async (req, res) => {
    var email = req.data;
    var username = req.body.username;
    console.log(email);
    console.log(username);
    const user = await Users.update({ username: username },{ where: { email: email } });
    if(user) {
        console.log(user);
        res.send("SUCCESS");
    } else {
        res.send("Fail");
    }
});
app.get('/list', validatetoken, async (req, res) => {
    var email = req.data;
    const user = await Users.findOne({ where: { email: email } });
    if (!user) res.status(400).json({ error: "No User" });
    console.log(user.id);
    if(user) {
        const dept = await Department.findAndCountAll({ where: { userid: user.id } });
        if(dept) {
            return res.json(dept);
        } else {
            res.send("Fail");
        }
    }
});
// db.sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log("SERVER RUNNING ON PORT 3001");
  });
// });