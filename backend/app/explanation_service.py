"""
Clinical and Plain-Language Explanation Service.
Provides two distinct tiers of medical explanation:
1. Scientific Explanation (for Clinicians/Doctors):
   Quantitative likelihood ratios, immunological mechanisms, reference interval comparisons,
   and differential diagnostic reasoning.
2. General Explanation (for Patients & Non-specialists):
   Plain-language, jargon-free explanations of test results, why the system suggests a condition,
   and actionable consultation guidance.
"""

from typing import Dict, Any, List, Optional
import math
import numpy as np
import pandas as pd

FEATURE_CLINICAL_META = {
    "Age": {
        "full_name": "Patient Age",
        "category": "Demographic",
        "unit": "years",
        "description": "Patient age at presentation",
        "plain_name": "Age",
        "plain_desc": "Age can influence which joint conditions are most common.",
    },
    "Gender": {
        "full_name": "Biological Sex",
        "category": "Demographic",
        "unit": "",
        "description": "Biological sex, associated with autoimmune disease predisposition",
        "plain_name": "Biological Sex",
        "plain_desc": "Some autoimmune conditions are significantly more frequent in females (e.g., SLE, Sjögren's) or males (e.g., Ankylosing Spondylitis).",
    },
    "ESR": {
        "full_name": "Erythrocyte Sedimentation Rate",
        "category": "Inflammatory Marker",
        "unit": "mm/h",
        "normal_range": "< 20 mm/h",
        "description": "Nonspecific acute-phase reactant measuring red blood cell sedimentation rate",
        "plain_name": "Sedimentation Rate (ESR)",
        "plain_desc": "Measures general inflammation in the body. Higher values indicate active swelling or immune activity.",
    },
    "CRP": {
        "full_name": "C-Reactive Protein",
        "category": "Inflammatory Marker",
        "unit": "mg/L",
        "normal_range": "< 5.0 mg/L (or < 3.0 mg/L depending on assay)",
        "description": "Hepatic acute-phase reactant responding rapidly to systemic cytokine stimulation",
        "plain_name": "C-Reactive Protein (CRP)",
        "plain_desc": "A protein made by the liver that spikes quickly when there is inflammation or infection.",
    },
    "RF": {
        "full_name": "Rheumatoid Factor",
        "category": "Autoantibody (RA)",
        "unit": "IU/mL",
        "normal_range": "< 15-20 IU/mL",
        "description": "Autoantibody targeting the Fc portion of IgG, hallmark of Rheumatoid Arthritis",
        "plain_name": "Rheumatoid Factor (RF)",
        "plain_desc": "An antibody that targets your own tissues, commonly seen in Rheumatoid Arthritis.",
    },
    "Anti-CCP": {
        "full_name": "Anti-Cyclic Citrullinated Peptide Antibodies (ACPA)",
        "category": "Autoantibody (RA)",
        "unit": "U/mL",
        "normal_range": "< 20 U/mL",
        "description": "Highly specific (>95%) serological biomarker for Rheumatoid Arthritis and erosive synovitis",
        "plain_name": "Anti-CCP Antibody",
        "plain_desc": "A very specific marker for Rheumatoid Arthritis. High levels strongly point toward RA.",
    },
    "HLA-B27": {
        "full_name": "Human Leukocyte Antigen B27",
        "category": "Genetic Serological Marker",
        "unit": "",
        "description": "MHC Class I surface allele strongly predisposing to Spondyloarthropathies (AS, ReA)",
        "plain_name": "HLA-B27 Genetic Marker",
        "plain_desc": "A genetic marker found in up to 90% of people with spine arthritis (Ankylosing Spondylitis).",
    },
    "ANA": {
        "full_name": "Antinuclear Antibodies",
        "category": "Serological Autoantibody",
        "unit": "",
        "description": "Screening autoantibody directed against cellular nuclear antigens in systemic autoimmunity",
        "plain_name": "Antinuclear Antibodies (ANA)",
        "plain_desc": "A screening antibody indicating whether the immune system is targeting the body's own cell nuclei.",
    },
    "Anti-Ro": {
        "full_name": "Anti-Ro / SSA Antibodies",
        "category": "Extractable Nuclear Antigen (ENA)",
        "unit": "",
        "description": "Autoantibody against Ro ribonucleoproteins, characteristic of Sjögren's syndrome and SLE",
        "plain_name": "Anti-Ro (SSA) Antibody",
        "plain_desc": "An antibody frequently found in Sjögren's Syndrome (dry eyes/mouth) and Lupus.",
    },
    "Anti-La": {
        "full_name": "Anti-La / SSB Antibodies",
        "category": "Extractable Nuclear Antigen (ENA)",
        "unit": "",
        "description": "Autoantibody against La ribonucleoprotein, strongly associated with primary Sjögren's syndrome",
        "plain_name": "Anti-La (SSB) Antibody",
        "plain_desc": "A companion antibody to Anti-Ro, commonly present in Sjögren's Syndrome.",
    },
    "Anti-dsDNA": {
        "full_name": "Anti-double-stranded DNA Antibodies",
        "category": "Autoantibody (SLE)",
        "unit": "",
        "description": "Highly specific pathognomonic marker for Systemic Lupus Erythematosus and lupus nephritis activity",
        "plain_name": "Anti-dsDNA Antibody",
        "plain_desc": "A hallmark antibody for Lupus (SLE), associated with immune attack on DNA.",
    },
    "Anti-Sm": {
        "full_name": "Anti-Smith Antibodies",
        "category": "Autoantibody (SLE)",
        "unit": "",
        "description": "Highly specific ACR/EULAR classification criterion marker for Systemic Lupus Erythematosus",
        "plain_name": "Anti-Smith (Anti-Sm) Antibody",
        "plain_desc": "An antibody extremely specific to Lupus. When present, it strongly confirms SLE.",
    },
    "C3": {
        "full_name": "Complement Component 3",
        "category": "Complement Cascade",
        "unit": "mg/dL",
        "normal_range": "90 - 180 mg/dL",
        "description": "Central protein of the complement immune cascade; consumed (hypocomplementemia) during immune complex activation in active SLE",
        "plain_name": "Complement C3",
        "plain_desc": "Part of your immune defense system. Low levels suggest active immune complex consumption (often seen in Lupus flares).",
    },
    "C4": {
        "full_name": "Complement Component 4",
        "category": "Complement Cascade",
        "unit": "mg/dL",
        "normal_range": "10 - 40 mg/dL",
        "description": "Classical complement pathway protein; decreased in active immune complex deposition and lupus flares",
        "plain_name": "Complement C4",
        "plain_desc": "Works alongside C3. Dropping below normal indicates immune proteins are being rapidly used up in an inflammatory reaction.",
    },
}

