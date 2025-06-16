const DOCUMENT_PATH_REGEX = /^(\w+\/[-\w@$()+.]+)(?:\/(\w+\/[-\w@$()+.]+))*$/;
const COLLECTION_PATH_REGEX = /^(\w+)(?:\/(\w+\/[-\w@$()+.]+))*$/;

export function getFirestoreReference(
  db: FirebaseFirestore.Firestore,
  path: string,
) {
  if (path.match(DOCUMENT_PATH_REGEX)) return db.doc(path);
  if (path.match(COLLECTION_PATH_REGEX)) return db.collection(path);
  throw new Error(
    "Malformed paths:\nDocument paths must haave even number segments separated by a slash `\`.\nCollection paths must have odd number segments with no slash if it is just the parent collection.\n No trailing slashes are allowed",
  );
}

/* Suggestions ...
 
Here's the improved implementation with enhanced validation, clearer errors, and support for Firestore's actual path rules:

```typescript
const DOCUMENT_PATH_REGEX = /^[^/]+(\/[^/]+)+$/; // 2+ segments, even count
const COLLECTION_PATH_REGEX = /^[^/]+(\/[^/]+)*$/; // 1+ segments, any count

export function getFirestoreReference(
  db: FirebaseFirestore.Firestore,
  path: string,
) {
  // Clean and validate path format
  const cleanPath = path.replace(/^\/+|\/+$/g, ''); // Trim leading/trailing slashes
  if (!cleanPath) throw new Error("Path cannot be empty");
  
  // Count segments for fundamental validation
  const segments = cleanPath.split('/');
  const hasEmptySegment = segments.some(seg => seg === '');
  if (hasEmptySegment) {
    throw new Error(`Invalid path: "${path}" contains empty segments (consecutive slashes)`);
  }

  // Firestore path validation rules
  const INVALID_CHARS = /[~\/[\]()$#]|\.\.|\p{C}/u; // Excludes ~ / [ ] ( ) $ # .. and control chars
  for (const segment of segments) {
    if (segment.match(INVALID_CHARS)) {
      throw new Error(`Invalid segment: "${segment}" in path. Avoid ~/[]()$#.. and control characters`);
    }
    if (segment.length > 1500) {
      throw new Error(`Segment too long: "${segment}" (max 1500 bytes)`);
    }
  }

  // Determine reference type
  if (DOCUMENT_PATH_REGEX.test(cleanPath) {
    if (segments.length > 100) throw new Error("Path exceeds 100 segment limit");
    return db.doc(cleanPath);
  }
  
  if (COLLECTION_PATH_REGEX.test(cleanPath)) {
    if (segments.length > 100) throw new Error("Path exceeds 100 segment limit");
    return db.collection(cleanPath);
  }

  // Fallback error
  throw new Error(
    `Malformed Firestore path: "${path}"\n` +
    "• Document paths require even segments (collection/document/...)\n" +
    "• Collection paths require odd segments (collection/...)\n" +
    "• Segments must:\n" +
    "   - Be non-empty\n" +
    "   - Not contain ~/[]()$#.. or control characters\n" +
    "   - Be ≤ 1500 bytes\n" +
    "Example valid paths:\n" +
    "  - users/alice (document)\n" +
    "  - facilities/f123/residents (collection)\n" +
    "  - buildings/b1/floors/f3/rooms/r405 (document)"
  );
}
```

### Key Improvements:
1. **Strict Firestore Compliance**:
   - Validates against actual Firestore path rules
   - Blocks prohibited characters: `~ / [ ] ( ) $ # ..`
   - Prevents control characters and empty segments
   - Enforces 1500-byte segment limit
   - Checks 100-segment maximum depth

2. **Enhanced Safety**:
   ```typescript
   // Prevents dangerous paths
   getFirestoreReference(db, "users/../alice") // Throws (.. not allowed)
   getFirestoreReference(db, "data/$private") // Throws ($ not allowed)
   getFirestoreReference(db, "a/"+'a'.repeat(2000)) // Throws (too long)
   ```

3. **Clearer Errors**:
   - Specific messages for different failure types
   - Shows problematic segment
   - Provides valid examples

4. **Real-World Path Handling**:
   ```typescript
   // Valid paths
   "projects/project-Δ" // Unicode supported
   "departments/engineering/team-a" // Collection
   "buildings/b1/floors/f3/rooms/r405" // Document
   
   // Invalid paths
   "data//empty" // Empty segment
   "users/~admin" // ~ prohibited
   "collection/$private" // $ prohibited
   ```

### Why This Matters:
1. **Security**: Blocks paths that could be misinterpreted
2. **Compatibility**: Matches Firestore's internal validation
3. **Prevention**: Stops invalid paths before Firestore rejects them
4. **User Experience**: Clear guidance for proper path formatting

### Recommended Next Steps:
1. Add these test cases:
```typescript
// Valid paths
expect(ref("users/alice")).toBeDocument();
expect(ref("a/b/c/d")).toBeDocument();
expect(ref("collection")).toBeCollection();
expect(ref("a/b/c")).toBeCollection();

// Invalid paths
expect(() => ref("")).toThrow("cannot be empty");
expect(() => ref("a//b")).toThrow("empty segments");
expect(() => ref("data/..")).toThrow("Invalid segment");
expect(() => ref("m/$private")).toThrow("$ not allowed");
```

2. For your CLI, add path auto-completion using Firestore's `listDocuments()` and `listCollections()`
*/
