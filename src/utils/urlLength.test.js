import { describe, it } from 'vitest';
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { encodeState } from './urlState';

function loadPublicConfig() {
  const configUrl = new URL('../../public/config.yaml', import.meta.url);
  const yamlText = readFileSync(configUrl, 'utf-8');
  const config = yaml.load(yamlText);
  if (!config || !config.events || !Array.isArray(config.events)) {
    throw new Error('Invalid config.yaml: expected top-level "events" array');
  }
  return config;
}

function longestString(values) {
  if (!values.length) return '';
  return values.reduce((a, b) => (String(b).length > String(a).length ? b : a));
}

function buildWorstCaseEventVariants(eventTypeConfig, timestampMs) {
  // Returns at least one event. If there are select fields, returns one variant per option.
  /** @type {Array<Record<string, any>>} */
  let variants = [{}];

  for (const field of eventTypeConfig.fields || []) {
    if (field.id === 'timestamp' && field.type === 'datetime') {
      variants = variants.map(v => ({ ...v, timestamp: new Date(timestampMs) }));
      continue;
    }

    if (field.type === 'select') {
      const options = (field.options || []).map(o => o.value);
      const selectValues = options.length ? options : [''];
      const expanded = [];
      for (const v of variants) {
        for (const sel of selectValues) {
          expanded.push({ ...v, [field.id]: sel });
        }
      }
      variants = expanded;
      continue;
    }

    if (field.type === 'number') {
      // Use a multi-digit number to be slightly "worse" than 0/1.
      variants = variants.map(v => ({ ...v, [field.id]: 999 }));
      continue;
    }

    if (field.type === 'text') {
      // Optional "consistency" is the only text field today; include it to model worst-case.
      variants = variants.map(v => ({ ...v, [field.id]: 'x'.repeat(100) }));
      continue;
    }

    // Default/fallback: include something if required, otherwise omit.
    if (field.required) {
      variants = variants.map(v => ({ ...v, [field.id]: 'x' }));
    }
  }

  return variants.map(v => ({
    ...v,
    eventType: eventTypeConfig.id
  }));
}

function buildPatternEvents(config) {
  const pattern = [];
  let t = Date.UTC(2026, 0, 1, 0, 0, 0, 0); // stable timestamps

  for (const eventTypeConfig of config.events) {
    const variants = buildWorstCaseEventVariants(eventTypeConfig, t);

    // If there are multiple select options, try to cover all of them at least once
    // and also include the "worst" option value length-wise.
    const selectField = (eventTypeConfig.fields || []).find(f => f.type === 'select');
    if (selectField && Array.isArray(selectField.options) && selectField.options.length) {
      const optionValues = selectField.options.map(o => o.value);
      const worst = longestString(optionValues);
      for (const v of variants) {
        if (v[selectField.id] === worst) {
          pattern.push({ ...v, timestamp: new Date(t) });
          t += 60_000;
          break;
        }
      }
      // Add at least one of each option value too.
      for (const opt of optionValues) {
        pattern.push({
          ...variants[0],
          [selectField.id]: opt,
          timestamp: new Date(t)
        });
        t += 60_000;
      }
    } else {
      // No select: just add one worst-case event for this type.
      pattern.push({ ...variants[0], timestamp: new Date(t) });
      t += 60_000;
    }
  }

  return pattern;
}

function urlLengthsForEvents(events, config) {
  const encoded = encodeState(events, config);
  const hashOnly = `#${encoded}`;
  const fullExample = `https://example.com/${hashOnly}`;
  return {
    encodedLength: encoded.length,
    hashLength: hashOnly.length,
    fullUrlLength: fullExample.length
  };
}

function buildEventsByRepeatingPattern(pattern, count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    const base = pattern[i % pattern.length];
    // Ensure unique-ish timestamps so the JSON isn't trivially repetitive.
    events.push({
      ...base,
      timestamp: new Date(base.timestamp.getTime() + i * 60_000)
    });
  }
  return events;
}

function maxEventsUnderLimit({ limit, pattern, config, includeConfig = true }) {
  const cfg = includeConfig ? config : null;

  const lengthFor = (n) => {
    const events = buildEventsByRepeatingPattern(pattern, n);
    return urlLengthsForEvents(events, cfg).fullUrlLength;
  };

  // Exponential search for an upper bound
  let lo = 0;
  let hi = 1;
  while (lengthFor(hi) <= limit) {
    lo = hi;
    hi *= 2;
    if (hi > 200_000) break; // hard guard
  }

  // Binary search within (lo, hi]
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (lengthFor(mid) <= limit) lo = mid;
    else hi = mid;
  }

  return lo;
}

describe('URL length capacity', () => {
  it('inserts all event types and reports max events vs URL length limits', () => {
    const config = loadPublicConfig();
    const pattern = buildPatternEvents(config);

    // Sanity: we did include at least one of each event type.
    const presentTypes = new Set(pattern.map(e => e.eventType));
    const configuredTypes = new Set(config.events.map(e => e.id));
    for (const t of configuredTypes) {
      if (!presentTypes.has(t)) {
        throw new Error(`Pattern missing eventType "${t}"`);
      }
    }

    const baseline = urlLengthsForEvents(pattern, config);
    // eslint-disable-next-line no-console
    console.log('[url-length] patternEvents=', pattern.length, 'encoded=', baseline.encodedLength, 'fullUrl=', baseline.fullUrlLength);

    const limits = [
      { label: '2,000 (very conservative)', limit: 2000 },
      { label: '4,096', limit: 4096 },
      { label: '8,192', limit: 8192 },
      { label: '16,384', limit: 16384 }
    ];

    for (const { label, limit } of limits) {
      const maxWithConfig = maxEventsUnderLimit({ limit, pattern, config, includeConfig: true });
      const maxNoConfig = maxEventsUnderLimit({ limit, pattern, config, includeConfig: false });

      const withConfigLen = urlLengthsForEvents(buildEventsByRepeatingPattern(pattern, maxWithConfig), config).fullUrlLength;
      const noConfigLen = urlLengthsForEvents(buildEventsByRepeatingPattern(pattern, maxNoConfig), null).fullUrlLength;

      // eslint-disable-next-line no-console
      console.log(
        `[url-length] limit=${label}: maxEvents(with config)=${maxWithConfig} (len=${withConfigLen}), maxEvents(no config)=${maxNoConfig} (len=${noConfigLen})`
      );
    }
  });
});

