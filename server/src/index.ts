/**
 * @fileoverview Main application entry point.
 * Sets up Express server with middleware and routes.
 * 
 * @module index
 * @requires express
 * @requires ./chat/chatRouter
 * @requires body-parser
 * @requires dotenv/config
 */

import express from 'express'
import chatRouter from './chat/chatRouter'
import bodyParser from 'body-parser'
import 'dotenv/config'

const app = express()

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.json({limit: '50mb'}))

/**
 * Health check endpoint
 * @route GET /
 * @returns {string} Simple health check message
 */
app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Mount chat routes
app.use('/chat', chatRouter)

// Start server
app.listen(3050, () => {
  console.log('Server started on port 3050')
})
