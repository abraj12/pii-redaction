from presidio_analyzer import AnalyzerEngine, RecognizerRegistry, PatternRecognizer, Pattern
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig
from typing import Dict, List, Any
import random

SUPPORTED_ENTITIES = [
    "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "ORGANIZATION",
    "LOCATION", "ADDRESS", "US_SSN", "CREDIT_CARD", "DATE_TIME",
    "IP_ADDRESS", "PAN", "AADHAAR", "PASSPORT", "DRIVING_LICENSE",
    "BANK_ACCOUNT", "IFSC", "DOB"
]

def generate_fake(entity_type: str, original_text: str) -> str:
    return f"[REDACTED_{entity_type}]"

def _pattern(name: str, regex: str, score: float) -> Pattern:
    return Pattern(name=name, regex=regex, score=score)

class PIIService:
    def __init__(self):
        provider = NlpEngineProvider(nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_lg"}]
        })
        nlp_engine = provider.create_engine()

        registry = RecognizerRegistry()
        registry.load_predefined_recognizers(nlp_engine=nlp_engine)
        self._register_custom_recognizers(registry)
        self.analyzer = AnalyzerEngine(registry=registry, nlp_engine=nlp_engine)
        self.anonymizer = AnonymizerEngine()

    def _register_custom_recognizers(self, registry: RecognizerRegistry) -> None:
        recognizers = [
            PatternRecognizer("EMAIL_ADDRESS", patterns=[
                _pattern("email", r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b", 0.9)
            ]),
            PatternRecognizer("PHONE_NUMBER", patterns=[
                _pattern("phone", r"(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,6}\b", 0.65)
            ]),
            PatternRecognizer("PAN", patterns=[
                _pattern("india_pan", r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", 0.85)
            ], context=["pan", "income tax", "permanent account"]),
            PatternRecognizer("AADHAAR", patterns=[
                _pattern("aadhaar", r"\b\d{4}\s?\d{4}\s?\d{4}\b", 0.7)
            ], context=["aadhaar", "uidai"]),
            PatternRecognizer("PASSPORT", patterns=[
                _pattern("passport", r"\b[A-Z][0-9]{7}\b", 0.55)
            ], context=["passport"]),
            PatternRecognizer("DRIVING_LICENSE", patterns=[
                _pattern("driving_license", r"\b[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}\b", 0.65)
            ], context=["driving", "license", "licence"]),
            PatternRecognizer("BANK_ACCOUNT", patterns=[
                _pattern("bank_account", r"\b\d{9,18}\b", 0.45)
            ], context=["account", "bank", "a/c"]),
            PatternRecognizer("IFSC", patterns=[
                _pattern("ifsc", r"\b[A-Z]{4}0[A-Z0-9]{6}\b", 0.85)
            ], context=["ifsc", "bank"]),
            PatternRecognizer("DOB", patterns=[
                _pattern("dob", r"\b(?:date of birth|dob|d\.o\.b\.?)\s*[:\-]?\s*(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})", 0.8)
            ]),
            PatternRecognizer("ADDRESS", patterns=[
                _pattern("address_like", r"\b\d{1,6}\s+[A-Za-z0-9.,'&\-\s]{5,80}\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Nagar|Marg|Sector|Block)\b", 0.45)
            ], context=["address", "registered office", "residence"]),
        ]
        for recognizer in recognizers:
            registry.add_recognizer(recognizer)

    def analyze_text(self, text: str) -> List[Any]:
        return self.analyzer.analyze(text=text, entities=SUPPORTED_ENTITIES, language="en")

    def redact_text(self, text: str, analyzer_results: List[Any], mapping: Dict = None) -> (str, Dict):
        if mapping is None:
            mapping = {}

        for res in analyzer_results:
            entity_text = text[res.start:res.end]
            if entity_text not in mapping:
                mapping[entity_text] = {
                    "type": res.entity_type,
                    "value": generate_fake(res.entity_type, entity_text)
                }

        operators = {
            entity: OperatorConfig("replace", {"new_value": f"[{entity}]"})
            for entity in SUPPORTED_ENTITIES
        }
        result = self.anonymizer.anonymize(text=text, analyzer_results=analyzer_results, operators=operators)
        redacted_text = result.text
        for original, data in mapping.items():
            redacted_text = redacted_text.replace(f"[{data['type']}]", data["value"], 1)
        return redacted_text, mapping
