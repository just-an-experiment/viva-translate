import config from '@config';
import { AIFeatures } from '../common/constants';
import { errorLog } from '../common/utils/logger';

const AIGenFeatures = [
  'summaries',
];

const Prompts = [
  'Analyze the provided meeting transcript and generate a summary.',
];

/**
 * Generate instructions for the prompt response
 * @param feature
 * @param maxItems
 * @param arrayDefinition
 * @returns
 */
function getPromptResponseInstructions(feature: AIFeatures, maxItems: number = 5, arrayDefinition?: string) {
  if (!arrayDefinition) {
    // eslint-disable-next-line no-param-reassign
    arrayDefinition = 'a list of only new items. Each item is a single sentence';
  }
  // eslint-disable-next-line max-len
  return `Limit response only to the provided content. Transcripts can have grammatical errors. Summarize and group related new items in a maximum of ${maxItems} elements. Return response in JSON format with ${AIGenFeatures[feature]} array with ${arrayDefinition}.`;
}

/**
 * Call to generate the AI feature
 * @param feature
 * @param transcriptions
 * @param regenerate
 * @returns
 */
export default async function generateAIFeature(
  feature: AIFeatures,
  transcriptions: string,
  regenerate: boolean = false
): Promise<string[]> {
  const prompt = `${Prompts[feature]} ${getPromptResponseInstructions(feature, regenerate ? 5 : 2, undefined)}`;

  const data = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: prompt }, { role: 'user', content: transcriptions }]
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.OPENAI_KEY}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    const textResult = result.choices[0].message.content.trim();
    const json =
      textResult.startsWith('```json') ? JSON.parse(textResult.substring(7, textResult.length - 3)) : textResult;
    return json[AIGenFeatures[feature]];
  } catch (error) {
    errorLog(error, { description: 'Error fetching data from OpenAI' });
    throw error;
  }
}
