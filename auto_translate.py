import os
import re
import codecs
import hashlib

def get_key(text):
    return 'auto_' + hashlib.md5(text.encode('utf-8')).hexdigest()[:6]

def auto_translate_file(filepath):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()
        
    if not re.search(r'[\u0600-\u06FF]', content):
        return False
        
    # Inject useTranslation if needed
    if 'useTranslation' not in content and 'react-i18next' not in content and 'function' in content:
        content = re.sub(r'(import React.*?from [\'"]react[\'"];)', r'\1\nimport { useTranslation } from "react-i18next";', content)
        content = re.sub(r'(export default function[^{]+\{)', r'\1\n  const { t } = useTranslation();', content)
        content = re.sub(r'(const [A-Za-z0-9_]+ =.*?=>\s*\{)', r'\1\n  const { t } = useTranslation();', content)

    lines = content.split('\n')
    changed = False
    
    for i, line in enumerate(lines):
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            continue
            
        # Skip lines already containing t( to avoid double translation
        if 't(' in line or 't (' in line:
            # We will only skip if it seems the Arabic is already wrapped
            # But just to be 100% safe, skip the whole line
            continue
            
        if not re.search(r'[\u0600-\u06FF]', line):
            continue
            
        original_line = line
        
        # 1. JSX text >arabic<
        def repl_jsx(m):
            text = m.group(1)
            if not text.strip() or '{' in text or '}' in text: return m.group(0)
            stripped = text.strip()
            key = get_key(stripped)
            # preserve spacing
            leading = text[:len(text)-len(text.lstrip())]
            trailing = text[len(text.rstrip()):]
            return f">{leading}{{t('{key}', '{stripped}')}}{trailing}<"
            
        line = re.sub(r'>([^<>{A-Za-z]*?[\u0600-\u06FF]+[^<>{]*?)<', repl_jsx, line)
        
        # 2. JSX attributes: placeholder="arabic"
        def repl_attr(m):
            attr = m.group(1)
            val = m.group(2)
            key = get_key(val)
            return f"{attr}={{t('{key}', '{val}')}}"
            
        line = re.sub(r'([a-zA-Z0-9_]+)="([^"]*[\u0600-\u06FF]+[^"]*)"', repl_attr, line)
        line = re.sub(r"([a-zA-Z0-9_]+)='([^']*[\u0600-\u06FF]+[^']*)'", repl_attr, line)
        
        # 3. String literals (object keys, array elements)
        def repl_str(m):
            val = m.group(1)
            key = get_key(val)
            return f"t('{key}', '{val}')"
            
        line = re.sub(r'(?<![A-Za-z0-9_])"([^"]*[\u0600-\u06FF]+[^"]*)"', repl_str, line)
        line = re.sub(r"(?<![A-Za-z0-9_])'([^']*[\u0600-\u06FF]+[^']*)'", repl_str, line)
        
        # 4. Template literals `arabic` without variables
        def repl_tpl(m):
            val = m.group(1)
            if '${' in val: return m.group(0) # skip complex templates for safety
            key = get_key(val)
            return f"t('{key}', `{val}`)"
        line = re.sub(r"(?<![A-Za-z0-9_])`([^`]*[\u0600-\u06FF]+[^`]*)`", repl_tpl, line)

        if line != original_line:
            lines[i] = line
            changed = True
            
    if changed:
        with codecs.open(filepath, 'w', 'utf-8') as f:
            f.write('\n'.join(lines))
        return True
    return False

# recursive search
directories = [
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\components"
]

total_changed = 0
for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                path = os.path.join(root, file)
                if auto_translate_file(path):
                    print(f"Auto-translated: {os.path.relpath(path, d)}")
                    total_changed += 1

print(f"Total files updated: {total_changed}")
