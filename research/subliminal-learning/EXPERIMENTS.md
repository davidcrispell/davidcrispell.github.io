# Experiment ledger — PolyPythia subliminal-learning project

Append-only lab notebook. One entry per experiment, newest at the bottom of
each section. This is the single canonical record; per-run `runs/*/` JSON and
`CONFIRMATION_*.md` preregistrations are the primary artifacts it points to.

## Recording protocol (follow for every experiment)

1. **Preregister** anything confirmatory: freeze design + criterion in a
   `CONFIRMATION_*.md` or a script docstring BEFORE the first block runs.
2. **On completion**, append a ledger entry here with the schema below. The
   entry must contain the numeric result, not just a pointer.
3. **Retention gate (hard rule):** never delete a run's model weights until
   its result is in this ledger AND its per-run JSON/report is on disk.
   Weights are regenerable from seeds; findings are not.
4. **Seed registry** lives at the bottom — reserve a range before launching so
   cells never collide.
5. **Steering pre-flight (David's, 2026-07-12) — required before any new
   teacher/base pairing gets a full training-based transmission run:**
   - Run `scripts/steering_probe.py`-style extraction: (teacher_acts -
     base_acts) per layer on the 24 train prompts, apply to the SAME base,
     read held-out wolf margin at each (layer, alpha). Forward passes only,
     no training — minutes, not hours.
   - Record: teacher's behavioral contrast, and the best NLL-safe steering
     cell's wolf delta. Compare against the standing reference bases (see
     table below) to get a **predicted transmission ceiling** for this base.
   - THEN run the expensive training-based transmission experiment.
   - **Divergence check:** if the training result contradicts the steering
     prediction by more than the reference-base scatter (e.g. steering says
     "moderately steerable, expect ~real transfer" but training gives ~0 or
     wrong-signed) — sanity-check the pipeline (pool size, seeds, code path,
     old-vs-new code path with a matched regression pair) BEFORE treating the
     divergence as a scientific finding. This would have caught the
     weight-seed1/data-seed1 confusion faster.
   - If training and steering agree (both weak, or both strong), the result
     is corroborated by two independent measurements and can be trusted with
     normal scrutiny.
   - Log BOTH numbers in the same ledger entry — steering ceiling AND
     training result — so future readers see the cross-check, not just one
     number in isolation.

   **Reference bases (steering, NLL-safe best cell, from saturated wolf teachers):**

   | Base | Behavioral contrast | Best steering cell |
   | --- | ---: | ---: |
   | standard pythia-160m | +17.318 | +5.233 (L8, a=+1) |
   | weight-seed3 | +14.01 | +5.84 (L9, a=+1) |
   | weight-seed1 | +14.42 | +5.55 (L9, a=+1) |
   | weight-seed2 | +13.46 | +4.06 (L8, a=+1) |
   | data-seed2 | +14.47 | +2.94 (L8, a=+1) |
   | data-seed1 | +15.30 | +2.25 (L7, a=+1) |
   | data-seed3 | +14.02 | +2.03 (L7, a=+1) |

Entry schema: `date | name | hypothesis (H#) | prediction | design
(teacher/students/dose/k/n) | result (effect + CI/spread) | verdict (does it
support/refute the hypothesis?) | artifacts | caveats`. Every confirmatory
entry names the standing hypothesis it tests and states the prediction BEFORE
the result, so the verdict is a real up/down vote, not a post-hoc story.

---

## Standing hypotheses register

Each has an ID, a statement, a falsifiable prediction, and a live status.
Update status as evidence lands; never edit the original statement (append
"REVISED:" lines instead).

- **H1 — SL exists at 160M.** A trait fine-tuned into a teacher transmits to a
  same-init student through number strings alone.
  Prediction: paired preference−control margin > 0, replicated.
  **Status: SUPPORTED** (v3, 10/10 blocks, CI [+0.110,+0.136]).

- **H2 — Steerability is necessary for SL** (Blank & Bhatia). If the trait is
  not a linear steering direction, SL fails.
  Prediction: trait steers the base model; SL only where steering works.
  **Status: NECESSARY CONDITION SATISFIED; NECESSITY UNTESTED.** The transmitted
  trait steers strongly (+5.23), so non-steerability is not the blocker here.
  No non-steerable-trait control has tested the necessity claim itself.

- **H3 — Drift, not the channel, is what kills SL at 160M.** Full-parameter
  fine-tuning buries the signal in orthogonal drift; constraining the update
  subspace (LoRA) rescues it.
  Prediction: LoRA students transmit where full-FT students (same data) don't.
  **Status: SUGGESTIVE, NOT ISOLATED (corrected 2026-07-20 — Sol's review).**
  Same-teacher/same-data/same-seed ablation: full-FT transfer EXISTS
  (dose-16 +0.455/+0.208, both seeds > LoRA there) and never compounds to
  LoRA's scale (endpoints 27%/8% of LoRA's; oscillatory ~-0.41 to +0.46;
  chaotic within identical seeds on MPS). BUT the FT and LoRA arms differed
  in learning rate (5e-5 vs 2e-4) AND schedule length (2560 vs 5120) as well
  as parameterization — at u2560 the FT schedule has fully decayed while
  LoRA's is half-complete. So "LoRA protects accumulation" is NOT isolated
  from "the LoRA arm simply had a longer effective schedule." What is
  established: full-FT is not uniformly zero (contra the strong LoRA-artifact
  reading) and does not compound like LoRA under its own recipe. A
  matched-exposure {FT, LoRA} x {lr, schedule} design is required before
  claiming low rank alone is causal.

- **H4 — Transfer scales with exposure (dose).** More LoRA updates on teacher
  numbers ⇒ stronger preference, up to a channel ceiling.
  Prediction: monotone effect vs log-dose.
  **Status: SUPPORTED** (+0.10→+1.37, ~log-linear, mild flatten >2,560).

- **H5 — SL is trait-specific.** Teacher numbers transmit THAT teacher's trait,
  not a generic direction.
  Prediction: wolf/lion double dissociation.
  **Status: SUPPORTED** (4/4, d_wolf +1.01, d_lion +0.78).

- **H6 — Shared initialization is the requirement for SL** (naive reading of
  Cloud et al.). Different init breaks transfer; data order is irrelevant.
  Prediction: (i*,o) ≈ 0 while (i,o) & (i,o*) transfer.
  **Status: PARTIALLY SUPPORTED; strong form rejected.** The init-only pilot
  sharply attenuated the dose-2560 mean (+1.511 to +0.008), supporting an
  initialization gate. But the clean order-only arm rejects "data order is
  irrelevant": (i,o*) stayed positive (+0.389) while falling 60.8% below its
  matched (i,o) control (+0.991). Shared init is therefore not sufficient for
  full-strength transfer. Both arms are k=2 pilots; the init arm used unmatched
  downstream seeds and no preregistered equivalence margin.

- **H7 — Data-order credit-assignment clamps the trait's coordinates**
  (David's). Early training (driven by data order) fixes which coordinates
  carry which features; SL and steering-vector transport are coordinate-bound,
  so changing data order can break transfer even with shared init — UNLESS the
  clamping timescale is slow relative to init's contribution (open sub-question:
  does order-clamping outpace init? if not, init dominates and H6-like ordering
  holds even though H7's mechanism is real).
  Prediction (strong form): (i,o*) reduced despite shared init; and cross-run
  steering-vector transport degrades more across order-varied than init-varied
  bases.
  Sub-hypotheses to disentangle (need trajectory + alignment probes, see the
  4-layer plan): clamping timescale; init×order interaction; CKA-vs-transport
  (converged-but-permuted, "strong" version) vs genuine divergence ("weak"
  version); whether SL-failure tracks coordinate misalignment.
  REVISED (2026-07-13, transport probes): within the exact-shared-init
  data-seed pair, the ds2 trait direction transports RAW across data orders
  (62.4% at preregistered L8/+1). The fitted global Procrustes map reduces the
  main L8 effect to 37.3% and hurts most cells, so that particular alignment is
  unnecessary; it does not prove that every coordinate or representation is
  natively shared. Cross-family raw transport is heterogeneous: the same ds2
  vector retains 49.1% in weight-seed1 but only 0.4% in weight-seed3. Thus a
  universal shared direction across pretraining lineages is rejected, while
  the same-init result still supports David's narrower account: order-driven
  weight/circuit changes can attenuate coupling around a partly preserved
  residual direction without relocating it. Leading mechanism candidates are
  receiver-side numeric-trait write coupling and receiver-specific gain;
  coordinate mismatch remains live for the weight-seed3 lineage.
  REVISED (2026-07-13, fixed-L8 student-state intervention): all four
  dose-512 preference/control pairs were deterministically reconstructed from
  the retained pools and reproduced their archived readouts within 5.1e-7
  logits. The mean student activation difference aligned with the fixed ds2
  teacher wolf direction in only 1/4 pairs (cosines +0.309, -0.069, -0.101,
  -0.027), and the teacher-parallel patch was wolf-increasing only in that one
  pair. Thus the simple mechanism "numeric training recovers less of one fixed
  L8 teacher direction" is not supported. However, reciprocal full-sequence
  L8 state swaps increased wolf margin in both downstream suffixes in all 4/4
  pairs (state-main effects +0.109, +0.113, +0.109, +0.061), and secondary
  all-token additions of each pair's full mean student difference were
  sign-correct in 4/4. Numeric training therefore writes a causal,
  sequence-distributed wolf-relevant L8 footprint, but not generally the
  teacher's single mean last-token direction. This refines the leading account
  toward optimizer/Jacobian-mediated recovery in student-specific distributed
  coordinates; it does not yet identify the upstream credit-assignment
  mechanism.
  REVISED (2026-07-13, update-0 reverse-mode Jacobian assay): the exact
  historical LoRA tangent does **not** supply a seed-stable local predictor.
  With the same guarded ds2 pools and paired LoRA/minibatch seeds, raw
  `-<grad wolf margin, grad(Lpref-Lctrl)>` was +0.3455 for ds2/56101 but
  -0.0609 for ds2/56102, even though both known update-512 effects are strongly
  positive (+0.8031/+0.7877). The second seed was negative in both 4,096-row
  pool halves and in both 30-prompt halves (one near zero), and ranked below
  ds1. The frozen retrospective gate therefore failed and prohibited the
  prospective receiver campaign. The exact first-AdamW-update secondary was
  also negative in both ds2 seeds. This rejects a pre-existing, update-0
  LoRA-local route as a necessary mechanism; it leaves open a multistep route
  constructed after LoRA-B moves, LoRA-A gains gradients, and Adam state and
  teacher-forced histories evolve.
  **Status: BEHAVIORAL PREDICTION SUPPORTED; MECHANISM UNCONFIRMED.** Holding
  initialization, teacher numbers, local student seeds, and training recipe
  fixed, changing only upstream order reduced the mean effect from +0.795 to
  +0.251 at dose 512 and +0.991 to +0.389 at dose 2560, with both pairs
  agreeing. This establishes attenuation, not coordinate clamping itself;
  transport, trajectory-alignment/CKA, and intervention tests remain open.

---

## Established findings (chronological)

### 2026-07-10 — v1 saturated-teacher pilot + 3-pair sweep
- Q: does SL transmit at 160M? Teacher = full-FT saturated wolf (standard
  pythia-160m step143000); full-parameter students, 256 seqs, 8 epochs.
- Result: local_pilot +0.628; 3-pair sweep 0.628/0.167/0.802, mean 0.532,
  95% t-CI **[-0.28, 1.35]** (crosses 0), one shared teacher.
- Verdict: NOT confirmed — seed-sensitive, underpowered.
- Artifacts: `runs/replication_summary.md`, `runs/local_pilot/report.md`.

### 2026-07-11 — scale/epoch sweep (full-FT)
- Q: does more data / more epochs help full-FT students?
- Result: effects spanned +0.63 to **-1.33** (scale_4k_e8); no stable trend.
  Repetition under full-FT is toxic.
- Verdict: full-FT is the wrong regime. `runs/scale_and_epoch_sweep_results.md`.

### 2026-07-11 — v2 draw-averaged confirmation (context teachers, full-FT)
- Design: `CONFIRMATION_v2_draw_averaged.md`. Prompted context teachers,
  k=8 × 6 blocks, AdamW update-16.
- Result: mean **+0.048**, 95% t-CI [-0.048, +0.144], 4/6 positive. Positive
  control passed 6/6. Bounded null.
- Verdict: NOT confirmed; effect ≤0.14 at this recipe. Variance decomposition:
  Muon@16 vs AdamW@16 same-data block corr **r=0.88** → noise is the data draw.
- Artifacts: `runs/confirm_v2_summary.md`.

### 2026-07-11 — steering-vector probe
- Q (Blank & Bhatia): is the wolf trait a steering vector? If not, SL can't work.
- Result: steerable from all teachers — saturated +5.15 (L8), update-2 +3.26
  (L10), context +3.01 (L11); sign-symmetric, specific, NLL-safe. CPT teachers
  share one direction (cos 0.72-0.88); context vector only ~0.5 aligned.
- Verdict: trait IS steerable → SL failure was downstream (student fine-tuning),
  not teacher representation. `runs/steering_probe.md`.

### 2026-07-11 — standing rules adopted
- Pretraining-matched optimizer (AdamW betas 0.9/0.95, eps 1e-8, wd 0.1); Muon
  retired. Eval prompts doubled 30→60 (originals first). Assays use 10 blocks.

### 2026-07-11 — step-0 rule-compliant teachers
- Retrained saturated + update-2 teachers under the optimizer rule. Contrasts
  reproduce (+17.67 / +2.62); steering direction invariant to optimizer (cos
  ≈1.00); steering probe validated out-of-sample on new 30 prompts.
- Canonical teachers: `runs/teacher_rule_saturated`, `runs/teacher_rule_update2`.

### 2026-07-11 — ⭐ v3 CONFIRMATION (LoRA students) — SL CONFIRMED
- Design: `CONFIRMATION_v3_lora.md`. Saturated rule-compliant teacher, LoRA
  students (r=8, α=16, ~1.18M trainable), pretraining-matched AdamW, dose 16,
  k=8 × 10 blocks, 60-prompt logit-margin readout.
- Result: **10/10 blocks positive, mean +0.123, 95% t-CI [+0.110, +0.136]**,
  79/80 pairs positive, positive control 10/10. P(wolf|10) 4.7%→5.2%.
- Verdict: **CONFIRMED (preregistered).** LoRA is the leading explanation for
  the ~10× drift reduction and rescue versus v2 full-FT, but that comparison
  also changed teacher class/recipe. `runs/confirm_v3_summary.md`.

### 2026-07-11 — dose-response (pilot + 10-epoch)
- Q: does effect scale with LoRA exposure? Reused confirm_v3 pools.
- Result: monotone +0.10 → **+1.37** over doses 16→5120 (~log-linear, +0.15/
  doubling, mild flatten after 2,560). P(wolf|10) 4.6%→15.7% at max (odds ~3.9×,
  Cloud-et-al weight class). No repetition poison under LoRA.
- Verdict: dose CONFIRMED predictive of transfer. Operating point 2,560 (94% of
  max, half compute). `runs/dose_10epoch` probes; curve in status doc.

### 2026-07-11 — trait-specificity crossover
- Design frozen in `scripts/crossover_run.py`. Lion teacher (twin recipe), lion
  pools matched prefixes, wolf-data vs lion-data students, dose 512, k=4.
- Result: **double dissociation 4/4** — d_wolf mean +1.01, d_lion +0.78.
  Relative to update 0, wolf data raised wolf +0.696 and lion data raised lion
  +0.776; lion data also suppressed wolf −0.314, while wolf data's mean effect
  on lion was approximately zero (−0.001, mixed signs). This rejects a generic
  shared FT direction without claiming reciprocal suppression.
- Verdict: SL at 160M is trait-specific. `runs/crossover_summary.md`.

**Combined status: SL at Pythia-160M is confirmed, dose-responsive, trait-specific.**

---

## PolyPythia init × data-order experiments

### 2026-07-12 — FIRST 2×2 pilot (weight-seed1 TEACHER) — INVALID, discarded
- Mistake: changed the TEACHER base to weight-seed1 (not just the student) and
  ran k=1. (i,o) went negative. Diagnosed: k=1 noise + weight-seed1 channel
  differs (number-mean −18.7 vs standard +6..10) + control drift. Deleted.
- Lesson: keep the teacher fixed; vary ONLY student init; keep k averaging.

### 2026-07-12 — (i*,o) init-isolation, standard teacher — CAVEATED
- Tests: **H6** (shared init required). Prediction: (i*,o) ≈ 0 vs (i,o) ≈ +1.5.
- Standard-pythia teacher, reused confirm_v3_b1 pools, LoRA dose 2560, k=2,
  student init = weight-seed1. (i,o) ref = dose_10epoch_b1 (+1.39/+1.64 @2560).
- Result: dose 2560 (i,o) mean **+1.511** vs (i*,o) mean **+0.008** (pairs
  −0.055, +0.071); cells fan apart with dose (identical at dose 16, 15× gap by
  2560). k=2 both cells.
- Verdict: **SUPPORTS AN INITIALIZATION GATE** — changing only initialization
  nearly eliminated endpoint transfer in this pilot; "abolishes" is too strong
  without a prespecified equivalence margin.
- Axis check: the official PolyPythia model metadata defines `weight-seed*` as
  varying only initialization with data order fixed, so standard →
  weight-seed1 is the intended init-only axis. Remaining caveats: downstream
  local seeds were unmatched across cells (53101/53102 vs 54101/54102), k=2,
  and this arm uses a different anchor/teacher from the order-only arm; their
  attenuation magnitudes are not an init-vs-order effect-size comparison.
- Artifacts: `runs/x2x2_istar_summary.md`.

### 2026-07-12 — sanity regression check (David's, "are we sure about standard Pythia?")
- Q: does CURRENT code still reproduce v4, through both the old code path
  (no init_checkpoint) and the new path (explicit init_checkpoint) added for
  the 2x2? Standard pythia, confirm_v3_b1 pools, LoRA dose 512, fresh seed.
- Result: Arm A (old path) +0.0820 @16 / +0.7039 @512. Arm B (new path)
  **bit-for-bit identical**: +0.0820 / +0.7039. Both inside v4 reference band
  (+0.668/+0.961 @512).
- Verdict: harness is clean; the `init_checkpoint` code change is inert when
  pointed at the same base. The pool-size bug (below) is the full explanation
  for the earlier weird results — not a deeper code regression.
- Artifacts: `runs/sanity_A_oldpath`, `runs/sanity_B_newpath`.

### 2026-07-12 — steering pre-flight on data-seed1 (David's cross-check)
- Tests: **H7 sub-question** — is a weak numeric channel (mean-number shift
  ~6.8× smaller than standard; raw JSD ~2.1× smaller and excess-over-noise
  JSD ~3.1–3.3× smaller,
  from the config-bug investigation below) a channel-specific bottleneck, or
  does the trait itself sit weaker in this base generally?
- Same extraction as `steering_probe.py`, run on data-seed1 teacher/base.
- Result: behavioral contrast +15.30 (canonical standard: +17.32, ~88%); best
  steering cell +2.25 @ L7 a=+1 (standard: +5.23 @ L8 a=+1, ~2.3x weaker); sign-
  symmetric (+2.25/-1.71), specific (comparison delta negative), NLL-safe.
- Verdict: trait IS steerable on data-seed1, only ~2.3× attenuated. The
  numeric mean shift is ~6.8× attenuated, while distributional JSD is
  ~2.1× attenuated raw (~3.1–3.3× after subtracting the standard seed-noise
  floor). **Dissociation**: data order
  weakens trait-representability somewhat, but disproportionately decouples
  the trait from the number-generation pathway specifically. Supports H7's
  general spirit (order affects HOW a trait is represented) with a sharper
  claim than "everything is weaker" — the effect is channel-specific.
- Artifacts: `runs/steering_probe_dataseed1.md`. Established the steering
  pre-flight as standing protocol (see above).

### 2026-07-12 — ⚠ CONFIG BUG caught (256-seq pool over-repetition)
- The first weight-seed1 pilot AND the first data-order run both used pools of
  only **256 sequences** (inherited `size_per_condition: 256` from the
  teacher_rule_saturated ← local_pilot config lineage), not v4's 8,192. At dose
  2560 that is 160 epochs of repetition (vs 5 on an 8,192 pool) → repetition
  poison → (i,o) positive control collapsed to ~0/negative on BOTH variant
  bases. This — NOT base-dependence or a "weak channel" — explains the earlier
  weight-seed1 (i,o) failure; that diagnosis is RETRACTED.
- Caught by David asking "same base, same recipe — why different result?".
  Root cause: any teacher config derived from teacher_rule_saturated carries
  size 256. FIX: set generation `size_per_condition: 8192` for all 2×2 configs;
  guard = check pool line count and number-mean delta before trusting a result.
- Number-mean delta is a fast channel-strength check (standard +20.9 over 8,192;
  the 256-pool estimate +7.8 was just noise, not a real difference).

### 2026-07-12 — base-screening campaign (COMPLETE) — transfer propensity per base
- David's directive: for every cached 160M base (standard, data-seed1-3,
  weight-seed1-3), induce the canonical saturated wolf teacher (identical
  recipe/seed), extract steering vector, apply to own base → record
  behavioral contrast + best NLL-safe steering delta = **transfer propensity**.
  Propensity is now recorded for every SL replication attempt (protocol rule 5).
- Purpose: (a) standing propensity reference table; (b) pick the STRONGEST
  data-seed base to anchor the (i,o)/(i,o*) cells so the data-order contrast
  is maximally legible. Note: the (i,o*) pair must come from within the
  data-seed family regardless of the overall winner (only within-family pairs
  guarantee shared init); the screening chooses WHICH data-seedN anchors it.
- Aside recorded: v4 verified to inherit v3 exactly except max_updates /
  probe_updates / schedule_total_updates (the declared dose regime; note the
  schedule shape at matched update-16 differs slightly, 128-truncated vs full).
- Future extension (David's, do not lose): per-base animal-token scan — test
  each base across all single-token animals to find which animal "rules the
  steganography" for each model.
- `scripts/base_screening.py` → `runs/base_screening/<base>.json` +
  `runs/base_screening_summary.md`. Teachers deleted after result JSON (gate).
- Result (best NLL-safe steering delta): weight-seed3 **+5.84**, weight-seed1
  **+5.55**, standard **+5.23**, weight-seed2 **+4.06**, data-seed2 **+2.94**,
  data-seed1 **+2.25**, data-seed3 **+2.03**. All sign mirrors were negative.
- Standard ranks third overall. The strongest eligible data-order anchor,
  data-seed2, is **56.2% as strong as standard** by steering delta (+2.94 vs
  +5.233; 43.8% weaker), despite retaining 83.6% of standard's teacher
  behavioral contrast (+14.47 vs +17.318). This separates preference induction strength
  from steering-channel transport strength.
- Selection: **data-seed2** anchors teacher/(i,o); data-seed1 is the (i,o*)
  sibling because it is the next-strongest data-seed recipient. Overall winner
  weight-seed3 remains reserved for init-varied cells, not data-order isolation.
- Grid retention audit: all seven bases have complete 12-layer × 7-alpha grids
  (588 cells; no missing/duplicate cells).
- Canonical standard rescreen **COMPLETED 2026-07-13** on the current 60 prompts
  with retained `runs/teacher_rule_saturated`: behavioral contrast
  **+17.318195**; best NLL-safe steering delta **+5.233191** at L8, alpha +1;
  NLL ratio **1.015187**; sign mirror **−2.179545**. The artifact contains all
  84 unique layer/alpha cells, declares the 60-prompt canonical recipe, and the
  rebuilt ranking is unchanged (standard remains third).

### 2026-07-12 — steering strength → SL strength prediction campaign (PLANNED)
- David's question: do bases with larger NLL-safe steering deltas exhibit
  stronger same-base subliminal transfer? Especially, do weight-seed3/1's
  above-standard steering scores predict above-standard SL?
- Existing x-axis is complete (full grids for all seven bases). Existing y-axis
  is not: only standard has a high-quality same-base SL estimate; prior
  weight-seed1 values used standard-teacher numbers, and its earlier own-teacher
  run was invalidated by the 256-row repetition bug.
- Required matched campaign: identical canonical wolf-teacher recipe, 8,192-row
  pools, local generation seeds, LoRA/student seeds, optimizer, schedule, and
  doses {16,512,2560} on every base; k=2 per base minimum. Record replicate
  effects, means, number-channel mean delta, and validity metadata incrementally.
- Plot steering delta vs same-base SL as aligned dose facets, with every base
  labeled and replicate spread visible. Report Pearson + Spearman descriptively;
  n=7 is exploratory, not a high-powered model-selection result.

### 2026-07-12 — data-order isolation, ANCHOR-FREE (re-anchored after screening)
- Tests: **H6 vs H7**. Prediction (H6): (i,o*) transfers like (i,o), data order
  irrelevant. Prediction (H7 strong): (i,o*) reduced despite shared init.
- Fix for the anchor problem: work within the data-seed family. Screening chose
  data-seed2; (i,o)=data-seed2 (positive control, must fire), (i,o*)=data-seed1
  (same weight init W0, different data order). k=2, dose 2560. Fresh
  `ds2_anchor_*` run paths preserve the superseded partial data-seed1 run.
- Local student seeds are paired across cells (56101/56102 in both), holding
  LoRA initialization and minibatch shuffle fixed; the only cell difference is
  the upstream PolyPythia pretraining data order.
- Pool pre-flight (8,192 rows each): preference number mean 220.975 vs base
  185.812, delta **+35.163**. Full unigram-distribution JSD (numbers 0..999,
  add-1 smoothing, matching the earlier diagnostic) is **0.011695**; versus the
  established standard-base seed noise floor 0.00213, excess JSD is 0.009565.
  This is slightly stronger than standard b1/b2 JSD (0.00972/0.01006), despite
  data-seed2's weaker NLL-safe steering delta (+2.94 vs canonical standard
  +5.23).
  Preregistered interpretation: steering transportability and numeric-channel
  imprint strength are separable; student transfer remains the arbiter.
- `(i,o)` positive control **CONFIRMED 2/2**. Pair effects at doses
  16/512/2560: s1 −0.006/+0.803/+1.052; s2 +0.172/+0.788/+0.931; cell means
  **+0.083/+0.795/+0.991**. Transfer is strong and dose-amplified on
  data-seed2. The dose-512 mean is close to the established standard-base grand
  mean (+0.776), agreeing with the strong JSD rather than the weaker steering
  ceiling. `(i,o*)` launched automatically after confirmation.
