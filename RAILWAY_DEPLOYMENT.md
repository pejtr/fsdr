# FEMSIDER Railway Deployment Guide

**Status:** Ready for Railway deployment | **Agent:** Claude Code (next phase)

---

## 🚀 Quick Start: Deploy to Railway

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository access
- Stripe sandbox claimed (https://dashboard.stripe.com/claim_sandbox/...)
- SendGrid API key (optional, for Phase 2 email marketing)

### Step 1: Connect GitHub to Railway
```bash
# Push code to GitHub (if not already done)
cd /home/ubuntu/femsider
git remote add github https://github.com/YOUR_USERNAME/femsider.git
git push github main

# In Railway UI:
# 1. Click "New Project"
# 2. Select "GitHub" → authorize → select femsider repo
# 3. Railway auto-detects Node.js project
```

### Step 2: Configure Environment Variables
In Railway UI → Project Settings → Variables:

```
# Database (Railway MySQL plugin)
DATABASE_URL=mysql://user:pass@host:port/femsider

# OAuth (Manus)
VITE_APP_ID=<from Manus dashboard>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
JWT_SECRET=<generate random 32-char string>

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid - Phase 2)
SENDGRID_API_KEY=SG.xxx

# Manus APIs (built-in)
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=<from Manus>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=<from Manus>

# Owner info
OWNER_NAME=Petr MATĚJ
OWNER_OPEN_ID=hJ9eWb7vHTHPgxmHUxEEfg

# App config
VITE_APP_TITLE=FEMSIDER
VITE_APP_LOGO=https://cdn.femsider.com/logo.png
VITE_ANALYTICS_ENDPOINT=https://analytics.railway.app
VITE_ANALYTICS_WEBSITE_ID=femsider
```

### Step 3: Add MySQL Database Plugin
```
Railway UI → Project → Add → MySQL
→ Railway auto-creates DATABASE_URL
→ Copy to environment variables
```

### Step 4: Configure Build & Start Commands
```
# Build command
pnpm install && pnpm build

# Start command
node dist/server/index.js

# Port: 3000 (Railway auto-exposes)
```

### Step 5: Deploy
```
Railway UI → Deploy
→ Watch logs for errors
→ Once deployed, get public URL: https://femsider-prod.railway.app
```

### Step 6: Update OAuth Redirect URIs
In Manus OAuth dashboard:
```
Redirect URIs:
- https://femsider-prod.railway.app/api/oauth/callback
- https://femsider.com/api/oauth/callback (custom domain)
```

---

## 🔧 Railway-Specific Configuration

### Database Backups
```
Railway UI → MySQL Plugin → Backups
→ Enable daily backups (automatic)
```

### Monitoring & Logs
```
Railway UI → Deployments → View Logs
→ Real-time logs for debugging
→ Error tracking (integrate Sentry later)
```

### Custom Domain
```
Railway UI → Project Settings → Domains
→ Add custom domain: femsider.com
→ Update DNS records (CNAME to Railway)
```

### Scaling
```
Railway UI → Project Settings → Plan
→ Start: Hobby tier ($5/month)
→ Scale to Pro ($12/month) if needed
→ Auto-scaling available
```

---

## 📋 Pre-Deployment Checklist

- [ ] All code committed to GitHub
- [ ] `pnpm test` passes (227 tests)
- [ ] `pnpm build` completes without errors
- [ ] Environment variables configured in Railway
- [ ] MySQL database created and migrated (`pnpm db:push`)
- [ ] Stripe sandbox claimed and webhook configured
- [ ] OAuth redirect URIs updated in Manus dashboard
- [ ] Custom domain DNS records configured (if using femsider.com)
- [ ] Monitoring/alerting configured (Sentry optional)

---

## 🛠️ Post-Deployment Tasks

### 1. Verify Deployment
```bash
# Test API
curl https://femsider-prod.railway.app/api/health

# Test OAuth flow
# Open https://femsider-prod.railway.app
# Click "Sign In" → should redirect to Manus OAuth
```

### 2. Test Payment Flow
```
Stripe test card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

### 3. Configure Stripe Webhooks
```
Stripe Dashboard → Webhooks
→ Add endpoint: https://femsider-prod.railway.app/api/stripe-webhook
→ Events: checkout.session.completed, customer.subscription.updated
→ Copy webhook secret to STRIPE_WEBHOOK_SECRET
```

### 4. Test Email (SendGrid - Phase 2)
```
Once SendGrid configured:
- Send test welcome email
- Verify delivery and formatting
- Check bounce/spam rates
```

### 5. Monitor Logs
```
Railway UI → Deployments → Logs
→ Watch for errors in first 24 hours
→ Set up alerts for critical errors
```

---

## 🚨 Common Issues & Solutions

### Issue: "DATABASE_URL not found"
**Solution:** Add MySQL plugin in Railway, copy auto-generated DATABASE_URL to variables

### Issue: "OAuth redirect_uri mismatch"
**Solution:** Update redirect URIs in Manus dashboard to match Railway URL

### Issue: "Stripe webhook not working"
**Solution:** 
1. Verify webhook secret in environment variables
2. Check Stripe dashboard for failed webhook attempts
3. Ensure endpoint is publicly accessible (not localhost)

### Issue: "Out of memory / OOM killed"
**Solution:**
1. Upgrade Railway plan
2. Optimize database queries (add indexes)
3. Reduce concurrent connections

### Issue: "Slow response times"
**Solution:**
1. Enable Railway caching
2. Add CDN for static assets (Cloudflare)
3. Optimize database queries
4. Consider database read replicas

---

## 📊 Monitoring & Performance

### Key Metrics to Track
- **Response time:** Target <200ms
- **Error rate:** Target <0.1%
- **Database connections:** Monitor pool usage
- **Memory usage:** Alert if >80%
- **CPU usage:** Alert if >70%

### Recommended Tools
- **Error tracking:** Sentry (free tier)
- **Performance:** Railway built-in monitoring
- **Uptime:** UptimeRobot (free)
- **Analytics:** Manus built-in analytics

---

## 🔐 Security Checklist

- [ ] All secrets in environment variables (never in code)
- [ ] HTTPS enabled (Railway auto-provides)
- [ ] Database backups enabled
- [ ] Rate limiting configured (optional)
- [ ] CORS properly configured
- [ ] SQL injection prevention (Drizzle ORM handles this)
- [ ] XSS protection enabled (React + Tailwind)
- [ ] CSRF tokens on forms (tRPC handles this)

---

## 📈 Next Phase: Claude Code Tasks

### Phase 2: SendGrid Email Marketing
- [ ] Install SendGrid npm package
- [ ] Configure SENDGRID_API_KEY
- [ ] Implement email templates (welcome, upsell, win-back)
- [ ] Set up email sequences (Day 0, Day 3, Day 7)
- [ ] Test email delivery

### Phase 3: AI Channel Builder
- [ ] Multi-language video generation (20+ languages)
- [ ] Niche-specific templates (30+ niches)
- [ ] YouTube Shorts auto-generator
- [ ] AI script generator with retention frameworks

### Phase 4: Competitor Features
- [ ] Fan CRM (Supercreator)
- [ ] AI chat automation (ChatPersona)
- [ ] Team management (OnlyMonster)
- [ ] Advanced analytics (Supercreator)

### Phase 5: Web Game Integration
- [ ] WebGL game development (Three.js)
- [ ] In-game currency system
- [ ] Leaderboard with cash prizes
- [ ] Daily quests and affiliate rewards

---

## 📞 Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Stripe Docs:** https://stripe.com/docs
- **tRPC Docs:** https://trpc.io/docs
- **React Docs:** https://react.dev

---

## 🎯 Success Metrics (Post-Launch)

- **Uptime:** 99.9%
- **Response time:** <200ms (p95)
- **Error rate:** <0.1%
- **Conversion rate:** >3% (landing → signup)
- **LTV:CAC ratio:** >9:1 (888%+ ROI)
- **Churn rate:** <5% monthly
- **Affiliate conversion:** 3-5%

---

**Prepared by:** Manus AI Agent  
**Date:** May 27, 2026  
**Status:** Ready for Claude Code handoff  
**Next Agent:** Claude Code (Phase 2+)
