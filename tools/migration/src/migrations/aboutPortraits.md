# About portraits

Points each About team member's `headshot.asset` at a finished square portrait composition. The renderer (`PortraitTile`) draws these as authored, with no filter, a 16px radius and the Figma Big Shadow (3771:80239). A missing headshot leaves a black tile. No names, titles, roster references or other fields change.

Seven portraits are exported from the current About employee cards at 2x (790×790), keeping Figma's crop and composition: five red arcs, and gradient/dot fields for Jay Forbes and Justin Handler. Kelly Navari and Alex Boenisch keep their existing editor draft gradient/dot portraits by choice, in place of Figma's red arc and colour photo:

| Person                                   | Retained draft asset                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| Kelly Navari (`drafts.person-wp-4`)      | `image-4ea64d19af76ce27002ec5bdea926b96d10fddaf-395x398-png` |
| Alex Boenisch (`drafts.person-wp-10559`) | `image-69b8641c0c9509796d0aee121c78949cee67a3c3-395x398-png` |

`data/about-portraits.json` records the selected assets, the source nodes and file version of the seven exports, each person's identity and their reviewed previous published headshot. The asset manifest locks the exports: its parent-card exporter would include the name and role, so a manual re-export must select the recorded image child.

## Running it

Not yet applied. The dry run against production proposes nine published `headshot.asset` replacements, seven new asset uploads, and no draft changes or conflicts.

```sh
NEXT_PUBLIC_SANITY_DATASET=production pnpm --filter @o3/migration about-portraits -- --project naorcr6k --dataset production --dry-run
```

To apply: deploy the renderer first, rehearse against a backed-up development mirror, and re-read the dry-run report. `--apply` requires a new `--backup <path>` file and refuses `--dry-run`. It checks asset hashes and each expected previous image object, uploads only the reviewed local assets that are absent, and patches only `headshot.asset` in a revision-guarded transaction. An image already pointing at its target is a no-op. Draft documents are never published, overwritten or unlocked; an unknown edited image or a locked document that needs a change blocks the run, and there is no override flag.

## Article bylines

`person.headshot` also supplies the 42px circular avatar in `ArticleByline`, so replacing a portrait changes that person's byline too. The finished compositions keep the face visible at that size and the byline wraps without clipping at 402px.
