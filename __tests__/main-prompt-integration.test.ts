import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { run } from '../src/main'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Mock the action toolkit functions
jest.mock('@actions/core')

// Mock fs to handle temporary file creation
jest.mock('fs')

// Mock the inference functions
jest.mock('../src/inference', () => ({
  simpleInference: jest.fn(),
  mcpInference: jest.fn()
}))

// Mock the MCP connection
jest.mock('../src/mcp', () => ({
  connectToGitHubMCP: jest.fn()
}))

import { simpleInference } from '../src/inference'

describe('main.ts - prompt.yml integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock environment variables
    process.env['GITHUB_TOKEN'] = 'test-token'

    // Mock core.getInput to return appropriate values
    const mockGetInput = core.getInput as jest.Mock
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'model':
          return 'openai/gpt-4o'
        case 'max-tokens':
          return '200'
        case 'endpoint':
          return 'https://models.github.ai/inference'
        case 'enable-github-mcp':
          return 'false'
        default:
          return ''
      }
    })

    // Mock core.getBooleanInput
    const mockGetBooleanInput = core.getBooleanInput as jest.Mock
    mockGetBooleanInput.mockReturnValue(false)

    // Mock fs.existsSync
    const mockExistsSync = fs.existsSync as jest.Mock
    mockExistsSync.mockReturnValue(true)

    // Mock fs.readFileSync for prompt file
    const mockReadFileSync = fs.readFileSync as jest.Mock
    mockReadFileSync.mockReturnValue(`
messages:
  - role: system
    content: Be as concise as possible
  - role: user
    content: 'Compare {{a}} and {{b}}, please'
model: openai/gpt-4o
    `)

    // Mock fs.writeFileSync
    const mockWriteFileSync = fs.writeFileSync as jest.Mock
    mockWriteFileSync.mockImplementation(() => {})

    // Mock simpleInference
    const mockSimpleInference = simpleInference as jest.Mock
    mockSimpleInference.mockResolvedValue('Mocked AI response')
  })

  it('should handle prompt YAML files with template variables', async () => {
    const mockGetInput = core.getInput as jest.Mock
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'prompt-file':
          return 'test.prompt.yml'
        case 'input':
          return 'a: cats\nb: dogs'
        case 'model':
          return 'openai/gpt-4o'
        case 'max-tokens':
          return '200'
        case 'endpoint':
          return 'https://models.github.ai/inference'
        case 'enable-github-mcp':
          return 'false'
        default:
          return ''
      }
    })

    await run()

    // Verify simpleInference was called with the correct message structure
    const mockSimpleInference = simpleInference as jest.Mock
    expect(mockSimpleInference).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'system',
            content: 'Be as concise as possible'
          },
          {
            role: 'user',
            content: 'Compare cats and dogs, please'
          }
        ],
        modelName: 'openai/gpt-4o',
        maxTokens: 200,
        endpoint: 'https://models.github.ai/inference',
        token: 'test-token'
      })
    )

    // Verify outputs were set
    expect(core.setOutput).toHaveBeenCalledWith(
      'response',
      'Mocked AI response'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'response-file',
      expect.any(String)
    )
  })

  it('should fall back to legacy format when not using prompt YAML', async () => {
    const mockGetInput = core.getInput as jest.Mock
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'prompt':
          return 'Hello, world!'
        case 'system-prompt':
          return 'You are helpful'
        case 'model':
          return 'openai/gpt-4o'
        case 'max-tokens':
          return '200'
        case 'endpoint':
          return 'https://models.github.ai/inference'
        case 'enable-github-mcp':
          return 'false'
        default:
          return ''
      }
    })

    await run()

    // Verify simpleInference was called with legacy format
    const mockSimpleInference = simpleInference as jest.Mock
    expect(mockSimpleInference).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: 'You are helpful',
        prompt: 'Hello, world!',
        modelName: 'openai/gpt-4o',
        maxTokens: 200,
        endpoint: 'https://models.github.ai/inference',
        token: 'test-token'
      })
    )
  })
})
