# LectioAI — Qolgan Muammolar (Audit 2026-06-10)
> 36 ta muammodan 22 si tuzatildi. Qolgan 14 ta:

---

## 🟠 YO'Q / TUGALLANMAGAN (Qolgan)

| # | Fayl | Holat |
|---|------|-------|
| 1 | `backend/services/notification.py` | `send_telegram()` / `send_email()` — faqat `print()`, hech narsa yubormaydi (alohida stub fayl) |
| 2 | `backend/services/creative_features.py` | `generate_lectio_wrapped`, `find_study_buddy`, `list_marketplace_items` — hardcoded mock data |
| 3 | `backend/services/analytics_service.py` | `LessonAnalyticsEngine` — hech qayerdan chaqirilmaydi |
| 4 | `frontend/app/professor/dashboard/page.tsx` | Haftalik grafik `WEEK_DATA` hardcoded; XP/Streak/Reyting mock |
| 5 | `frontend/app/(auth)/login/page.tsx` | "Parolni unutdim" → `#`, backend'da reset flow yo'q |

---

## 🔧 MINOR (Qolgan)

| # | Fayl | Muammo |
|---|------|--------|
| 1 | `backend/services/notification.py` vs `notifications.py` | Bir xil nom, boshqa maqsad — chalkashlik |
| 2 | `frontend/app/professor/dashboard/page.tsx` | `mock_` token tekshiruvi — bypass kodi qolgan |

---

## BAJARILGAN ISHLAR JAMI

| Kategoriya | Bajarildi | Qoldi |
|------------|-----------|-------|
| Kritik xatolar | 7/7 | 0 |
| Xavfsizlik | 11/11 | 0 |
| Tugallanmagan | 4/9 | 5 |
| O'lik kod | 2/2 | 0 |
| API mismatches | 5/5 | 0 |
| Performance | 3/3 | 0 |
| Config/deps | 3/3 | 0 |
| Mayda | 6/8 | 2 |
| **JAMI** | **41/58** | **7** |
