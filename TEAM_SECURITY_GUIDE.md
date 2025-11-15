# 🔐 Instrukcja Bezpieczeństwa dla Zespołu

## ⚠️ NIGDY nie wgrywaj danych wrażliwych na GitHub!

Wrażliwe dane to:
- `PASSWORD` - hasła do bazy danych
- `SECRET_KEY` - klucz Django
- `STRIPE_*` - klucze API Stripe
- `API_KEYS` - wszelkie klucze API
- Tokeny dostępu
- Połączenia do baz danych

## 🚀 Pierwsze uruchomienie projektu

### 1. Clone'uj repozytorium
```bash
git clone https://github.com/vteeev/InernetShop.git
cd InernetShop
```

### 2. Stwórz plik `.env` z szablonu
```bash
# Backend
cp .env.example MyShop/.env

# Frontend
cd frontend
cp .env.example .env
cd ..
```

### 3. Edytuj `.env` ze swoimi danymi
```bash
# MyShop/.env
nano MyShop/.env
# Zmień: SECRET_KEY, DB_PASSWORD, STRIPE_KEYS itd.

# frontend/.env
nano frontend/.env
# Ustaw REACT_APP_API_URL jeśli potrzeba
```

### 4. Wymuś Git aby nie śledzić `.env`
```bash
git update-index --assume-unchanged MyShop/.env frontend/.env
```

## ✅ Przed każdym commit

**Git pre-commit hook automatycznie sprawdzi czy nie wgrywasz danych wrażliwych!**

Jeśli hook blokuje commit:
1. ✅ Sprawdź czy nie dodałeś pliku `.env`
2. ✅ Sprawdź czy nie dodałeś haseł lub kluczy w kodzie
3. ✅ Użyj zmiennych środowiskowych zamiast hardkodowanych wartości

## 🔧 Jak użyć zmiennych środowiskowych

### Backend (Django)

```python
# ❌ ZŁE - nigdy tak nie rób!
SECRET_KEY = 'django-insecure-xyz123...'
DB_PASSWORD = 'moje_haslo'

# ✅ DOBRE - zawsze tak rób!
import os
SECRET_KEY = os.getenv('SECRET_KEY')
DB_PASSWORD = os.getenv('DB_PASSWORD')
```

### Frontend (React)

```typescript
// ❌ ZŁE
const API_URL = 'http://localhost:8000';

// ✅ DOBRE
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## 🚨 Co zrobić jeśli wgrałeś dane wrażliwe?

1. **Natychmiast zmień hasła i klucze w systemach produkcyjnych!**
2. Zgłoś to do team ledera
3. Usuń plik z git history:
   ```bash
   bash scripts/cleanup_history.sh
   ```
4. Wgraj zmienione pliki na GitHub
5. Wszystkie zespoły muszą re-clone'ować repo

## 📋 Checklist przed wgraniem na GitHub

- [ ] `.env` jest w `.gitignore`
- [ ] Nie ma `.env` w staged files (`git status`)
- [ ] Brak hardkodowanych haseł w kodzie
- [ ] Brak klucze API w kodzie
- [ ] Brak tokeny dostępu w kodzie
- [ ] Używam zmiennych środowiskowych dla wszystkich danych wrażliwych

## 🔍 Sprawdzenie bezpieczeństwa

```bash
# Sprawdź czy nie masz .env w git
git ls-files | grep .env

# Sprawdź czy nie ma wrażliwych wzorców w ostatnich commitach
git log -p | grep -i "password\|secret\|key\|token"

# Sprawdź staged files
git diff --cached | grep -i "password\|secret\|key"
```

## 📚 Przydatne linki

- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Secrets Management](https://owasp.org/www-community/Secrets_Management)
- [Environment Variables Best Practices](https://12factor.net/config)

## ❓ Pytania?

Skontaktuj się z team liderem lub sprawdź plik `SECURITY.md`.

---

**Pamiętaj: Bezpieczeństwo to odpowiedzialność każdego! 🔒**
