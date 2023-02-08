const axios = require('axios')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const CronJob = require('cron').CronJob
const regex = /[0-9]/;
const listaUser = []
const userTemporario = []
const events = {
  MESSAGE: "message",
  READY: "ready",
  QR: "qr"
}
class UserTemp {
  number
  step
  moeda = undefined
  valor = undefined
  isFluxo = false

  constructor(number, step, isFluxo){
    this.number = number 
    this.step = step 
    this.isFluxo = isFluxo
  }
}

class User {
  name
  number
  price
  coin

  constructor(name, number, price, coin){
    this.name = name;
    this.number = number;
    this.price = price;
    this.coin = coin;
  }
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

var notification8 = new CronJob(
  '0 8 * * *',
  () => {
    notification(8)
  },
  null,
  true,
  'America/Recife'
);
var notification12 = new CronJob(
  '00 00 12 * * *',
  () => {
    notification(12)
  },
  null,
  true,
  'America/Recife'
);

var notification18 = new CronJob(
  '00 00 18 * * *',
  () => {
    notification(18)
  },
  null,
  true,
  'America/Recife'
);

var trigger = new CronJob(
  '*/5 * * * *',
  triggerPreco,
  null,
  true,
  'America/Recife'
)

client.on(events.READY, () => {
  console.log("client pronto");
  notification8.start()
  notification12.start()
  notification18.start()
  trigger.start();
})

client.on(events.MESSAGE, async message => {
  let mensagem = message.body.toLowerCase()
  let remetente = userTemporario.findIndex(item => item.number == message.from)
  if (remetente >= 0) {
    if (userTemporario[remetente].isFluxo) {
      let name = JSON.stringify(message).split('"notifyName":"')[1]
      fluxoCadastro(userTemporario[remetente].number, name, message.body)
    } 
  } else if (mensagem == "entrar na lista") {
    const tempUser = new UserTemp(message.from, 1, true)
    userTemporario.push(tempUser)
    client.sendMessage(message.from, `Digite agora qual moeda você deseja.`)
    client.sendMessage(message.from, `Eu entendo apenas no formato ISO 4217 (Ex: EUR, BRL, USD) então caso você não saiba qual o codigo aqui vai um link pra você verificar https://pt.wikipedia.org/wiki/ISO_4217`)

  } else if(mensagem == "sair da lista"){
    removerUser(message.from)
    client.sendMessage(message.from, `Removido da lista com sucesso`)
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
      client.sendMessage(message.from, `Olá sou o bot de moeda, eu converto qualquer codigo de moeda que vc colocar para o real.`)
      client.sendMessage(message.from, `O formato da mensagem deve ser um valor acompanhado da moeda desejada por ex: \n 20 EUR \n USD`)
      client.sendMessage(message.from, `Para entrar na minha lista de contato onde eu informo todo dia as 8h, 12h e as 18h o valor da moeda escolhida e tambem caso o valor dela seja abaixo do valor que voce selecionou me envie 'Entrar na lista' que eu te cadastro.`)
    }
  }
})

async function triggerPreco() {
  listaUser.forEach(async item => {
    setTimeout( async () => {
      const data = await requisicao(item.coin)
      if (data[`${item.coin}BRL`].ask <= item.price && listaUser.length > 0) {
        client.sendMessage(item.number, `Opa, a moeda ${item.coin} atingiu o preço escolhido: R$` + data[`${item.coin}BRL`].ask)
      }
    }, 20000)
  });
}

async function notification(hora) {
  let saudacao
  if(hora == 8) {
    saudacao = "bom dia"
  } else if(hora == 12) {
    saudacao = "boa tarde"
  } else {
    saudacao = "boa noite"
  }
  if (listaUser.length > 0) {
    listaUser.forEach(async item => {
      const data = await requisicao(item.coin)
      client.sendMessage(item.number, `Olá ${item.name} ${saudacao}, são ${hora}h e a moeda ${item.coin} esta valendo R$` + data[`${item.coin}BRL`].ask)
    });
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

async function fluxoCadastro (number, name, message) {
  let userIndex = userTemporario.findIndex(item => item.number == number);
  let passou = true
  if (userTemporario[userIndex].step == 1) {
    try{
      const data = await requisicao(message.toUpperCase())
    }catch{
      passou = false
    }
    if (passou) {
      userTemporario[userIndex].moeda = message.toUpperCase()
      userTemporario[userIndex].step = 2
      client.sendMessage(userTemporario[userIndex].number, `Digite agora qual valor você deseja ser notificado`)
    }else{
      client.sendMessage(userTemporario[userIndex].number, `A moeda não foi encontrada, verifique seu codigo e tente novamente me enviando Entrar na lista`)
      userTemporario.splice(userIndex , 1)
    }
  } else if (userTemporario[userIndex].step == 2){
    userTemporario[userIndex].valor = message.replace(',','.')
    userTemporario[userIndex].step = 3
  } if(passou){
    if (userTemporario[userIndex].step == 3){
      cadastrarUser(userTemporario[userIndex].number, name.split('",')[0], userTemporario[userIndex].moeda, userTemporario[userIndex].valor)
      client.sendMessage(userTemporario[userIndex].number, `Pronto! Você ja esta cadastrado em minha lista com a moeda ${userTemporario[userIndex].moeda} e será notificado(a) caso o valor atinja \nR$ ${userTemporario[userIndex].valor}`)
      userTemporario.splice(userIndex , 1)
    }
  } 
}

function cadastrarUser(number, name, moeda, price) {
  let user = new User(name, number, price, moeda)
  if (!listaUser.includes(user)) {
    listaUser.push(user)
  }
}

function removerUser(user){
  let remove = listaUser.findIndex(item => item.number == user);
  listaUser.splice(remove, 1)
}


client.initialize()
