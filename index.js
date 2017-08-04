"use strict";

const http = require('http')
const Bot = require('messenger-bot')

const FB_TOKEN = process.env.FB_TOKEN
const FB_VERIFY = process.env.FB_VERIFY

let bot = new Bot({
   token: PAGE_TOKEN,
   verify: VERIFY_TOKEN
})

bot.on('error', function(err){
   console.log(err.message)
})

bot.on('message', (payload, reply) => {
    let text = payload.message.text
    reply({
        text
    }, (err) => {
        if (err) {
            console.log(err.message)
        }

        console.log(`Echoed back : ${text}`)
    })
})

http.createServer(bot.middleware()).listen(process.env.PORT)
console.log('Server is running.')