DISEASE_PLAIN_NAMES = {
    "Ankylosing Spondylitis": "Spine & Joint Arthritis (Ankylosing Spondylitis)",
    "Normal": "No Autoimmune Disease Detected (Healthy / Non-autoimmune)",
    "Psoriatic Arthritis": "Psoriasis-Related Joint Arthritis",
    "Reactive Arthritis": "Post-Infection Joint Inflammation (Reactive Arthritis)",
    "Rheumatoid Arthritis": "Rheumatoid Arthritis (Symmetric Joint Arthritis)",
    "Sjögren's Syndrome": "Sjögren's Syndrome (Dry Eyes & Dry Mouth Autoimmune)",
    "Systemic Lupus Erythematosus": "Lupus (Systemic Lupus Erythematosus / SLE)",
}


def _get_lr_description(lr: float, is_positive: bool, disease_a: str, disease_b: str) -> str:
    """Classify the evidence strength according to standard clinical likelihood ratio thresholds."""
    if is_positive:
        if lr >= 10.0:
            return f"provides conclusive evidence (LR={lr:.1f}x) for {disease_a} over {disease_b}"
        elif lr >= 5.0:
            return f"provides strong evidence (LR={lr:.1f}x) supporting {disease_a} over {disease_b}"
        elif lr >= 2.0:
            return f"provides moderate evidence (LR={lr:.1f}x) favoring {disease_a} over {disease_b}"
        else:
            return f"provides weak or supportive evidence (LR={lr:.2f}x) leaning toward {disease_a}"
    else:
        inv_lr = 1.0 / lr if lr > 0 else 1.0
        if inv_lr >= 10.0:
            return f"strongly refutes {disease_a} in favor of {disease_b} (LR={inv_lr:.1f}x for {disease_b})"
        elif inv_lr >= 5.0:
            return f"provides substantial evidence favoring differential diagnosis {disease_b} (LR={inv_lr:.1f}x)"
        elif inv_lr >= 2.0:
            return f"provides moderate evidence favoring {disease_b} (LR={inv_lr:.1f}x)"
        else:
            return f"mildly shifts likelihood toward {disease_b} (LR={inv_lr:.2f}x)"


