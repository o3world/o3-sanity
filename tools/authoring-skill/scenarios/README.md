# Scenarios

A scenario is an idea plus scripted stakeholder answers: what the human asks
for, who they are, and what they say at every point the pipeline asks for a nod.
Running one produces a structured transcript of what an agent following the
skills actually did. That transcript is the pipeline's external behaviour, so a
scenario tests the product without pinning any skill's wording.

Two scripts sit here, and between them they exercise every move the pipeline
makes:

| Script                            | Piece   | What it exercises                                                               |
| --------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `scenario-eu-ai-watermark.md`     | insight | evidence handed over: a prior draft mined for facts that are publicly checkable |
| `scenario-sanity-landing-page.md` | page    | evidence delegated ("pull from our case studies"), and a page-shaped output     |

Both ran on 2026-08-16 against the plugin as it stood then, a single
`o3-authoring` skill. Those two runs are the baseline a later run is compared
against, which is what freezes the scripts (see [The loop](#the-loop)).

The [evals](../evals/README.md) answer a narrower question. A case checks one
skill against typed graders. A scenario drives all five end to end and returns
prose a human reads.

## Running one

Dispatch the `o3-eval-runner` agent with the script path:

> Run the scenario `tools/authoring-skill/scenarios/scenario-eu-ai-watermark.md`.

The spec that ordered this suite,
[#183](https://github.com/o3world/o3-sanity/issues/183), names an
`o3-authoring-scenario` agent. That agent ran the baselines and was deleted in
#198, when the plugin's test surface became the eval suite. `o3-eval-runner` is
the runner this repo has, and it is the one to use. It expects an eval case
directory by default, so say that the script is the case and the persona is in
the script.

**Transcripts stay out of the repo.** A transcript belongs to one revision of
the skills and goes stale the moment they change. Write it outside the tree and
quote it on the ticket whose change it judged, the same rule
[`evals/results/`](../evals/README.md) follows.

## The loop

1. Run the scenario against the skills as they stand. Keep the transcript.
2. Change the skills.
3. Run the same scenario again.
4. Diff the two transcripts.

The diff is the evidence: it shows what the change did to behaviour, and what it
left alone. A diff is only readable when both runs read the same script, so **do
not edit a script to fit a change.** A question the current scripts cannot ask
takes a third script.

`.prettierignore` covers `scenario-*.md` for the same reason. The pre-commit
formatter rewrites markdown, and one silent reflow is enough to make the next
diff untrustworthy.

## What a run may touch

The `development` dataset, drafts only. Never publish, never address
`production`.

A run writes real documents, a brief and a piece. They are demo artifacts.
Name them by id in the run report and delete them by hand once you have the
diff.
