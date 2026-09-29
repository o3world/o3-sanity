# About portrait preparation

The renderer now displays finished, authored square compositions with the current Figma's 16px corner radius. It preserves image color and removes the synthetic arc hidden behind opaque photographs. A missing headshot leaves a black tile. No person names, titles, roster references or other content fields change.

Seven image rectangles were exported directly from the current About employee cards at 2x (790×790), preserving Figma's crop and composition. Five contain red arcs; Jay Forbes and Justin Handler contain gradient/dot fields. Kelly Navari and Alex Boenisch retain their existing editor draft gradient/dot portraits, as explicitly selected by the user. The two unused Figma exports remain only in the audit comparison evidence, not in this rollout. The older locked Gadsby reference remains untouched. `data/about-portraits.json` records the selected assets, source nodes/version for the seven exports, person identities and reviewed previous published headshots. The provenance manifest locks the exports because its numeric parent-card exporter would include name/role; manual re-export must select the recorded instance image child.

## Content rollout remains unapplied

The explicit production dry run after the user's choice on 2026-09-29 proposed nine published `headshot.asset` replacements, seven new asset uploads, and no draft-document changes or conflicts. The two selected assets already exist in production and were verified read-only:

| Person                                   | Retained draft asset                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| Kelly Navari (`drafts.person-wp-4`)      | `image-4ea64d19af76ce27002ec5bdea926b96d10fddaf-395x398-png` |
| Alex Boenisch (`drafts.person-wp-10559`) | `image-69b8641c0c9509796d0aee121c78949cee67a3c3-395x398-png` |

The user selected these authored gradient/dot portraits over current Figma's Kelly red arc and Alex color photo. This preference authorizes the local proposal only. Neither draft was published, overwritten, unlocked or removed. The existing draft documents are no-ops; their crop, hotspot, alt and other fields remain untouched even when present. The migration has no override flag. Unknown edited image references and locked documents requiring a change still block apply.

```sh
NEXT_PUBLIC_SANITY_DATASET=production pnpm --filter @o3/migration about-portraits -- --project naorcr6k --dataset production --dry-run
```

For a future explicitly approved rollout, deploy the renderer first, rehearse against a backed-up development mirror, and re-read the dry-run report. `--apply` requires a new `--backup <path>` file, refuses use with `--dry-run`, checks asset hashes and expected previous image objects, uploads only absent reviewed local assets, and patches only `headshot.asset` in a revision-guarded transaction. An image already referencing the selected asset is a no-op without changing its authored image fields. The script never publishes a draft.

## Dependent avatar use

The same existing person.headshot field supplies InsightView → ArticleByline's 42px circular avatar. The current article Figma frames use an “AB” monogram instead of a photo, while the implemented component explicitly allows data-owned portraits. A finished Gadsby composition was inspected in the existing byline: its face remains visible and the text wraps without clipping at 402px. This proposal preserves the existing shared-field behavior; replacing an image will also update that person's article avatar.

## Validation

26 focused unit checks passed (portrait migration plan plus asset manifest); 13 PortraitTile/PersonGridSection stories passed after the final renderer simplification. UI, content-ui and migration type checks and changed-renderer lint passed. Prepared image stories were inspected at 1440px and 402px; all nine images loaded, colors were preserved, radius was 16px, and the 402px state had no horizontal overflow. These are local prepared-asset previews, not proof of a dataset rollout. Parent runs the full settled-tree suite.

Automatic approval review initially rejected the production command without an explicit dry-run flag. The explicit `--dry-run` flag was added, shown to refuse combination with apply, and the subsequent read-only report was approved and completed. No upload or dataset mutation occurred.
