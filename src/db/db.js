const mysql = require("mysql2")

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'currencybot'
})

module.exports = connection