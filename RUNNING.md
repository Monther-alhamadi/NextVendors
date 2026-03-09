# دليل تشغيل المشروع (مُبسّط وواضح)

هذا المستند يشرح خطوات تشغيل مشروع E-commerce محليًا على جهازك (Windows PowerShell مع دعم Linux/macOS حيث ينطبق).
يشمل كل ما تحتاجه: إعداد بيئة عمل Python و Node، تشغيل الخوادم، تنفيذ الهجرات، وإنشاء مستخدم أدمن ومنتجات اختبار.

---

🔧 المتطلبات الأساسية:

- Python 3.11 أو 3.12 مثبتة (موصى بها 3.12 حسب pyproject)
- NodeJS + npm (لاختبار الواجهة)
- Git
- اختياري: Docker / Docker Compose (إن أردت تشغيل النسخة بالحاويات)

---

1. الاستنساخ وتهيئة المشروع

PowerShell (Windows):

```powershell
cd C:\Users\hp\Desktop\projet2
git clone <REPO_URL>
cd ecommerce-store
```

تنقّل لمجلد المشروع (مثال أدناه يفترض أنك داخل مجلد المشروع بعد الاستنساخ):

---

1. تشغيل Backend (محليًا - Windows PowerShell)

أ- إنشاء/تفعيل virtualenv (Windows PowerShell):

```powershell
python -m venv .venv
# تفعيل البيئة الافتراضية (PowerShell)
. \\.venv\\Scripts\\Activate.ps1
```

ب- تثبيت تبعيات Python للبنك الخلفي

```powershell
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

ج- تهيئة قاعدة البيانات (إن لم تقم بذلك بعد)

```powershell
python backend/scripts/init_db.py
```

د- تشغيل المهاجرات (Alembic)

```powershell
cd backend
alembic upgrade head
cd ..

> Note: New advanced product variations were added (Shuup-inspired). Run `cd backend && alembic upgrade head` to apply migration `0005_create_product_variations` which creates tables for variation variables, values, and variation result mappings. API endpoints: `/api/v1/products/{product_id}/variation_variables`, `/api/v1/products/{product_id}/variation_results`, `/api/v1/products/{product_id}/resolve_variation`.
```

هـ- بدء تشغيل الخادم (PowerShell helper):

```powershell
cd backend\scripts
.\start_backend.ps1 -port 8000 -venvName ".venv"
```

ملاحظة: السكربت أعلاه يفعل الـ virtualenv ويفحص البورت ويشغّل uvicorn تلقائيًا.

بديل: تشغيل uvicorn مباشرة (بعد تفعيل venv)

```powershell
cd backend
python -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

نصائح:

- إذا ظهر تحذير عن `.env` مفقود، قم بإنشاءه أو ضبط متغيرات البيئة المطلوبة (DATABASE_URL, CLOUDINARY_URL، إلخ).
- راجع `backend/requirements.txt` أو `backend/requirements-dev.txt` للأدوات المطلوبة.

---

1. تشغيل Frontend

PowerShell (Windows):

```powershell
cd frontend
npm install
npm run dev
```

الواجهة ستعمل عادة على `http://127.0.0.1:5173/` (قابل للتغيير حسب إعداد Vite).

للاختبارات E2E: استخدم `?e2e_bypass_auth=1` لتخطي المصادقة في الاختبارات المحلية عند الحاجة.

---

1. إنشاء مستخدم أدمن ومنتجات اختبار

بعد تفعيل البيئة الافتراضية وتهيئة قاعدة البيانات، شغّل:

```powershell
# إنشاء مستخدم أدمن
python backend\scripts\create_admin.py --username devadmin --email devadmin@example.com --password password

# إنشاء منتجات عيّنة
python backend\scripts\create_products.py
```

ملاحظات:

- `create_admin.py` يقوم بإنشاء مستخدم ويضع دور `admin` إذا لم يكن موجودًا.