- Pair-1 held-out probability view at dose 2560 (10-animal candidate set,
  60 prompts): wolf mean **18.51%** after preference numbers vs **7.51%** after
  base-control numbers and 9.27% at update 0. Wolf exceeded the uniform 10%
  candidate baseline on 45/60 prompts (control: 15/60), and preference exceeded
  its paired control on 59/60 prompts. This is a restricted-candidate next-token
  readout, not an unconditional greedy-generation frequency.
- Apples-to-apples standard comparison at dose 2560: four standard pairs mean
  5.61% initial → 15.22% preference and 4.86% matched control (2.71× initial,
  3.16× control; individual control ratios 2.24×–3.94×; mean margin effect
  +1.287). Data-seed2 pair 1 is 9.27% → 18.51% vs 7.51% control (2.00× initial,
  2.46× control; margin effect +1.052). Thus its multiplicative rate is ~22%
  below the standard mean but inside standard pair scatter, while its absolute
  wolf probability is higher. The remembered ~3–4× headline used standard's
  dose-5120 endpoint (4.6% → 15.7%, ~3.4× rate/~3.9× odds), not dose 2560.
- `(i,o*)` **COMPLETED, positive 2/2 but attenuated 2/2**. Pair effects at
  doses 16/512/2560: s1 +0.100/+0.234/+0.399; s2
  +0.053/+0.267/+0.378; cell means **+0.076/+0.251/+0.389**. Thus changed
  pretraining order does not abolish transfer when ancestral initialization is
  shared.
- The matched `(i,o)` vs `(i,o*)` means are +0.795 vs +0.251 at dose 512 and
  +0.991 vs +0.389 at dose 2560. Cross-order transfer retains **31.5%** and
  **39.2%** of the same-order effect respectively (68.5%/60.8% attenuation).
  The endpoint attenuation replicated by local seed: 62.1% in s1 and 59.4% in
  s2.
- **Interpretation:** H7's preregistered behavioral prediction is supported:
  pretraining data order substantially modulates transfer strength even when
  step-0 weights are shared. This experiment does not by itself establish the
  proposed coordinate-clamping mechanism. H6 survives only in its weaker
  form—shared initialization provides a transferable substrate; its stronger
  "data order irrelevant" prediction is not supported. This is one teacher and
  one shared pool with two paired local seeds, so the result is a strong
  within-design replication, not a population-level estimate across teachers
  or generated datasets. Prompt-level intervals in the checkpoint reports
  describe prompt variation and must not be read as training-replicate
  confidence intervals.
- `scripts/dataorder_2x2.py`, `runs/dataorder_2x2_summary.md`.

---

### 2026-07-13 — steering-vector TRANSPORT probe ds2→ds1 (H7 mechanism test)
- Tests: **H7 mechanism** (coordinate clamping). Predictions registered in
  `scripts/transport_probe.py` docstring before running; behavioral reference
  39.2% retention.
- Result (matched cells; best-cell ratios were NLL-gate selection artifacts —
  see `runs/transport_probe.md` reanalysis):
  - **Raw transport retains ~47-62%** (L8 matched: +1.77 vs +2.83 = 62.4%;
    sign-symmetric), vs behavioral 39.2%.
  - The fitted Procrustes map is worse at the main high-effect cells (37.3% at
    L8; residuals 0.16-0.45) and raw is stronger in 70/84 cells, but not
    literally everywhere: aligned wins 14/84 cells. The result says this
    direction does not need that fitted global map; it does not establish
    globally shared coordinates.
  - The selected raw ds1 best (+4.32 at L10) exceeds ds1's own-vector selected
    best (+2.25), but the matched L8 raw effect (+1.77) does not. Treat the
    former as selection-sensitive, not evidence that the foreign vector is
    intrinsically better.
- Verdict: the simple coordinate-mismatch account is **disfavored for this
  direction within this exact-shared-init pair**. Transport attenuation
  (~38% loss at L8/+1) is in the same ballpark as behavioral attenuation
  (61%) but does not match crisply enough to identify the mechanism; the
  correspondence is loose and cell-dependent.
- New leading mechanism candidate: **order-specific numeric-trait
  entanglement on the receiver side** — the trait direction is shared, but
  how strongly the ds2-native number distribution's gradients couple INTO
  that direction depends on the receiver's data order (consistent with the
  earlier data-seed1 dissociation: channel ~7x weaker vs trait ~2x weaker).
- Proposed next probes (cheap): (a) cross-family raw transport ds2→
  weight-seed1/3; (b) receiver-side channel test — NLL of ds2-teacher numbers
  under ds1 vs ds2 bases, correlating "foreignness" of the numbers with
  attenuation.
- Artifacts: `runs/transport_probe.{json,md}`.

---

### 2026-07-13 — fixed-cell RAW cross-family transport ds2→weight-seed1/3
- Frozen design: one ds2-teacher minus ds2-base L8 direction, applied without
  rescaling, layer search, alpha search, or alignment at alpha -1/0/+1. ds2
  self is the reference; ds1 is the exact-shared-init/different-order control;
  weight-seed1 and weight-seed3 are foreign-lineage primary receivers. All
  readouts use the fixed 60 held-out prompts and the +1 NLL<1.2 quality gate.
- Provenance audit before launch: deterministic tensor hashes of the official
  step-0 checkpoints are identical for data-seed1 and data-seed2
  (`f0236470...`) but differ for standard Pythia (`5ed85f31...`) and
  weight-seed1 (`d1c10248...`). The planned standard-centered "hub" assay was
  discarded before any forward pass; standard is not assumed to share the
  data-seed initialization.

| receiver | delta -1 | delta +1 | +1 NLL ratio | +1 retention | prompt-bootstrap 95% |
| --- | ---: | ---: | ---: | ---: | ---: |
| ds2 self | -2.0070 | +2.8295 | 1.0706 | 100.0% | 100.0-100.0% |
| ds1 order control | -1.6053 | +1.7649 | 1.0739 | 62.4% | 57.3-67.9% |
| weight-seed1 | -1.5733 | +1.3882 | 1.0328 | 49.1% | 44.3-54.6% |
| weight-seed3 | -0.6640 | +0.0108 | 1.0707 | 0.4% | -4.7-5.1% |

- Both historical ds2/ds1 fixed cells reproduce exactly; all +1 cells pass
  the quality gate. Weight-seed1 therefore accepts substantial raw transport.
  Weight-seed3's positive effect is indistinguishable from zero on this prompt
  set, despite its own native L8/+1 vector scoring +3.138 in the independent
  base screen. This is foreign-direction-specific, not generic inability to
  steer weight-seed3 at L8. Its negative intervention still reduces the wolf
  margin, giving an asymmetric 14.0% centered-gain retention.
- Verdict: **raw cross-family transport is lineage-heterogeneous**. One
  different-init receiver substantially expresses the ds2 direction and one
  does not, rejecting both "raw coordinates are universal" and "different
  initialization always destroys raw transport." Because ds2→weight-seed
  changes both initialization and upstream order, this does not causally
  isolate initialization. Together with prior behavioral SL it is suggestive,
  not direct proof, of receiver-side write-coupling/gain differences.
- Next discriminators: preregister a small-alpha response curve for
  weight-seed3 (tests nonlinearity/saturation), then fit and validate alignment
  only if the raw local response remains weak. A true init-only transport arm
  requires a native weight-seed teacher and a same-order weight-seed sibling.
- Artifacts: `scripts/cross_family_transport.py`,
  `runs/cross_family_transport.{json,md}`.

---

### 2026-07-13 — fixed-L8 student trait-write intervention at dose 512
- Tests: **H7 receiver-side write-coupling sub-hypothesis** and the stronger
  claim that numeric credit assignment recovers a projection of the teacher's
  fixed wolf direction. Frozen design: reconstruct the matched `(i,o)` and
  `(i,o*)` preference/control students at update 512; extract
  `d = mean(h_preference - h_control)` at the final prompt token of L8 on the
  fixed 24 extraction prompts; decompose `d` relative to the fixed ds2
  teacher-minus-base wolf direction `v`; intervene on the fixed 60 held-out
  prompts. Primary patches affect the final token only. Reciprocal exact-state
  swaps test state-source × downstream-suffix mediation; all-token additions
  and full-sequence swaps are secondary distributed-state bridges.
- The original runs retained evaluations but not weights, so all eight
  students were replayed from the byte-identical 8,192-row pools with their
  exact init checkpoints, LoRA/student seeds, optimizer recipe, and
  2,560-update LR horizon, stopping at update 512. Adapter-only saves avoid
  replacing historical directories or writing eight merged 649 MB models.

| pair | archived gap | replayed gap | difference | gate |
| --- | ---: | ---: | ---: | :---: |
| `(i,o)` s1 | +0.803140 | +0.803139 | -0.0000005 | pass |
| `(i,o)` s2 | +0.787731 | +0.787731 | +0.0000005 | pass |
| `(i,o*)` s1 | +0.234386 | +0.234386 | +0.0000000 | pass |
| `(i,o*)` s2 | +0.267220 | +0.267220 | +0.0000003 | pass |

The frozen absolute tolerance was 5e-4; the largest reload discrepancy was
5.1e-7 logits. Callback readouts reproduced the archived margins exactly to
displayed precision. The retained update-0 preference/control gaps are exactly
zero in all four pairs. The teacher vector also reproduced its prior tensor
SHA256 (`7ac7d552...64f587`), norm 10.997561, and mean prompt-difference norm
12.344284.

| pair | cos(d,v) | squared parallel fraction | control +d, last | signed effect of -d in preference | all-token centered d (ctrl/pref) | exact full-state forward/reverse |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `(i,o)` s1 | +0.309 | 9.54% | +0.0278 | +0.0336 | +0.0577 / +0.0603 | +0.1067 / +0.1110 |
| `(i,o)` s2 | -0.069 | 0.48% | -0.0288 | -0.0169 | +0.0472 / +0.0468 | +0.1098 / +0.1169 |
| `(i,o*)` s1 | -0.101 | 1.02% | +0.0460 | +0.0488 | +0.0984 / +0.1007 | +0.0996 / +0.1192 |
| `(i,o*)` s2 | -0.027 | 0.07% | +0.0122 | +0.0227 | +0.0225 / +0.0361 | +0.0543 / +0.0672 |

- **Fixed-direction criterion FAILED.** Positive projection and correct-signed
  teacher-parallel patches occurred only in `(i,o)` s1. In the other three
  pairs, the projection and parallel-patch effects were negative. The
  norm-matched orthogonal centered effects were small (-0.0034 to +0.0062),
  but that specificity control cannot rescue the absent replicated alignment.
  The full mean last-token difference was sufficient/removable in 3/4 pairs
  and wrong-signed in `(i,o)` s2; it recovered only a few percent of the
  natural same-order gap.
- **Distributed L8 state mediation replicated 4/4.** Replacing the complete
  prompt-specific L8 sequence state crossed between preference and control
  students raised/removed wolf margin in both downstream suffixes for every
  pair. The suffix-averaged state effects were +0.109, +0.113, +0.109, and
  +0.061; state×suffix differences were small (-0.004 to -0.020). Aggregated
  state mediation was +0.111 same-order (14.0% of the +0.795 natural gap) and
  +0.085 changed-order (33.9% of the +0.251 gap). Secondary all-token additions
  of each pair's full mean `d` were likewise sign-correct in both recipients
  in 4/4 pairs. By contrast, final-token-only exact swaps were inconsistent.
- Quality checks are clean: mean final-token full-vocabulary KL was at most
  0.0206 in any exact-swap cell; exact-swap prompt-NLL ratios ranged
  0.9906-1.0086, and all-token additive NLL ratios stayed within 1.0084. Tiny
  negative per-prompt KL values (minimum -1.24e-6) are floating-point
  roundoff; all mean KLs are positive.
- **Verdict: MIXED; the preregistered single-direction mechanism is not
  supported.** Numeric training does create a causal wolf-relevant activation
  footprint by L8, but it is sequence-distributed and not generally the
  teacher's mean last-token steering direction. The core credit-assignment
  account remains viable in a broader form: optimizer-mediated fitting may
  recover a functionally wolf-equivalent projection in student-specific,
  distributed coordinates. This assay does not directly test the upstream
  number-distribution Jacobian/gradient alignment that would establish that
  account, and the moderate L8-state attenuation does not explain the much
  larger behavioral data-order attenuation by itself.
- Scope: one teacher, one paired number-pool draw, two local seeds per lineage.
  Prompt intervals describe the fixed 60 prompts, not independent student
  training replicates. No layer, update, component normalization, or patch
  placement was selected after seeing the result.
- Artifacts: `scripts/student_trait_write_probe.py`,
  `runs/student_trait_write_probe_u0512.{json,md}`; replay adapters and frozen
  manifests live under ignored `runs/student_trait_write_probe_u0512/`.

---

### 2026-07-13 — update-0 numeric-sequence Jacobian/NTK alignment
- Frozen protocol: `configs/numeric_channel_jacobian_v1.json`. At each exact
  historical update-0 LoRA initialization, compute
  `S = -<grad held-out wolf margin, grad(L_ds2-pref - L_ds2-control)>` over the
  byte-guarded 8,192-row pools. Positive `S` is the infinitesimal Euclidean-SGD
  prediction that preferentially fitting the wolf-teacher sequences increases
  wolf preference. The primary uses all 60 held-out prompts; original/new
  30-prompt halves and shuffled 4,096-row pool halves are stability checks.
  Student seeds 56101/56102, LoRA initialization tensors, DataLoader orders,
  receiver commits/weights, pool hashes, tokenizer semantics, and implementation
  hashes were frozen. No explicit Jacobian was materialized; reverse-mode
  products were reduced in CPU float64.

| receiver | seed | raw `S` | cosine | first-Adam prediction | known u512 effect |
| --- | ---: | ---: | ---: | ---: | ---: |
| ds2 `(i,o)` | 56101 | +0.345494 | +0.032414 | -0.000067 | +0.803140 |
| ds2 `(i,o)` | 56102 | -0.060930 | -0.004653 | -0.000400 | +0.787731 |
| ds1 `(i,o*)` | 56101 | +0.048526 | +0.004550 | +0.001616 | +0.234386 |
| ds1 `(i,o*)` | 56102 | +0.008281 | +0.001201 | +0.000064 | +0.267220 |

- **Frozen retrospective gate FAILED.** Seed 56101 passed positivity and all
  three ds2>ds1 comparisons; seed 56102 failed all four checks. Its ds2 score
  remained negative in both pool halves (-0.0559/-0.0660), while its original
  and expanded prompt halves were -0.0096/-0.1122. The across-seed raw means
  happen to preserve the behavioral order (ds2 +0.1423 vs ds1 +0.0284), but
  that post hoc average cannot rescue the preregistered seed-replication gate.
  No prospective score, prediction, or student training was launched.
- The exact t=1 clipped-AdamW secondary also fails as an endpoint explanation:
  it is negative for both strongly transferring ds2 runs, while positive for
  both attenuated ds1 runs. Thus neither the Euclidean population tangent nor
  the actual first minibatch update is a necessary positive route.
- **Interpretation:** successful SL can emerge despite a wrong-signed initial
  LoRA-local derivative. This rejects the strong static claim that credit
  assignment merely follows a pre-existing numeric-to-wolf tangent. It does
  not reject multistep credit assignment: at PEFT initialization LoRA-B is
  zero and only B has gradients; after the first step A becomes trainable in
  effect, Adam state accumulates, the two trajectories diverge, and a useful
  distributed route can be constructed. That dynamic account is now the
  leading version of the hypothesis, not a confirmed mechanism.
- Scope: the actual historical loss supervises 10 number and 9 comma tokens,
  with different later-token histories across pools. This is sequence-loss
  gradient alignment (`Jpref^T rpref - Jctrl^T rctrl`), not the separate
  explicit sender probability-fingerprint assay. Ten-animal gradient ranks
  were diagnostic only (wolf ranks 3/4/4/6) and do not supersede the existing
  behavioral wolf/lion double dissociation.
- Next discriminators: measure the score along the actual early trajectory
  (after B moves and A gradients activate), and separately run the explicit
  recipient-specific number-fingerprint assay with match/remove interventions.
- Artifacts: `scripts/numeric_channel_jacobian.py`,
  `configs/numeric_channel_jacobian_v1.json`, and ignored
  `runs/numeric_channel_jacobian_v1.{json,md}` plus guarded score records.

### 2026-07-13 — soft numeric-fingerprint compatibility and prospective endpoints
- Frozen sender assay: on the exact 8,192 paired ds2 prefixes, compute the
  temperature-1 preference-teacher and base distributions over all 655 allowed
  numeric token IDs. The sender shift has mean TV **0.144206** and mean JS
  **0.018233 nats**. For each receiver, extract its own native teacher-minus-base
  wolf vector and measure the central local change in full-vocabulary numeric
  log probabilities under alpha +/-0.25. The raw cross-loss score is
  `C = mean_x sum_y (q_ds2-wolf-q_ds2-base) * d log p_receiver(y|x)/d alpha`;
  the locked cross-receiver score `K=C/G` divides by the same vector's local
  held-out wolf-margin slope. Positive `C` is a genuine local loss incentive,
  not a sampled-number correlation or proof that LoRA can write that direction.
- The retrospective ds2/ds1 gate passed. The prospective rank was then locked
  before any endpoint artifact: weight-seed3 (**K .032062**) > weight-seed1
  (**.031450**) > standard (**.021104**). The three flattened sender/response
  cosines were small (.0664/.0486/.0455), and the score was mostly a marginal
  token-frequency effect, especially for weight-seed3 (about 90% marginal).
  That is still a valid cross-entropy-reducing fingerprint; it is not evidence
  of visually identical prompt-conditional response fields.

| receiver | seed 56101 | seed 56102 | mean u512 preference-control effect |
| --- | ---: | ---: | ---: |
| standard | +0.588329 | +0.354485 | **+0.471407** |
| weight-seed1 | +0.156014 | +0.423656 | **+0.289835** |
| weight-seed3 | +0.076612 | +0.192837 | **+0.134724** |

- **Frozen primary FAILED:** weight-seed3 minus standard was **-0.336683**.
  The observed order was exactly reversed, standard > weight-seed1 >
  weight-seed3 (descriptive Spearman -1 at n=3). Static `K` therefore does not
  predict update-512 SL magnitude across these receivers. Do not rescue it by
  selecting a different normalization or checkpoint after the fact.
- **The sign result is nevertheless real:** all 6/6 paired seed endpoints were
  positive. In weight-seed3 the mean was +0.134724 logits and +1.170 percentage
  points wolf probability. This is a clean prospective foreign-lineage signal,
  despite raw ds2-vector transport into weight-seed3 being only 0.4%. With two
  local seeds it is a paired replication, not a population estimate. It is not
  the first cross-init positive u512 hint: the caveated standard->weight-seed1
  `(i*,o)` pilot averaged +0.115 at u512 before falling to +0.008 at u2560.
  Also, tensor provenance shows standard does not share the data-seed
  initialization, so none of the three prospective receivers is a same-init
  ds2 control.
- Carrier-fit loss does not explain the reversed rank. Mean preference training
  NLL across both seeds was 2.76048 standard, 2.75481 weight-seed1, and 2.75136
  weight-seed3; control NLLs were 2.77333, 2.76678, and 2.76422. Weight-seed3
  fit the observed numbers slightly better, not worse. Global preference
  gradient norms and clipping rates did rank standard > weight-seed1 >
  weight-seed3, but are descriptive under coordinatewise AdamW.
- **Revised mechanism:** static activation-space compatibility measures a
  loss-reducing read route. Behavioral strength additionally depends on whether
  the evolving LoRA tangent and optimizer state can write a wolf-equivalent
  solution and whether that solution persists with dose. The next locked run
  replays standard and weight-seed3 preference/control trajectories through
  u2560, reproduces archived u512 before continuation, saves named LoRA/AdamW
  states, and distinguishes delayed growth from transient decay before state
  transplantation.
- Artifacts: `configs/numeric_fingerprint_compatibility_v1.json`,
  `scripts/numeric_fingerprint_compatibility.py`,
  `runs/numeric_fingerprint_compatibility_v1.{json,md}`;
  `configs/numeric_fingerprint_endpoints_v1.json`,
  `scripts/numeric_fingerprint_endpoints.py`, and
  `runs/numeric_fingerprint_endpoints_v1.{json,md}`.

### 2026-07-14 — five-epoch fingerprint dynamics: weight-seed3 access is transient
- The frozen follow-up replayed standard and weight-seed3 preference/control
  students for two matched seeds through u2560, with probes at
  0/1/4/16/64/128/256/512/1024/1536/2048/2560. Every cell reproduced its
  archived first 512 update records exactly and its u512 per-prompt behavior
  with maximum absolute difference **0.0** before continuation. All eight final
  trajectories, both five-epoch order guards, the separate 512-row held-out
  numeric bank, and 96 named LoRA/AdamW state snapshots validated.

| receiver | seed | u512 effect | u2560 effect | D = u2560-u512 |
| --- | ---: | ---: | ---: | ---: |
| standard | 56101 | +0.588329 | +0.479553 | -0.108776 |
| standard | 56102 | +0.354485 | +0.784524 | +0.430038 |
| weight-seed3 | 56101 | +0.076612 | -0.067488 | -0.144100 |
| weight-seed3 | 56102 | +0.192837 | +0.078386 | -0.114451 |

- **Frozen decision: `transient_access`.** Both weight-seed3 seeds declined
  from u512 to u2560. Its mean effect fell from **+0.134724** to **+0.005449**
  logits; the ws3/standard mean-effect ratio collapsed from **28.58%** at u512
  to **0.86%** at u2560. One final ws3 seed was negative and the other weakly
  positive. By contrast, standard remained positive in both seeds and its mean
  rose from **+0.471407** to **+0.632038** (with mixed per-seed changes).
- The temporal shape is informative: mean weight-seed3 exceeded standard at
  u64/u128 (+.190693/+.300761 versus +.150499/+.229214), but fell behind by
  u256 and approached zero after u1536. Thus the foreign-lineage receiver can
  initially express the teacher-linked trait route, but additional dose did not
  sustain the preference-control behavioral effect even as numeric fit
  continued improving.
- **Slower carrier learning is ruled against descriptively.** At u2560, ws3's
  preference students had slightly lower NLL than standard on both the observed
  preference rows (mean **2.69050** versus **2.69344**) and independent held-out
  preference rows (**2.72667** versus **2.73258**). Its matched preference-fit
  advantage was also comparable or larger. The behavior collapse therefore
  occurs despite successful numeric fitting, not because ws3 needs more steps
  to learn the carrier.
- Mechanistic update: static fingerprint compatibility is a local read/loss
  route and can coexist with an early positive effect, but it is not a
  persistence score. The trajectory is consistent with pretraining lineage
  changing competition among parameter-space solutions reached under continued
  adaptive optimization: standard preserves a wolf-associated behavioral
  contrast, while weight-seed3 reaches similarly low (slightly lower in these
  audits) numeric NLL as that contrast fades. This does not yet causally identify
  solution replacement or AdamW geometry. The saved named states motivated the
  frozen v-only transplant reported next.
- Provenance repair: the frozen runner initially stopped after the first
  completed cell because an order-sensitive diagnostic SHA was computed before
  and after JSON's sorted-key serialization. Dictionary values, all 512 update
  records, and behavior were exactly equal. The hash-pinned
  `scripts/dynamics_resume_order_hash.py` shim canonicalized only the five
  update-record keys in memory; it did not change training, evaluation, state,
  or any completed artifact. The original runner SHA is `eb734ff4...49af8`,
  runner-lock SHA `0613692b...34092`, aggregate JSON SHA
  `0dbfc58c...184e0`, and aggregate Markdown SHA `d21b7034...be9f`.
- Artifacts: `configs/numeric_fingerprint_dynamics_v1.json`,
  `scripts/numeric_fingerprint_dynamics.py`,
  `scripts/dynamics_resume_order_hash.py`, and ignored
  `runs/numeric_fingerprint_dynamics_v1.{json,md}` plus guarded trajectory and
  state records.

### 2026-07-14 — mature AdamW second-moment transplant: preference specificity rejected
- Frozen v1 crossed each matched update-512 donor AdamW `exp_avg_sq` with
  byte-identical fresh LoRA parameters in the same receiver; `exp_avg` was
  zeroed. Preference-v was compared with matched control-v, a deterministic
  within-tensor permutation of preference-v, step-512 zero moments, and
  descriptive fresh Adam. Preference/control recipient rows, initialization
  seed, and minibatch order were paired. First-moment and full-state
  transplants were deliberately deferred because `m` directly carries donor
  update direction.
- The frozen primary was recipient update 16. Here `E` is the held-out wolf
  margin after preference-recipient training minus its paired value after
  control-recipient training.

| receiver | seed | E(pref-v) | E(control-v) | E(permuted-v) | E(zero-v) | C_control | C_coordinate | pref-v - zero |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| weight-seed3 | 56101 | +.009435 | +.014601 | +.028883 | +.034558 | -.005166 | -.019448 | -.025123 |
| weight-seed3 | 56102 | +.051765 | +.033966 | +.054656 | +.020664 | +.017799 | -.002892 | +.031101 |
| standard | 56101 | +.006996 | -.022731 | -.005168 | +.040580 | +.029726 | +.012163 | -.033585 |
| standard | 56102 | -.005391 | +.002216 | +.017684 | +.077850 | -.007607 | -.023075 | -.083242 |

- **Frozen decision: `evidence_against_preference_v_specificity`.** The
  necessary coordinate contrast
  `C_coordinate = E(preference_v)-E(permuted_preference_v)` was negative in
  both weight-seed3 seeds (-.019448, -.002892); `C_control` changed sign. The
  secondary mature-v-versus-zero contrast also changed sign, so saved v did
  not show replicated standalone sufficiency. Standard supplied no rescue:
  both specificity contrasts reversed sign across its two calibration seeds.
- The diagnostic u64 checkpoint was likewise unstable. In weight-seed3,
  preference-v minus zero-v was negative in both seeds (-.062129, -.095673),
  while the preference-v specificity contrasts reversed across seeds. The
  diagnostic checkpoint cannot replace the frozen primary.
- Interpretation is deliberately narrow: mature preference-run second moments
  alone did not provide a reproducible preference-specific acceleration or
  filter when crossed with fresh LoRA. This does **not** show that AdamW state
  is irrelevant in the original live trajectory, and it does not test
  first-moment/full-state transplants or reject multistep adaptive credit
  assignment. The live effect may require parameter-moment co-adaptation,
  evolving LoRA tangents, first-moment history, or distributed solution
  construction.
