var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var { sequelize } = require('./models');

(async () => {
	try {
		await sequelize.authenticate();
		console.log('Connection to the database successful!');
	} catch (error) {
		console.error('Error connecting to the database: ', error);
	}
})(); 


var indexRouter = require('./routes/index');
var books = require('./routes/books');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/books', books);


// 404 Error Handler
app.use(function(req, res, next) {
  const err = createError(404, 'Sorry! We couldn\'t find the page you were looking for.');

  res.status(err.status);
  res.render('page-not-found', {err})
});

// Error handler
app.use(function(err, req, res, next) {

  console.log(err.status);
  console.log(err.message);

  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error', {title: "Server Error", err});
});

module.exports = app;