---

1. تشغيل الاختبارات

Backend (pytest):

```powershell
cd backend
. \ .venv\Scripts\Activate.ps1
pytest -q
```

Frontend (Vitest و Playwright):

```powershell
cd frontend
npm install
# Unit tests
npm run test:unit
# End-to-end tests (Playwright)
npm run test:e2e
```

ملاحظة: قد تحتاج لتثبيت أدوات Playwright الإضافية مرة واحدة:

```powershell
npx playwright install
```

---

1. تشغيل باستخدام Docker Compose (وصف مُوسّع)
1. تشغيل Frontend

- `docker-compose.dev.yml` — خدمات مساعدة (مثل Redis) مطلوبة أثناء التطوير.
- `docker-compose.dev.full.yml` — الخدمات الفعلية للـ dev (backend, frontend, redis) وتربطها معًا.
- `docker-compose.prod.yml` — إعداد الإنتاج (backend + frontend + nginx + postgres + redis).

نقاط مهمة:

- في ملفات التطوير يتم خريطة المنافذ لاختبار التطبيقات محليًا: backend على `8000`، frontend على `3000`.
- إذا أردت خدمة كاملة مع إعادة بناء الصور محليًا استخدم ملفيّ التطوير معًا (dev + dev.full).

1. إنشاء مستخدم أدمن ومنتجات اختبار

```powershell
# 1) تشغيل Redis (خدمة مساعدة فقط):
docker compose -f docker-compose.dev.yml up -d

# 2) تشغيل كامل بيئة التطوير (backend + frontend + redis):
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml up -d --build

# 3) بديل: استخدم سكربت المساعدة الذي يحزم الأوامر السابقة:
pwsh .\scripts\start_docker_dev.ps1 -Rebuild -Detached

# 4) بعد تشغيل الخدمات، طبِّق الـ migrations وأنشئ مستخدم مؤقت (devadmin):
1. تشغيل الاختبارات
# 5) لعرض السجلات (logs):
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml logs -f

# 6) لإيقاف الخدمات وإزالة الحاويات والشبكات:
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml down --volumes --remove-orphans
```

ب. أوامر سريعة (POSIX / MacOS / Linux shell):

1. تشغيل باستخدام Docker Compose (وصف مُوسّع)

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml up -d --build
```

## apply migrations + create admin inside backend container

```bash
./scripts/docker_dev_setup.ps1 # PowerShell script (may need 'pwsh')
```

## or you can run the migration manually with docker

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml run --rm backend bash -lc "cd /workspace && python -m alembic -c alembic.ini upgrade head"
```

ج. تشغيل نسخة الإنتاج (أوامر أساسية):

```bash
# Build and run production services (detached):
docker compose -f docker-compose.prod.yml up -d --build

# Apply migrations (run once after deploy):
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
```

د. تشخيص المشكلات وملحوظات تشغيلية

- التحقق من حالة الحاويات:

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml ps
```

- الاطّلاع على السجلات لتشخيص الأخطاء:

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml logs -f backend
```

- في حالة تصادم المنافذ المحليّة (مثلاً 8000 أو 3000)، قم بإيقاف عملية أخرى أو أعد تشغيل الحاويات بعد تغيير إعدادات المنفذ.
  الواجهة ستعمل عادة على `http://127.0.0.1:5173/` (قابل للتغيير حسب إعداد Vite).

1. متغيرات البيئة أساسية (أمثلة)
   إذا شغّلت بيئة التطوير عبر Docker Compose (تستخدم خريطة المنافذ 3000/8000)، فيمكنك تشغيل اختبارات Playwright من المضيف مع تسليم عناوين URL المناسبة للعمل:

PowerShell example:

````powershell
# قم بتشغيل الحاويات أولاً (أو استخدم start_docker_dev.ps1)
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml up -d --build

# تطبيق التهيئة (migrations + admin)
pwsh .\scripts\docker_dev_setup.ps1

