const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs=require('express-handlebars')
const db = require('./config/connection');
const session = require('express-session')
const fileUpload=require('express-fileupload')
const sweetalert=require('sweetalert')
const nocache=require('nocache')
const dotenv=require('dotenv')



dotenv.config()
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
//layout setup
app.engine('hbs',hbs.engine({
 helpers:{
  inc:(value)=>{
    return parseInt(value)+1
  }
 } ,extname:'hbs',layoutsDir:__dirname+'/views/layouts/', userDir:__dirname+'/views/user/',adminDir:__dirname+'/views/admin/'}));
 //
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(nocache())


//mongodb connect
db.connect((err)=>{
  if(err) console.log("connection error"+err)
  else console.log("database connected successfully")
})

app.use(session({secret:'key',saveUninitialized:true,resave:false,cookie:{maxAge:600000}}))

app.use('/', userRouter);
app.use('/admin', adminRouter);

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
  res.render('error',{layout:'user-layouts'});
});

module.exports = app;
