const express = require('express')
const router = express.Router();
const { Client, LocalAuth, Buttons, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('../db/db')



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
  console.log('Cliente de WhatsApp listo ✅');

  //const chats = await client.getChats();
  //const groups = chats.filter( chat => chat.isGroup)

  //groups.forEach( group => {
    //console.log(`📛 Nombre del grupo: ${group.name}`);
    //console.log(`🆔 ID del grupo: ${group.id._serialized}`);
  //})
});


client.on('message', async message => {

    const chat = await message.getChat();
    const contact = await message.getContact()
    const { isGroup, isBroadcast } = chat
    const { body, from } = message
    const response = body.trim();
    const reply = {
        2 : 'Gracias por confirmar tu asistencia ❤️😊',
        1 : 'Muchas Gracias por responder! Lamentamos que no puedas asistir 🥲'
    }

    let number = from.replace(/@c.us/gi,'')
    let has_responded = await has_response(number)
    if ( !isGroup && !isBroadcast && response.length == 1 && !isNaN(response) && ['1','2'].includes(response) && has_responded.length == 0) {


        client.sendMessage(from, reply[response])        
        const {name: contact_name_chat } = chat
        const { pushname : nick_name, name : contact_name, number : contact_number } = contact


        
        const sql = `INSERT INTO reveal_confirm (confirm,number,contact_name, nick) VALUES (?, ?, ?, ?)`;
        db.query(sql, [ response - 1, contact_number, contact_name ?? contact_name_chat, nick_name ], ( err, result) => {
            if(err) {
                console.error('error: ', err)
            } else {
                console.log('Ok')
            }
        })
    } else {
       
    }
});

client.on('message_create', (msg) => {
    if (msg.fromMe) {
      //console.log(`📤 Mensaje enviado: ${msg.body}`);
    }
});

client.initialize();

router.post('/send-reveal', async (req,res) => {
    try {
    const {to, message} = req.body
    if(!to || !message) return res.status(400).json({'error' : 'Parametros requeridos'});

    let recipients = to;
    if(!Array.isArray(to)) recipients = [to]


        const buttons = new Buttons(
            '¿Qué opción elegís?',                  // Texto del mensaje principal
            [                                       // Botones (máximo 3)
                { body: 'button1', id: 'btn1' },
                { body: 'button2', id: 'btn2' },
                { body: 'button3', id: 'btn3' }
            ],
            'Título del mensaje',                   // (opcional) título
            'Pie de página'                         // (opcional) texto del pie
        );

        const text = `
            🎀Estás invitado/a a nuestra revelación de sexo!
            Será un momento lleno de emociones y sorpresas.
            ¿Te gustaría acompañarnos?
            📅 Fecha: 10 de mayo de 2025
            📍 Lugar: Capiata Toledo 
            🏠 http://bit.ly/4im8sVp
            Por favor confirmá tu asistencia:

                1️⃣ No podre asistir
                2️⃣ Si, confirmo
        `;


        let chatId = null
        for ( let recipient of recipients) {
            chatId = `${recipient}@c.us`
            await client.sendMessage(chatId, text)
        }

        res.json({'message': `All messages sended`})
    } catch (error) {
        res.status(500).json({'error' : `Error al enviar el mensaje ${error}`})
    }
});

router.get('/messages', async(req,res) => {
    const sql = "SELECT * FROM reveal_confirm";
    db.query(sql,[], (err,result) => {
        if(err) res.status(500).json({'error':err})
        res.json({list: result});
    })
});

const has_response = ( number ) => {
    const sql = "SELECT 1 FROM reveal_confirm WHERE `number` = ? LIMIT 1"
    
    return new Promise(( resolve, reject) => {
        db.query(sql, [ number], ( err, result ) => {
            if ( err ) return reject(err)
            resolve(result)
        })
    })
   
}

module.exports = router;