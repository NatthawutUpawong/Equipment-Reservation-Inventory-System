const express = require('express')
const ejs = require('ejs')
const session = require('express-session')
const flssh = require('connect-flash')
const path = require('path')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const saltRounds = 10;
var jwt = require('jsonwebtoken')
const router = express.Router();
const MemoryStore = require('memorystore')(session);
const upload = require("./config/uploadConfig");


const secret = 'FT_login'

// set the public folder
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded())
app.use(flssh())
app.set('view engine', 'ejs')

app.listen(3000, function () {
  console.log('server listening on port 3000')
})

// mysql2
const mysql = require('mysql2');
const { request } = require('http')

// create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'project' //db name 
});
// ------------db check----------------------
connection.connect((error) => {
  if (error) {
    console.log(error, "db connect erro")
  } else {
    console.log("connect..")
  }
})

// create application/json parser
var jsonParser = bodyParser.json()

app.use(cors())

// for json exchange
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//session
app.use(session({
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, //1 day in millisec
  secret: 'mysecretcode',
  resave: false,
  saveUninitialized: true,
  // config MemoryStore here
  store: new MemoryStore({
    checkPeriod: 24 * 60 * 60 * 1000 // prune exloginpired entries every 24h
  })
}));

// ------------------------------------------------------------current datetime  -------------//
app.get("/now", function (req, res) {
  const dt = new Date();
  res.send(dt);
});
// ------------------------------------------------------------current datetime  -------------//




// ------------------------------------------------------------for all  -------------//
// login
app.post('/login', jsonParser, function (req, res, next) {
  connection.execute(
    'SELECT user_id, user_password, user_role, user_username FROM user WHERE user_username = ?',
    [req.body.user_username],
    function (err, user, fields) {
      if (err) { return res.status(500).send("Database server error") }
      if (user.length == 0) { return res.status(401).send("Wrong username"); }
      bcrypt.compare(req.body.user_password, user[0].user_password, function (err, isLogin) {
        if (isLogin) {
          req.session.userID = user[0].user_id
          req.session.username = user[0].user_username
          req.session.role = user[0].user_role
          // var token = jwt.sign({ U_username: user[0].U_username }, secret, { expiresIn: '1h' });
          // res.json({ status: 'ok', message: 'login success', role: user[0].U_role, ID: user[0].U_id, username: user[0].U_username})

          // role
          if (user[0].user_role == 1) {
            //admin
            res.send('/dashboard')
          }
          else if (user[0].user_role == 2) {
            //teacher
            res.send('/dashboardteacher')
          }
          else if (user[0].user_role == 3) {
            //user
            res.send('/homeuser')
          }

          // res.send('Login success')
        } else {
          // res.status(401).send('Login failed')

          res.status(400).send("Wrong password");
        }
      });
    }
  );
});

// ---------- get user -----------
app.get('/user', function (req, res) {
  if(req.session.username){
    res.json({
      'userID': req.session.userID, 'username': req.session.username, 'role': req.session.role
    });
  }
  else{
    res.status(401).send("No user info");
  }

});



// ---------- get item(id) -----------//
app.get('/getproduct/:id', function (req, res, next) {
  connection.execute(
    'SELECT * FROM product WHERE pro_id = ?',
    [req.params.id],
    function (err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: 'db sever error' });
        return;
      }

      if (results.length === 0) {
        res.json({ status: 'error', message: 'Product not found' });
      } else {
        const product = results[0];
        res.json({ status: 'success', product: product });
      }
    }
  );
});



// ---------- get item(all) -----------//
app.get('/getallproducts', function (req, res, next) {
  connection.execute(
    'SELECT * FROM product',
    function (err, results, fields) {
      if (err) {
        res.json.status(500)({ status: 'error', message: err });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ status: 'error', message: 'No products found' });
      } else {
        res.json({ status: 'success', products: results });
      }
    }
  );
});
// -----------------------------------------------------------for all  -------------//



// ---------------------------------------------------------- for admin -----------//
//---------------update item--------------//

//---------------aad item--------------//
app.post('/addproduct', jsonParser, function (req, res, next) {
  // Generate a random 5-digit ID
  const randomId = Math.floor(1000 + Math.random() * 9000);

  connection.execute(
    'INSERT INTO product (pro_id, pro_name, pro_detail, pro_category, pro_image, pro_status) VALUES (?, ?, ?, ?, ?, ?)',
    [randomId, req.body.pro_name, req.body.pro_detail, req.body.pro_category, req.body.pro_image, req.body.pro_status],
    function (err, results, fields) {
      if (err) {
        res.status(500).json({ status: 'error', message: err });
        return;
      }
      res.json({ status: 'add product success' });
    }
  );
});

