# Quick Start Guide 🚀

## التشغيل السريع (Arabic)

### 1. تثبيت المتطلبات
```bash
cd frontend
npm install
```

### 2. تشغيل السيرفر
```bash
npm run dev
```

### 3. فتح المتصفح
افتح المتصفح على العنوان: `http://localhost:5173`

### 4. تسجيل الدخول
استخدم أحد الحسابات التجريبية:
- **عميل**: `user@example.com` / `password`
- **بائع**: `vendor@example.com` / `password`
- **مدير**: `admin@example.com` / `password`

### 5. تغيير اللغة
اضغط على زر اللغة في الهيدر للتبديل بين العربية والإنجليزية

---

## Quick Start (English)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to: `http://localhost:5173`

### 4. Login
Use demo accounts:
- **Customer**: `user@example.com` / `password`
- **Vendor**: `vendor@example.com` / `password`
- **Admin**: `admin@example.com` / `password`

### 5. Change Language
Click the language toggle button in the header to switch between Arabic and English

---

## Key Features to Test

### Customer Portal ✅
1. Browse products on landing page
2. Add items to cart
3. Complete checkout process
4. View order history in profile
5. Manage shipping addresses
6. Add items to wishlist

### Vendor Portal 💼
1. View dashboard with sales KPIs
2. Manage product inventory
3. Process pending orders
4. Check wallet balance

### Admin Portal 🛡️
1. View platform statistics
2. Manage users (activate/deactivate)
3. Manage vendors and payouts
4. Access quick management links

---

## Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.js or use:
npm run dev -- --port 3000
```

### Dependencies Installation Failed
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Translation Not Working
Ensure language files exist:
- `src/locales/ar/translation.json`
- `src/locales/en/translation.json`

---

## Development Tips

### Hot Module Reload (HMR)
All changes are automatically reflected in the browser. No manual refresh needed!

### Component Development
Use the standardized components:
```javascript
import Input from '../components/common/Input';
import CustomButton from '../components/common/CustomButton';
import PageContainer from '../components/PageContainer';
```

### Adding New Translations
1. Add key to both `ar/translation.json` and `en/translation.json`
2. Use in component: `t('your.key.path')`

---

**Happy Coding! 🎉**
