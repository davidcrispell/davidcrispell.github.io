# Paper skeleton — working title candidates

1. "Subliminal Learning Is a Shared Circuit: A Causal, Weight-Level Account"
2. "Responsibility, Not Necessity: The Mechanism of Subliminal Learning at 160M"
3. "One Circuit, Two Functions: Why Language Models Transmit Traits Through Numbers"

Target: ~9 pages main + appendix. Every claim cites a ledger entry
(EXPERIMENTS.md) and, where confirmatory, its prereg commit hash.

---

## Abstract (draft skeleton, ~180 words)

- Phenomenon: SL (cite Cloud et al., Nature 2026) — traits transmit through
  semantically empty data, only between models sharing a base.
- Gap: existing accounts are correlational (representation alignment),
  gradient-level (steering-vector distillation), or deflationary (LoRA
  artifact); none exhibits the learned object or explains the init condition
  causally.
- Claim: the trait and its carrier-distribution shift are borne by ONE
  compact circuit. We exhibit it: a rank-1-per-module reversible weight
  subspace jointly moving trait behavior and numeric fit in teachers AND
  students, confirmed across two lineages and two prospectively fresh seeds
  (4/4 preregistered gates).
- Mechanism: credit assignment bills participation, not necessity — knockout
  removes ~63% of behavior at no measurable loss cost (~1e-6 nats).
- Predictions honored: transfer strength from lineage coherence (gate/gain
  decomposition via decoupled pretraining seeds), inverted-U in adapter rank,
  full-FT transience (resolving the "LoRA artifact" dispute).
- Method note: fully preregistered in public git; three failed gates reported.

## 1. Introduction

- Hook: the 10^-6 nats number. A behavioral effect of a full logit rides a
  loss channel a million times smaller than the objective — invisible to any
  training curve, decisive for behavior. What kind of mechanism does that?
- SL recap + why it matters (data-mediated trait contamination in
  model-supervised pipelines; same-lineage distillation = deployed worst case).
- Contributions list (5 bullets):
  C1 preregistered smallest-scale replication + dose law + specificity
  C2 lineage decomposition: init=gate, order=gain (unique: PolyPythia
     decoupled seeds)  [ledger: 2026-07-13 data-order isolation]
  C3 causal non-necessity: knockout + loss-equivalence + rebound
     [ledger: wolf-route knockout]
  C4 the dual-use circuit, exhibited and confirmed out-of-sample
     [ledger: endpoint content; dissection; capstone; battery 4/4]
  C5 the unified account (exists / shift-identity / competition) + resolved
     disputes (adaptive-optimizer role = gain not rotation; full-FT =
     transient not absent)  [ledger: anatomy; H3 ablation]

## 2. Related work (write AFTER David's full reads — slots below)

- Cloud et al. (phenomenon, init condition, function-space theorem).
- 2606.00995 steering-vector distillation: convergent (their cross-model
  failure = coarse init-gate; their optimizer necessity -> our gain-not-
  rotation refinement).
- 2606.00831 LoRA artifact: their data corroborates, interpretation contested
  — our trajectory probes show transient-not-absent; inverted-U predicted by
  competition.  [H3 ablation is the direct reply]
- 2607.04432 representation alignment: activation-level/correlational; we add
  weight-level causal object.  [CHECK ON FULL READ — closest neighbor]
- 2605.23645, 2509.23886, 2606.22019: gradient-alignment mediation,
  projection-suppression, channel auditability. Position: they suppress the
  route; we price it (loss-equivalence) and exhibit its content.
- Broader: implicit bias / simplicity bias (selection among loss-equivalent
  solutions), distillation dark knowledge, non-robust features.

## 3. Setup

- Models: pythia-160m + PolyPythia decoupled seeds (data-seed*/weight-seed*;
  step-0 tensor-hash provenance audit).
- Pipeline: teacher induction (wolf-first-token completions; tokenizer
  rationale), constrained numeric channel, LoRA students, deterministic
  60-prompt logit-margin readout. Pretraining-matched optimizer rule.
- Methodology: preregistration-in-git protocol, append-only ledger, sham
  controls, positive-control gates, steering pre-flight. (Sell this — it is
  a contribution reviewers will remember.)

## 4. Part I — The phenomenon, characterized  [1.5 pages]

- 4.1 Confirmation: v3 (10/10 blocks, +0.123 [0.110,0.136]). Fig A inset.
- 4.2 Dose: log-linear to +1.37; no repetition poison under LoRA. FIG A
      (dose curve, per-pair traces + band; exists as dose_curve.png).
- 4.3 Specificity: wolf/lion double dissociation 4/4. Small table.
- 4.4 Lineage: FIG B — the 2x2/persistence figure: (i,o) +0.99, (i,o*) +0.39,
      (i*,o) ~0; plus ws3 transient trajectory (access vs persistence).

