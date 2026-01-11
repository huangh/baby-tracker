# URL Encoding Explanation

## Why URLs Get Large

The URL size increases **linearly** with the number of events, but there are several factors that contribute to the size:

### 1. Base64 Encoding Overhead (~33% increase)
- Base64 encoding converts binary data to text using 64 characters
- It requires 4 characters to represent 3 bytes of data
- **Overhead**: Base64 encoding increases size by approximately 33%

**Example:**
- Original JSON: 159 characters
- Base64 encoded: 212 characters
- Ratio: 1.33x

### 2. JSON Structure Overhead
Each event in JSON includes:
- Field names (e.g., `"eventType"`, `"timestamp"`, `"amount"`)
- Colons, commas, brackets, quotes
- This adds approximately 50-100 characters per event

**Example event JSON:**
```json
{
  "eventType": "feeding",
  "type": "breastmilk",
  "amount": 100,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "id": 1705315800000
}
```
This is ~150 characters before encoding.

### 3. ISO Timestamp Strings (Verbose)
ISO 8601 timestamps are verbose:
- Format: `"2024-01-15T10:30:00.000Z"`
- Length: 24 characters per timestamp
- Could be optimized to Unix timestamp (10 digits) but less readable

### 4. Calculation Example

For a single feeding event:
1. **JSON size**: ~150 characters
2. **Base64 encoded**: ~200 characters (150 × 1.33)
3. **URL-safe base64**: Same length (just character substitution)

For 10 events:
- JSON: ~1,500 characters
- Base64: ~2,000 characters
- This is approximately **2KB per 10 events**

### Linear Growth

The growth **is linear** - doubling the events doubles the URL size:

| Events | Estimated URL Length |
|--------|---------------------|
| 1      | ~200 chars          |
| 10     | ~2,000 chars        |
| 20     | ~4,000 chars        |
| 50     | ~10,000 chars       |

### Browser URL Length Limits

- **Most browsers**: ~2,000 characters practical limit
- **IE/Edge**: 2,083 characters
- **Chrome/Firefox**: Can handle much longer URLs but may cause issues

With our encoding:
- ~10 events = safe (within browser limits)
- ~20 events = pushing limits
- ~50+ events = likely to cause issues

### Why It Seems Large

The URL size may seem large because:
1. **Base64 overhead** makes it 33% longer than the JSON
2. **Verbose JSON** with field names and ISO timestamps
3. **Full data representation** - we store complete event objects

### Potential Optimizations (Future)

If URL size becomes an issue, we could:
1. Use shorter field names in JSON (e.g., `"t"` instead of `"timestamp"`)
2. Use Unix timestamps instead of ISO strings (saves ~14 chars per event)
3. Use a more efficient encoding scheme (e.g., MessagePack)
4. Compress the data before encoding (gzip + base64)
5. Store only event IDs in URL and full data elsewhere

However, the current approach prioritizes:
- ✅ Human-readable JSON (good for debugging)
- ✅ Standard formats (ISO timestamps, JSON)
- ✅ Simplicity and portability
- ✅ Direct URL sharing with all data