def generate_feature_insights(
    feature: str,
    val: Any,
    lr: float,
    impact: float,
    disease_a: str,
    disease_b: str
) -> Dict[str, str]:
    """Generate both scientific/clinical and plain-English insights for a single biomarker."""
    meta = FEATURE_CLINICAL_META.get(feature, {})
    is_positive = impact >= 0
    ratio = lr if is_positive else (1.0 / lr if lr > 0 else 1.0)
    str_val = str(val).strip()
    
    # 1. Scientific Insight (Clinician-facing)
    scientific_lr_str = f"LR={ratio:.1f}x" if ratio < 100 else "LR>100x"
    target = disease_a if is_positive else disease_b
    strength_phrase = _get_lr_description(ratio, is_positive, disease_a, disease_b)
    
    if feature in ("ESR", "CRP"):
        num_val = float(val) if isinstance(val, (int, float)) else None
        if num_val is not None:
            norm_desc = "elevated systemic inflammatory response" if (feature == "ESR" and num_val > 20) or (feature == "CRP" and num_val > 5) else "normal/mild systemic inflammatory activity"
            sci_desc = f"{feature} = {val} {meta.get('unit', '')} reflects {norm_desc}. Bayes factor {scientific_lr_str} {strength_phrase} based on disease cohort density histograms."
            plain_desc = f"Your {meta.get('plain_name', feature)} level is {val} {meta.get('unit', '')}. This indicates {'active general inflammation' if 'elevated' in norm_desc else 'little or no systemic inflammation'}, pointing toward {target}."
        else:
            sci_desc = f"{feature} = {val}: Bayes evidence {scientific_lr_str}."
            plain_desc = f"{meta.get('plain_name', feature)} is {val}, leaning toward {target}."
            
    elif feature in ("RF", "Anti-CCP"):
        num_val = float(val) if isinstance(val, (int, float)) else None
        if num_val is not None:
            is_high = (feature == "RF" and num_val >= 20) or (feature == "Anti-CCP" and num_val >= 20)
            titre_desc = "positive/elevated autoantibody titer" if is_high else "negative/sub-threshold titer"
            sci_desc = f"{feature} = {val} {meta.get('unit', '')} ({titre_desc}) has high diagnostic specificity. Bayes evidence {scientific_lr_str} {strength_phrase}."
            plain_desc = f"Your {meta.get('plain_name', feature)} is {val} {meta.get('unit', '')} ({'positive' if is_high else 'negative'}). This {'strongly suggests Rheumatoid Arthritis autoantibody activity' if is_high else 'suggests joint-damaging rheumatoid antibodies are not present'}, favoring {target}."
        else:
            sci_desc = f"{feature} = {val}: Bayes evidence {scientific_lr_str}."
            plain_desc = f"{meta.get('plain_name', feature)} is {val}, leaning toward {target}."

    elif feature in ("HLA-B27", "ANA", "Anti-Ro", "Anti-La", "Anti-dsDNA", "Anti-Sm"):
        is_pos = str_val.lower() in ("positive", "pos", "1", "1.0", "true", "present")
        state_str = "Positive" if is_pos else "Negative"
        sci_desc = f"{feature} is {state_str}. {meta.get('description', '')}. Bayes evidence {scientific_lr_str} {strength_phrase}."
        if is_pos:
            plain_desc = f"Your {meta.get('plain_name', feature)} test came back Positive. This indicates the presence of antibodies associated with {target}."
        else:
            plain_desc = f"Your {meta.get('plain_name', feature)} test came back Negative. Absence of this marker helps rule out conditions that depend on it."

    elif feature in ("C3", "C4"):
        num_val = float(val) if isinstance(val, (int, float)) else None
        if num_val is not None:
            is_low = (feature == "C3" and num_val < 90) or (feature == "C4" and num_val < 10)
            comp_state = "hypocomplementemia (immune complex consumption)" if is_low else "preserved/normal complement titer"
            sci_desc = f"{feature} = {val} {meta.get('unit', '')} demonstrates {comp_state}. Bayes evidence {scientific_lr_str} {strength_phrase}."
            plain_desc = f"Your {meta.get('plain_name', feature)} is {val} {meta.get('unit', '')} ({'low, indicating immune proteins are being consumed by inflammation' if is_low else 'in normal range'}), favoring {target}."
        else:
            sci_desc = f"{feature} = {val}: Bayes evidence {scientific_lr_str}."
            plain_desc = f"{meta.get('plain_name', feature)} is {val}, leaning toward {target}."
            
    else:
        sci_desc = f"{feature} = {val}: Bayes evidence {scientific_lr_str} {strength_phrase}."
        plain_desc = f"{feature} value of {val} leans toward {target}."

    return {
        "clinical_insight": sci_desc,
        "plain_language": plain_desc,
    }


