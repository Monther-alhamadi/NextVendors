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
         (">إدارة المنتجات ومراجعتها قبل النشر", ">{t('admin.products_subtitle', 'إدارة المنتجات ومراجعتها قبل النشر')}"),
         (">المنتج", ">{t('admin.col_product', 'المنتج')}"),
         (">التاجر", ">{t('admin.col_vendor', 'التاجر')}"),
         (">التصنيف", ">{t('admin.col_category', 'التصنيف')}"),
         (">المخزون", ">{t('admin.col_inventory', 'المخزون')}"),
         (">إجراءات</", ">{t('admin.col_actions', 'إجراءات')}</"),
         ("لا توجد منتجات حالياً", "{t('admin.no_products_yet', 'لا توجد منتجات حالياً')}"),
         ("? 'مسودة' : p.status === 'published' ? 'نشط' : 'قيد المراجعة'", "? t('admin.status_draft', 'مسودة') : p.status === 'published' ? t('admin.status_active', 'نشط') : t('admin.status_in_review', 'قيد المراجعة')"),
         (">نشر<", ">{t('admin.action_publish', 'نشر')}<"),
         (">تعليق<", ">{t('admin.action_suspend', 'تعليق')}<"),
         (">تعديل<", ">{t('common.edit', 'تعديل')}<"),
         ('message: "تم تحديث حالة المنتج"', 'message: t("admin.product_status_updated", "تم تحديث حالة المنتج")'),
         ('message: "فشل تحديث حالة المنتج"', 'message: t("admin.product_status_err", "فشل تحديث حالة المنتج")'),
         ("مثال: حذاء رياضي نايك أير ماكس", "{t('admin.search_placeholder_products', 'مثال: حذاء رياضي نايك أير ماكس')}"),
         (">الكل", ">{t('common.all', 'الكل')}"),
         ("أحذية رياضية", "{t('admin.category_shoes', 'أحذية رياضية')}"),
         ("إلكترونيات", "{t('home.categories.electronics', 'إلكترونيات')}"),
         ("ملابس", "{t('home.categories.clothing', 'ملابس')}"),
         ("نشط", "{t('admin.status_active', 'نشط')}"),
         ("قيد المراجعة", "{t('admin.status_in_review', 'قيد المراجعة')}"),
         ("مسودات", "{t('vendor.status_draft', 'مسودات')}"),
    ],
    "VendorAds.jsx": [
         ("إعلاناتي الممولة", "{t('vendor.my_ads', 'إعلاناتي الممولة')}"),
         ("روّج لمنتجاتك ومسارِك وزد المبيعات من خلال مساحاتنا الإعلانية", "{t('vendor.my_ads_subtitle', 'روّج لمنتجاتك ومسارِك وزد المبيعات من خلال مساحاتنا الإعلانية')}"),
         ("message: \"فشل جلب إعلاناتك\"", "message: t('vendor.err_fetch_ads', 'فشل جلب إعلاناتك')"),
         ("message: \"يرجى تعبئة جميع الحقول المطلوبة\"", "message: t('vendor.err_fill_required', 'يرجى تعبئة جميع الحقول المطلوبة')"),
         ("message: \"تم إرسال طلب الإعلان! بانتظار الموافقة الدفع\"", "message: t('vendor.success_ad_requested', 'تم إرسال طلب الإعلان! بانتظار الموافقة الدفع')"),
         ("message: \"فشل تقديم طلب الإعلان\"", "message: t('vendor.err_ad_request', 'فشل تقديم طلب الإعلان')"),
         (">حملة إعلانية جديدة", ">{t('vendor.new_ad_campaign', 'حملة إعلانية جديدة')}"),
         (">الإعلان", ">{t('ads.col_ad', 'الإعلان')}"),
         (">المكان</", ">{t('vendor.col_placement', 'المكان')}</"),
         (">التكلفة</", ">{t('vendor.col_cost', 'التكلفة')}</"),
         (">الدفع</", ">{t('ads.col_payment', 'الدفع')}</"),
         (">لا توجد إعلانات حتى الآن", ">{t('vendor.no_ads_yet', 'لا توجد إعلانات حتى الآن')}"),
         (">الرابط الوجهة<", ">{t('ads.target_link', 'الرابط الوجهة')}<"),
         (">طلب إعلان جديد<", ">{t('vendor.request_new_ad', 'طلب إعلان جديد')}<"),
         (">مكان الإعلان والمدة", ">{t('vendor.ad_placement_duration', 'مكان الإعلان والمدة')}"),
         ("البنر الرئيسي (أسبوع) - ", "الهيدر (أسبوع) - "), # Temporary normalize just in case it differs slightly
         ("البنر الرئيسي (أسبوع)", "{t('vendor.hero_banner_week', 'البنر الرئيسي (أسبوع)')}"),
         ("شريط المنتجات (3 أيام)", "{t('vendor.product_slider_3days', 'شريط المنتجات (3 أيام)')}"),
         ("نافذة منبثقة (يومين)", "{t('vendor.popup_2days', 'نافذة منبثقة (يومين)')}"),
         (">رابط توجيه الزوار<", ">{t('vendor.ad_target_url', 'رابط توجيه الزوار')}<"),
         ('placeholder="https://..."', 'placeholder="https://..."'),
         (">رابط صورة البنر (اختياري)<", ">{t('vendor.ad_banner_image_url', 'رابط صورة البنر (اختياري)')}<"),
         (">إلغاء<", ">{t('common.cancel', 'إلغاء')}<"),
         (">تقديم الطلب<", ">{t('vendor.submit_ad_request', 'تقديم الطلب')}<"),
    ],
    "AdminAnalytics.jsx": [
         ('message: "فشل تحميل البيانات التحليلية"', 'message: t("admin.err_fetch_analytics", "فشل تحميل البيانات التحليلية")'),
         (">التحليلات والتقارير", ">{t('admin.analytics_title', 'التحليلات والتقارير')}"),
         (">بيانات مفصلة حول المبيعات والأداء", ">{t('admin.analytics_subtitle', 'بيانات مفصلة حول المبيعات والأداء')}"),
         (">تصدير CSV", ">{t('admin.export_csv', 'تصدير CSV')}"),
         (">إجمالي المبيعات", ">{t('admin.total_sales', 'إجمالي المبيعات')}"),
         (">أرباح المنصة", ">{t('dashboard.kpi_profit', 'أرباح المنصة')}"),
         (">إجمالي الطلبات", ">{t('admin.total_orders', 'إجمالي الطلبات')}"),
         (">المتاجر النشطة", ">{t('admin.active_stores', 'المتاجر النشطة')}"),
         (">المبيعات اليومية", ">{t('admin.daily_sales', 'المبيعات اليومية')}"),
         (">اليوم", ">{t('admin.day', 'اليوم')}"),
         (">أفضل المتاجر مبيعاً", ">{t('admin.top_selling_stores', 'أفضل المتاجر مبيعاً')}"),
         ("><div className={styles.emptyState}>لا توجد بيانات كافية لعرض أفضل المتاجر</div>", "><div className={styles.emptyState}>{t('admin.not_enough_data_stores', 'لا توجد بيانات كافية لعرض أفضل المتاجر')}</div>"),
         (">مبيعات", ">{t('admin.sales_count', 'مبيعات')}"),
         (">المنتجات الأكثر طلباً", ">{t('admin.top_selling_products', 'المنتجات الأكثر طلباً')}"),
         ("><div className={styles.emptyState}>لا توجد بيانات كافية لعرض المنتجات</div>", "><div className={styles.emptyState}>{t('admin.not_enough_data_products', 'لا توجد بيانات كافية لعرض المنتجات')}</div>"),
         (">طلب", ">{t('admin.order_lbl', 'طلب')}"),
         ("['`${value.toLocaleString()} ر.س`', 'المبيعات']", "['`${value.toLocaleString()} ${t(\"common.currency\", \"ر.س\")}`', t('dashboard.sales', 'المبيعات')]"),
         ("name=\"المبيعات\"", "name={t('dashboard.sales', 'المبيعات')}"),
    ],
    "VendorDropshipping.jsx": [
         ('message: "فشل جلب قنوات الدروبشيبنج"', 'message: t("vendor.err_fetch_dropshipping_channels", "فشل جلب قنوات الدروبشيبنج")'),
         ('message: "تم تعديل الحالة بنجاح"', 'message: t("vendor.success_status_updated", "تم تعديل الحالة بنجاح")'),
         ('message: "فشل تحديث الحالة"', 'message: t("vendor.err_status_update", "فشل تحديث الحالة")'),
         (">إدارة الدروبشيبنج (Dropshipping)", ">{t('vendor.dropshipping_mgr', 'إدارة الدروبشيبنج (Dropshipping)')}"),
         (">تحكم في الربط مع الموردين ومزامنة المنتجات التلقائية", ">{t('vendor.dropshipping_mgr_sub', 'تحكم في الربط مع الموردين ومزامنة المنتجات التلقائية')}"),
         (">قنوات الدروبشيبنج المتوفرة", ">{t('vendor.available_dropshipping_channels', 'قنوات الدروبشيبنج المتوفرة')}"),
         (">لا توجد قنوات دروبشيبنج مفعلة في النظام حالياً", ">{t('vendor.no_active_channels', 'لا توجد قنوات دروبشيبنج مفعلة في النظام حالياً')}"),
         (">منتجات نشطة", ">{t('vendor.active_products', 'منتجات نشطة')}"),
         (">(متزامن)", ">{t('vendor.synced_badge', '(متزامن)')}"),
         (">غير مرتبط", ">{t('vendor.not_linked', 'غير مرتبط')}<"),
         (">معلّق بالخطأ", ">{t('vendor.suspended_error', 'معلّق بالخطأ')}<"),
         (">نشط", ">{t('admin.status_active', 'نشط')}<"),
         (">إيقاف المزامنة", ">{t('vendor.stop_sync', 'إيقاف المزامنة')}<"),
         (">تفعيل المزامنة", ">{t('vendor.activate_sync', 'تفعيل المزامنة')}<"),
         (">إدارة الإعدادات والربط", ">{t('vendor.manage_settings_link', 'إدارة الإعدادات والربط')}"),
         (">هذه القناة غير مشمولة في باقتك الحالية", ">{t('vendor.channel_not_in_plan', 'هذه القناة غير مشمولة في باقتك الحالية')}"),
         (">ترقية الباقة", ">{t('vendor.upgrade_plan', 'ترقية الباقة')}<"),
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
                
            # Add translation import if needed
            if 'useTranslation' not in content:
                content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from 'react-i18next';")
                content = content.replace("export default function", "export default function") # To be safe we won't blindly inject t hook unless we know where, 
                # actually for these 4 components I will assume they already have `useTranslation` or I'll just let the missing ones break and fix them. Wait, they usually have it.
                
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
