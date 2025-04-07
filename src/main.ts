import * as core from '@actions/core'
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference'
import { AzureKeyCredential } from '@azure/core-auth'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const prompt: string = core.getInput('prompt')
    if (prompt === undefined || prompt === '') {
      throw new Error('prompt is not set')
    }

    const systemPrompt: string = core.getInput('system_prompt')
    const modelName: string = core.getInput('model')
    const maxTokens: number = parseInt(core.getInput('max_tokens'), 10)

    const token = process.env['GITHUB_TOKEN']
    if (token === undefined) {
      throw new Error('GITHUB_TOKEN is not set')
    }
    const endpoint = core.getInput('endpoint')

    const client = ModelClient(endpoint, new AzureKeyCredential(token))

    const response = await client.path('/chat/completions').post({
      body: {
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are a helpful assistant.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: maxTokens,
        model: modelName
      }
    })

    if (isUnexpected(response)) {
      throw response.body.error
    }

    const modelResponse: string | null =
      response.body.choices[0].message.content

    // Set outputs for other workflow steps to use
    core.setOutput('response', modelResponse || '')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
