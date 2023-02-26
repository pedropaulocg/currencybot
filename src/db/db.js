const mysql = require("mysql2")

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'pepi2803',
  database: 'currencyBot'
})

module.exports = connection