def generate_single_disease_feature_insight(
    feature: str,
    val: Any,
    impact: float,
    factor: float,
    target_disease: str
) -> Dict[str, str]:
    """Generate disease-specific clinical pearl (clinician) and plain English explanation (patient)."""
    meta = FEATURE_CLINICAL_META.get(feature, {})
    plain_feat = meta.get("plain_name", feature)
    plain_disease = DISEASE_PLAIN_NAMES.get(target_disease, target_disease)
    is_favoring = impact >= 0
    str_val = str(val).strip()
    factor_str = f"{factor:.1f}x" if factor < 100 else ">100x"

    if feature in ("ESR", "CRP"):
        num_val = float(val) if isinstance(val, (int, float)) else None
        is_elevated = (feature == "ESR" and num_val and num_val > 20) or (feature == "CRP" and num_val and num_val > 5)
        if target_disease in ("Ankylosing Spondylitis", "Reactive Arthritis", "Psoriatic Arthritis", "Rheumatoid Arthritis", "Systemic Lupus Erythematosus"):
            if is_elevated:
                sci = f"{feature} = {val} {meta.get('unit', '')} demonstrates marked systemic inflammation ({factor_str} evidence factor), characteristic of active disease flares in {target_disease}."
                plain = f"Your {plain_feat} of {val} {meta.get('unit', '')} shows high inflammation in the blood, consistent with active inflammation seen in {plain_disease}."
            else:
                sci = f"{feature} = {val} {meta.get('unit', '')} is within or near normal limits, indicating low inflammatory burden or subclinical disease activity."
                plain = f"Your {plain_feat} is {val} {meta.get('unit', '')}, indicating inflammation is mild or controlled."
        elif target_disease == "Normal":
            if not is_elevated:
                sci = f"{feature} = {val} {meta.get('unit', '')} is within normal reference limits, providing negative evidence against systemic inflammatory arthropathies."
                plain = f"Your {plain_feat} of {val} {meta.get('unit', '')} is within the normal healthy range, indicating no active inflammatory arthritis."
            else:
                sci = f"{feature} = {val} {meta.get('unit', '')} is mildly elevated, but without specific autoantibody support."
                plain = f"Your {plain_feat} is slightly elevated at {val} {meta.get('unit', '')}, but not accompanied by joint antibodies."
        else:
            sci = f"{feature} = {val} {meta.get('unit', '')}: Bayes evidence factor {factor_str} for {target_disease}."
            plain = f"Your {plain_feat} is {val} {meta.get('unit', '')}, supporting {plain_disease}."

    elif feature in ("RF", "Anti-CCP"):
        num_val = float(val) if isinstance(val, (int, float)) else None
        is_high = (feature == "RF" and num_val and num_val >= 20) or (feature == "Anti-CCP" and num_val and num_val >= 20)
        if target_disease == "Rheumatoid Arthritis":
            if is_high:
                sci = f"{feature} = {val} {meta.get('unit', '')} is strongly positive ({factor_str} evidence factor). Specific hallmark of seropositive Rheumatoid Arthritis with high erosive risk."
                plain = f"Your {plain_feat} test is positive at {val} {meta.get('unit', '')}. This is a key antibody that specifically attacks joint linings in Rheumatoid Arthritis."
            else:
                sci = f"{feature} = {val} {meta.get('unit', '')} is negative, suggesting seronegative RA or atypical presentation."
                plain = f"Your {plain_feat} test is negative or low ({val} {meta.get('unit', '')}), suggesting seronegative presentation."
        else:
            if not is_high:
                sci = f"{feature} = {val} {meta.get('unit', '')} is negative/non-reactive ({factor_str} evidence factor). Essential finding ruling out seropositive Rheumatoid Arthritis and supporting {target_disease}."
                plain = f"Your {plain_feat} is negative ({val} {meta.get('unit', '')}). This is an important negative result that helps rule out Rheumatoid Arthritis, supporting the diagnosis of {plain_disease}."
            else:
                sci = f"{feature} = {val} {meta.get('unit', '')} is positive ({factor_str} evidence factor), which can occur in autoimmune overlap or non-specific RF titers."
                plain = f"Your {plain_feat} is mildly elevated at {val} {meta.get('unit', '')}, which can occasionally appear in other immune conditions."

    elif feature == "HLA-B27":
        is_pos = str_val.lower() in ("positive", "pos", "1", "1.0", "true", "present")
        if target_disease in ("Ankylosing Spondylitis", "Reactive Arthritis"):
            if is_pos:
                sci = f"HLA-B27 is Positive ({factor_str} evidence factor). Strong genetic predisposition allele present in >85-90% of Ankylosing Spondylitis and 50-80% of Reactive Arthritis cases."
                plain = f"Your HLA-B27 genetic test is Positive. This genetic marker is found in the vast majority of people with spinal arthritis ({plain_disease})."
            else:
                sci = f"HLA-B27 is Negative. While not excluding seronegative spondyloarthropathy, axial disease probability is reduced."
                plain = f"Your HLA-B27 genetic test is Negative."
        else:
            if not is_pos:
                sci = f"HLA-B27 is Negative ({factor_str} evidence factor). Helps rule out primary axial spondyloarthropathies."
                plain = f"Your HLA-B27 test is Negative, helping rule out spinal arthritis."
            else:
                sci = f"HLA-B27 is Positive; present in ~6-8% of the healthy background population."
                plain = f"Your HLA-B27 test is Positive, which can be present in up to 8% of the general population without spine arthritis."

    elif feature in ("Anti-dsDNA", "Anti-Sm"):
        is_pos = str_val.lower() in ("positive", "pos", "1", "1.0", "true", "present")
        if target_disease == "Systemic Lupus Erythematosus":
            if is_pos:
                sci = f"{feature} is Positive ({factor_str} evidence factor). Highly specific pathognomonic marker satisfying ACR/EULAR classification criteria for Systemic Lupus Erythematosus."
                plain = f"Your {plain_feat} test is Positive. This antibody is extremely specific to Lupus and strongly confirms the condition."
            else:
                sci = f"{feature} is Negative."
                plain = f"Your {plain_feat} test is Negative."
        else:
            if not is_pos:
                sci = f"{feature} is Negative ({factor_str} evidence factor). Decisively excludes Systemic Lupus Erythematosus."
                plain = f"Your {plain_feat} test is Negative, safely ruling out Lupus and keeping {plain_disease} the primary diagnosis."
            else:
                sci = f"{feature} is Positive; unusual for {target_disease}."
                plain = f"Your {plain_feat} test is Positive, which is unusual for {plain_disease}."

    elif feature in ("Anti-Ro", "Anti-La"):
        is_pos = str_val.lower() in ("positive", "pos", "1", "1.0", "true", "present")
        if target_disease == "Sjögren's Syndrome":
            if is_pos:
                sci = f"{feature} is Positive ({factor_str} evidence factor). Primary diagnostic criterion antibody targeting Ro/La ribonucleoproteins in Sjögren's exocrine disease."
                plain = f"Your {plain_feat} test is Positive. This antibody directly targets moisture glands, a classic indicator of Sjögren's Syndrome."
            else:
                sci = f"{feature} is Negative."
                plain = f"Your {plain_feat} test is Negative."
        else:
            if not is_pos:
                sci = f"{feature} is Negative ({factor_str} evidence factor). Rules out primary Sjögren's syndrome."
                plain = f"Your {plain_feat} test is Negative, ruling out Sjögren's syndrome."
            else:
                sci = f"{feature} is Positive; indicates possible secondary sicca or autoimmune overlap."
                plain = f"Your {plain_feat} test is Positive."

    elif feature == "ANA":
        is_pos = str_val.lower() in ("positive", "pos", "1", "1.0", "true", "present")
        if target_disease in ("Systemic Lupus Erythematosus", "Sjögren's Syndrome"):
            if is_pos:
                sci = f"ANA is Positive ({factor_str} evidence factor). Highly sensitive screening marker indicating systemic antinuclear autoimmunity."
                plain = f"Your Antinuclear Antibodies (ANA) test is Positive, indicating your immune system is actively targeting cellular proteins."
            else:
                sci = f"ANA is Negative; highly atypical for systemic connective tissue disease."
                plain = f"Your ANA test is Negative."
        else:
            if not is_pos:
                sci = f"ANA is Negative ({factor_str} evidence factor). Strongly argues against systemic connective tissue disease (Lupus, Sjögren's), favoring {target_disease}."
                plain = f"Your ANA screening test is Negative, meaning general connective tissue autoimmunity is absent, supporting {plain_disease}."
            else:
                sci = f"ANA is Positive; low-titer ANA can occur in spondyloarthropathies or normal individuals."
                plain = f"Your ANA test is Positive."

    elif feature in ("C3", "C4"):
        num_val = float(val) if isinstance(val, (int, float)) else None
        is_low = (feature == "C3" and num_val and num_val < 90) or (feature == "C4" and num_val and num_val < 10)
        if target_disease == "Systemic Lupus Erythematosus":
            if is_low:
                sci = f"{feature} = {val} {meta.get('unit', '')} reveals hypocomplementemia ({factor_str} evidence factor). Demonstrates classical pathway complement consumption during immune-complex-mediated lupus flares."
                plain = f"Your {plain_feat} is low at {val} {meta.get('unit', '')}. This indicates immune proteins are being used up, a classic sign of active Lupus."
            else:
                sci = f"{feature} = {val} {meta.get('unit', '')} is normal; complement consumption is not evident."
                plain = f"Your {plain_feat} is in normal range."
        else:
            if not is_low:
                sci = f"{feature} = {val} {meta.get('unit', '')} is normal ({factor_str} evidence factor). Preserved complement cascade confirms absence of classical immune-complex consumption, supporting {target_disease}."
                plain = f"Your {plain_feat} is normal at {val} {meta.get('unit', '')}, showing your immune proteins are intact and healthy."
            else:
                sci = f"{feature} = {val} {meta.get('unit', '')} is decreased."
                plain = f"Your {plain_feat} is low at {val} {meta.get('unit', '')}."

    else:
        sci = f"{feature} = {val}: Bayes evidence factor {factor_str} for {target_disease}."
        plain = f"Your {plain_feat} of {val} supports {plain_disease}."

    return {
        "clinical_insight": sci,
        "plain_language": plain
    }


