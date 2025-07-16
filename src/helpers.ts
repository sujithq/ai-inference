import * as core from '@actions/core'
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
