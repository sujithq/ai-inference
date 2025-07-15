import * as core from '@actions/core'
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference'
import { AzureKeyCredential } from '@azure/core-auth'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const RESPONSE_FILE = 'modelResponse.txt'

/**
 * Helper function to load content from a file or use fallback input
 * @param filePathInput - Input name for the file path
 * @param contentInput - Input name for the direct content
 * @param defaultValue - Default value to use if neither file nor content is provided
 * @returns The loaded content
 */
function loadContentFromFileOrInput(
  filePathInput: string,
  contentInput: string,
  defaultValue?: string
): string {
  const filePath = core.getInput(filePathInput)
  const contentString = core.getInput(contentInput)

  if (filePath !== undefined && filePath !== '') {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File for ${filePathInput} was not found: ${filePath}`)
    }
    return fs.readFileSync(filePath, 'utf-8')
  } else if (contentString !== undefined && contentString !== '') {
    return contentString
  } else if (defaultValue !== undefined) {
    return defaultValue
  } else {
    throw new Error(`Neither ${filePathInput} nor ${contentInput} was set`)
  }
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Load prompt content - required
    const prompt = loadContentFromFileOrInput('prompt-file', 'prompt')

    // Load system prompt with default value
    const systemPrompt = loadContentFromFileOrInput(
      'system-prompt-file',
      'system-prompt',
      'You are a helpful assistant'
    )

    const modelName: string = core.getInput('model')
    const maxTokens: number = parseInt(core.getInput('max-tokens'), 10)

    const token = process.env['GITHUB_TOKEN'] || core.getInput('token')
    if (token === undefined) {
      throw new Error('GITHUB_TOKEN is not set')
    }

    const endpoint = core.getInput('endpoint')

    // Get MCP server configuration
    const mcpServerUrl = 'https://api.githubcopilot.com/mcp/'
    const enableMcp = core.getBooleanInput('enable-mcp') || false

    let azureTools: any[] = []

    // Connect to MCP server if enabled
    if (enableMcp || true) {
      core.info('Connecting to GitHub MCP server...' + token)

      const transport = new StreamableHTTPClientTransport(
        new URL(mcpServerUrl),
        {
          requestInit: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      )

      const mcp = new Client({
        name: 'ai-inference-action',
        version: '1.0.0',
        transport
      })

      try {
        await mcp.connect(transport)
      } catch (mcpError) {
        core.warning(`Failed to connect to MCP server: ${mcpError}`)
        // Continue without tools if MCP connection fails
        return
      }

      core.info('Successfully connected to MCP server')

      // Pull tool metadata
      const tools = await mcp.listTools()
      core.info(`Retrieved ${tools.tools?.length || 0} tools from MCP server`)

      // Map MCP → Azure tool definitions
      azureTools = (tools.tools || []).map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema
        }
      }))

      core.info(`Mapped ${azureTools.length} tools for Azure AI Inference`)
    }

    const client = ModelClient(endpoint, new AzureKeyCredential(token), {
      userAgentOptions: { userAgentPrefix: 'github-actions-ai-inference' }
    })

    const requestBody: any = {
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      model: modelName
    }

    // Add tools if available
    if (azureTools.length > 0) {
      requestBody.tools = azureTools
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

    const modelResponse: string | null =
      response.body.choices[0].message.content

    core.info(`Model response: ${response || 'No response content'}`)

    // Handle tool calls if present
    const toolCalls = response.body.choices[0].message.tool_calls
    if (toolCalls && toolCalls.length > 0) {
      core.info(`Model requested ${toolCalls.length} tool calls`)
      // Note: For now, we'll just log the tool calls
      // In a full implementation, you'd execute them via MCP and continue the conversation
      for (const toolCall of toolCalls) {
        core.info(
          `Tool call: ${toolCall.function.name} with args: ${toolCall.function.arguments}`
        )
      }
    }

    // Set outputs for other workflow steps to use
    core.setOutput('response', modelResponse || '')

    // Save the response to a file in case the response overflow the output limit
    const responseFilePath = path.join(tempDir(), RESPONSE_FILE)
    core.setOutput('response-file', responseFilePath)

    if (modelResponse && modelResponse !== '') {
      fs.writeFileSync(responseFilePath, modelResponse, 'utf-8')
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

function tempDir(): string {
  const tempDirectory = process.env['RUNNER_TEMP'] || os.tmpdir()
  return tempDirectory
}
