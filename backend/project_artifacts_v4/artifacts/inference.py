
import numpy as np, pandas as pd
BASE_COLS = ["Age","Gender","ESR","CRP","RF","Anti-CCP","HLA-B27","ANA","Anti-Ro","Anti-La","Anti-dsDNA","Anti-Sm","C3","C4"]
SEROLOGY = ["HLA-B27","ANA","Anti-Ro","Anti-La","Anti-dsDNA","Anti-Sm"]
LABS = ["ESR","CRP","RF","Anti-CCP","C3","C4"]
TESTS = LABS + SEROLOGY
_POS = {"positive","pos","+","++","+++","1","1.0","true","yes","reactive","detected","present",
        "weak positive","weakly positive","low positive","strong positive","strongly positive"}
_NEG = {"negative","neg","-","0","0.0","false","no","non-reactive","nonreactive","not detected","absent"}
_BLANK = {"","nan","none","null","na","n/a","not done","not tested","nd","missing"}
_GENDER = {"male":1.0,"m":1.0,"man":1.0,"female":0.0,"f":0.0,"woman":0.0}
ESR_SCALE, CRP_SCALE = 49.0, 30.0          # dataset upper limits, used only for scaling (trees ignore scale)
C3_LOW_REF, C4_LOW_REF = 90.0, 10.0        # typical lower reference limits (mg/dL; labs vary)
def _norm(v):
    return "" if v is None or (isinstance(v, float) and np.isnan(v)) else str(v).strip().lower()
def encode_raw(df, return_issues=False):
    """Raw table (original names/text) -> numeric table. Unmeasured tests stay NaN (never filled).
    Values that cannot be understood are reported (return_issues=True), never silently dropped."""
    X = pd.DataFrame(index=df.index); issues = [[] for _ in range(len(df))]
    def num(col):
        out = []
        for i, v in enumerate(df[col].tolist()):
            s = _norm(v)
            if s in _BLANK: out.append(np.nan); continue
            try: out.append(float(s))
            except ValueError: out.append(np.nan); issues[i].append(f"{col}: could not read '{v}' (treated as not tested)")
        return out
    X["Age"] = num("Age")
    g = []
    for i, v in enumerate(df["Gender"].tolist()):
        s = _norm(v)
        if s in _GENDER: g.append(_GENDER[s])
        else:
            g.append(np.nan)
            if s not in _BLANK: issues[i].append(f"Gender: could not read '{v}'")
    X["Gender"] = g
    for c in LABS: X[c] = num(c)
    for c in SEROLOGY:
        vals = []
        for i, v in enumerate(df[c].tolist()):
            s = _norm(v)
            if s in _POS: vals.append(1.0)
            elif s in _NEG: vals.append(0.0)
            else:
                vals.append(np.nan)
                if s not in _BLANK: issues[i].append(f"{c}: could not read '{v}' (treated as not tested)")
        X[c] = vals
    X = X[BASE_COLS].astype(float)
    return (X, issues) if return_issues else X
def engineer(X):
    """Clinical features. Every ratio is NaN unless BOTH source tests were really measured (no fake values)."""
    F = X.copy()
    F["n_missing_labs"] = X[LABS].isna().sum(axis=1)
    F["n_missing_sero"] = X[SEROLOGY].isna().sum(axis=1)
    F["n_pos_sero"] = (X[SEROLOGY] == 1).sum(axis=1)
    F["n_neg_sero"] = (X[SEROLOGY] == 0).sum(axis=1)
    F["ESR_CRP_ratio"] = X["ESR"] / (X["CRP"] + 0.5)
    F["inflam_index"] = X["ESR"] / ESR_SCALE + X["CRP"] / CRP_SCALE
    F["rf_ccp_min"] = X[["RF","Anti-CCP"]].min(axis=1, skipna=False)
    F["rf_ccp_max"] = X[["RF","Anti-CCP"]].max(axis=1, skipna=False)
    F["rf_x_ccp"] = X["RF"] * X["Anti-CCP"]
    F["C3_x_C4"] = X["C3"] * X["C4"]
    F["complement_vs_ref_min"] = pd.concat([X["C3"]/C3_LOW_REF, X["C4"]/C4_LOW_REF], axis=1).min(axis=1, skipna=False)
    F["low_C3"] = (X["C3"] < C3_LOW_REF).astype(float).where(X["C3"].notna())
    F["low_C4"] = (X["C4"] < C4_LOW_REF).astype(float).where(X["C4"].notna())
    F["sjogren_ab_pos"] = X[["ANA","Anti-Ro","Anti-La"]].max(axis=1, skipna=True).where(X[["ANA","Anti-Ro","Anti-La"]].notna().any(axis=1))
    F["lupus_ab_pos"] = X[["Anti-dsDNA","Anti-Sm"]].max(axis=1, skipna=True).where(X[["Anti-dsDNA","Anti-Sm"]].notna().any(axis=1))
    return F
