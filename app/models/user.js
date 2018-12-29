var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');





var User = db.Model.extend({
  tableName: 'username',
  initialize: function() {
    this.on('creating', this.hashPassword, this);
  },
  hashPassword: function(model, attrs, options) {
    return new Promise(function(resolve, reject) {
      bcrypt.hash(model.attributes.password, 10, function(err, hash) {
        if (err) {
          reject(err);
        } else {
          model.set('password', hash);
          resolve(hash);
        }
      });
    });
  }
});

module.exports = User;