import * as core from '@actions/core'
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference'
import { AzureKeyCredential } from '@azure/core-auth'
import { MCPClient, executeToolCalls } from './mcp.js'

export interface InferenceRequest {
  systemPrompt: string
  prompt: string
  modelName: string
  maxTokens: number
  endpoint: string
  token: string
}

export interface InferenceResponse {
  content: string | null
  toolCalls?: any[]
}

/**
 * Simple one-shot inference without tools
 */
export async function simpleInference(
  request: InferenceRequest
): Promise<string | null> {
  core.info('Running simple inference without tools')

  const client = ModelClient(
    request.endpoint,
    new AzureKeyCredential(request.token),
    {
      userAgentOptions: { userAgentPrefix: 'github-actions-ai-inference' }
    }
  )

  const requestBody = {
    messages: [
      {
        role: 'system',
        content: request.systemPrompt
      },
      { role: 'user', content: request.prompt }
    ],
    max_tokens: request.maxTokens,
    model: request.modelName
  }

  const response = await client.path('/chat/completions').post({
    body: requestBody
  })

  if (isUnexpected(response)) {
    throw new Error(
      'An error occurred while fetching the response (' +
        response.status +
        '): ' +
        response.body
    )
  }

  const modelResponse = response.body.choices[0].message.content
  core.info(`Model response: ${modelResponse || 'No response content'}`)

  return modelResponse
}

/**
 * MCP-enabled inference with tool execution loop
 */
export async function mcpInference(
  request: InferenceRequest,
  mcpClient: MCPClient
): Promise<string | null> {
  core.info('Running MCP inference with tools')

  const client = ModelClient(
    request.endpoint,
    new AzureKeyCredential(request.token),
    {
      userAgentOptions: { userAgentPrefix: 'github-actions-ai-inference' }
    }
  )

  // Start with the initial conversation
  let messages: any[] = [
    {
      role: 'system',
      content: request.systemPrompt
    },
    { role: 'user', content: request.prompt }
  ]

  let iterationCount = 0
  const maxIterations = 5 // Prevent infinite loops

  while (iterationCount < maxIterations) {
    iterationCount++
    core.info(`MCP inference iteration ${iterationCount}`)

    const requestBody = {
      messages: messages,
      max_tokens: request.maxTokens,
      model: request.modelName,
      tools: mcpClient.tools
    }

    const response = await client.path('/chat/completions').post({
      body: requestBody
    })

    if (isUnexpected(response)) {
      throw new Error(
        'An error occurred while fetching the response (' +
          response.status +
          '): ' +
          response.body
      )
    }

    const assistantMessage = response.body.choices[0].message
    const modelResponse = assistantMessage.content
    const toolCalls = assistantMessage.tool_calls

    core.info(`Model response: ${modelResponse || 'No response content'}`)

    messages.push({
      role: 'assistant',
      content: modelResponse,
      ...(toolCalls && { tool_calls: toolCalls })
    })

    if (!toolCalls || toolCalls.length === 0) {
      core.info('No tool calls requested, ending MCP inference loop')
      return modelResponse
    }

    core.info(`Model requested ${toolCalls.length} tool calls`)

    const toolResults = await executeToolCalls(mcpClient.client, toolCalls)
    messages.push(...toolResults)

    core.info('Tool results added, continuing conversation...')
  }

  core.warning(
    `MCP inference loop exceeded maximum iterations (${maxIterations})`
  )

  // Return the last assistant message content
  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === 'assistant')

  return lastAssistantMessage?.content || null
}
