const axios = require('axios')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const CronJob = require('cron').CronJob
const regex = /[0-9]/;
const events = {
  MESSAGE: "message",
  READY: "ready",
  QR: "qr"
}
const SESSION_FILE_PATH = './session.json';
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-1"
  })
})


client.on(events.QR, qr => {
  qrcode.generate(qr, { small: true })
})

var notification = new CronJob(
  '00 00 12 * * *',
  notificarEur,
  null,
  true,
  'America/Recife'
);

var trigger = new CronJob(
  '* */10 * * *',
  triggerPreco,
  null,
  true,
  'America/Recife'
)

client.on(events.READY, () => {
  console.log("client pronto");
  notification.start()
  trigger.start();
})


client.on(events.MESSAGE, async message => {
  let mensagem = message.body.toLowerCase()
  if (mensagem == "entrar na lista") {
    cadastrarUser(message.from)
    client.sendMessage(message.from, `Cadastrado com sucesso!`)
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
    try{
      const data = await requisicao(moeda)
      client.sendMessage(message.from,`${valor} ${moeda} ta valendo R$${calcularValor(data[`${moeda}BRL`].ask, valor)}`)
    }catch{
      client.sendMessage(message.from, `Olá sou o bot de moeda, eu converto qualquer codigo de moeda que vc colocar para o real. O formato da mensagem deve ser um valor acompanhado da moeda desejada por ex: \n 20 EUR \n USD \n \nInfelizmente não consegui encontrar a moeda que vc digitou. Verifica se ta tudo ok e tenta novamente!`)
    }
  }
})

async function notificarEur() {
  if (listaUser.length > 0) {
    const data = await requisicao("EUR")
    listaUser.forEach(item => {
      client.sendMessage(item, "Olá são 12h e o euro esta valendo R$" + data[`EURBRL`].ask)
    });
  }
}

async function triggerPreco() {
  const data = await requisicao("EUR")
  if (data['EURBRL'].ask <= 5.50 && listaUser.length > 0) {
    listaUser.forEach(item => {
      client.sendMessage(item, 'Opa o euro ta bom pra comprar ein!! ele ta valendo R$' + data[`EURBRL`].ask)
    })
  }
}

const calcularValor = (moeda, valor) => {
  let resultado = moeda * valor

  return resultado;
}

async function requisicao(moeda) {
    const result = await axios.get(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`).then()
    return result.data
}

const listaUser = []
function cadastrarUser(user) {
  if (!listaUser.includes(user)) {
    listaUser.push(user)
  }
}


client.initialize()
