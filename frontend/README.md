# InternetShop Frontend

Nowoczesny frontend React dla platformy e-commerce InternetShop, napisany w TypeScript z użyciem Material-UI.

## 🚀 Funkcje

- **Responsywny design** - działa na wszystkich urządzeniach
- **Material-UI** - nowoczesny i piękny interfejs
- **TypeScript** - typowanie statyczne dla lepszej jakości kodu
- **React Router** - nawigacja między stronami
- **React Query** - zarządzanie stanem i cache'owaniem
- **JWT Authentication** - bezpieczna autoryzacja
- **Koszyk zakupów** - zarządzanie produktami w koszyku
- **Wyszukiwanie i filtrowanie** - zaawansowane opcje wyszukiwania
- **Paginacja** - obsługa dużych list produktów

## 🛠️ Technologie

- **React 18** - biblioteka UI
- **TypeScript** - typowanie statyczne
- **Material-UI (MUI)** - komponenty UI
- **React Router DOM** - routing
- **React Query** - zarządzanie stanem
- **Axios** - komunikacja z API
- **React Scripts** - narzędzia deweloperskie

## 📦 Instalacja

### Wymagania
- Node.js 16+ 
- npm lub yarn
- Backend Django API (uruchomiony na localhost:8000)

### Kroki instalacji

1. **Przejdź do katalogu frontend**
```bash
cd frontend
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Uruchom aplikację w trybie deweloperskim**
```bash
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

## 🔧 Konfiguracja

### Zmienne środowiskowe

Utwórz plik `.env` w katalogu `frontend`:

```env
REACT_APP_API_URL=http://localhost:8000
```

### Proxy

Aplikacja jest skonfigurowana z proxy do backendu Django. Wszystkie zapytania do `/api/*` będą przekierowane na `http://localhost:8000`.

## 📁 Struktura projektu

```
frontend/
├── public/                 # Pliki publiczne
├── src/
│   ├── components/         # Komponenty React
│   │   └── Layout/        # Komponenty layoutu
│   ├── contexts/          # Konteksty React
│   ├── pages/             # Strony aplikacji
│   ├── services/          # Serwisy API
│   ├── types/             # Definicje TypeScript
│   ├── App.tsx           # Główny komponent
│   └── index.tsx         # Punkt wejścia
├── package.json          # Zależności
└── tsconfig.json         # Konfiguracja TypeScript
```

## 🎨 Komponenty

### Layout
- **Header** - nawigacja, wyszukiwanie, koszyk, menu użytkownika
- **Layout** - główny layout aplikacji z Material-UI theme

### Strony
- **Home** - strona główna z polecanymi produktami
- **Products** - lista produktów z filtrowaniem i wyszukiwaniem
- **Login** - formularz logowania
- **Cart** - koszyk zakupów

### Konteksty
- **AuthContext** - zarządzanie autoryzacją użytkownika

## 🔌 API Integration

Frontend komunikuje się z Django API przez serwis `apiService`:

```typescript
// Przykład użycia
import apiService from '../services/api';

// Pobieranie produktów
const products = await apiService.getProducts();

// Logowanie
const auth = await apiService.login({ username, password });
```

## 🚀 Skrypty

```bash
# Uruchomienie w trybie deweloperskim
npm start

# Budowanie dla produkcji
npm run build

# Uruchomienie testów
npm test

# Eject (nie zalecane)
npm run eject
```

## 🔐 Autoryzacja

Aplikacja używa JWT tokenów do autoryzacji:

1. Użytkownik loguje się przez formularz
2. Token jest zapisywany w localStorage
3. Wszystkie kolejne zapytania zawierają token w headerze
4. Token jest automatycznie odświeżany gdy wygasa

## 🛒 Koszyk zakupów

Funkcjonalność koszyka:
- Dodawanie/usuwanie produktów
- Zmiana ilości
- Persystencja w localStorage
- Podsumowanie zamówienia

## 📱 Responsywność

Aplikacja jest w pełni responsywna i używa Material-UI breakpointów:
- **xs**: < 600px (telefony)
- **sm**: 600px - 960px (tablety)
- **md**: 960px - 1280px (desktop)
- **lg**: 1280px+ (duże ekrany)

## 🎯 Funkcje do implementacji

- [ ] Strona szczegółów produktu
- [ ] Rejestracja użytkownika
- [ ] Profil użytkownika
- [ ] Historia zamówień
- [ ] Checkout proces
- [ ] Admin panel
- [ ] Recenzje produktów
- [ ] Wishlist
- [ ] Notyfikacje

## 🐛 Rozwiązywanie problemów

### Problem z CORS
Upewnij się, że backend Django ma skonfigurowane CORS dla `localhost:3000`.

### Problem z proxy
Sprawdź czy backend działa na `localhost:8000` lub zaktualizuj proxy w `package.json`.

### Problem z tokenami
Sprawdź czy format tokenów w API odpowiada oczekiwanemu formatowi JWT.

## 📄 Licencja

MIT License 