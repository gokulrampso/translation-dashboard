/**
 * Usage Tracker - Tracks DynamoDB and AWS Translate usage for cost estimation
 */

// Usage statistics stored in memory
let usageStats = {
  dynamodb: {
    reads: 0,
    writes: 0,
    deletes: 0,
    scans: 0,
    storageBytes: 0,
  },
  translate: {
    charactersTranslated: 0,
    requestCount: 0,
  },
  // Track by session (resets on server restart)
  session: {
    startTime: Date.now(),
  },
};

// AWS Pricing (approximate, varies by region)
const PRICING = {
  dynamodb: {
    // On-demand pricing (per million)
    readRequestUnit: 0.25, // per million read request units
    writeRequestUnit: 1.25, // per million write request units
    storagePerGBMonth: 0.25, // per GB per month
  },
  translate: {
    perCharacter: 0.000015, // $15 per million characters
  },
};

/**
 * Track a DynamoDB read operation
 * @param {number} count - Number of items read
 */
export function trackDynamoRead(count = 1) {
  usageStats.dynamodb.reads += count;
}

/**
 * Track a DynamoDB write operation
 * @param {number} count - Number of items written
 */
export function trackDynamoWrite(count = 1) {
  usageStats.dynamodb.writes += count;
}

/**
 * Track a DynamoDB delete operation
 * @param {number} count - Number of items deleted
 */
export function trackDynamoDelete(count = 1) {
  usageStats.dynamodb.deletes += count;
}

/**
 * Track a DynamoDB scan operation
 * @param {number} itemsScanned - Number of items scanned
 */
export function trackDynamoScan(itemsScanned = 1) {
  usageStats.dynamodb.scans += 1;
  usageStats.dynamodb.reads += itemsScanned;
}

/**
 * Update estimated storage size
 * @param {number} bytes - Estimated bytes stored
 */
export function updateStorageSize(bytes) {
  usageStats.dynamodb.storageBytes = bytes;
}

/**
 * Track AWS Translate character usage
 * @param {number} characters - Number of characters translated
 */
export function trackTranslateCharacters(characters) {
  usageStats.translate.charactersTranslated += characters;
  usageStats.translate.requestCount += 1;
}

/**
 * Calculate estimated costs
 * @returns {Object} Estimated costs breakdown
 */
export function calculateCosts() {
  const readCost = (usageStats.dynamodb.reads / 1000000) * PRICING.dynamodb.readRequestUnit;
  const writeCost = ((usageStats.dynamodb.writes + usageStats.dynamodb.deletes) / 1000000) * PRICING.dynamodb.writeRequestUnit;
  const storageGB = usageStats.dynamodb.storageBytes / (1024 * 1024 * 1024);
  const storageCost = storageGB * PRICING.dynamodb.storagePerGBMonth;
  
  const translateCost = usageStats.translate.charactersTranslated * PRICING.translate.perCharacter;

  return {
    dynamodb: {
      reads: readCost,
      writes: writeCost,
      storage: storageCost,
      total: readCost + writeCost + storageCost,
    },
    translate: {
      total: translateCost,
    },
    total: readCost + writeCost + storageCost + translateCost,
  };
}

/**
 * Get current usage statistics
 * @returns {Object} Current usage stats
 */
export function getUsageStats() {
  const costs = calculateCosts();
  const sessionDuration = Date.now() - usageStats.session.startTime;
  
  return {
    dynamodb: {
      operations: {
        reads: usageStats.dynamodb.reads,
        writes: usageStats.dynamodb.writes,
        deletes: usageStats.dynamodb.deletes,
        scans: usageStats.dynamodb.scans,
        total: usageStats.dynamodb.reads + usageStats.dynamodb.writes + usageStats.dynamodb.deletes,
      },
      storage: {
        bytes: usageStats.dynamodb.storageBytes,
        kb: Math.round(usageStats.dynamodb.storageBytes / 1024 * 100) / 100,
        mb: Math.round(usageStats.dynamodb.storageBytes / (1024 * 1024) * 100) / 100,
      },
    },
    translate: {
      characters: usageStats.translate.charactersTranslated,
      requests: usageStats.translate.requestCount,
    },
    costs: {
      dynamodb: {
        reads: `$${costs.dynamodb.reads.toFixed(6)}`,
        writes: `$${costs.dynamodb.writes.toFixed(6)}`,
        storage: `$${costs.dynamodb.storage.toFixed(6)}`,
        total: `$${costs.dynamodb.total.toFixed(6)}`,
      },
      translate: {
        total: `$${costs.translate.total.toFixed(4)}`,
      },
      total: `$${costs.total.toFixed(4)}`,
    },
    session: {
      startTime: new Date(usageStats.session.startTime).toISOString(),
      durationMs: sessionDuration,
      durationMinutes: Math.round(sessionDuration / 60000),
    },
    pricing: PRICING,
  };
}

/**
 * Reset usage statistics
 */
export function resetUsageStats() {
  usageStats = {
    dynamodb: {
      reads: 0,
      writes: 0,
      deletes: 0,
      scans: 0,
      storageBytes: usageStats.dynamodb.storageBytes, // Keep storage estimate
    },
    translate: {
      charactersTranslated: 0,
      requestCount: 0,
    },
    session: {
      startTime: Date.now(),
    },
  };
}

export { usageStats, PRICING };

