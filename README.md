# Task Management COFC

## Overview

نظام لإدارة المهام مبني بدورين رئيسيين: `Admin` و`Employee`. يتيح النظام التسجيل الذاتي للموظفين مع مراجعة طلب التسجيل، وإدارة المستخدمين، وإسناد المهام، ومتابعة حالتها بين `Pending` و`InProgress` و`Completed`، وإرسال إشعارات داخلية عند الموافقة أو الرفض مع دعم SMTP اختياري.

يعتمد النظام JWT Authentication، وتُطبق الأدوار وحالة الحساب وملكية المهام داخل ASP.NET Core API. واجهة Angular مسؤولة عن تجربة الاستخدام، وليست بديلًا عن صلاحيات الخادم.

## Tech Stack

| الجزء | التقنية الموجودة في المشروع |
|---|---|
| Backend | ASP.NET Core 10 / `net10.0` |
| API | Controllers، OpenAPI 10.0.11، Swagger UI 10.2.3 |
| Data | Entity Framework Core 10.0.11، SQL Server |
| Authentication | ASP.NET Core JWT Bearer 10.0.11 |
| Frontend | Angular Core 22.1.3، Angular CLI 22.1.5، NgModule architecture |
| Language | TypeScript 6.0.3 |
| UI | Bootstrap 5.3.8 RTL |
| Reactive programming | RxJS 7.8.2 |
| Backend tests | xUnit 2.9.3، WebApplicationFactory، SQLite test database |
| Frontend tests | Jasmine 6.3.0، Karma 6.4.4، Chrome Headless |
| Container runtime | Docker Compose، SQL Server 2022، nginx |

## Project Structure

```text
taskManagmentCofc/
├── taskManagmentCofc.slnx
├── taskManagmentCofc.Server/
│   ├── Controllers/
│   ├── Data/
│   │   └── Configurations/
│   ├── DTOs/
│   ├── Entities/
│   ├── Enums/
│   ├── Extensions/
│   ├── Middleware/
│   ├── Migrations/
│   ├── Security/
│   └── Services/
├── taskmanagmentcofc.client/
│   └── src/app/
│       ├── core/
│       ├── features/
│       │   ├── admin/
│       │   ├── auth/
│       │   └── employee/
│       └── shared/
└── taskManagmentCofc.Server.Tests/
    ├── Auth/
    ├── Infrastructure/
    ├── Middleware/
    ├── Tasks/
    └── Users/
```

- `taskManagmentCofc.Server`: ASP.NET Core Web API، طبقة البيانات، المصادقة والصلاحيات، الخدمات، migrations ومعالجة الأخطاء المركزية.
- `taskmanagmentcofc.client`: Angular 22 SPA بواجهة عربية RTL متجاوبة، تصميم حديث، وثيمين فاتح وداكن مع حفظ تفضيل المستخدم، ومساحات مستقلة للمسؤول والموظف.
- `taskManagmentCofc.Server.Tests`: اختبارات تكامل xUnit للمصادقة، المستخدمين، المهام، منع IDOR والتحقق من حالة المستخدم بعد إصدار JWT.

## Prerequisites

للتشغيل المحلي:

- .NET 10 SDK.
- Node.js متوافق مع Angular 22؛ الإصدار `24.15.0` أو أحدث من سلسلة Node 24 مناسب للمشروع.
- npm؛ المشروع يحدد `npm@11.17.0` في `package.json`.
- SQL Server Express أو SQL Server LocalDB.
- EF Core CLI 10 عند تنفيذ أوامر migrations.
- شهادة ASP.NET Core HTTPS للتطوير.
- Chrome أو Chromium عند تشغيل اختبارات Angular عبر Karma.
- Visual Studio حديث يدعم `.slnx` وJavaScript `.esproj` عند استخدام تجربة Visual Studio المتكاملة.

للتشغيل بالحاويات يلزم Docker Desktop مع Docker Compose وLinux containers.

يمكن تجهيز أدوات HTTPS وEF Core عند الحاجة:

```powershell
dotnet dev-certs https --trust
dotnet tool install --global dotnet-ef --version 10.0.11
```

## Local Development

نفّذ الأوامر التالية من root المشروع:

```powershell
dotnet restore taskManagmentCofc.slnx
npm --prefix taskmanagmentcofc.client ci
```

للتشغيل من Visual Studio في بيئة Development، خزّن مفتاح JWT مرة واحدة في .NET User Secrets. يجب ألا تقل قيمته عن 32 بايت:

```powershell
dotnet user-secrets set "Jwt:Key" "replace-with-a-development-key-of-at-least-32-bytes" --project taskManagmentCofc.Server
```

