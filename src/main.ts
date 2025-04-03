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
    const systemPrompt: string = core.getInput('system_prompt')
    const modelName = core.getInput('model_name') || 'gpt-4o'

    const token = process.env['GITHUB_TOKEN']
    if (token === undefined) {
      throw new Error('GITHUB_TOKEN is not set')
    }
    const endpoint = 'https://models.inference.ai.azure.com'

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
        max_tokens: 1000,
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
