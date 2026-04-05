import argparse
import json
from pathlib import Path

import importlib

joblib = importlib.import_module("joblib")
np = importlib.import_module("numpy")
pd = importlib.import_module("pandas")

from sklearn.ensemble import ExtraTreesClassifier, GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

WASTE_FEATURES = ["current_stock", "avg_monthly_sales", "days_until_expiry", "unit_price"]
WASTE_TARGET = "will_expire_unused"
REDIST_FEATURES = [
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


def _balanced_class_weight(y_series):
    counts = y_series.value_counts().to_dict()
    total = max(1, len(y_series))
    class_count = max(1, len(counts))

    return {
        key: max(0.4, min(4.5, total / (class_count * value)))
        for key, value in counts.items()
    }


def _ensure_binary_classes(frame):
    y = frame[WASTE_TARGET].astype(int)
    if y.nunique() > 1:
        return frame

    # If only one class exists in historical data, create a minimal synthetic
    # counter-class so the classifier can still be fit.
    extra = frame.sample(n=min(30, len(frame)), replace=True, random_state=42).copy()

    if int(y.iloc[0]) == 1:
        extra["current_stock"] = np.maximum(1, extra["avg_monthly_sales"] * 0.25)
        extra["days_until_expiry"] = extra["days_until_expiry"] + 120
        extra[WASTE_TARGET] = 0
    else:
        extra["current_stock"] = np.maximum(extra["current_stock"], extra["avg_monthly_sales"] * 2.7)
        extra["days_until_expiry"] = np.minimum(extra["days_until_expiry"], 20)
        extra[WASTE_TARGET] = 1

    return pd.concat([frame, extra], ignore_index=True)


def _rebalance_waste_classes(frame, minimum_ratio=0.3):
    counts = frame[WASTE_TARGET].value_counts()
    if len(counts) < 2:
        return frame

    minority_label = int(counts.idxmin())
    minority_count = int(counts.min())
    target_minority = int(max(minority_count, len(frame) * minimum_ratio))

    if minority_count >= target_minority:
        return frame

    needed = target_minority - minority_count
    minority_frame = frame[frame[WASTE_TARGET] == minority_label]
    if minority_frame.empty:
        return frame

    extra = minority_frame.sample(n=needed, replace=True, random_state=42).copy().reset_index(drop=True)
    rng = np.random.default_rng(42)

    extra["current_stock"] = np.maximum(1, extra["current_stock"] * (1 + rng.normal(0, 0.14, size=len(extra))))
    extra["avg_monthly_sales"] = np.maximum(1, extra["avg_monthly_sales"] * (1 + rng.normal(0, 0.12, size=len(extra))))
    extra["days_until_expiry"] = np.maximum(1, extra["days_until_expiry"] * (1 + rng.normal(0, 0.1, size=len(extra))))
    extra["unit_price"] = np.maximum(1, extra["unit_price"] * (1 + rng.normal(0, 0.08, size=len(extra))))

    return pd.concat([frame, extra], ignore_index=True)


def _split_or_reuse(X, y, random_state=42):
    if len(X) < 12:
        return X, X, y, y

    class_counts = y.value_counts()
    can_stratify = y.nunique() > 1 and class_counts.min() >= 2

    return train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=random_state,
        stratify=y if can_stratify else None,
    )


def _select_waste_threshold(model, X_eval, y_eval):
    probabilities = model.predict_proba(X_eval)
    classes = [int(item) for item in model.classes_]
    class_one_index = classes.index(1) if 1 in classes else 0

    best_score = -1
    best_threshold = 0.5
    best_predictions = model.predict(X_eval)
    best_macro_f1 = 0
    best_class0_recall = 0

    for threshold in np.linspace(0.35, 0.78, 16):
        predicted = (probabilities[:, class_one_index] >= threshold).astype(int)
        macro_f1 = float(f1_score(y_eval, predicted, average="macro", zero_division=0))
        class0_recall = float(recall_score(y_eval, predicted, pos_label=0, zero_division=0))

        score = macro_f1 * 0.6 + class0_recall * 0.4
        if score > best_score:
            best_score = score
            best_threshold = float(threshold)
            best_predictions = predicted
            best_macro_f1 = macro_f1
            best_class0_recall = class0_recall

    return {
        "threshold": best_threshold,
        "score": best_score,
        "predictions": best_predictions,
        "macro_f1": best_macro_f1,
        "class0_recall": best_class0_recall,
    }


