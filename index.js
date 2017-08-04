"use strict";

const http = require('http')
const Bot = require('messenger-bot')

const FB_TOKEN = process.env.FB_TOKEN
const FB_VERIFY = process.env.FB_VERIFY

let bot = new Bot({
    token: FB_TOKEN,
    verify: FB_VERIFY
})

bot.on('error', (err) => {
    console.log(err.message)
})

bot.on('message', (payload, reply) => {
  let text = payload.message.text

  bot.getProfile(payload.sender.id, (err, profile) => {
    if (err) throw err

    reply({ text }, (err) => {
      if (err) throw err

      console.log(`Echoed back to ${profile.first_name} ${profile.last_name}: ${text}`)
    })
  })
})
http.createServer(bot.middleware()).listen(process.env.PORT)
console.log('Server is running.')