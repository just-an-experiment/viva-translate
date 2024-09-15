import config from '@config';
import { Translation } from '../common/types';
import { errorLog } from '../common/utils/logger';

const FREE_API = 'https://api-free.deepl.com';
const PRO_API = 'https://api.deepl.com';
const DEEPL_URL = config.DEEPL_KEY.endsWith(':fx') || config.DEEPL_KEY === '' ? FREE_API : PRO_API;

/**
 * Call DeepL API to translate text
 *
 * @param texts
 * @param targetLang
 * @param sourceLang
 * @returns
 */
async function translateText(texts: string[], targetLang: string, sourceLang?: string): Promise<Translation[]> {
  try {
    const response = await fetch(`${DEEPL_URL}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${config.DEEPL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        target_lang: targetLang,
        source_lang: sourceLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.translations.map((translation: any) => ({
      text: translation.text,
      sourceLang: translation.detected_source_language,
    }));
  } catch (error) {
    errorLog(error, { description: 'Error translating with DeepL' });
    throw new Error('Failed to translate text');
  }
}

export default translateText;
