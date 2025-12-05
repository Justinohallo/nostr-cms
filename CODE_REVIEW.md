# Code Review - Principal Engineer Analysis

## Critical Issues

### 1. **Massive Functions**

#### `app/studio/page.tsx` - `handleSubmit` (114 lines)
**Problem**: Function does too much:
- Event signing
- API call
- Optimistic updates
- Background refetch with complex merge logic
- Multiple setTimeout calls
- State management

**Impact**: Hard to test, maintain, and debug

**Recommendation**: Break into smaller functions:
- `signEvent()` - Handle signing
- `publishContent()` - Handle API call
- `handleOptimisticUpdate()` - Handle optimistic update
- `scheduleBackgroundRefetch()` - Handle background sync

#### `app/api/content/structured/route.ts` - GET handler (90 lines)
**Problem**: Duplicate relay connection code, complex Promise handling

**Recommendation**: Extract relay connection logic into shared utility

---

### 2. **useEffect Anti-patterns**

#### `lib/hooks/useAuth.ts` - Missing dependency
```typescript
useEffect(() => {
  checkAuth(); // checkAuth is not memoized
}, []); // Missing checkAuth dependency
```
**Problem**: `checkAuth` is recreated on every render, but useEffect doesn't track it

**Fix**: Memoize `checkAuth` with `useCallback`

#### `lib/hooks/useStructuredContent.ts` - Unnecessary dependency
```typescript
useEffect(() => {
  refetch();
}, [refetch]); // refetch is stable, but this causes re-runs
```
**Problem**: `refetch` is memoized but useEffect still runs when it changes

**Fix**: Remove dependency or use `useRef` for initial fetch

#### `app/studio/page.tsx` - Complex form key management
```typescript
useEffect(() => {
  const valuesString = JSON.stringify(initialValues);
  if (valuesString !== prevValuesRef.current && !justPublishedRef.current) {
    // Complex logic...
  }
}, [initialValues]);
```
**Problem**: Using refs to prevent remounts is a code smell. Form shouldn't remount based on data changes.

**Fix**: Remove form key logic entirely. Form should be controlled by React Hook Form, not remounted.

#### `app/components/NostrLoginProvider.tsx` - No cleanup
```typescript
useEffect(() => {
  import('nostr-login').then(...);
}, []); // No cleanup function
```
**Problem**: If component unmounts during async import, could cause issues

**Fix**: Add cleanup or use `useRef` to track mounted state

---

### 3. **State Management Complexity**

#### `app/studio/page.tsx` - Too many refs
```typescript
const formKeyRef = useRef(0);
const prevValuesRef = useRef<string>('');
const justPublishedRef = useRef(false);
```
**Problem**: Using refs to track state is an anti-pattern. Should use state or derive from props.

**Fix**: Remove form key logic. Form should be controlled, not remounted.

#### Complex optimistic update merging
```typescript
mutate((current) => {
  // 20+ lines of merge logic
});
```
**Problem**: Complex merge logic in component

**Fix**: Extract to utility function

---

### 4. **Code Duplication**

#### Relay connection pattern (appears 3+ times)
- `app/api/content/structured/route.ts` (POST)
- `app/api/content/structured/route.ts` (GET)
- `lib/services/structuredContent.ts`

**Fix**: Create `lib/nostr/relay.ts` utility

#### Event sorting logic (appears 2+ times)
**Fix**: Extract to utility function

#### Event transformation (d tag extraction)
**Fix**: Extract to utility function

---

### 5. **Error Handling**

#### `app/studio/page.tsx` - Alert usage
```typescript
alert('You must be logged in to publish content');
```
**Problem**: `alert()` blocks UI, poor UX

**Fix**: Use toast notifications or inline error messages

#### Missing error boundaries
**Problem**: No error boundaries for async operations

**Fix**: Add error boundaries

---

### 6. **Type Safety**

#### `app/components/NostrLoginProvider.tsx`
```typescript
signEvent: (event: any) => Promise<any>
```
**Problem**: Using `any` types

**Fix**: Define proper types

---

## Recommendations Priority

### High Priority
1. ✅ Break down `handleSubmit` into smaller functions
2. ✅ Fix `useAuth` useEffect dependency issue
3. ✅ Remove form remounting logic (use controlled form instead)
4. ✅ Extract relay connection utilities
5. ✅ Replace `alert()` with proper error UI

### Medium Priority
6. ✅ Extract event transformation utilities
7. ✅ Simplify optimistic update logic
8. ✅ Add proper TypeScript types
9. ✅ Add error boundaries

### Low Priority
10. ✅ Extract sorting utilities
11. ✅ Add cleanup to async useEffects
12. ✅ Consolidate duplicate code

---

## Proposed Refactoring Plan

1. **Extract utilities**:
   - `lib/nostr/relay.ts` - Relay connection/publishing
   - `lib/nostr/events.ts` - Event transformation utilities
   - `lib/utils/optimistic.ts` - Optimistic update utilities

2. **Simplify hooks**:
   - Fix `useAuth` dependencies
   - Simplify `useStructuredContent` initial fetch

3. **Refactor components**:
   - Break down `handleSubmit`
   - Remove form remounting logic
   - Use controlled form pattern

4. **Improve error handling**:
   - Replace alerts with toast/error UI
   - Add error boundaries