يمكن بدلًا من ذلك استخدام متغير البيئة `Jwt__Key`. تبقى User Secrets خارج ملفات المشروع وGit، وتُقرأ تلقائيًا عند تشغيل بيئة Development من Visual Studio أو `dotnet run`.

بعد إعداد قاعدة البيانات يمكن تشغيل Backend وAngular كل منهما في terminal مستقل، أو فتح `taskManagmentCofc.slnx` في Visual Studio وتشغيل profile الخادم `https`. تكامل SpaProxy الحالي يشغّل أمر Angular الموجود في `package.json` دون الحاجة إلى تغيير ملفات Docker أو استخدام CORS واسع.

## التشغيل المحلي خطوة بخطوة

نفّذ الخطوات التالية بالترتيب من PowerShell.

### 1. الحصول على المشروع وتثبيت الحزم

```powershell
git clone https://github.com/ahmadalmahrouk28-cpu/taskManagmentCofc.git
Set-Location taskManagmentCofc
dotnet restore taskManagmentCofc.slnx
npm --prefix taskmanagmentcofc.client ci
```

### 2. إعداد مفتاح JWT محليًا

أنشئ قيمة عشوائية طويلة، ثم خزّنها في User Secrets. لا تضعها في Angular أو في Git:

```powershell
$jwtKey = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
dotnet user-secrets set "Jwt:Key" $jwtKey --project taskManagmentCofc.Server
```

### 3. إعداد اتصال قاعدة البيانات المحلية

أنشئ الملف المحلي التالي إذا لم يكن موجودًا؛ هذا الملف مستثنى من Git:

`taskManagmentCofc.Server/appsettings.Development.json`

ضع فيه اتصال LocalDB التالي، أو استبدله باتصال SQL Server Express المناسب لديك:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=TaskManagementCofc;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True"
  }
}
```

### 4. إنشاء قاعدة البيانات

```powershell
dotnet ef database update --project taskManagmentCofc.Server --startup-project taskManagmentCofc.Server
```

### 5. إنشاء حساب أدمن للتطوير

اختر كلمة مرور قوية خاصة بك، ثم خزّن بيانات الحساب محليًا. الحساب لا يُنشأ إلا في بيئة Development:

```powershell
dotnet user-secrets set "SeedAdmin:FullName" "System Admin" --project taskManagmentCofc.Server
dotnet user-secrets set "SeedAdmin:Email" "admin@example.local" --project taskManagmentCofc.Server
dotnet user-secrets set "SeedAdmin:Password" "ضع-هنا-كلمة-مرور-قوية-تحتوي-حرفًا-ورقمًا" --project taskManagmentCofc.Server
```

### 6. تشغيل الـBackend

افتح Terminal أول من root المشروع:

```powershell
dotnet run --project taskManagmentCofc.Server --launch-profile https
```

بعد التشغيل:

- API وSwagger: `https://localhost:7145/swagger`
- API HTTP: `http://localhost:5056`

### 7. تشغيل واجهة Angular

افتح Terminal ثاني من root المشروع:

```powershell
npm --prefix taskmanagmentcofc.client start
```

ثم افتح:

```text
https://localhost:51089
```

توجّه Angular جميع طلبات `/api` تلقائيًا إلى الـBackend المحلي عبر Proxy. سجّل الدخول باستخدام البريد وكلمة المرور اللذين اخترتهما في الخطوة 5.

### بديل Visual Studio

افتح `taskManagmentCofc.slnx` ثم شغّل Profile باسم `https`. سيشغّل SpaProxy واجهة Angular تلقائيًا. تحتاج فقط إلى تنفيذ الخطوات 1 إلى 5 مرة واحدة أولًا.

## Database Setup

إعداد Development المحلي يستخدم LocalDB من الملف غير المرفوع إلى Git:

`taskManagmentCofc.Server/appsettings.Development.json`

```text
Server=(localdb)\MSSQLLocalDB;Database=TaskManagementCofc;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True
```

