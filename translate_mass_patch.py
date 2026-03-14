import codecs
import re
import os

files_to_translate = [
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminProducts.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorAds.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminAnalytics.jsx",
    r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorDropshipping.jsx"
]

replacements = {
    "AdminProducts.jsx": [
         (">نشر</", ">{t('admin.action_publish', 'نشر')}</"),
         (">تعليق</", ">{t('admin.action_suspend', 'تعليق')}</"),
         (">تعديل</", ">{t('common.edit', 'تعديل')}</"),
    ],
    "VendorAds.jsx": [
         (">الإعلان</", ">{t('ads.col_ad', 'الإعلان')}</"),
         ("><div", "><div"), # Dummy
         ("يتم اقتطاع التكلفة من رصيدك تلقائياً. تأكد من شحن محفظتك، أو سيتم تجاهل الطلب التلقائي إذا لم يكن لديك رصيد كافي. (ميزة قيد التطوير). التفعيل بعد مراجعة الإدارة.", "{t('vendor.ad_payment_notice', 'يتم اقتطاع التكلفة من رصيدك تلقائياً. تأكد من شحن محفظتك، أو سيتم تجاهل الطلب التلقائي إذا لم يكن لديك رصيد كافي. (ميزة قيد التطوير). التفعيل بعد مراجعة الإدارة.')}"),
         ("? 'جاري التقديم...' : 'تأكيد طلب الإعلان'", "? t('vendor.ad_submitting', 'جاري التقديم...') : t('vendor.ad_confirm', 'تأكيد طلب الإعلان')"),
         (">إعلانات سابقة<", ">{t('vendor.prev_ads', 'إعلانات سابقة')}<"),
         ("سجل إعلاناتك سيظهر هنا.", "{t('vendor.ad_history_empty', 'سجل إعلاناتك سيظهر هنا.')}"),
    ],
    "AdminAnalytics.jsx": [
         ('label: "يومي"', 'label: t("admin.period_daily", "يومي")'),
         ('label: "أسبوعي"', 'label: t("admin.period_weekly", "أسبوعي")'),
         ('label: "شهري"', 'label: t("admin.period_monthly", "شهري")'),
         ('label: "سنوي"', 'label: t("admin.period_yearly", "سنوي")'),
         ('} طلب | نمو ${', '} {t("admin.order_lbl_short", "طلب")} | {t("admin.growth_lbl", "نمو")} ${'),
         ('detail={`نمو ${', 'detail={`${t("admin.growth_lbl", "نمو")} ${'),
         (' متجر نشط`}', ' ${t("admin.active_store_lbl", "متجر نشط")}`}'),
         ('title="المستخدمين"', 'title={t("admin.users_title", "المستخدمين")}'),
         (' تاجر | ${', ' ${t("admin.vendor_lbl", "تاجر")} | ${'),
         ('} عميل`}', '} {t("admin.customer_lbl", "عميل")}`}'),
         ('ر.س`, \'الإيرادات\']', '${t("common.currency", "ر.س")}`, t("admin.revenue_lbl", "الإيرادات")]'),
         ('>لا توجد بيانات للفترة المحددة<', '>{t("admin.no_data_period", "لا توجد بيانات للفترة المحددة")}<'),
         ('ر.س`, \'المبيعات\']', '${t("common.currency", "ر.س")}`, t("admin.sales_count", "المبيعات")]'),
         ('>لا توجد بيانات<', '>{t("admin.no_data", "لا توجد بيانات")}<'),
         ('أفضل المتاجر أداءً', '{t("admin.top_performing_stores", "أفضل المتاجر أداءً")}'),
         ('>المتجر</', '>{t("admin.store_col", "المتجر")}</'),
         ('>الإيرادات</', '>{t("admin.revenue_lbl", "الإيرادات")}</'),
         ('>عدد المبيعات</', '>{t("admin.sales_count", "عدد المبيعات")}</'),
         (' ر.س</td', ' {t("common.currency", "ر.س")}</td'),
    ],
    "VendorDropshipping.jsx": [
         ('setError("لم يتم العثور على منتجات مطابقة.");', 'setError(t("vendor.ds_no_matching_products", "لم يتم العثور على منتجات مطابقة."));'),
         ('setError("حدث خطأ أثناء محاولة الاتصال بمزود الجملة. يرجى المحاولة لاحقاً.");', 'setError(t("vendor.ds_err_connect_supplier", "حدث خطأ أثناء محاولة الاتصال بمزود الجملة. يرجى المحاولة لاحقاً."));'),
         ('message: "تمت إضافة المنتج إلى متجرك بنجاح!"', 'message: t("vendor.ds_success_add_product", "تمت إضافة المنتج إلى متجرك بنجاح!")'),
         ('message: "حدث خطأ أثناء استيراد المنتج."', 'message: t("vendor.ds_err_import_product", "حدث خطأ أثناء استيراد المنتج.")'),
         ('>استيراد المنتجات (الدروب شيبينج) بدون رأس مال<', '>{t("vendor.ds_hero_title", "استيراد المنتجات (الدروب شيبينج) بدون رأس مال")}<'),
         ('مرحباً بك في أسواق الجملة اللعالمية! ابحث عن أي منتج تريده (ساعات، إلكترونيات، ملابس)، وسنقوم نحن', '{t("vendor.ds_hero_desc_1", "مرحباً بك في أسواق الجملة اللعالمية! ابحث عن أي منتج تريده (ساعات، إلكترونيات، ملابس)، وسنقوم نحن")}'),
         ('بحقن <span className={s.highlight}>صوره وتفاصيله بضغطة زر إلى متجرك.</span> لن تحتاج لدفع ثمنه إلا بعد أن يأتيك مشترٍ ويدفع لك أولاً!', '{t("vendor.ds_hero_desc_2_pre", "بحقن ")}<span className={s.highlight}>{t("vendor.ds_hero_desc_2_hl", "صوره وتفاصيله بضغطة زر إلى متجرك.")}</span>{t("vendor.ds_hero_desc_2_post", " لن تحتاج لدفع ثمنه إلا بعد أن يأتيك مشترٍ ويدفع لك أولاً!")}'),
         ('placeholder="ابحث بالإنجليزية، مثلاً: Smart Watch أو Wireless Earbuds..."', 'placeholder={t("vendor.ds_search_ph", "ابحث بالإنجليزية، مثلاً: Smart Watch أو Wireless Earbuds...")}'),
         (' ? "بحث واستكشاف"', ' ? t("vendor.ds_search_btn", "بحث واستكشاف")'),
         (': "بحث واستكشاف"}', ': t("vendor.ds_search_btn", "بحث واستكشاف")}'),
         ('أدخل اسم المنتج الذي ترغب ببيعه للبدء بالتصفح...', '{t("vendor.ds_enter_product_name", "أدخل اسم المنتج الذي ترغب ببيعه للبدء بالتصفح...")}'),
         ('>بدون صورة<', '>{t("vendor.ds_no_image", "بدون صورة")}<'),
         ('>التكلفة من المورد:<', '>{t("vendor.ds_supplier_cost", "التكلفة من المورد:")}<'),
         ('>سعر البيع المقترح:<', '>{t("vendor.ds_suggested_price", "سعر البيع المقترح:")}<'),
         ('>ربحك المتوقع:<', '>{t("vendor.ds_expected_profit", "ربحك المتوقع:")}<'),
         ('? "✅ تمت الإضافة لمتجرك" : "🚀 أضف إلى متجري"', '? "✅ " + t("vendor.ds_added_to_store", "تمت الإضافة لمتجرك") : "🚀 " + t("vendor.ds_add_to_store", "أضف إلى متجري")'),
         ('>لن تدفع شيئاً الآن<', '>{t("vendor.ds_wont_pay_now", "لن تدفع شيئاً الآن")}<'),
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
