const express = require('express')
const router = express.Router();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('../db/db')
let receivedMessages = [];
let user_msg = [
    '483020',''
]


// Inicializar cliente de WhatsApp Web
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox'] }
});

// Mostrar QR en consola
client.on('qr', qr => {
  console.log('Escanea el siguiente QR con tu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  //console.log('Cliente de WhatsApp listo ✅');

  //const chats = await client.getChats();
  //const groups = chats.filter( chat => chat.isGroup)

  //groups.forEach( group => {
    //console.log(`📛 Nombre del grupo: ${group.name}`);
    //console.log(`🆔 ID del grupo: ${group.id._serialized}`);
  //})
});

client.on('message_reaction', reaction => {


    /* const { msgId : { remote : author }, reaction : react } = reaction
    const chat_type = author ? (author.includes('@c.us') ? 'PRIVATE' : 'GROUP') : '';
    
    const sql = 'INSERT INTO whatsapp (message,`from`, chat_type, contact_name, author) VALUES (?,?,?,?,?)';

    db.query(sql, [ 'REACTION', author, chat_type, author, author ], ( err, result ) => {
        if( err ) console.error('error', err)
        else console.log('reaccion guardada')
    }) */

  });

client.on('message', async message => {
    
    let {author, id,from,body,timestamp, fromMe, isGroup, mentionedIds, type} = message
    const chat = await message.getChat()
    //if ( fromMe) return;

    if(chat.isGroup) {
        console.log('📢 Es un grupo:', chat.name);
        if(mentionedIds.includes(client.info.wid._serialized)) {

            if(author && author.includes('483020')) {
                await message.reply('❤️')
            } else {
                await message.reply('👻')
            }
        }
    } else if(chat.isBroadcast) {
        console.log('📡 Es una lista de difusión (broadcast)');
    } else {
        //chat privado
        console.log('💬 Es un chat privado con:', chat.name || message.from);
        const numero = from.replace('@c.us', '');
        if(numero.includes('483020')) {
            await message.reply('Hola ❤️');
        }
    }

    if(!chat.isBroadcast) {

        storage_message(message)
        /* const chat_type = chat.isGroup ? 'GROUP' : 'PRIVATE';

        author = author ? author.replace(/@c\.us/,'') : ''

        const sql = 'INSERT INTO whatsapp (message,`from`, chat_type, contact_name, author) VALUES (?,?,?,?,?)';
        db.query(sql,[body,from,chat_type, chat.name, author], (err, result) => {
            if(err) console.error(err)
                else console.log('Guardado');
        }); */

    }
});

client.on('message_create', (msg) => {
    if (msg.fromMe) {
      console.log(`📤 Mensaje enviado: ${msg.body}`);
    }
});

client.initialize();

const storage_message = async (whatsapp_info, reaction) => {
    const chat = await whatsapp_info.getChat();
    const chat_type = chat.isGroup ? 'GROUP' : 'PRIVATE';
    const { body,from,author } = whatsapp_info
    const { name } = chat

    const sql = 'INSERT INTO whatsapp (message,`from`, chat_type, contact_name, author) VALUES (?,?,?,?,?)';
    db.query(sql,[body,from,chat_type, name, author], (err, result) => {
        if(err) console.error(err)
            else console.log('Guardado');
    });
}

router.post('/send', async (req,res) => {
    const {to, message} = req.body
    if(!to || !message) return res.status(400).json({'error' : 'Parametros requeridos'});

    try {
        const chatId = `${to}@c.us`;
        const response = await client.sendMessage(chatId,message);
        res.json({'message': `Mensaje enviado a ${to}`})
    } catch (error) {
        res.status(500).json({'error' : `Error al enviar el mensaje ${error}`})
    }
});

router.get('/messages', async(req,res) => {
    const sql = "SELECT id, `from`, message FROM whatsapp";
    db.query(sql,[], (err,result) => {
        if(err) res.status(500).json({'error':err})
        res.json({list: result});
    })
});

module.exports = router;