def compute_single_disease_attribution(
    model_bundle: Optional[Dict[str, Any]],
    inference_module: Any,
    patient_dict: Dict[str, Any],
    target_disease: str
) -> List[Dict[str, Any]]:
    """Compute exact single-disease attribution scores for all measured biomarkers."""
    if not model_bundle or not inference_module:
        return []
    
    classes = model_bundle.get("classes", [])
    if target_disease not in classes:
        return []
    
    k = classes.index(target_disease)
    raw_df = inference_module._frame([patient_dict])
    X = inference_module.encode_raw(raw_df)[inference_module.BASE_COLS]
    B = model_bundle.get("bayes", {})
    tables = B.get("tables", {})
    
    items = []
    num_classes = len(classes)
    for c in inference_module.TESTS:
        v = X[c].iloc[0]
        if pd.isna(v) or c not in tables:
            continue
        t = tables[c]
        i = int(inference_module._bin_index(t, np.array([float(v)]))[0])
        logdens_k = float(t["logdens"][k, i])
        other_indices = [r for r in range(num_classes) if r != k]
        mean_other = float(np.mean([t["logdens"][r, i] for r in other_indices]))
        impact = logdens_k - mean_other
        factor = float(np.exp(np.clip(impact, -20.0, 20.0)))
        display_val = inference_module._display(c, v)
        
        # Determine evidence level
        if impact >= 2.3:  # LR >= ~10x
            lvl = "Strong Favor"
        elif impact >= 0.7:  # LR >= ~2x
            lvl = "Moderate Favor"
        elif impact >= 0.0:
            lvl = "Supportive"
        else:
            lvl = "Neutral / Atypical"
            
        insights = generate_single_disease_feature_insight(c, display_val, impact, factor, target_disease)
        
        items.append({
            "feature": c,
            "value": display_val,
            "impact": impact,
            "likelihood_ratio": factor,
            "favors_target": impact >= 0,
            "evidence_level": lvl,
            "clinical_insight": insights["clinical_insight"],
            "plain_language": insights["plain_language"]
        })
        
    items.sort(key=lambda x: x["impact"], reverse=True)
    return items


