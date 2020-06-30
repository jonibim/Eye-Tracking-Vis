let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let fileUpload = require('express-fileupload');
let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');

let app = express();

//default options
app.use(fileUpload());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'),{ dotfiles: 'allow' }));
//app.use("/.well-known/acme-challenge", express.static("public/.well-known/acme-challenge"));
//app.use(express.static(__dirname, { dotfiles: 'allow' } ));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/visualization', require('./routes/visualization'));
app.use('/dataset', require('./routes/dataset'));
app.use('/upload', require('./routes/upload'));
app.use('/about', require('./routes/about'));

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

var http = require('http');
http.createServer(function (req, res) {

    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });

    res.end();

}).listen(80);
//http.get('*', function(req, res) {  
  //res.redirect('https://' + req.headers.host + req.url);
  // Or, if you don't want to automatically detect the domain name from the request header, you can hard code it:
  // res.redirect('https://example.com' + req.url);
//})

//http.listen(8080);


module.exports = app;
