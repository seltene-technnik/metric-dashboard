const mysql = require('mysql2');
var environment = require('./environment')
var settings = new environment()
var connection = mysql.createPool(settings.database);
module.exports = connection;