def member_input(name, F):
    """Random Forest cannot read blanks, so it gets a clear 'not tested' code (-1). Boosters read blanks natively."""
    return F.fillna(-1.0) if name == "rf" else F
def _softmax(z):
    z = z - z.max(axis=1, keepdims=True); e = np.exp(z); return e / e.sum(axis=1, keepdims=True)

# ---- Range-aware Bayes model (plain dict of arrays -> safe to save and load anywhere) ----
def _resolution(v):
    u = np.unique(v); return float(np.min(np.diff(u))) if len(u) > 1 else 1.0
def bayes_fit(X, y, K, sub=None, alpha=0.1, prior="empirical"):
    """Each test is independent evidence. Lab density = histogram whose bin edges sit exactly on every
    disease's min/max for that lab (learned from the training data), optionally sub-divided to width <= sub[lab].
    Serology = probability of 'positive' per disease. A test that was not done is simply left out."""
    sub = sub or {}; y = np.asarray(y)
    cnt = np.bincount(y, minlength=K).astype(float)
    pri = np.log(cnt / cnt.sum()) if prior == "empirical" else np.log(np.full(K, 1.0 / K))
    tabs = {}
    for c in LABS:
        col = X[c].values.astype(float); v_all = col[~np.isnan(col)]; eps = _resolution(v_all) / 2
        pts = {v_all.min() - eps, v_all.max() + eps}
        for k in range(K):
            vk = col[y == k]; vk = vk[~np.isnan(vk)]
            if len(vk): pts |= {vk.min() - eps, vk.max() + eps}
        pts = sorted(pts); edges = [pts[0]]; w = sub.get(c)
        for a, b in zip(pts[:-1], pts[1:]):
            n = max(1, int(np.ceil((b - a) / w))) if w else 1
            edges += list(np.linspace(a, b, n + 1)[1:])
        edges = np.array([pts[0] - 1e6] + edges + [pts[-1] + 1e6])
        width = np.diff(edges); width[[0, -1]] = 1.0
        mids = (edges[:-1] + edges[1:]) / 2; mids[0] = edges[1] - eps; mids[-1] = edges[-2] + eps
        Pb = np.zeros((K, len(width)))
        for k in range(K):
            vk = col[y == k]; vk = vk[~np.isnan(vk)]; h, _ = np.histogram(vk, edges)
            Pb[k] = (h + alpha) / (h.sum() + alpha * len(h))
        tabs[c] = dict(edges=edges, logdens=np.log(Pb / width), pbin=Pb, mids=mids)
    for c in SEROLOGY:
        col = X[c].values.astype(float); Pb = np.zeros((K, 2))
        for k in range(K):
            vk = col[y == k]; vk = vk[~np.isnan(vk)]; p = (vk.sum() + alpha) / (len(vk) + 2 * alpha); Pb[k] = [1 - p, p]
        tabs[c] = dict(edges=None, logdens=np.log(Pb), pbin=Pb, mids=np.array([0.0, 1.0]))
    return dict(prior=pri, tables=tabs, K=K, alpha=alpha, sub=sub, prior_kind=prior)
def _bin_index(t, v):
    if t["edges"] is None: return v.astype(int)
    return np.clip(np.searchsorted(t["edges"], v, side="right") - 1, 0, t["logdens"].shape[1] - 1)
def bayes_proba(B, X):
    S = np.tile(B["prior"], (len(X), 1))
    for c, t in B["tables"].items():
        v = np.asarray(X[c].values, dtype=float); m = ~np.isnan(v)
        if m.any(): S[m] += t["logdens"][:, _bin_index(t, v[m])].T
    return _softmax(S)

# ---- one predictor for every model type ----
def member_proba(bundle, n, F):
    if n == "bayes": return bayes_proba(bundle["bayes"], F)
    return bundle["members"][n].predict_proba(member_input(n, F))
