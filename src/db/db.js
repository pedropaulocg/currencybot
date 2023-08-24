const mysql = require("mysql2")
require("dotenv").config()


// const connection = mysql.createConnection({
//   database: 'currencyBot',
//   username: '3g35sf3lwdx89rhs1070',
//   host: 'aws.connect.psdb.cloud',
//   password: 'pscale_pw_2CGZBmvwRDFgEyuoAg768IunRociabHKhtMH2odsX2k',
//   ssl: {}
// })
const connection = mysql.createConnection(process.env.DATABASE_URL)


module.exports = connection