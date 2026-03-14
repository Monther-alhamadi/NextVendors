import re
from pathlib import Path
from collections import Counter

def main():
    repo_dir = Path(r"c:\Users\hp\Desktop\projet2\ecommerce-store")
    frontend_src = repo_dir / "frontend" / "src"
    
    ar_regex = re.compile(r'[\u0600-\u06FF]+')
    t_pattern = re.compile(r"""t\([^)]+\)""")
    i18n_t_pattern = re.compile(r"""i18n\.t\([^)]+\)""")
    
    file_counts = Counter()
    
    # scan for arabic characters not inside comments, imports, OR t() / i18n.t()
    for path in frontend_src.rglob('*.[jt]s*'):
        if 'node_modules' in path.parts:
            continue
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                for i, line in enumerate(content.split('\n')):
                    if line.strip().startswith('//') or line.strip().startswith('import '):
                        continue
                        
                    # If line has arabic text AND it does not contain t("...")
                    if ar_regex.search(line) and not t_pattern.search(line) and not i18n_t_pattern.search(line):
                        rel_path = str(path.relative_to(frontend_src))
                        file_counts[rel_path] += 1
                        
        except Exception as e:
            pass

    print("Top files with actual hardcoded Arabic (no t()):")
    for filepath, count in file_counts.most_common(20):
        print(f"{filepath}: {count} lines")

if __name__ == "__main__":
    main()
