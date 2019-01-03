var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({secret: 'Shh, its a secret!'}));

app.get('/', 
  function(req, res) {
    res.render('index');
  });

app.get('/create', 
  function(req, res) {
    if (!req.session.isLogged) {
      res.redirect('/');
    }
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
    console.log('body is here ==============', req.body);

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }

    new Link({ url: uri }).fetch().then(function(found) {
      //console.log('new link has been added');
      if (found) {
        //console.log('this was found ');
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

var isAuthenticated = function(req, res, next) {
 
  if (req.user.authenticated) { return next(); }

  res.redirect('/');
};


app.get('/login', 
  function(req, res) {
    res.render('login');
  });

app.post('/login', 
  function(req, res) {
    var providedLoginName = req.body.username;
    var providedLoginPassword = req.body.password;
    new User({username: providedLoginName})
      .fetch()
      .then(function(model) { //second argument is the hash
        bcrypt.compare(providedLoginPassword, model.get('password'), function(err, result) {
          if (result === true) {
            //req.session.isLogged = true;
            //console.log('session is here ========================', req.session);
            res.redirect('/');
          } else {
            res.statusMessage = 'Current password does not match';
            res.redirect('/login');
          }
        });
      }); 
  });

app.get('/signup', 
  function(req, res) {
    res.render('signup');
  });

app.post('/signup',
  function(req, res) {
    var providedUsername = req.body.username;
    var providedPassword = req.body.password;
    User.where('username', req.body.username)
      .fetch()
      .then(function(found) {
        if (found) {
          res.redirect('/login');
        } else {
          Users.create({
            username: providedUsername,
            password: providedPassword
          });
          res.redirect('/');
        }      
      });
  });

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
