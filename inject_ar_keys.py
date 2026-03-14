import json
from pathlib import Path

def set_nested_value(d, keys, value):
    for i, key in enumerate(keys[:-1]):
        if key not in d:
            d[key] = {}
        elif not isinstance(d[key], dict):
            # Collision: existing key is not a dict (e.g., it's a string)
            print(f"Collision at {'.'.join(keys[:i+1])}: expected dict, found {type(d[key])}. Skipping '{value}'")
            return
        d = d[key]
        
    # Only set if it does not already exist as a string
    if keys[-1] not in d or not isinstance(d[keys[-1]], str):
        # We try to create a readable default Arabic string from the key
        default_val = keys[-1].replace('_', ' ').title() + " (Translation Needed)"
        d[keys[-1]] = default_val

def main():
    repo_dir = Path(r"c:\Users\hp\Desktop\projet2\ecommerce-store")
    ar_json_path = repo_dir / "frontend" / "src" / "locales" / "ar" / "translation.json"
    report_path = repo_dir / "translation_report.json"

    with open(report_path, 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    missing_keys = report.get("missing_keys_in_ar", [])

    with open(ar_json_path, 'r', encoding='utf-8') as f:
        ar_data = json.load(f)

    inserted_count = 0
    
    for full_key in missing_keys:
        # Ignore strange keys that are just paths or contain slashes (these are usually dynamic variables or bugs in regex)
        if "/" in full_key or full_key.startswith(".") or full_key == "," or full_key == "q":
            continue
            
        keys = full_key.split(".")
        if len(keys) > 0:
            set_nested_value(ar_data, keys, full_key)
            inserted_count += 1

    with open(ar_json_path, 'w', encoding='utf-8') as f:
        json.dump(ar_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully injected {inserted_count} missing keys into ar.json")

if __name__ == "__main__":
    main()
