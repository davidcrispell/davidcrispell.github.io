# Optimizer anatomy reanalysis v1

Across the completed exact-state update-geometry measurements, how do raw numeric gradients, Adam first-moment accumulation, live second-moment preconditioning, and the realized optimizer update differ in their alignment with the receiver's local wolf-margin gradient over training?

This is a zero-compute descriptive reanalysis of the 72 completed exact-state update-geometry cells. No model, optimizer, dataset, tensor runtime, or accelerator was loaded.

Dot is native-scale first-order wolf-margin movement. Projection/update-L2 is the primary norm-controlled within-source-state comparison. Branch cosine additionally divides by the stored positive local wolf-gradient norm. Cross-state entries are differences or averages of local metrics, not a cosine between cross-state vectors.

## Same-state preference-vs-control data anatomy

Phase means below are the factorial same-state data main effect D.

| receiver | seed | phase | component | D dot | D projection/update-L2 | D local-cosine contrast |
|---|---:|---|---|---:|---:|---:|
| standard | 56101 | onset | raw_gradient | +0.000123 | +0.868471 | +0.054179 |
| standard | 56101 | onset | unpreconditioned_momentum | +2.1092e-05 | +0.521398 | +0.034771 |
| standard | 56101 | onset | adam_history_under_live_v | +0.000264 | +0.010402 | +0.000579 |
| standard | 56101 | onset | adam_current_under_live_v | +0.005160 | +0.179338 | +0.010199 |
| standard | 56101 | onset | adam_total_adaptive | +0.005424 | +0.077549 | +0.004482 |
| standard | 56101 | onset | actual_update | +0.005424 | +0.077557 | +0.004482 |
| standard | 56101 | emergence | raw_gradient | +6.8079e-05 | +0.361363 | +0.016689 |
| standard | 56101 | emergence | unpreconditioned_momentum | +6.8085e-06 | +0.138818 | +0.006391 |
| standard | 56101 | emergence | adam_history_under_live_v | +0.000134 | +0.003673 | +0.000169 |
| standard | 56101 | emergence | adam_current_under_live_v | +0.004475 | +0.187939 | +0.008680 |
| standard | 56101 | emergence | adam_total_adaptive | +0.004608 | +0.085635 | +0.003938 |
| standard | 56101 | emergence | actual_update | +0.004608 | +0.085629 | +0.003938 |
| standard | 56101 | transition | raw_gradient | +7.8098e-05 | +0.456789 | +0.020090 |
| standard | 56101 | transition | unpreconditioned_momentum | +7.8098e-06 | +0.181202 | +0.007999 |
| standard | 56101 | transition | adam_history_under_live_v | +5.3222e-05 | +0.000773 | +3.4770e-05 |
| standard | 56101 | transition | adam_current_under_live_v | +0.002763 | +0.151049 | +0.006663 |
| standard | 56101 | transition | adam_total_adaptive | +0.002816 | +0.060887 | +0.002691 |
| standard | 56101 | transition | actual_update | +0.002816 | +0.060882 | +0.002691 |
| standard | 56101 | attenuation | raw_gradient | +3.7304e-05 | +0.683575 | +0.024740 |
| standard | 56101 | attenuation | unpreconditioned_momentum | +3.7304e-06 | +0.306318 | +0.011102 |
| standard | 56101 | attenuation | adam_history_under_live_v | +1.4114e-05 | +0.000598 | +2.1312e-05 |
| standard | 56101 | attenuation | adam_current_under_live_v | +0.001003 | +0.184360 | +0.006737 |
| standard | 56101 | attenuation | adam_total_adaptive | +0.001017 | +0.071628 | +0.002619 |
| standard | 56101 | attenuation | actual_update | +0.001017 | +0.071629 | +0.002619 |
| standard | 56102 | onset | raw_gradient | +4.0838e-05 | +0.203895 | +0.011946 |
| standard | 56102 | onset | unpreconditioned_momentum | +4.8776e-06 | +0.084259 | +0.004937 |
| standard | 56102 | onset | adam_history_under_live_v | +0.000172 | +0.006555 | +0.000377 |
| standard | 56102 | onset | adam_current_under_live_v | +0.003709 | +0.139521 | +0.009240 |
| standard | 56102 | onset | adam_total_adaptive | +0.003882 | +0.091193 | +0.006407 |
| standard | 56102 | onset | actual_update | +0.003882 | +0.091200 | +0.006407 |
| standard | 56102 | emergence | raw_gradient | -1.0944e-05 | -0.049887 | -0.002734 |
| standard | 56102 | emergence | unpreconditioned_momentum | -1.0969e-06 | -0.035457 | -0.001891 |
| standard | 56102 | emergence | adam_history_under_live_v | +5.8433e-05 | +0.000856 | +4.7021e-05 |
| standard | 56102 | emergence | adam_current_under_live_v | +0.000431 | +0.028144 | +0.001461 |
| standard | 56102 | emergence | adam_total_adaptive | +0.000489 | +0.013870 | +0.000730 |
| standard | 56102 | emergence | actual_update | +0.000489 | +0.013877 | +0.000730 |
| standard | 56102 | transition | raw_gradient | +4.1906e-05 | +0.227012 | +0.008938 |
| standard | 56102 | transition | unpreconditioned_momentum | +4.1906e-06 | +0.097021 | +0.003765 |
| standard | 56102 | transition | adam_history_under_live_v | -0.000120 | -0.003369 | -0.000172 |
| standard | 56102 | transition | adam_current_under_live_v | +0.003559 | +0.169108 | +0.007576 |
| standard | 56102 | transition | adam_total_adaptive | +0.003439 | +0.078012 | +0.003520 |
| standard | 56102 | transition | actual_update | +0.003439 | +0.078009 | +0.003520 |
| standard | 56102 | attenuation | raw_gradient | +8.0013e-05 | +0.902061 | +0.035862 |
| standard | 56102 | attenuation | unpreconditioned_momentum | +8.0013e-06 | +0.357124 | +0.014166 |
| standard | 56102 | attenuation | adam_history_under_live_v | +1.1360e-05 | +0.001576 | +5.9459e-05 |
| standard | 56102 | attenuation | adam_current_under_live_v | +0.001857 | +0.235433 | +0.009328 |
| standard | 56102 | attenuation | adam_total_adaptive | +0.001868 | +0.090289 | +0.003559 |
| standard | 56102 | attenuation | actual_update | +0.001868 | +0.090302 | +0.003559 |
| weight_seed3 | 56101 | onset | raw_gradient | +4.5931e-07 | +0.074466 | +0.005125 |
| weight_seed3 | 56101 | onset | unpreconditioned_momentum | +1.8703e-06 | +0.079369 | +0.005415 |
| weight_seed3 | 56101 | onset | adam_history_under_live_v | -0.000138 | -0.004107 | -0.000231 |
| weight_seed3 | 56101 | onset | adam_current_under_live_v | +0.003436 | +0.127216 | +0.007409 |
| weight_seed3 | 56101 | onset | adam_total_adaptive | +0.003298 | +0.061735 | +0.003720 |
| weight_seed3 | 56101 | onset | actual_update | +0.003298 | +0.061739 | +0.003720 |
| weight_seed3 | 56101 | emergence | raw_gradient | +0.000137 | +0.763747 | +0.037613 |
| weight_seed3 | 56101 | emergence | unpreconditioned_momentum | +1.3756e-05 | +0.244437 | +0.012000 |
| weight_seed3 | 56101 | emergence | adam_history_under_live_v | +0.000136 | +0.003118 | +0.000161 |
| weight_seed3 | 56101 | emergence | adam_current_under_live_v | +0.004303 | +0.209281 | +0.010354 |
| weight_seed3 | 56101 | emergence | adam_total_adaptive | +0.004439 | +0.086625 | +0.004306 |
| weight_seed3 | 56101 | emergence | actual_update | +0.004439 | +0.086621 | +0.004306 |
| weight_seed3 | 56101 | transition | raw_gradient | +7.4043e-05 | +0.553514 | +0.028646 |
| weight_seed3 | 56101 | transition | unpreconditioned_momentum | +7.4043e-06 | +0.245266 | +0.012705 |
| weight_seed3 | 56101 | transition | adam_history_under_live_v | -0.000129 | -0.002857 | -0.000148 |
| weight_seed3 | 56101 | transition | adam_current_under_live_v | +0.002717 | +0.143877 | +0.007471 |
| weight_seed3 | 56101 | transition | adam_total_adaptive | +0.002589 | +0.059826 | +0.003109 |
| weight_seed3 | 56101 | transition | actual_update | +0.002589 | +0.059822 | +0.003109 |
| weight_seed3 | 56101 | attenuation | raw_gradient | +1.3885e-05 | +0.286694 | +0.013315 |
| weight_seed3 | 56101 | attenuation | unpreconditioned_momentum | +1.3885e-06 | +0.141410 | +0.006612 |
| weight_seed3 | 56101 | attenuation | adam_history_under_live_v | -2.7632e-05 | -0.001231 | -5.8639e-05 |
| weight_seed3 | 56101 | attenuation | adam_current_under_live_v | +0.000104 | +0.040863 | +0.001820 |
| weight_seed3 | 56101 | attenuation | adam_total_adaptive | +7.6144e-05 | +0.013893 | +0.000609 |
| weight_seed3 | 56101 | attenuation | actual_update | +7.6144e-05 | +0.013895 | +0.000609 |
| weight_seed3 | 56102 | onset | raw_gradient | +2.2492e-05 | +0.125518 | +0.007794 |
| weight_seed3 | 56102 | onset | unpreconditioned_momentum | +3.0189e-06 | +0.056273 | +0.003662 |
| weight_seed3 | 56102 | onset | adam_history_under_live_v | +5.9425e-05 | +0.002266 | +0.000137 |
| weight_seed3 | 56102 | onset | adam_current_under_live_v | +0.001556 | +0.055801 | +0.003610 |
| weight_seed3 | 56102 | onset | adam_total_adaptive | +0.001616 | +0.032506 | +0.002222 |
| weight_seed3 | 56102 | onset | actual_update | +0.001616 | +0.032509 | +0.002222 |
| weight_seed3 | 56102 | emergence | raw_gradient | +5.8900e-05 | +0.316610 | +0.018256 |
| weight_seed3 | 56102 | emergence | unpreconditioned_momentum | +5.8888e-06 | +0.167814 | +0.009703 |
| weight_seed3 | 56102 | emergence | adam_history_under_live_v | +3.6873e-05 | +0.000893 | +5.6636e-05 |
| weight_seed3 | 56102 | emergence | adam_current_under_live_v | +0.000335 | +0.023890 | +0.001639 |
| weight_seed3 | 56102 | emergence | adam_total_adaptive | +0.000372 | +0.009008 | +0.000643 |
| weight_seed3 | 56102 | emergence | actual_update | +0.000372 | +0.009020 | +0.000644 |
| weight_seed3 | 56102 | transition | raw_gradient | +7.1460e-05 | +0.473213 | +0.026925 |
| weight_seed3 | 56102 | transition | unpreconditioned_momentum | +7.1460e-06 | +0.213861 | +0.012473 |
| weight_seed3 | 56102 | transition | adam_history_under_live_v | +0.000128 | +0.003154 | +0.000182 |
| weight_seed3 | 56102 | transition | adam_current_under_live_v | +0.004382 | +0.218120 | +0.012449 |
| weight_seed3 | 56102 | transition | adam_total_adaptive | +0.004510 | +0.101289 | +0.005849 |
| weight_seed3 | 56102 | transition | actual_update | +0.004510 | +0.101293 | +0.005849 |
| weight_seed3 | 56102 | attenuation | raw_gradient | +2.0016e-05 | +0.189793 | +0.009442 |
| weight_seed3 | 56102 | attenuation | unpreconditioned_momentum | +2.0016e-06 | +0.071685 | +0.003587 |
| weight_seed3 | 56102 | attenuation | adam_history_under_live_v | -3.8922e-05 | -0.000641 | -3.5992e-05 |
| weight_seed3 | 56102 | attenuation | adam_current_under_live_v | -0.000102 | -0.025793 | -0.001213 |
| weight_seed3 | 56102 | attenuation | adam_total_adaptive | -0.000141 | -0.017982 | -0.000863 |
| weight_seed3 | 56102 | attenuation | actual_update | -0.000141 | -0.017983 | -0.000863 |

