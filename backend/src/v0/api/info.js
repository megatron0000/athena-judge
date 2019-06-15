const Express = require('express')
const { SCOPES, getProjectOAuthClientId } = require('../google-interface/credentials/config')

const InfoRouter = Express.Router()

InfoRouter.get("/scopes", (req, res) => {
  res.json(SCOPES)
})

InfoRouter.get('/client-id', async (req, res) => {
  res.json(await getProjectOAuthClientId())
})

InfoRouter.get('/google-discovery-docs', (req, res) => {
  res.json([
    'https://classroom.googleapis.com/$discovery/rest?version=v1'
  ])
})

module.exports = {
  InfoRouter
}