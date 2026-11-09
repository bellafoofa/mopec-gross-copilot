#!/usr/bin/env python3
"""Validate source/mask provenance and make case-level data splits for research only.

Input JSON: {"cases":[{"case_id":"DEMO-001","organ":"Kidney","image":"img/1.jpg",
"mask":"mask/1.png","source_url":"https://...","license":"CC BY 4.0",
"expert_review":"reviewed","deidentified_verified":true}, ...]}

No images are uploaded and no training model is executed. Results are a manifest, not evidence of accuracy.
"""
import argparse
import hashlib
import json
from pathlib import Path

VALID_EXT = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}
def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def inside(root, rel):
    file = (root / rel).resolve()
    if not file.is_relative_to(root.resolve()):
        raise ValueError("Path escapes dataset root: " + rel)
    if not file.is_file() or file.suffix.lower() not in VALID_EXT:
        raise ValueError("Image or mask missing/invalid: " + rel)
    return file

def split(case_id):
    """Deterministic case-level partition; use stratification before a real study."""
    n = int.from_bytes(hashlib.sha256(case_id.encode()).digest()[:4], "big") % 100
    return "train" if n < 70 else "validation" if n < 85 else "test"

def check(input_path, root):
    data = json.loads(input_path.read_text(encoding="utf-8"))
    rows = data.get("cases")
    if not isinstance(rows, list):
        raise ValueError("Provide an object with a cases array")
    seen = set()
    output = []
    for i, row in enumerate(rows):
        if not isinstance(row, dict):
            raise ValueError("Invalid row: " + str(i))
        required = ["case_id", "organ", "image", "source_url", "license", "deidentified_verified"]
        missing = [key for key in required if key not in row]
        if missing:
            raise ValueError("Missing fields in row " + str(i) + ": " + ", ".join(missing))
        case = str(row["case_id"]).strip()
        if not case or case.lower().startswith(("patient", "mrn", "phi")):
            raise ValueError("Use anonymous research case identifiers only")
        if not row["deidentified_verified"]:
            raise ValueError("Case not verified for de-identification: " + case)
        if not str(row["source_url"]).startswith("https://"):
            raise ValueError("Source link must be HTTPS: " + case)
        if not str(row["license"]).strip():
            raise ValueError("Rights/permission not recorded: " + case)
        im = inside(root, row["image"])
        mask = inside(root, row["mask"]) if row.get("mask") else None
        if mask and row.get("expert_review") != "reviewed":
            raise ValueError("Mask is not expert-reviewed: " + case)
        if (case, row["image"]) in seen:
            raise ValueError("Repeated case/image pair: " + case)
        seen.add((case, row["image"]))
        output.append({"case_id": case, "organ": row["organ"], "image": row["image"],
                       "sha256": sha256(im), "mask": row.get("mask"),
                       "mask_sha256": sha256(mask) if mask else None,
                       "annotation_status": row.get("expert_review", "unreviewed"),
                       "license": row["license"], "source_url": row["source_url"],
                       "split": split(case)})
    return output

def main():
    p = argparse.ArgumentParser()
    p.add_argument("manifest", type=Path)
    p.add_argument("--root", type=Path, required=True)
    p.add_argument("--out", type=Path, default=Path("checked_manifest.json"))
    args = p.parse_args()
    rows = check(args.manifest, args.root)
    args.out.write_text(json.dumps({"schema":"mopec-ltu-data-manifest/1.0",
        "cases":rows}, indent=2) + "\n", encoding="utf-8")
    print(f"Validated {len(rows)} image records ({len(set(r['case_id'] for r in rows))} cases)")
    print("Masks with expert review:", sum(bool(r["mask"]) for r in rows))
    print("Case split distribution:", {x:sum(r["split"]==x for r in rows) for x in ("train","validation","test")})
    print("IMPORTANT: Not model training, not a clinical validation result.")

if __name__ == "__main__":
    main()
