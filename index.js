// Import das libs
const axios = require('axios')
const { Client, LocalAuth, Buttons } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const CronJob = require('cron').CronJob

// Import das classes e services
const UserTemp = require("./src/models/UserTemp")
const { cadastrarUser, removerUser, minhasListas, listarUsuarios, silenciarLista } = require("./src/services/userService")

// Constantes gerais
const regex = /[0-9]/;
const regexList = /sair da lista (\d+)/i
const userTemporario = []
const events = {
  MESSAGE: "message",
  READY: "ready",
  QR: "qr"
}
const SESSION_FILE_PATH = './session.json';
const boasVindas = ['Olá sou o bot de moeda, eu converto qualquer codigo de moeda que vc colocar para o real.','O formato da mensagem deve ser um valor acompanhado da moeda desejada por ex: \n 20 EUR \n USD', "Para entrar na minha lista de contato onde eu informo todo dia as 8h, 12h e as 18h o valor da moeda escolhida e tambem caso o valor dela seja abaixo do valor que voce selecionou me envie 'Entrar na lista' que eu te envio o passo a passo para o cadastro."]


// Conexão com client e save
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-1"
  }),
  puppeteer: {
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ignoreDefaultArgs: ['--disable-extensions']
	}
})

// Gerar QRcode
client.on(events.QR, qr => {
  qrcode.generate(qr, { small: true })
})

// Função a ser chamada apos a conexão
client.on(events.READY, () => {
  console.log("client pronto");
  notification8.start()
  notification12.start()
  notification18.start()
  trigger.start();
})

// Chama funcoes de notificações nos horarios 8, 12 e 18. Fazendo uma verificação do preço a cada 5 min
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

// Função ao receber mensagem
client.on(events.MESSAGE, async message => {
  let mensagem = message.body.toLowerCase()
  let remetente = userTemporario.findIndex(item => item.number == message.from)
  let match = mensagem.match(regexList)
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

  } else if(match){
    removerUser(match[1]).then((res)=>{
      if (res) {
        client.sendMessage(message.from, `Removido da lista com sucesso`)
      } else {
        client.sendMessage(message.from, `Desculpe, não encontrei o seu identificador. Verifique se o mesmo esta correto e tente novamente.`)
      }
    }).catch(err => {
      client.sendMessage(message.from, `Aconteceu algum erro inesperado. Por favor tente novamente mais tarde`)
    })
  } else if(mensagem == "sair da lista"){
    client.sendMessage(message.from, `Lembre de me dizer o identificador da sua lista para que eu possa remover-la`)
  } else if(mensagem == "minhas listas" || mensagem == "minha lista"){
    minhasListas(message.from).then( res => {
      if(res.length == 0){
        client.sendMessage(message.from, `Não identifiquei nenhuma lista no seu nome, para se cadastrar em uma me envie Entrar na lista e siga o passo a passo.`)
      } else {
        client.sendMessage(message.from, `Identifiquei ${res.length} ${ res.length > 1 ? 'listas' : 'lista' }`)
        res.forEach(item => {
          client.sendMessage(message.from, `*ID*: ${item.idusers}\n*Moeda*: ${item.coin}\n*Valor*: ${item.price}`)
        })
      }
    })
  } else if (mensagem == "mutar") {
    silenciarLista(message.from).then(res => {
      if(res) {
        client.sendMessage(message.from, "Pronto! Voce não receberá mais mensagem de alerta de preço. Não se preocupe ainda irei te avisar nos horarios 8, 12 e 18 ok? Para voltar a receber notificação digite unmute")
      }
    })
  } else if (mensagem == "unmute") {
    silenciarLista(message.from).then(res => {
      if(res) {
        client.sendMessage(message.from, "Pronto! Você agora você recebera as notificações de preço")
      }
    })
  }
  else {
    let moeda
    let valor = 1
    if (!isNumber(message.body)) {
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
        boasVindas.forEach(item => {
          client.sendMessage(message.from, item)
          setTimeout(() => {
          },2000)
        })
      }
    } else {
      client.sendMessage(message.from, "Lembre de digitar a moeda desejada antes do numero, ex: USD 10")
    }
  }
})

// Functions de verificacao de preco e envio da notificacao

async function triggerPreco() {
  listarUsuarios().then(res => {
    if (res.length > 0) {
      res.forEach(async item => {
        setTimeout( async () => {
          const data = await requisicao(item.coin)
          if (data[`${item.coin}BRL`].ask <= item.price && item.silenciar == false) {
            client.sendMessage(item.number, `Opa, a moeda ${item.coin} atingiu o preço escolhido: R$` + data[`${item.coin}BRL`].ask + ". Caso queira me silenciar envie mutar.")
          }
        }, 20000)
      });
    }
  })
}
// verifica se eh numero
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
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
  listarUsuarios().then(res => {
    if (res.length > 0) {
      res.forEach(async item => {
        const data = await requisicao(item.coin)
        client.sendMessage(item.number, `Olá ${item.name} ${saudacao}, são ${hora}h e a moeda *${item.coin}* esta valendo *R$ ${data[`${item.coin}BRL`].ask}*`)
      });
    }
  })
}

const calcularValor = (moeda, valor) => {
  let resultado = moeda * valor

  return resultado;
}

async function requisicao(moeda) {
    const result = await axios.get(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`).then()
    return result.data
}

async function fluxoCadastro (number, name, message,) {
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
      cadastrarUser(userTemporario[userIndex].number, name.split('",')[0], userTemporario[userIndex].moeda, userTemporario[userIndex].valor).then(res => {
        console.log(res);
        client.sendMessage(res[1].number, `Pronto! Você ja esta cadastrado em minha lista com a moeda ${res[1].moeda} e será notificado(a) caso o valor atinja \nR$ ${res[1].price}.`)
        client.sendMessage(res[1].number, `O Identificador do seu cadastro é *${res[0]}*, e caso queira sair dessa lista dessa moeda digite Sair da lista e o identificador da sua lista por ex: "Sair da lista ${res[0]}. Lembre-se que você pode se cadastrar em quantas listas quiser e pode verificar quais listar você esta cadastrado me enviando Minhas listas.`)
      }).catch(err => {
        client.sendMessage(message.from, `Aconteceu algum erro inesperado. Por favor tente novamente mais tarde`)
        console.log(err);
      })
      
      userTemporario.splice(userIndex , 1)
    }
  } 
}


// Inicia o client
client.initialize()
