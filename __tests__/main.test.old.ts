/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Default to throwing errors to catch unexpected calls
const mockExistsSync = jest.fn().mockImplementation(() => {
  throw new Error(
    'Unexpected call to existsSync - test should override this implementation'
  )
})
const mockReadFileSync = jest.fn().mockImplementation(() => {
  throw new Error(
    'Unexpected call to readFileSync - test should override this implementation'
  )
})
const mockWriteFileSync = jest.fn()

/**
 * Helper function to mock file system operations for one or more files
 * @param fileContents - Object mapping file paths to their contents
 * @param nonExistentFiles - Array of file paths that should be treated as non-existent
 */
function mockFileContent(
  fileContents: Record<string, string> = {},
  nonExistentFiles: string[] = []
): void {
  // Mock existsSync to return true for files that exist, false for those that don't
  mockExistsSync.mockImplementation((...args: unknown[]): boolean => {
    const [path] = args as [string]
    if (nonExistentFiles.includes(path)) {
      return false
    }
    return path in fileContents || true
  })

  // Mock readFileSync to return the content for known files
  mockReadFileSync.mockImplementation((...args: unknown[]): string => {
    const [path, options] = args as [string, BufferEncoding]
    if (options === 'utf-8' && path in fileContents) {
      return fileContents[path]
    }
    throw new Error(`Unexpected file read: ${path}`)
  })
}

/**
 * Helper function to mock action inputs
 * @param inputs - Object mapping input names to their values
 */
function mockInputs(inputs: Record<string, string> = {}): void {
  // Default values that are applied unless overridden
  const defaultInputs: Record<string, string> = {
    token: 'fake-token',
    model: 'gpt-4',
    'max-tokens': '100',
    endpoint: 'https://api.test.com'
  }

  // Combine defaults with user-provided inputs
  const allInputs: Record<string, string> = { ...defaultInputs, ...inputs }

  core.getInput.mockImplementation((name: string) => {
    return allInputs[name] || ''
  })
  
  core.getBooleanInput.mockImplementation((name: string) => {
    const value = allInputs[name]
    return value === 'true'
  })
}

/**
 * Helper function to verify common response assertions
 */
function verifyStandardResponse(): void {
  expect(core.setOutput).toHaveBeenNthCalledWith(1, 'response', 'Hello, user!')
  expect(core.setOutput).toHaveBeenNthCalledWith(
    2,
    'response-file',
    expect.stringContaining('modelResponse.txt')
  )
}

jest.unstable_mockModule('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync
}))

// Mock MCP and inference modules
const mockConnectToMCP = jest.fn() as jest.MockedFunction<any>
const mockSimpleInference = jest.fn() as jest.MockedFunction<any>
const mockMcpInference = jest.fn() as jest.MockedFunction<any>

jest.unstable_mockModule('../src/mcp.js', () => ({
  connectToMCP: mockConnectToMCP
}))

jest.unstable_mockModule('../src/inference.js', () => ({
  simpleInference: mockSimpleInference,
  mcpInference: mockMcpInference
}))

