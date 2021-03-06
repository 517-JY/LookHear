const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Authentication Modules

const session = require('express-session')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
User = require('./models/user.model.js')
Piece = require('./models/pieces.model.js');
flash = require('connect-flash')

// End of Authentication Modules

// Authentication

let GoogleStrategy = require('passport-google-oauth').OAuth25Strategy;
const passport = require('passport')
const configPassport = require('./config/passport')
configPassport(passport)

// End of Authentication

const app = express();

app.use(fileUpload({
    createParentPath: true
}));


// Middleware
app.use(bodyParser.json());  // commented out 11/13/2019
app.use(bodyParser.urlencoded({extended: true}))

// Database Configuraiton

let dbConfig = require('./config/mongodb.config.js');
let mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect( dbConfig.url, { useNewUrlParser: true } );
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!!!")
});

// End of Database Configuration

// View Engine Setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', 6500);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// End of View Engine Setup

// to handle all static routes
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Routes

app.use(session(
  { secret: 'ufiods78432jkls',
    resave: false,
    saveUninitialized: false }));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());



const approvedLogins = ["tjhickey@brandeis.edu"]

// Check for logged in status
app.use((req, res, next) => {
  res.locals.title = "LookHear"
  res.locals.loggedIn = false
  if (req.isAuthenticated()){
    res.locals.user = req.user
    res.locals.loggedIn = true
  } else {
    res.locals.loggedIn = false
  }
  next()
})

// Auth routes

app.get('/loginerror', function(req,res){
  res.render('loginerror',{})
})

app.get('/login', function(req,res){
  res.render('login',{})
})

// Route for log out
app.get('/logout', function(req, res){
  req.session.destroy((error) => { console.log("Error in destroying session: " + error)});
  req.logout();
  res.redirect('/lookhear');
})

// Google Routes

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email']}));

app.get('/login/authorized',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/loginerror'
  })
);

// Route to ensure login
function isLoggedIn(req, res, next){
  res.locals.loggedIn = false
  if (req.isAuthenticated()){
    res.locals.loggedIn = true
    return next();
  } else {
    res.redirect('/login');
  }
}

//app.use(isLoggedIn)

// End of Authentication Routes

let indexRouter = require('./routes/index');
let lookhearRouter = require('./routes/lookhear');
let videodemoRouter = require('./routes/videodemo');
let multivideodemoRouter = require('./routes/multivideodemo');
let usersRouter = require('./routes/users');
let animatepageRouter = require('./routes/animatepage');
let piecesRouter = require('./routes/pieces.routes');
let formRouter = require('./routes/form');


app.use('/lookhear', lookhearRouter);
app.use('/videodemo', videodemoRouter);
app.use('/multivideodemo', multivideodemoRouter);
app.use('/users', usersRouter);
app.use('/animatepage', animatepageRouter);
app.use('/pieces', piecesRouter);
app.use('/form', formRouter);

app.use('/lookhear2', (req,res) => {
  res.render('lookhear')
})
app.use('/', (req,res)=> {
  Piece.find()
  .then(pieces => {
      let allPieces = pieces;
      res.render('mainpage', { pieces: allPieces })
  }).catch(err => {
      let allPieces = [];
      res.render('mainpage', { pieces: allPieces })
  })
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