//////////////////////update
app.put('/updateProduct/:id', function (req, res, next) {
  const productId = req.params.id;
  const updatedProduct = req.body;

  connection.execute(
    'UPDATE product SET pro_name = ?, pro_detail = ?, pro_category = ?, pro_status = ?, pro_image = ? WHERE pro_id = ?',
    [updatedProduct.pro_name, updatedProduct.pro_detail, updatedProduct.pro_category, updatedProduct.pro_status, updatedProduct.pro_image, productId],
    function (err, results, fields) {
      if (err) {
        res.status(500).json({ status: 'error', message: err.sqlMessage });
        return;
      }

      if (results.affectedRows === 0) {
        res.status(401).json({ status: 'error', message: 'Product not found' });
      } else {
        res.json({ status: 'success', message: 'Product updated successfully' });
      }
    }
  );
});

// ----------------return item
app.put('/returnitme/:id', function (req, res, next) {
  const borrow = req.body;
  const borid = req.params.id;
  let itemstatus = '0';
  let productId = ''; // Declare the variable for productId

  connection.beginTransaction(function (err) {
    if (err) {
      res.status(500).json({ status: 'error', message: 'Transaction begin error', error: err });
      return;
    }

    connection.query(
      'UPDATE borrowdetail SET ret_status = ? WHERE bor_id  = ?',
      [borrow.bor_status, borid],
      function (err, result1) {
        if (err) {
          return connection.rollback(function () {
            res.status(500).json({ status: 'error', message: 'Error updating table1', error: err });
          });
        }

        // Retrieve the productId from borrowdetail
        connection.query(
          'SELECT * FROM borrowdetail WHERE bor_id = ?',
          [borid],
          function (err, result) {
            if (err) {
              return connection.rollback(function () {
                res.status(500).json({ status: 'error', message: 'Error retrieving productId', error: err });
              });
            }

            if (result.length > 0) {
              productId = result[0].pro_id;
            }
            // res.json({ message: productId, });

            // Continue with the second update statement
            if (borrow.bor_status == 'success') {
              itemstatus = '1';
            }
            else if (updatedborrow.bor_status == 'Disapproved') {
              itemstatus = '1';
            }

            connection.query(
              'UPDATE product SET pro_status = ? WHERE pro_id = ?',
              [itemstatus, productId],
              function (err, result2) {
                if (err) {
                  return connection.rollback(function () {
                    res.status(500).json({ status: 'error', message: 'Error updating status', error: err });
                  });
                }

                connection.commit(function (err) {
                  if (err) {
                    return connection.rollback(function () {
                      res.status(500).json({ status: 'error', message: 'Transaction commit error', error: err });
                    });
                  }

                  res.json({ status: 'success', message: 'Data updated in both tables successfully', });
                });
              }
            );
          }
        );
      }
    );
  });
});

// ============= Upload ==============
app.post("/uploading", function (req, res) {
  upload(req, res, function (err) {
    // req.file is the file from <input type="file" name="filetoupload">
    // req.body will hold the text fields, if there were any
    if (err) {
      console.log(err);
      res.status(500).send("Upload failed");
    }
    else {
      // res.send("Upload is succesful");
      const renamedFileName = req.file.filename;

      // Send a response with the renamed file name
      res.status(200).json({ message: 'Upload is successful', fileName: renamedFileName });
    }
  })
});

// --------------------------------------------------------- out of admin -----------//



// --------------------------------------------------------- teacher ---------------//
// get borrow requirement for teacher to get requirement form user
app.get('/getborrowrequirement', function (req, res, next) {
  connection.execute(
    `
    SELECT 
      borrowdetail.*, 
      product.pro_name,
      user.user_name 
      FROM 
      borrowdetail 
      INNER JOIN product ON borrowdetail.pro_id = product.pro_id 
      INNER JOIN user ON borrowdetail.user_id  = user.user_id
      ORDER BY borrowdetail.req_date;
    `,
    function (err, results, fields) {
      if (err) {
        res.json.status(500)({ status: 'error', message: err });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ status: 'error', message: 'No requirement found' });
      } else {
        res.json({ status: 'success', products: results });
      }
    }
  );
});

