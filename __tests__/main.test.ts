/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
const mockPost = jest.fn().mockImplementation(() => ({
  body: {
    choices: [
      {
        message: {
          content: 'Hello, user!'
        }
      }
    ]
  }
}))

jest.unstable_mockModule('@azure-rest/ai-inference', () => ({
  default: jest.fn(() => ({
    path: jest.fn(() => ({
      post: mockPost
    }))
  })),
  isUnexpected: jest.fn(() => false)
}))

// Default to throwing errors to catch unexpected calls
const mockExistsSync = jest.fn().mockImplementation(() => {
  throw new Error('Unexpected call to existsSync - test should override this implementation')
})
const mockReadFileSync = jest.fn().mockImplementation(() => {
  throw new Error('Unexpected call to readFileSync - test should override this implementation')
})

jest.unstable_mockModule('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync
}))

jest.unstable_mockModule('@actions/core', () => core)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('Sets the response output', async () => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return 'Hello, AI!'
      if (name === 'system-prompt') return 'You are a test assistant.'
      if (name === 'token') return 'fake-token'
      return ''
    })

    await run()

    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'response',
      'Hello, user!'
    )

    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'response-file',
      expect.stringContaining('modelResponse.txt')
    )
  })

  it('Sets a failed status when no prompt is set', async () => {
    // Clear the getInput mock and simulate no prompt or prompt-file input
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return ''
      if (name === 'prompt-file') return ''
      if (name === 'token') return 'fake-token'
      return ''
    })

    await run()

    // Verify that the action was marked as failed.
    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'prompt is not set')
  })

  it('uses prompt-file', async () => {
    const promptFile = 'prompt.txt'
    const promptContent = 'This is a prompt from a file'
    
    // Set up mock to return specific content for the prompt file
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockImplementation((path, encoding) => {
      if (path === promptFile && encoding === 'utf-8') {
        return promptContent
      }
      throw new Error(`Unexpected file read: ${path}`)
    })
    
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt-file') return promptFile
      if (name === 'system-prompt') return 'You are a test assistant.'
      if (name === 'token') return 'fake-token'
      return ''
    })

    await run()

    expect(mockExistsSync).toHaveBeenCalledWith(promptFile)
    expect(mockReadFileSync).toHaveBeenCalledWith(promptFile, 'utf-8')
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'response',
      'Hello, user!'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'response-file',
      expect.stringContaining('modelResponse.txt')
    )
  })

  it('handles non-existent prompt-file with an error', async () => {
    const promptFile = 'non-existent-prompt.txt'
    
    // Mock the file not existing
    mockExistsSync.mockImplementation((path) => {
      if (path === promptFile) {
        return false
      }
      return true
    })
    
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt-file') return promptFile
      if (name === 'token') return 'fake-token'
      return ''
    })

    await run()

    // Verify that the error was correctly reported
    expect(core.setFailed).toHaveBeenCalledWith(
      `Prompt file not found: ${promptFile}`
    )
  })

  it('prefers prompt-file over prompt when both are provided', async () => {
    const promptFile = 'prompt.txt'
    const promptFileContent = 'This is a prompt from a file that should be used'
    const promptString = 'This is a direct prompt that should be ignored'

    // Set up mock to return specific content for the prompt file
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockImplementation((path, encoding) => {
      if (path === promptFile && encoding === 'utf-8') {
        return promptFileContent
      }
      throw new Error(`Unexpected file read: ${path}`)
    })

    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return promptString
      if (name === 'prompt-file') return promptFile
      if (name === 'system-prompt') return 'You are a test assistant.'
      if (name === 'token') return 'fake-token'
      return ''
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
          { role: 'user', content: promptFileContent }  // Should use the file content, not the string input
        ],
        max_tokens: expect.any(Number),
        model: expect.any(String)
      }
    })
    
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'response',
      'Hello, user!'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'response-file',
      expect.stringContaining('modelResponse.txt')
    )
  })

  it('uses system-prompt-file', async () => {
    const systemPromptFile = 'system-prompt.txt'
    const systemPromptContent = 'You are a specialized system assistant for testing'

    // Set up mock to return specific content for the system prompt file
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockImplementation((path, encoding) => {
      if (path === systemPromptFile && encoding === 'utf-8') {
        return systemPromptContent
      }
      throw new Error(`Unexpected file read: ${path}`)
    })

    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return 'Hello, AI!'
      if (name === 'system-prompt-file') return systemPromptFile
      if (name === 'token') return 'fake-token'
      return ''
    })

    await run()

    expect(mockExistsSync).toHaveBeenCalledWith(systemPromptFile)
    expect(mockReadFileSync).toHaveBeenCalledWith(systemPromptFile, 'utf-8')
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'response',
      'Hello, user!'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'response-file',
      expect.stringContaining('modelResponse.txt')
    )
  })
  
  it('handles non-existent system-prompt-file with an error', async () => {
    const systemPromptFile = 'non-existent-system-prompt.txt'
    
    // Mock the file not existing
    mockExistsSync.mockImplementation((path) => {
      if (path === systemPromptFile) {
        return false
      }
      return true
    })
    
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return 'Hello, AI!'
      if (name === 'system-prompt-file') return systemPromptFile
      if (name === 'token') return 'fake-token'
      return ''
    })

    await run()

    // Verify that the error was correctly reported
    expect(core.setFailed).toHaveBeenCalledWith(
      `System prompt file not found: ${systemPromptFile}`
    )
  })
  
  it('prefers system-prompt-file over system-prompt when both are provided', async () => {
    const systemPromptFile = 'system-prompt.txt'
    const systemPromptFileContent = 'You are a specialized system assistant from file'
    const systemPromptString = 'You are a basic system assistant from input parameter'

    // Set up mock to return specific content for the system prompt file
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockImplementation((path, encoding) => {
      if (path === systemPromptFile && encoding === 'utf-8') {
        return systemPromptFileContent
      }
      throw new Error(`Unexpected file read: ${path}`)
    })

    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return 'Hello, AI!'
      if (name === 'system-prompt-file') return systemPromptFile
      if (name === 'system-prompt') return systemPromptString
      if (name === 'token') return 'fake-token'
      return ''
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
    
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'response',
      'Hello, user!'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'response-file',
      expect.stringContaining('modelResponse.txt')
    )
  })
  
  it('uses both prompt-file and system-prompt-file together', async () => {
    const promptFile = 'prompt.txt'
    const promptContent = 'This is a prompt from a file'
    const systemPromptFile = 'system-prompt.txt'
    const systemPromptContent = 'You are a specialized system assistant from file'

    // Set up mock to return specific content for both files
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockImplementation((path, encoding) => {
      if (path === promptFile && encoding === 'utf-8') {
        return promptContent
      } else if (path === systemPromptFile && encoding === 'utf-8') {
        return systemPromptContent
      }
      throw new Error(`Unexpected file read: ${path}`)
    })
    
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt-file') return promptFile
      if (name === 'system-prompt-file') return systemPromptFile
      if (name === 'token') return 'fake-token'
      return ''
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
    
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'response',
      'Hello, user!'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'response-file',
      expect.stringContaining('modelResponse.txt')
    )
  })
  
  it('passes custom max-tokens parameter to the model', async () => {
    const customMaxTokens = 500
    
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return 'Hello, AI!'
      if (name === 'system-prompt') return 'You are a test assistant.'
      if (name === 'token') return 'fake-token'
      if (name === 'max-tokens') return customMaxTokens.toString()
      return ''
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
    
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'response',
      'Hello, user!'
    )
  })
})
