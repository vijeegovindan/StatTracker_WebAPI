  var express         = require("express");
      bodyParser      = require("body-parser"),
      validator       = require("express-validator"),
      mustacheExpress = require("mustache-express"),
      session         = require('express-session'),
      path            = require("path"),
      route           = require("./routes.js"),
      morgan          = require("morgan");

// Initialize Express App
const app = express();

// Set Port
app.set('port', (process.env.PORT || 8000));

// Body parser and validator implementation
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(validator());

// morgan
app.use(morgan("dev"));

//set middleware
app.use(session({
  secret: 'shh hhh shhh',
  resave: true,
  saveUninitialized:true
}));

// Routes
app.use(route);

// Open Port
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