// Confirm request
app.put('/confirmborrow/:id', function (req, res, next) {
  const updatedborrow = req.body;
  const itemId = req.params.id;
  let itemstatus = '0';
  let productId = ''; // Declare the variable for productId

  connection.beginTransaction(function (err) {
    if (err) {
      res.status(500).json({ status: 'error', message: 'Transaction begin error', error: err });
      return;
    }

    connection.query(
      'UPDATE borrowdetail SET bor_status = ?, ret_status = ?, bor_annotation_teacher = ? WHERE bor_id  = ?',
      [updatedborrow.bor_status, updatedborrow.bor_status, updatedborrow.bor_annotation_teacher, itemId],
      function (err, result1) {
        if (err) {
          return connection.rollback(function () {
            res.status(500).json({ status: 'error', message: 'Error updating table1', error: err });
          });
        }

        // Retrieve the productId from borrowdetail
        connection.query(
          'SELECT * FROM borrowdetail WHERE bor_id = ?',
          [itemId],
          function (err, result) {
            if (err) {
              return connection.rollback(function () {
                res.status(500).json({ status: 'error', message: 'Error retrieving productId', error: err });
              });
            }

            if (result.length > 0) {
              productId = result[0].pro_id;
            }
            // res.json({ message: productId, });

            // Continue with the second update statement
            if (updatedborrow.bor_status == 'Approved') {
              itemstatus = '0';
            } else if (updatedborrow.bor_status == 'Disapproved') {
              itemstatus = '1';
            }

            connection.query(
              'UPDATE product SET pro_status = ? WHERE pro_id = ?',
              [itemstatus, productId],
              function (err, result2) {
                if (err) {
                  return connection.rollback(function () {
                    res.status(500).json({ status: 'error', message: 'Error updating table2', error: err });
                  });
                }

                connection.commit(function (err) {
                  if (err) {
                    return connection.rollback(function () {
                      res.status(500).json({ status: 'error', message: 'Transaction commit error', error: err });
                    });
                  }

                  res.json({ status: 'success', message: 'Data updated in both tables successfully', });
                });
              }
            );
          }
        );
      }
    );
  });
});

// get history that Approved
app.get('/getApprovedsuccess', function (req, res, next) {
  const borstatus = 'success';

  connection.execute(
    `
    SELECT 
      borrowdetail.*, 
      product.pro_name,
      user.user_name
      FROM 
      borrowdetail 
      INNER JOIN product ON borrowdetail.pro_id = product.pro_id 
      INNER JOIN user ON borrowdetail.user_id  = user.user_id
    WHERE 
      borrowdetail.ret_status = ?
      ORDER BY 
    borrowdetail.req_date;
    `,
    [borstatus],
    function (err, results, fields) {
      if (err) {
        res.status(500).json({ status: 'error', message: err });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ status: 'error', message: 'Requirement not found' });
      } else {
        res.json({ status: 'success', requirement: results });
      }
    }
  );
});

// get require that teacher appoved
app.get('/getuserApproved', function (req, res, next) {
  const borstatus = 'Approved';

  connection.execute(
    `
    SELECT 
      borrowdetail.*, 
      product.pro_name,
      user.user_username 
      FROM 
      borrowdetail 
      INNER JOIN product ON borrowdetail.pro_id = product.pro_id 
      INNER JOIN user ON borrowdetail.user_id  = user.user_id
    WHERE 
      borrowdetail.ret_status = ?
    `,
    [borstatus],
    function (err, results, fields) {
      if (err) {
        res.status(500).json({ status: 'error', message: err });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ status: 'error', message: 'Requirement not found' });
      } else {
        res.json({ status: 'success', requirement: results });
      }
    }
  );
});
// get all require 
app.get('/getallrequire', function (req, res, next) {
  connection.execute(
    'SELECT * FROM borrowdetail',
    function (err, results, fields) {
      if (err) {
        res.json.status(500)({ status: 'error', message: err });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ status: 'error', message: 'No products found' });
      } else {
        res.json({ status: 'success', allrequire: results });
      }
    }
  );
});
// = out of teacher


////////////////////////////// for user
// ----register
app.post('/register', jsonParser, function (req, res, next) {
  // hash pss
  bcrypt.hash(req.body.user_password, saltRounds, function (err, hash) {
    // Store hash in your password DB.
    connection.execute(
      'INSERT INTO user (user_id , user_username, user_password, user_name, user_role, user_image, user_phone) VALUES(?, ?, ?, ?, ?, ?, ?)',
      [req.body.user_id,
      req.body.user_username,
        hash,
      req.body.user_name,
        3,
      req.body.user_image,
      req.body.user_phone],
      function (err, results, fields) {
        if (err) {
          res.status(500).json({ status: 'error', message: 'This id is already used' });
          return
        }
        res.json({ status: 'ok' })

      }
    );
  });
});

//get ownborrowrequirement

app.get('/getborrowrequirementuser', function (req, res, next) {
  const borrowId = req.session.userID;

  connection.execute(
    `
    SELECT 
      borrowdetail.*, 
      product.pro_name,
      teacher.tec_name 
      FROM 
      borrowdetail 
      INNER JOIN product ON borrowdetail.pro_id = product.pro_id 
      INNER JOIN teacher ON borrowdetail.tec_id  = teacher.tec_id
    WHERE 
      borrowdetail.user_id = ?
      ORDER BY 
    borrowdetail.req_date;
    `,
    [borrowId],
    function (err, results, fields) {
      if (err) {
        res.status(500).json({ status: 'error', message: err });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ status: 'error', message: 'Requirement not found' });
      } else {
        res.json({ status: 'success', requirement: results });
      }
    }
  );
});