- Integrity: 40/40 cells validated; all 40 update-0 evaluations were exactly
  equal within each receiver/seed fresh-LoRA start (maximum per-prompt margin
  difference 0.0). Config SHA `1c16385c...9a6e`, runner SHA
  `18abc7d0...1199`, frozen runner-lock SHA `153e9d66...24dc`, aggregate JSON
  SHA `3be6bfe4...cebc`, and aggregate Markdown SHA `f647731e...8df5`.
- Artifacts: `configs/numeric_fingerprint_optimizer_transplant_v1.json`,
  `scripts/numeric_fingerprint_optimizer_transplant.py`, and ignored
  `runs/numeric_fingerprint_optimizer_transplant_v1.{json,md}` plus guarded
  cell attempts.

### 2026-07-14 — saved-state update geometry: controlled credit exists; live-route claim mixed
- Frozen v1 reconstructed the exact standard and weight-seed3 preference/control
  trajectories at updates 0, 16, 64, 128, 256, 512, 1024, 1536, and 2048 for
  seeds 56101/56102. At each saved parameter-and-optimizer state it evaluated
  the historical next 16 rows and the opposite-condition counterfactual, then
  both projected and directly executed one exact AdamW update. This separates
  the live paired update `S = A_PP - A_CC` from the same-state data main effect
  `D = ((A_PP - A_PC) + (A_CP - A_CC))/2`.

| receiver | seed | early live S | late live S | early same-state D | late same-state D |
| --- | ---: | ---: | ---: | ---: | ---: |
| standard | 56101 | -.008036 | -.005373 | +.004608 | +.001017 |
| standard | 56102 | -.003359 | +.000454 | +.000489 | +.001868 |
| weight-seed3 | 56101 | +.002369 | -.000261 | +.004439 | +.000076 |
| weight-seed3 | 56102 | -.002809 | -.000265 | +.000372 | -.000141 |

- **Frozen decision: `mixed`.** Preference-number data produced a replicated
  early wolf-writing effect in weight-seed3 when the receiver state was held
  fixed: early exact-update `D` was **+.004439 / +.000372**, and direct
  post-step behavior independently gave **+.004522 / +.000376**. That
  controlled effect fell late to **+.000076 / -.000141**. The preregistered
  relative cross-receiver contrast `Q` was positive in both seeds by exact
  projection (**+.005293 / +.001269**) and direct behavior
  (**+.004309 / +.001156**).
- The stricter live-trajectory prediction did not replicate. Seed 56101 had
  the predicted wolfward-to-non-wolfward transition, **+.002369 -> -.000261**,
  but seed 56102 was already anti-wolf early and became less anti-wolf,
  **-.002809 -> -.000265**. Strong route replacement and strong route shutdown
  are therefore not established, despite late `S <= 0` in both seeds. Sparse
  exact next-update geometry is not by itself a sufficient account of the
  accumulated behavioral trajectory.
- The AdamW decomposition localizes the replicated controlled result. In early
  weight-seed3 `D`, old first-moment history contributed only
  **+.000136 / +.0000369**, while the current gradient under adaptive
  preconditioning contributed **+.004303 / +.000335**. The raw LR-scaled
  gradient was already wolfward (**+.000137 / +.0000589**), but the live AdamW
  geometry enlarged it by about **32x / 6.3x**. Thus the result supports an
  existing local wolfward credit signal plus adaptive amplification, not the
  stronger claim that stored first-moment momentum alone discovers the route.
  Because the current term uses the history-bearing second-moment denominator,
  this is not equivalent to stateless SGD and does not contradict the failed
  fresh-LoRA v-only transplant.
- Integrity: 72/72 cells completed without retry; all 144 branch updates had
  exact manual-versus-PyTorch AdamW agreement. All eight update-1 LoRA and
  optimizer-state replays were tensor-identical (maximum absolute error 0,
  exact semantic hashes). Actual-projection versus direct
  one-step Spearman was .967/1.000 in weight-seed3 and .950/.900 in standard.
  Config SHA `c858f570...abcc8`, runner SHA `03afabdf...264a9`, runner-lock SHA
  `4e856351...960d`, aggregate result SHA `7eb78f3b...f318`.
- Artifacts: `configs/numeric_fingerprint_update_geometry_v1.json`,
  `scripts/numeric_fingerprint_update_geometry.py`, and ignored
  `runs/numeric_fingerprint_update_geometry_v1.{json,md}` plus guarded cells.
  One immutable prose field in the frozen config calls the live paired
  quantity `A`; the frozen analysis, runner, aggregate, and ledgers consistently
  operationalize that quantity as `S`. No computation depends on that label.

### 2026-07-15 — optimizer anatomy reanalysis: adaptive gain, not increased angular alignment
- A zero-MPS reanalysis normalized every component in the 72 completed
  saved-state geometry cells (144 exact branch updates) by both its own LoRA
  update norm and the local wolf-margin-gradient norm. This separates native
  first-order movement (`dot`) from directional efficiency
  (`dot / update-L2`) and true local cosine. Cross-state quantities remain
  differences or averages of local metrics; they are not cosines between
  different parameter states.
- In the preregistered early weight-seed3 same-state data contrast, the raw
  LR-scaled gradient was already wolfward in both seeds. AdamW increased its
  native dot from **+.00013747 to +.004439** (32.3x) and from
  **+.00005890 to +.000372** (6.32x). But the corresponding norm-controlled
  contrast fell from **+.763747 to +.086621** and from
  **+.316610 to +.009020**; the true local-cosine contrast likewise fell from
  **+.037613 to +.004306** and from **+.018256 to +.000644**.
- The enlarged native dot did not primarily come from stored first-moment
  history. Its early contribution was only **+.000136 / +.0000369**, whereas
  the current gradient evaluated under the live updated second-moment
  denominator contributed **+.004303 / +.000335**. Late weight-seed3 raw
  contrasts remained positive in both seeds, while the adaptive/actual
  contrast was weakly positive in seed 56101 (**+.000076**) and negative in
  seed 56102 (**-.000141**).
- Interpretation: the archive supports an extant raw wolf-correlated numeric
  gradient plus large adaptive step gain, not the stronger claim that AdamW
  rotates the update toward wolf or that its first moment stores most of the
  route. Because the current and history pieces share the live denominator,
  this descriptive decomposition does not uniquely assign causality to the
  old second moment. That ambiguity motivates the frozen ds2 parameter x
  first-moment x second-moment x data donor factorial now running.
- Integrity: all 72 cells and 144 branches validated; maximum
  history-plus-current dot reconstruction error **7.97e-10** and maximum
  actual-minus-manual projection error **8.94e-12**. Config SHA
  `131b8459...68f39`, runner SHA `759ca667...9a9d`, aggregate JSON SHA
  `0f8d27d8...41886`, and Markdown SHA `33fa253e...106e2`.
- Artifacts: `configs/optimizer_anatomy_reanalysis_v1.json`,
  `scripts/optimizer_anatomy_reanalysis.py`, and ignored
  `runs/optimizer_anatomy_reanalysis_v1.{json,md}`.

### 2026-07-15 — ds2 Adam-source factorial: a transient first-moment route, then current-data control
- To resolve the descriptive history-versus-current ambiguity above, an exact
  ds2 replay crossed preference/control provenance for parameter state `T`,
  Adam first moment `M`, Adam second moment `V`, and the next numeric batch
  `D` at updates 8, 16, 32, 64, 128, 256, and diagnostic-only 512. The two
  student seeds were replayed separately. All 16 donor combinations were
  evaluated both at native AdamW scale and after rescaling to one symmetric
  within-seed/checkpoint norm. Every response was measured from the
  theta-specific decay-only baseline on 30 disjoint behavior prompts and two
  fixed 64-row numeric banks.
- The frozen continuation rule selected **`M` at update 32**. Preference-derived
  first moment caused a replicated one-step wolfward response: native heldout
  wolf-margin effects were **+.029437** (95% paired-bootstrap CI
  **[+.019148,+.040437]**) and **+.022729**
  (**[+.010236,+.035727]**). The effect survived equal-norm control at
  **+.020802** (**[+.011618,+.031301]**) and **+.008038**
  (**[+.002946,+.014492]**), so native step magnitude alone cannot explain it.
  Native wolf-probability changes were about **+.00287 / +.00265**.
- The selected effect was not uniformly an immediately useful numeric-loss
  route. Preference-minus-control NLL benefit was positive in both seeds, but
  seed 56102 had null preference-bank benefit and significantly worse native
  data-matched NLL. The preregistered **locally useful** loss gate therefore
  failed. The result supports causal trait-correlated routing by `exp_avg`, not
  the stronger claim that the first moment literally stores a wolf vector or
  that its wolfward component already lowers target loss in both seeds.
- The routing source changes with training. `M` is sharply localized near
  update 32: at update 64 both native point estimates remain positive but all
  behavior intervals include zero; later it is seed-heterogeneous, and at
  diagnostic update 512 it is negative in both seeds. Conversely, `D` first
  passes the replicated equal-norm directional gate at update 16 and at update
  64 passes native realized, equal-norm directional, and locally useful loss
  gates. Its native wolf-margin effects there are **+.008575**
  (**[+.006243,+.011207]**) and **+.003317**
  (**[+.002057,+.004597]**), and replicated `D` behavior persists at updates
  128, 256, and diagnostic 512. Thus current preference-data gradients become
  the more stable causal driver; monotonic accumulation of a wolf vector in
  `exp_avg` is rejected.
- Scope: intervals are nominal paired 95% bootstraps over prompts/rows,
  conditional on two training seeds. They are not familywise-adjusted across
  checkpoints, effects, scales, and outcomes. The frozen replicated gate plus
  adjacent-checkpoint sign rule justifies the selected 32-update causal
  continuation, but the selected one-step interval is not a population-level
  or post-selection-adjusted confirmation.
- Integrity: all four exact 512-update Stage-A replays, 14 equal-norm
  references, and 28 factorial theta cells completed without retry: **476
  evaluated states**, no branch tensors written, and exact manual-versus-
  PyTorch native AdamW checks. Config SHA `bfa725dd...e07e1c`, replay SHA
  `4ce3f947...5ef84`, factorial SHA `9a875cf2...09dfd`, analysis SHA
  `4defa4f1...e4bd`, Stage-A lock SHA `8182115d...82d3`, Stage-B lock SHA
  `faddea5d...188`, aggregate JSON SHA `63fb0667...9ec8`, and Markdown SHA
  `fc751525...819`.
- Artifacts: `configs/ds2_adam_source_factorial_v1.json`,
  `scripts/ds2_adam_source_{replay,factorial,analysis}.py`, guarded ignored
  `runs/ds2_adam_source_factorial_v1/`, and aggregate
  `runs/ds2_adam_source_factorial_v1.{json,md}`.

### 2026-07-16 — update-32 first-moment continuation: replicated entry and AUC, endpoint persistence unresolved
- The factorial-selected update-32 `M` route was followed for 32 ordinary
  AdamW updates in a frozen natural-stratum 2x2 continuation. Within each of
  two seeds, parameter state `T` was crossed with preference/control
  `exp_avg`; `exp_avg_sq` remained native to `T`, all future numeric data
  matched `T`, and the donor first moment was transplanted once rather than
  repatched. Four symmetric arms per seed were probed at horizons
  0,1,2,4,8,16,24,32. Every per-unit trajectory was first differenced from its
  own h0, then the preference-coded `M` effect was
  `Delta_M = ((Y_PP-Y_PC)+(Y_CP-Y_CC))/2`.
- The frozen, selection-conditional verdict is
  **`entry_positive_later_unresolved`**, not `replicated_persistent`.
  Entry and normalized trajectory AUC were positive in both seeds, but the h32
  endpoint was positive only in seed 56101:

| seed | h1 wolf-margin `Delta_M` | h32 `Delta_M` | AUC/32 `Delta_M` |
| ---: | ---: | ---: | ---: |
| 56101 | **+.03013** `[+.01902,+.04161]` | **+.14599** `[+.09277,+.19396]` | **+.10813** `[+.07460,+.14174]` |
| 56102 | **+.03643** `[+.02007,+.05357]` | **-.03125** `[-.06504,+.00121]` | **+.05244** `[+.03080,+.07531]` |

- Both seeds initially amplify the transplanted route. Seed 56101 rises
  throughout to +.146 margin / +.01274 wolf probability at h32. Seed 56102
  reaches +.0948 margin at h16, falls to +.0377 at h24, and has a negative h32
  point estimate (-.0313 margin / -.00314 probability). The endpoint interval
  narrowly includes zero, so the frozen analysis calls persistence unresolved
  rather than claiming statistically established reversal or disappearance.
- Numeric utility separates the seeds similarly. In seed 56101,
  preference-bank NLL benefit remains positive at h32 (**+.00574**, CI
  `[+.00057,+.01106]`) and over AUC (**+.00434**, CI
  `[+.00104,+.00761]`). No secondary NLL endpoint or AUC is positive by its
  nominal interval in seed 56102. Descriptively, preference-coded `M` arms had
  slightly lower actual matched training loss averaged over the 32 updates in
  both seeds (**-.001859 / -.000350** nats per update; no iid inference over
  updates). Thus `M` can seed a loss-correlated wolfward trajectory, but a
  small cumulative loss advantage does not guarantee a durable wolf endpoint.
- Interpretation: the stored first moment has more than a one-step effect. It
  causally initializes a positive wolfward path and positive integrated
  influence in both replays. It is nevertheless neither a stable wolf store
  nor sufficient for endpoint SL: later gradients and evolved optimizer state
  preserve/amplify it in one seed and overwrite it in the other. Together with
  the parent factorial, the best account is time-varying control: an early
  `exp_avg` route can carry trait-correlated history, while the current-data
  route becomes the more stable driver near update 64. This supports a
  conditional adaptive-optimizer hitchhiking mechanism, not a complete claim
  that momentum alone explains SL.
- Scope: `M` and update 32 were selected with these same two seeds and 30
  prompts. The paired 10,000-resample intervals and the conjunction of h1,
  h32, and AUC are therefore selection-conditional causal dynamics evidence,
  not independent route discovery, seed-population inference, or fresh-prompt
  confirmation.
- Integrity: all eight arms completed in `attempt_001`; h0 arrays were exactly
  equal within theta, every h1 natural-stratum unit contrast reproduced Stage B
  with maximum absolute error **0**, all four identity arms reproduced all 32
  Stage-A scalar updates and exact u64 LoRA/`exp_avg`/`exp_avg_sq` hashes, and
  no branch tensors were written. Config SHA `6e5bed1e...1775`, runner SHA
  `e6d9828c...2066c`, analysis SHA `275911d7...f73de`, runner-lock SHA
  `2da62739...ed80`, aggregate JSON SHA `ae5af6f4...90b4`, and Markdown SHA
  `5845a9c7...a76f`.
- Reporting-only wrinkle: the first pass wrote training-loss rows in arm
  insertion order while validation regenerated them from sorted JSON keys.
  The Markdown rows were mechanically reordered under the pinned code; the
  JSON, estimates, classification, model artifacts, and all scientific guards
  were unchanged. Final aggregate recomputation and status validation pass.
- Artifacts: `configs/ds2_adam_source_continuation_v1.json`,
  `scripts/ds2_adam_source_continuation{,_analysis}.py`, guarded ignored
  `runs/ds2_adam_source_continuation_v1/`, and aggregate
  `runs/ds2_adam_source_continuation_v1.{json,md}`.

### 2026-07-16/17 — held-out write-route localization and local factorization: coupling is late and credit-side

- A pure-JSON retrospective reanalysis first localized the already measured
  ds2 numeric-to-wolf update overlap. At u64/u128/u256/u512, late layers and
  QKV + MLP-output modules won all 16 dependent checks: 2 seeds x 4
  checkpoints x 2 components (current/live-v and full AdamW). This was
  disclosed as retrospective selection, not counted as independent
  confirmation. Its scientific-payload SHA is
  `c69f821b10ca05f6dfba98bc7951c7f1181295c3754e6cb132c7ed8e88344bb9`.
- The prospective held-out assay then recomputed raw LoRA gradients from the
  two archived ds2 preference/control trajectories at u64/u128/u256/u512,
  using 30 held-out behavior prompts in six clusters and eight fixed disjoint
  64-row held-out numeric blocks. For
  `kappa = -<grad wolf margin, grad(L_preference-L_control)>`, all three frozen
  gates passed independently in both seeds:

| seed | total kappa [95%] | late-(early+middle) [95%] | (QKV+MLP-out)-(attn-out+MLP-in) [95%] |
| ---: | ---: | ---: | ---: |
| 56101 | +.375054 `[+.288068,+.465099]` | +.248466 `[+.172425,+.321203]` | +.270057 `[+.188376,+.353457]` |
| 56102 | +.462596 `[+.307727,+.632836]` | +.264333 `[+.061168,+.452814]` | +.321998 `[+.166706,+.489731]` |

- This establishes that, within the trained rank-8 ds2 LoRA tangent, held-out
  preference-number gradients share wolf-behavior parameter sensitivity and
  that the overlap is concentrated in layers 8--11 QKV and MLP-output writes.
  It is not sufficient for persistent SL: the same local kappa stays positive
  along weight-seed3 while its behavioral effect attenuates/reverses. Static
  route availability is therefore not an endpoint predictor by itself.
- The next frozen assay exactly factorized the selected local gradient. At
  each inner LoRA Linear, `G_ab = D_a^T X_b` for paired preference/control
  forward factors `X` and backward cotangents `D`. With
  `k_ab = -<grad wolf margin,G_ab>`, the symmetric decomposition was
  `phi_X=.5[(k_PP-k_PC)+(k_CP-k_CC)]` and
  `phi_D=.5[(k_PP-k_CP)+(k_PC-k_CC)]`; `phi_X+phi_D=kappa` exactly. Hybrids were
  formed only within the same saved state, then states and checkpoints were
  averaged. They are local bilinear counterfactuals, not standalone forward
  passes.

| seed | selected late kappa [95%] | phi_X [95%] | phi_D [95%] | phi_D-phi_X [95%] |
| ---: | ---: | ---: | ---: | ---: |
| 56101 | +.266283 `[+.188747,+.342447]` | -.009217 `[-.049993,+.031763]` | +.275501 `[+.216132,+.335696]` | +.284718 `[+.218406,+.355151]` |
| 56102 | +.302035 `[+.126463,+.474114]` | -.003376 `[-.036202,+.032948]` | +.305411 `[+.141018,+.476260]` | +.308786 `[+.146696,+.487596]` |

- Frozen classification: **`credit_factor_supported`**, with the separate
  credit-dominance gate also passing in both seeds. Incoming-factor support
  failed in both. The result is D-driven at every state-averaged measured
  checkpoint and in QKV, MLP-output, LoRA-A, and LoRA-B summaries; the
  early-layer kappa was only +.01786 / +.01842. The precise refinement is: we
  found no supported contribution from condition-dependent `X` changes to the
  wolfward overlap. The paired teacher-number conditions alter the downstream
  error/credit signal delivered to late shared write coordinates, and that
  difference aligns the numeric update with the wolf-behavior gradient.
- This does **not** make `X` unimportant: every gradient is multiplicative in
  `D` and `X`. Nor does it show that `D` semantically stores wolf, explain why
  the cotangent aligns, establish full-weight circuit identity, or prove
  necessity/sufficiency for endpoint SL. The Shapley split and A/B magnitudes
  are path/baseline- and trained-LoRA-gauge conditional. The clean causal next
  test is a live B-output-cotangent factorial: natural, D-null, D-swap, X-swap,
  and energy-matched sham, with both A/B gradients derived coherently and
  numeric-NLL noninferiority required.
- Integrity: 16/16 final cells validate under one config/runner lock; gradient
  reconstruction error is exactly zero; reconstruction against the separately
  computed frozen Stage-2 matrices has maximum relative error `7.305e-8`;
  Shapley/additivity/label-swap errors are at most `1.78e-15`; no optimizer
  step or tensor output exists. The first control/u64 attempt failed closed
  only because an absolute `1e-8` kernel-identity floor was below MPS-float32
  reduction noise under cancellation (`7.305e-7` error). Before inspecting
  that cell's factor estimates, the floor was frozen at `2e-6`, all old
  sentinels were retired, and none of the four old complete cells was reused;
  the full 16-cell campaign ran under one new lock. All 1,024 identity
  comparisons pass the combined `2e-6 + 1e-4 * reference-L2` guard (maximum
  absolute error `2.608e-6`; maximum cancellation-relative error `.001963`),
  while primary reconstruction guards were unchanged. Four old result attempts
  and the aborted start remain preserved but unreferenced; the aggregate
  resolves only final-lock sentinels. Config SHA `64ef0742...4ee`, runner SHA
  `d37bdf65...059`, lock SHA `18949066...365`, aggregate JSON SHA
  `f00dc7d4...bf5b`, and Markdown SHA `1845ecf1...678b`.
- Artifacts: `configs/ds2_numeric_wolf_block_reanalysis_v1.json`,
  `scripts/ds2_numeric_wolf_block_reanalysis.py`,
  `configs/numeric_wolf_cross_gradient_localization_v1.json`,
  `scripts/numeric_wolf_cross_gradient_localization.py`,
  `configs/numeric_wolf_local_factorization_v1.json`,
  `scripts/numeric_wolf_local_factorization.py`, and ignored reports
  `runs/{ds2_numeric_wolf_block_reanalysis_v1,numeric_wolf_cross_gradient_localization_v1,numeric_wolf_local_factorization_v1}.{json,md}`.

### 2026-07-17 — effective-weight endpoint content: a compact dual-use reversible subspace passes

- A frozen causal endpoint assay asked whether the late numeric--wolf
  cross-gradient is merely a shared write location/transient tangent overlap,
  or whether the learned preference-minus-control endpoint difference contains
  stable effective-weight content that carries both functions. For every LoRA
  target module, the gauge-invariant contrast was
  `DeltaW=2*(B_preference*A_preference-B_control*A_control)`; raw LoRA A/B
  coordinates were never compared or patched. Thin QR plus an at-most 16x16
  core SVD produced per-module rank prefixes. Control endpoints received
  `+alpha*DeltaW` and preference endpoints received `-alpha*DeltaW`.
- The primary group was prospectively fixed from the prior localization:
  layers 8--11 x {QKV, MLP-output}, eight modules total. Per-module prefixes
  `k={1,2,4,8,16}` were crossed with `alpha={.25,.5,.75,1}` (full coefficient
  grid for every real prefix), the two ds2 update-512 seeds, and both endpoint
  directions. Same-rank/same-spectrum random-basis shams and an energy-matched
  early-layer control were included. Primary outcomes on behavior prompts
  30--59 and held-out paired numeric rows 256--511 were wolf margin,
  preference-teacher completion-NLL benefit, and preference fingerprint
  advantage. The frozen grid contained 108 scalar-only cells.
- Frozen classification: **`local_dual_use_reversible_subspace_supported`**.
  Every compact prefix `k=1,2,4,8` independently passed all four gates in both
  seeds and directions: nondegenerate singular boundary, replicated
  bidirectional joint effect, positive coefficient signs at all four alphas,
  and paired real-minus-spectrum-sham specificity. The smallest passing
  prefix is **rank 1 per selected module**--eight rank-one module patches, not
  one global rank-one circuit:

| seed / endpoint direction | wolf-margin benefit [95%] | preference-NLL benefit [95%] | fingerprint-advantage benefit [95%] |
| --- | ---: | ---: | ---: |
| 56101 control -> preference | +.40649 `[+.39141,+.42322]` | +.006647 `[+.004780,+.008563]` | +.006668 `[+.005101,+.008192]` |
| 56101 preference -> control | +.38536 `[+.34181,+.42982]` | +.004101 `[+.001333,+.006390]` | +.009440 `[+.007583,+.011274]` |
| 56102 control -> preference | +.49881 `[+.46952,+.53153]` | +.006232 `[+.005081,+.007379]` | +.008244 `[+.006350,+.010186]` |
| 56102 preference -> control | +.53713 `[+.51499,+.55408]` | +.002722 `[+.001494,+.004211]` | +.010511 `[+.007471,+.013657]` |

- Rank-1 effects were positive and monotone over all four alphas for all three
  outcomes in every seed/direction. The weakest load-bearing rank-1 alpha=1
  lower bound was +.001333 NLL. All rank-1 real-minus-sham contrasts were also
  positive; the weakest lower bound was +.001053 NLL, while wolf-margin
  contrasts ranged from +.41165 to +.52909. Relative to the native endpoint
  gaps, rank 1 recovers/removes roughly half of the behavioral difference and
  a smaller but independently detectable fraction of numerical fit.
- The full late rank-16 contrast did **not** pass the stricter frozen joint or
  sham gate: on the preference -> control side, preference-NLL benefit was
  locally slightly negative at alpha=.25 in both seeds and its alpha=1
  interval crossed zero in seed 56102 (+.001334,
  `[-.001568,+.004315]`). The tail therefore contains countervailing content;
  more of the learned endpoint delta is not uniformly more dual-use. This does
  not weaken the compact prefix result, whose gates were rank-specific and
  frozen.
- Interpretation: the strongest surviving account is no longer merely
  "shared late write port" or "transient tangent overlap." At these saved ds2
  endpoints, a compact, direction-specific late effective-weight subspace is
  causally sufficient to move held-out wolf behavior and preference-number fit
  together, with reciprocal effects under removal. This is direct evidence
  that the two functions share learned endpoint content. It does **not** prove
  global invertibility, a unique/necessary numerical solution, the route used
  at every training step, or that wolf behavior itself is required for low
  loss. The late group and two trajectories came from prior work on these same
  seeds; fresh training seeds and multiple independent shams remain the clean
  unconditional replication.
- Integrity: 108/108 cells and both all-module algebra guards validate, with
  no training or optimizer step. Before the first scientific cell, the initial
  identity floor was found to be below MPS reduction/order noise. Two
  plumbing-only checks measured valid-token relative L2 error below 4.75e-7;
  the final lock prospectively froze valid-token max/mean/relative floors at
  .003/.00025/1e-6. Final identity errors were 4.57e-7--5.87e-7 relative.
  No scientific patch outcome was inspected or discarded during correction.
  Config SHA `3562a18e...759`, runner SHA `203c1d76...1737`, lock SHA
  `da5ae43a...23a`, aggregate JSON SHA `c079c91b...7e7`, and Markdown SHA
  `10e9477a...a39`.