يمكن استبداله دون تعديل source control عبر متغير البيئة:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=.\SQLEXPRESS;Database=TaskManagementCofc;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True"
```

لتطبيق migration الحالية `InitialCreate`:

```powershell
dotnet ef database update --project taskManagmentCofc.Server --startup-project taskManagmentCofc.Server
```

المشروع يعتمد migrations ولا يستخدم `EnsureCreated` كبديل عنها.

## Environment Variables

ملف `.env.example` في root هو قالب للأسماء المطلوبة ولا يحتوي أسرارًا حقيقية. ASP.NET Core لا يقرأ ملف `.env` تلقائيًا في التشغيل المحلي؛ استخدم متغيرات بيئة النظام أو إعدادات Visual Studio. Docker Compose يقرأ ملف `.env` المحلي تلقائيًا عند وجوده، والملف مستبعد بواسطة `.gitignore`.

| المتغير | الاستخدام |
|---|---|
| `ConnectionStrings__DefaultConnection` | اتصال SQL Server؛ يتغلب على قيمة appsettings |
| `Jwt__Key` | مفتاح توقيع JWT، مطلوب وبطول 32 بايت على الأقل |
| `Jwt__Issuer` | مصدر JWT؛ القيمة الافتراضية `taskManagmentCofc.Server` |
| `Jwt__Audience` | جمهور JWT؛ القيمة الافتراضية `taskmanagmentcofc.client` |
| `Jwt__ExpiresMinutes` | مدة صلاحية Access Token، والافتراضي 60 دقيقة |
| `SeedAdmin__FullName` | اسم مسؤول Development الأول |
| `SeedAdmin__Email` | بريد مسؤول Development الأول |
| `SeedAdmin__Password` | كلمة مرور مسؤول Development؛ لا توجد قيمة افتراضية |
| `SeedAdmin__EnableProductionBootstrap` | يفعّل إنشاء أول Admin في Production مرة واحدة فقط لقاعدة بيانات فارغة؛ يعاد إلى `false` مباشرة بعد الإنشاء |
| `Smtp__Host` | خادم SMTP الاختياري |
| `Smtp__Port` | منفذ SMTP، والافتراضي 587 |
| `Smtp__Username` | اسم مستخدم SMTP |
| `Smtp__Password` | كلمة مرور SMTP |
| `Smtp__FromEmail` | بريد المرسل |
| `Smtp__FromName` | اسم المرسل |
| `Smtp__EnableSsl` | تفعيل SSL لاتصال SMTP |

لاختبار البريد أثناء التشغيل المحلي، خزّن بيانات مزود SMTP في User Secrets بدلًا من ملفات المشروع:

```powershell
dotnet user-secrets set "Smtp:Host" "your-smtp-host" --project taskManagmentCofc.Server
dotnet user-secrets set "Smtp:Port" "587" --project taskManagmentCofc.Server
dotnet user-secrets set "Smtp:Username" "your-smtp-username" --project taskManagmentCofc.Server
dotnet user-secrets set "Smtp:Password" "your-smtp-app-password" --project taskManagmentCofc.Server
dotnet user-secrets set "Smtp:FromEmail" "sender@example.com" --project taskManagmentCofc.Server
dotnet user-secrets set "Smtp:FromName" "Task Management" --project taskManagmentCofc.Server
dotnet user-secrets set "Smtp:EnableSsl" "true" --project taskManagmentCofc.Server
```

يجب أن تكون القيم الفعلية من مزود البريد المستخدم. عند غياب `Host` أو `FromEmail` يحفظ النظام الإشعار الداخلي ويتجاوز البريد مع تسجيل Warning آمنة.
| `MSSQL_SA_PASSWORD` | كلمة مرور SQL Server container |
| `SQLSERVER_DATABASE` | اسم قاعدة Docker، والافتراضي `TaskManagementCofc` |
| `FRONTEND_PORT` | منفذ واجهة Docker على الجهاز، والافتراضي 8080 |

قيم Environment Variables تتغلب على قيم ملفات appsettings وفق ترتيب إعدادات ASP.NET Core.

## Run Backend

من root المشروع، وبعد ضبط مفتاح JWT في User Secrets أو متغير البيئة وتطبيق migrations:

```powershell
dotnet run --project taskManagmentCofc.Server --launch-profile https
```

المنافذ الفعلية من `launchSettings.json`:

- HTTPS: `https://localhost:7145`
- HTTP: `http://localhost:5056`
- Swagger UI في Development: `https://localhost:7145/swagger`
- OpenAPI document في Development: `https://localhost:7145/openapi/v1.json`
- Health endpoint: `https://localhost:7145/health`

## Run Angular

```powershell
Set-Location taskmanagmentcofc.client
npm start
```

الأمر `npm start` يشغّل script المناسب لنظام التشغيل ويجهز شهادة HTTPS المستخدمة في التطوير. تعمل Angular development server على:

`https://localhost:51089`

جميع الخدمات تستخدم روابط نسبية مثل `/api/auth/login`. يقوم `src/proxy.conf.js` بتوجيه `/api` إلى Backend HTTPS على `https://localhost:7145` افتراضيًا، أو إلى عنوان ASP.NET Core الذي يمرره SpaProxy عبر متغيرات البيئة.