def train_waste_model(dataset, model_dir):
    frame = dataset[[*WASTE_FEATURES, WASTE_TARGET]].copy()

    for column in WASTE_FEATURES + [WASTE_TARGET]:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")

    frame = frame.dropna(subset=WASTE_FEATURES + [WASTE_TARGET])
    frame[WASTE_FEATURES] = frame[WASTE_FEATURES].clip(lower=0)
    frame[WASTE_TARGET] = frame[WASTE_TARGET].astype(int).clip(0, 1)

    if frame.empty:
        raise ValueError("No valid rows available to train waste model")

    frame = _ensure_binary_classes(frame)
    frame = _rebalance_waste_classes(frame)

    X = frame[WASTE_FEATURES]
    y = frame[WASTE_TARGET]

    X_train, X_test, y_train, y_test = _split_or_reuse(X, y)

    class_weight = _balanced_class_weight(y_train)

    candidates = {
        "random_forest": RandomForestClassifier(
            n_estimators=480,
            max_depth=18,
            min_samples_leaf=1,
            min_samples_split=2,
            max_features="sqrt",
            random_state=42,
            class_weight=class_weight,
        ),
        "extra_trees": ExtraTreesClassifier(
            n_estimators=720,
            max_depth=None,
            min_samples_leaf=1,
            max_features="sqrt",
            random_state=42,
            class_weight=class_weight,
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=260,
            learning_rate=0.045,
            max_depth=3,
            random_state=42,
        ),
    }

    best_model = None
    best_model_name = ""
    best_predictions = None
    best_threshold = 0.5
    best_macro_f1 = -1
    best_class0_recall = 0

    for model_name, candidate in candidates.items():
        candidate.fit(X_train, y_train)
        threshold_metrics = _select_waste_threshold(candidate, X_test, y_test)

        if threshold_metrics["score"] > best_macro_f1:
            best_model = candidate
            best_model_name = model_name
            best_predictions = threshold_metrics["predictions"]
            best_threshold = threshold_metrics["threshold"]
            best_macro_f1 = threshold_metrics["score"]
            best_class0_recall = threshold_metrics["class0_recall"]

    model = best_model
    predictions = best_predictions
    accuracy = float(accuracy_score(y_test, predictions))

    model_path = model_dir / "medisync_waste_model.pkl"
    meta_path = model_dir / "medisync_waste_model_meta.json"
    joblib.dump(model, model_path)

    with meta_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "decision_threshold": round(float(best_threshold), 4),
                "selected_model": best_model_name,
            },
            handle,
            indent=2,
        )

    return {
        "rows": int(len(frame)),
        "accuracy": round(accuracy, 4),
        "selected_model": best_model_name,
        "decision_threshold": round(float(best_threshold), 4),
        "class0_recall": round(float(best_class0_recall), 4),
        "class_distribution": {str(k): int(v) for k, v in y.value_counts().to_dict().items()},
        "classification_report": classification_report(y_test, predictions, zero_division=0, output_dict=True),
        "model_path": str(model_path),
        "meta_path": str(meta_path),
    }


