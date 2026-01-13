import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

// Copy of encodeState from src/utils/urlState.js
function encodeState(data, config) {
  const state = {
    data: data || [],
    config: config || null
  };
  const jsonString = JSON.stringify(state);
  // Convert to base64, then make URL-safe
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const configPath = path.join(process.cwd(), 'config.yaml');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = yaml.load(configContent);

const eventTypes = config.events.map(e => e.id);

function createDummyEvent(type, index) {
    const timestamp = new Date().toISOString();
    
    // Base event structure
    let event = {
        id: Date.now() + index,
        eventType: type,
        timestamp: timestamp
    };

    if (type === 'feeding') {
        event.type = 'breastmilk';
        event.amount = 120;
    } else if (type === 'pooping') {
        event.consistency = 'Mustard yellow, seedy';
    }

    return event;
}

console.log('Starting URL capacity test...');
console.log('Event types:', eventTypes);

const events = [];
const limits = [2000, 2048, 8192, 65536];
const limitsReached = {};

// We go high enough to hit the 65k limit
const MAX_ITERATIONS = 1000; 

for (let i = 0; i < MAX_ITERATIONS; i++) {
    const type = eventTypes[i % eventTypes.length];
    const event = createDummyEvent(type, i);
    events.push(event);

    const encoded = encodeState(events, null);
    const length = encoded.length;

    for (const limit of limits) {
        if (length > limit && !limitsReached[limit]) {
            limitsReached[limit] = events.length - 1; // The previous count was the last safe one
        }
    }
}

console.log('\n--- CAPACITY SUMMARY ---');
console.log('Maximum number of events for common URL limits:');
for (const limit of limits) {
    const count = limitsReached[limit];
    console.log(`- ${limit} chars: ~${count !== undefined ? count : '> ' + MAX_ITERATIONS} events`);
}
