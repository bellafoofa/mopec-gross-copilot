# Dataset intake for Mopec / LTU training prototype

**Purpose:** Prepare a reproducible, case-split manifest now so an expert-annotated gross-tissue collection can be inserted when Mopec authorizes access and the DGX Spark training environment is ready.

This is a manifest validation tool, **not** a trained model or a substitute for institutional privacy and data-use review.

## Usage

Use a local, approved dataset folder with JSON such as:

    {
      "cases": [
        {
          "case_id": "DEMO-001",
          "organ": "Kidney",
          "image": "images/kidney-001.jpg",
          "mask": "masks/kidney-001.png",
          "source_url": "https://example.org/approved-source",
          "license": "record exact reuse/training permission",
          "expert_review": "reviewed",
          "deidentified_verified": true
        }
      ]
    }

Run:

    python training/prepare_manifest.py dataset/manifest.json --root dataset --out dataset/checked_manifest.json

The script verifies local relative paths, SHA-256 fingerprints, labels, presence of recorded licensing and de-identification review, and deterministic **case-level** train/validation/test grouping. Masks require an explicitly marked expert-reviewed status. It does not determine whether annotations are accurate or licenses truly permit training.

## Before using this for actual training

- Select ONE gross organ and one target structure/task with Roseanne and Mike.
- Obtain written permission to use source images and any Mopec data; exclude unauthorized PHI.
- Document image resolution, camera settings, annotation format, coordinate system and review status.
- Review mask quality and define specimen-level test sets with a clinical advisor.
- Run simple SAM/MedSAM zero-shot or prompt-baseline experiments first, then a tissue-specific model if data suffices.
- Report Dice/IoU for masks and detection sensitivity/precision on a frozen held-out split. Calibrate classification confidence separately.
- Run a small pipeline smoke test locally before use of sponsor GPU resources.
- Retain model versions, test manifest hashes, hardware details and failure examples.
- Be prepared for 200-megapixel tiling/pyramids; current browser preview is not a high-resolution training ingest tool.
- A comparison with Mopec-recommended Kimi/MiniMax is contingent on exact model IDs, account access, costs and image-training/reuse terms.

## Scope

The image library in the public website provides **source references, not curated training ground truth**. The site uses a remote Groq vision API on authorized public images; it does not execute DGX training or store patient specimens.