def model_predict_proba(bundle, F):
    F = F[bundle["feature_cols"]]
    if bundle["kind"] == "bayes": p = bayes_proba(bundle["bayes"], F)
    else:
        Z = np.hstack([np.log(np.clip(member_proba(bundle, n, F), 1e-6, 1.0)) for n in bundle["member_names"]])
        p = bundle["meta"].predict_proba(Z)
    return _softmax(np.log(np.clip(p, 1e-9, 1.0)) / bundle["temperature"])
def raw_predict_proba(bundle, raw_array):
    """Model as a function of the 14 REAL inputs (used for explanations and test recommendations)."""
    return model_predict_proba(bundle, engineer(pd.DataFrame(np.asarray(raw_array, dtype=float), columns=BASE_COLS)))

# ---- exact explanation for the Bayes model: likelihood ratio of every measured test ----
def bayes_evidence(B, X1, k, r):
    """For ONE patient: how much each measured test favours disease k over disease r.
    log P(k|x)/P(r|x) = prior term + sum of these values (exact, additive)."""
    out = []
    for c in TESTS:
        v = X1[c].iloc[0]
        if pd.isna(v): continue
        t = B["tables"][c]; i = int(_bin_index(t, np.array([float(v)]))[0])
        out.append((c, float(t["logdens"][k, i] - t["logdens"][r, i])))
    return out

# ---- next best test: which missing test would most likely turn this into a confident answer ----
def recommend_tests(bundle, X1, top=3):
    """X1: one-row numeric DataFrame (BASE_COLS). For each missing test, every possible result is weighed by how
    likely it is for THIS patient (sum over diseases of P(disease|current tests) x P(result|disease)), the model
    is re-run with that result, and we average the new confidence."""
    B = bundle["bayes"]; tau = bundle.get("confidence_threshold", 0.7)
    p0 = raw_predict_proba(bundle, X1[BASE_COLS].values)[0]; rows, meta = [], []
    for c in TESTS:
        if not pd.isna(X1[c].iloc[0]): continue
        t = B["tables"][c]; w = p0 @ t["pbin"]; keep = w > 1e-4
        vals, w = t["mids"][keep], w[keep] / w[keep].sum()
        for v, wi in zip(vals, w):
            r = X1[BASE_COLS].values[0].astype(float).copy(); r[BASE_COLS.index(c)] = v; rows.append(r); meta.append((c, wi))
    if not rows: return []
    conf = raw_predict_proba(bundle, np.array(rows)).max(1); agg = {}
    for (c, wi), cf in zip(meta, conf):
        a = agg.setdefault(c, [0.0, 0.0]); a[0] += wi * cf; a[1] += wi * float(cf >= tau)
    res = [dict(test=c, current_confidence=float(p0.max()), expected_confidence_after=float(a[0]),
                chance_of_confident_answer=float(a[1])) for c, a in agg.items()]
    res.sort(key=lambda d: (-d["chance_of_confident_answer"], -d["expected_confidence_after"]))
    return res if top is None else res[:top]

