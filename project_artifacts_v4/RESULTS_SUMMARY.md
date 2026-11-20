# Results summary (auto-generated, pipeline v4)
Dataset: 12085 patients, 7 classes | Train 10272 / frozen test 1813
Chosen on training cross-validation: Range-aware Bayes model | DEPLOYED after the robustness check: **Range-aware Bayes model** (temperature 1.069)
Sensitivity mode strength: 0.55
Unreadable input values in the dataset: 0

## Model selection (training cross-validation; the test set played no part)
| candidate                                  |   cv_accuracy |   cv_macro_f1 |   cv_balanced_accuracy |   cv_log_loss |   cv_ece |   cv_top2 |   temperature |
|:-------------------------------------------|--------------:|--------------:|-----------------------:|--------------:|---------:|----------:|--------------:|
| Range-aware Bayes model                    |        0.8545 |        0.8452 |                 0.8292 |        0.2623 |   0.0075 |    0.9899 |        1.0687 |
| Hybrid stack (4 tree models + Bayes)       |        0.8563 |        0.8462 |                 0.8325 |        0.2682 |   0.0094 |    0.9882 |        1.0126 |
| v2 stacking ensemble (RF+LGB+XGB+CatBoost) |        0.8491 |        0.8409 |                 0.8302 |        0.287  |   0.0256 |    0.9868 |        0.9997 |

## Headline numbers (frozen test set, 95% bootstrap CI)
- Accuracy 0.8610  0.844-0.876
- Macro F1 0.8604  0.842-0.878
- Balanced accuracy 0.8459  0.826-0.866
- ROC-AUC (one-vs-rest) 0.9891  0.9873-0.9909
- Top-2 accuracy 0.9890  0.984-0.993
- Log-loss 0.2517 | Brier 0.1693 | ECE 0.0152 | MCC 0.8341 | Kappa 0.8330
- Safe mode: confidence >= 0.667 -> 75.6% answered at 96.57% accuracy; the other 24.4% are flagged (they would have been 53.7% accurate)

## Repeated-split check (10 different train/test splits, mean and sd)
| model                                      |   accuracy_mean |   accuracy_std |   macro_f1_mean |   balanced_accuracy_mean |   log_loss_mean |   ece_mean |   top2_accuracy_mean |
|:-------------------------------------------|----------------:|---------------:|----------------:|-------------------------:|----------------:|-----------:|---------------------:|
| Range-aware Bayes model                    |          0.8576 |         0.0066 |          0.8483 |                   0.832  |          0.2573 |     0.013  |               0.9899 |
| Hybrid stack (4 tree models + Bayes)       |          0.8546 |         0.0075 |          0.8446 |                   0.8301 |          0.2628 |     0.0171 |               0.9897 |
| XGBoost                                    |          0.8519 |         0.0075 |          0.8459 |                   0.8331 |          0.2918 |     0.0287 |               0.9892 |
| v2 stacking ensemble (RF+LGB+XGB+CatBoost) |          0.8499 |         0.0077 |          0.8425 |                   0.8317 |          0.2782 |     0.0269 |               0.9891 |

Range-aware Bayes model beat the v2 ensemble on 9/10 splits (mean gain +0.77 accuracy points).

## Accuracy ceiling
If the data follows the independent-markers pattern found in the audit, the best possible accuracy is about 86.18%
(macro-F1 0.8519). The final model averages 85.76% over the repeated splits = 99.5% of that ceiling.

## Targets (frozen test set)
| metric | target | achieved | status |
|---|---|---|---|
| accuracy | 0.85 | 0.8610 | PASS |
| macro_f1 | 0.85 | 0.8604 | PASS |
| balanced_accuracy | 0.85 | 0.8459 | below target |
| auc_ovr | 0.985 | 0.9891 | PASS |
| ece | 0.03 | 0.0152 | PASS |
| SLE_f1 | 0.98 | 0.9975 | PASS |
| selective_accuracy | 0.95 | 0.9657 | PASS |
| top2_accuracy | 0.97 | 0.9890 | PASS |

## Per-disease (frozen test set)
| disease                      |   precision |   recall |    f1 |   support |   auc |   specificity |
|:-----------------------------|------------:|---------:|------:|----------:|------:|--------------:|
| Ankylosing Spondylitis       |       0.75  |    0.639 | 0.69  |       319 | 0.96  |         0.954 |
| Normal                       |       0.92  |    0.855 | 0.886 |       241 | 0.995 |         0.989 |
| Psoriatic Arthritis          |       0.851 |    0.918 | 0.883 |       268 | 0.995 |         0.972 |
| Reactive Arthritis           |       0.981 |    0.662 | 0.791 |        77 | 0.993 |         0.999 |
| Rheumatoid Arthritis         |       0.812 |    0.92  | 0.863 |       427 | 0.986 |         0.934 |
| Sjögren's Syndrome           |       0.893 |    0.932 | 0.912 |       278 | 0.996 |         0.98  |
| Systemic Lupus Erythematosus |       1     |    0.995 | 0.998 |       203 | 1     |         1     |

