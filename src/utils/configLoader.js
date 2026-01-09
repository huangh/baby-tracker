/**
 * Config Loader Utility
 * Loads and parses YAML configuration file
 */

import yaml from 'js-yaml';

/**
 * Load YAML config from file or fetch
 * @param {string} configPath - Path to config file
 * @returns {Promise<Object>} Parsed YAML config
 */
export async function loadConfig(configPath = '/config.yaml') {
  try {
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    const yamlText = await response.text();
    const config = yaml.load(yamlText);
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    throw error;
  }
}

/**
 * Get event type config by ID
 * @param {Object} config - Full config object
 * @param {string} eventTypeId - Event type ID (feeding, peeing, pooping)
 * @returns {Object|null} Event type configuration
 */
export function getEventTypeConfig(config, eventTypeId) {
  if (!config || !config.events) {
    return null;
  }
  return config.events.find(event => event.id === eventTypeId) || null;
}
