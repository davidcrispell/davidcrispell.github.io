# Numeric fingerprint dynamics v1

Frozen decision: **transient_access**.

The primary effect is `wolf margin(preference-trained) - wolf margin(control-trained)` on the same 60 held-out animal prompts.

| update | standard mean | weight-seed3 mean | ws3 - standard | ws3 / standard |
|---:|---:|---:|---:|---:|
| 0 | 0.000000 | 0.000000 | 0.000000 | null |
| 1 | 0.001171 | 0.000703 | -0.000469 | 0.5998 |
| 4 | 0.007503 | 0.007797 | 0.000294 | 1.0392 |
| 16 | -0.016991 | 0.066598 | 0.083589 | null |
| 64 | 0.150499 | 0.190693 | 0.040194 | 1.2671 |
| 128 | 0.229214 | 0.300761 | 0.071547 | 1.3121 |
| 256 | 0.404116 | 0.124564 | -0.279553 | 0.3082 |
| 512 | 0.471407 | 0.134724 | -0.336683 | 0.2858 |
| 1024 | 0.701845 | 0.111303 | -0.590542 | 0.1586 |
| 1536 | 0.659643 | 0.034005 | -0.625638 | 0.0516 |
| 2048 | 0.646216 | -0.003082 | -0.649298 | -0.0048 |
| 2560 | 0.632038 | 0.005449 | -0.626589 | 0.0086 |

## Frozen endpoint change

| receiver | discovery D | validation D |
|---|---:|---:|
| standard | -0.108776 | 0.430038 |
| weight_seed3 | -0.144100 | -0.114451 |

`D = E(2560) - E(512)`. Ratios are null whenever the standard mean effect is nonpositive. Loss, clipping, and named LoRA/Adam summaries are recorded in the JSON as descriptive diagnostics.

Runner lock: `0613692b42b05f61cfe1a6c58b2910779a29bcaee4548137bc329e863d234092`
Config: `5da26d9d591a35b1e046c89b5d33a408c39be5e745598c157e99f504bd3ef8f8`