## Development Test Credentials

لا توجد بيانات دخول أو كلمة مرور ثابتة داخل المستودع.

يمكن إنشاء مسؤول Development واحد عبر `SeedAdmin__FullName` و`SeedAdmin__Email` و`SeedAdmin__Password`. يجب اختيار كلمة مرور تحقق سياسة المشروع: 8 أحرف على الأقل وتحتوي حرفًا ورقمًا. إذا لم تُضبط كلمة المرور فلن ينشئ النظام حسابًا ضعيفًا تلقائيًا. عملية seed تعمل في بيئة `Development` فقط، وهي idempotent ولا تنشئ البريد نفسه أكثر من مرة.

يجب تطبيق migrations قبل تشغيل الخادم لأول مرة مع إعدادات Seed Admin.

## Registration Workflow

1. يسجل المستخدم اسمه وبريده وكلمة مروره عبر `/register`.
2. يفرض Backend الدور `Employee` والحالة `Pending`؛ لا يستطيع المستخدم اختيار `Admin`.
3. يُمنع حساب `Pending` من تسجيل الدخول وتعيد API الرمز `ACCOUNT_PENDING`.
4. يشاهد المسؤول الطلب ضمن طلبات التسجيل المعلقة.
5. عند الموافقة تصبح الحالة `Active`، ويصبح تسجيل الدخول متاحًا.
6. عند الرفض تصبح الحالة `Rejected`، ويُحفظ سبب الرفض ويُمنع تسجيل الدخول.
7. يُحفظ إشعار داخلي عند الموافقة أو الرفض. وإذا كانت إعدادات SMTP مكتملة تُرسل رسالة بريدية أيضًا؛ فشل SMTP لا يلغي قرار المسؤول أو الإشعار الداخلي.

## Admin Capabilities

- مشاهدة Dashboard لإجماليات المستخدمين والموظفين وطلبات التسجيل وحالات المهام.
- مشاهدة إحصائية تفصيلية لعدد مهام كل موظف وتوزيعها حسب الحالة.
- مشاهدة طلبات التسجيل المعلقة والموافقة عليها أو رفضها مع سبب إلزامي.
- البحث في المستخدمين وتصفيتهم حسب الدور والحالة.
- إنشاء `Admin` أو `Employee` بحالة `Active` مباشرة.
- تعديل الاسم والبريد والدور مع الحفاظ على uniqueness للبريد.
- حذف الموظف دون حذف سجل المهام؛ يصبح assignee فارغًا للمهام السابقة.
- عدم حذف الحساب الحالي أو آخر مسؤول فعّال، وعدم حذف منشئ مهام محفوظة.
- إنشاء المهام وإسنادها إلى موظف فعّال.
- البحث في جميع المهام وتصفيتها حسب الحالة أو الموظف.
- تعديل محتوى المهمة وإعادة إسنادها وتغيير حالتها أو حذفها.

## Employee Capabilities

- مشاهدة المهام المسندة إليه فقط دون إرسال User ID من الواجهة.
- البحث في مهامه وتصفيتها حسب الحالة.
- مشاهدة تفاصيل المهمة التي يملكها فقط.
- تحديث حالة مهمته إلى `InProgress` أو `Completed`.
- مشاهدة بيانات الملف الشخصي الحالية.
- مشاهدة إشعاراته الداخلية وتعليم إشعاره الخاص كمقروء.
- لا يستطيع إنشاء المهام أو حذفها أو تعديل عنوانها ووصفها أو إعادة إسنادها أو الوصول إلى مهمة موظف آخر.

## Security

- تُوقّع JWT بمفتاح يأتي من configuration أو environment، مع التحقق من issuer وaudience والتوقيع والانتهاء.
- تُطبق أدوار `Admin` و`Employee` داخل API باستخدام Authorization وليست اعتمادًا على Angular Guards.
- بعد التحقق من JWT، تفحص آلية الحالة المركزية `ActiveUserJwtEvents` المستخدم الحالي في قاعدة البيانات لكل endpoint محمي. إذا حُذف الحساب أو لم تعد حالته `Active` تُرفض الجلسة القديمة بـ401.
- تعتمد هوية المستخدم على `sub` في JWT الموثق، ولا تثق API بأي User ID يرسله العميل لتحديد المستخدم الحالي.
- شروط ملكية المهام والإشعارات موجودة داخل استعلامات قاعدة البيانات لمنع IDOR والوصول إلى بيانات مستخدم آخر.
- تُخزن كلمات المرور باستخدام PasswordHasher المصمم لكلمات المرور، ولا تخرج `PasswordHash` من API.
- البريد المطبّع `NormalizedEmail` فريد لمنع التكرار باختلاف حالة الأحرف.
- الأسرار غير موجودة في source control، و`.env` مستبعد، ولا تُسجل كلمات المرور أو JWT أو connection strings أو SMTP password.
- معالجة الأخطاء مركزية ولا تعيد stack traces أو تفاصيل قاعدة البيانات الحساسة في Production.

