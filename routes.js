var express         = require('express'),
    router          = express.Router(),
    mongoose        = require('mongoose'),
    Schema          = mongoose.Schema,
    passport        = require('passport'), // Authentication using passport
    LocalStrategy   = require('passport-local').Strategy; //Require this to define Strategy to use with passport

mongoose.connect('mongodb://127.0.0.1:27017/stattracker'); //Database : stattracker
mongoose.Promise = require('bluebird'); // Validation : To capture validation

//Prepare mongoose Schema - For Users
  const userSchema = new Schema({
      username : String,
      password : String
  });
  const User = mongoose.model('user', userSchema);

//Prepare mongoose Schema - For activities
  const activitySchema = new Schema({
    activity     : {type:String, required:true },
    measurement  : {type:Number, required: true },
    date         : {type: Date, default: Date.now},
    userId       : {type: mongoose.Schema.Types.ObjectId, ref:'user'}
  });

  const activities = mongoose.model("activities", activitySchema);

  //set passport middleware
  router.use(passport.initialize());
  router.use(passport.session());
  //serialize user
  passport.serializeUser(function(user,done){
    return done(null, user._id);
  });
  //Deserialize user
  passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
      done(err, user);
    });
  });

  //Defining Signup Strategy for passport  - Signup for users to add activity
  //This Strategy is used later during Signup
  passport.use('registerUser', new LocalStrategy(
    {passReqToCallback:true},
    function(req, username, password, done){
      let errors = "";
      req.checkBody("username", "Please enter a valid username").notEmpty().isLength({max: 30});
      req.checkBody("password", "Please enter a Password").notEmpty();

      errors = req.validationErrors();
      if(!errors) {
        var newUser = new User({
          username: req.body.username,
          password: req.body.password
        });
      }
      else{
        return done(errors);
      }
      newUser.save(function(err){
      if(err){
        return done(err);
      }
        return done(null, newUser);
      });
    }
  ));
  // Defining Login strategy for passport - Users to login to add activity
  passport.use('loginStrategy', new LocalStrategy(
    function (username, password, done) {
      User.findOne({username: username}, function (err, doc) {
        if (err) {
          return done(err);
        }
        if (!doc) {
          return done(null, false, 'Incorrect username');
        }
        if(password!== doc.password){
          return done(null, false, 'Incorrect password');
        }
        if(password === doc.password){
          return done(null, doc, 'Successful login');
        }
        else{
          return done('Login failed');
        }
      });
    }
  ));

  // ********************** Routes   ********************

  // Login Route  - GET Method - Just a welcome message
  router.get("/api/login", function(req, res){
    if(req.user){
      res.send("User Logged in")
    }
    else {
      res.send("Login to continue ...");
    }
  });

// Enter credentials - username, password
// Passport authenticate the user - POST method
  router.post("/api/login", function(req, res, next){
    passport.authenticate('loginStrategy', (err, user, info) => {
    if (err) {
      return res.send(err);
    }
    if (!user) {
      return res.send(info);
    }
    req.login(user, function(err) {
    if (err) {
      return res.send(err);
    }
    session.id = user._id;
    return res.json(user);
    });
    })(req, res, next);
  });


// Sign Up - GET  Method - Just a welcome message
 router.get("/api/signup", function(req, res){
   res.send("Welcome to activity tracker");
 });

// Sign Up - POST Method
// Input Username and Password and sign up
router.post("/api/signup",function(req,res, next){
   passport.authenticate('registerUser', (err,user,info)=>{
     if(err){
       return res.send({err:err, info:info});
     }
     else{
       res.setHeader('Content-Type', 'application/json');
       res.status(200).json(user);
     }
   })(req, res, next);
 });

// get('/api/activities')
// Get ALL the activities entered by the user logged in
router.get('/api/activities', function(req, res) {
  activities.find({userId:session.id})
    .then(function(activity) {
      if (activity) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(activity);
      } else {
        res.send("No activity found")
      }
    }).catch(function(err) {
      res.status(400).send("Bad request. Please try again");
    });
});

//post('/api/activities')
// Add a new activity document by logged user;  Parameters :  activity, measurement
router.post('/api/activities', function(req, res) {
  let activityInstance = new activities({
    activity: req.body.activity,
    measurement: req.body.measurement,
    userId: session.id
  });

  activityInstance.save(function(err){
    if(!err){
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(activityInstance);
    }
    else{
      res.send("Error adding activity");
    }
  });
});

//get('/api/activities/:id')
// This fetches the  activity based on a ID from the activity collection
router.get('/api/activities/:id', function(req, res) {
    activities.find({_id:req.params.id, userId:session.id})
    .then(function(activity) {
      if (activity) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(activity);
      } else {
        res.send("No activity found")
      }
    }).catch(function(err) {
      res.status(400).send("Bad request. Please try again");
    });
});

//put('/api/activities/:id')
//Edit activity or measurement for a particular document
router.put('/api/activities/:id', (req, res, next) => {
  activities.update(
    {_id:req.params.id, userId:session.id},
    {activity: req.body.activity, measurement:req.body.measurement})
    .then(response => {
        res.status(200).json({
          responseType: 'activity updated'
        });
      })
    .catch(err =>{
      res.status(200).json({
        responseType: 'activity not updated'
      })
    });
});

//delete('/api/activities/:id
//This deletes a document based on the id
router.delete('/api/activities/:id', (req, res, next) => {
  activities.findOneAndRemove(
    {_id:req.params.id, userId:session.id})
    .then(response => {
        res.status(200).json({
          responseType: 'activity deleted'
        });
      })
    .catch(err =>{
      res.status(200).json({
        responseType: 'activity not deleted'
      })
    });
});

//post('/api/activities/:id/stats')
//This method fetch the id and select the activity (like swimming, walking etc.)
//Display all the activities entered by the user sorted by date DESC
//Still hold good only for logged User

router.post('/api/activities/:id/stats', (req, res) => {
    var query, activity;

    query = activities.findOne({_id:req.params.id, userId:session.id});
    query.select('activity');
    query.exec(function(err, result) {
    activity = result.activity;

    query = activities.find({activity:activity, userId:session.id})
    query.select('activity date measurement');
    query.sort({date: -1});
    query.exec(function(err, resultSet){
      res.status(200).json({
        responseType: resultSet
      });
    }).catch(function(err) {
      res.status(400).send("Bad request");
    });
    }).catch(function(err) {
      res.status(400).send("Bad request. Please try again");
    });
});

//delete('/api/stats/:id')
//This method fetches the id and get the date and activity
//Based on the date and activity, removes all activity for the day

router.delete('/api/stats/:id', (req, res) => {
  var query, date, activity;

  query = activities.findOne({_id:req.params.id, userId:session.id});
  query.select('date activity');
  query.exec(function(err, result) {
  date = result.date;
  activity = result.activity;

  activities.remove(
    {activity: activity, date:date, userId:session.id})
    .then(response => {
        res.status(200).json({
          responseType: 'activities deleted'
        });
      })
    .catch(err =>{
      res.status(200).json({
        responseType: 'activities not deleted'
      })
    });

  }).catch(function(err) {
    res.status(400).send("Bad request. Please try again");
  });
});

module.exports = router;
