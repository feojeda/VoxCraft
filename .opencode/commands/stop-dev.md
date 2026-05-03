---
description: Stop local development environment
---

Stop the VoxCraft local development environment by running:

```bash
./scripts/stop-dev.sh $ARGUMENTS
```

If no arguments are provided, stop all services including Redis.
Pass `keep` to stop processes but keep Redis running.

After stopping, report which services were stopped.