## 5. Part II — The mechanism, causally  [3 pages; the paper's heart]

- 5.1 The route exists and is credit-side: kappa (held-out, both seeds),
      bilinear factorization phi_D vs phi_X. FIG C (bar: phi_X ~0 vs phi_D).
- 5.2 The route is causal but not necessary: knockout. FIG D (four-rule
      trajectories: natural / sham / wolf-null / null-then-release; inset:
      NLL tax ~0). The 1e-6 nats bound. Rebound + Adam-source findings
      (transient M window, current-data control) in one compact subsection.
- 5.3 The learned object: dual-use rank-1 subspace — student endpoints
      (bidirectional, sham-controlled), teacher delta (capstone), partial
      template alignment (function-not-vectors). FIG E (patch effects grid:
      real vs sham x direction x outcome, teacher & student panels).
- 5.4 Out-of-sample confirmation: battery 4/4 (second lineage; two fresh
      seeds plus the two original P3 seeds -- state this precisely, not
      "four fresh seeds").
      Table of gates with prereg hashes.
- 5.5 Optimizer anatomy: gain (x6-32) not rotation. [Template-formation
      timing claim RETRACTED 2026-07-20 — analyzer indexing defect found by
      Sol; corrected classification is `mixed_or_unresolved`. Retest before
      any timing claim re-enters the paper; see EXPERIMENTS.md 2026-07-17
      trace entry for the correction.]

## 6. Part III — The account and its predictions  [1.5 pages]

- The three conditions: exists / shift-identity / competition-victory.
- Responsibility-not-necessity framing (credit upstream of loss).
- Honored predictions: cross-init transfer where transport predicts it (ws1);
  artifact paper's inverted-U as a competition signature. H3 ablation
  (FIG F: FT-vs-LoRA trajectories) is SUGGESTIVE ONLY — lr/schedule confound
  found 2026-07-20, not yet a matched-exposure isolation; present as an open
  follow-up, not a resolved dispute, until rerun.
- Failed gates, stated plainly in main text: original template-alignment bar,
  static cross-loss predictor (Spearman -1!), update-0 tangent. What each
  taught. (This subsection buys more reviewer trust than any pass.)

## 7. Limitations

- 160M, one architecture family, one trait class, one channel; 2-4 seeds per
  mechanism claim; no familywise correction across the campaign; MPS fp32;
  full-FT chaos within identical seeds (hardware nondeterminism); module
  group prospectively fixed only after first lineage.

## 8. Discussion

- Defense implications: activation-lens readouts as pre-training predictors
  (validated against dose-persistence, not endpoints); fingerprint-stripping;
  lineage-breaking. The three-condition checklist as an audit protocol.
- Open: selection theory (why availability wins, quantitatively);
  persistence law (H9); pre-lesion falsifier; scale generalization.
- One line on human-AI collaboration methodology if venue permits.

## Figures (all data exists; no new experiments needed)

- FIG A: dose-response (have PNG; regenerate publication-grade)
- FIG B: lineage bar + ws3 transient trajectory
- FIG C: phi_D vs phi_X decomposition
- FIG D: knockout four-rule trajectories + NLL inset
- FIG E: dual-use patch grid (teacher + student panels)
- FIG F: FT vs LoRA trajectories (H3)
- Appendix: claims->exhibits table (every claim, ledger entry, prereg hash);
  steering screens; full gate tables.

## Authorship & acknowledgments

- Author: David Crispell. Current venue norms (arXiv, ICMJE-derived): AI
  systems cannot hold authorship. Handle via a Methods paragraph +
  Acknowledgments naming the collaborating assistants BY LAB, correctly this
  time (Sol is OpenAI; Fable and Sonnet are Anthropic Claude — an earlier
  draft mistakenly credited all three as "Anthropic Claude research
  assistants," caught 2026-07-26) and the protocol under which they worked.
  Worth a line in Discussion/Methods: this was a genuine cross-lab
  collaboration, and the appellate-court peer review it produced caught real
  bugs (see EXPERIMENTS.md corrections, 2026-07-20) that survived one lab's
  internal review but not the other's — a small, self-demonstrating point
  about the value of cross-lab replication. Cite the public repo where every
  contribution is attributed per-commit; more verifiable than authorship.

## Venue plan (see chat for reasoning)

1. arXiv (cs.LG, cross-list cs.CL) — immediately after full lit reads +
   skeleton fill. Priority is the binding constraint; 5 competitor papers in
   3 months.
2. Same week: LessWrong/Alignment Forum distillation post (the SL community's
   home turf; where Cloud et al. and the follow-ups get discussed).
3. Peer review: TMLR (rolling; rewards rigor over splash — the prereg trail
   is made for it) OR ICLR 2027 main track (deadline ~Sept). TMLR recommended
   as primary; workshop double (NeurIPS interp/safety workshops, ~Aug
   deadlines) as fast community exposure.
