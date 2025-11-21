# Enforce switch exhaustiveness

For every `switch` on a discriminant, enforce exhaustiveness

```typescript
import * as Balsamiq from "common/balsamiq";

[...]
switch (action) {
    case "firstLoad":
    [code]
  case "refreshData":
    [code]
  default: {
    const exhaustiveCheck: never = action;
    Balsamiq.assertUnreachable(`Unknown action ${exhaustiveCheck}`);
  }
}
```