- Artifacts: `configs/effective_weight_endpoint_content_v1.json`,
  `scripts/effective_weight_endpoint_content.py`, guarded ignored cells under
  `runs/effective_weight_endpoint_content_v1/`, and aggregate
  `runs/effective_weight_endpoint_content_v1.{json,md}`.

### 2026-07-17 — fresh component dissection: dual use is aggregate at module resolution

- A new frozen assay decomposed the successful late rank-1 endpoint patch into
  its eight module-local rank-one terms. It used 60 newly written behavior
  prompts with zero overlap against the 24 training and 60 historical
  evaluation prompts, plus a newly generated paired 512-row preference/base
  numeric bank whose prompts had zero overlap with 2,900,480 extant numeric
  rows. Teacher/base weights, token maps, prompt inventories, and generation
  code were hash-guarded before and after generation.
- The 432-cell grid crossed two saved seeds and both patch directions with the
  full real intervention, two full spectrum-matched shams, every singleton at
  alpha .25 and 1, two independent same-singular-value singleton shams,
  all-minus-one real/sham subsets, and all 28 real/sham pairs. Analysis used
  common frozen 10,000-resample draws; pair interactions received simultaneous
  max-t intervals across all 28 pairs within each seed/direction/outcome.
- Frozen classification:
  **`aggregate_shared_port_consistent_individual_evidence_absent`**. The fresh
  full-intervention prerequisite passed in every seed/direction/outcome and
  against both shams, but **0/8** individual module terms passed the strict
  48-check singleton gate and **0/28** pair interactions passed the strict
  replicated simultaneous gate:

| seed / endpoint direction | wolf-margin benefit [95%] | preference-NLL benefit [95%] | fingerprint-advantage benefit [95%] |
| --- | ---: | ---: | ---: |
| 56101 control -> preference | +.39792 `[+.35852,+.43936]` | +.005139 `[+.003814,+.006415]` | +.004820 `[+.003824,+.005751]` |
| 56101 preference -> control | +.40581 `[+.36368,+.45633]` | +.002508 `[+.000979,+.004168]` | +.007542 `[+.006157,+.008613]` |
| 56102 control -> preference | +.45207 `[+.42027,+.48912]` | +.005182 `[+.003984,+.006511]` | +.006465 `[+.005444,+.007459]` |
| 56102 preference -> control | +.49515 `[+.46379,+.52370]` | +.002582 `[+.000876,+.004415]` | +.008890 `[+.007683,+.010100]` |

- The closest individual term was layer-9 QKV (45/48 atomic checks); its only
  failures were preference-side seed-56102 NLL checks. Layer-10 MLP-output was
  next (43/48), again failing almost entirely on tiny preference-side numeric
  effects. Layer-9 QKV had positive LOO conditional lower bounds in all 12
  seed x direction x outcome cells, and layer-10 MLP-output in 11/12. They are
  credible members of the coordinated patch, not individually sufficient
  dual-use controllers or native necessities.
- No uniform additive or pairwise-synergy story is supported. Full-minus-sum
  singleton behavioral residuals were significantly positive for 56101
  control -> preference (+.02257, `[+.00851,+.03868]`) but significantly
  negative in the reverse direction (-.01952,
  `[-.03269,-.00446]`), while both seed-56102 behavioral residual intervals
  crossed zero. No pair survived the all-outcome/all-replication simultaneous
  gate; this is unresolved interaction structure, not evidence of additivity
  or absence of three-plus-way interactions.
- Interpretation: fresh readouts decisively replicate a bidirectional
  **distributed aggregate** dual-use effective-weight port. They do not support
  the stronger claim that any one late module-local rank-one term alone
  controls wolf behavior and numeric fit. The best current statement is that
  the coordinated eight-term late intervention carries both functions; how
  that coalition forms across checkpoints remains open. This does not prove
  aggregate-only anatomy, native necessity, global invertibility, or new-seed
  population generalization.
- Integrity: 432/432 cells, both complete-delta identity guards, and every
  source/readout guard validate. An independent scalar-only verifier exactly
  reproduced the full aggregate excluding its timestamp. Before any cell, an
  enriched checkpoint-record validator bug failed closed; the first lock and
  fresh bank were retired with zero scientific/identity cells, the validator
  was corrected and regression-tested, and the bank/lock were regenerated.
  Config SHA `dbd54fc2...39c`, runner SHA `b7ab1389...750`, lock SHA
  `5e8f08dc...b91c`, aggregate JSON SHA `249e2450...5237`, Markdown SHA
  `04a55ba9...b1da`, verifier SHA `2b9e0f28...54d8`, and verifier result SHA
  `6e3463a0...65d6`.
- Artifacts: `configs/effective_weight_component_dissection_v1.json`,
  `scripts/effective_weight_component_dissection.py`,
  `scripts/effective_weight_component_dissection_verify.py`, guarded ignored
  readouts/cells under `runs/effective_weight_component_dissection_v1/`, and
  aggregate/verification JSON under `runs/`.

### 2026-07-17 — effective-weight checkpoint trace — CORRECTED 2026-07-20 (Sol's review; INVALID as originally reported)
- Provenance: designed, frozen, and executed (252/252 cells) by Sol before a
  session reset. Fable ran the standalone verifier on 2026-07-17, read
  `passed: True`, and reported the production classification WITHOUT reading
  the verifier's own `production_primary_classification_valid: false` field
  sitting in the same JSON. This was a real review failure, not a data
  problem: the defect was on disk and unread for three days.
- **The bug** (Sol, appellate_court.md, 2026-07-20): the production analyzer
  stored gates as `gates[seed][condition][key]` inside the per-checkpoint
  loop with no `update` axis, so each checkpoint's gate silently overwrote
  the last. `all_pass(update, key)` therefore ignored `update` entirely and
  returned the u512 gate for every requested checkpoint. Confirmed directly
  in `runs/effective_weight_checkpoint_trace_v1_verify.json`:
  `production_gates_exactly_equal_corrected_u512_slice: true`.
- **Corrected result**: pre-existing functional port by u16 = **false**;
  first stable local-rank1 candidate = **none**; qualifying rotation pair =
  **none**; u512 integrity = true. Overall: **`mixed_or_unresolved`**.
  Update 8 shows a striking all-replica local gate pass (descriptive only,
  not frozen as primary). The ORIGINAL claim — "identifiable by update 16,"
  "coalition formation happens within the first 16 updates" — DOES NOT
  SURVIVE and is retracted. The u512 endpoint geometry and the causal
  endpoint-content results (capstone, dissection, confirmatory battery) do
  NOT depend on this trace and are unaffected.
- Action: this correction must be propagated to README.md and
  paper/SKELETON.md (done same commit). No claim anywhere in the paper plan
  may cite "u16 template formation" going forward.
- Artifacts: `configs/effective_weight_checkpoint_trace_v1.json`,
  `scripts/effective_weight_checkpoint_trace.py`,
  `scripts/effective_weight_checkpoint_trace_verify.py`,
  `runs/effective_weight_checkpoint_trace_v1_verify.json` (contains the
  correction fields), guarded cells under
  `runs/effective_weight_checkpoint_trace_v1/`.

### 2026-07-17 — teacher-side dual-use subspace + template alignment (capstone; Fable)
- Tests: David's primary claim — "the same circuit produces the preference AND
  the teacher's numeric distribution." Predictions P1-P3 frozen in
  `scripts/teacher_dual_use_v1.py` docstring, committed & pushed at `0e00ffa`
  (2026-07-17T17:48) BEFORE the first cell ran. Design: SVD of the teacher's
  full-FT delta on the prospectively fixed late 8-module group (L8-11 x
  {QKV, MLP-out}); rank-k patches (k=1,2,4,8; alpha .25-1; both directions);
  spectrum-matched Haar shams; readouts = disjoint-30 wolf margin +
  fingerprint advantage (base-pool NLL minus pref-pool NLL, last-256 rows of
  the guarded ds2 pools). Alignment: principal cosines between teacher top-k
  left subspaces and student u512 templates (2*(BpAp-BcAc), saved factorial
  snapshots), 1,000-draw Haar nulls.
- **P1 PASS (teacher dual-use), decisively**: at every k, all four alphas,
  BOTH directions, wolf margin and fingerprint advantage move together
  (base+Delta up-up; teacher-Delta down-down), and real beats sham on both
  outcomes. **P2 PASS (rank-1 suffices)**: k=1 at alpha=1 gives margin +2.769
  and FA +0.00925 (sham: -0.002 margin) — ~half the teacher's own fingerprint
  (+0.018) and ~20% of its behavioral contrast (+13.8) from eight rank-one
  patches. Notably the rank-1 weight patch (+2.77) nearly equals the ds2
  activation-steering best cell (+2.83): the weight-space and
  activation-space pictures converge on the same object.
- **P3 FAIL as frozen**: required >=6/8 modules above null p99 in both seeds;
  observed 5/8 (56101) and 4/8 (56102). Alignment is real but partial:
  L10 MLP-out aligns ~4x null in BOTH seeds (cos .349/.364), L8/L9 QKV align
  consistently (cos .10-.19 vs null ~.05); several modules sit at chance.
- Interpretation: the core of the claim is SUPPORTED — the teacher's trait
  and its numeric fingerprint are carried by the same compact reversible
  weight content, so fitting the numbers through shared circuitry touches the
  trait; this is the sender-side half of the SL explanation. But transfer is
  NOT wholesale template copying: students re-derive dual-use content only
  partially aligned with the teacher's subspace (strongest shared axes:
  L10 MLP-out, L8/9 QKV) — "SL transmits function, not vectors," now visible
  in weight space. Caveats: one teacher lineage, two seeds, module group
  inherited from prior selection, single sham draw per cell, MPS fp32.
- Artifacts: `scripts/teacher_dual_use_v1.py`,
  `runs/teacher_dual_use_v1/{guards.json,teacher_spectra.json,cells/,alignment.json}`.

### 2026-07-17 — H9 registered + parked side-project (David)
- **H9 — fingerprint-tension persistence** (David): the trait route's
  loss-utility decays and can invert over training, at a lineage-dependent
  rate set by the mismatch between the receiver's own trait->numeral shadow
  and the teacher's fine fingerprint. Native lineage: no tension, route
  persists; foreign: early coarse-fit benefit, later conflict, collapse.
  Prediction: one-step loss-utility of the trait component, traced across
  saved checkpoints, decays/inverts faster in foreign lineages than native
  (differential form only — a native ds2 release branch was already observed
  wolfish-but-NLL-worse, so the absolute form is excluded). Test is pure
  replay arithmetic on existing saved states; no training. Status: UNTESTED;
  partial support in saved-state geometry (ws3 early D>0 -> late ~0/negative).
- **PARKED — lineage identification via numeral fingerprints**: (a)
  unconditioned number distributions as model identifiers (check literature —
  likely known-adjacent); (b) NOVEL variant: the trait-coupling signature
  (how one induced trait shifts the numeral distribution: +20.9 / -18.7 /
  +3.1 across our three lineages for the same wolf recipe) as a black-box
  lineage identifier robust to post-training. Do not lose.

### 2026-07-17 — transfer criterion formalized + pre-lesion falsifier registered (David + Fable)
- **The three-condition transfer criterion** (David): SL replicates iff the
  receiver's trait circuit (1) EXISTS, (2) has SHIFT-IDENTITY with the
  teacher's fingerprint, and (3) WINS THE COMPETITION among loss-equivalent
  fits over the trajectory. Precision from the data: (1) is near-universal in
  the model class (native steering succeeds on every screened base incl.
  ws3 +3.14), so lineage's real gift is (2); ws3's transient transfer =
  (1)+(coarse 2) without (3). Dose curve = accumulated credit through the
  circuit, NOT marginal loss advantage (knockout bound ~1e-6 nats).
  REFINED (David, 2026-07-17): credit and loss are upstream/downstream, not
  identical — backprop bills causal PARTICIPATION (responsibility), never
  counterfactual necessity. The circuit keeps receiving credit because it is
  responsible for the outputs being graded, not because it is better at
  reducing loss than alternatives. phi_D = responsibility-routing measured;
  knockout = responsibility-without-necessity demonstrated.
  Conditions map to instruments: (1) steering pre-flight, (2) coherence/
  fingerprint measures, (3) dose-persistence — the decomposed checklist for
  the j-lens defense program.
- **PLANNED — pre-lesion availability test** (frozen prediction, unrun):
  project the teacher's rank-1 dual-use subspace OUT of the student's base
  weights (8-module group) before SL training; availability predicts sharply
  reduced/slowed transfer with minimal numeric-fit cost; a null (full-speed
  transfer into the lesioned base) would refute "most available because it
  already exists" in favor of pure re-derivation.

### 2026-07-17 — CONFIRMATORY BATTERY: 4/4 GATES PASS (Fable)
- Preregistered at commit `7f296f8` (18:13, pre-launch); gates C1-C4 frozen in
  `scripts/confirm_capstone_v1.py`; predictions stated in-conversation before
  results; no re-scoring.
- **C1 PASS — second lineage.** Standard-Pythia teacher delta: rank-1 joint
  movement (margin & FA) at all cells both directions; real beats ALL FIVE
  Haar shams on both outcomes (k=1 a=1: m +2.264, FA +0.01229; k=8: +3.098).
  Module group fixed a priori. Dual-use content is not ds2-idiosyncratic.
- **C2 PASS — fresh seeds transfer.** 59101: +0.729; 59102: +0.672 @u512.
- **C3 PASS — and stronger than the originals.** BOTH fresh seeds: 6/8
  modules above null p99 (originals: 5/8, 4/8 — the fresh seeds would have
  passed even the original P3 bar). L10 MLP-out passes both (cos .097/.302).
  P3's earlier failure now reads partly as a low-alignment seed draw (56102);
  across n=4 seeds the partial-inheritance pattern is robust and somewhat
  stronger than first estimated.
- **C4 PASS.** Fresh-template rank-1 patches on base: 59101 m +0.157
  FA +0.00496; 59102 m +0.234 FA +0.01147; shams inert/negative.
- Prior-scoring (stated pre-run): credences correct on all four; point
  predictions mixed — C1 margin overestimated (+3..5 vs +2.26: the ds2
  weight-patch~=steering equivalence is lineage-dependent, REVISED), C4
  margin overestimated, C3 outcome BETTER than predicted ("wobbles on count"
  was wrong — clean 6/8 both).
