import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import { awsConfig } from './config.js';
import { trackTranslateCharacters } from '../services/usageTracker.js';

// Create Translate client
const translateClient = new TranslateClient(awsConfig);

// Supported languages by AWS Translate (common ones)
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'zh', name: 'Chinese' },
  { code: 'pl', name: 'Polish' },
  { code: 'ta', name: 'Tamil' },
];

/**
 * Translate text using AWS Translate
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, sourceLang, targetLang) {
  try {
    // Don't translate if source and target are the same
    if (sourceLang === targetLang) {
      return text;
    }

    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: sourceLang,
      TargetLanguageCode: targetLang,
    });

    const response = await translateClient.send(command);
    
    // Track character usage
    trackTranslateCharacters(text.length);
    
    return response.TranslatedText;
  } catch (error) {
    console.error(`Error translating text to ${targetLang}:`, error);
    throw error;
  }
}

/**
 * Translate multiple texts in batch
 * @param {Object} content - Object with key-value pairs to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} Translated content object
 */
export async function translateContent(content, sourceLang, targetLang) {
  try {
    const translatedContent = {};
    const entries = Object.entries(content);

    // Process translations sequentially to avoid rate limiting
    for (const [key, value] of entries) {
      if (typeof value === 'string') {
        translatedContent[key] = await translateText(value, sourceLang, targetLang);
      } else {
        translatedContent[key] = value;
      }
    }

    return translatedContent;
  } catch (error) {
    console.error(`Error translating content to ${targetLang}:`, error);
    throw error;
  }
}

export { translateClient };

