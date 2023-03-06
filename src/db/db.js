const mysql = require("mysql2")

const connection = mysql.createPool({
  database: 'currencybot',
  username: 'qgcemyzlri5htp0bsob0',
  host: 'aws-sa-east-1.connect.psdb.cloud',
  password: 'pscale_pw_WM7ICH4S2Nws2sO58kfT1GNrg1te1UyxD4z2TlfnRwa'
})

module.exports = connection