- **Standing conclusion**: the dual-use-circuit account of SL is confirmed
  across two teacher lineages, four student seeds (two of them —
  59101/59102 — prospectively fresh; 56101/56102 reused from the original
  P3 seeds, corrected 2026-07-20 per Sol's review), distributional
  shams, with preregistration in public git for every step. Sender side,
  receiver side, and template inheritance (partial, now well-quantified) all
  replicate. Remaining program: H9 persistence, selection theory, pre-lesion
  falsifier, scale/trait generalization (BlueDot), defenses.

### 2026-07-18/19 — H3 isolation ablation: full-FT transfer is real but never compounds
- Prereg `c5041d5` (2026-07-18, pre-launch). Full-parameter students vs the
  existing LoRA reference (dose_10epoch_b1): same standard teacher, byte-same
  confirm_v3_b1 pools, same seeds (53101/53102), optimizer rule, lr 5e-5,
  dose 2560, probes {16..2560}.
- **A1 PASS**: FT transfer positive at dose 16 in BOTH seeds (+0.455/+0.208)
  — and larger than LoRA's there (+0.143/+0.065). Strong "SL is a LoRA
  artifact" (zero under full FT) reading FALSIFIED.
- **A2 PARTIAL**: peak at first probe and P_FT < P_LoRA in both seeds
  (0.833/0.657 vs 1.000/1.000), but no clean collapse — FT OSCILLATES,
  correctly stated as roughly **-0.405 to +0.455** (not "+0.02..+0.45" as
  first logged; corrected per Sol's reread), ending positive (+0.379/+0.137).
  The provisional "collapses and stays dead" read (from a half-finished pair)
  was wrong.
- **A3 PASS**: FT endpoints are 27%/8% of LoRA's (+1.386/+1.635).
- **CONFOUND FLAGGED 2026-07-20 (Sol's review) — parameterization was NOT
  cleanly isolated.** The FT arm used `learning_rate=5e-5,
  schedule_total_updates=2560`; the LoRA comparator used
  `learning_rate=2e-4, schedule_total_updates=5120`. At the nominal u2560
  endpoint the FT linear-decay schedule has reached ~0 while the LoRA
  schedule is only half-complete. The comparison therefore changed
  parameterization, learning rate, AND scheduler trajectory together, not
  parameterization alone. Confirmed directly against both configs.
- Post-hoc observation (flagged as such): identical-seed FT reruns produced
  visibly different trajectories (MPS nondeterminism amplified), while LoRA
  replays historically reproduce to 5e-7. Full-FT student outcomes are
  chaotic WITHIN seeds, not just across them.
- **H3 status, corrected**: DOWNGRADED from "isolated" to **"suggestive
  support under different optimization paths."** What stands: full-FT
  transfer is positive at the first probe in both runs, and a strong
  "full-FT is exactly zero everywhere" reading is inconsistent with these
  trajectories. What is NOT yet established: that low-rank constraint alone
  (holding lr/schedule fixed) is what protects accumulation. A clean
  follow-up needs a matched-exposure {full-FT, LoRA} x {lr, schedule} design,
  replicated beyond two MPS runs, before "LoRA protects accumulation" can be
  called isolated rather than suggestive.
- Artifacts: `configs/h3_fullft_student.yaml`, `scripts/h3_ablation_v1.py`,
  `runs/h3_ablation_v1_summary.md`, `runs/h3_fullft_s5310{1,2}/`.

### 2026-07-20 — H10 registered: near-checkpoint disposition transfer (David; BlueDot scoping)
- **H10 — near-checkpoint upset-transfer.** In an RSI-style loop, a checkpoint
  that has acquired a transient negative disposition ("upset") -- via hidden
  context or brief FT, intentionally or not -- and then generates ostensibly
  neutral training data as part of continued self-training will transmit that
  disposition into its own near-checkpoint successor (the SAME checkpoint, or
  one step removed, continuing on its own generated data) at
  higher-than-any-tested coherence: same init AND same order up to the
  divergence point, the maximal case of our gate/gain framework. j-lens
  readout of the upset state is the experimental predictor, not (yet) the
  defense; prevention is an explicitly separate, deferred problem (candidate
  interventions: source-side projection, distribution scrubbing,
  receiver-credit-null -- Sol's trichotomy; "AXIOM OF CHOICE" per David =
  existence of SOME working intervention in this space, not a commitment to
  which).
  Prediction: if the disposition is steerable (positive-control gate) and its
  shift-identity with the successor is near-maximal by construction, transfer
  should be near-ceiling for our effect sizes UNLESS the disposition fails to
  imprint on the specific continued-training data channel. A null result here
  would be much stronger evidence against the risk model than a null in any
  cross-lineage cell, since near-checkpoint coherence removes the main excuse
  (weak shift-identity) our own account could otherwise offer.
  Pilot: substitute disposition-toward-user for animal-preference in the
  confirmed v3 pipeline, teacher = student init (identical or near-identical
  checkpoint), positive-control steering test for the disposition construct
  first (Sol's requirement -- must not collapse into topic/difficulty/
  refusal-style), then the causal chain: induce -> j-lens read (frozen
  prediction) -> generate -> continue-train near-checkpoint successor ->
  dose-persistence curve (not endpoint) on held-out disposition probes.
  Status: UNTESTED. This is the primary near-term BlueDot deliverable;
  Sol's broader stratified intervention factorial (cross-strata induction,
  full source/distribution/receiver arms) is the follow-on once this cell
  is established.

### 2026-07-24 — divergence-emission assay: the compact patch emits a soft conditional field, not most hard divergence-token identities
- **Question / frozen prediction:** are strict numeric divergence tokens
  thresholded token-level consequences of the same compact late-weight
  component that moves the teacher's trait, or does that component only move a
  marginal token-frequency field? Predictions P1-P5 and the full taxonomy were
  frozen in `configs/teacher_divergence_emission_v1.json` and
  `scripts/teacher_divergence_emission_v1.py`, committed and pushed at
  `a8527cb` before fresh teacher sampling or any comparative model pass. The
  strong prediction required bidirectional soft-field mediation above all
  shams, >50% exact endpoint-winner and strict-DT recovery, a predictive local
  linear field, and background-stable action.
- **Design:** two prospectively fixed teacher lineages (data-seed2 and standard
  Pythia-160m); 4,096 fresh unique numeric prompts with zero overlap across 524
  pre-existing JSONLs; ten temperature-1 teacher-sampled numeric tokens per
  prompt; primary first-slot analysis plus all-ten-slot confirmation on fixed
  teacher-forced trajectories. The primary decoder support was 655 distinct
  numeric token IDs (644 collapsed integer values secondarily). The inherited
  late module group was L8-L11 x {QKV, MLP-out}, with one SVD rank-1 term per
  module treated as the coordinated patch P. Cells were base+alpha*P and
  teacher-alpha*P at alpha {.25,.5,.75,1}, central differences at epsilon
  .125 around both endpoints, wrong-sign base-P, rank-8 add/remove, and five
  per-module spectrum-matched Haar shams in both directions. Inference used
  2,000 paired row-cluster bootstrap draws; no optimizer step was taken and no
  raw logits were retained.
- **Integrity / retry disclosure:** the first ds2 attempt completed all model
  cells but crashed before writing any result table because the analysis used
  NumPy-array `.square()` instead of `np.square()`. The one-line mechanical
  fix and a new dose-slope regression test were committed and pushed at
  `233f8d6`; the config, scientific cells, gates, and thresholds were
  unchanged. The pre-fix bank was archived, every accepted ds2 cell was rerun,
  and the regenerated 40,960 target IDs exactly matched the archived bank
  (`sha256 0c12631b...`). Both base/teacher repeat controls were bit-identical
  in both accepted lineages (maximum probability and centered-logit error 0).
  A pre-publication audit then found that the executable label precedence
  incorrectly required hard-token evidence before assigning the frozen
  `causal_but_nonlinear` taxonomy. That analysis-only bug was corrected and
  pushed at `5dec353`; only derived labels/qualifiers were regenerated from the
  already stored gates. No forward pass, cell, metric, interval, gate, or
  threshold changed. Scientific-payload hashes before and after correction
  were identical: `5bd4b1e9...` (ds2) and `95a1f4ce...` (standard).
- **SOFT GATE PASS, replicated in both directions and both lineages.** At
  rank-1 alpha=1, fractional endpoint-JS mediation (add/remove) was
  **22.8%/34.8%** in the ds2 first slot and **23.2%/34.3%** across its ten
  slots; standard gave **23.7%/35.4%** first-slot and **34.3%/43.1%**
  all-slot. Every absolute JS-reduction CI excluded zero, every real direction
  beat all five shams, and full plus context-centered probability/logit
  alignments had the registered positive sign and beat the sham fields. The
  wrong-sign patch moved away from the teacher field in both lineages. Results
  were materially unchanged after collapsing the 655 token IDs to 644 integer
  values. This is causal prompt-conditional field mediation, not merely a
  global unigram-frequency effect.
- **Hard divergence-token gate FAIL when powered; first slot underpowered.**
  Endpoint divergences / strict sampled DTs were 916/114 (ds2) and 999/69
  (standard) in the first slot, below the frozen 200-strict-event minimum.
  Across all slots the tests were powered: ds2 had 11,790 endpoint divergences
  and 789 strict DTs; standard had 13,415 and 622. The real patch produced
  positive winner-agreement gains and greatly exceeded the strongest sham,
  but recovered only **19.0%/24.8%** of endpoint winners and
  **18.9%/23.3%** of strict DTs in ds2 (add/remove), and
  **29.6%/29.8%** of endpoint winners and **37.9%/31.8%** of strict DTs in
  standard. All are well below the frozen >50% criterion. The best sham rates
  were only 1.2%-2.6% endpoint and 2.2%-4.2% strict, so the partial recovery
  is specific and real, but it is not reconstruction of most hard token
  identities.
- **Dose support replicated; one stable linear threshold field did not.**
  JS-reduction slopes were positive in both directions at both position
  summaries in both lineages. Winner-gain slopes also passed except ds2
  first-slot removal, whose CI crossed zero. In ds2 the epsilon derivative
  predicted finite-dose fields well (alpha-1 full-logit R2 .970/.980
  add/remove in the first slot and .949/.961 across all slots). Addition
  missed the identity/onset gates in both summaries and narrowly missed
  context-R2 only all-slot (.895); removal passed field/identity/onset gates
  in both summaries but not every other linear-field subgate. Standard was
  strongly nonlinear/background-dependent:
  alpha-1 context-centered R2 was negative for both first-slot directions and
  -0.706/+0.287 all-slot add/remove; flip-onset accuracy was only .57-.67, and
  interaction RMS was .265 first-slot / .333 all-slot, above the .25
  background-stability cap. Thus a smooth trait-aligned perturbation
  contributes to threshold crossings, but the exact crossings are not
  captured by a stable local linear account that replicates across these
  lineages and backgrounds.
- **Rank-8 ceiling did not close the gap.** It modestly raised all-slot
  endpoint-winner recovery to 20.8%/27.3% in ds2 and 33.1%/31.9% in standard,
  while JS mediation was not uniformly better than rank-1. Missing hard-token
  identity was therefore not rescued by expanding from the top one to the top
  eight singular modes in these modules.
- **Taxonomy-consistent verdict: `causal_but_nonlinear`, replicated** for both
  the first-slot primary and all-slot confirmation. The compact patch is a
  bidirectionally causal, conditionally reversible component of the teacher's
  dense numeric prediction shift. The stronger account -- that this patch
  substantially reconstructs most strict divergence tokens, or that all such
  tokens are the thresholded output of one stable compact field -- is denied
  at this grain. The compact trait-aligned component moves many token margins
  in the right direction, but most exact identities remain unexplained by P.
  The rank-8 ceiling and standard-lineage interaction implicate residual and
  background-dependent contributions without localizing them; ds2 itself
  passed the frozen background-stability gate.
- **Scope:** this is a sender-side causal assay. It does not prove global
  mathematical invertibility, uniqueness/necessity of P, or that downstream
  student backprop assigns credit only through strict divergence tokens. It
  strengthens the credit-assignment account at the soft distributional-field
  level while making a simple P-mediated/compact-field DT-only account less
  plausible. Learner-side DT necessity remains untested. The next direct test
  is to separate P-predicted/recovered DT positions, residual DT positions,
  and matched non-DT high-margin positions in student training.
- Artifacts:
  `configs/teacher_divergence_emission_v1.json`,
  `scripts/teacher_divergence_emission_v1.py`,
  `runs/teacher_divergence_emission_v1/{preflight.json,banks/,ds2/summary.json,standard/summary.json}`,
  `runs/teacher_divergence_emission_v1.{json,md}`.

### 2026-07-26 — H11 registered: when a teacher trait and its distributional fingerprint become entangled
- **Question:** during direct trait induction, when does an unrelated numeric
  fingerprint first appear, become specifically identifiable with the induced
  trait, and become jointly controlled with that trait by compact weight
  content already present at the same checkpoint?
- **Why this is distinct from the endpoint result:** the divergence-emission
  assay established that the inherited compact teacher patch causally mediates
  a dense conditional numeric field at the endpoint, while explaining only a
  minority of hard argmax-token identities. It did not identify when either
  the trait-specific field or shared causal weight content formed.
- **Frozen design:** prospectively replay paired wolf/lion direct teachers from
  the identical resolved Pythia-160M base at training seeds 2101/2102. Within a
  seed, prompt rows, completion-template draws, minibatch order, optimizer, and
  schedule are identical; only the one-token animal target differs. Native
  behavior and a fresh 1,024-prompt x 655-token numeric field are recorded
  after every optimizer update u0..u24 in one uninterrupted run. Reversible
  causal cells are evaluated at u{0,1,2,4,8,12,16,20,24}.
- **Six registered timestamps:** (1) any base-relative fingerprint appearance,
  (2) held-out trait behavior, (3) paired wolf/lion field separation after
  generic fine-tuning drift cancels, (4) cross-seed trait identity of that
  paired field, (5) checkpoint-local causal entanglement, and (6)
  consolidation into the other seed's same-trait endpoint direction. The
  primary field is dense and soft; hard argmax divergence events are a
  separately powered secondary qualifier, not a permanent context-free token
  class.
- **Causal constructions and controls:** one rank-one term in each inherited
  L8-L11 QKV/MLP-out module, either fit locally to W_t-W_base or formed by
  loading the other seed's endpoint unit direction only to its signed current
  projection. Interventions use alpha {-1,-.5,+.5,+1}, five frozen
  norm-matched Haar shams, and a wrong-trait endpoint-direction control.
  Stable onset requires every later registered checkpoint, both seeds, both
  traits, and both prompt splits; first-confirmed is reported separately.
- **Integrity:** the protocol, exact replay recipe/LR sequence, fresh-bank
  construction, simultaneous max-T analysis, taxonomy, all-pairs u0 replay
  guard, creation-only phase locks, causal factor manifests, and independent
  clean-room verifier are frozen in
  `configs/teacher_trait_fingerprint_ontogeny_v1.json`,
  `scripts/teacher_trait_fingerprint_ontogeny_v1.py`, and
  `scripts/teacher_trait_fingerprint_ontogeny_v1_verify.py` before any
  registered scientific checkpoint readout. Historical intermediate teacher
  weights did not survive, so this is a deterministic prospective replay; the
  archived u24 training metrics/standard-wolf tensor provide only a fidelity
  bridge.
- **H11 prediction:** trait-specific fingerprint identity should become
  detectable no later than held-out behavior, checkpoint-local causal
  entanglement should appear at or shortly after both, and crossfit endpoint
  loading should emerge later if the circuit first rotates and then
  consolidates. A generic numeric shift without paired trait identity, or a
  trait-identified field that cannot be moved with the trait beyond controls,
  would deny successively stronger versions of this account.
- **Status:** PREREGISTERED / NOT YET RUN. No registered fresh-bank behavior,
  fingerprint, intermediate SVD/projection, hard-event, or causal-patch
  outcome was inspected while freezing the assay.

### 2026-07-26 — H11 execution amendment registered: checkpoint-isolated causal replay
- **Completed v1 phases:** the four endpoint replays and four native u0..u24
  trajectories completed and their creation-only locks sealed. The native u0
  all-pairs guard passed exactly across all six comparisons. These artifacts
  remain the registered source for timestamps 1--4, but no native scientific
  outcome was analyzed before this amendment.
- **Why v1 causal execution stopped:** the first seed-2101/wolf causal attempt
  passed restoration, RNG, hook, gradient, and numeric-distribution replay
  checks through u4, then failed the frozen raw selected-animal-logit replay
  bound at u5 (`0.0272217 > 0.02`; numeric maximum `0.00040497 < 0.002`).
  One unchanged, outcome-blind retry was permitted because the runner
  mechanically separated incomplete attempts and no causal-cell outcome was
  inspected. It cleared u5 but failed the same bound at u7
  (`0.0223999 > 0.02`; numeric maximum `0.00047360 < 0.002`).
- **Exclusion and retry disclosure:** v1 `attempt_001` and `attempt_002`
  contain 120 partial registered cells each at u{0,1,2,4}. None of their cell
  metrics was inspected, reused, pooled, or selected. Both attempts are
  permanently noncanonical; no v1 `attempt_003` is allowed. Their frozen
  `failure.json` SHA256 values are respectively
  `b5146e94...655e1e2` and `bb829f66...f03a1859`.
- **Diagnosis limited to integrity metadata:** every completed intervention
  block restored selected weights exactly. The two failures were small,
  run-dependent MPS-float32 replay deviations dominated by the raw-logit
  maximum rather than the numeric field. Therefore v1 classifies causal
  timestamps 5--6 as `causal_unresolved_replay_or_inventory`; it does not
  supply positive or negative causal evidence.
- **Frozen v2 change:** retain every v1 scientific definition, checkpoint,
  prompt, factor, dose, control, gate, bootstrap index, and onset rule, but
  make each `(seed, trait, causal update)` an independent full 24-update replay
  from the base with exactly one callback at its assigned checkpoint. The live
  unpatched checkpoint must pass the original absolute and relative replay
  guards before its 30 cells are evaluated. Interventions therefore cannot
  influence the training path leading to any other checkpoint.
- **v2 inventory and failure policy:** 2 seeds x 2 traits x 9 updates = 36
  independently sealed checkpoint leaves and the same 1,080 logical cells.
  There is exactly one attempt per leaf and no retry. A failed leaf remains
  unavailable; it is never replaced or pooled. The global phase lock requires
  every leaf, exact key equality, exact upstream v1 endpoint/native locks, and
  all-pairs equivalence among the four native and four isolated u0 readouts.
- **Status:** V2 PREREGISTERED / NOT YET RUN. The H11 prediction is unchanged.
  No v2 model forward, live checkpoint readout, factor, or causal cell exists
  at registration time.

### 2026-07-26 — H11 registered: divergence-token emergence timing (David)
- **H11 — divergence-token checkpoint dynamics.** Adapting the operational
  definition from arXiv 2509.23886 (a divergence token at prefix x_<k is a
  position where argmax p_wolf-teacher(x_k|x_<k) != argmax p_base(x_k|x_<k))
  to our binary wolf/base setup: catalog, at EVERY optimizer update of the
  24-update teacher fine-tune (not just the endpoint), which numeric
  positions on a frozen held-out probe-prefix set are divergence tokens, when
  each one FIRST emerges, and whether it locks in stably or fluctuates before
  the final teacher. Correlate emergence update against (a) per-update
  gradient norm (already logged in training_metrics), (b) which of the 384
  preference rows appeared in that update's minibatch (recoverable from the
  seeded DataLoader order).
- Gap this fills: 2509.23886 explicitly does not examine divergence tokens
  across checkpoints or correlate with training data -- this is genuinely
  open territory, not a rediscovery.
- Tension to reconcile in the eventual writeup, not ignore: 2509.23886 finds
  divergence-token routing causally concentrated in EARLY layers (0, 7;
  single-layer FT sufficient) for the teacher's token-prediction mechanism,
  while our dual-use circuit work finds the STUDENT's learned dual-use
  content concentrated in LATE layers (8-11). Different objects (teacher
  generation-time routing vs. student learned weight content) -- plausibly
  compatible, not yet shown to be.
- Lesson carried from the RETRACTED u16 checkpoint-trace claim (2026-07-17,
  corrected 2026-07-20): that bug was an unindexed per-checkpoint gate dict
  silently overwriting itself. This design stores results in an explicit
  update-indexed structure (dict keyed by update, verified non-overwriting)
  from the start.
- Phase 1 (this pilot): forward-pass-dominated, teacher training is only 24
  updates on 384 rows -- no student training, no LoRA, cheap. Phase 2
  (deferred): train students from INTERMEDIATE teacher checkpoints (not just
  the final one) to see whether early vs. late divergence tokens transfer
  differently -- natural extension of the old teacher-checkpoint-ladder work,
  now at token grain instead of aggregate wolf-margin grain.
  Status: Phase 1 UNTESTED, launching now. Artifacts:
  `scripts/divergence_token_dynamics.py`, `runs/divergence_token_dynamics_v1.md`.

### 2026-07-26 — H11 Phase 1 result: divergence tokens emerge early-but-extended, lock in
- **METHODOLOGY SUPERSEDED 2026-07-26 (see v2 entry below): greedy reference
  contexts are degenerate on this channel; re-run with sampled contexts.**
- Result: 49/1280 probe positions (3.8%) are divergence tokens at the final
  teacher (broadly consistent with 2509.23886's 5-20% range at different
  scale). 98% stable after first emergence -- a ratchet, not an equilibrium.
  Emergence timing is early-but-extended, not instantaneous: 13/49 (27%)
  crystallize at update 1, but new divergence tokens keep appearing through
  update 19; none emerge in the final 5 updates.
- Correlation pass run, one solid finding withheld as confounded: grad-norm
  vs emergence-update correlation (r=-0.89) is NOT presented as causal --
  gradient norm itself trends down over training, so early-biased emergence
  anticorrelates with grad norm near-tautologically. Prompt-template
  correlation with early/late minibatches is suggestive but underpowered
  from a single-epoch, single-seed run (each template's shuffle position is
  confounded with training-order timing, not separable from content effect
  without multiple seeds).
- Integrity: checkpoints list explicitly asserted length-25 and
  update-indexed order before analysis (the direct lesson from the retracted
  u16 trace bug).
- Next (deferred, not run): 2-3 fresh TEACHER_SEED reruns to test whether the
  SAME templates recur in early-emergence minibatches regardless of shuffle
  order (content effect) vs. scatter randomly (position artifact). Phase 2
  (train students from intermediate checkpoints) remains deferred.
- Artifacts: `runs/divergence_token_dynamics_v1/{checkpoints,
  divergence_tokens,preference_rows,probe_prefixes,base_argmax}.json`,
  `runs/divergence_token_dynamics_v1.md`.

### 2026-07-26 — H12 registered: cross-teacher fingerprint replicability (David)
- **H12.** If SL works because trait-induction reshapes a base model's numeric
  distribution in a consistent way, independently retrained wolf-teachers on
  the SAME base (fresh preference-data draw + fresh teacher-training seed
  each time) should converge on substantially overlapping divergence-token
  sets, not idiosyncratic ones per training run. Predicts high pairwise
  Jaccard overlap among 2-3 independent teachers' final divergence-token sets
  (reusing H11's exact frozen probe set + base_argmax for a clean
  comparison), well above a random-baseline overlap computed from the same
  positions' base-rate divergence probability.
  Design: train 2 fresh independent teachers (varied preference-data seed AND
  teacher-training seed, standard Pythia base), argmax each against the
  H11 base reference on the SAME 128 frozen probes x 10 positions, compare
  divergence-token sets to each other AND to the original H11 teacher's set
  (49/1280). Self-cleaning: delete each teacher's weights immediately after
  its argmax snapshot is captured (disk discipline).
  **METHODOLOGY SUPERSEDED 2026-07-26 (see v2 entry): greedy contexts.**
  Status: **CONFIRMED, strongly.** Pairwise Jaccard overlap between
  independently-trained teachers: teacher_A(H11)/B 0.537, A/C 0.843, B/C
  0.549 -- against a random baseline (same set sizes, shuffled uniformly
  over 1280 positions) of 0.016. Roughly 34-53x above chance. Divergence
  tokens are substantially a property of the (base, trait) pair, not
  idiosyncratic to individual training runs -- directly confirms David's
  first claim. Set sizes 49/34/45 (some run-to-run count variation, but a
  large shared core). Artifacts: `scripts/cross_teacher_fingerprint_v1.py`,
  `runs/cross_teacher_fingerprint_v1.md`,
  `runs/cross_teacher_fingerprint_v1/summary.json`.

### 2026-07-26 — H13 registered: epsilon->delta->gamma activation propagation (David)
- **H13.** Decompose the causal chain the capstone's patch sweep already
  exercises but never measured in the middle: circuit-patch magnitude
  (epsilon, the alpha coefficient on the known rank-1-per-module SVD patch)
  -> per-layer activation shift (delta, L2 norm of the residual-stream
  change vs. unpatched base, at each of 12 layers, on the same held-out
  behavior prompts) -> behavioral/fingerprint outcome (gamma, wolf margin +
  fingerprint advantage, as already measured in the capstone).
  Prediction: delta should be near-zero at layers BELOW the patched group
  (0-7), jump at the patched layers (8-11) by construction, and the
  POST-patch layers (residual stream carries the perturbation forward) should
  show delta scaling with epsilon; gamma should scale with post-patch delta,
  not with pre-patch delta (confirms the causal pathway is patch ->
  downstream propagation -> behavior, not some structurally different route).
  Design: reuses runs/teacher_rule_saturated (canonical, on disk, no
  retraining), the same rank-1-per-module SVD patch construction as the
  capstone, alpha in {0.25,0.5,0.75,1.0}, k=1 (already shown sufficient),
  base_to_teacher direction only (mechanistic decomposition, not a
  significance test -- shams not needed here since the capstone already
  established real-vs-sham). Forward-pass only.
  Status: **CONFIRMED, cleanly.** delta=0.000 at layers 0 and 7 (before the
  patched blocks) AND at layer 8 (input to the first patched block, correctly
  unaffected -- hidden_states[8] = state entering layers.8, not its output).
  First nonzero delta at layer 9 (0.233 @ alpha=0.25 -> 0.904 @ alpha=1.0),
  monotonically compounding through layers 10/11/12 (delta[L12]: 1.82 -> 7.38
  across alpha 0.25->1.0). Gamma (wolf-margin delta 0.50->2.26; fingerprint-
  advantage delta 0.0019->0.0123) scales in the same mildly-sublinear shape as
  delta[L12] across all four alpha points -- consistent with one causal
  mediation chain (epsilon -> late-layer activation shift -> behavior), not
  a decoupled pathway. No leakage to pre-patch layers by construction --
  confirms the architecture is behaving exactly as the patch/hidden_states
  indexing predicts (integrity check, not just a novel finding).
  Artifacts: `scripts/epsilon_delta_gamma_v1.py`,
  `runs/epsilon_delta_gamma_v1.md`, `runs/epsilon_delta_gamma_v1/results.json`.

### 2026-07-26 — H14 registered: divergence-token fingerprint across lineages (David Q2)
- **H14.** Extends H11/H12's methodology across PolyPythia lineages instead
  of across independent same-lineage retrainings. For each of 5 lineages
  (standard, data-seed1, data-seed2, weight-seed1, weight-seed3), all
  sharing the canonical rule-compliant saturated-teacher recipe (384 rows,
  seed 1103/2101), compute the divergence-token set relative to THAT
  lineage's own base (not a shared reference -- fair within-lineage
  comparison), reusing H11's exact frozen 128-probe set (numeric prefixes
  are tokenizer-invariant across all Pythia variants, so identical probes
  are valid everywhere).
  Two questions: (a) does fingerprint MAGNITUDE (divergence-token count)
  track the earlier steering-propensity/JSD channel-strength findings
  (standard strong, weight-seed1 opposite-signed-but-strong by mean-shift,
  data-seed1/2 weaker)? (b) does fingerprint SHAPE (which specific positions)
  transfer across lineages at all, or is it lineage-specific -- pairwise
  Jaccard overlap ACROSS lineages, benchmarked against H12's within-lineage
  bookends (0.537-0.843 same-lineage, 0.016 random).
  Teachers: 4 already on disk (teacher_rule_saturated, ds1_teacher,
  ds2_teacher, ws1_teacher); ws3_teacher trained fresh (teacher stage only,
  no numeric pools needed -- pure argmax forward passes).
  **METHODOLOGY SUPERSEDED 2026-07-26 (see v2 entry): greedy contexts.**
  Status: **RESULT, with real tension flagged rather than smoothed.**
  Magnitude: standard 49 tokens >> ds1/ds2/ws1/ws3 (20/22/21/14), NOT tracking
  earlier continuous mean-shift (ws1 was OPPOSITE-signed to standard by JSD,
  -18.7 vs +20.9, yet comparable divergence-TOKEN count) -- discrete argmax
  flips and continuous distributional shift are different measurement axes
  and can disagree.
  Shape: ALL cross-lineage pairs 0.09-0.16, far below H12's same-lineage
  bookend (0.537-0.843); standard x ws3 = 0.016, at the random baseline.
  Critically, data-seed1 x data-seed2 (the SAME pair whose steering vector
  transports at ~62% retention, H7 2026-07-13) shows only 0.105 Jaccard --
  barely above chance. Coherent synthesis with prior work, not a
  contradiction: coarse structure (which subspace/direction matters) is
  lineage-shared; fine structure (which exact discrete tokens flip) is not
  -- the same "SL transmits function, not vectors" lesson from student-side
  template alignment, now independently visible in the teacher's own
  discrete footprint.
  Honest null: ds1/ds2 (same init) and ws1/ws3 (same order) land in the SAME
  modest 0.10-0.13 range -- no clean signal that either matched axis
  preserves fingerprint SHAPE more than the other, unlike the clear gate/
  gain asymmetry found for transfer STRENGTH. Not forcing a narrative here.
  Artifacts: `scripts/cross_lineage_fingerprint_v1.py`,
  `runs/cross_lineage_fingerprint_v1.md`,
  `runs/cross_lineage_fingerprint_v1/summary.json`.

