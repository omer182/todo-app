'use strict'
const PG_CONNECTION_STRING = "postgres://vxuexuzwpnpvlc:38bd6effda432c4316e42e1dbb7ece42b6219f4ec916e42a330fa7e3c1d47877@ec2-54-247-64-64.eu-west-1.compute.amazonaws.com:5432/db0bmso7ob9spc";
var express = require('express'),
    app = express(),
    path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    http = require('http'),
    uuid = require('uuid/v1'),
    userPassMap = {},
    userIdMap = {},
    itemList = [],
    userIdCounter = 1,
    pg = require('pg');

app.get('/db', function (request, response) {
    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        client.query('SELECT * FROM test_table', function (err, result) {
            done();
            if (err) {
                console.error(err);
                response.send("Error " + err);
            } else {
                response.render('pages/db', {
                    results: result.rows
                });
            }
        });
    });
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});




app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(cookieParser());

//assuming app is express Object.
app.get('/', function (req, res) {
    if (userIdMap[req.cookies.uid]) {
        res.sendFile(__dirname + '/front/index.html');
    } else {
        res.sendFile(__dirname + '/front/login.html');
    }
});

app.get('/register', function (req, res) {
    res.sendFile(__dirname + '/front/register.html');
});

app.use("/styles/", express.static(__dirname + '/front/styles/'));

app
    .route('/login/:user/:password')
    .post(function (req, res) {

    pg.connect(PG_CONNECTION_STRING, function (err, client, done) {
        client.query(`SELECT * FROM Users WHERE Name='${req.params.user}' AND Password='${req.params.password}'`, function (err, result) {
            if(err) {
                return;
            }
            
            console.log(results);

            var user = userPassMap[req.params.user];
            if (user) {
                if (user === req.params.password) {
                    res.status(200);
                    res.cookie('uid', Object.keys(userPassMap).indexOf(req.params.user) + 1, {
                        maxAge: 60 * 60 * 1000
                    });
                    res.json({
                        status: 'logged in successfuly'
                    })
                    return;
                }
            }
            res.status(500);
            res.json({
                status: 'incorrect user or password'
            });

        });
    });

    });

app
    .route('/register/:user/:password')
    .post(function (req, res) {
        var user = req.params.user;
        var isUserRegistered = userPassMap[user];
        if (isUserRegistered) {
            res.status(500);
            res.json({
                status: 'user already registered, please choose a different username'
            })
        } else {
            res.status(200);
            userPassMap[user] = req.params.password;
            userIdMap[userIdCounter] = user;
            userIdCounter++;
            res.json({
                status: 'registered successfuly with username: ' + user
            })
        }
    });

app.use('/', function (req, res, next) {
    if (userIdMap[req.cookies.uid]) {
        renewCookie(req, res); // wrap with promise
        next();
    } else {
        res.status(400);
        res.json({
            status: 'please login to renew your cookie license'
        });
    }
});

app
    .route('/item')
    .post(function (req, res) {
        itemList.push({
            id: uuid(),
            data: req.body,
            uid: req.cookies.uid
        });
        res.status(200);
        res.json({
            status: 'item posted to list successfuly'
        });
    });

app
    .route('/items')
    .get(function (req, res) {
        res.status(200);
        res.send(itemList.filter(function (item) {
            return item.uid == req.cookies.uid
        }));
    });

app
    .route('/items/:id')
    .get(function (req, res) {
        var item = itemlist.filter(function (v) {
            return vid === req.params.id
        })[0];
        if (item) {
            res.status(200);
            res.send(item);
        } else {
            res.status(404);
            res.json({
                status: 'item with id ' + req.params.id + 'not found'
            });
        }
    });

app
    .route('/item/:id')
    .delete(function (req, res) {
        var item = itemList.splice(itemList.findIndex(x => x.id === req.params.id), 1)[0];
        if (item) {
            res.status(200);
            res.json({
                status: 'item with id ' + req.params.id + ' deleted'
            });
        } else {
            res.status(404);
            res.json({
                status: 'item with id ' + req.params.id + ' not found'
            });
        }
    });

app
    .route('/item/:id')
    .put(function (req, res) {
        var index = itemList.findIndex(x => x.id === req.params.id);
        if (index != -1) {
            itemList[index].data.data = req.body.data;
            res.status(200);
            res.json({
                status: 'item with id ' + req.params.id + ' updated'
            });
        } else {
            res.status(404);
            res.json({
                status: 'item with id ' + req.params.id + ' not found'
            });
        }
    });

//PORT SETUP
var port = normalizePort(process.env.PORT || '54321');

app.listen(port, function () {
    console.log('app started, listening on port: ' + port);
});

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}

function renewCookie(req, res) {
    var uid = req.cookies.uid;
    res.cookie('uid', uid, {
        maxAge: 60 * 60 * 1000
    });
}



// CREATE TABLE Users (
//     ID SERIAL,
//     Name varchar(255) NOT NULL,
//     Password varchar(255) NOT NULL,
//     PRIMARY KEY (ID)    
// );

// CREATE TABLE TODO (
//     ID SERIAL,
//     Todo varchar(255) NOT NULL,
//     UID int NOT NULL,
//     IsChecked BOOLEAN,
//     PRIMARY KEY (ID)
// );


