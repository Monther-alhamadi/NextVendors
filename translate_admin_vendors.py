import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminVendors.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # Top level strings
    ("`هل أنت متأكد من تغيير حالة الحظر لهذا التاجر (${vendor.name})?`", "`${t('admin.vendors.confirm_ban', 'هل أنت متأكد لحظر التاجر:')} ${vendor.name}؟`"),
    ('"تنسيق JSON غير صحيح أو فشل التحديث"', 't("admin.vendors.json_error", "تنسيق JSON غير صحيح أو فشل التحديث")'),
    ('alert("ميزة إضافة تاجر يدوياً قيد التطوير.")', 'alert(t("admin.vendors.feature_wip", "ميزة إضافة تاجر يدوياً قيد التطوير."))'),
    
    # Empty table
    ('لا يوجد بيانات لعرضها في هذا التبويب', '{t("admin.vendors.no_data", "لا يوجد بيانات لعرضها في هذا التبويب")}'),
    
    # Table data
    ("{v.code || 'بدون كود'}", "{v.code || t('admin.vendors.no_code', 'بدون كود')}"),
    (' محظور</span>', ' {t("admin.vendors.banned", "محظور")}</span>'),
    ("{v.status === 'active' ? 'نشط' : 'قيد الانتظار'}", "{v.status === 'active' ? t('common.active', 'نشط') : t('common.pending', 'قيد الانتظار')}"),
    ("{v.kyc_status === 'approved' ? 'موثق ✅' : v.kyc_status === 'pending' ? 'مراجعة الآن ⏳' : 'غير مكتمل'}", "{v.kyc_status === 'approved' ? t('admin.vendors.kyc_approved', 'موثق ✅') : v.kyc_status === 'pending' ? t('admin.vendors.kyc_review', 'مراجعة الآن ⏳') : t('admin.vendors.kyc_incomplete', 'غير مكتمل')}"),
    (">صلاحيات<", ">{t('admin.vendors.permissions', 'صلاحيات')}<"),
    ('{v.is_banned ? "فك الحظر" : "حظر التاجر"}', '{v.is_banned ? t("admin.vendors.unban", "فك الحظر") : t("admin.vendors.ban", "حظر التاجر")}'),
    ('title="إدارة الصلاحيات والاستثناءات"', 'title={t("admin.vendors.manage_permissions", "إدارة الصلاحيات والاستثناءات")}'),

    # KYC Modal
    ('<h2 className={styles.modalTitle}>توثيق التاجر: {kycModal.name}</h2>', '<h2 className={styles.modalTitle}>{t("admin.vendors.kyc_title", "توثيق التاجر:")} {kycModal.name}</h2>'),
    ('<h4 className={styles.modalSectionTitle}>المستندات المرفوعة</h4>', '<h4 className={styles.modalSectionTitle}>{t("admin.vendors.docs_uploaded", "المستندات المرفوعة")}</h4>'),
    ('>لا توجد مستندات مرفوعة.</p>', '>{t("admin.vendors.no_docs", "لا توجد مستندات مرفوعة.")}</p>'),
    ('>فتح المستند</a>', '>{t("admin.vendors.open_doc", "فتح المستند")}</a>'),
    ('>رابط المستند القديم</a>', '>{t("admin.vendors.old_doc", "رابط المستند القديم")}</a>'),
    ('<h4 className={styles.modalSectionTitle}>القرار التأديبي (في حال الرفض)</h4>', '<h4 className={styles.modalSectionTitle}>{t("admin.vendors.rejection_reason_title", "القرار التأديبي (في حال الرفض)")}</h4>'),
    ('placeholder="سبب الرفض (مثال: الهوية غير واضحة)"', 'placeholder={t("admin.vendors.reject_ph", "سبب الرفض (مثال: الهوية غير واضحة)")}'),
    ('>إلغاء</button>', '>{t("common.cancel", "إلغاء")}</button>'),
    ('>رفض المستندات</button>', '>{t("admin.vendors.reject_docs", "رفض المستندات")}</button>'),
    ('>اعتماد المتجر</button>', '>{t("admin.vendors.approve_store", "اعتماد المتجر")}</button>'),

    # Overrides Modal
    ('<h2 className={styles.modalTitle}>إدارة صلاحيات التاجر: {overrideModal.name}</h2>', '<h2 className={styles.modalTitle}>{t("admin.vendors.manage_permissions_for", "إدارة صلاحيات التاجر:")} {overrideModal.name}</h2>'),
    ('''أدخل الصلاحيات الاستثنائية للتاجر بصيغة JSON. هذه الصلاحيات ستتجاوز حدود الباقة الأساسية. لدعم واتساب أو تخصيص المتجر، استخدم القيم المنطقية true/false.''', '''{t("admin.vendors.override_hint", "أدخل الصلاحيات الاستثنائية للتاجر بصيغة JSON. هذه الصلاحيات ستتجاوز حدود الباقة الأساسية. لدعم واتساب أو تخصيص المتجر، استخدم القيم المنطقية true/false.")}'''),
    ('>حفظ الصلاحيات</button>', '>{t("admin.vendors.save_permissions", "حفظ الصلاحيات")}</button>'),
]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done translating AdminVendors.jsx.")
