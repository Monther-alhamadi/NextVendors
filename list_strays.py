import codecs
import re
import os

files = [
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminOrders.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorSettings.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorAffiliate.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\hooks\useProductValidation.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\Checkout.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\OrderReview.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\context\ConfigContext.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminStoreBuilder.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminUsers.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\CheckoutSuccess.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\ProductDetail.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorCoupons.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorDropshipping.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorSupport.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorWallet.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\utils\formatters.js",
]

ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\(.*\)""")

for filepath in files:
    try:
        with codecs.open(filepath, 'r', 'utf-8') as f:
            lines = f.readlines()
        
        print(f"--- {os.path.basename(filepath)} ---")
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*') or stripped.startswith('import '): continue
            if stripped.startswith('console.log('): continue
            if ar_regex.search(line) and not t_pattern.search(line):
                print(f"[{i+1}] {stripped}")
    except Exception as e:
        pass