def generate_single_disease_narratives(
    target_disease: str,
    patient_dict: Dict[str, Any],
    prediction_dict: Dict[str, Any],
    disease_evidence: List[Dict[str, Any]],
    not_tested: List[str]
) -> Dict[str, str]:
    """Generate overall single-disease scientific and general explanations answering why target_disease was predicted."""
    prob = prediction_dict.get("confidence", 0.0) or 0.0
    status = prediction_dict.get("status", "unknown")
    plain_disease = DISEASE_PLAIN_NAMES.get(target_disease, target_disease)
    
    top_favoring = [x for x in disease_evidence if x.get("favors_target")]
    neutral_atypical = [x for x in disease_evidence if not x.get("favors_target")]
    
    # 1. Scientific summary for doctors
    fav_bullets = [f"{x['feature']}={x['value']} ({x.get('evidence_level', 'Supportive')})" for x in top_favoring[:4]]
    sci_parts = [
        f"Diagnostic attribution for {target_disease} (posterior probability: {prob * 100:.1f}%) "
        f"derived from exact Range-Aware Bayes density evaluation."
    ]
    if fav_bullets:
        sci_parts.append(f"Key concordant findings: {', '.join(fav_bullets)}.")
    if neutral_atypical:
        atyp_bullets = [f"{x['feature']}={x['value']}" for x in neutral_atypical[:2]]
        sci_parts.append(f"Neutral or atypical findings for this disease profile: {', '.join(atyp_bullets)}.")
    
    if status == "confident":
        sci_parts.append(
            f"Posterior confidence of {prob * 100:.1f}% satisfies the calibrated Safe Mode threshold (>= 66.7%), "
            f"qualifying this prediction for high-certainty clinical decision support (benchmark accuracy 96.6%)."
        )
    else:
        sci_parts.append(
            f"Posterior confidence ({prob * 100:.1f}%) lies below the safe gating threshold. "
            f"Clinical correlation and testing of missing parameters ({len(not_tested)} unmeasured) are recommended."
        )
    sci_summary = " ".join(sci_parts)
    
    # 2. General plain-language summary for patients
    plain_parts = [
        f"The diagnostic system suggests '{plain_disease}' as your most probable condition "
        f"based on your laboratory blood work and medical measurements."
    ]
    if top_favoring:
        fav_plain_names = [
            f"{FEATURE_CLINICAL_META.get(x['feature'], {}).get('plain_name', x['feature'])} ({x['value']})"
            for x in top_favoring[:3]
        ]
        plain_parts.append(f"The primary findings pointing to this condition are your {', '.join(fav_plain_names)}.")
    
    if status == "confident":
        plain_parts.append(
            f"The system has high confidence ({prob * 100:.1f}%) in this result because your key biomarkers "
            f"closely match the established clinical profile for {plain_disease}."
        )
    else:
        plain_parts.append(
            f"Because some tests are not yet completed or have borderline values ({prob * 100:.1f}% confidence), "
            f"your doctor may want to review additional tests to confirm this finding."
        )
    plain_parts.append(
        "Important: This is an AI clinical decision support tool for discussion with your doctor and is not a final medical diagnosis."
    )
    general_summary = " ".join(plain_parts)
    
    return {
        "scientific_summary": sci_summary,
        "general_summary": general_summary
    }