## Most common mistakes
| true    | predicted   |   patients |   share_of_true_class |
|:--------|:------------|-----------:|----------------------:|
| AS      | RA          |         79 |                0.2476 |
| AS      | PsA         |         36 |                0.1129 |
| RA      | AS          |         31 |                0.0726 |
| Normal  | Sjogren     |         29 |                0.1203 |
| PsA     | AS          |         20 |                0.0746 |
| Sjogren | Normal      |         18 |                0.0647 |
| ReA     | AS          |         17 |                0.2208 |
| ReA     | RA          |          9 |                0.1169 |

## Model comparison (same frozen test set)
|                                                  |   accuracy |   macro_f1 |   balanced_accuracy |   auc_ovr |   log_loss |    ece |   top2_accuracy |
|:-------------------------------------------------|-----------:|-----------:|--------------------:|----------:|-----------:|-------:|----------------:|
| Logistic Regression (baseline)                   |     0.8141 |     0.8074 |              0.8379 |    0.9812 |     0.4017 | 0.0282 |          0.9713 |
| LightGBM + median imputation (previous approach) |     0.8345 |     0.8252 |              0.8468 |    0.9857 |     0.3054 | 0.023  |          0.9774 |
| Random Forest                                    |     0.8428 |     0.8381 |              0.8372 |    0.986  |     0.332  | 0.0301 |          0.9829 |
| LightGBM                                         |     0.8378 |     0.8327 |              0.8465 |    0.987  |     0.2905 | 0.0415 |          0.9835 |
| XGBoost                                          |     0.8483 |     0.847  |              0.8346 |    0.988  |     0.2856 | 0.0289 |          0.9879 |
| CatBoost                                         |     0.8378 |     0.8356 |              0.831  |    0.987  |     0.322  | 0.0398 |          0.9862 |
| Soft-voting average (4 tree models)              |     0.8445 |     0.8428 |              0.8428 |    0.9879 |     0.2965 | 0.0355 |          0.9851 |
| Range-aware Bayes, equal disease weights         |     0.8318 |     0.8214 |              0.8583 |    0.9876 |     0.2758 | 0.0254 |          0.9846 |
| v2 stacking ensemble (RF+LGB+XGB+CatBoost)       |     0.8538 |     0.8523 |              0.8441 |    0.9879 |     0.2735 | 0.0204 |          0.9884 |
| PROPOSED: Range-aware Bayes model                |     0.861  |     0.8604 |              0.8459 |    0.9891 |     0.2517 | 0.0152 |          0.989  |
| Hybrid stack (4 tree models + Bayes)             |     0.8544 |     0.8509 |              0.8395 |    0.9889 |     0.2568 | 0.0187 |          0.9879 |

## Is the proposed model's accuracy significantly different? (McNemar exact test, frozen test set)
| compared_with                                    |   only_proposed_right |   only_other_right |   net_gain_patients |   p_value | significant_at_0_05   |
|:-------------------------------------------------|----------------------:|-------------------:|--------------------:|----------:|:----------------------|
| Logistic Regression (baseline)                   |                   190 |                105 |                  85 |    0      | True                  |
| LightGBM + median imputation (previous approach) |                   147 |                 99 |                  48 |    0.0027 | True                  |
| Random Forest                                    |                   114 |                 81 |                  33 |    0.0217 | True                  |
| LightGBM                                         |                   117 |                 75 |                  42 |    0.003  | True                  |
| XGBoost                                          |                    83 |                 60 |                  23 |    0.0654 | False                 |
| CatBoost                                         |                   100 |                 58 |                  42 |    0.001  | True                  |
| Soft-voting average (4 tree models)              |                    93 |                 63 |                  30 |    0.0199 | True                  |
| Range-aware Bayes, equal disease weights         |                   107 |                 54 |                  53 |    0      | True                  |
| v2 stacking ensemble (RF+LGB+XGB+CatBoost)       |                    77 |                 64 |                  13 |    0.3122 | False                 |
| Hybrid stack (4 tree models + Bayes)             |                    62 |                 50 |                  12 |    0.2986 | False                 |