jest.unstable_mockModule('@actions/core', () => core)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up default mock responses
    mockSimpleInference.mockResolvedValue('Hello, user!')
    mockMcpInference.mockResolvedValue('Hello, user!')
  })

  it('Sets the response output', async () => {
    // Set the action's inputs as return values from core.getInput().
    mockInputs({
      prompt: 'Hello, AI!',
      'system-prompt': 'You are a test assistant.'
    })

    await run()

    expect(core.setOutput).toHaveBeenCalled()
    verifyStandardResponse()
  })

  it('Sets a failed status when no prompt is set', async () => {
    // Clear the getInput mock and simulate no prompt or prompt-file input
    mockInputs({
      prompt: '',
      'prompt-file': ''
    })

    await run()

    // Verify that the action was marked as failed.
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'Neither prompt-file nor prompt was set'
    )
  })

  it('uses prompt-file', async () => {
    const promptFile = 'prompt.txt'
    const promptContent = 'This is a prompt from a file'

    // Set up mock to return specific content for the prompt file
    mockFileContent({
      [promptFile]: promptContent
    })

    // Set up input mocks
    mockInputs({
      'prompt-file': promptFile,
      'system-prompt': 'You are a test assistant.'
    })

    await run()

    expect(mockExistsSync).toHaveBeenCalledWith(promptFile)
    expect(mockReadFileSync).toHaveBeenCalledWith(promptFile, 'utf-8')
    verifyStandardResponse()
  })

  it('handles non-existent prompt-file with an error', async () => {
    const promptFile = 'non-existent-prompt.txt'

    // Mock the file not existing
    mockFileContent({}, [promptFile])

    // Set up input mocks
    mockInputs({
      'prompt-file': promptFile
    })

    await run()

    // Verify that the error was correctly reported
    expect(core.setFailed).toHaveBeenCalledWith(
      `File for prompt-file was not found: ${promptFile}`
    )
  })

  it('prefers prompt-file over prompt when both are provided', async () => {
    const promptFile = 'prompt.txt'
    const promptFileContent = 'This is a prompt from a file that should be used'
    const promptString = 'This is a direct prompt that should be ignored'

    // Set up mock to return specific content for the prompt file
    mockFileContent({
      [promptFile]: promptFileContent
    })

    // Set up input mocks
    mockInputs({
      prompt: promptString,
      'prompt-file': promptFile,
      'system-prompt': 'You are a test assistant.'
    })

    await run()

    expect(mockExistsSync).toHaveBeenCalledWith(promptFile)
    expect(mockReadFileSync).toHaveBeenCalledWith(promptFile, 'utf-8')

    // Check that the post call was made with the prompt from the file, not the input parameter
    expect(mockPost).toHaveBeenCalledWith({
      body: {
        messages: [
          {
            role: 'system',
            content: expect.any(String)
          },
          { role: 'user', content: promptFileContent } // Should use the file content, not the string input
        ],
        max_tokens: expect.any(Number),
        model: expect.any(String)
      }
    })

    verifyStandardResponse()
  })

  it('uses system-prompt-file', async () => {
    const systemPromptFile = 'system-prompt.txt'
    const systemPromptContent =
      'You are a specialized system assistant for testing'

    // Set up mock to return specific content for the system prompt file
    mockFileContent({
      [systemPromptFile]: systemPromptContent
    })

    // Set up input mocks
    mockInputs({
      prompt: 'Hello, AI!',
      'system-prompt-file': systemPromptFile
    })

    await run()

    expect(mockExistsSync).toHaveBeenCalledWith(systemPromptFile)
    expect(mockReadFileSync).toHaveBeenCalledWith(systemPromptFile, 'utf-8')
    verifyStandardResponse()
  })

  it('handles non-existent system-prompt-file with an error', async () => {
    const systemPromptFile = 'non-existent-system-prompt.txt'

    // Mock the file not existing
    mockFileContent({}, [systemPromptFile])

    // Set up input mocks
    mockInputs({
      prompt: 'Hello, AI!',
      'system-prompt-file': systemPromptFile
    })

    await run()

    // Verify that the error was correctly reported
    expect(core.setFailed).toHaveBeenCalledWith(
      `File for system-prompt-file was not found: ${systemPromptFile}`
    )
  })

  it('prefers system-prompt-file over system-prompt when both are provided', async () => {
    const systemPromptFile = 'system-prompt.txt'
    const systemPromptFileContent =
      'You are a specialized system assistant from file'
    const systemPromptString =
      'You are a basic system assistant from input parameter'

    // Set up mock to return specific content for the system prompt file
    mockFileContent({
      [systemPromptFile]: systemPromptFileContent
    })

    // Set up input mocks
    mockInputs({
      prompt: 'Hello, AI!',
      'system-prompt-file': systemPromptFile,
      'system-prompt': systemPromptString
    })

    await run()

    expect(mockExistsSync).toHaveBeenCalledWith(systemPromptFile)
    expect(mockReadFileSync).toHaveBeenCalledWith(systemPromptFile, 'utf-8')

    // Check that the post call was made with the system prompt from the file, not the input parameter
    expect(mockPost).toHaveBeenCalledWith({
      body: {
        messages: [
          {
            role: 'system',
            content: systemPromptFileContent // Should use the file content, not the string input
          },
          { role: 'user', content: 'Hello, AI!' }
        ],
        max_tokens: expect.any(Number),
        model: expect.any(String)
      }
    })

    verifyStandardResponse()
  })

  it('uses both prompt-file and system-prompt-file together', async () => {
    const promptFile = 'prompt.txt'
    const promptContent = 'This is a prompt from a file'
    const systemPromptFile = 'system-prompt.txt'
    const systemPromptContent =
      'You are a specialized system assistant from file'

    // Set up mock to return specific content for both files
    mockFileContent({
      [promptFile]: promptContent,
      [systemPromptFile]: systemPromptContent
    })

    // Set up input mocks
    mockInputs({
      'prompt-file': promptFile,
      'system-prompt-file': systemPromptFile
    })

    await run()

    expect(mockExistsSync).toHaveBeenCalledWith(promptFile)
    expect(mockExistsSync).toHaveBeenCalledWith(systemPromptFile)
    expect(mockReadFileSync).toHaveBeenCalledWith(promptFile, 'utf-8')
    expect(mockReadFileSync).toHaveBeenCalledWith(systemPromptFile, 'utf-8')

    // Check that the post call was made with both the prompt and system prompt from files
    expect(mockPost).toHaveBeenCalledWith({
      body: {
        messages: [
          {
            role: 'system',
            content: systemPromptContent
          },
          { role: 'user', content: promptContent }
        ],
        max_tokens: expect.any(Number),
        model: expect.any(String)
      }
    })

    verifyStandardResponse()
  })

  it('passes custom max-tokens parameter to the model', async () => {
    const customMaxTokens = 500

    mockInputs({
      prompt: 'Hello, AI!',
      'system-prompt': 'You are a test assistant.',
      'max-tokens': customMaxTokens.toString()
    })

    await run()

    // Check that the post call was made with the correct max_tokens parameter
    expect(mockPost).toHaveBeenCalledWith({
      body: {
        messages: expect.any(Array),
        max_tokens: customMaxTokens,
        model: expect.any(String)
      }
    })

    verifyStandardResponse()
  })
})
