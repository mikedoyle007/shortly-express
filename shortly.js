var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

var session = require('express-session');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var bcrypt = require('bcrypt-nodejs');
var app = express();
var authenticated = false;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: '123',
  resave: true,
  saveUninitalized: true,
}));

app.post('/login', function(req, res){
  //console.log(Users.fetch());
  // console.log(req.body.password)
  new User({'name': req.body.username}).fetch().then(function(found){
    if (found){
      console.log(found.attributes.password)
      console.log(found.attributes)
      bcrypt.compare(req.body.password, found.attributes.password, function(err, match) {
        if(match) {
        console.log('hashing passwords match')
        req.session.access = true;
        res.render('index');
        } else {
        res.render('login')
        console.log('fuck off intruder');
        
        // Passwords don't match
        } 
      });
    } else {
      
      res.render('login')
      console.log('not found')
      
      //console.log('found user')
    }
  })
  
  //authenticated = true;
  //check to see if hashed password === users password

  // res.render('index');
  // res.end();
})


app.get('/signup', 
function(req,res){
  res.render('signup');
  res.end();
});

app.post('/signup',
function(req,res){
  new User ({'name': req.body.username}).fetch().then(function(found){
    if (found){
      console.log('failure')
      res.render('signup')
      res.end();
    }
    else {

      Users.create({
          name: req.body.username,
          //hash the password
          password: req.body.password
        })
        .then(function(newUser) {
          res.status(200);
          res.render('login');
        });

      console.log('created user');
    }
  })
})

app.get('/', 
function(req, res) {
  res.render('index');
});



const isAuthenticated = function(req, res, next){
  if (req.session.access) {
    next();
  } else {
    res.status(401).render('login');
  }
};

app.get('/logout', function(req, res){
  req.session.destroy();
  res.render('login');
  res.end();
})

app.use(isAuthenticated);


app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
