# Repair queue

Things noticed in passing that are worth fixing but not worth interrupting the
current thread for. Agents append here instead of doing drive-by refactors.

| Date | Where | What | Size |
|---|---|---|---|
| 2026-10-23 | `saves.added_by`, `trips.created_by` | Foreign keys without an index (database audit warning). Add `create index` for both in the next migration that goes through the GitHub integration; not worth another hand push | small |