import os, joblib
_B = None
def load(path=None):
    global _B
    if _B is None: _B = joblib.load(path or os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_bundle.pkl"))
    return _B
def _frame(records):
    recs = records if isinstance(records, list) else [records]
    df = pd.DataFrame(recs)
    for c in BASE_COLS:
        if c not in df.columns: df[c] = None
    return df
def _range_warnings(b, x):
    w = []
    for c, (lo, hi) in b.get("input_ranges", {}).items():
        v = x[c]
        if not pd.isna(v) and (v < lo or v > hi): w.append(f"{c} = {v:g} is outside the training range {lo:g}-{hi:g}; treat the result with extra care")
    return w
def predict(records, path=None, recommend=True, mode="default"):
    """records: dict or list of dicts using the ORIGINAL column names. Unmeasured tests: leave out or use None.
    status: 'confident' | 'needs_review' | 'insufficient_data'. 'needs_review' answers include recommended_tests.
    mode: 'default' (most accurate overall) or 'sensitive' (favours rare diseases; probabilities stay the calibrated ones)."""
    if mode not in ("default", "sensitive"): raise ValueError("mode must be 'default' or 'sensitive'")
    b = load(path); raw = _frame(records); X, issues = encode_raw(raw, return_issues=True)
    P = model_predict_proba(b, engineer(X)); out = []
    w = np.asarray(b.get("sensitivity_weights") or np.ones(P.shape[1]), dtype=float) if mode == "sensitive" else np.ones(P.shape[1])
    for i in range(len(P)):
        p = P[i]; j0 = int(p.argmax()); j = int(np.argmax(p * w)); miss = [c for c in TESTS if pd.isna(X.iloc[i][c])]
        measured = len(TESTS) - len(miss); warn = issues[i] + _range_warnings(b, X.iloc[i])
        if measured < b.get("min_measured_tests", 3):
            out.append({"predicted_disease": None, "confidence": None, "probabilities": None, "status": "insufficient_data",
                        "message": f"Only {measured} of {len(TESTS)} tests were measured; at least {b.get('min_measured_tests', 3)} are needed.",
                        "missing_tests": miss, "n_missing_tests": len(miss), "warnings": warn, "recommended_tests": []})
            continue
        order = np.argsort(-p)
        r = {"predicted_disease": b["classes"][j], "confidence": float(p[j]), "runner_up": b["classes"][int([o for o in order if o != j][0])],
             "probabilities": {b["classes"][k]: float(p[k]) for k in range(len(p))},
             "status": "confident" if (j == j0 and p[j] >= b["confidence_threshold"]) else "needs_review", "mode": mode,
             "missing_tests": miss, "n_missing_tests": len(miss), "warnings": warn, "recommended_tests": []}
        if recommend and r["status"] == "needs_review" and miss: r["recommended_tests"] = recommend_tests(b, X.iloc[[i]], top=3)
        out.append(r)
    return out
def recommend(record, top=3, path=None):
    """Which missing tests would most likely give a confident answer for this patient."""
    b = load(path); X = encode_raw(_frame(record)); return recommend_tests(b, X.iloc[[0]], top=top)
def _display(col, v):
    if pd.isna(v): return "not tested"
    if col in SEROLOGY: return "Positive" if v == 1 else "Negative"
    if col == "Gender": return "Male" if v == 1 else "Female"
    return float(v)
def explain(record, top_k=8, target_class=None, compare_with=None, path=None):
    """Bayes model: EXACT explanation. Each measured test gets a likelihood ratio = how many times more likely this
    result is under the predicted disease than under the runner-up (or compare_with). Stack models: seeded SHAP."""
    b = load(path); X = encode_raw(_frame(record))[BASE_COLS]; p = raw_predict_proba(b, X.values)[0]
    k = b["classes"].index(target_class) if target_class else int(p.argmax())
    if b["kind"] == "bayes":
        r = b["classes"].index(compare_with) if compare_with else int([i for i in np.argsort(-p) if i != k][0])
        ev = sorted(bayes_evidence(b["bayes"], X, k, r), key=lambda t: -abs(t[1]))[:top_k]
        items = [{"feature": c, "value": _display(c, X[c].iloc[0]), "impact": w, "likelihood_ratio": float(np.exp(w))} for c, w in ev]
        return {"method": "exact likelihood ratios", "explained_class": b["classes"][k], "compared_with": b["classes"][r],
                "probability": float(p[k]), "probability_compared": float(p[r]),
                "not_tested": [c for c in TESTS if pd.isna(X[c].iloc[0])],
                "pushes_toward": [x for x in items if x["impact"] > 0], "pushes_against": [x for x in items if x["impact"] < 0]}
    import shap
    f = lambda a: raw_predict_proba(b, a); bgd = b["shap_background"][BASE_COLS].values
    ex = shap.explainers.Permutation(f, shap.maskers.Independent(bgd, max_samples=len(bgd)), feature_names=BASE_COLS, seed=b["seed"])
    s = np.asarray(ex(X.values, max_evals=b.get("shap_permutations", 8) * (2 * len(BASE_COLS) + 1), silent=True).values)[0][:, k]
    items = [{"feature": BASE_COLS[i], "value": _display(BASE_COLS[i], X.iloc[0, i]), "impact": float(s[i])} for i in np.argsort(-np.abs(s))[:top_k]]
    return {"method": "SHAP (seeded permutation)", "explained_class": b["classes"][k], "probability": float(p[k]),
            "pushes_toward": [x for x in items if x["impact"] > 0], "pushes_against": [x for x in items if x["impact"] < 0]}
