# Security Guidelines

## Environment Variables

All sensitive data must be stored in environment variables, NOT in source code.

### Backend Environment Variables

Key environment variables required for the backend:

```env
# Django Core
SECRET_KEY=<generate-new-key>
DEBUG=False (in production)

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=database_name
DB_HOST=db_host
DB_PORT=5432
DB_USER=db_user
DB_PASSWORD=<strong-password>

# Stripe API (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_PUBLIC_KEY_TEST=pk_test_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...

# Redis/Celery
CELERY_BROKER_URL=redis://host:port/0
CELERY_RESULT_BACKEND=redis://host:port/0

# Email (for production)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=<app-password>
EMAIL_PORT=587

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend Environment Variables

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

## Setup Instructions

### 1. Never Commit Secrets

Add to `.gitignore`:
```
.env
.env.local
MyShop/.env
frontend/.env
```

### 2. Use Environment-Specific Configurations

For development:
```bash
cp .env.example .env.development
# Edit .env.development with local settings
```

For production:
```bash
cp .env.example .env.production
# Edit .env.production with production settings
export ENV=production
```

### 3. Generate Secure Secrets

#### Django SECRET_KEY
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

#### PostgreSQL Password
```bash
openssl rand -base64 32
```

### 4. Database Security

- Use strong, unique passwords for database users
- Restrict database access to authorized hosts only
- Use SSL connections for remote databases
- Regularly backup your database
- Rotate database credentials periodically

### 5. API Keys & Tokens

- Store all API keys in environment variables
- Use separate keys for development and production
- Rotate keys regularly
- Revoke compromised keys immediately
- Never share keys in code reviews or documentation

### 6. Production Deployment Checklist

- [ ] Set `DEBUG=False`
- [ ] Generate new `SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` with your domain
- [ ] Use HTTPS only
- [ ] Configure CSRF and CORS properly
- [ ] Use strong database credentials
- [ ] Set up SSL certificates
- [ ] Enable security headers
- [ ] Configure logging and monitoring
- [ ] Set up backup procedures
- [ ] Document all environment variables

### 7. Common Security Headers

Add to your production web server configuration:

```nginx
# Nginx example
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "DENY";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'";
```

### 8. Stripe Security

- Use webhook secrets to verify requests
- Rotate webhook secrets periodically
- Keep Stripe libraries updated
- Test in sandbox before production
- Monitor Stripe dashboard for suspicious activity
- Use restricted API keys with limited scopes

### 9. Redis Security

- Set a strong password for Redis
- Use SSL/TLS for connections
- Restrict access to authorized networks
- Monitor Redis for unusual activity
- Keep Redis updated

### 10. Regular Security Practices

- Keep dependencies updated: `pip install --upgrade -r requirements.txt`
- Use security scanning tools: `safety check`
- Monitor for vulnerabilities
- Review logs regularly
- Test password strength requirements
- Implement rate limiting
- Use security headers
- Regular security audits

## Incident Response

If a secret is accidentally exposed:

1. **Immediately revoke** the compromised credential
2. **Generate a new** secret
3. **Rotate credentials** in all environments
4. **Review logs** for unauthorized access
5. **Update environment variables**
6. **Restart services** to apply changes
7. **Monitor closely** for suspicious activity

## Resources

- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stripe Security](https://stripe.com/docs/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-security.html)

## Support

For security issues, please contact the development team directly.
Do not open public issues for security vulnerabilities.
