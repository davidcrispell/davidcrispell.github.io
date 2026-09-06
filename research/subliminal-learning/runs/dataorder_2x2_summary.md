# Data-order isolation (anchor-free, data-seed family)

Teacher FT from data-seed2. (i,o)=data-seed2 init (= teacher base);
(i,o*)=data-seed1 init (same weight init W0, different data order).

| dose | (i,o) s1 | (i,o) s2 | (i,o*) s1 | (i,o*) s2 |
| ---: | ---: | ---: | ---: | ---: |
| 16 | -0.006 | +0.172 | +0.100 | +0.053 |
| 512 | +0.803 | +0.788 | +0.234 | +0.267 |
| 2560 | +1.052 | +0.931 | +0.399 | +0.378 |

At dose 2560: (i,o) mean +0.991  vs  (i,o*) mean +0.389

(i,o) is the positive control — it MUST be strongly positive for
the (i,o*) comparison to mean anything.