## Ordered optimizer-path deltas

These are descriptive differences in the same-state D summaries. They are not causal or Shapley attributions.

| receiver | seed | phase | path delta | dot change | projection/update-L2 change | local-cosine contrast change |
|---|---:|---|---|---:|---:|---:|
| standard | 56101 | onset | momentum_minus_raw | -0.000101 | -0.347074 | -0.019408 |
| standard | 56101 | onset | adaptive_minus_momentum | +0.005403 | -0.443849 | -0.030289 |
| standard | 56101 | onset | actual_minus_adaptive | -2.0156e-10 | +8.1685e-06 | +4.5859e-07 |
| standard | 56101 | emergence | momentum_minus_raw | -6.1271e-05 | -0.222545 | -0.010298 |
| standard | 56101 | emergence | adaptive_minus_momentum | +0.004601 | -0.053183 | -0.002453 |
| standard | 56101 | emergence | actual_minus_adaptive | -1.9530e-09 | -6.2020e-06 | -2.9694e-07 |
| standard | 56101 | transition | momentum_minus_raw | -7.0288e-05 | -0.275586 | -0.012091 |
| standard | 56101 | transition | adaptive_minus_momentum | +0.002808 | -0.120315 | -0.005308 |
| standard | 56101 | transition | actual_minus_adaptive | +1.0429e-09 | -5.3792e-06 | -2.3317e-07 |
| standard | 56101 | attenuation | momentum_minus_raw | -3.3574e-05 | -0.377258 | -0.013638 |
| standard | 56101 | attenuation | adaptive_minus_momentum | +0.001014 | -0.234690 | -0.008483 |
| standard | 56101 | attenuation | actual_minus_adaptive | +7.7427e-09 | +9.3643e-07 | +2.8843e-08 |
| standard | 56102 | onset | momentum_minus_raw | -3.5961e-05 | -0.119636 | -0.007009 |
| standard | 56102 | onset | adaptive_minus_momentum | +0.003877 | +0.006934 | +0.001469 |
| standard | 56102 | onset | actual_minus_adaptive | -5.0550e-11 | +6.2087e-06 | +3.6237e-07 |
| standard | 56102 | emergence | momentum_minus_raw | +9.8474e-06 | +0.014430 | +0.000843 |
| standard | 56102 | emergence | adaptive_minus_momentum | +0.000490 | +0.049327 | +0.002621 |
| standard | 56102 | emergence | actual_minus_adaptive | +5.2969e-10 | +6.6329e-06 | +3.5777e-07 |
| standard | 56102 | transition | momentum_minus_raw | -3.7715e-05 | -0.129991 | -0.005173 |
| standard | 56102 | transition | adaptive_minus_momentum | +0.003435 | -0.019009 | -0.000245 |
| standard | 56102 | transition | actual_minus_adaptive | +3.8981e-09 | -2.8771e-06 | -9.0258e-08 |
| standard | 56102 | attenuation | momentum_minus_raw | -7.2011e-05 | -0.544937 | -0.021695 |
| standard | 56102 | attenuation | adaptive_minus_momentum | +0.001860 | -0.266835 | -0.010607 |
| standard | 56102 | attenuation | actual_minus_adaptive | -7.4888e-09 | +1.3460e-05 | +5.2060e-07 |
| weight_seed3 | 56101 | onset | momentum_minus_raw | +1.4110e-06 | +0.004903 | +0.000291 |
| weight_seed3 | 56101 | onset | adaptive_minus_momentum | +0.003296 | -0.017634 | -0.001696 |
| weight_seed3 | 56101 | onset | actual_minus_adaptive | -5.0104e-10 | +3.4238e-06 | +1.9336e-07 |
| weight_seed3 | 56101 | emergence | momentum_minus_raw | -0.000124 | -0.519311 | -0.025613 |
| weight_seed3 | 56101 | emergence | adaptive_minus_momentum | +0.004425 | -0.157811 | -0.007694 |
| weight_seed3 | 56101 | emergence | actual_minus_adaptive | -4.4057e-11 | -4.4326e-06 | -2.5194e-07 |
| weight_seed3 | 56101 | transition | momentum_minus_raw | -6.6639e-05 | -0.308249 | -0.015940 |
| weight_seed3 | 56101 | transition | adaptive_minus_momentum | +0.002581 | -0.185439 | -0.009596 |
| weight_seed3 | 56101 | transition | actual_minus_adaptive | -3.6467e-10 | -4.4777e-06 | -2.2877e-07 |
| weight_seed3 | 56101 | attenuation | momentum_minus_raw | -1.2496e-05 | -0.145284 | -0.006702 |
| weight_seed3 | 56101 | attenuation | adaptive_minus_momentum | +7.4755e-05 | -0.127517 | -0.006004 |
| weight_seed3 | 56101 | attenuation | actual_minus_adaptive | +2.5724e-10 | +2.4427e-06 | +1.1596e-07 |
| weight_seed3 | 56102 | onset | momentum_minus_raw | -1.9473e-05 | -0.069245 | -0.004132 |
| weight_seed3 | 56102 | onset | adaptive_minus_momentum | +0.001613 | -0.023767 | -0.001440 |
| weight_seed3 | 56102 | onset | actual_minus_adaptive | -1.7208e-10 | +2.5889e-06 | +1.5626e-07 |
| weight_seed3 | 56102 | emergence | momentum_minus_raw | -5.3011e-05 | -0.148797 | -0.008552 |
| weight_seed3 | 56102 | emergence | adaptive_minus_momentum | +0.000366 | -0.158806 | -0.009060 |
| weight_seed3 | 56102 | emergence | actual_minus_adaptive | -9.4179e-10 | +1.2478e-05 | +7.2607e-07 |
| weight_seed3 | 56102 | transition | momentum_minus_raw | -6.4314e-05 | -0.259352 | -0.014452 |
| weight_seed3 | 56102 | transition | adaptive_minus_momentum | +0.004503 | -0.112572 | -0.006624 |
| weight_seed3 | 56102 | transition | actual_minus_adaptive | +1.6058e-09 | +3.8556e-06 | +2.4302e-07 |
| weight_seed3 | 56102 | attenuation | momentum_minus_raw | -1.8014e-05 | -0.118108 | -0.005855 |
| weight_seed3 | 56102 | attenuation | adaptive_minus_momentum | -0.000143 | -0.089667 | -0.004450 |
| weight_seed3 | 56102 | attenuation | actual_minus_adaptive | -9.7613e-10 | -9.0834e-07 | -4.4712e-08 |

## Integrity

- Source cells: 72
- Measurement branches: 144
- Cell/measurement inventory SHA256: 5b87279732bdca1760f568407e3f2f0a74c6c9395b706c7211e1cfc2659c0ed4
- Maximum history + current minus adaptive dot error: 7.972e-10
- Maximum actual minus manual projection error: 8.939e-12
- Undefined cosines by component: {"actual_update": 0, "adam_current_under_live_v": 0, "adam_history_under_live_v": 16, "adam_total_adaptive": 0, "raw_gradient": 0, "unpreconditioned_momentum": 0}
- All checks passed: yes

## Interpretation limits

- Projection differences mix alignment and native optimizer scale; use projection/update-L2 beside dot.
- Momentum and second-moment scaling interact. The ordered differences are descriptive, not unique causal allocations.
- Adam history/current pieces share the live updated-v denominator, which includes the current batch gradient squared.
- Live paired S crosses different parameter states. The primary alignment comparison here is the within-source-state preference-vs-control data effect and its factorial mean D.
- Every trait gradient is local to its saved LoRA state. Cross-time and cross-state values are comparisons of local metrics, not one fixed trait vector.
