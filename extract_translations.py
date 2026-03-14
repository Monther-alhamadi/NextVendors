import os
import re
import json
from pathlib import Path

def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def main():
    repo_dir = Path(r"c:\Users\hp\Desktop\projet2\ecommerce-store")
    frontend_src = repo_dir / "frontend" / "src"
    ar_json_path = frontend_src / "locales" / "ar" / "translation.json"
    en_json_path = frontend_src / "locales" / "en" / "translation.json"

    with open(ar_json_path, 'r', encoding='utf-8') as f:
        ar_data = json.load(f)
    with open(en_json_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)

    ar_flat = flatten_dict(ar_data)
    en_flat = flatten_dict(en_data)

    # Regex to match t("key") or t('key')
    t_pattern = re.compile(r"""t\(\s*['"]([^'"]+)['"]\s*\)""")
    # Also look for i18n.t("key")
    i18n_t_pattern = re.compile(r"""i18n\.t\(\s*['"]([^'"]+)['"]\s*\)""")

    found_keys = set()
    
    # Optional: Find hardcoded Arabic strings
    ar_regex = re.compile(r'[\u0600-\u06FF]+')
    hardcoded_ar = []

    for path in frontend_src.rglob('*.[jt]s*'):
        if 'node_modules' in path.parts:
            continue
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # find translation keys
                for match in t_pattern.finditer(content):
                    found_keys.add(match.group(1))
                for match in i18n_t_pattern.finditer(content):
                    found_keys.add(match.group(1))

                # rough scan for arabic characters not inside comments or imports
                # we'll just check line by line and ignore lines that start with import or //
                for i, line in enumerate(content.split('\n')):
                    if line.strip().startswith('//') or line.strip().startswith('import '):
                        continue
                    if ar_regex.search(line):
                        hardcoded_ar.append((str(path.relative_to(frontend_src)), i+1, line.strip()))
        except Exception as e:
            print(f"Error reading {path}: {e}")

    missing_in_ar = found_keys - set(ar_flat.keys())
    missing_in_en = found_keys - set(en_flat.keys())

    missing_keys = sorted(list(missing_in_ar))

    output = {
        "total_keys_in_code": len(found_keys),
        "total_existing_ar_keys": len(ar_flat),
        "missing_keys_in_ar": missing_keys,
        "count_missing_in_ar": len(missing_keys),
        "hardcoded_arabic_lines_found": len(hardcoded_ar)
    }

    report_path = repo_dir / "translation_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Extraction complete. Report saved to {report_path}")
    print(f"Missing keys in AR: {len(missing_keys)}")
    print(f"Hardcoded Arabic lines: {len(hardcoded_ar)}")

if __name__ == "__main__":
    main()
