# InternetShop - Setup Instructions

Kompletne instrukcje instalacji i uruchomienia projektu InternetShop (Django API + React Frontend).

## 🚀 Szybki Start

### 1. Backend (Django API)

```bash
# 1. Utwórz wirtualne środowisko
python -m venv venv

# 2. Aktywuj środowisko
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Zainstaluj zależności
pip install -r requirements.txt

# 4. Uruchom migracje
python manage.py migrate

# 5. Utwórz superużytkownika
python manage.py createsuperuser

# 6. (Opcjonalnie) Zasiej bazę danych
python manage.py seed_db

# 7. Uruchom serwer Redis (w nowym terminalu)
redis-server

# 8. Uruchom Celery worker (w nowym terminalu)
celery -A MyShop worker -l info

# 9. Uruchom Celery beat (w nowym terminalu)
celery -A MyShop beat -l info

# 10. Uruchom serwer Django
python manage.py runserver
```

Backend będzie dostępny pod adresem: `http://localhost:8000`

### 2. Frontend (React)

```bash
# 1. Przejdź do katalogu frontend
cd frontend

# 2. Zainstaluj zależności
npm install

# 3. Uruchom aplikację
npm start
```

Frontend będzie dostępny pod adresem: `http://localhost:3000`

## 📋 Szczegółowe Instrukcje

### Wymagania Systemowe

- **Python 3.8+**
- **Node.js 16+**
- **Redis Server**
- **PostgreSQL** (opcjonalnie, SQLite dla development)

### Backend Setup

#### 1. Środowisko Python

```bash
# Utwórz wirtualne środowisko
python -m venv venv

# Aktywuj środowisko
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

#### 2. Zależności

```bash
# Zainstaluj wszystkie zależności
pip install -r requirements.txt
```

#### 3. Konfiguracja Bazy Danych

```bash
# Uruchom migracje
python manage.py migrate

# Utwórz superużytkownika
python manage.py createsuperuser
```

#### 4. Dane Testowe

```bash
# Zasiej bazę danych przykładowymi danymi
python manage.py seed_db
```

#### 5. Redis i Celery

```bash
# Uruchom Redis (w nowym terminalu)
redis-server

# Uruchom Celery worker (w nowym terminalu)
celery -A MyShop worker -l info

# Uruchom Celery beat dla zadań cyklicznych (w nowym terminalu)
celery -A MyShop beat -l info
```

#### 6. Serwer Django

```bash
# Uruchom serwer deweloperski
python manage.py runserver
```

### Frontend Setup

#### 1. Zależności Node.js

```bash
# Przejdź do katalogu frontend
cd frontend

# Zainstaluj zależności
npm install
```

#### 2. Konfiguracja

Utwórz plik `.env` w katalogu `frontend`:

```env
REACT_APP_API_URL=http://localhost:8000
```

#### 3. Uruchomienie

```bash
# Uruchom aplikację w trybie deweloperskim
npm start
```

## 🔧 Konfiguracja Środowiska

### Zmienne Środowiskowe

Utwórz plik `.env` w głównym katalogu projektu:

```env
# Django
DJANGO_SETTINGS_MODULE=MyShop.settings.dev
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database
DATABASE_URL=sqlite:///db.sqlite3

# Redis
REDIS_URL=redis://localhost:6379

# Email
EMAIL_HOST=localhost
EMAIL_PORT=2525
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

### CORS Configuration

Upewnij się, że Django ma skonfigurowane CORS dla frontendu:

```python
# W MyShop/settings/common.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
```

## 🧪 Testowanie

### Backend Tests

```bash
# Uruchom testy Django
python manage.py test

# Lub z pytest
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Load Testing

```bash
# Uruchom testy obciążeniowe z Locust
locust -f locustfiles/browse_products.py
```

## 📊 Monitoring

### Silk Profiler (Development)

Dostępny pod adresem: `http://localhost:8000/silk/`

### Flower (Celery Monitoring)

Dostępny pod adresem: `http://localhost:5555`

## 🐛 Rozwiązywanie Problemów

### Problem z CORS

Jeśli widzisz błędy CORS w konsoli przeglądarki:

1. Sprawdź czy backend działa na `localhost:8000`
2. Upewnij się, że CORS jest skonfigurowane w Django
3. Sprawdź czy frontend działa na `localhost:3000`

### Problem z Redis

Jeśli Celery nie może połączyć się z Redis:

1. Sprawdź czy Redis jest uruchomiony: `redis-cli ping`
2. Sprawdź konfigurację Redis w Django settings
3. Upewnij się, że Redis działa na porcie 6379

### Problem z Tokenami JWT

Jeśli masz problemy z autoryzacją:

1. Sprawdź czy format tokenów jest poprawny
2. Sprawdź czy tokeny są zapisywane w localStorage
3. Sprawdź czy interceptor Axios jest poprawnie skonfigurowany

### Problem z Proxy

Jeśli frontend nie może połączyć się z API:

1. Sprawdź czy proxy jest skonfigurowane w `package.json`
2. Sprawdź czy backend działa
3. Sprawdź czy nie ma konfliktów portów

## 🚀 Deployment

### Backend (Production)

```bash
# Ustaw zmienne środowiskowe
export DJANGO_SETTINGS_MODULE=MyShop.settings.prod
export SECRET_KEY=your-production-secret-key
export DATABASE_URL=postgresql://user:pass@host:port/db

# Zbierz pliki statyczne
python manage.py collectstatic

# Uruchom z Gunicorn
gunicorn MyShop.wsgi:application
```

### Frontend (Production)

```bash
cd frontend

# Zbuduj aplikację
npm run build

# Serwuj pliki statyczne
npx serve -s build
```

## 📞 Wsparcie

Jeśli napotkasz problemy:

1. Sprawdź logi w konsoli
2. Sprawdź dokumentację Django i React
3. Otwórz issue w repozytorium projektu

## 📄 Licencja

MIT License 