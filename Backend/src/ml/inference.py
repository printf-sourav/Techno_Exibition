import json
import importlib
import sys
from pathlib import Path

joblib = importlib.import_module("joblib")
pd = importlib.import_module("pandas")

MODEL_DIR = Path(__file__).resolve().parent

WASTE_MODEL = None
WASTE_THRESHOLD = 0.5
REDIST_MODEL = None
CAT_ENCODER = None

WASTE_COLUMNS = ["current_stock", "avg_monthly_sales", "days_until_expiry", "unit_price"]
REDIST_COLUMNS = [
    "cat_encoded",
    "avg_monthly_sales",
    "current_stock",
    "days_until_expiry",
    "stock_to_sales_ratio",
    "expiry_urgency",
]


def _expiry_urgency(days_until_expiry):
    if days_until_expiry <= 30:
        return 3
    if days_until_expiry <= 60:
        return 2
    if days_until_expiry <= 120:
        return 1
    return 0


def _load_waste_model():
    global WASTE_MODEL, WASTE_THRESHOLD
    if WASTE_MODEL is None:
        model_path = MODEL_DIR / "medisync_waste_model.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Waste model not found at {model_path}")
        WASTE_MODEL = joblib.load(model_path)

        meta_path = MODEL_DIR / "medisync_waste_model_meta.json"
        if meta_path.exists():
            try:
                metadata = json.loads(meta_path.read_text(encoding="utf-8"))
                threshold = float(metadata.get("decision_threshold", 0.5))
                WASTE_THRESHOLD = max(0.2, min(0.9, threshold))
            except Exception:
                WASTE_THRESHOLD = 0.5
    return WASTE_MODEL


def _load_redistribution_assets():
    global REDIST_MODEL, CAT_ENCODER
    if REDIST_MODEL is None:
        model_path = MODEL_DIR / "medisync_redist_model.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Redistribution model not found at {model_path}")
        REDIST_MODEL = joblib.load(model_path)

    if CAT_ENCODER is None:
        encoder_path = MODEL_DIR / "cat_encoder.pkl"
        if not encoder_path.exists():
            raise FileNotFoundError(f"Category encoder not found at {encoder_path}")
        CAT_ENCODER = joblib.load(encoder_path)

    return REDIST_MODEL, CAT_ENCODER


def _parse_payload():
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    return json.loads(raw)


def _to_float(value, field_name):
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"Invalid numeric value for {field_name}") from None
    if parsed < 0:
        return 0.0
    return parsed


def _predict_waste(payload):
    items = payload.get("items") or []
    if not isinstance(items, list):
        raise ValueError("items must be a list")

    if not items:
        return []

    model = _load_waste_model()
    threshold = float(WASTE_THRESHOLD)

    rows = []
    for item in items:
        rows.append(
            {
                "current_stock": _to_float(item.get("current_stock"), "current_stock"),
                "avg_monthly_sales": _to_float(item.get("avg_monthly_sales"), "avg_monthly_sales"),
                "days_until_expiry": _to_float(item.get("days_until_expiry"), "days_until_expiry"),
                "unit_price": _to_float(item.get("unit_price"), "unit_price"),
            }
        )

    frame = pd.DataFrame(rows, columns=WASTE_COLUMNS)
    probabilities = model.predict_proba(frame)
    classes = list(model.classes_)
    class_one_index = classes.index(1) if 1 in classes else 0

    results = []
    for idx, probs in enumerate(probabilities):
        risk = float(probs[class_one_index])
        results.append(
            {
                "index": idx,
                "risk_probability": round(risk, 4),
                "will_expire_unused": bool(risk >= threshold),
            }
        )

    return results


