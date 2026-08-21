# إعدادات التشغيل الحساسة

يستخدم الخادم نظام إعدادات ASP.NET Core الافتراضي. ملف `.env.example` قالب لأسماء المتغيرات فقط، ولا يقرأ التطبيق ملف `.env` تلقائيًا ولا يحتوي المستودع على أسرار فعلية.

اضبط القيم كمتغيرات بيئة فعلية في نظام التشغيل أو Visual Studio أو خدمة الاستضافة. ويمكن لـDocker Compose تحميل ملف `.env` خارج المستودع وتمرير القيم إلى حاوية الخادم. أسماء المتغيرات تستخدم `__` لتمثيل أقسام الإعدادات، مثل `Jwt__Key` و`ConnectionStrings__DefaultConnection`.

متغيرات البيئة تُضاف بواسطة ASP.NET Core بعد ملفات `appsettings`، ولذلك تتغلب قيمها على القيم الموجودة فيها.

## حساب مسؤول التطوير

يعمل إنشاء المسؤول الأول في بيئة `Development` فقط. يتطلب القيم التالية:

- `SeedAdmin__FullName`
- `SeedAdmin__Email`
- `SeedAdmin__Password`

إذا لم تُضبط كلمة المرور فلن يُنشأ أي حساب افتراضي، ويُسجل تحذير آمن. يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وأن تحتوي حرفًا ورقمًا. العملية idempotent وتعتمد البريد المطبّع، لذلك لا تنشئ حسابًا مكررًا في مرات التشغيل التالية.

يجب تطبيق migrations أولًا باستخدام `dotnet ef database update`. عند بدء الخادم بإعدادات Seed الصحيحة، يفحص البريد المطبّع وينشئ المسؤول مرة واحدة فقط.

## التشغيل باستخدام Docker Compose

تشغيل Visual Studio وSpaProxy لا يزال كما هو. ملفات Docker توفر مسار تشغيل إضافيًا منفصلًا بثلاث حاويات: SQL Server وASP.NET Core وAngular خلف nginx.

انسخ `.env.example` إلى ملف `.env` محلي غير متتبع، ثم اضبط على الأقل:

- `MSSQL_SA_PASSWORD` بكلمة مرور تحقق متطلبات SQL Server.
- `Jwt__Key` بقيمة سرية عشوائية لا تقل عن 32 بايت.

بعد ذلك شغّل:

```powershell
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
```

تتوفر الواجهة افتراضيًا على `http://localhost:8080`. يمكن تغيير المنفذ عبر `FRONTEND_PORT`. لا يُنشر منفذ SQL Server إلى الجهاز المضيف، وتصل إليه حاوية Backend فقط عبر الشبكة الداخلية. تحفظ بياناته في volume باسم `sqlserver-data`.

يمرر nginx طلبات `/api` إلى Backend ويطبق fallback إلى `index.html` لمسارات Angular. تطبق حاوية Backend migrations عند البدء لأن `Database__ApplyMigrationsOnStartup=true` مضبوط داخل Compose؛ هذا الخيار مغلق افتراضيًا في التشغيل المحلي.

لإيقاف الحاويات مع الاحتفاظ بالبيانات:

```powershell
docker compose down
```

حذف volume عبر `docker compose down --volumes` يحذف قاعدة بيانات Docker، لذلك لا تستخدمه إذا كانت البيانات مطلوبة.