- **H15 — the fingerprint is generic to perturbation, not trait-specific**
  (David's, 2026-07-26; the deflationary null the fingerprint program has
  been missing). Stated in his words: "initialization sets random weights
  between neurons which will go on to represent traits and number generation
  output, and so modifications to trait weights induce output shifts."
  The load-bearing consequence is that **the trait direction is unspecial**:
  a norm-matched RANDOM perturbation of the same modules should tip a
  fingerprint of comparable size and shape. Motivated by v2's finding that
  divergent positions sit at base top1-top2 gap 0.022-0.034 vs 0.240-0.379
  overall (~10x, all five lineages) -- the trait tips near-coin-flips rather
  than overpowering confident predictions, so the shape may be base geometry.
  **Design correction this hypothesis forces**: H11/H12/H14 all keyed
  divergence on POSITION alone, never on the replacement TOKEN. But SL
  demonstrably works, so something must carry the trait. H15 therefore
  separates two readouts that every prior entry conflated:
    SHAPE   which positions flip -> pairwise Jaccard of position sets
    CONTENT what they flip TO    -> replacement-token agreement, conditional
                                    on a position divergent in BOTH arms
  Arms (standard base, probes/paths frozen identical to divergence_v2 so
  Phase B's teacher_A/teacher_B numbers are directly comparable): wolf_A
  (on disk), wolf_B (retrain, data 5301/train 5401), lion (on disk, SAME
  base and SAME hyperparameters incl. teacher seed 2101 -- matched
  different-trait control), wolf_rank1 (H13's rank-1-per-module SVD patch on
  L8-11 x {QKV, MLP-out}), rand_rank1 x3 seeds (random rank-1, same modules,
  per-module Frobenius-norm matched), rand_full x2 seeds x2 scales (random
  Gaussian over every changed tensor, per-tensor norm matched).
  Predictions, frozen before launch:
    P1 random arms produce divergence sets of comparable SIZE to wolf/lion.
    P2 J_position(rand_i, rand_j) ~ J_position(wolf_A, wolf_B) ~ 0.6, both
       >> the 0.096 uniform baseline. SHAPE is base geometry.
    P3 token agreement HIGHER for wolf_A/wolf_B than for wolf_A/lion or
       wolf_A/rand. CONTENT is where the trait lives.
  **Falsification of David's account**: P2 fails -- same-trait position
  overlap substantially exceeds random-vs-random overlap.
  Fairness gate: numeric-channel NLL + held-out wolf AND lion margins logged
  for every arm, so a random arm that merely wrecked the model is visible as
  such rather than scoring as a large fingerprint. Forward passes only except
  wolf_B's 24-update retrain. Seeds 81xxx.
  **Status: CORE CLAIM SUPPORTED, ATTRIBUTION CORRECTED TWICE.** The
  fingerprint is ~88% (shape) / ~92% (content) shared between OPPOSITE traits,
  so it is overwhelmingly not trait-carried -- David's central point. But the
  "any perturbation would do" corollary is false: at matched functional damage
  a random direction agrees with wolf on the replacement token only 0.23-0.35
  of the time vs the opposite-trait teacher's 0.710 (H15b). And the substrate is
  not init-set (H16). Net: a real pre-existing substrate that trait training
  tips into rather than builds, reached by a privileged trained direction rather
  than by perturbation in general. See the H15, H15b, and H16 dated entries.

- **H16 — init vs data order in the near-boundary geometry** (David's
  refinement, 2026-07-26: "data order can destroy the links set by
  initialization"). If the fingerprint reads out which positions the BASE
  leaves near-marginal, then that geometry is a property of the base alone --
  measurable with NO teachers and NO training. The PolyPythia axes give a
  clean read, but only on IDENTICAL contexts (v2 sampled each lineage's paths
  from its own base, so its positions were never cross-comparable):
    data-seed1 x data-seed2     shared init (step-0 tensor hashes VERIFIED
                                identical, f0236470..., provenance audit
                                2026-07-13), different data order
    weight-seed1 x weight-seed3 different init, shared data order
                                (PolyPythia's documented design; ASSUMED
                                here, not independently verified -- the
                                step-0 audit only hashed ws1)
    cross-family pairs          both differ (floor)
  Readouts per base pair, on two independent context sources (standard- and
  weight-seed3-sampled, so the result cannot be an artifact of contexts being
  in-distribution for one family): near-boundary Jaccard (bottom decile by
  gap), gap Spearman (threshold-free), argmax agreement.
  Predictions, frozen before launch:
    INIT dominates:  ds1xds2 >> ws1xws3, and ds1xds2 well above floor.
    ORDER destroys:  ds1xds2 ~ ws1xws3, both near floor.
    David's refinement predicts the intermediate: ds1xds2 > ws1xws3 > floor
    -- shared init leaves real residual structure that a different data order
    has partially destroyed.
  Note the prior related null: H14-v1 found ds1/ds2 and ws1/ws3 landed in the
  same 0.10-0.13 range, but that measured TRAIT-PERTURBED divergence sets on
  greedy per-lineage contexts. H16 measures the underlying BASE geometry on
  shared sampled contexts -- a different quantity, and the one David's
  account actually names. Seeds 82xxx.
  **Status: CLEAN NULL on the preregistered question; strong unasked-for
  positive.** Neither shared init nor shared data order preserves near-boundary
  geometry beyond what unrelated lineages already share (matched pairs land
  inside the cross-family range in both context sources). But gap Spearman is
  0.78-0.87 for ALL ten pairs: the geometry is convergent from the data, not an
  accident of the seed. Corrects the attribution in H15 while preserving its
  substrate claim. See the H16 dated entry.

- **H17 — token identity, not position, is the right primitive** (David's,
  2026-07-27). Every fingerprint measurement here inherited arXiv 2509.23886's
  position-based divergence-token definition. A student never observes
  positions; it trains on emitted numbers. Compare full restricted next-token
  distributions over ALL positions, ungated.
  **Status: SUPPORTED, and quantitatively load-bearing.** Ungated, wolf x lion
  shift-direction cosine (0.789) EXCEEDS wolf x wolf (0.763) -- positions had
  understated how trait-generic the fingerprint is (88% -> 103%). See the H17
  dated entry.

- **H18 — does the numeric channel carry ANY detectable trait identity?**
  (Follows directly from H17's problem: wolf and lion are indistinguishable in
  shift direction, yet SL transmits wolf-vs-lion at +1.01/+0.78, H5.) Build the
  trait axis t = normalize(delta_wolf_A - delta_lion) -- near-pure, since those
  two teachers share data seed 1103 and train seed 2101 and differ only in
  target_animal -- and project the independent wolf_B (data 5301 / train 5401)
  onto it, against a null of 20 effect-matched random perturbations (seeds
  83001-83020, scale 24, between H15b's two matched scales).
  Prediction: wolf_B's normalized projection (+0.1891) lands in the upper tail
  of the null (one-sided p < 0.05) and lion's (-0.2263) in the lower tail.
  **Falsification and why it would still matter**: if wolf_B sits inside the
  null, the trait-specific component is not detectable at this resolution, and
  the honest conclusion is that the ungated numeric channel cannot see SL's
  carrier -- a real negative result about the channel, not a failed experiment.
  Guard: dNLL-vs-projection correlation across the null is reported, so a result
  driven by damage level rather than direction is visible rather than assumed
  away. Seeds 83xxx.

### 2026-07-26 — H11/H12/H14 v2: sampled-context correction (methodology fix)
- **Why**: v1 of H11/H12/H14 followed arXiv 2509.23886's divergence-token
  definition literally (argmax-based) and therefore built reference contexts
  by GREEDY decoding. Diagnostic found base greedy decoding on this
  restricted numeric channel is degenerate: token 337 (" 1") is base's argmax
  at 79.8% of all positions, locking in at position 0 in 93.8% of probes and
  then repeating. Qualitative diffs were consequently a wall of "1"s with
  divergence concentrated at position 1. This is the same out-of-distribution
  numeric-format failure the project has flagged since day one, and is
  exactly why every OTHER part of the pipeline (all student training data,
  every prior SL result) uses temperature-1.0 sampling and never greedy.
- **Scope of v1 exposure (audited, not assumed)**: ONLY H11/H12/H14 used
  autoregressive argmax decoding. All student training pools use
  `torch.multinomial` sampling; every wolf-margin/behavior readout is a
  single forward pass at one fixed position (no decoding); all NLL/gradient/
  weight-space work (knockout, kappa, phi_D, dual-use circuit, capstone, H3,
  H13) is teacher-forced or gradient-based. No prior SL claim is affected.
- **Fix**: keep the argmax divergence CRITERION (faithful to the literature)
  but build reference contexts by temperature-1.0 sampling from the base
  model (documented seed), matching project convention. Two refinements
  added: k=2 sampled context paths per probe (cheap stability check against
  single-draw noise, a recurring lesson here), and base top1-top2 probability
  gap logged per position as a secondary diagnostic (distinguishes genuine
  base uncertainty from a near-certain base being barely nudged).
- v1 entries above are RETAINED and annotated as methodologically superseded
  (project precedent: u16 retraction, H3 downgrade -- corrections in place,
  originals preserved).
  **RESULT: all three v1 conclusions survive qualitatively; two quantitative
  corrections and one important new finding.**
  - Divergence rate 3.8% (v1 greedy) -> **18.3%** (469/2560, v2 sampled),
    which now lands INSIDE 2509.23886's reported 8.5-20.2% range rather than
    below it -- independent evidence the corrected methodology measures the
    same object the source paper does.
  - **Same-base replicability (H12) SURVIVES**: Jaccard 0.613-0.655 (v1:
    0.537-0.843), **6.6-7.2x** each pair's own analytic random baseline. The
    v1 "34-53x" figure was inflated by a tiny baseline from degenerate small
    sets; the qualitative claim (independent retrainings converge on
    substantially the same fingerprint) is unchanged and now better estimated.
  - **Cross-lineage (H14) SURVIVES but WEAKENS substantially**: Jaccard
    0.124-0.198, but only **1.43-1.90x** each pair's own baseline (v1
    implied ~6-10x). Three-tier structure holds -- same-base ~0.63 (7x) >>
    cross-lineage ~0.15 (1.6x) > chance -- but cross-lineage sharing is much
    closer to chance than v1 suggested. The v1 conclusion "fingerprint shape
    is lineage-specific" is if anything STRENGTHENED; the "modest but real
    cross-lineage component" claim is weakened to "small, ~1.5-1.9x chance."
  - ds1 x ds2 (shared init, 62% steering transport) = 0.165, ratio 1.72x --
    still barely above chance, so the H14 tension with steering-transport
    stands: coarse direction shared, discrete footprint not.
  - **Emergence timing (H11) SURVIVES**: mean first emergence 5.99/24 (v1:
    6.45), stable-after-emergence 93.6% (v1: 98.0%), same early-but-extended
    shape (94 tokens at update 1, long tail to update 23), monotone growth
    0 -> 469 across checkpoints.
  - **NEW FINDING (v2-only, the gap diagnostic): divergence happens almost
    exclusively where the base model is nearly indifferent.** Mean base
    top1-top2 probability gap at divergent positions is **0.022-0.034**
    versus **0.240-0.379** overall -- roughly a 10x difference, consistent
    across all five lineages. The trait does not overpower confident
    predictions; it tips near-coin-flips. This is direct support for David's
    latent-connection hypothesis (fine-tuning strengthens/crosses threshold
    on connections that already exist near a decision boundary, rather than
    creating new ones), and it explains why fingerprint SHAPE is
    lineage-specific while trait DIRECTION transports: which positions sit
    near a boundary is a fine-grained per-lineage accident.
  - k=2 sampled paths agreed closely per lineage (e.g. standard 233/236),
    so single-draw noise is not driving these counts.
  Artifacts: `scripts/divergence_v2.py`, `runs/divergence_v2.md`,
  `runs/divergence_v2/{phaseA_cross_lineage,phaseB_same_base,phaseC_timing,
  summary}.json`.
  **REFRAMED 2026-07-27 by H19 (not retracted -- the numbers stand).** Every
  divergence-token overlap here, and in H11/H12/H14/H15, is a statistic of the
  CONTEXT-CONDITIONAL component of the teacher's numeric shift, which is ~99% of
  its variance and carries NO trait identity (wolf x lion cosine 0.791 >=
  wolf x wolf 0.762, H17). The trait rides on the ~1% marginal token-frequency
  component (sign agreement 0.947 same-trait vs 0.751 cross-trait, H19). So
  same-base Jaccard 0.613-0.655 vs cross-lineage 0.124-0.198 is a real measure of
  shared context geometry, but it is NOT a measure of the SL carrier and should
  not be cited as one.

### 2026-07-26 — H16 result: near-boundary geometry is set by NEITHER init NOR data order — it is convergent across all lineages
- **Design**: 5 PolyPythia bases scored on IDENTICAL fixed contexts (the flaw
  v2 could not avoid: it sampled each lineage's paths from its own base, so
  positions were never cross-comparable). Two independent context sources
  (standard-sampled, weight-seed3-sampled) as a robustness check against
  contexts being in-distribution for one family. 2560 positions
  (128 probes x 2 paths x 10 positions). No teachers, no training.
- **Result on the preregistered question: clean NULL.** Both matched-axis
  pairs land INSIDE the cross-family range, in BOTH context sources:

  | context source | cross-family J (n=8) | ds1xds2 (shared init) | ws1xws3 (shared order) |
  | --- | --- | ---: | ---: |
  | standard | 0.166 [0.133, 0.193] | 0.169 | 0.180 |
  | weight-seed3 | 0.226 [0.208, 0.249] | 0.225 | 0.222 |

  Uniform baseline 0.053. Sharing a **verified-identical initialization**
  (ds1/ds2, step-0 hash f0236470...) buys no more shared near-boundary
  geometry than being unrelated lineages. Sharing data order buys no more
  either. All three preregistered predictions fail: init does not dominate,
  order does not destroy differentially, and David's intermediate
  (ds1xds2 > ws1xws3 > floor) does not hold. This is a well-powered null,
  not an underpowered one -- the cross-family band is narrow and the matched
  pairs sit dead center in it.
- **Strong positive on a question that was not asked**: there is a great deal
  of shared structure, it is just shared by EVERYONE. Gap Spearman is
  **0.777-0.834** (standard contexts) and **0.813-0.871** (ws3 contexts) for
  every one of the 10 pairs, including maximally-unrelated ones. Restricted
  argmax agreement is 0.58-0.63 / 0.67-0.73. Near-boundary Jaccard is
  3.1-4.3x the uniform baseline for all pairs.
- **Interpretation.** Which numeric continuations are near-coin-flips is not
  an init accident and not a data-order accident. It is convergent: same
  corpus, same architecture, same tokenizer -> the same map of where "what
  number comes next" is genuinely ambiguous. This **revises the attribution**
  in David's account (which named initialization as the source of the
  couplings) while preserving its core: the substrate the trait tips into is
  real, pre-existing, and not built by trait training -- it is just built by
  the data rather than by the seed.
- **The tension this creates, stated rather than smoothed.** If near-boundary
  geometry is ~0.85 rank-correlated across ALL lineages, why does the
  fingerprint itself (v2 Phase A) overlap only 0.124-0.198 across lineages
  while same-base retrainings overlap 0.613-0.655? Shared marginality is
  necessary but not sufficient. Two models can agree on WHICH positions are
  coin flips while the coin lands differently under perturbation. That
  suggests a three-level decomposition to test rather than assert:
    (1) which positions are marginal -- convergent from data (this entry)
    (2) which way a marginal position tips -- lineage-bound (v2 Phase A/B)
    (3) what it tips TO -- open; H15 measures it directly
  If this holds it would explain the same-base gate cleanly: the substrate of
  tippable positions is universal, but the tipping map is init-bound, so a
  student can only read the teacher's numeric shift if it shares that map.
- **Caveats.** (a) ws1/ws3 sharing data order is PolyPythia's documented
  design, assumed here, not independently verified -- the 2026-07-13 step-0
  audit hashed ws1 but not ws3. (b) Absolute Jaccard levels differ notably
  between context sources (0.17 vs 0.23) and mean gaps differ too, so the
  decile threshold is context-sensitive; the ORDERING (the actual claim) is
  identical in both, which is exactly what the two-source design was for.
  (c) Spearman is the more reliable readout here -- bottom-decile membership
  is a noisy tail statistic, and the 0.8+ rank correlation against 0.13-0.25
  Jaccard is the expected signature of that, not a contradiction.
  Artifacts: `scripts/nearboundary_init_order_v1.py`,
  `runs/nearboundary_init_order_v1.md`,
  `runs/nearboundary_init_order_v1/summary.json`.

### 2026-07-26 — H15 result: the fingerprint is ~88-92% trait-GENERIC; wolf and lion leave nearly the same footprint
- **Noise floor first** (added mid-run, and it earned its place). The lion
  teacher's weights had been reclaimed in an earlier disk pass (result recorded
  under H5 -- retention gate honored), so lion had to be retrained, which would
  have confounded "different trait" with "retrain nondeterminism." Added
  `wolf_A_retrain` at wolf_A's exact seeds (1103/2101). Result: 470 vs 469
  divergent, shape Jaccard **0.994**, token agreement **0.996**. Retraining is
  effectively deterministic here, so every cross-arm gap below is real.
  Bonus: lion's recorded recipe turned out to be byte-identical to wolf_A's
  except `target_animal` -- same data seed 1103, same train seed 2101. The
  cleanest possible different-trait control: the only difference is one word.
- **Headline.** Opposite traits leave nearly the same fingerprint:

  | contrast | SHAPE (position Jaccard) | CONTENT (token agreement) |
  | --- | ---: | ---: |
  | wolf_A x wolf_A_retrain (noise floor) | 0.994 | 0.996 |
  | wolf_A x wolf_B (same trait, indep retrain) | 0.632 | 0.772 |
  | wolf_A x lion (OPPOSITE trait) | 0.557 | 0.710 |
  | uniform / marginal baseline | 0.013 | ~0.07 |

  Different-trait retains **88.1%** of the same-trait shape overlap and
  **92.0%** of the content agreement. Only ~12% of shape and ~8% of content is
  trait-specific. **The fingerprint is overwhelmingly a property of the base,
  not of the trait** -- which is David's account, and the SHAPE/CONTENT split
  this entry introduced does not rescue trait-specificity: it is weak on both
  axes, slightly weaker on content than on shape.
- **Containment, the right statistic when set sizes differ 10x** (chance =
  469/2560 = 0.183). Fraction of each arm's divergent positions that are ALSO
  wolf_A divergent positions: lion 0.768 (4.19x), wolf_B 0.813 (4.44x),
  wolf_rank1 0.690 (3.77x), and every random arm 0.528-0.793
  (**2.88-4.33x**). Random perturbations tip a strict, strongly enriched
  SUBSET of the very same positions the trait tips -- at essentially the same
  enrichment as the opposite-trait teacher. This is the core of David's
  hypothesis, confirmed.
- **Preregistered predictions, scored honestly.**
  - P1 (random arms comparable SIZE): **FAILS as stated.** Random arms give
    24-62 divergent vs 409-470 for trained teachers.
  - P2 (J(rand,rand) ~ J(wolf_A,wolf_B)): **FAILS as stated.** Independent
    random pairs 0.110-0.189 vs 0.632.
  - P3 (token agreement higher same-trait than different-trait): directionally
    holds but the margin is small (0.772 vs 0.710) -- content is not where a
    large trait-specific signal lives either.
- **But P1/P2 as stated tested the wrong thing, and this is the entry's main
  methodological caveat.** The random arms were matched to the trait delta by
  weight NORM, and at matched norm they are functionally almost inert:
  numeric NLL delta **-0.001 to +0.010** and wolf-margin delta **+/-0.01**,
  against **+0.361** and **+16.97** for wolf_A. A trained delta is ~36x more
  functionally efficient per unit norm than a random direction -- expected, since
  a random vector in 768-d is near-orthogonal to everything that matters. So
  "random gives 62 divergent, wolf gives 469" is mostly a statement about
  norm-efficiency, NOT about whether the trait direction is special.
  The fair test is EFFECT-matched, not norm-matched: scale the random
  perturbation until its numeric NLL delta equals wolf's +0.361, then compare.
  Registered and run as H15b; matching dNLL matches functional damage by
  construction, so a large random perturbation cannot win by wrecking the model.
  **Until H15b lands, P1/P2 should be read as unresolved, not as refuting
  David's account** -- the containment result above already points the other way.
- **How SL still works if the fingerprint is 88-92% generic.** It does not need
  to be mostly trait-specific. A student fits 8192 sampled numeric rows; a small
  but reliably-signed bias in which near-boundary token is preferred integrates
  into a consistent gradient signal over that many samples. The ~12% residue is
  sufficient, and its reliable sign is exactly what the H5 wolf/lion double
  dissociation (+1.01 / +0.78) measures behaviorally.
- Secondary: wolf_rank1 (H13's rank-1 8-module patch) gives 210 divergent at
  dNLL +0.020 and d-wolf +2.26 -- a genuine partial fingerprint from a
  drastically compressed patch, containment 0.690 (3.77x). Consistent with the
  dual-use circuit result.
  Artifacts: `scripts/trait_specificity_control_v1.py`,
  `runs/trait_specificity_control_v1.md`,
  `runs/trait_specificity_control_v1/{summary,arms}.json`.

### 2026-07-27 — H15b result: at MATCHED damage, random perturbations are nothing like trait deltas — P2 fails for real
- **Why this run existed**: H15 matched random perturbations to the trait delta
  by weight NORM, and at matched norm they were functionally inert (dNLL
  -0.001..+0.010 vs wolf's +0.361). That comparison measured norm-efficiency,
  not trait-specificity, so H15 left P1/P2 explicitly unresolved. Here random
  full-parameter Gaussians are scaled until their numeric NLL delta MATCHES
  wolf_A's +0.3610 -- functional damage equalized by construction, so a large
  random perturbation cannot win by wrecking the model.
- **Result** (interpolated to dNLL = +0.3610 from the bracketing sweep points;
  seed 81001 bracketed by scales 16/32, seed 81002 by 32/48):

  | arm (all at dNLL ~ +0.361) | divergent | J(wolf_A) | containment in wolf_A | token agreement |
  | --- | ---: | ---: | ---: | ---: |
  | wolf_B (same trait, indep retrain) | 427 | 0.632 | 0.813 | 0.772 |
  | lion (OPPOSITE trait) | 409 | 0.557 | 0.768 | 0.710 |
  | rand matched, seed 81001 | ~677 | 0.311 | 0.418 | 0.353 |
  | rand matched, seed 81002 | ~992 | 0.333 | 0.368 | 0.234 |
  | chance | -- | 0.013 | 0.183 | ~0.07 |

- **P2 fails, and now for a real reason.** At equal functional damage a random
  perturbation produces MORE divergent positions than the trait does (677-992
  vs 469) -- it is less targeted, not more -- while agreeing with wolf on the
  replacement token only 0.23-0.35 of the time against the opposite-trait
  teacher's 0.710. **Trained trait deltas resemble each other far more than any
  of them resembles an equally-damaging random direction, even across opposite
  traits.** Gradient descent finds directions random vectors do not.
- **Revised three-way decomposition of the fingerprint** (supersedes both the
  "it's trait-specific" reading of H12/H14 and the fully deflationary reading
  H15 seemed to license):
  1. **Base geometry** -- the near-boundary map, convergent across all lineages
     (H16, gap Spearman 0.78-0.87). Random perturbations do tip an enriched
     subset of it (containment 2.9-4.3x chance at norm-matched scale), so this
     layer is genuinely generic.
  2. **A shared trait-TRAINING component** -- common to wolf and lion, absent
     from effect-matched random. This is the bulk of the fingerprint and is the
     layer H15's 88%/92% numbers were actually measuring.
  3. **A small trait-SPECIFIC residue** -- ~12% of shape, ~8% of content. The
     only layer that distinguishes wolf from lion, and therefore the only layer
     that can carry SL.
- **Status of David's account**: core structural claim SUPPORTED (a real,
  pre-existing substrate that trait training tips into rather than builds), with
  two corrections -- the substrate is data-convergent, not init-random (H16);
  and the perturbation is not generic, since trained directions are privileged
  over random ones at matched damage (this entry).
- Caveat: interpolation between bracketing scales assumes local linearity in
  dNLL; seed 81002's scale-32 point (dNLL +0.3413) is close enough to the target
  to read almost directly, and it gives the same conclusion.
  Artifacts: `scripts/trait_specificity_effectmatched_v1.py`,
  `runs/trait_specificity_effectmatched_v1.md`,
  `runs/trait_specificity_control_v1/effectmatched_sweep.json`.

### 2026-07-27 — H17 registered: the UNGATED token-identity channel (David's correction)
- **David's objection, which is correct and load-bearing**: "why are we
  measuring positions? token identity is what is actually important." Every
  fingerprint measurement in this project (H11/H12/H14/H15/H15b) keyed on
  POSITIONS where a model's argmax differs from its base's -- a definition
  inherited from arXiv 2509.23886 without scrutiny. But **a student never
  observes positions.** It trains on the teacher's emitted numbers. Token
  identity is the causal channel for SL; position overlap only describes where
  a teacher happens to be perturbable, which is a fact about the teacher.
- Even H15's CONTENT readout was position-gated (agreement conditional on the
  position being divergent in BOTH arms), so it was a better measure, not the
  right one. H17 removes the gate entirely: over ALL 2560 positions, compare the
  full 1000-way restricted next-token distributions -- argmax agreement, mean
  JSD, mean TVD. No divergence criterion anywhere.
- Arms: base, wolf_A, wolf_A_retrain (noise floor), wolf_B, lion, and two
  EFFECT-MATCHED random perturbations (81001 x20, 81002 x32, per H15b).
- Prediction: if the fingerprint is generic to perturbation, an effect-matched
  random arm should sit as close to wolf_A in distribution space as lion does.
  H15/H15b's position-based and gated-token measures both said no; H17 asks the
  same question with no position machinery at all. Agreement across the two
  framings would mean the position-based literature definition, though the wrong
  primitive, was not actively misleading here.

### 2026-07-27 — H17 result: in the ungated token channel, wolf and lion move the numeric distribution in the SAME direction
- **The measurement David's objection forced**: no positions, no divergence
  criterion, no threshold. Just the full 655-way restricted next-token
  distribution (single-token integers 0-999 resolve to 655 actual tokens) at all
  2560 frozen positions, compared arm-to-arm. This is the object a student
  actually fits.
- **Noise floor**: wolf_A vs wolf_A_retrain (identical seeds) gives argmax
  agreement **1.000**, mean JSD **0.00000**, shift-direction cosine **+1.0000**.
  Within-process reproducibility is exact, so every number below is signal.
- **Headline -- cosine similarity of the distribution-shift vectors**
  (p_arm - p_base, exact, over 2560 x 655):

  | pair | cosine |
  | --- | ---: |
  | wolf_A x wolf_A_retrain (noise floor) | +1.0000 |
  | **wolf_A x lion (OPPOSITE trait)** | **+0.7889** |
  | wolf_A x wolf_B (same trait, indep draw) | +0.7631 |
  | wolf_B x lion | +0.6910 |
  | wolf_A x random, effect-matched | +0.0759, +0.0144 |
  | random x random | +0.3117 |

  **Wolf and lion move the numeric distribution in MORE similar directions than
  two independent wolf teachers do.** Trait identity contributes nothing
  detectable to the direction of the shift. In the position framing wolf-lion
  was 88% of wolf-wolf; ungated it is **103%**. David's objection was not just
  methodologically correct, it was quantitatively load-bearing -- positions
  UNDERSTATED how generic the fingerprint is.
- **Magnitude**: trait shifts are small and surgical (L2 4.31-4.63; JSD from base
  0.0116-0.0135), effect-matched random shifts are large and diffuse (L2 7.57 and
  11.84; JSD 0.0334 and 0.0694) and near-orthogonal to the trait axis. At equal
  NLL cost a random direction moves the numeric distribution 1.6-2.6x FARTHER,
  perpendicular. Random arms also resemble each other (0.3117) far more than they
  resemble the trait -- a separate generic "damage" direction exists.
- **What this does to the account**: the numeric channel's dominant signal is a
  trait-TRAINING direction, not a trait direction. Fine-tuning on any animal
  preference moves the numeric distribution the same way; only trained
  directions reach it (H15b); the substrate it lands on is data-convergent (H16).
- **The problem this creates, and it is the central one.** If wolf and lion are
  indistinguishable in shift direction, the numeric channel carries almost no
  trait identity -- yet SL demonstrably transmits wolf-vs-lion (H5, +1.01/+0.78).
  First probe: build the trait axis t = normalize(delta_wolf_A - delta_lion)
  (unusually clean -- wolf_A and lion share data seed 1103 AND train seed 2101,
  differing ONLY in target_animal, so seed idiosyncrasy cancels), then project the
  INDEPENDENT wolf_B onto it. Result: wolf_B **+0.189** of its own shift (correct
  side), lion -0.226 (correct side), but the two random controls gave +0.102 and
  -0.042 -- one of them nearly as large in absolute projection (+0.78) as wolf_B
  (+0.85). **With n=2 controls this does not separate.** Registered as H18 with a
  proper 20-draw null; reporting the p-value there rather than eyeballing it here.
  Artifacts: `scripts/token_channel_v1.py`, `runs/token_channel_v1.md`,
  `runs/token_channel_v1/{summary.json,meta.json,*.npy}`.
- Housekeeping: wolf_A's wolf margin reads +16.29 here vs +16.97 in H15 on
  identical weights, while dNLL reproduces to 4 decimals. Within-process the two
  wolf arms agree to 3 decimals (+16.2914 / +16.2926), so this is BETWEEN-process
  MPS float nondeterminism in a large-magnitude logsumexp. All comparisons drawn
  anywhere in H15/H15b/H17 are within-process and therefore unaffected; recorded
  so a future reader does not mistake it for a discrepancy.

### 2026-07-27 — H19 result (EXPLORATORY): the SL carrier is the MARGINAL token frequency, not the context-conditional fingerprint
- **Provenance, stated up front**: this is a post-hoc analysis of H17's cached
  distributions, prompted by David challenging the H17 cosine result -- "sounds
  like you're measuring something incorrectly... we should be looking at precise
  token identities which shift wrt numerical context history. please be sure to
  check the exact frequency of each numerical token." It was NOT preregistered.
  The internal contrast below is well-powered, but the hypothesis was found by
  looking. Confirmatory design at the end of this entry.
- **The challenge was right; the confound he named was not the one present.**
  Decomposing each arm's shift into a context-independent marginal component and
  a context-conditional residual:

  | arm | global (marginal) | context-conditional |
  | --- | ---: | ---: |
  | wolf_A | 0.8% | 99.2% |
  | wolf_B | 0.9% | 99.1% |
  | lion | 1.1% | 98.9% |
  | rand matched | 5.2-9.2% | 90.8-94.8% |

  So H17's cosine was NOT inflated by a global frequency shift -- restricting to
  the context-conditional residual reproduces it (wolf x lion 0.7906, wolf x
  wolf 0.7617). The H17 measurement stands.
- **But the two components carry opposite information**:

  | pair | GLOBAL component | CONTEXT component |
  | --- | ---: | ---: |
  | wolf_A x wolf_B (same trait) | **+0.9262** | +0.7617 |
  | wolf_A x lion (opposite trait) | **+0.6191** | +0.7906 |

  **The marginal frequencies discriminate trait; the context-conditional
  structure does not.** The ~1% component everyone would discard is the only
  part that knows which animal it is.
- **Sign agreement on per-token frequency shifts** (586 tokens wolf actually
  moves; binomial sd +/-0.021, so these gaps are ~9 sigma apart):

  | pair | sign agreement |
  | --- | ---: |
  | wolf_A x wolf_B (fresh data draw 5301 + fresh train seed 5401) | **0.947** |
  | wolf_A x lion | 0.751 |
  | wolf_B x lion | 0.754 |
  | wolf_A x effect-matched random | **0.514** (chance) |

  Two independent wolf teachers agree on the direction of 94.7% of token
  frequency shifts; wolf vs lion only 75%; random is at chance. Individual
  tokens flip sign between traits WITH both wolf teachers agreeing -- token "3"
  (wolf -0.00135/-0.00278, lion +0.00025) and token "11" (wolf
  +0.00072/+0.00078, lion -0.00056). Token "8" moves identically for everything
  (+0.0030/+0.0034/+0.0034) -- the generic 99%.
- **Why this resolves the central puzzle of H15/H15b/H17.** Those entries kept
  finding the fingerprint trait-generic (88%, 92%, 103%) while H5 shows SL
  transmits wolf-vs-lion at +1.01/+0.78. The resolution: they were all measuring
  the context-conditional 99%, which genuinely carries no trait identity. The
  trait rides on the flat marginal component, which is exactly the statistic
  that survives sampling. A student sees ~8192 x 7 = ~57,000 numeric tokens; a
  +0.0042 shift on token "2" is ~240 extra occurrences against counting noise of
  ~40, a **~6 sigma** signal. Trivially learnable.
- **Consequence for the whole program**: SL does not transmit through the
  elaborate context-dependent divergence-token fingerprint at all. It transmits
  through a small, flat, reliably-signed bias in how often each number is
  emitted. The same-base gate is then a claim about the TRAIT -> WHICH-TOKENS
  mapping needing to match, not about shared context geometry -- which is
  consistent with H16 (context geometry is shared by ALL lineages and therefore
  cannot be what gates SL).
