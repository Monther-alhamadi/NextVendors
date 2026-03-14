import codecs
import re

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\Landing.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\(.*\)""")

count = 0
for i, line in enumerate(content.split('\n')):
    if line.strip().startswith('//') or line.strip().startswith('import '):
        continue
    if ar_regex.search(line) and not t_pattern.search(line):
        print(f"Line {i+1}: {line.strip()}")
        count += 1
print(f"Total untranslated: {count}")