def generate_explanations(
    explanation_dict: Dict[str, Any],
    patient_dict: Dict[str, Any],
    prediction_dict: Dict[str, Any],
    model_bundle: Optional[Dict[str, Any]] = None,
    inference_module: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Enrich the explanation dictionary with:
    - scientific_summary & general_summary (comparative)
    - single_disease_scientific_summary & single_disease_general_summary (why this disease was predicted)
    - disease_evidence: exact attribution scores favoring this specific disease
    - key_findings & questions_for_doctor
    """
    explained_class = explanation_dict.get("explained_class", "")
    compared_with = explanation_dict.get("compared_with", "")
    prob_a = explanation_dict.get("probability", 0.0)
    prob_b = explanation_dict.get("probability_compared", 0.0)
    confidence = prediction_dict.get("confidence", prob_a)
    status = prediction_dict.get("status", "unknown")
    pushes_toward = explanation_dict.get("pushes_toward", [])
    pushes_against = explanation_dict.get("pushes_against", [])
    not_tested = explanation_dict.get("not_tested", [])

    # Single disease attribution & narratives
    disease_evidence = compute_single_disease_attribution(
        model_bundle=model_bundle,
        inference_module=inference_module,
        patient_dict=patient_dict,
        target_disease=explained_class
    )
    single_disease_narratives = generate_single_disease_narratives(
        target_disease=explained_class,
        patient_dict=patient_dict,
        prediction_dict=prediction_dict,
        disease_evidence=disease_evidence,
        not_tested=not_tested
    )

    # Enrich each evidence item with clinical and plain language annotations
    enriched_toward = []
    for item in pushes_toward:
        feat = item.get("feature", "")
        val = item.get("value")
        imp = item.get("impact", 0.0)
        lr = item.get("likelihood_ratio", math.exp(imp))
        insights = generate_feature_insights(feat, val, lr, imp, explained_class, compared_with)
        enriched_item = dict(item)
        enriched_item["clinical_insight"] = insights["clinical_insight"]
        enriched_item["plain_language"] = insights["plain_language"]
        enriched_toward.append(enriched_item)

    enriched_against = []
    for item in pushes_against:
        feat = item.get("feature", "")
        val = item.get("value")
        imp = item.get("impact", 0.0)
        lr = item.get("likelihood_ratio", math.exp(imp))
        insights = generate_feature_insights(feat, val, lr, imp, explained_class, compared_with)
        enriched_item = dict(item)
        enriched_item["clinical_insight"] = insights["clinical_insight"]
        enriched_item["plain_language"] = insights["plain_language"]
        enriched_against.append(enriched_item)

    # Top drivers
    top_favoring = sorted(enriched_toward, key=lambda x: abs(x.get("impact", 0)), reverse=True)
    top_refuting = sorted(enriched_against, key=lambda x: abs(x.get("impact", 0)), reverse=True)

    # 1. Build Scientific Summary for Clinicians (Comparative)
    fav_features = [f"{x['feature']} (LR={x.get('likelihood_ratio', 1.0):.1f}x)" for x in top_favoring[:3]]
    against_features = [f"{x['feature']} (LR={1.0 / max(x.get('likelihood_ratio', 1.0), 1e-4):.1f}x for {compared_with})" for x in top_refuting[:3]]

    sci_parts = []
    sci_parts.append(
        f"Differential diagnostic assessment between {explained_class} (posterior: {prob_a * 100:.1f}%) "
        f"and {compared_with} (posterior: {prob_b * 100:.1f}%) using temperature-calibrated Range-aware Bayes (T=1.069)."
    )
    if fav_features:
        sci_parts.append(f"Primary supporting evidence for {explained_class}: {', '.join(fav_features)}.")
    if against_features:
        sci_parts.append(f"Counter-evidence favoring differential candidate {compared_with}: {', '.join(against_features)}.")
    else:
        sci_parts.append(f"No significant measured biomarkers favored the alternative condition {compared_with}.")

    if status == "confident":
        sci_parts.append(
            f"Posterior confidence of {confidence * 100:.1f}% satisfies the calibrated Safe Mode decision gate "
            f"(threshold >= 66.7%), placing this prediction in the high-certainty operational band (benchmark accuracy 96.6%)."
        )
    elif status == "needs_review":
        sci_parts.append(
            f"Posterior confidence ({confidence * 100:.1f}%) lies below the 66.7% safe gating threshold. "
            f"A multidisciplinary clinical review is recommended. Review unmeasured tests ({len(not_tested)} unmeasured) "
            f"for high-information-gain differential discrimination."
        )

    scientific_summary = " ".join(sci_parts)

    # 2. Build General / Plain-Language Summary for Patients & Non-specialists (Comparative)
    plain_parts = []
    plain_disease = DISEASE_PLAIN_NAMES.get(explained_class, explained_class)
    plain_compared = DISEASE_PLAIN_NAMES.get(compared_with, compared_with)

    plain_parts.append(
        f"Based on your entered blood tests and medical measurements, the decision-support system suggests "
        f"'{plain_disease}' as the most probable consideration, compared to '{plain_compared}'."
    )

    if top_favoring:
        top_fav_names = [f"{FEATURE_CLINICAL_META.get(x['feature'], {}).get('plain_name', x['feature'])} ({x['value']})" for x in top_favoring[:2]]
        plain_parts.append(f"Key tests pointing in this direction include your { ' and '.join(top_fav_names) }.")

    if top_refuting:
        top_against_names = [f"{FEATURE_CLINICAL_META.get(x['feature'], {}).get('plain_name', x['feature'])} ({x['value']})" for x in top_refuting[:2]]
        plain_parts.append(f"On the other hand, your {' and '.join(top_against_names)} lean somewhat toward {plain_compared}.")

    if status == "confident":
        plain_parts.append(
            f"The system has high confidence ({confidence * 100:.1f}%) in this assessment based on the available test results."
        )
    elif status == "needs_review":
        plain_parts.append(
            f"Because some key tests have not yet been performed or give balanced signals ({confidence * 100:.1f}% confidence), "
            f"this is not a definitive diagnosis. Your doctor will likely want to review your full symptoms and consider completing missing tests."
        )

    plain_parts.append(
        "Important Note: This AI analysis provides clinical decision support for discussion with your healthcare provider. "
        "It does not replace a medical doctor's physical examination, medical history review, or formal diagnosis."
    )

    general_summary = " ".join(plain_parts)

    # 3. Key Findings (Concise Bullet Points)
    key_findings = []
    for item in top_favoring[:3]:
        feat = item["feature"]
        pname = FEATURE_CLINICAL_META.get(feat, {}).get("plain_name", feat)
        key_findings.append(f"Supports {explained_class}: {pname} = {item['value']} ({item.get('likelihood_ratio', 1.0):.1f}x evidence)")
    for item in top_refuting[:2]:
        feat = item["feature"]
        pname = FEATURE_CLINICAL_META.get(feat, {}).get("plain_name", feat)
        inv = 1.0 / max(item.get("likelihood_ratio", 1.0), 1e-4)
        key_findings.append(f"Points toward {compared_with}: {pname} = {item['value']} ({inv:.1f}x evidence)")

    # 4. Questions for Doctor (Patient Empowerment)
    questions = [
        f"Could my symptoms and test results be explained by {explained_class} or {compared_with}?",
        "Do I need any additional blood tests or imaging (such as X-rays or MRI) to clarify this diagnosis?",
    ]
    if not_tested:
        first_few_missing = [FEATURE_CLINICAL_META.get(t, {}).get("plain_name", t) for t in not_tested[:2]]
        questions.append(f"Would checking {', '.join(first_few_missing)} help provide a clearer clinical picture?")
    questions.append("What symptom changes or red flags should prompt me to seek immediate medical attention?")

    return {
        "method": explanation_dict.get("method", "exact likelihood ratios"),
        "explained_class": explained_class,
        "compared_with": compared_with,
        "probability": prob_a,
        "probability_compared": prob_b,
        "not_tested": not_tested,
        "pushes_toward": enriched_toward,
        "pushes_against": enriched_against,
        "scientific_summary": scientific_summary,
        "general_summary": general_summary,
        "single_disease_scientific_summary": single_disease_narratives["scientific_summary"],
        "single_disease_general_summary": single_disease_narratives["general_summary"],
        "disease_evidence": disease_evidence,
        "key_findings": key_findings,
        "questions_for_doctor": questions,
    }

