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

const mockExistsSync = jest.fn().mockReturnValue(true)
const mockReadFileSync = jest.fn().mockReturnValue('Hello, AI!')

jest.unstable_mockModule('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync
}))

jest.unstable_mockModule('@actions/core', () => core)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  it('Sets the response output', async () => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return 'Hello, AI!'
      if (name === 'system_prompt') return 'You are a test assistant.'
      if (name === 'model_name') return 'gpt-4o'
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
      'response-path',
      expect.stringContaining('modelResponse.txt')
    )
  })

  it('Sets a failed status', async () => {
    // Clear the getInput mock and simulate no prompt or prompt-file input
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt') return ''
      if (name === 'prompt_file') return ''
      return ''
    })

    await run()

    // Verify that the action was marked as failed.
    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'prompt is not set')
  })

  it('uses prompt-file', async () => {
    const promptFile = 'prompt.txt'
    core.getInput.mockImplementation((name) => {
      if (name === 'prompt-file') return promptFile
      if (name === 'system-prompt') return 'You are a test assistant.'
      if (name === 'model-name') return 'gpt-4o'
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
      'response-path',
      expect.stringContaining('modelResponse.txt')
    )
  })
})