## Robustness check (held-out training folds; this decides which model is deployed)
Accuracy (%) when inputs are disturbed. Disturbances: clean = no change; noise_5pct = random lab error, sd 5%; noise_10pct = random lab error, sd 10%; shift_plus_5pct = all labs read 5% high (different analyser); shift_minus_5pct = all labs read 5% low; serology_flip_5pct = 5% of antibody results wrong; two_more_missing = 2 extra tests missing per patient.
Rule fixed before the run: deploy the CV winner unless another candidate is at least 1.0 points more accurate under 'noise_5pct'.

|                                            |   clean |   noise_5pct |   noise_10pct |   shift_plus_5pct |   shift_minus_5pct |   serology_flip_5pct |   two_more_missing |
|:-------------------------------------------|--------:|-------------:|--------------:|------------------:|-------------------:|---------------------:|-------------------:|
| v2 stacking ensemble (RF+LGB+XGB+CatBoost) |   84.79 |        82.03 |         78.57 |             82.34 |              80.44 |                84.01 |              76.97 |
| Range-aware Bayes model                    |   85.45 |        82.14 |         77.63 |             80.56 |              82.34 |                84.09 |              78.98 |
| Hybrid stack (4 tree models + Bayes)       |   85.47 |        82.69 |         78.9  |             81.9  |              82.38 |                84.17 |              77.95 |
| XGBoost (single model, reference)          |   84.74 |        81.06 |         77.91 |             82.59 |              78.41 |                83.57 |              77.39 |

Decision: KEPT: under 'noise_5pct' the CV winner (Range-aware Bayes model) scored 82.14% vs best alternative Hybrid stack (4 tree models + Bayes) 82.69% (switch needs >= 1.0 points) -> deploying Range-aware Bayes model

## Sensitivity mode (optional switch for rare diseases)
Probabilities are re-weighted by (1/disease frequency)^strength. The strength was chosen on training CV as the one with the highest
balanced accuracy that costs at most 1.0 points of overall accuracy. Chosen strength: 0.55.
Frozen test set:

| mode                      |   accuracy |   balanced_accuracy |   macro_f1 |   recall_AS |   recall_Normal |   recall_PsA |   recall_ReA |   recall_RA |   recall_Sjogren |   recall_SLE |
|:--------------------------|-----------:|--------------------:|-----------:|------------:|----------------:|-------------:|-------------:|------------:|-----------------:|-------------:|
| default                   |     0.861  |              0.8459 |     0.8604 |      0.6395 |          0.8548 |       0.9179 |       0.6623 |      0.9204 |           0.9317 |       0.9951 |
| sensitive (strength 0.55) |     0.8489 |              0.8603 |     0.8463 |      0.6082 |          0.8714 |       0.9291 |       0.8571 |      0.8618 |           0.8993 |       0.9951 |

## Robustness on the frozen test set (report only)
Accuracy (%):

|                                            |   clean |   noise_5pct |   noise_10pct |   shift_plus_5pct |   shift_minus_5pct |   serology_flip_5pct |   two_more_missing |
|:-------------------------------------------|--------:|-------------:|--------------:|------------------:|-------------------:|---------------------:|-------------------:|
| v2 stacking ensemble (RF+LGB+XGB+CatBoost) |   85.38 |        81.72 |         78.1  |             82.18 |              79.7  |                84.59 |              77.07 |
| Range-aware Bayes model                    |   86.1  |        81.23 |         77.29 |             80.97 |              81.96 |                84.78 |              78.4  |
| Hybrid stack (4 tree models + Bayes)       |   85.44 |        81.6  |         77.9  |             81.41 |              81.14 |                84.32 |              77.81 |
| XGBoost (single model, reference)          |   84.83 |        80.49 |         76.63 |             82.57 |              77.61 |                83.8  |              77.33 |

