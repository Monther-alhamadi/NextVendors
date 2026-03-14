import codecs
import re
import os

files_to_translate = [
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminProducts.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorAds.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorDropshipping.jsx"
]

replacements = {
    "AdminProducts.jsx": [
         ('{\'التحكم الكامل في الكتالوج، المراجعة، والتعديل.\'}', '{t("admin.products_desc_2", "التحكم الكامل في الكتالوج، المراجعة، والتعديل.")}'),
         ('تصدير', '{t("admin.export", "تصدير")}'),
         ('<th>المتجر / البائع</th>', '<th>{t("admin.col_store_vendor", "المتجر / البائع")}</th>'),
         ('<th>السعر</th>', '<th>{t("vendor.col_price", "السعر")}</th>'),
         ('<th>الحالة</th>', '<th>{t("vendor.col_status", "الحالة")}</th>'),
         ('<th>الإجراءات</th>', '<th>{t("vendor.col_actions", "الإجراءات")}</th>'),
         ('title="موافقة مباشر"', 'title={t("admin.action_approve_direct", "موافقة مباشر")}'),
         ('title="رفض"', 'title={t("admin.action_reject", "رفض")}'),
         ('title="تعديل عميق"', 'title={t("admin.action_edit_deep", "تعديل عميق")}'),
         ('title="حذف بالكامل"', 'title={t("admin.action_delete_full", "حذف بالكامل")}'),
         ('رفض المنتج:', '{t("admin.reject_product", "رفض المنتج:")}'),
         ('placeholder="يرجى كتابة سبب الرفض لتوضيحه للتاجر (مثال: الصورة غير مناسبة، السعر مبالغ فيه...)"', 'placeholder={t("admin.reject_reason_ph", "يرجى كتابة سبب الرفض لتوضيحه للتاجر (مثال: الصورة غير مناسبة، السعر مبالغ فيه...)")}'),
         ('>إلغاء</button>', '>{t("common.cancel", "إلغاء")}</button>'),
         ('>تأكيد الرفض</button>', '>{t("admin.confirm_reject", "تأكيد الرفض")}</button>'),
         ('>مرفوض</span>', '>{t("admin.status_rejected", "مرفوض")}</span>'),
    ],
    "VendorAds.jsx": [
         ('name: "بنر رئيسي (الرئيسية)"', 'name: t("vendor.ad_hero_main", "بنر رئيسي (الرئيسية)")'),
         ('name: "جانبي مميز (المنتجات)"', 'name: t("vendor.ad_sidebar_premium", "جانبي مميز (المنتجات)")'),
         ('name: "بنر قبل الدفع (سلة المهملات)"', 'name: t("vendor.ad_checkout_upsell", "بنر قبل الدفع (سلة المهملات)")'), # Added typo in original, we'll keep the text
         ('message: "يرجى تعبئة كافة الحقول المطلوبة"', 'message: t("vendor.ad_fill_all", "يرجى تعبئة كافة الحقول المطلوبة")'),
         ('message: "تم تقديم طلب الإعلان بنجاح. سنقوم بمراجعته قريباً."', 'message: t("vendor.ad_success_submitted", "تم تقديم طلب الإعلان بنجاح. سنقوم بمراجعته قريباً.")'),
         ('message: "حدث خطأ أثناء تقديم الطلب"', 'message: t("vendor.ad_err_submit", "حدث خطأ أثناء تقديم الطلب")'),
         (' الترويج والإعلانات</h1>', ' {t("vendor.ads_promotions_title", "الترويج والإعلانات")}</h1>'),
         ('ارفع مبيعاتك من خلال حجز مساحات إعلانية في أبرز مناطق المنصة.', '{t("vendor.ads_promotions_subtitle", "ارفع مبيعاتك من خلال حجز مساحات إعلانية في أبرز مناطق المنصة.")}'),
         ('معسكر الإعلانات</h2>', '{t("vendor.ads_camp", "معسكر الإعلانات")}</h2>'),
         ('رابط صورة الإعلان (URL) *', '{t("vendor.ad_image_url_req", "رابط صورة الإعلان (URL) *")}'),
         ('رابط التوجيه (أين يذهب العميل عند النقر) *', '{t("vendor.ad_target_link_req", "رابط التوجيه (أين يذهب العميل عند النقر) *")}'),
         ('مكان الإعلان', '{t("vendor.ad_placement_lbl", "مكان الإعلان")}'),
         (' ر.س</option>', ' {t("common.currency", "ر.س")}</option>'),
         ('>التكلفة الإجمالية:</span>', '>{t("vendor.ad_total_cost", "التكلفة الإجمالية:")}</span>'),
         ('{formData.cost} ر.س</span>', '{formData.cost} {t("common.currency", "ر.س")}</span>'),
         ('سيتم خصم المبلغ من رصيد متجرك أو يتطلب تحويل بنكي إذا لم يكن لديك رصيد كافي. (ميزة قيد التطوير). التفعيل بعد مراجعة الإدارة.', '{t("vendor.ad_deduction_notice", "سيتم خصم المبلغ من رصيد متجرك أو يتطلب تحويل بنكي إذا لم يكن لديك رصيد كافي. (ميزة قيد التطوير). التفعيل بعد مراجعة الإدارة.")}'),
    ],
    "VendorDropshipping.jsx": [
         ('مرحباً بك في أسواق الجملة اللعالمية! ابحث عن أي منتج تريده (ساعات، إلكترونيات، ملابس)، وسنقوم نحن    ', '{t("vendor.ds_hero_desc_1", "مرحباً بك في أسواق الجملة اللعالمية! ابحث عن أي منتج تريده (ساعات، إلكترونيات، ملابس)، وسنقوم نحن")}    '),
    ]
}

ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\(.*\)""")

for filepath in files_to_translate:
    filename = os.path.basename(filepath)
    if filename in replacements:
        print(f"Translating {filename}...")
        try:
            with codecs.open(filepath, 'r', 'utf-8') as f:
                content = f.read()
                
            for old, new in replacements[filename]:
                content = content.replace(old, new)
                
            with codecs.open(filepath, 'w', 'utf-8') as f:
                f.write(content)
                
            count = 0
            for i, line in enumerate(content.split('\n')):
                if line.strip().startswith('//') or line.strip().startswith('import '):
                    continue
                if ar_regex.search(line) and not t_pattern.search(line):
                    print(f"  Missed line {i+1} in {filename}: {line.strip()}")
                    count += 1
            print(f"Remaining untranslated in {filename}: {count}\n")
        except Exception as e:
            print(f"Error on {filename}: {e}")
