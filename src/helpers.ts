import * as core from '@actions/core'
import { GetChatCompletionsDefaultResponse } from '@azure-rest/ai-inference'
import * as fs from 'fs'

/**
 * Helper function to load content from a file or use fallback input
 * @param filePathInput - Input name for the file path
 * @param contentInput - Input name for the direct content
 * @param defaultValue - Default value to use if neither file nor content is provided
 * @returns The loaded content
 */
export function loadContentFromFileOrInput(
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
 * Helper function to handle unexpected responses from AI service
 * @param response - The response object from the AI service
 * @throws Error with appropriate error message based on response content
 */
export function handleUnexpectedResponse(
  response: GetChatCompletionsDefaultResponse
): never {
  // Extract x-ms-error-code from headers if available
  const errorCode = response.headers['x-ms-error-code']
  const errorCodeMsg = errorCode ? ` (error code: ${errorCode})` : ''

  // Check if response body exists and contains error details
  if (response.body && response.body.error) {
    throw response.body.error
  }

  // Handle case where response body is missing
  if (!response.body) {
    throw new Error(
      `Failed to get response from AI service (status: ${response.status})${errorCodeMsg}. ` +
        'Please check network connection and endpoint configuration.'
    )
  }

  // Handle other error cases
  throw new Error(
    `AI service returned error response (status: ${response.status})${errorCodeMsg}: ` +
      (typeof response.body === 'string'
        ? response.body
        : JSON.stringify(response.body))
  )
}
