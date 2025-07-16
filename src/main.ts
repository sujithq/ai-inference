import * as core from '@actions/core'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { connectToGitHubMCP } from './mcp.js'
import { simpleInference, mcpInference, InferenceRequest } from './inference.js'
import { loadContentFromFileOrInput } from './helpers.js'

const RESPONSE_FILE = 'modelResponse.txt'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const prompt = loadContentFromFileOrInput('prompt-file', 'prompt')

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
    const enableMcp = core.getBooleanInput('enable-github-mcp') || false

    const inferenceRequest: InferenceRequest = {
      systemPrompt,
      prompt,
      modelName,
      maxTokens,
      endpoint,
      token
    }

    let modelResponse: string | null = null

    if (enableMcp) {
      const mcpClient = await connectToGitHubMCP(token)

      if (mcpClient) {
        modelResponse = await mcpInference(inferenceRequest, mcpClient)
      } else {
        core.warning('MCP connection failed, falling back to simple inference')
        modelResponse = await simpleInference(inferenceRequest)
      }
    } else {
      modelResponse = await simpleInference(inferenceRequest)
    }

    core.setOutput('response', modelResponse || '')

    const responseFilePath = path.join(tempDir(), RESPONSE_FILE)
    core.setOutput('response-file', responseFilePath)

    if (modelResponse && modelResponse !== '') {
      fs.writeFileSync(responseFilePath, modelResponse, 'utf-8')
    }
  } catch (error) {
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
