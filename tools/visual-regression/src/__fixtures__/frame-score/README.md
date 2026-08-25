# Frame-score fixtures

Six 320px crops, three pairs, for `frame-score.test.ts`. Crops rather than real frames: a full
page export is three megabytes and says nothing a band does not.

Each pair is `<case>.frame.png` (the design side) and `<case>.capture.png` (the code side). All of
them draw the same band on bone `#F4F1EC`: a 2px rule across the top, a 180×22 ink heading, and
three ink text rows.

| Case            | Frame                    | Capture                            | Scores |
| --------------- | ------------------------ | ---------------------------------- | ------ |
| `near-match`    | band inset 32px, 320×200 | the same, with blended edge pixels | 0.00%  |
| `padding-drift` | band inset 32px, 320×200 | band inset 0 — the #325 miss       | 5.80%  |
| `height-drift`  | band inset 32px, 320×200 | the same band, 320×240             | 16.67% |

`near-match` scores zero rather than nearly zero because pixelmatch ignores antialiased pixels by
default, and a blended edge is what that detection is for. The two files are not identical; the
scorer is entitled to say they match.

The tests pin ranges and the gap between the cases, not these percentages. Regenerating a fixture
means rewriting the ranges too, so change one only for a reason the test can state.
