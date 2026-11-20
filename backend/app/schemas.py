from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict

class PatientInput(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    Age: Optional[Union[float, int, str]] = None
    Gender: Optional[Union[float, int, str]] = None
    ESR: Optional[Union[float, int, str]] = None
    CRP: Optional[Union[float, int, str]] = None
    RF: Optional[Union[float, int, str]] = None
    Anti_CCP: Optional[Union[float, int, str]] = Field(default=None, alias="Anti-CCP")
    HLA_B27: Optional[Union[float, int, str]] = Field(default=None, alias="HLA-B27")
    ANA: Optional[Union[float, int, str]] = None
    Anti_Ro: Optional[Union[float, int, str]] = Field(default=None, alias="Anti-Ro")
    Anti_La: Optional[Union[float, int, str]] = Field(default=None, alias="Anti-La")
    Anti_dsDNA: Optional[Union[float, int, str]] = Field(default=None, alias="Anti-dsDNA")
    Anti_Sm: Optional[Union[float, int, str]] = Field(default=None, alias="Anti-Sm")
    C3: Optional[Union[float, int, str]] = None
    C4: Optional[Union[float, int, str]] = None

    def to_original_dict(self) -> Dict[str, Any]:
        """Convert to dictionary using original column names expected by inference.py."""
        data = self.model_dump(by_alias=True)
        return {k: v for k, v in data.items() if v is not None}

class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    patient: PatientInput
    mode: str = "default"
    compare_with: Optional[str] = None
    target_class: Optional[str] = None

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        if v not in ("default", "sensitive"):
            raise ValueError("mode must be 'default' or 'sensitive'")
        return v

class RecommendationItem(BaseModel):
    test: str
    current_confidence: float
    expected_confidence_after: float
    chance_of_confident_answer: float

class EvidenceItem(BaseModel):
    feature: str
    value: Any
    impact: float
    likelihood_ratio: Optional[float] = None
    clinical_insight: Optional[str] = None
    plain_language: Optional[str] = None
    favors_target: Optional[bool] = None
    evidence_level: Optional[str] = None

class PredictionResult(BaseModel):
    predicted_disease: Optional[str] = None
    confidence: Optional[float] = None
    runner_up: Optional[str] = None
    probabilities: Optional[Dict[str, float]] = None
    status: str  # 'confident', 'needs_review', 'insufficient_data'
    mode: str = "default"
    missing_tests: List[str] = []
    n_missing_tests: int = 0
    warnings: List[str] = []
    recommended_tests: List[RecommendationItem] = []
    message: Optional[str] = None
    most_probable_disease: Optional[str] = None

class ExplanationResult(BaseModel):
    method: str
    explained_class: str
    compared_with: str
    probability: float
    probability_compared: float
    not_tested: List[str] = []
    pushes_toward: List[EvidenceItem] = []
    pushes_against: List[EvidenceItem] = []
    scientific_summary: Optional[str] = None
    general_summary: Optional[str] = None
    single_disease_scientific_summary: Optional[str] = None
    single_disease_general_summary: Optional[str] = None
    disease_evidence: Optional[List[EvidenceItem]] = []
    key_findings: Optional[List[str]] = []
    questions_for_doctor: Optional[List[str]] = []

class AnalysisResponse(BaseModel):
    prediction: PredictionResult
    explanation: Optional[ExplanationResult] = None
    recommendations: List[RecommendationItem] = []

class HealthResponse(BaseModel):
    status: str
    model_version: str
    model: str
    classes: List[str]
    confidence_threshold: float
    min_measured_tests: int
    sensitivity_strength: float

class InputFeatureMeta(BaseModel):
    name: str
    label: str
    group: str
    type: str  # 'lab' or 'antibody' or 'demographic'
    unit: Optional[str] = None
    training_range: Optional[List[float]] = None
    description: str

class ModelInfoResponse(BaseModel):
    model_name: str
    classes: List[str]
    short_names: List[str]
    confidence_threshold: float
    min_measured_tests: int
    sensitivity_lambda: float
    inputs: List[InputFeatureMeta]
    mode_descriptions: Dict[str, str]

class BatchRowResult(BaseModel):
    row_index: int
    predicted_disease: Optional[str] = None
    confidence: Optional[float] = None
    runner_up: Optional[str] = None
    status: str
    n_missing_tests: int = 0
    warnings: List[str] = []
    error: Optional[str] = None

class BatchSummary(BaseModel):
    total_rows: int
    successful_rows: int
    status_counts: Dict[str, int]
    disease_counts: Dict[str, int]

class BatchResponse(BaseModel):
    summary: BatchSummary
    results: List[BatchRowResult]