## Per-disease recall over the 10 repeated splits (mean +/- sd, %)
| model                                      | AS           | Normal       | PsA          | ReA          | RA           | Sjogren      | SLE          |
|:-------------------------------------------|:-------------|:-------------|:-------------|:-------------|:-------------|:-------------|:-------------|
| Hybrid stack (4 tree models + Bayes)       | 60.1 +/- 2.9 | 81.1 +/- 2.5 | 92.1 +/- 2.3 | 59.2 +/- 6.6 | 95.3 +/- 0.8 | 94.2 +/- 1.5 | 99.1 +/- 0.8 |
| Range-aware Bayes model                    | 63.0 +/- 2.6 | 80.9 +/- 2.3 | 91.9 +/- 1.8 | 58.2 +/- 6.2 | 94.1 +/- 0.9 | 95.4 +/- 1.7 | 98.9 +/- 0.6 |
| XGBoost                                    | 64.0 +/- 3.4 | 82.4 +/- 2.1 | 89.7 +/- 2.3 | 63.0 +/- 6.1 | 91.9 +/- 0.7 | 93.8 +/- 1.6 | 98.4 +/- 1.0 |
| v2 stacking ensemble (RF+LGB+XGB+CatBoost) | 62.7 +/- 2.9 | 82.2 +/- 2.5 | 90.9 +/- 2.1 | 62.7 +/- 6.4 | 91.6 +/- 1.2 | 93.0 +/- 1.6 | 99.0 +/- 0.9 |

## Paired tests over the repeated splits (deployed model vs each alternative, accuracy)
| compared_with                              |   mean_gain_points |   wins |   losses |   paired_t_p |   wilcoxon_p |   sign_test_p |
|:-------------------------------------------|-------------------:|-------:|---------:|-------------:|-------------:|--------------:|
| Hybrid stack (4 tree models + Bayes)       |             0.3034 |      9 |        1 |       0.003  |       0.0078 |        0.0215 |
| XGBoost                                    |             0.5736 |      9 |        1 |       0.0058 |       0.0039 |        0.0215 |
| v2 stacking ensemble (RF+LGB+XGB+CatBoost) |             0.7722 |      9 |        1 |       0.0017 |       0.0059 |        0.0215 |

## Subgroup analysis (frozen test set; 95% Wilson CI; p = chi-square test for any accuracy difference between levels of a grouping)
| grouping                                                 | subgroup                  |   patients |   accuracy |   ci_low |   ci_high |   v2_accuracy |   macro_f1 |    ece | note   |   difference_between_levels_p |
|:---------------------------------------------------------|:--------------------------|-----------:|-----------:|---------:|----------:|--------------:|-----------:|-------:|:-------|------------------------------:|
| Sex                                                      | Female                    |        919 |     0.8738 |   0.8507 |    0.8937 |        0.8553 |     0.8766 | 0.0163 |        |                        0.127  |
| Sex                                                      | Male                      |        894 |     0.8479 |   0.8228 |    0.8699 |        0.8523 |     0.8428 | 0.0319 |        |                        0.127  |
| Age                                                      | 20-39                     |        583 |     0.8405 |   0.8085 |    0.868  |        0.8491 |     0.8541 | 0.0308 |        |                        0.1633 |
| Age                                                      | 40-59                     |        632 |     0.8782 |   0.8504 |    0.9014 |        0.8703 |     0.8642 | 0.0221 |        |                        0.1633 |
| Age                                                      | 60+                       |        598 |     0.8629 |   0.833  |    0.8881 |        0.8411 |     0.8622 | 0.0238 |        |                        0.1633 |
| Serostatus, dataset cut-off (RF and anti-CCP <= 20)      | seronegative              |        495 |     0.8485 |   0.8142 |    0.8774 |        0.8444 |     0.8073 | 0.0334 |        |                        0.0003 |
| Serostatus, dataset cut-off (RF and anti-CCP <= 20)      | seropositive              |        682 |     0.9179 |   0.8949 |    0.9362 |        0.9106 |     0.9126 | 0.0282 |        |                        0.0003 |
| Serostatus, common lab cut-offs (RF < 14, anti-CCP < 17) | seronegative              |        294 |     0.8401 |   0.7939 |    0.8776 |        0.8503 |     0.8306 | 0.0401 |        |                        0.0032 |
| Serostatus, common lab cut-offs (RF < 14, anti-CCP < 17) | seropositive              |        883 |     0.9049 |   0.8837 |    0.9225 |        0.8935 |     0.8983 | 0.0278 |        |                        0.0032 |
| Serostatus                                               | RF or anti-CCP not tested |        636 |     0.8097 |   0.7774 |    0.8384 |        0.8003 |     0.8243 | 0.0236 |        |                      nan      |
| Work-up                                                  | 0-1 tests missing         |        321 |     0.8941 |   0.8556 |    0.9232 |        0.9065 |     0.8998 | 0.0229 |        |                        0.0005 |
| Work-up                                                  | 2-3 tests missing         |        976 |     0.876  |   0.8539 |    0.8952 |        0.8719 |     0.8734 | 0.0244 |        |                        0.0005 |
| Work-up                                                  | 4+ tests missing          |        516 |     0.812  |   0.776  |    0.8434 |        0.7868 |     0.8002 | 0.0303 |        |                        0.0005 |

