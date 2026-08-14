# PII Redaction Evaluation Report

## Methodology
This report evaluates deterministic ground-truth samples for supported PII categories. It is a regression harness, not a substitute for a larger labelled corpus.

## Overall Metrics
- TP: 10
- FP: 1
- FN: 0
- Precision: 0.909
- Recall: 1.000
- F1: 0.952
- Accuracy: 0.909

## Category Breakdown
- PERSON: precision=1.000, recall=1.000, f1=1.000
- EMAIL_ADDRESS: precision=1.000, recall=1.000, f1=1.000
- PHONE_NUMBER: precision=1.000, recall=1.000, f1=1.000
- US_SSN: precision=1.000, recall=1.000, f1=1.000
- CREDIT_CARD: precision=1.000, recall=1.000, f1=1.000
- IP_ADDRESS: precision=1.000, recall=1.000, f1=1.000
- PAN: precision=1.000, recall=1.000, f1=1.000
- AADHAAR: precision=0.500, recall=1.000, f1=0.667
- IFSC: precision=1.000, recall=1.000, f1=1.000