// borrow items
app.post('/borrow', jsonParser, function (req, res, next) {
  // Generate a random 5-digit ID
  const randomId = Math.floor(10000 + Math.random() * 90000);
  const tec_id1 = 21354687;
  // const user_id1 = 1;
  const statuspendin = 'pending';

  connection.execute(
    'INSERT INTO borrowdetail (bor_id, pro_id, user_id, tec_id, bor_date, bor_ret_date, bor_status, req_date ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [randomId, req.body.pro_id, req.session.userID, tec_id1, req.body.bor_date, req.body.bor_ret_date, statuspendin, req.body.req_date],
    function (err, results, fields) {
      if (err) {
        res.status(500).json({ status: 'error', message: err });
        return;
      }
      res.json({ status: 'borrow success' });
    }
  );
});



// page routes
// controllers user
// const indexcontroller = require('./controllers/indexcontroller')
const logincontroller = require('./controllers/logincontroller')
const registercontroller = require('./controllers/registercontroller')
const dashboardcontroller = require('./controllers/dashboardcontroller')
const homeusercontroller = require('./controllers/homeusercontroller')
const usersearchcontroller = require('./controllers/usersearchcontroller')
const userstatuschcontroller = require('./controllers/userstatuschcontroller')
const logoutcontroller = require('./controllers/logoutcontroller')
const getdetailcontroller = require('./controllers/getdetailcontroller')

// controllers addmin
// const loginAddmincontroller = require('./controllers/loginAddmincontroller')
const searchAddmincontroller = require('./controllers/searchAddmincontroller')
const historyaddmincontroller = require('./controllers/historyaddmincontroller ')
const requirementaddmincontroller = require('./controllers/requirementaddmincontroller')
const editadmincontroller = require('./controllers/editadmincontroller')
const additemcontroller = require('./controllers/additemcontroller')

//teacher controller
const dashboardteachercontroller = require('./controllers/dashboardteachercontroller')
const itemteachercontroller = require('./controllers/itemteachercontroller')
const historyteachercontroller = require('./controllers/historyteachercontroller')
const requirementteachercontroller = require('./controllers/requirementteachercontroller')


// middleware
const redirectIfAuth = require('./middlewere/redirectIfAuth')
const authMiddleware = require('./middlewere/authMiddleware')
const userMiddleware = require('./middlewere/userMiddleware')
const addminMiddleware = require('./middlewere/addminMiddleware')
const teacherMiddleware = require('./middlewere/teacherMiddleware')

app.get('/logout', logoutcontroller)


// page routes user
app.get('/', redirectIfAuth, logincontroller)
app.get('/login', redirectIfAuth, logincontroller)
app.get('/usersearch', usersearchcontroller)
app.get('/register', redirectIfAuth, registercontroller)
app.get('/homeuser', authMiddleware, teacherMiddleware, addminMiddleware, homeusercontroller,)
app.get('/userstatus', authMiddleware, teacherMiddleware, addminMiddleware, userstatuschcontroller)
app.get('/getdetail', authMiddleware, teacherMiddleware, addminMiddleware, getdetailcontroller)

// page routes addmin
// app.get('/loginAddmin', loginAddmincontroller)
app.get('/dashboard', authMiddleware, teacherMiddleware, userMiddleware, dashboardcontroller,)
app.get('/itemAddmin', authMiddleware, teacherMiddleware, userMiddleware, searchAddmincontroller)
app.get('/historyaddmin', authMiddleware, teacherMiddleware, userMiddleware, historyaddmincontroller)
app.get('/Borrowingaddmin', authMiddleware, teacherMiddleware, userMiddleware, requirementaddmincontroller)
app.get('/editadmin', authMiddleware, teacherMiddleware, userMiddleware, editadmincontroller)
app.get('/additem', authMiddleware, teacherMiddleware, userMiddleware, additemcontroller)

//page routes teacher
// dashboardteachercontroller
app.get('/dashboardteacher', authMiddleware, addminMiddleware, userMiddleware, dashboardteachercontroller)
app.get('/itemteacher', authMiddleware, addminMiddleware, userMiddleware, itemteachercontroller)
app.get('/historyteacher', authMiddleware, addminMiddleware, userMiddleware, historyteachercontroller)
app.get('/requirementteacher', authMiddleware, addminMiddleware, userMiddleware, requirementteachercontroller)

// root service