def _predict_redistribution(payload):
    model, encoder = _load_redistribution_assets()

    known_categories = [str(item) for item in encoder.classes_]
    category = str(payload.get("category") or "").strip()
    if not category:
        raise ValueError("category is required")

    normalized = next((item for item in known_categories if item.lower() == category.lower()), None)

    if normalized is None:
        raise ValueError(
            "Unsupported category. Available categories: " + ", ".join(known_categories)
        )

    avg_monthly_sales = _to_float(payload.get("avg_monthly_sales"), "avg_monthly_sales")
    current_stock = _to_float(
        payload.get("current_stock")
        if payload.get("current_stock") is not None
        else max(avg_monthly_sales * 1.4, 1),
        "current_stock",
    )
    days_until_expiry = _to_float(
        payload.get("days_until_expiry")
        if payload.get("days_until_expiry") is not None
        else 120,
        "days_until_expiry",
    )

    category_encoded = int(encoder.transform([normalized])[0])
    stock_to_sales_ratio = current_stock / max(avg_monthly_sales, 1)
    expiry_urgency = _expiry_urgency(days_until_expiry)

    frame = pd.DataFrame(
        [
            [
                category_encoded,
                avg_monthly_sales,
                current_stock,
                days_until_expiry,
                stock_to_sales_ratio,
                expiry_urgency,
            ]
        ],
        columns=REDIST_COLUMNS,
    )

    predicted_store = str(model.predict(frame)[0])
    probabilities = model.predict_proba(frame)[0]
    class_labels = [str(label) for label in model.classes_]
    class_index = class_labels.index(predicted_store)
    confidence = float(probabilities[class_index])

    return {
        "target_store": predicted_store,
        "confidence": round(confidence, 4),
        "category": normalized,
    }


def _predict_redistribution_batch(payload):
    items = payload.get("items") or []
    if not isinstance(items, list):
        raise ValueError("items must be a list")

    if not items:
        return []

    model, encoder = _load_redistribution_assets()
    known_categories = [str(item) for item in encoder.classes_]

    rows = []
    normalized_categories = []

    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(f"Invalid redistribution item at index {index}")

        category = str(item.get("category") or "").strip()
        if not category:
            raise ValueError(f"category is required at index {index}")

        normalized = next((name for name in known_categories if name.lower() == category.lower()), None)
        if normalized is None:
            raise ValueError(
                f"Unsupported category at index {index}. Available categories: " + ", ".join(known_categories)
            )

        avg_monthly_sales = _to_float(item.get("avg_monthly_sales"), f"avg_monthly_sales[{index}]")
        current_stock = _to_float(
            item.get("current_stock") if item.get("current_stock") is not None else max(avg_monthly_sales * 1.4, 1),
            f"current_stock[{index}]",
        )
        days_until_expiry = _to_float(
            item.get("days_until_expiry") if item.get("days_until_expiry") is not None else 120,
            f"days_until_expiry[{index}]",
        )

        category_encoded = int(encoder.transform([normalized])[0])
        stock_to_sales_ratio = current_stock / max(avg_monthly_sales, 1)
        expiry_urgency = _expiry_urgency(days_until_expiry)

        rows.append(
            {
                "cat_encoded": category_encoded,
                "avg_monthly_sales": avg_monthly_sales,
                "current_stock": current_stock,
                "days_until_expiry": days_until_expiry,
                "stock_to_sales_ratio": stock_to_sales_ratio,
                "expiry_urgency": expiry_urgency,
            }
        )
        normalized_categories.append(normalized)

    frame = pd.DataFrame(rows, columns=REDIST_COLUMNS)

    predicted_stores = model.predict(frame)
    probabilities = model.predict_proba(frame)
    class_labels = [str(label) for label in model.classes_]

    results = []
    for index, predicted_store in enumerate(predicted_stores):
        predicted_store = str(predicted_store)
        class_index = class_labels.index(predicted_store)
        confidence = float(probabilities[index][class_index])

        results.append(
            {
                "index": index,
                "target_store": predicted_store,
                "confidence": round(confidence, 4),
                "category": normalized_categories[index],
            }
        )

    return results


def main():
    if len(sys.argv) < 2:
        raise ValueError("mode is required: waste or redistribution")

    mode = sys.argv[1].strip().lower()
    payload = _parse_payload()

    if mode == "waste":
        data = _predict_waste(payload)
    elif mode == "redistribution":
        data = _predict_redistribution(payload)
    elif mode == "redistribution_batch":
        data = _predict_redistribution_batch(payload)
    else:
        raise ValueError("Unsupported mode. Use waste, redistribution, or redistribution_batch")

    print(json.dumps({"success": True, "data": data}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"success": False, "error": str(error)}))
        sys.exit(1)