def train_redistribution_model(dataset, model_dir):
    frame = dataset[["category", "avg_monthly_sales", "current_stock", "days_until_expiry", "store_id"]].copy()

    frame["category"] = frame["category"].astype(str).str.strip()
    frame["store_id"] = frame["store_id"].astype(str).str.strip()
    frame["avg_monthly_sales"] = pd.to_numeric(frame["avg_monthly_sales"], errors="coerce")
    frame["current_stock"] = pd.to_numeric(frame["current_stock"], errors="coerce")
    frame["days_until_expiry"] = pd.to_numeric(frame["days_until_expiry"], errors="coerce")
    frame = frame.dropna(subset=["category", "avg_monthly_sales", "current_stock", "days_until_expiry", "store_id"])
    frame = frame[(frame["category"] != "") & (frame["store_id"] != "")]
    frame["avg_monthly_sales"] = frame["avg_monthly_sales"].clip(lower=0)
    frame["current_stock"] = frame["current_stock"].clip(lower=0)
    frame["days_until_expiry"] = frame["days_until_expiry"].clip(lower=0)

    frame["stock_to_sales_ratio"] = frame["current_stock"] / frame["avg_monthly_sales"].clip(lower=1)
    frame["expiry_urgency"] = frame["days_until_expiry"].apply(_expiry_urgency)

    if frame.empty:
        raise ValueError("No valid rows available to train redistribution model")

    if frame["store_id"].nunique() < 2:
        fallback = "Store_A" if frame["store_id"].iloc[0] != "Store_A" else "Store_B"
        extra = frame.sample(n=min(20, len(frame)), replace=True, random_state=42).copy()
        extra["store_id"] = fallback
        frame = pd.concat([frame, extra], ignore_index=True)

    encoder = LabelEncoder()
    frame["cat_encoded"] = encoder.fit_transform(frame["category"])

    X = frame[REDIST_FEATURES]
    y = frame["store_id"]

    X_train, X_test, y_train, y_test = _split_or_reuse(X, y)

    class_weight = _balanced_class_weight(y_train)

    candidates = {
        "random_forest": RandomForestClassifier(
            n_estimators=420,
            max_depth=18,
            min_samples_leaf=1,
            min_samples_split=2,
            max_features="sqrt",
            random_state=42,
            class_weight=class_weight,
        ),
        "extra_trees": ExtraTreesClassifier(
            n_estimators=620,
            max_depth=None,
            min_samples_leaf=1,
            max_features="sqrt",
            random_state=42,
            class_weight=class_weight,
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=220,
            learning_rate=0.05,
            max_depth=4,
            random_state=42,
        ),
    }

    best_model = None
    best_predictions = None
    best_accuracy = -1
    best_model_name = ""

    for model_name, candidate in candidates.items():
        candidate.fit(X_train, y_train)
        predicted = candidate.predict(X_test)
        candidate_accuracy = float(accuracy_score(y_test, predicted))

        if candidate_accuracy > best_accuracy:
            best_accuracy = candidate_accuracy
            best_model = candidate
            best_predictions = predicted
            best_model_name = model_name

    model = best_model
    predictions = best_predictions
    accuracy = best_accuracy

    model_path = model_dir / "medisync_redist_model.pkl"
    encoder_path = model_dir / "cat_encoder.pkl"

    joblib.dump(model, model_path)
    joblib.dump(encoder, encoder_path)

    return {
        "rows": int(len(frame)),
        "accuracy": round(accuracy, 4),
        "selected_model": best_model_name,
        "store_distribution": {str(k): int(v) for k, v in y.value_counts().to_dict().items()},
        "classification_report": classification_report(y_test, predictions, zero_division=0, output_dict=True),
        "model_path": str(model_path),
        "encoder_path": str(encoder_path),
    }


def main():
    parser = argparse.ArgumentParser(description="Train Medisync ML models from historical dataset")
    parser.add_argument("--dataset", required=True, help="Path to CSV dataset")
    parser.add_argument("--model-dir", required=True, help="Directory where models should be written")

    args = parser.parse_args()

    dataset_path = Path(args.dataset).resolve()
    model_dir = Path(args.model_dir).resolve()

    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    model_dir.mkdir(parents=True, exist_ok=True)

    data = pd.read_csv(dataset_path)
    if data.empty:
        raise ValueError("Dataset is empty")

    waste_metrics = train_waste_model(data, model_dir)
    redist_metrics = train_redistribution_model(data, model_dir)

    summary = {
        "dataset_path": str(dataset_path),
        "dataset_rows": int(len(data)),
        "waste_model": waste_metrics,
        "redistribution_model": redist_metrics,
    }

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
