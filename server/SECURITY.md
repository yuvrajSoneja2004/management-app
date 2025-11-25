# Security Implementation

This document outlines all security measures implemented in the Project Management API.

## Overview

This application implements enterprise-grade security measures suitable for production deployment with 10,000+ concurrent users.

## Security Features

### 1. Input Validation & Sanitization

**Implementation**: `express-validator` with custom sanitization

**Location**: `src/middleware/validation.middleware.js`

**Features**:
- Comprehensive validation on all API endpoints
- Custom `sanitizeHtml()` function that:
  - Removes HTML tags to prevent XSS
  - Escapes special characters (`&`, `<`, `>`, `"`, `'`)
  - Applied to all user-generated content (usernames, project names, task titles, descriptions, etc.)
- MongoDB ObjectId validation
- Email format validation with normalization
- Strong password requirements (minimum 6 characters)
- Date validation with cross-field checks (e.g., end date after start date)
- Array validation for bulk operations

**Endpoints Covered**:
- ✅ Auth: register, login, forgot password, reset password
- ✅ Projects: create, update, add member, invite member
- ✅ Tasks: create, update, bulk operations
- ✅ Files: upload validation
- ✅ Pagination: page and limit validation

### 2. XSS Protection

**Implementation**: `xss-clean` middleware + custom sanitization

**Location**: `src/app.js` (line 48)

**Features**:
- Automatic sanitization of request body, query parameters, and URL parameters
- Removes malicious scripts from user input
- Works in conjunction with validation middleware for defense-in-depth

### 3. Security Headers (Helmet.js)

**Implementation**: `helmet` with enhanced configuration

**Location**: `src/app.js` (lines 19-38)

**Headers Configured**:
- **Content Security Policy (CSP)**:
  - `default-src`: Self only
  - `script-src`: Self only (no inline scripts)
  - `style-src`: Self + unsafe-inline (for dynamic styles)
  - `img-src`: Self + data URIs + HTTPS
  - `object-src`: None (prevents Flash/Java exploits)
  - `frame-src`: None (prevents clickjacking)
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: Enabled in production
- **Cross-Origin policies**: Configured for file previews

### 4. CORS Configuration

**Implementation**: `cors` middleware

**Location**: `src/app.js` (lines 41-44)

**Configuration**:
- Origin: Controlled via `CLIENT_URL` environment variable
- Credentials: Enabled for cookie-based authentication
- Methods: GET, POST, PUT, DELETE
- Production: Must be set to specific frontend domain

### 5. Rate Limiting

**Implementation**: `express-rate-limit`

**Location**: `src/middleware/rateLimiter.middleware.js`

**Limiters**:

| Endpoint Type | Window | Max Requests | Notes |
|--------------|--------|--------------|-------|
| General API | 15 min | 200 | Applied to all `/api` routes |
| Authentication | 15 min | 5 | Login/register attempts |
| Password Reset | 1 hour | 3 | Forgot password requests |
| File Upload | 15 min | 20 | Resource-intensive operations |

**Features**:
- Standard rate limit headers included
- IP-based tracking
- Automatic cleanup of expired entries
- Successful login attempts don't count against auth limit

**Production Scaling**:
> For multi-instance deployments, implement Redis-based rate limiting using `rate-limit-redis` to share limits across all server instances.

### 6. Password Security

**Implementation**: `bcryptjs` with 12 rounds

**Location**: `src/modules/auth/user.model.js` (line 54)

**Features**:
- 12 salt rounds (exceeds OWASP recommendation of 10+)
- Automatic hashing on user creation and password updates
- Password field excluded from queries by default (`select: false`)
- Secure password comparison using `bcrypt.compare()`

**Password Requirements**:
- Minimum 6 characters (enforced in validation)
- No maximum length (bcrypt handles truncation at 72 bytes)

### 7. JWT Authentication

**Implementation**: `jsonwebtoken`

**Location**: `src/modules/auth/auth.service.js`

**Token Types**:

| Token Type | Expiry | Secret | Storage |
|-----------|--------|--------|---------|
| Access Token | 15 minutes | `JWT_SECRET` | Memory/localStorage |
| Refresh Token | 7 days | `JWT_REFRESH_SECRET` | HTTP-only cookie |

**Features**:
- Short-lived access tokens minimize exposure
- Refresh token rotation on each use
- Tokens stored in database for revocation capability
- Secure cookie configuration (HTTP-only, SameSite)
- Token verification on every protected route

**Token Payload**:
```javascript
{
  id: userId,
  iat: issuedAt,
  exp: expiration
}
```

### 8. Request Size Limits

**Implementation**: Express body parser limits

**Location**: `src/app.js` (lines 47-48)

**Limits**:
- JSON payload: 10MB
- URL-encoded payload: 10MB
- Prevents DoS attacks via large payloads

