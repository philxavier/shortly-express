var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'username',
  hasTimestamps: true,
  initialize: function() {
    this.on('creating', this.hashPassword, this);
  },
  hashPassword: function(model, attrs, options) {
    return new Promise(function(resolve, reject) {
      bcrypt.hash(model.attributes.password, null, null, function(err, hash) {
        if (err) {
          reject(err);
        } else {
          model.set('password', hash);
          resolve(hash);
        }
      });
    });
  },
  link: function() {
    return this.hasMany(Link);
  }
});

module.exports = User;