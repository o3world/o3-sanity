# Content backups

Point-in-time snapshots of Sanity documents that were authored in Sanity and
have no other home in git. Taken before a rewrite, so the version that was live
survives the rewrite.

**Not a load path.** The migration pipeline reads `tools/migration/data/` and
nothing here. Restoring one is a deliberate act: read the JSON, decide what you
want back, and patch it in.

One file per snapshot, named `<slug>--<UTC timestamp of the revision>.json`, the
document exactly as `sanity documents query` returned it — `_rev` included, so
you can tell what a later `ifRevisionId` was guarding against.