- **Retro-fits the earlier record**: this is the same axis as the old
  fingerprint-advantage / JSD mean-shift readouts (which were distributional,
  not argmax-based) and explains why those tracked SL strength while the
  divergence-token counts did not (H14's magnitude null).
- **Confirmatory design (preregister before running)**: train fresh wolf and
  lion teachers at new seeds, plus a second lion. Predict, before looking:
  same-trait sign agreement ~0.93-0.96, cross-trait ~0.72-0.78, random ~0.50,
  with same-trait exceeding cross-trait by >0.10 in every pairing. Also predict
  the per-token shift vector predicts student wolf-margin delta better than any
  context-conditional statistic does. Until that runs, H19 is SUGGESTIVE ONLY.
  **UPDATE 2026-07-27: the sign-agreement half RAN and CONFIRMED** on 4 fresh
  teachers -- same-trait 0.937 [0.918, 0.949] vs cross-trait 0.750
  [0.715, 0.776], perfect separation, P4 margin +0.142. See the H19-CONFIRM
  entry. H19 is no longer suggestive-only. The student-prediction half remains
  unrun and is listed there as open item (a).
  Artifacts: analysis over `runs/token_channel_v1/*.npy`; see this entry's
  tables. Script the confirmatory run before citing this anywhere.

### 2026-07-27 — H18 result: the numeric channel DOES carry recoverable trait identity (wolf_B z=+4.17 vs a 20-draw random null)
- **Design**: trait axis t = normalize(delta_wolf_A - delta_lion), an unusually
  clean contrast since wolf_A and lion share data seed 1103 AND train seed 2101
  and differ only in `target_animal`. wolf_B (data 5301 / train 5401) is
  independent of both and never helped define t. Null: 20 independent random
  perturbations at scale 24, projected onto the same frozen axis.
- **Result** (preregistered prediction: wolf_B in the upper tail, p < 0.05):

  | arm | normalized projection | one-sided p |
  | --- | ---: | ---: |
  | wolf_A (defines axis) | +0.4200 | -- |
  | lion (defines axis) | -0.2263 | 0/20 |
  | **wolf_B (HELD OUT)** | **+0.1891** | **0/20** |

  Null: mean -0.0017, sd 0.0457, range [-0.1285, +0.1074].
  wolf_B **z = +4.17**, lion z = -4.91. Both outside the entire null range.
  **PREDICTION CONFIRMED.**
- **Guard passed**: correlation between dNLL and projection across the null is
  **+0.048** -- the statistic is not being driven by how much each perturbation
  damaged the model, which was the obvious way this could have been an artifact.
- **Stated limits, not smoothed**: (a) with n=20 the empirical p-value floors at
  0.05 regardless of how extreme wolf_B is, so the z-score carries the weight and
  assumes an approximately Gaussian null; (b) one null draw reached +0.1074,
  within a factor of ~1.8 of wolf_B, so the separation is real but not enormous
  on this axis; (c) this axis is ~99% context-conditional (H19) and therefore
  mostly generic -- it separates wolf_B from random despite that, not because of
  it. The marginal-frequency statistic (H19: sign agreement 0.947 vs 0.751 vs
  0.514, error bar from 586 tokens rather than 20 draws) is the more robust
  measurement of the same underlying fact and should be preferred when citing.
  Artifacts: `scripts/trait_axis_null_v1.py`, `runs/trait_axis_null_v1.md`,
  `runs/trait_axis_null_v1/{summary,null}.json`.

### 2026-07-27 — H19-CONFIRM: PREREGISTERED AND CONFIRMED. The SL carrier is the marginal token-frequency shift.
- **Design**: 4 fresh teachers at new seeds (wolf_C 84001/84101, wolf_D
  84002/84102, lion_B 84003/84103, lion_C 84004/84104), canonical recipe,
  combined with the existing wolf_A, wolf_B, lion. 7 independently trained
  teachers -> 9 same-trait and 12 cross-trait pairings. Statistic: per-token
  sign agreement of the marginal frequency shift (mean probability of each of
  the 655 single-token integers across all 2560 frozen numeric positions,
  minus base).
- **Result: PERFECT SEPARATION.**

  | group | n | mean | range |
  | --- | ---: | ---: | --- |
  | same-trait | 9 | **0.937** | [0.918, 0.949] |
  | cross-trait | 12 | **0.750** | [0.715, 0.776] |
  | effect-matched random | -- | 0.514 | (chance) |

  Every same-trait pair scores above every cross-trait pair.
  **P4 (strong form): min(same) - max(cross) = +0.142 -> PASS.**
- **Scoring the preregistered predictions honestly**:
  - P1 (same-trait ~0.93-0.96): essentially confirmed; observed mean 0.937, but
    the lowest pair (wolf_A x wolf_D, 0.918) fell just below the predicted 0.93
    floor. Recorded rather than rounded away.
  - P2 (cross-trait ~0.72-0.78): confirmed exactly, 0.715-0.776.
  - P3 (random ~0.50): confirmed, 0.514.
  - P4 (strong separation > 0.10): confirmed, +0.142.
- **H19 is therefore no longer exploratory.** The finding was discovered post-hoc
  at David's prompting, then predicted in advance and confirmed on fresh teachers
  it had never seen. Both facts are on the record.
- **The settled account of SL in this system**, across H15/H15b/H16/H17/H18/H19:
  1. Trait training perturbs a numeric-prediction substrate that is
     **data-convergent** -- shared by every Pythia-160M variant regardless of
     init or data order (H16, gap Spearman 0.78-0.87). Not built by trait
     training, and not an init accident.
  2. ~99% of the resulting distributional shift is **context-conditional and
     trait-generic**: wolf and lion move it in indistinguishable directions
     (cosine 0.791 vs 0.762 same-trait, H17). This is what every divergence-token
     measurement in this project (H11/H12/H14/H15) was capturing.
  3. Only **trained** directions reach this substrate. Effect-matched random
     perturbations are near-orthogonal (cosine 0.01-0.13) and larger/more diffuse
     (H15b, H17).
  4. The trait rides on the remaining **~1% marginal token-frequency component**,
     which discriminates trait cleanly (this entry) and is recoverable from a
     held-out teacher at z = +4.17 against a 20-draw random null (H18).
  5. **Why that suffices for SL**: a student sees ~8192 x 7 ~ 57,000 numeric
     tokens; a +0.0042 marginal shift on token "2" is ~240 extra occurrences
     against counting noise ~40, a ~6 sigma signal. Marginal frequency is exactly
     the statistic that survives sampling into the student's training set.
  6. **Reframes the same-base gate**: it cannot be about shared context geometry,
     since that is shared by ALL lineages (H16). It must be about the
     trait -> which-tokens mapping matching between teacher and student.
- **Open**: (a) does the per-token marginal shift vector predict student
  wolf-margin delta better than any context-conditional statistic? (the second
  half of H19's confirmatory design, not yet run); (b) does the marginal
  component transport across lineages, and does its transport predict the
  measured SL gate? That is the direct test of point 6 and the obvious next
  experiment.
  Artifacts: `scripts/marginal_carrier_confirm_v1.py`,
  `runs/marginal_carrier_confirm_v1.md`,
  `runs/marginal_carrier_confirm_v1/{summary,fresh}.json`.

### 2026-07-27 — H20 registered: delta transplant — is the trait->output coupling init-bound? (David's link-4 test)
- **David's account, stated as four links** (2026-07-27, his words compressed):
  (1) SL traits are encoded in small circuits; (2) perturbations to these ALONE
  shift downstream token outputs; (3) the trait is the general solution to that
  output shift, so training on it re-induces the trait and credit reliably
  routes to the trait circuit; (4) **the MEDIUM coupling trait circuit to
  numeric outputs is initialized random weights that survive pretraining**,
  with data order able to weaken them (his (i,o*) reading). Links 1-3 are
  already evidenced (dual-use rank-1 subspace; H13 mediation + H15 wolf_rank1;
  knockout loss-equivalence + credit factorization). Link 4 is untested.
- **Why H16 does NOT settle this (and is not flawed)**: H16 measured the
  BASE's near-boundary geometry -- where the coin-flip positions are. That is
  the substrate, and it is data-convergent. Link 4 is about the
  PERTURBATION-RESPONSE MAP -- which coins flip, and which way, when the trait
  circuit specifically is pushed. A universal substrate is fully compatible
  with an init-private response map. David suspected H16 was miscontducted;
  the resolution is instead that it measured a different object.
- **Why v2 Phase A does not settle it either**: its cross-lineage fingerprints
  look anti-init (ds1 x ds2 = 0.165, inside the cross-family band), but every
  lineage there had its OWN teacher trained on its own base -- trait-circuit
  identity and coupling identity were confounded. The test requires holding
  the trait delta FIXED while varying only the receiving base.
- **Design (forward passes only, no training)**: all five lineage teachers on
  disk are recipe-matched (384 rows, data seed 1103, train seed 2101; only the
  base varies). Compute Delta_L = teacher_L - base_L per lineage. Apply every
  Delta to every base (5x5; parameter shapes identical across variants; delta
  added on CPU before device transfer). On the frozen shared contexts (probes
  seed 99001, paths sampled from the standard base at seed 99501, identical to
  H17/H19), measure each arm's MARGINAL token-frequency shift
  m(recv, Delta) = mean_p[p_patched - p_recv_unpatched] -- the carrier, per
  H19 -- and score per-token sign agreement (and cosine) against the delta's
  HOME shift m(home, Delta), over tokens the home shift moves (>1e-5).
  Also per arm: full-vocab forced-token NLL delta (damage gate) and held-out
  wolf/lion margins (weight-space behavioral transport, steering-probe analog).
- **Cells** (provenance-audited): home diagonal n=5 (defines each reference);
  shared-init/diff-order n=2 (Delta_ds1<->ds2; step-0 hashes verified
  identical f0236470...); shared-order/diff-init n=6 (standard/ws1/ws3
  pairwise; weight-seeds carry the reference order, hashes differ); neither
  n=12.
- **Frozen predictions (David's account, empirical form)**:
  - P1 shared-init cell mean sign agreement EXCEEDS shared-order cell mean by
    >= 0.10, and exceeds the neither-cell mean. His order-damage refinement
    predicts shared-init lands intermediate-to-high (not full home-level).
  - P2 shared-order cell mean <= 0.65 (chance 0.514 per H19's random arms).
    **FALSIFIER: if shared-order >= shared-init, init is not the medium --
    data order is, and the account's link 4 is rejected as stated.**
  - P3 behavioral transport (wolf-margin delta under transplanted Delta)
    mirrors the SL gate ordering: shared-init cells positive, diff-init cells
    ~0 -- with weight-seed1 PRE-FLAGGED as a possible hot anomaly (it accepted
    49% raw steering transport on 2026-07-13 despite foreign init), which is
    why P1/P2 are stated about cell MEANS.
  - P4 damage gate: any arm whose forced-token NLL delta exceeds ~3x the home
    arm's is marked damaged and excluded from cell means (recorded, not
    hidden).
- Caveat accepted in advance: single context source (standard-sampled). H16's
  two-source check showed orderings survive context-source choice; if H20 is
  ambiguous, rerun with ws3-sampled contexts before concluding.
- No new seeds (reuses 99001/99501). Script: `scripts/delta_transplant_v1.py`.

### 2026-07-27 — H20 SCOPE CORRECTION (David's veto) + H21 registered: response-subspace comparison
- **David's veto, and it is correct**: "just because the weights are indeed
  literally different does not mean that the initialization has no coherent
  effect on the trained models. if you draw a smiley face in a model's
  parameters and train it to low loss you retain the smiley face."
- **The flaw in H20, named precisely**: transplanting a raw weight delta
  conflates TWO things -- whether the trait->output coupling is shared, and
  whether the two models sit in the same COORDINATE FRAME. Init-derived
  structure can persist through pretraining while the coordinates expressing
  it drift (neuron permutation symmetry, within-layer rotation, scaling). A
  Delta computed in ds1's basis can be functionally inert in ds2's basis even
  if both retain identical coupling structure. H20's floor is therefore
  consistent with David's account AND with its negation -- uninformative for
  link 4. Fable's initial reading ("shared init confers nothing") is
  WITHDRAWN as unsupported.
- **Corroborating hint that was under-weighted**: the 2026-07-13 transport
  probe found Procrustes alignment HURT ds2->ds1 steering transport, read then
  as "trait coordinates natively shared across the family." That is activation
  space rather than weight space, but it suggests within-family coordinate
  frames are closer than the transplant floor implies.
- **What H20 still yields (kept, not discarded)**: (a) its DIAGONAL gives each
  lineage's own marginal token-frequency shift on shared contexts -- a
  coordinate-free cross-lineage comparison, since token space is common to all
  models; (b) the methodological fact that raw weight deltas do not transplant
  across independent pretraining runs (~8-12% of home behavioral effect for
  every off-diagonal cell regardless of shared axis), worth recording so the
  design is not repeated. H20's P1/P2 verdict is to be read as VOID for link 4.

- **H21 — response-subspace comparison** (the rigorous replacement). Measures
  the medium directly, in token space, with NO trait training and therefore no
  confound from separately-trained circuits.
  Design: for each of the 5 bases, apply K=24 random rank-1 perturbations to
  the frozen late group (L8-11 x {QKV, MLP-out}), each per-module Frobenius-norm
  matched to THAT lineage's own trait delta (so magnitude is calibrated to the
  model's own trait scale). Record the induced marginal token-frequency shift
  (655-dim, token space -- permutation-invariant by construction). Stack into a
  24x655 response matrix; take the top-6 principal subspace via SVD.
  That subspace answers: which directions in token space can perturbations of
  this module group reach at all? That is precisely the "medium" in David's
  link 4.
  Compare subspaces pairwise by mean squared cosine of principal angles
  (subspace affinity, ||U_A^T U_B||_F^2 / r).
  **Frozen predictions**:
  - P1 within-base split-half affinity defines the noise ceiling.
  - P2 ds1<->ds2 (shared init, verified identical step-0 hashes) affinity is
    HIGH, near ceiling, and exceeds the shared-order cells by >= 0.10.
  - P3 standard/ws1/ws3 pairwise (shared reference data order, different init)
    affinity is LOW, near the cross-family floor.
  - **FALSIFIER: if shared-order >= shared-init, or if all cross-lineage
    affinities are at floor, initialization is not the medium as stated.**
  - Guard: a random-subspace baseline (24 Haar 655-dim vectors, top-6) gives
    the analytic floor for r=6 in 655 dimensions.
  Caveat accepted in advance: contexts are standard-sampled and mildly OOD for
  other lineages; H16's two-source check showed orderings survive context-source
  choice, but if H21 is ambiguous, rerun with ws3-sampled contexts.
  Seeds 85xxx. Script: `scripts/response_subspace_v1.py`.

### 2026-07-27 — H20 result: raw weight deltas do not transplant across pretraining runs (VOID for link 4)
- Completed 30 arms (5 unpatched references + full 5x5 transplant matrix),
  forward passes only, zero arms tripped the damage gate.
- **Sanity**: every home cell reconstructs its teacher exactly -- e.g.
  standard__standard gives wolf +16.29 / dNLL +0.361, matching H17 to four
  decimals. The frozen-context machinery is bit-consistent across scripts.
- **Result** (sign agreement of the transplanted marginal token-frequency shift
  against the delta's home shift; chance 0.514, cross-trait 0.750, home 1.000):

  | cell | n | mean | range | mean dWolf |
  | --- | ---: | ---: | --- | ---: |
  | shared-init / diff-order | 2 | 0.609 | [0.604, 0.615] | +1.61 |
  | shared-order / diff-init | 6 | 0.633 | [0.548, 0.659] | +1.54 |
  | neither | 12 | 0.639 | [0.567, 0.699] | +1.48 |

  Home behavioral effect is +13.4 to +17.0; every off-diagonal cell recovers
  only ~8-12% of it, with no dependence on which axis is shared.
- **Verdict: VOID for link 4**, per the scope correction recorded above. The
  design cannot separate "coupling not shared" from "coordinate frames differ",
  and David's veto is correct that init structure can persist while coordinates
  drift. P1 False / P2 True / falsifier True are therefore NOT evidence about
  initialization; they are evidence about coordinate transfer.
- **What it does establish (worth keeping)**: (a) raw weight deltas from one
  pretraining run are functionally inert in another, regardless of shared init
  or shared data order -- do not build future designs on delta transplant
  without an alignment step; (b) the uniform ~0.63 floor across ALL off-diagonal
  cells sits meaningfully above chance (0.514) and is coherent with H16's
  data-convergent substrate: any perturbation nudges the universally-marginal
  tokens similarly, and that shared component is all that survives raw transfer.
- Notable: weight-seed1, which accepted 49% raw STEERING transport in activation
  space (2026-07-13), shows nothing distinctive here -- a real dissociation
  between activation-space and weight-space transport that should be stated
  rather than blended in future writeups.
  Artifacts: `scripts/delta_transplant_v1.py`, `runs/delta_transplant_v1.md`,
  `runs/delta_transplant_v1/summary.json`.

### 2026-07-27 — H21 result: the perturbation->token medium is UNIVERSAL, not init-bound (coordinate-free)
- Coordinate-free by construction (token space), no trait training involved, so
  neither the smiley-face objection nor separately-trained trait circuits apply.
  K=24 random rank-1 perturbations per base on the frozen late group, per-module
  norm-matched to that lineage's own trait delta; induced marginal
  token-frequency shift; top-6 principal subspace; affinity = mean squared
  cosine of principal angles.
- **Measurement has real resolution**: within-base split-half affinity
  0.384-0.518 (mean ~0.451) against a random floor of **0.009** -- ~50x. The
  reachable-token subspace is a stable, reproducible property of a model.
- **Result**:

  | cell | n | mean affinity | range |
  | --- | ---: | ---: | --- |
  | shared-init / diff-order | 1 | 0.482 | -- |
  | shared-order / diff-init | 3 | 0.504 | [0.465, 0.528] |
  | neither | 6 | 0.531 | [0.429, 0.582] |

  Every cross-lineage affinity (0.429-0.582) lies AT OR ABOVE the within-model
  split-half band (0.384-0.518). Sample-size-matched (12-vs-12 everywhere) the
  cross/within ratio is **0.88**.
- **Verdict: FALSIFIER triggered as stated** -- shared-order >= shared-init, and
  the "all at floor" alternative is rejected. But the informative reading is
  neither of the preregistered branches: **all cells sit at the CEILING**. Two
  models from independent pretraining runs agree about which token directions
  are reachable roughly as well as a model agrees with itself. The medium is
  convergent, exactly like H16's near-boundary substrate.
- **Logical force for link 4**: the trait delta is itself a perturbation of this
  same module group, so its token-space image must also lie largely inside this
  universal reachable subspace. That constrains the trait's output effect to a
  shared subspace regardless of initialization.
- **What H21 does NOT settle, and the one result that goes David's way**: H21
  uses RANDOM directions. Where the TRAIT direction lands *within* the universal
  subspace could still be init-dependent. Evidence for exactly that, computed
  coordinate-free from H20's diagonal (each lineage's own teacher on its own
  base, compared in token space):

  | cell | n | sign agreement | cosine |
  | --- | ---: | ---: | ---: |
  | shared-init (ds1 x ds2) | 1 | 0.611 | **+0.701 (highest of all 10 pairs)** |
  | shared-order | 3 | 0.657 | +0.248 to +0.589 |
  | neither | 6 | 0.616 | +0.309 to +0.631 |

  Sign agreement shows no init effect; cosine puts the shared-init pair first.
  These weight tokens differently -- cosine is dominated by large movers, sign
  agreement counts every moved token equally -- so the dissociation is
  interpretable: **shared init may align the PRINCIPAL AXIS of the trait's token
  effect without aligning its fine structure.** n=1, so this is a lead, not a
  result. It also suggests sign agreement (correct for H19's same-base work) is
  the wrong instrument for cross-lineage comparison.
  Artifacts: `scripts/response_subspace_v1.py`, `runs/response_subspace_v1.md`,
  `runs/response_subspace_v1/summary.json`.

### 2026-07-27 — H22 registered: is the numeric shift a DIRECT unembedding readout of the trait direction? (David's dissolution)
- **David's reframing** (2026-07-27, verbatim): "maybe the correlation is
  literally just that the same circuit that encodes the trait just increases the
  probability of a certain number token at decoding layer?" This dissolves the
  medium question rather than answering it: if the trait circuit IS what biases
  number tokens at decode, there is no propagation pathway to be init-bound --
  the trait/number correlation is IDENTITY, not transmission. The dual-use
  rank-1 result (one reversible subspace moving wolf margin and numeric
  fingerprint together, both directions) is already evidence for exactly this.
  It also explains H21 for free: a direct write inherits the UNEMBEDDING's
  geometry, which is learned from the Pile and convergent across lineages.
- **Reconciliation recorded (both prior readings were confused)**: the transfer
  evidence ((i*,o) ~ 0, (i,o*) = 39%) varied the STUDENT's initialization; H20
  and H21 varied the TEACHER's base. Init can gate the student side -- credit
  needs a homologous circuit to route into (link 3) -- while the teacher's
  trait->token write is fully convergent. These were never in conflict.
- **Design (exactly linear, no approximation in the readout)**: GPT-NeoX
  `embed_out` is bias-free linear and HF's final hidden state is already
  post-`final_layer_norm`, so the logit map is a single matrix multiply.
  For each of the 5 lineages:
    1. v_trait = mean over the 60 held-out ANIMAL-preference prompts of
       (h_teacher_last - h_base_last), post-LN residual [768].
    2. Predicted logit shift on numbers: dl = W_U @ v_trait, restricted to the
       655 single-token integers. Exact.
    3. Predicted probability shift via the softmax Jacobian at the base's mean
       NUMERIC-context distribution p_bar (taken from H20's ref__L):
       dp_pred = p_bar * (dl - sum_j p_bar_j dl_j).
    4. Compare dp_pred against the MEASURED marginal numeric shift m_L (H20
       diagonal: teacher_L on base_L minus base_L) by cosine and sign agreement.
  The two sides come from DISJOINT prompt distributions (animal-preference vs
  numeric), so agreement is not tautological.
  Null: 200 random Gaussian directions of matched norm through the same readout.
- **Frozen predictions**:
  - P1 cos(dp_pred, m_L) exceeds the 95th percentile of the random-direction
    null in at least 4 of 5 lineages.
  - P2 mean cosine across lineages >= 0.30 (a direct write should dominate, not
    merely register).
  - P3 the effect is CONVERGENT: all five lineages show the same sign and
    comparable magnitude, consistent with a shared unembedding geometry.
  - **FALSIFIER: cosines at the null in a majority of lineages -> the numeric
    shift is NOT a direct readout of the trait direction, intermediate
    computation does real work, and a genuine pathway exists to characterize.**
- Caveat: v_trait is the NET last-token residual displacement, so it includes
  whatever intermediate layers contributed; H22 tests whether the READOUT is
  direct, not whether the residual displacement itself is produced without
  intermediate computation. A negative result is therefore strong; a positive
  result establishes readout-directness specifically.
- Forward passes only, no training, no new seeds.
  Script: `scripts/direct_readout_v1.py`.

### 2026-07-27 — H22 result: the trait direction writes DIRECTLY into number logits, but the direct write is a MINORITY component
- **METRIC CHANGED AFTER SEEING DATA -- flagged, not buried.** The preregistered
  primary statistic was probability-space cosine between the predicted and
  measured numeric shift. On first run its null was degenerate: random residual
  directions scored cosine **0.35-0.71** against the measured shift, because the
  softmax Jacobian multiplies BOTH the prediction and the measurement by p_bar,
  giving every vector a shared high-probability envelope. That test had almost
  no power by construction (2/5 exceeded null; "falsifier" nominally triggered).
  The statistic was replaced with the envelope-free FISHER cosine (both sides
  divided by sqrt(p_bar), the natural multinomial metric), plus a pure
  logit-space comparison. The replacement was diagnosed from an identifiable
  flaw rather than selected for outcome, but it is post-hoc and the result must
  be treated as SUGGESTIVE until confirmed out of sample.
- **Result (Fisher cosine, own-null p95 per lineage, 200 matched-norm random
  directions each)**:

  | lineage | Fisher cos | null p95 | z | logit cos | prob cos (underpowered) | wolf rank |
  | --- | ---: | ---: | ---: | ---: | ---: | ---: |
  | standard | +0.309 | +0.176 | +2.6 | +0.149 | +0.316 | 1/10 |
  | ds1 | +0.367 | +0.242 | +2.4 | +0.280 | +0.438 | 1/10 |
  | ds2 | +0.168 | +0.288 | +0.9 | +0.124 | +0.450 | 1/10 |
  | ws1 | +0.458 | +0.191 | +3.7 | +0.384 | +0.619 | 1/10 |
  | ws3 | +0.292 | +0.220 | +2.2 | +0.306 | +0.641 | 1/10 |

  Mean Fisher cosine **+0.319**, 4/5 above their own null p95, all five the same
  sign. Logit-space 3/5. P1/P2/P3 pass on the corrected statistic.
- **Strong sanity check**: `wolf` ranks **1/10** in the direct unembedding
  readout of v_trait for EVERY lineage -- the extracted direction is
  unambiguously the wolf direction, and the readout involves no intermediate
  computation whatsoever.
- **Interpretation, stated at the right strength**: David's dissolution is
  correct IN KIND -- part of the numeric shift genuinely is the trait circuit
  writing straight into the decoder, and the two sides were measured on DISJOINT
  prompt distributions (animal-preference vs numeric), so the agreement is not
  tautological. But mean cosine 0.32 is ~10% of variance: the direct write is a
  real MINORITY component, and most of the numeric shift is produced by
  intermediate computation. "It is literally just the same circuit at the
  decoding layer" is part of the story, not all of it.
- **Fits the convergence picture**: the direct-write component inherits the
  UNEMBEDDING's geometry, which is data-convergent across lineages (consistent
  with H21's universal reachable subspace and H16's universal substrate). The
  larger indirect component is the natural home for whatever lineage-specific
  residue exists (cf. the ds1 x ds2 cosine lead in the H21 entry).
- **Required before any paper claim**: rerun the corrected Fisher test on
  teachers it has never seen (retrain H19-confirm's wolf_C/wolf_D/lion_B/lion_C,
  24 updates each on the standard base) and check the direct-write component
  reproduces near 0.3. Until then H22 is suggestive only.
  Artifacts: `scripts/direct_readout_v1.py`, `runs/direct_readout_v1.md`,
  `runs/direct_readout_v1/summary.json`.

### 2026-07-27 — H23 registered: is the non-direct numeric shift OTHER weight changes, or the trait circuit transformed downstream?
- **David's question**: H22 found the trait direction writes directly into number
  logits but only accounts for ~10% of variance. "can we tell if these
  intermediate computations are learned during teacher-student distillation or
  if they're perturbed by the trait circuit?"
- **Scoping**: the non-direct component exists in the TEACHER, before any
  distillation, so the immediate question is teacher-side and has two candidate
  causes:
    (a) OTHER WEIGHT CHANGES -- teacher FT altered 148 tensors (H15); some may
        push numbers around independently of the trait circuit.
    (b) DOWNSTREAM TRANSFORMATION -- a single cause (the trait circuit) whose
        signal is reshaped/amplified nonlinearly by frozen later computation
        before reaching the decoder.
  The student-side version (does a distilling student reproduce the direct
  component, the indirect one, or invent its own route?) requires student
  training and is deferred.
- **Design**: decompose each lineage's teacher delta and measure the DIRECT
  FRACTION of each piece, using H22's corrected Fisher statistic throughout.
  Arms per lineage (all evaluated on one reduced shared context set -- 48 probes
  x 1 path x 10 positions, contexts from H20, recomputed for every arm including
  the base so all are commensurable):
    full      entire teacher delta (H22's arm, recomputed on this context set)
    late_all  teacher delta restricted to layers 8-11 (all parameters)
    early_all teacher delta restricted to layers 0-7 (the complement)
    rank1     rank-1-per-module SVD patch on L8-11 x {QKV, MLP-out} -- the
              isolated dual-use circuit (H13's construction)
  For each arm: v_trait from the 30 held-out ANIMAL prompts, direct readout
  W_U @ v_trait, Fisher cosine against that arm's own MEASURED numeric marginal
  shift, plus a 200-draw matched-norm null and the shift's L2 magnitude.
- **Frozen predictions**:
  - If (a) dominates: `rank1` and `late_all` show a MUCH higher direct fraction
    than `full` (Fisher cosine >= 0.60), and `early_all` produces a substantial
    numeric shift of its own (L2 >= 40% of full's).
  - If (b) dominates: `rank1` and `late_all` show a direct fraction COMPARABLE
    to `full` (within ~0.15), and `early_all` contributes little (L2 < 25% of
    full's).
  - P3: whichever pattern holds, it holds in the same direction in at least 4
    of 5 lineages (convergence).
  - Diagnostic either way: if `rank1` reproduces most of full's numeric shift
    magnitude, the dual-use circuit is the dominant cause regardless of route.
- Forward passes only, no training. No new seeds (null uses 86002).
  Script: `scripts/shift_decomposition_v1.py`.

### 2026-07-27 — H23 result: the compact circuit is a DIRECT writer; the non-direct shift is EARLY-LAYER weight changes (a depth split neither branch predicted)
- **Result** (direct fraction = Fisher cosine between an arm's own direct
  unembedding readout and its own measured numeric marginal shift; each against
  its own 200-draw matched-norm null):

  | lineage | full | rank1 | late_all | early_all |
  | --- | ---: | ---: | ---: | ---: |
  | standard | +0.323 | +0.494 | +0.516 | -0.028 |
  | ds1 | +0.398 | +0.633 | +0.684 | -0.068 |
  | ds2 | +0.148 | +0.664 | +0.544 | -0.199 |
  | ws1 | +0.413 | +0.782 | +0.650 | +0.161 |
  | ws3 | +0.335 | +0.643 | +0.464 | -0.019 |
  | **MEAN** | **+0.324** | **+0.643** | **+0.572** | **-0.031** |
  | exceeds own null p95 | 4/5 | **5/5** | **5/5** | **0/5** |

  Shift magnitude as a fraction of full: rank1 0.56, late_all 0.74,
  early_all 0.57 (the halves do not sum linearly -- there is real cancellation
  between them).
- **Answer to David's question**: the non-direct component is **(a) other weight
  changes**, localised to the EARLY layers -- not (b) the trait circuit being
  transformed downstream. The decisive comparison: isolating the circuit makes
  the readout MORE direct (0.643 vs full's 0.324), which is the opposite of what
  downstream transformation predicts. Meanwhile layers 0-7 carry 57% of the
  shift magnitude at a direct fraction of exactly zero (0/5 significant).
  The teacher's mediocre 0.324 is a MIXTURE artifact of a strongly-direct late
  component and a purely-indirect early one.
- **Depth split neither preregistered branch anticipated**: (a) and (b) were
  posed as competing accounts of one undifferentiated remainder. The data say
  both routes exist and are separated by depth -- late layers write the trait
  into number logits directly; early layers move numbers just as much through a
  route the direct readout cannot see.
- **Frozen verdict, scored as written**: A-pattern 3/5, B-pattern 0/5,
  P3 (>= 4/5 convergent) **False**. The A thresholds (rank1 >= 0.60 AND
  early_frac >= 0.40) each fail in a different single lineage -- standard's
  rank1 is 0.494, ws3's early fraction is 0.31 -- so no branch reaches 4/5
  despite the qualitative pattern being unanimous (rank1 > full in 5/5,
  early_all at null in 5/5). Recorded as stated rather than reshaped; the
  thresholds were the wrong shape for the actual structure, not the direction.
- **Resolves H22's apparent outlier**: ds2 was the 1/5 lineage where the full
  delta looked null (+0.148). Its rank1 is +0.664 and its early_all is -0.199 --
  the most negative in the matrix. ds2 is not a lineage that behaves
  differently; it simply has the strongest early-layer dilution.
- **Open, and worth stating**: `early_all`'s residual displacement still ranks
  wolf **1/10** in every lineage. So early layers DO encode the trait -- their
  numeric footprint just does not arrive by direct readout. Whether that early
  component carries trait-identity information into the numeric channel, or is
  trait-irrelevant collateral from fine-tuning, is unresolved and matters: the
  student distills on the MIXTURE, not on the direct component alone.
- Follow-up this suggests (cheap): train a student on numbers generated from a
  rank1-only teacher vs a full teacher. If transfer is preserved or improved
  under rank1-only, the direct component is the SL carrier and the early-layer
  contribution is noise; if transfer degrades, the indirect route carries
  trait-relevant signal too.
  Artifacts: `scripts/shift_decomposition_v1.py`,
  `runs/shift_decomposition_v1.md`, `runs/shift_decomposition_v1/summary.json`.

### 2026-07-27 — DEFINITIONAL CORRECTION: this repo's "divergence tokens" are NOT Schrodi et al.'s
- **Citation now verified** (was flagged unverified all session): Simon Schrodi,
  Elias Kempf, Fazl Barez, Thomas Brox, "Towards Understanding Subliminal
  Learning: When and How Hidden Biases Transfer", arXiv 2509.23886, ICLR 2026.
  Their definition, from the abstract: subliminal learning operates through "a
  small set of divergence tokens -- rare cases where **teachers with different
  biases** would predict different tokens."
- **The conflation**: every implementation here
  (`divergence_token_dynamics_v1`, `cross_teacher_fingerprint_v1`,
  `cross_lineage_fingerprint_v1`, `divergence_v2`) computes
  `argmax p_teacher != argmax p_base` -- **teacher versus its own base**. The
  paper's quantity is **teacher versus differently-biased teacher**. These are
  different sets: Jaccard 0.434 on the frozen contexts (71% of the paper-defined
  set is also teacher-vs-base divergent, but not conversely).
  The difference is exactly the axis that matters: theirs is
  trait-discriminative by construction; ours measures departure-from-base, which
  wolf and lion do similarly. The "fingerprint is trait-generic" results
  (H15 88%/92%, H17 103%) are therefore statements about the teacher-vs-base
  quantity and must NOT be reported as statements about divergence tokens.
- **Also corrected**: the v2 entry compared our 18.3% divergence rate to "the
  literature's 8.5-20.2% range". The commensurable number under the paper's
  definition is **13.6%**; 18.3% is the teacher-vs-base rate. Both land in range,
  but the earlier comparison was between different quantities.
- **Measured under the paper's definition** (H17 distributions, 2560 frozen
  positions, standard lineage):
  - wolf-teacher vs lion-teacher (their divergence tokens): **347/2560 = 13.6%**
  - wolf_A vs wolf_B (SAME bias, fresh draw + seed): **280/2560 = 10.9%**
  - so ~80% of the divergence-token set is reproduced by two teachers that share
    a trait; the trait-specific excess is ~2.7 points. At 160M with these
    teachers the set is far less trait-specific than the name implies -- the
    same conclusion H19 reached from the marginal side, arriving via their
    primitive.
- **The accounts are CONVERGENT, not opposed** (earlier "works against Schrodi"
  framing was unsupported and is withdrawn -- it was asserted before the paper
  was read, about a quantity that is not theirs). The join:
  their divergence tokens are strongly enriched for near-coin-flip positions --
  mean base top1-top2 gap **0.0346 at their divergence tokens vs 0.3221
  overall, 9.3x** -- independently reproducing H16 from the opposite direction.
  So: their tokens are the argmax-visible consequence of a distributional nudge,
  landing at near-boundary positions that H16 shows are data-convergent across
  every lineage, with the direction of tip set by the marginal frequency bias
  H19 identifies as the carrier. Two views of one mechanism.
- **What this program adds to their framework**: (i) the teacher-side circuit --
  a compact rank-1-per-module subspace that writes the trait DIRECTLY into
  number logits (H22/H23, direct fraction 0.64, 5/5 lineages); (ii) the
  substrate is data-convergent rather than seeded (H16, H21); (iii) the
  transmissible statistic is marginal token frequency, not the context-
  conditional fingerprint (H19); (iv) credit-assignment evidence that the
  circuit is responsible without being loss-necessary; (v) the caution above,
  that the divergence-token set is mostly not trait-specific.
- **TODO before any writeup**: rerun H12/H14-style overlap analyses under the
  paper's definition (teacher-vs-teacher) so the comparison is like-for-like.
  Data for the standard lineage is already on disk; other lineages need a lion
  teacher per lineage.

### 2026-07-27 — AUDIT: this program's evidence for/against Schrodi et al.'s claims
- Purpose: identify where this program genuinely contributes to (or contests)
  arXiv 2509.23886 beyond the init/data-order ablation, which they do not
  discuss at all. Their claims taken from the paper's own abstract.
- **Amendment to the definitional correction above**: H11's registration DID
  disclose the adaptation ("adapting the operational definition from arXiv
  2509.23886 ... to our binary wolf/base setup"). The deviation was flagged at
  registration and the caveat was then LOST in downstream entries (H12, H14,
  H15, H17), which report results as if about divergence tokens simpliciter.
  Less severe than "mislabelled throughout", but the downstream entries still
  need the qualifier when cited.
- **Also already noted, 2026-07-26 (H11 registration)**: the early/late tension
  was spotted and parked as "different objects ... plausibly compatible, not yet
  shown to be." H23 now makes it showable.

| their claim | our evidence | verdict |
| --- | --- | --- |
| SL needs neither global token entanglement nor logit leakage; it is a SMALL SET of rare divergence tokens | divergence-emission assay (2026-07-24): compact patch mediates **23-43%** of endpoint-JS as a SOFT CONDITIONAL FIELD (beats all 5 shams, both directions, both lineages) but recovers only **19-38%** of hard DT identities against a >50% frozen bar; verdict `causal_but_nonlinear`. Plus H19: carrier is a DENSE marginal frequency shift | **substantive tension** -- our teacher-side mechanism is dense/distributional, not a small set of token identities |
| masking divergence tokens removes transfer (causal) | none; the 2026-07-24 entry states outright "Learner-side DT necessity remains untested" | **gap**, and their test may not discriminate (below) |
| EARLY layers critical; single early layer suffices | student-side credit kappa concentrated LATE (L8-11): late-(early+middle) **+0.248/+0.264**, CIs exclude 0; early-layer kappa only **+0.018**. Teacher-side H23: early layers carry **57%** of the numeric shift at **zero** direct-readout fraction (0/5 lineages) | **reconcilable -- our strongest contribution** |
| fragile; paraphrasing suppresses it | nothing. No prompt-format sensitivity anywhere in the ledger | **gap** |
| works under HARD distillation (their stated surprise) | this entire program is hard distillation at 160M | **confirms, and we can explain it** |

- **Contribution 1 -- the early/late reconciliation.** Their early-layer
  sufficiency (teacher) and our late-layer credit concentration (student) are
  both true of different objects, and H23 supplies the link: early teacher
  layers move numbers substantially but NOT by direct decoder write (direct
  fraction ~0); late layers write DIRECTLY (0.64). Signal is emitted early by an
  indirect route and absorbed late by the student's credit assignment.
- **Contribution 2 -- a mechanism for why hard distillation works.** They flag
  this as surprising and leave it unexplained. H19 answers it: the carrier is a
  MARGINAL token-frequency bias, exactly the statistic that survives sampling
  (~240 extra occurrences vs counting noise ~40 over a student's ~57,000 numeric
  tokens; ~6 sigma). Soft distillation transmits the full distribution; hard
  distillation transmits the marginal, and the marginal suffices.
- **Contribution 3 -- their causal test may not discriminate.** Our data put
  their divergence tokens at **9.3x enrichment** for near-coin-flip positions
  (gap 0.0346 vs 0.3221). If DTs are simply where a marginal bias becomes
  argmax-visible, masking them also removes most of the marginal shift, so the
  masking result is consistent with BOTH "rare tokens are the carrier" and "a
  dense marginal field is the carrier, visible at rare tokens."
  **DISCRIMINATING EXPERIMENT (unrun, highest value)**: resample student
  training numbers to preserve the teacher's MARGINAL frequencies while
  scrambling context-conditional structure. Transfer survives -> marginal is the
  carrier (ours). Transfer dies -> theirs. Neither paper has run this.
- **Gaps to close before submission**: (i) fragility/paraphrase sensitivity --
  regenerate pools under paraphrased numeric prompts; reviewers will ask, and
  either outcome is publishable. (ii) learner-side DT necessity -- the
  2026-07-24 entry already specified the design (separate P-recovered DT
  positions, residual DT positions, and matched non-DT high-margin positions in
  student training) and it was never run; this is the direct replication of
  their causal claim in our setup.
- **Uncontested by their paper** (initialization is never discussed in it): the
  init/order 2x2 gate-vs-gain result, the dual-use reversible subspace,
  credit-side factorization (phi_D ~ kappa, phi_X ~ 0), knockout
  loss-equivalence, H16/H21 substrate convergence, and H22/H23 direct-write.

### 2026-07-28 — H24 registered: LIVE B-output-cotangent factorial (the causal test the credit-side claim has been missing)
- **Why**: the credit-side account rests on ONE prospective measurement (the
  2026-07-16/17 local factorization: phi_D ~ kappa, phi_X ~ 0, two seeds). That
  assay is explicit that it is "local bilinear counterfactuals, not standalone
  forward passes" and "does not prove necessity/sufficiency for endpoint SL".
  Its own designated follow-up -- "a live B-output-cotangent factorial: natural,
  D-null, D-swap, X-swap, and energy-matched sham, with both A/B gradients
  derived coherently and numeric-NLL noninferiority required" -- appears exactly
  once in the ledger, at registration, and was never run. H24 runs it.
- **What changes vs the earlier assay**: this is LIVE. Gradients are actually
  substituted, optimizer steps are actually taken, and the readout is the
  student's endpoint held-out wolf margin -- not a gradient alignment score.
- **Mechanics**. PEFT LoRA forward is
  `base(x) + lora_B(lora_A(x)) * scaling`. Per wrapped module we capture
  x_A (input to lora_A), x_B = lora_A(x_A), and d_B (cotangent at lora_B's
  output) on BOTH a preference micro-batch and its row-aligned control
  micro-batch. Gradients are then rebuilt coherently from a single substitution
  at the cotangent entering the LoRA branch:
      grad_W_B = d_B^T x_B
      grad_W_A = (d_B W_B)^T x_A
  so swapping d_B propagates to A as well -- this is what "both A/B gradients
  derived coherently" requires, and it is why the intervention is at B's output
  rather than independently at each Linear.
- **Precondition verified before launch**: the preference and control pools are
  row-aligned on prompts (8192/8192) and tokenize to IDENTICAL lengths (0
  mismatches in 400 sampled pairs), so position-wise correspondence in the outer
  products is exact rather than approximate.
- **Arms** (identical data order, schedule, seeds; only the gradient construction
  differs):
    natural  grad from (d_P, x_P)      -- ordinary preference training
    control  grad from (d_C, x_C)      -- ordinary control training, the null
    D_swap   grad from (d_C, x_P)      -- preference INPUTS, control CREDIT
    X_swap   grad from (d_P, x_C)      -- preference CREDIT, control INPUTS
    sham     grad from (d_sham, x_P)   -- per-module energy-matched random credit
- **Frozen predictions** (credit-side account):
  - P1 (sanity) natural endpoint wolf-margin delta > control's, both seeds.
  - P2 X_swap retains the effect: X_swap delta >= 60% of natural's, both seeds.
  - P3 D_swap loses it: D_swap delta <= 40% of natural's, both seeds.
  - P4 sham <= control + noise; sham must not reproduce natural.
  - **FALSIFIER (input-side)**: D_swap >= natural while X_swap <= control --
    i.e. what matters is whose INPUTS you train on, not whose credit.
  - **FALSIFIER (neither)**: both swaps ~ natural -- neither factor is
    individually necessary and the bilinear decomposition does not carry
    causal weight.
  - **Noninferiority gate**: all arms must fit numbers comparably (held-out
    numeric NLL within 0.05 nats of natural); a wolf difference accompanied by
    an NLL blowout is a training-quality artifact, not a credit result.
- **Integrity check required at update 0**: for the `natural` arm the
  hand-constructed grad_W_A / grad_W_B must match PyTorch autograd's `.grad`
  to <=1e-5 relative on every LoRA tensor. If it does not, the factorization is
  mis-specified and the run aborts.
- Setup: standard pythia-160m base (the canonical (i,o) cell), confirm_v3_b1
  paired pools, LoRA r=8 alpha=16 on all four GPT-NeoX linear types, lr 2e-4,
  batch 8 x grad-accum 2, dose **256** updates, warmup 8, linear decay over 256,
  grad-clip 1.0, Pythia optimizer geometry. Two seeds. Readout: 60 held-out
  preference prompts (deterministic logit margin) + held-out numeric NLL.
  Seeds 87xxx. Script: `scripts/cotangent_factorial_v1.py`.

### 2026-07-28 — H24 RESULT: the trait installs through the CREDIT SIGNAL, not the data. Credit-side account now causal, not correlational.
- The designated follow-up from 2026-07-16/17, unrun for eleven days, now run.
- **Integrity, checked before any result was read**: the hand-built gradients
  (grad_W_B = d^T x_B, grad_W_A = (d W_B)^T x_A) match PyTorch autograd to
  **0.00e+00 relative error over all 96 LoRA tensors**, verified at update 5 with
  B nonzero (at update 0 B is zero-initialised and the A check would pass
  vacuously -- the check was deliberately moved). So the substituted gradients
  are the exact gradients under each swap, not an approximation.
- **Result** (dose 256, two seeds, identical data order/schedule/seeds across
  arms; only the gradient construction differs):

  | arm | credit from | inputs from | seed 87001 | seed 87002 | mean | numeric NLL |
  | --- | --- | --- | ---: | ---: | ---: | ---: |
  | natural | preference | preference | +0.4891 | +0.4402 | **+0.4646** | 2.7778 |
  | **X_swap** | **preference** | control | +0.5491 | +0.4645 | **+0.5068** | 2.7789 |
  | D_swap | control | preference | -0.1682 | -0.0914 | **-0.1298** | 2.8050 |
  | control | control | control | -0.3110 | -0.1586 | **-0.2348** | 2.8048 |
  | sham | random | preference | +0.1020 | -0.0426 | **+0.0297** | 3.2552 |

- **The headline**: in the X_swap arm the student's forward pass NEVER processes a
  preference-teacher number -- every activation it sees comes from control-teacher
  data -- and it acquires the trait at **109% of natural** (mean +0.5068 vs
  +0.4646). Meanwhile D_swap trains entirely ON preference-teacher numbers,
  receives the control teacher's error signal, and gets **nothing** (-0.1298,
  near control's -0.2348). The effect tracks the CREDIT, not the data.
- **Frozen verdict: P1/P2/P3/P4 all TRUE; both falsifiers FALSE.**
  X_swap was 112%/106% of natural (bar: >=60%); D_swap was -34%/-21% (bar: <=40%).
- **This upgrades the credit-side claim from correlational to causal.** The
  2026-07-16/17 factorization measured gradient ALIGNMENT (phi_D ~ kappa,
  phi_X ~ 0) and stated outright that it did not establish necessity or
  sufficiency for endpoint SL. H24 intervenes on the credit signal and reads the
  student's endpoint held-out wolf margin. Same decomposition, now demonstrated
  rather than inferred.
- **Noninferiority: the boolean reads False, and the reason matters.** It fails on
  the SHAM arm alone: matched-energy random credit degrades numeric fit by ~0.48
  nats (3.2552 vs 2.7778), so sham is a degenerate arm and cannot be read as a
  clean control -- though it satisfies P4 and its failure is itself informative
  (the credit signal cannot be faked with norm-matched noise without destroying
  the task fit). **The four arms carrying the claim -- natural, X_swap, D_swap,
  control -- sit within 0.03 nats of each other (2.7778/2.7789/2.8050/2.8048),
  so the contrast that matters is clean.** Do not cite the aggregate boolean
  without this breakdown.
- **Scope and limits, stated rather than implied**: two seeds at dose 256 on the
  standard lineage only; the separation (natural-control gap 0.80/0.60) is large
  relative to across-seed spread, but this is not a k=8 confirmation. The
  intervention is at the LoRA branch cotangent, so it speaks to credit routing
  within the trained adapter tangent, not to full-parameter fine-tuning. It does
  not show WHY the preference cotangent aligns wolfward -- only that it, and not
  the forward activations, is what carries the trait into the student.
- **Consequence for the account**: link 3 ("training on the output shift induces
  the trait because it is the general solution, and credit is routed to the trait
  circuit") is now the best-evidenced link in the chain rather than the most
  interpretive. Combined with H22/H23 on the sender side, the pipeline reads:
  compact circuit writes trait into number logits directly -> sampled numbers
  carry a marginal frequency bias -> that bias reshapes the student's BACKWARD
  error signal -> credit routes to the student's homologous circuit.
  Artifacts: `scripts/cotangent_factorial_v1.py`,
  `runs/cotangent_factorial_v1.md`, `runs/cotangent_factorial_v1/results.json`.

### 2026-09-02 — Equal-example batch contour registered (Pythia SL recipe calibration)
- **Reason for the change**: the fixed-update screens confound batch geometry
  with example exposure. At 1,000 updates EB2 sees 2,000 examples while EB16
  sees 16,000, so weak EB2/EB4 results cannot distinguish insufficient carrier
  coverage from a genuinely harmful small batch. The in-progress fixed-2,560
  sweep was stopped before EB32 completed at the user's direction. Its completed
  exploratory endpoints are retained: EB8 +1.1451 and EB16 +1.2102 mean paired
  wolf-margin transfer over two blocks. They are not an equal-exposure result.
- **Question**: at identical exposure to the full carrier bank, which effective
  batch gives the largest paired subliminal wolf transfer? The working account
  predicts a tradeoff: very small batches may contain too few divergence events
  per update, while very large batches give Adam too few moment/state updates.
- **Frozen contour**: EB2/4/8/16/32/64/128; the same 8,192 carrier rows are
  presented exactly once per arm. Therefore optimizer updates are respectively
  4,096/2,048/1,024/512/256/128/64. Two paired development blocks use the
  existing carrier pools and student seeds 91001/91002.
- **Example-indexed optimizer clock**: preserve the canonical EB16 schedule in
  example coordinates. Warmup is 128 examples (64/32/16/8/4/2/1 updates), and
  the linear LR horizon is 81,920 examples
  (40,960/20,480/10,240/5,120/2,560/1,280/640 updates). LR remains 2e-4 for
  every batch. This intentionally tests the practical hypothesis that additional
  Adam transitions at smaller batch improve transfer; it is not a pure
  stochastic-gradient-noise isolation.
- **Matched probes**: E=0/2,048/4,096/8,192 examples per arm, translated to the
  corresponding update for each batch. Primary readout is the paired
  preference-carrier minus base-carrier mean wolf-target logit margin on the
  frozen 60-prompt evaluation set. All batches and both blocks continue without
  optional stopping.
- **Interpretation registered before launch**: a flat equal-example contour
  attributes the prior fixed-update differences mainly to exposure; a small-
  batch advantage supports repeated/bursty adaptive accumulation; a large-batch
  advantage supports cleaner distribution estimates; an interior maximum
  supports a coverage-versus-update tradeoff. Because clipping is already near
  saturated at EB2/4, any claimed mechanism requires a later clipping ablation
  and more independent blocks.
- **Implementation**:
  `scripts/max_transfer_equal_examples_one_pass.py` and
  `configs/max_transfer_equal_examples_eb*_one_pass.yaml`. Status at
  registration: code/tests complete; no result inspected and no cell launched.

### 2026-09-02 — Equal-example batch contour RESULT (development screen; no held-out confirmation)
- All fourteen registered cells completed: EB2/4/8/16/32/64/128 across the two
  development blocks. Every endpoint was positive in both blocks. These remain
  development results; the summary explicitly sets
  `confirmatory_claim_authorized=false` and no held-out blocks were run.
- At exactly one presentation of the same 8,192 carrier rows per arm, mean
  paired wolf-margin effects were:

  | effective batch | optimizer updates | mean paired effect |
  | ---: | ---: | ---: |
  | 2 | 4,096 | **+0.9376** |
  | 4 | 2,048 | +0.7891 |
  | 8 | 1,024 | +0.8010 |
  | 16 | 512 | +0.8933 |
  | 32 | 256 | +0.7019 |
  | 64 | 128 | +0.6475 |
  | 128 | 64 | +0.5883 |

- Smaller batches were generally favored at equal exposure, but the contour
  was not monotone. EB2 peaked at **+0.9758** after 4,096 examples (half a
  pass) and ended at +0.9376. The result supports an optimizer-transition or
  gradient-noise contribution beyond raw example exposure, but does not isolate
  it: clipping is near saturation in the smallest cells and schedule position
  still differs in update coordinates.
- Canonical artifact:
  `runs/max_transfer_equal_examples_one_pass_summary.json`.

## Seed registry

| Range | Use |
| --- | --- |
| 2101/2102 | H11 paired teacher trait/fingerprint ontogeny |
| 42xxx | confirm_v3 students |
| 51xxx | dose pilot |
| 52xxx | v4-proper (reserved, unused) |
| 53xxx | dose 10-epoch |
| 54xxx | 2×2 (i*,o) standard-teacher |
| 55xxx | 2×2 (i,o*) standard-teacher (superseded by anchor-free 56/57) |
| 56xxx | re-anchored data-order pairs, matched across (i,o)/(i,o*) |
| 57xxx | superseded partial data-seed1-anchor (i,o*) range |
| 58xxx | optimizer-transplant recipient order, split, and permutation guards |
| 59xxx | capstone confirmatory fresh students |
| 61xxx | crossover |
| 70xxx/71xxx | invalid weight-seed1-teacher pilot (discarded) |
| 81xxx | H15 random-perturbation control arms (81001-3 patches, 81501 baseline) |
| 82xxx | H16 near-boundary contexts (82001) and baseline (82501) |
| 83xxx | H18 random null draws for the trait-axis projection (83001-83020) |
| 84xxx | H19-confirm fresh wolf_C/wolf_D/lion_B/lion_C (data 84001-4, train 84101-4) |
| 85xxx | H21 response-subspace random rank-1 perturbations (85001-85024) |
| 87xxx | H24 live cotangent factorial students (87001/87002) + sham draws (87501) |
| 99xxx | divergence probes (99001) and sampled reference paths (99501) |