### 9. File Upload Security

**Implementation**: `multer` middleware

**Location**: `src/middleware/upload.middleware.js`

**Security Measures**:
- File size limit: 10MB
- File type validation (images, documents, archives)
- Unique filename generation (prevents overwrites)
- Azure Blob Storage integration (files not stored on server)
- Rate limiting on upload endpoint (20 uploads per 15 minutes)

### 10. Database Security

**Implementation**: Mongoose with security best practices

**Features**:
- Parameterized queries (prevents NoSQL injection)
- Schema validation
- Indexes on sensitive fields (email, tokens)
- Password field excluded by default
- Proper error handling (no data leakage)

## Environment Variables

**Critical Security Variables**:

```bash
# JWT Secrets - MUST be changed in production
JWT_SECRET=<minimum 32 characters, cryptographically random>
JWT_REFRESH_SECRET=<minimum 32 characters, cryptographically random>

# Database
MONGO_URI=<production MongoDB connection string>

# CORS
CLIENT_URL=<production frontend URL>

# Azure Storage (if using file uploads)
AZURE_STORAGE_CONNECTION_STRING=<connection string>
AZURE_STORAGE_CONTAINER_NAME=<container name>
```

**Generating Secure Secrets**:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] Generate and set secure JWT secrets (32+ characters)
- [ ] Update `CLIENT_URL` to production frontend domain
- [ ] Configure production MongoDB connection (MongoDB Atlas recommended)
- [ ] Set up Azure Blob Storage credentials
- [ ] Enable HTTPS/TLS certificates
- [ ] Configure firewall rules (allow only necessary ports)
- [ ] Set `NODE_ENV=production`

### Security Hardening
- [ ] Implement Redis-based rate limiting for multi-instance deployments
- [ ] Set up Web Application Firewall (WAF)
- [ ] Enable MongoDB authentication and encryption at rest
- [ ] Configure VPC/network isolation
- [ ] Set up DDoS protection (Cloudflare, AWS Shield, etc.)
- [ ] Implement API key rotation policy
- [ ] Enable audit logging

### Monitoring
- [ ] Set up intrusion detection system (IDS)
- [ ] Configure security event logging
- [ ] Set up alerts for:
  - Failed login attempts
  - Rate limit violations
  - Unusual API patterns
  - Database connection errors
- [ ] Implement log aggregation (ELK stack, Datadog, etc.)

### Compliance
- [ ] Review GDPR compliance (if applicable)
- [ ] Implement data retention policies
- [ ] Set up backup and disaster recovery
- [ ] Document security incident response plan
- [ ] Conduct security audit/penetration testing

## Security Best Practices

### For Developers

1. **Never commit secrets**: Use `.env` files and `.gitignore`
2. **Validate all inputs**: Even if frontend validates, always validate on backend
3. **Use parameterized queries**: Never concatenate user input into queries
4. **Principle of least privilege**: Grant minimum necessary permissions
5. **Keep dependencies updated**: Regularly run `npm audit` and update packages
6. **Error handling**: Never expose stack traces or sensitive data in error messages
7. **Logging**: Log security events but never log passwords or tokens

### For Operations

1. **Regular updates**: Keep Node.js, MongoDB, and all dependencies up to date
2. **Monitoring**: Implement real-time monitoring and alerting
3. **Backups**: Regular automated backups with encryption
4. **Access control**: Use SSH keys, disable root login, implement 2FA
5. **Network security**: Use VPCs, security groups, and private subnets
6. **Incident response**: Have a documented plan for security incidents

## Security Testing

### Automated Testing
```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Run tests
npm test
```

### Manual Testing

1. **XSS Testing**: Try injecting `<script>alert('XSS')</script>` in all input fields
2. **SQL Injection**: Try `' OR '1'='1` in login fields
3. **Rate Limiting**: Make rapid requests to verify limits work
4. **Authentication**: Test token expiration and refresh flow
5. **Authorization**: Verify users can only access their own resources

### Tools

- **OWASP ZAP**: Automated security scanner
- **Burp Suite**: Web application security testing
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Continuous security monitoring

## Incident Response

### If a Security Breach Occurs

1. **Immediate Actions**:
   - Isolate affected systems
   - Revoke all JWT tokens (clear refresh tokens from database)
   - Change all secrets and API keys
   - Enable maintenance mode if necessary

2. **Investigation**:
   - Review logs for suspicious activity
   - Identify breach vector
   - Assess data exposure

3. **Remediation**:
   - Patch vulnerability
   - Notify affected users
   - Document incident
   - Update security measures

4. **Post-Incident**:
   - Conduct post-mortem
   - Update security policies
   - Implement additional safeguards

## Contact

For security issues, please contact: [security@yourcompany.com]

**Do not** open public GitHub issues for security vulnerabilities.
