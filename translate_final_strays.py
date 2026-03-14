import codecs
import re
import os

files = {
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminOrders.jsx": [
        (" تحديث كمشحون", " {t('orders.mark_shipped', 'تحديث كمشحون')}"),
        (" تحديث كمكتمل", " {t('orders.mark_completed', 'تحديث كمكتمل')}"),
        (" إلغاء الطلبات", " {t('orders.cancel_orders', 'إلغاء الطلبات')}"),
        ("مستخدم #", "{t('orders.user_hash', 'مستخدم')} #"),
        ("تاجر #", "{t('orders.vendor_hash', 'تاجر')} #"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorSettings.jsx": [
        ("SAR - ريال سعودي", "SAR - {t('currency.sar', 'ريال سعودي')}"),
        ("USD - دولار أمريكي", "USD - {t('currency.usd', 'دولار أمريكي')}"),
        ("AED - درهم إماراتي", "AED - {t('currency.aed', 'درهم إماراتي')}"),
        ("KWD - دينار كويتي", "KWD - {t('currency.kwd', 'دينار كويتي')}"),
        ("EGP - جنيه مصري", "EGP - {t('currency.egp', 'جنيه مصري')}"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorAffiliate.jsx": [
        (" إضافة حملة جديدة", " {t('affiliate.add_campaign', 'إضافة حملة جديدة')}"),
        ("نسبة العمولة:", "{t('affiliate.commission_rate', 'نسبة العمولة:')}"),
        ("} نقرة<", "} {t('affiliate.clicks', 'نقرة')}<"),
        ("} مبيعة<", "} {t('affiliate.conversions', 'مبيعة')}<"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\Checkout.jsx": [
        ("⚠️ نعتذر للعملاء الكرام، هذه الخدمة غير متاحة حالياً نظراً للتعقيد  دات الإدارية من طرف البنك.", "⚠️ {t('checkout.card_unavailable', 'نعتذر للعملاء الكرام، هذه الخدمة غير متاحة حالياً نظراً للتعقيد  دات الإدارية من طرف البنك.')}"),
        ("🔒 نظام الدفع الإلكتروني بالبطاقات قيد التطوير حالياً للعمل بأعلى  معايير الأمان العالمية.", "🔒 {t('checkout.card_system_wip', 'نظام الدفع الإلكتروني بالبطاقات قيد التطوير حالياً للعمل بأعلى  معايير الأمان العالمية.')}"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\OrderReview.jsx": [
        ("الإجمالي:", "{t('orders.total', 'الإجمالي:')}"),
        ("متابعة للدفع", "{t('orders.proceed_to_pay', 'متابعة للدفع')}"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminStoreBuilder.jsx": [
        ("} مكون", "} {t('cms.widget_count', 'مكون')}"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminUsers.jsx": [
        ("المستخدم: <strong>", "{t('admin.user_label', 'المستخدم:')} <strong>"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\CheckoutSuccess.jsx": [
        ("معرف الطلب: <strong>", "{t('checkout.order_id', 'معرف الطلب:')} <strong>"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\ProductDetail.jsx": [
        ('`مرحباً، أود إتمام شراء المنتج: ${product.name} (الكميية: ${qty}). رقم الطلب المرجعي: #${orderRes.order_id}`', 't("product.whatsapp_msg", "مرحباً، أود إتمام شراء المنتج: {{name}} (الكمية: {{qty}}). رقم الطلب المرجعي: #{{orderId}}", { name: product.name, qty, orderId: orderRes.order_id })'),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorCoupons.jsx": [
        ("شارك هذا الرابط مع عملائك أو مسوقيك. الزوار القادمون عبر هذا الرابط سيتم ربطهم بمتجرك مباشرة للحصول على عمولات إضافية.", "{t('vendor.share_link_desc', 'شارك هذا الرابط مع عملائك أو مسوقيك. الزوار القادمون عبر هذا الرابط سيتم ربطهم بمتجرك مباشرة للحصول على عمولات إضافية.')}"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorDropshipping.jsx": [
        ("مرحباً بك في أسواق الجملة الل", '{t("vendor.ds_hero_desc_1", "مرحباً بك في أسواق الجملة الل'),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorSupport.jsx": [
        ("لا توجد تذاكر دعم سابقة", "{t('vendor.no_support_tickets', 'لا توجد تذاكر دعم سابقة')}"),
    ],
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorWallet.jsx": [
        ("عرض سجل السحوبات", "{t('vendor.view_withdrawal_history', 'عرض سجل السحوبات')}"),
    ],
}

ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\(.*\)""")

for filepath, reps in files.items():
    filename = os.path.basename(filepath)
    try:
        with codecs.open(filepath, 'r', 'utf-8') as f:
            content = f.read()
        
        for old, new in reps:
            content = content.replace(old, new)
            
        with codecs.open(filepath, 'w', 'utf-8') as f:
            f.write(content)
            
        count = 0
        for i, line in enumerate(content.split('\n')):
            stripped = line.strip()
            if stripped.startswith('//') or stripped.startswith('import ') or stripped.startswith('/*') or stripped.startswith('*'): continue
            if ar_regex.search(line) and not t_pattern.search(line):
                count += 1
        if count > 0:
            print(f"{filename}: {count} remaining")
        else:
            print(f"{filename}: ✅ Done")
    except Exception as e:
        print(f"{filename}: Error - {e}")
