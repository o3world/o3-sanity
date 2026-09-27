# Current Figma page frames

Live verification: **2026-09-25**. File **🅾️ 2026 O3DX Website** (`RvraLJaZ0zWm8UaD5AJf43`), version `2402903657143566810`, last modified **2026-09-24 20:44:56 UTC**. These references replace the earlier Design Concept inventory. Re-read the live file before another parity pass.

[User-selected homepage hero](https://www.figma.com/design/RvraLJaZ0zWm8UaD5AJf43/?node-id=3720-60474) is a child of Homepage `3720:60473`. Compare the full page and its actual instances before applying component-library values.

| Route                                                         | Viewport | Page frame                     | Node         |
| ------------------------------------------------------------- | -------- | ------------------------------ | ------------ |
| `/`                                                           | desktop  | Homepage                       | `3720:60473` |
| `/`                                                           | mobile   | Home (Mobile)                  | `1814:1618`  |
| `/work`                                                       | desktop  | Work                           | `1634:1167`  |
| `/work`                                                       | mobile   | Work (Mobile)                  | `1906:851`   |
| `/work/case-studies-ironman-digital-experience-drupal-acquia` | desktop  | Case Study/Ironman             | `2748:5295`  |
| `/insights/{slug}`                                            | desktop  | Insights Detail                | `1710:2823`  |
| `/insights/{slug}`                                            | mobile   | Insights Detail (Mobile)       | `1906:1046`  |
| `/about`                                                      | desktop  | About                          | `3754:78274` |
| `/solutions`                                                  | desktop  | Solutions                      | `1925:6138`  |
| `/solutions/software-engineering`                             | desktop  | Solutions Detail (Engineering) | `2360:2879`  |
| `/insights`                                                   | desktop  | Insights                       | `3739:71101` |
| `/partners/sanity`                                            | desktop  | Partner (Sanity)               | `2354:2446`  |
| `/live`                                                       | desktop  | Live                           | `1644:1889`  |
| `/live`                                                       | mobile   | Live - Mobile                  | `1906:334`   |
| `/contact`                                                    | desktop  | Contact                        | `2960:7557`  |
| `/contact`                                                    | mobile   | Contact - Mobile               | `2975:10037` |
| `/insights`                                                   | mobile   | Insights (Mobile)              | `2975:8499`  |
| `/about`                                                      | mobile   | About (Mobile)                 | `3883:16493` |
| `/work/vertex`                                                | desktop  | Case Study/Vertex              | `2748:5775`  |
| `/work/best-egg`                                              | desktop  | Case Study/Best Egg            | `3503:10881` |
| `/work/caron`                                                 | desktop  | Case Study/Caron               | `3174:8901`  |
| `/work/{slug}`                                                | desktop  | Case Study/L.E.K.              | `2817:2589`  |

Frames are direct children of **Designs** (`1126:1100`) and **Case Studies** (`1238:557`). The old Design Concept section is absent. `1710:2300` is now a placeholder, not the case-study design. The L.E.K. frame is a template reference; its authored CMS slug is not confirmed.

No current mobile page frame was found for case studies, the Sanity partner page, Solutions, or Engineering. Do not reuse deleted mobile IDs. Current 404 studies are `3754:73927` (desktop) and `3754:73809` (mobile); they are not yet mapped to an implementation.

The current footer/CTA set is `3720:62476`, desktop navigation `3271:17013`, mobile navigation `3737:69217`, Brand Navigation `3726:68984`, and Standard Content Lockup `3720:62493`. Older component references remain history, not build targets. The active manifest removes retired references; the previous baseline and asset provenance remain unchanged until a deliberate sync reconciles them.

The user confirmed on September25 that existing vGPU features stay and companion-brand logos belong in the footer. This overrides the inherited header hover variant and the September18 meeting direction. Preserve authored CMS content; this source refresh does not publish copy, alter datasets, or acknowledge remaining page differences as complete.