## API Endpoints

| Method | Endpoint | الصلاحية | الوصف |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | تسجيل موظف جديد بحالة Pending |
| `POST` | `/api/auth/login` | Public | تسجيل الدخول وإصدار JWT للحساب Active |
| `GET` | `/api/auth/me` | Authenticated | بيانات المستخدم الحالي |
| `GET` | `/api/admin/dashboard` | Admin | إحصائيات لوحة التحكم |
| `GET` | `/api/admin/dashboard/task-statistics` | Admin | إحصائية المهام لكل موظف |
| `GET` | `/api/admin/registrations/pending` | Admin | طلبات التسجيل المعلقة |
| `POST` | `/api/admin/registrations/{userId}/approve` | Admin | الموافقة على طلب Pending |
| `POST` | `/api/admin/registrations/{userId}/reject` | Admin | رفض الطلب مع `Reason` |
| `GET` | `/api/admin/users` | Admin | المستخدمون مع `search` و`role` و`status` |
| `GET` | `/api/admin/users/{id}` | Admin | تفاصيل مستخدم |
| `POST` | `/api/admin/users` | Admin | إنشاء مستخدم Active |
| `PUT` | `/api/admin/users/{id}` | Admin | تعديل الاسم والبريد والدور |
| `DELETE` | `/api/admin/users/{id}` | Admin | حذف مستخدم وفق قواعد سلامة البيانات |
| `GET` | `/api/tasks` | Authenticated | جميع المهام للمسؤول، والمهام المملوكة فقط للموظف؛ يدعم `search` و`status` و`assignedToUserId` للمسؤول |
| `GET` | `/api/tasks/{id}` | Authenticated | تفاصيل مهمة مع تطبيق ownership |
| `POST` | `/api/tasks` | Admin | إنشاء مهمة وإسنادها لموظف Active |
| `PUT` | `/api/tasks/{id}` | Admin | تعديل المهمة وإعادة إسنادها |
| `DELETE` | `/api/tasks/{id}` | Admin | حذف مهمة |
| `PATCH` | `/api/tasks/{id}/status` | Authenticated | تغيير الحالة وفق الدور والملكية |
| `GET` | `/api/notifications` | Authenticated | إشعارات المستخدم الحالي فقط |
| `PATCH` | `/api/notifications/{id}/read` | Authenticated | تعليم إشعار المستخدم الحالي كمقروء |
| `GET` | `/health` | Public | فحص حياة Backend |

## Tests

تشغيل اختبارات Backend من root:

```powershell
dotnet test taskManagmentCofc.slnx
```

تشغيل اختبارات Angular الفعلية دون watch وباستخدام Chrome Headless:

```powershell
npm --prefix taskmanagmentcofc.client run test:ci
```

تشغيل build كامل للتحقق:

```powershell
dotnet build taskManagmentCofc.slnx --configuration Release
npm --prefix taskmanagmentcofc.client run build -- --configuration production
```

## Docker

يوفر Docker مسار تشغيل إضافيًا ولا يستبدل تشغيل Visual Studio وSpaProxy. يتكون Compose من:

- SQL Server 2022 Express مع persistent volume وhealth check.
- ASP.NET Core 10 Backend مع تطبيق migrations عند بدء الحاوية.
- Angular production build يُخدم بواسطة nginx مع SPA fallback وتمرير `/api` إلى Backend.

أنشئ ملف `.env` محليًا من القالب ثم اضبط `MSSQL_SA_PASSWORD` و`Jwt__Key` على الأقل. لا تضع الملف أو الأسرار في source control:

```powershell
Copy-Item .env.example .env
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
```

تتوفر الواجهة افتراضيًا على:

`http://localhost:8080`

يمكن تغيير المنفذ عبر `FRONTEND_PORT`. قاعدة SQL Server غير منشورة للمضيف، ويتصل بها Backend عبر شبكة Compose الداخلية. يحتفظ الأمر التالي بالبيانات داخل volume:

```powershell
docker compose down
```

استخدام `docker compose down --volumes` يحذف قاعدة بيانات Docker المخزنة، لذلك لا يُستخدم إذا كانت البيانات مطلوبة.
