var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var api = require('./routes/api');
var register = require('./routes/register');
var shop = require('./routes/shop');
var about = require('./routes/about');

var connection = require('./mysql.js');
var io = require('socket.io');
var app = express();
var token = new Date().getTime();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({secret:'secretkey'}));
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next){
   res.locals.token = token;
   req.session.token = token;
   next();
});


app.use('/', routes);
app.use('/register', register);
//app.use('/shop', shop);
app.use('/about', about);


// token middleware

/*app.use(function(req, res, next) {
  if(typeof req.headers.x_csrf_token !== 'undefined' && (req.headers.x_csrf_token == req.session.token)){
    req.session.token = token;
    next();
  }else{
    req.session.token = token;
    res.end('Invalid Token');
  }
});
*/
app.use('/api', api);


app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404; 
    next(err);
}); 

// catch 404 and forward to error handler




// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
 
var io = require('socket.io').listen(app.listen(3000));


module.exports = app;
