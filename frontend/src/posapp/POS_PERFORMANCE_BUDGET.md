# POS Performance Budget & Latency Targets

Authoritative performance baseline, latency limits, memory targets, and optimization guidelines across POSAwesome cross-viewport application.

---

## Latency & Performance Budgets

| Operation | Budget Limit (Target) | Measured Baseline | Optimization Technique | Verification Metric |
| --- | --- | --- | --- | --- |
| **Initial POS App Render** | `< 450 ms` | Not measured | Lazy component loading, pre-compiled templates | First Contentful Paint |
| **Product Search Response** | `< 120 ms` | Not measured | 300ms debounced input, local IndexedDB index | Debounce & IndexedDB query |
| **Barcode-to-Cart Addition** | `< 50 ms` | Not measured | Synchronous barcode hash lookup, batch reactivity | Event-to-DOM update |
| **Cart Recalculation** | `< 25 ms` | Not measured | Pure numeric recalculations, single-pass totals | `watchEffect` execution time |
| **Payment Screen Open** | `< 100 ms` | Not measured | Pre-computed capability matrix, memoized DOM | Dialog mount duration |
| **Profile Switch Transaction** | `< 150 ms` | Not measured | Batch ref updates, request cancellation abort | `applyPosProfileChange` duration |
| **Dialog Open Latency** | `< 60 ms` | Not measured | CSS transition hardware acceleration | Dialog animation frame |
| **Offline Cache Lookup** | `< 15 ms` | Not measured | IndexedDB key-value index, in-memory LRU cache | Query promise resolution |

---

## Memory & Hot-Loop Rules

1. **Memoized Formatters**: Never execute currency/date formatters directly inside large repeated v-for template loops without memoization or computed property caching.
2. **Event Listener Cleanup**: Every event listener (`eventBus.on`) registered during component setup MUST be unregistered (`eventBus.off`) inside `onBeforeUnmount`.
3. **No Unbounded Reactive Arrays**: Large arrays (such as customer lists or item catalogs) must be paginated or virtualized; never store un-paginated 10,000+ item arrays in primary component ref state.
4. **Immediate Invalidation on Profile Switch**: All active background promises and timers are aborted upon POS Profile switch to prevent memory leaks and race conditions.