## Head-to-head on the published protocols (same splits, same patients; 'Published' rows are the papers' own numbers)
| protocol                                              | model                                                              |   test_patients |   accuracy |   macro_f1 |   balanced_accuracy |   recall_AS |   recall_ReA | note                                                |
|:------------------------------------------------------|:-------------------------------------------------------------------|----------------:|-----------:|-----------:|--------------------:|------------:|-------------:|:----------------------------------------------------|
| BMC 2026 protocol (80/20, seed 42)                    | Random Forest (their settings, re-implemented)                     |            2417 |     0.842  |     0.7968 |              0.786  |      0.5365 |       0.2816 |                                                     |
| BMC 2026 protocol (80/20, seed 42)                    | XGBoost (their settings, re-implemented)                           |            2417 |     0.8589 |     0.8532 |              0.842  |      0.6118 |       0.6699 | trees not reported; 100 chosen by training CV       |
| BMC 2026 protocol (80/20, seed 42)                    | LightGBM (their settings, re-implemented)                          |            2417 |     0.8432 |     0.8411 |              0.8339 |      0.6424 |       0.699  | trees not reported; 300 chosen by training CV       |
| BMC 2026 protocol (80/20, seed 42)                    | XGBoost, imputation fitted on ALL data (as described in the paper) |            2417 |     0.8602 |     0.8526 |              0.8423 |      0.6024 |       0.6699 | leaky variant                                       |
| BMC 2026 protocol (80/20, seed 42)                    | OURS: Range-aware Bayes (no imputation)                            |            2417 |     0.8639 |     0.8615 |              0.8465 |      0.6471 |       0.6505 |                                                     |
| BMC 2026 protocol (80/20, seed 42)                    | Published: XGBoost (paper, Table 2)                                |            2417 |     0.8548 |   nan      |            nan      |    nan      |     nan      | as reported                                         |
| BMC 2026 protocol (80/20, seed 42)                    | Published: Random Forest (paper, Table 2)                          |            2417 |     0.8378 |   nan      |            nan      |    nan      |     nan      | as reported (their confusion matrix implies 84.24%) |
| PeerJ 2025 protocol, no oversampling (70/30, seed 42) | Gradient Boosting (their settings, re-implemented)                 |            3626 |     0.8536 |     0.8479 |              0.8328 |      0.6301 |       0.6258 |                                                     |
| PeerJ 2025 protocol, no oversampling (70/30, seed 42) | Random Forest (their settings, re-implemented)                     |            3626 |     0.8436 |     0.8305 |              0.8127 |      0.6364 |       0.5226 |                                                     |
| PeerJ 2025 protocol, no oversampling (70/30, seed 42) | OURS: Range-aware Bayes (no imputation)                            |            3626 |     0.8582 |     0.8526 |              0.8382 |      0.6254 |       0.6194 |                                                     |
| PeerJ 2025 protocol, no oversampling (70/30, seed 42) | Published: Gradient Boosting, unbalanced data (paper, Table 11)    |            3626 |     0.8392 |   nan      |            nan      |    nan      |     nan      | as reported                                         |
| PeerJ oversampling check (70/30)                      | Gradient Boosting, oversampled BEFORE split (as in the paper)      |            4372 |     0.8717 |     0.8709 |              0.8708 |      0.616  |       0.9456 | 752 of 901 ReA test cases are synthetic             |
| PeerJ oversampling check (70/30)                      | same model, scored on the REAL test patients only                  |            3620 |     0.845  |     0.8365 |              0.8316 |      0.616  |       0.6711 |                                                     |
| PeerJ oversampling check (70/30)                      | Gradient Boosting, oversampled AFTER split (training only)         |            3626 |     0.8527 |     0.8479 |              0.8384 |      0.6442 |       0.6774 | honest version                                      |
| PeerJ oversampling check (70/30)                      | Published: Gradient Boosting, balanced data (paper, Table 13)      |            4355 |     0.8689 |   nan      |            nan      |    nan      |     nan      | as reported; test includes synthetic patients       |

McNemar test, ours vs the best re-implemented model on the identical split:
| protocol                                              | ours_vs                   |   only_ours_right |   only_theirs_right |   p_value |
|:------------------------------------------------------|:--------------------------|------------------:|--------------------:|----------:|
| BMC 2026 protocol (80/20, seed 42)                    | XGBoost (their settings)  |               105 |                  93 |    0.4344 |
| PeerJ 2025 protocol, no oversampling (70/30, seed 42) | best re-implemented model |               161 |                 144 |    0.3596 |
