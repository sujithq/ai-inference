import * as core from '@actions/core'
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference'
import { AzureKeyCredential } from '@azure/core-auth'
import { GitHubMCPClient, executeToolCalls } from './mcp.js'
import { handleUnexpectedResponse } from './helpers.js'

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
  toolCalls?: Array<{
    id: string
    type: string
    function: {
      name: string
      arguments: string
    }
  }>
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
    handleUnexpectedResponse(response)
  }

  const modelResponse = response.body.choices[0].message.content
  core.info(`Model response: ${modelResponse || 'No response content'}`)

  return modelResponse
}

/**
 * GitHub MCP-enabled inference with tool execution loop
 */
export async function mcpInference(
  request: InferenceRequest,
  githubMcpClient: GitHubMCPClient
): Promise<string | null> {
  core.info('Running GitHub MCP inference with tools')

  const client = ModelClient(
    request.endpoint,
    new AzureKeyCredential(request.token),
    {
      userAgentOptions: { userAgentPrefix: 'github-actions-ai-inference' }
    }
  )

  // Start with the initial conversation
  const messages = [
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
      tools: githubMcpClient.tools
    }

    const response = await client.path('/chat/completions').post({
      body: requestBody
    })

    if (isUnexpected(response)) {
      handleUnexpectedResponse(response)
    }

    const assistantMessage = response.body.choices[0].message
    const modelResponse = assistantMessage.content
    const toolCalls = assistantMessage.tool_calls

    core.info(`Model response: ${modelResponse || 'No response content'}`)

    messages.push({
      role: 'assistant',
      content: modelResponse || '',
      ...(toolCalls && { tool_calls: toolCalls })
    })

    if (!toolCalls || toolCalls.length === 0) {
      core.info('No tool calls requested, ending GitHub MCP inference loop')
      return modelResponse
    }

    core.info(`Model requested ${toolCalls.length} tool calls`)

    // Execute all tool calls via GitHub MCP
    const toolResults = await executeToolCalls(
      githubMcpClient.client,
      toolCalls
    )

    // Add tool results to the conversation
    messages.push(...toolResults)

    core.info('Tool results added, continuing conversation...')
  }

  core.warning(
    `GitHub MCP inference loop exceeded maximum iterations (${maxIterations})`
  )

  // Return the last assistant message content
  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === 'assistant')

  return lastAssistantMessage?.content || null
}
