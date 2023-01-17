const fetch = require("node-fetch")
const venom = require('venom-bot')
const regex = /[0-9]/;
venom
  .create({
    session: 'CurrencyBot', //name of session
    multidevice: true // for version not multidevice use false.(default: true)
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage(async message => {
    let mensagem = message.body.toLowerCase()
    if (mensagem == "entrar na lista") {
      listaUser.push(message.from)
      console.log(listaUser);
    } else {
      let moeda
      let valor = 1
      if (regex.test(message.body)) {
        let i = 0;
        while (message.body[i] != " ") {
          i++
        }
        moeda = message.body.substr(i + 1).trim().toUpperCase();
        valor = message.body.substr(0, i)
      } else {
        moeda = message.body.toUpperCase();
      }
      const data = await requisicao(moeda)
      if (message.body && data.status != 404) {
        client.sendText(message.from, `${valor} ${moeda} ta valendo R$${calcularValor(data[`${moeda}BRL`].ask, valor)}`)
      }
    }
  })
  let diferenca = verificacaoAgendada()

  setTimeout(async () => {
    if (listaUser.length > 0) {
      const data = await requisicao("EUR")
      listaUser.forEach(item => {
        client.sendText(item, "Olá são 12:00:00 e o euro esta valendo R$" + data[`EURBRL`].ask)
      });
    }
  }, diferenca);
  let esperarTempo = false
  setInterval(async () => {
    const data = await requisicao("EUR")
    if (data['EURBRL'].ask <= 6 && listaUser.length > 0 && !esperarTempo) {
      esperarTempo = true
      listaUser.forEach(item => {
        client.sendText(item, 'Opa o euro ta bom pra comprar ein!! ele ta valendo R$' + data[`EURBRL`].ask)
      })
    }
  }, 900000)
  setInterval(()=>{
    esperarTempo = false
  }, 60000)
}

const verificacaoAgendada = () => {
  var data = new Date();
  var hora = 12;
  var minuto = 0;
  var segundo = 0;

  var diferenca = (new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora, minuto, segundo) - data);
  if (diferenca < 0) {
    diferenca += 86400000;
  }

  return diferenca;
}
const calcularValor = (moeda, valor) => {
  let resultado = moeda * valor

  return resultado.toFixed(2);
}

async function requisicao(moeda) {
  const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`)
  const dados = await response.json();
  return dados
}

const listaUser = []


