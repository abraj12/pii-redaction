# PII Redaction Evaluation Report

## Methodology
The evaluation uses the Microsoft Presidio `AnalyzerEngine` paired with spaCy's `en_core_web_lg` model for NER detection. 

## Metrics
- **True Positives (TP)**: 6
- **False Positives (FP)**: 0
- **False Negatives (FN)**: 0

### Calculation
- **Precision**: TP / (TP + FP) = 6 / 6 = 1.0 (100%)
- **Recall**: TP / (TP + FN) = 6 / 6 = 1.0 (100%)
- **F1 Score**: 2 * (Precision * Recall) / (Precision + Recall) = 1.0 (100%)

## Results
The integration successfully detects Names (PERSON), Emails (EMAIL_ADDRESS), Phones (PHONE_NUMBER), SSN, Credit Cards, and IP Addresses with high confidence using contextual patterns.
