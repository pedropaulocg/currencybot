const fetch = require("node-fetch")
const venom = require('venom-bot')
const regex = /[0-9]/;
venom
  .create(
    //session
    'sessionName', //Pass the name of the client you want to start the bot
    //catchQR
    (base64Qrimg, asciiQR, attempts, urlCode) => {
      console.log('Number of attempts to read the qrcode: ', attempts);
      console.log('Terminal qrcode: ', asciiQR);
    },
    // statusFind
    (statusSession, session) => {
      console.log('Status Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken || chatsAvailable || deviceNotConnected || serverWssNotConnected || noOpenBrowser || initBrowser || openBrowser || connectBrowserWs || initWhatsapp || erroPageWhatsapp || successPageWhatsapp || waitForLogin || waitChat || successChat
      //Create session wss return "serverClose" case server for close
      console.log('Session name: ', session);
    },
    // options
    {
      multidevice: false, // for version not multidevice use false.(default: true)
      folderNameToken: 'tokens', //folder name when saving tokens
      mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
      headless: true, // Headless chrome
      devtools: false, // Open devtools by default
      useChrome: true, // If false will use Chromium instance
      debug: false, // Opens a debug session
      logQR: true, // Logs QR automatically in terminal
      browserWS: '', // If u want to use browserWSEndpoint
      browserArgs: ['--user-agent'], // Original parameters  ---Parameters to be added into the chrome browser instance
      addBrowserArgs: [''], // Add broserArgs without overwriting the project's original
      puppeteerOptions: {}, // Will be passed to puppeteer.launch
      disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
      disableWelcome: true, // Will disable the welcoming message which appears in the beginning
      updatesLog: true, // Logs info updates automatically in terminal
      autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
      createPathFileToken: false, // creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
      chromiumVersion: '818858', // Version of the browser that will be used. Revision strings can be obtained from omahaproxy.appspot.com.
      addProxy: [''], // Add proxy server exemple : [e1.p.webshare.io:01, e1.p.webshare.io:01]
      userProxy: '', // Proxy login username
      userPass: '' // Proxy password
    },
    // BrowserSessionToken
    // To receive the client's token use the function await clinet.getSessionTokenBrowser()
    {
      WABrowserId: '"UnXjH....."',
      WASecretBundle:
        '{"key":"+i/nRgWJ....","encKey":"kGdMR5t....","macKey":"+i/nRgW...."}',
      WAToken1: '"0i8...."',
      WAToken2: '"1@lPpzwC...."'
    },
    // BrowserInstance
    (browser, waPage) => {
      console.log('Browser PID:', browser.process().pid);
      waPage.screenshot({ path: 'screenshot.png' });
    }
  )
  .then((client) => {
    start(client);
  })
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


