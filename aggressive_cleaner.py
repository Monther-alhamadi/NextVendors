import os
import re
import codecs
import hashlib
from pathlib import Path

def get_key(text_content: str) -> str:
    """Generate a stable key for a given text snippet."""
    if not text_content:
        return "auto_empty"
    # Ensure we are hashing bytes and taking a slice of the resulting string
    text_bytes = text_content.encode('utf-8')
    md5_hash = hashlib.md5(text_bytes).hexdigest()
    # Explicitly slice the string to avoid analyzer confusion
    return f"auto_{md5_hash[:6]}"

def aggressive_cleanup(filepath):
    if not os.path.exists(filepath):
        return
        
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()
    
    # 1. JSX text >...arabic...<
    def repl_jsx_content(m):
        full = m.group(0)
        prefix = m.group(1) 
        text = m.group(2)
        suffix = m.group(3)
        
        if not re.search(r'[\u0600-\u06FF]', text): return full
        if '{' in text or '}' in text: return full 
        
        stripped = text.strip()
        key = get_key(stripped)
        
        l_space = text[:len(text)-len(text.lstrip())]
        r_space = text[len(text.rstrip()):]
        
        return f"{prefix}{l_space}{{t('{key}', '{stripped}')}}{r_space}{suffix}"

    content = re.sub(r'(>)([^<{}>]*?[\u0600-\u06FF]+[^<{}>]*?)(<)', repl_jsx_content, content)
    
    # 2. String literals: "arabic", 'arabic'
    def repl_str_literal(m):
        text = m.group(2)
        start_idx = m.start()
        if start_idx > 2 and content[start_idx-2:start_idx] == 't(': return m.group(0)
        
        key = get_key(text)
        return f"t('{key}', '{text}')"

    content = re.sub(r'(")([^"]*?[\u0600-\u06FF]+[^"]*?)(")', repl_str_literal, content)
    content = re.sub(r"(')([^']*?[\u0600-\u06FF]+[^']*?)(')", repl_str_literal, content)
    
    # 3. Template literals `arabic`
    def repl_tpl_literal(m):
        text = m.group(1)
        if '${' in text: return m.group(0) 
        key = get_key(text)
        return f"t('{key}', `{text}`)"
    
    content = re.sub(r'(?<!t\()(`)([^`]*?[\u0600-\u06FF]+[^`]*?)(`)', lambda m: repl_tpl_literal(m), content)

    # 4. JSX attributes: placeholder="arabic"
    def repl_jsx_attr(m):
        attr = m.group(1)
        text = m.group(3)
        key = get_key(text)
        return f"{attr}={{t('{key}', '{text}')}}"
    
    content = re.sub(r'([a-zA-Z0-9_-]+)=(")([^"]*?[\u0600-\u06FF]+[^"]*?)(")', repl_jsx_attr, content)
    content = re.sub(r"([a-zA-Z0-9_-]+)=(')([^']*?[\u0600-\u06FF]+[^']*?)(')", repl_jsx_attr, content)

    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(content)

# Targeted cleanup tasks
target_paths = [
    r"frontend\src\pages\AdminOrders.jsx",
    r"frontend\src\pages\Checkout.jsx",
    r"frontend\src\pages\ProductDetail.jsx",
    r"frontend\src\pages\VendorDropshipping.jsx",
    r"frontend\src\pages\VendorAffiliate.jsx",
    r"frontend\src\pages\VendorSettings.jsx",
    r"frontend\src\pages\AdminStoreBuilder.jsx",
    r"frontend\src\pages\AdminUsers.jsx",
    r"frontend\src\pages\CheckoutSuccess.jsx",
    r"frontend\src\pages\VendorCoupons.jsx",
    r"frontend\src\pages\VendorSupport.jsx",
    r"frontend\src\pages\VendorWallet.jsx",
]

if __name__ == "__main__":
    base_proj = os.path.dirname(os.path.abspath(__file__))
    for rel_path in target_paths:
        abs_p = os.path.join(base_proj, rel_path)
        if os.path.exists(abs_p):
            aggressive_cleanup(abs_p)
            print(f"Successfully cleaned: {rel_path}")
