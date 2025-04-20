const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('Escaneá este código QR con WhatsApp Web:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Cliente listo. Ya podés enviar mensajes.');
    const numeros = [
        '595994727191',
        '595986483020',
    ];

    numeros.forEach(numero => {
        const chatId = `${numero}@c.us`;
        client.sendMessage(chatId, '👋 ¡Tu auto ya está listo! Gracias por confiar en nosotros 🚗✨')
        .then(() => {
            console.log('Mensaje enviado correctamente. a ' + numero );
        })
        .catch((err) => {
            console.error('Error al enviar mensaje: ' + numero, err);
        });
    });

    
});

client.initialize();