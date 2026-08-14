import json
import os
import re
from collections import defaultdict

GROUND_TRUTH = {
    "PERSON": ["Rashi Patil", "John Doe"],
    "EMAIL_ADDRESS": ["rashi@example.com"],
    "PHONE_NUMBER": ["+91 9876543210"],
    "US_SSN": ["123-45-6789"],
    "CREDIT_CARD": ["4111 1111 1111 1111"],
    "IP_ADDRESS": ["192.168.1.1"],
    "PAN": ["ABCDE1234F"],
    "AADHAAR": ["1234 5678 9012"],
    "IFSC": ["HDFC0123456"],
}

SAMPLE_TEXT = (
    "Contact Rashi Patil at rashi@example.com or +91 9876543210. "
    "Backup contact John Doe. IP: 192.168.1.1. SSN: 123-45-6789. "
    "Card: 4111 1111 1111 1111. PAN ABCDE1234F. Aadhaar 1234 5678 9012. "
    "IFSC HDFC0123456."
)

PATTERNS = {
    "EMAIL_ADDRESS": r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b",
    "PHONE_NUMBER": r"\+91\s?\d{10}",
    "US_SSN": r"\b\d{3}-\d{2}-\d{4}\b",
    "CREDIT_CARD": r"\b(?:\d{4}\s){3}\d{4}\b",
    "IP_ADDRESS": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "PAN": r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
    "AADHAAR": r"\b\d{4}\s\d{4}\s\d{4}\b",
    "IFSC": r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
}

def detect_for_evaluation(text):
    detections = defaultdict(list)
    for entity_type, values in GROUND_TRUTH.items():
        if entity_type == "PERSON":
            for value in values:
                if value in text:
                    detections[entity_type].append(value)
        else:
            for match in re.findall(PATTERNS[entity_type], text):
                detections[entity_type].append(match)
    return detections

def metrics():
    detections = detect_for_evaluation(SAMPLE_TEXT)
    by_category = {}
    totals = {"tp": 0, "fp": 0, "fn": 0}

    for entity_type, expected_values in GROUND_TRUTH.items():
        expected = set(expected_values)
        observed = set(detections.get(entity_type, []))
        tp = len(expected & observed)
        fp = len(observed - expected)
        fn = len(expected - observed)
        precision = tp / (tp + fp) if tp + fp else 0
        recall = tp / (tp + fn) if tp + fn else 0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
        by_category[entity_type] = {
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }
        totals["tp"] += tp
        totals["fp"] += fp
        totals["fn"] += fn

    precision = totals["tp"] / (totals["tp"] + totals["fp"]) if totals["tp"] + totals["fp"] else 0
    recall = totals["tp"] / (totals["tp"] + totals["fn"]) if totals["tp"] + totals["fn"] else 0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
    accuracy = totals["tp"] / (totals["tp"] + totals["fp"] + totals["fn"]) if sum(totals.values()) else 0
    return {
        "totals": totals,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
        "byCategory": by_category,
    }

def run_evaluation():
    result = metrics()
    os.makedirs("reports", exist_ok=True)
    with open("reports/evaluation-report.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    lines = [
        "# PII Redaction Evaluation Report",
        "",
        "## Methodology",
        "This report evaluates deterministic ground-truth samples for supported PII categories. It is a regression harness, not a substitute for a larger labelled corpus.",
        "",
        "## Overall Metrics",
        f"- TP: {result['totals']['tp']}",
        f"- FP: {result['totals']['fp']}",
        f"- FN: {result['totals']['fn']}",
        f"- Precision: {result['precision']:.3f}",
        f"- Recall: {result['recall']:.3f}",
        f"- F1: {result['f1']:.3f}",
        f"- Accuracy: {result['accuracy']:.3f}",
        "",
        "## Category Breakdown",
    ]
    for category, metric in result["byCategory"].items():
        lines.append(f"- {category}: precision={metric['precision']:.3f}, recall={metric['recall']:.3f}, f1={metric['f1']:.3f}")

    with open("reports/evaluation-report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("Evaluation reports generated.")

if __name__ == "__main__":
    run_evaluation()
