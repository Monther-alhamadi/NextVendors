import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminAds.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # Toasts
    ("message: \"فشل جلب طلبات الإعلانات\"", "message: t('ads.err_fetch', 'فشل جلب طلبات الإعلانات')"),
    ("message: \"تم تحديث حالة الإعلان\"", "message: t('ads.status_updated', 'تم تحديث حالة الإعلان')"),
    ("message: \"فشل تحديث الحالة\"", "message: t('ads.err_status_update', 'فشل تحديث الحالة')"),
    ("message: \"تم تغيير حالة الدفع\"", "message: t('ads.payment_updated', 'تم تغيير حالة الدفع')"),
    ("message: \"فشل تحديث حالة الدفع\"", "message: t('ads.err_payment_update', 'فشل تحديث حالة الدفع')"),
    
    # Headers
    ("تأجير المساحات الإعلانية", "{t('ads.title_admin', 'تأجير المساحات الإعلانية')}"),
    ("إدارة طلبات إعلانات التجّار على الصفحة الرئيسية ومراجعة الدفعات", "{t('ads.subtitle_admin', 'إدارة طلبات إعلانات التجّار على الصفحة الرئيسية ومراجعة الدفعات')}"),
    
    # Table headers
    ("<th>الإعلان</th>", "<th>{t('ads.col_ad', 'الإعلان')}</th>"),
    ("<th>معرّف التاجر</th>", "<th>{t('ads.col_vendor_id', 'معرّف التاجر')}</th>"),
    ("<th>المكان والتكلفة</th>", "<th>{t('ads.col_placement_cost', 'المكان والتكلفة')}</th>"),
    ("<th>الدفع</th>", "<th>{t('ads.col_payment', 'الدفع')}</th>"),
    ("<th>الحالة</th>", "<th>{t('ads.col_status', 'الحالة')}</th>"),
    ("<th>إجراءات الإدارة</th>", "<th>{t('ads.col_actions', 'إجراءات الإدارة')}</th>"),
    
    # Table body
    ("لا توجد طلبات إعلانات حالياً", "{t('ads.no_ads_requests', 'لا توجد طلبات إعلانات حالياً')}"),
    (">الرابط الوجهة</a>", ">{t('ads.target_link', 'الرابط الوجهة')}</a>"),
    ("{ad.cost} ر.س", "{ad.cost} {t('common.currency', 'ر.س')}"),
    
    # Badges
    (">مدفوع<", ">{t('ads.paid', 'مدفوع')}<"),
    (">غير مدفوع<", ">{t('ads.unpaid', 'غير مدفوع')}<"),
    ("? 'مدفوع' : 'غير مدفوع'", "? t('ads.paid', 'مدفوع') : t('ads.unpaid', 'غير مدفوع')"),
    
    ("? 'مفعل' : ad.status === 'rejected' ? 'مرفوض' : 'في الانتظار'", "? t('ads.status_active', 'مفعل') : ad.status === 'rejected' ? t('ads.status_rejected', 'مرفوض') : t('ads.status_pending', 'في الانتظار')"),
    
    # Actions
    (">قبول</button>", ">{t('ads.action_approve', 'قبول')}</button>"),
    (">رفض</button>", ">{t('ads.action_reject', 'رفض')}</button>"),
    (">إيقاف</button>", ">{t('ads.action_stop', 'إيقاف')}</button>"),
    (">إعادة تفعيل</button>", ">{t('ads.action_reactivate', 'إعادة تفعيل')}</button>"),
    (">تأكيد الدفع</button>", ">{t('ads.action_confirm_payment', 'تأكيد الدفع')}</button>"),
]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)


with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)

import re
ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\(.*\)""")

count = 0
for i, line in enumerate(content.split('\n')):
    if line.strip().startswith('//') or line.strip().startswith('import '):
        continue
    if ar_regex.search(line) and not t_pattern.search(line):
        print(f"Line {i+1}: {line.strip()}")
        count += 1
print(f"Total untranslated strings in AdminAds.jsx: {count}")
