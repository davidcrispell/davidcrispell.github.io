# H19-confirm: marginal token frequency as the trait carrier

Preregistered: P1 same-trait ~0.93-0.96; P2 cross-trait ~0.72-0.78; P3 random ~0.50; P4 (strong) min(same) - max(cross) > 0.10.

| pair | same trait? | sign agreement | cosine |
| --- | :---: | ---: | ---: |
| wolf_A__wolf_C | YES | 0.949 | +0.830 |
| wolf_A__wolf_B | YES | 0.947 | +0.926 |
| lion__lion_B | YES | 0.945 | +0.943 |
| lion_B__lion_C | YES | 0.942 | +0.954 |
| lion__lion_C | YES | 0.940 | +0.942 |
| wolf_B__wolf_C | YES | 0.934 | +0.777 |
| wolf_B__wolf_D | YES | 0.934 | +0.906 |
| wolf_C__wolf_D | YES | 0.925 | +0.767 |
| wolf_A__wolf_D | YES | 0.918 | +0.886 |
| wolf_D__lion_C | no | 0.776 | +0.732 |
| lion__wolf_D | no | 0.772 | +0.671 |
| lion__wolf_C | no | 0.763 | +0.368 |
| wolf_D__lion_B | no | 0.760 | +0.708 |
| wolf_C__lion_C | no | 0.755 | +0.486 |
| wolf_B__lion | no | 0.754 | +0.604 |
| wolf_A__lion | no | 0.751 | +0.619 |
| wolf_B__lion_C | no | 0.749 | +0.694 |
| wolf_C__lion_B | no | 0.736 | +0.419 |
| wolf_B__lion_B | no | 0.735 | +0.641 |
| wolf_A__lion_C | no | 0.732 | +0.645 |
| wolf_A__lion_B | no | 0.715 | +0.593 |

Same-trait  (n=9): mean 0.937, range [0.918, 0.949]
Cross-trait (n=12): mean 0.750, range [0.715, 0.776]

**P4 (strong form): min(same) - max(cross) = +0.142 -> PASS**

