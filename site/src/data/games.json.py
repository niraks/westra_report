#!/usr/bin/env python3
import json
import sys
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[3] / "data" / "games.json"

data = json.loads(SOURCE.read_text(encoding="utf-8"))
json.dump(data, sys.stdout)
