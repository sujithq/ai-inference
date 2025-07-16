import * as core from '@actions/core'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export interface ToolResult {
  tool_call_id: string
  role: 'tool'
  name: string
  content: string
}

export interface MCPClient {
  client: Client
  tools: any[]
}

/**
 * Connect to the MCP server and retrieve available tools
 */
export async function connectToMCP(token: string): Promise<MCPClient | null> {
  const mcpServerUrl = 'https://api.githubcopilot.com/mcp/'

  core.info('Connecting to GitHub MCP server...')

  const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })

  const client = new Client({
    name: 'ai-inference-action',
    version: '1.0.0',
    transport
  })

  try {
    await client.connect(transport)
  } catch (mcpError) {
    core.warning(`Failed to connect to MCP server: ${mcpError}`)
    return null
  }

  core.info('Successfully connected to MCP server')

  // Pull tool metadata
  const toolsResponse = await client.listTools()
  core.info(
    `Retrieved ${toolsResponse.tools?.length || 0} tools from MCP server`
  )

  // Map MCP → Azure tool definitions
  const tools = (toolsResponse.tools || []).map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema
    }
  }))

  core.info(`Mapped ${tools.length} tools for Azure AI Inference`)

  return { client, tools }
}

/**
 * Execute a single tool call via MCP
 */
export async function executeToolCall(
  mcpClient: Client,
  toolCall: any
): Promise<ToolResult> {
  core.info(
    `Executing tool: ${toolCall.function.name} with args: ${toolCall.function.arguments}`
  )

  try {
    // Parse the arguments from JSON string
    const args = JSON.parse(toolCall.function.arguments)

    // Call the tool via MCP
    const result = await mcpClient.callTool({
      name: toolCall.function.name,
      arguments: args
    })

    core.info(`Tool ${toolCall.function.name} executed successfully`)

    // Return the result formatted for the conversation
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      name: toolCall.function.name,
      content: JSON.stringify(result.content)
    }
  } catch (toolError) {
    core.warning(
      `Failed to execute tool ${toolCall.function.name}: ${toolError}`
    )

    // Return error result to continue conversation
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      name: toolCall.function.name,
      content: `Error: ${toolError}`
    }
  }
}

/**
 * Execute all tool calls from a response
 */
export async function executeToolCalls(
  mcpClient: Client,
  toolCalls: any[]
): Promise<ToolResult[]> {
  const toolResults: ToolResult[] = []

  for (const toolCall of toolCalls) {
    const result = await executeToolCall(mcpClient, toolCall)
    toolResults.push(result)
  }

  return toolResults
}
