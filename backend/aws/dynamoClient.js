import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { awsConfig, DYNAMODB_TABLE_NAME } from './config.js';
import {
  trackDynamoRead,
  trackDynamoWrite,
  trackDynamoDelete,
  trackDynamoScan,
  updateStorageSize,
} from '../services/usageTracker.js';

// Create DynamoDB client
const client = new DynamoDBClient(awsConfig);

// Create document client for easier JSON handling
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

/**
 * Get translation for a specific language from DynamoDB
 * @param {string} lang - Language code
 * @returns {Promise<Object|null>} Translation content or null
 */
export async function getTranslation(lang) {
  try {
    const command = new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { lang },
    });

    const response = await docClient.send(command);
    trackDynamoRead(1);
    return response.Item?.content || null;
  } catch (error) {
    console.error(`Error getting translation for ${lang}:`, error);
    throw error;
  }
}

/**
 * Save translation for a language to DynamoDB
 * @param {string} lang - Language code
 * @param {Object} content - Translation content
 */
export async function saveTranslation(lang, content) {
  try {
    const command = new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        lang,
        content,
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);
    trackDynamoWrite(1);
    
    // Estimate storage size
    const itemSize = JSON.stringify({ lang, content }).length;
    updateStorageSize(itemSize);
    
    console.log(`Translation saved for ${lang}`);
  } catch (error) {
    console.error(`Error saving translation for ${lang}:`, error);
    throw error;
  }
}

/**
 * Update a single translation key in DynamoDB
 * @param {string} lang - Language code
 * @param {string} key - Translation key
 * @param {string} value - New value
 */
export async function updateTranslationKey(lang, key, value) {
  try {
    const command = new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { lang },
      UpdateExpression: 'SET content.#key = :value, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#key': key,
      },
      ExpressionAttributeValues: {
        ':value': value,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    trackDynamoWrite(1);
    return response.Attributes?.content || null;
  } catch (error) {
    console.error(`Error updating key ${key} for ${lang}:`, error);
    throw error;
  }
}

/**
 * Get all translations from DynamoDB
 * @returns {Promise<Array>} Array of translation items
 */
export async function getAllTranslations() {
  try {
    const command = new ScanCommand({
      TableName: DYNAMODB_TABLE_NAME,
    });

    const response = await docClient.send(command);
    const items = response.Items || [];
    trackDynamoScan(items.length);
    
    // Estimate total storage size
    const totalSize = items.reduce((acc, item) => acc + JSON.stringify(item).length, 0);
    updateStorageSize(totalSize);
    
    return items;
  } catch (error) {
    console.error('Error scanning translations:', error);
    throw error;
  }
}

/**
 * Check if a language exists in DynamoDB
 * @param {string} lang - Language code
 * @returns {Promise<boolean>}
 */
export async function languageExists(lang) {
  try {
    const command = new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { lang },
      ProjectionExpression: 'lang',
    });

    const response = await docClient.send(command);
    trackDynamoRead(1);
    return !!response.Item;
  } catch (error) {
    console.error(`Error checking language ${lang}:`, error);
    throw error;
  }
}

/**
 * Delete a language from DynamoDB
 * @param {string} lang - Language code
 */
export async function deleteLanguage(lang) {
  try {
    const command = new DeleteCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { lang },
    });

    await docClient.send(command);
    trackDynamoDelete(1);
    console.log(`Language deleted from DynamoDB: ${lang}`);
  } catch (error) {
    console.error(`Error deleting language ${lang} from DynamoDB:`, error);
    throw error;
  }
}

/**
 * Get key order from DynamoDB
 * @returns {Promise<string[]>} Array of keys in order
 */
export async function getKeyOrder() {
  try {
    const command = new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { lang: '_keyOrder' },
    });

    const response = await docClient.send(command);
    trackDynamoRead(1);
    return response.Item?.order || [];
  } catch (error) {
    console.error('Error getting key order:', error);
    return [];
  }
}

/**
 * Save key order to DynamoDB
 * @param {string[]} order - Array of keys in order
 */
export async function saveKeyOrder(order) {
  try {
    const command = new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        lang: '_keyOrder',
        order,
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);
    trackDynamoWrite(1);
    console.log('Key order saved to DynamoDB');
  } catch (error) {
    console.error('Error saving key order:', error);
    throw error;
  }
}

export { docClient, DYNAMODB_TABLE_NAME };

