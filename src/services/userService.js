const User = require("../models/User")
const connection = require("../db/db")

async function cadastrarUser(number, name, moeda, price) {
  let user = new User(name, number, price, moeda)
  const sql = "INSERT INTO users (name, number, price, coin) VALUES (?, ?, ?, ?)" 
  const values = [user.name, user.number, user.price, user.coin]

  try{
    const insertion = await new Promise((resolve, reject) => {
      connection.query(sql, values, function (err, result){
        if (err) reject(err);
        resolve(result)
        console.log('Usuário cadastrado');
      })
    })
    return [insertion.insertId, user]
  } catch (error){
    throw error
  }

  
}

async function removerUser(userId){
  const selectSql = `SELECT * FROM users WHERE idusers = ${userId}`;
  const deleteSql = `DELETE FROM users WHERE idusers = ${userId}`;
  try {
  // Verifica se o usuario existe
    // requisição
    const selectResults = await new Promise((resolve, reject) => {
      connection.query(selectSql, (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
    // verificação
    if (selectResults.length === 0) {
      console.log("Usuario não encontrado");
      return false;
    }

    // remove o usuario
    await new Promise((resolve, reject) => {
      connection.query(deleteSql, function (error) {
        if (error) reject(error);
        console.log('Usuário removido com sucesso!');
        resolve(true);
      });
    });
    return true;
  } catch (error) {
    throw error;
  }
}

async function minhasListas(number) {
  const selectSql = `SELECT * FROM users WHERE number='${number}'`
  try {
    const result = await new Promise((resolve, reject) => {
      connection.query(selectSql, (err, result) => {
        if (err) reject(err)
        resolve(result)
      })
    })
    return result
  } catch (error) {
    console.error(error)
    return null // ou [] ou outro valor padrão que faça sentido no contexto da sua aplicação
  }
}

module.exports = {
  cadastrarUser,
  removerUser,
  minhasListas
}