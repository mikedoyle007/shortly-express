var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
const saltRounds = 10;  
var User = db.Model.extend({
  tableName : 'users',
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
    
    var password = model.get('password');

    var salt = bcrypt.genSaltSync(saltRounds);
    var hash = bcrypt.hashSync(password, salt);

    model.set('password', hash);
        
  // Store hash in database
    // });
    // //   var shasum = crypto.createHash('sha1');
    // //   shasum.update(model.get('url'));
    // //   model.set('code', shasum.digest('hex').slice(0, 5));
     });
  }
});

module.exports = User;