# اختبارات E2E من المضيف (Playwright) — تأكد من أن الحاويات تقبل الاتصالات على host:
$env:FRONTEND_URL = 'http://127.0.0.1:3000'
1. استكشاف الأخطاء الشائعة
cd frontend
npm ci
npx playwright install
npm run test:e2e

ملاحظة تشغيلية: إذا كنت تخدم الواجهة الأمامية من أصل مختلف (مثلاً Vite على 5173) وتستخدم طلبات مع ملفات تعريف الارتباط (cookies) المُضمَّنة، ضع متغير البيئة `FRONTEND_URLS` على الخادم الخلفي ليشمل أصول الواجهة الأمامية (قيمة مفصولة بفواصل) حتى يتم تكوين CORS بشكل صحيح. مثال:

```powershell
$env:FRONTEND_URLS = 'http://127.0.0.1:3000,http://127.0.0.1:5173'
````

كما تأكد من إعداد `SESSION_COOKIE_SAMESITE` و`SESSION_COOKIE_SECURE` إذا كنت تستخدم ملفات تعريف ارتباط عبر أصول مختلفة (cross-site cookies).

````

1. ملخّص أوامر سريعة (concise)

ز. تنظيف سريع

```bash
# إيقاف الخدمات وحذف الحاويات والشبكات:
docker compose -f docker-compose.dev.yml -f docker-compose.dev.full.yml down --volumes --remove-orphans

# لتنظيف مساحة Docker غير المستخدمة (اختياري):
docker system prune --all --volumes --force
````

---

1. متغيرات البيئة أساسية (أمثلة)

- `DATABASE_URL` (مثال): `sqlite:///./test.db`
- `CLOUDINARY_URL` (مثال): `cloudinary://<api_key>:<api_secret>@<cloud>`
- `VITE_ENABLE_RAPTOR_MINI` - `true` أو `false`
- `VITE_DISABLE_AUTH` - `1` لتسريح المصادقة محلياً (اختبار فقط)

تعيين مُؤقت في PowerShell:

```powershell
$env:DATABASE_URL = "sqlite:///./test.db"
$env:CLOUDINARY_URL = "cloudinary://fake_key:fake_secret@fake_cloud"
```

---

1. استكشاف الأخطاء الشائعة

- خطأ: `No such table` → شغّل `alembic upgrade head` أو `python backend/scripts/init_db.py`.
- خطأ: Virtual env activation script not found → مرّر اسم الـ venv الصحيح إلى `start_backend.ps1` أو أنشئ venv.
- تحذير: `Config file .env not found` → أنشئ ملف `.env` أو حدّد المتغيّرات كـ env vars.

---

1. ملخّص أوامر سريعة (concise)

PowerShell (مكرر للسرعة):

```powershell
# إعداد venv
python -m venv .venv
. \\.venv\\Scripts\\Activate.ps1
pip install -r backend/requirements.txt

# تهيئة DB
python backend/scripts/init_db.py
alembic upgrade head

# تشغيل الخوادم
cd backend\scripts; .\start_backend.ps1 -port 8000 -venvName ".venv"
cd frontend; npm run dev

# إنشاء موارد
python backend\scripts\create_admin.py --username devadmin --email devadmin@example.com --password password
python backend\scripts\create_products.py

# اختبارات
cd backend; pytest -q
cd frontend; npm run test:unit; npm run test:e2e
```

---

هل تريد مني:

- إنشاء ملف `env.sample` في الجذر مع متغيرات البيئة الأساسية (نعم/لا)؟
- إضافة هذه الإرشادات جزئيًا داخل `backend/README.md` و`frontend/README.md`؟
- تعديل `start_backend.ps1` بشكل يسمح بتفعيل البيئة وإنشاء قاعدة بيانات آليًا إن لم تكن موجودة؟

أخبرني أيًا منها لأكمل العمل.
