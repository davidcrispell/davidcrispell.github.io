# H24: live B-output-cotangent factorial

Gradients rebuilt as grad_W_B = d^T x_B, grad_W_A = (d W_B)^T x_A, so a swapped cotangent propagates coherently to both LoRA factors. Dose 256, two seeds, identical data order and schedule across arms.

Update-5 integrity (with LoRA-B nonzero): max relative error vs autograd
**0.00e+00** over 96 LoRA tensors. The check was deliberately moved from
update 0 because zero-initialized LoRA-B would make the LoRA-A comparison
vacuous there.

| arm | credit from | inputs from | delta (seed 87001) | delta (seed 87002) | mean | numeric NLL |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| **natural** | preference | preference | +0.4891 | +0.4402 | **+0.4646** | 2.7778 |
| **control** | control | control | -0.3110 | -0.1586 | **-0.2348** | 2.8048 |
| **D_swap** | control | preference | -0.1682 | -0.0914 | **-0.1298** | 2.8050 |
| **X_swap** | preference | control | +0.5491 | +0.4645 | **+0.5068** | 2.7789 |
| **sham** | random | preference | +0.1020 | -0.0426 | **+0.0297** | 3.2552 |

## Verdict against frozen predictions

- P1_natural_beats_control_both_seeds: **True**
- P2_Xswap_at_least_60pct_of_natural_both_seeds: **True**
- P3_Dswap_at_most_40pct_of_natural_both_seeds: **True**
- P4_sham_does_not_reproduce_natural: **True**
- FALSIFIER_input_side: **False**
- FALSIFIER_neither_factor_necessary: **False**
- noninferiority_all_arms_within_0.05_nats: **False**
