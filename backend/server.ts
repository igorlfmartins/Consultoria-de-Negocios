// Backend for Consultoria de Negocios - Railway v1.0.3
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import 'dotenv/config'
import { AGENT_PROMPTS } from './agents.js'

// Placeholder for agent system instructions - will be managed dynamically

const app = express()
app.use(cors())
app.use(express.json())

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Backend is running! v1.0.6')
})

// app.get('/api/debug-models', async (req: Request, res: Response) => {
//   try {
//     const geminiKey = process.env.GEMINI_API_KEY
//     if (!geminiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' })
//     
//     const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`)
//     const data = await response.json()
//     res.json(data)
//   } catch (err: any) {
//     res.status(500).json({ error: err.message })
//   }
// })

const clientApiKey = process.env.CLIENT_API_KEY
const geminiKey = process.env.GEMINI_API_KEY

if (!geminiKey) {
  throw new Error('GEMINI_API_KEY not set')
}

const genAI = new GoogleGenerativeAI(geminiKey)

app.post('/api/consultoria', async (req: Request, res: Response) => {
  try {
    if (clientApiKey) {
      const apiKey = req.header('x-api-key')
      if (apiKey !== clientApiKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' })
      }
    }

    const { message, history, selectedAgents } = req.body as {
      message?: string
      history?: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>
      selectedAgents?: string[]
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const modelName = 'gemini-2.0-flash'

    const callAgent = async (agentName: string, userMessage: string, chatHistory: Array<{ role: 'user' | 'model'; parts: { text: string }[] }> = []) => {
      const agentPrompt = AGENT_PROMPTS[agentName as keyof typeof AGENT_PROMPTS]
      if (!agentPrompt) {
        throw new Error(`Agent prompt for ${agentName} not found.`)
      }

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: agentPrompt,
      })

      const chat = model.startChat({
        history: chatHistory,
      })

      const result = await chat.sendMessage(userMessage)
      return result.response.text()
    }

    let finalConsultants: string[] = []

    if (selectedAgents && selectedAgents.length > 0) {
      // If user selects specific agents, use them directly
      finalConsultants = selectedAgents
    } else {
      // Otherwise, use the Router Agent to decide
      const routerResponse = await callAgent('Router Agent', message, history)
      finalConsultants = routerResponse.split(',').map(consultant => consultant.trim()).filter(Boolean)
    }

    if (finalConsultants.length === 0) {
      return res.json({ reply: 'No relevant consultants found for your query.' })
    }

    const consultantResponses: { [key: string]: string } = {}
    for (const consultantName of finalConsultants) {
      try {
        const response = await callAgent(consultantName, message, history)
        consultantResponses[consultantName] = response
      } catch (error: any) {
        console.error(`Error calling ${consultantName}:`, error)
        consultantResponses[consultantName] = `Error: ${error.message}`
      }
    }

    // For now, return all consultant responses. A summarizer agent will be implemented later.
    // return res.json({ reply: consultantResponses })

    // Step 3: Call the Summarizer Agent
    const summarizerInput = `Original User Query: ${message}\n\nConsultant Responses:\n` +
      Object.entries(consultantResponses)
        .map(([name, response]) => `--- ${name} ---\n${response}`)
        .join('\n\n')

    const finalSummary = await callAgent('Summarizer Agent', summarizerInput)
    console.log('Final Summary:', finalSummary)

    return res.json({ reply: finalSummary })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
