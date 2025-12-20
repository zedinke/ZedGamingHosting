# Docker Consolidation Playbook

**Status:** Ready to Execute  
**Target Date:** December 20-21, 2025  
**Expected Downtime:** ~5-10 minutes  
**Rollback Time:** ~10-15 minutes  

---

## Phase 1A: Pre-Migration Backup & Verification

### Step 1: Create Full Database Backup

```bash
# On server
docker exec -i zed-mysql mysqldump -u root -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt \
  --all-databases > /root/backups/mysql_full_backup_2025-12-20.sql

# Verify backup
ls -lh /root/backups/mysql_full_backup_2025-12-20.sql
du -sh /root/backups/
```

### Step 2: Document Current State

```bash
# Check running version
cd /root/ZedGamingHosting-latest
git log --oneline -1
git status

# Check container states
docker ps -a
docker compose logs --tail 20 web api daemon

# Check database
docker exec -i zed-mysql mysql -u root -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt \
  zedhosting -e "SELECT COUNT(*) as total_users FROM User;"
```

### Step 3: Verify All Services Working

```bash
# Check web
curl -s http://localhost:3000 | head -20

# Check API
curl -s http://localhost:3000/api/health || \
docker exec -i zed-api wget -qO- http://127.0.0.1:3000/api/health

# Check database connectivity
docker exec -i zed-mysql mysql -u root -p -e "SELECT 1;"

# Check Redis
docker exec zed-redis redis-cli ping
```

---

## Phase 1B: Upgrade `/opt/zedhosting` to Latest Code

### Step 4: Sync `/opt/zedhosting` with Latest

```bash
# On server
cd /opt/zedhosting

# Check current state
echo "Before:"
git log --oneline -1
git status

# Fetch and merge latest
git fetch origin
git merge origin/main
# OR force to latest (if issues):
# git reset --hard origin/main

# Verify
echo "After:"
git log --oneline -1
ls -la docker-compose.yml
```

### Step 5: Rebuild Containers with Latest Code

```bash
# Rebuild all services (but don't restart yet)
docker compose build --no-cache

# Check for build errors
echo "Build status: $?"
```

### Step 6: Testing (No Downtime Yet)

```bash
# Don't restart yet - test with new images
# But old containers still running

# Verify images exist
docker images | grep zedgaminghosting-latest

# Check image dates
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | grep zedgaminghosting-latest
```

---

## Phase 1C: Execute Cutover (Brief Downtime ~5 min)

### Step 7: Stop Current Containers

```bash
# From /root/ZedGamingHosting-latest or /opt/zedhosting (same docker-compose)
docker compose stop api web daemon traefik

# Verify stopped
docker ps | grep zed-
# Should show only mysql, redis, adminer running
```

### Step 8: Restart with Latest Code

```bash
# Assuming we're in /root/ZedGamingHosting-latest
# Restart with latest images
docker compose up -d --no-deps api web daemon traefik

# Wait for health checks
sleep 15
docker ps | grep "zed-"

# Check health
docker compose ps
```

### Step 9: Verify Services Online

```bash
# Check web
curl -s http://localhost:3000 -I | head -5

# Check API
curl -s http://localhost:3000/api/health

# Check daemon
curl -s http://localhost:3001/api/health

# Check database
docker exec -i zed-mysql mysql -u root -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt \
  zedhosting -e "SELECT COUNT(*) FROM User;"
```

### Completion Record (2025-12-20)

- Canonical services restarted and verified healthy from `/root/ZedGamingHosting-latest`.
- Legacy deployments archived and removed:
  - `/opt/zedhosting` archived to `/root/zedhosting-backup-2025-12-20/opt-zedhosting.tgz`.
  - Incomplete `/root/zedhosting` archived to `/root/zedhosting-backup-2025-12-20/root-zedhosting-incomplete.tgz` and removed.
- Current canonical directories:
  - `/root/ZedGamingHosting-latest` (active)
  - `/root/zedhosting-backup-2025-12-20` (archives)

---

## Phase 2: Post-Migration Cleanup

### Step 10: Verify `/opt/zedhosting` Works (Optional)

If using `/opt/zedhosting` as primary, verify it works:

```bash
cd /opt/zedhosting
git log --oneline -1
docker compose ps
```

If using `/root/ZedGamingHosting-latest` as primary, skip to Step 11.

### Step 11: Archive Old Deployment (30-day retention)

```bash
# Create archive of old location (if consolidating from /opt to /root)
mv /opt/zedhosting /root/zedhosting-backup-2025-12-20

# Verify archived
ls -la /root/zedhosting-backup-2025-12-20/ | head -5

# Cleanup /root/zedhosting if it exists (incomplete setup)
rm -rf /root/zedhosting

# Verify cleanup
ls -la /root/ | grep zed
```

### Step 12: Update Deployment Documentation

```bash
# Document new standard procedure
cat > /root/ZedGamingHosting-latest/DEPLOYMENT_NOTES.txt << 'EOF'
# Production Deployment Notes
# Last Updated: 2025-12-20

## Primary Deployment Location
/root/ZedGamingHosting-latest

## Quick Commands
### Deploy latest
cd /root/ZedGamingHosting-latest
git pull
docker compose up -d --build

### View logs
docker compose logs -f api web daemon

### Restart service
docker compose restart api

### Full rebuild
docker compose up -d --build --no-cache api web daemon

## Database
MySQL container: zed-mysql
Database: zedhosting
User: root (use MYSQL_ROOT_PASSWORD env var)

## Redis
Container: zed-redis
Port: 6379
Auth: REDIS_PASSWORD env var

## Backups
Location: /root/backups/
Full backup: mysql_full_backup_2025-12-20.sql
EOF

chmod 644 /root/ZedGamingHosting-latest/DEPLOYMENT_NOTES.txt
```

---

## Phase 3: Establish `/root/ZedGamingHosting-latest` as Canonical

### Step 13: Update All References

```bash
# Make sure deployment scripts point to correct location
grep -r "/opt/zedhosting" /root/ZedGamingHosting-latest/ 2>/dev/null || echo "No references found"

# Update any environment/script references
# (None should exist, but check anyway)
```

### Step 14: Create Deployment Procedures

Create standard procedures in [DEPLOYMENT_PROCEDURES.md](./DEPLOYMENT_PROCEDURES.md):

```markdown
# Deployment Procedures

## Standard Deployment

1. SSH to server: `ssh -i ~/.ssh/zedhosting_server root@116.203.226.140`
2. Navigate: `cd /root/ZedGamingHosting-latest`
3. Update: `git pull`
4. Deploy: `docker compose up -d --build [service]`
5. Verify: `docker compose ps` and check logs

## Quick Start

\`\`\`bash
ssh -i ~/.ssh/zedhosting_server root@116.203.226.140
cd /root/ZedGamingHosting-latest
git pull
docker compose up -d --no-deps --build web
\`\`\`

## Emergency Rollback

\`\`\`bash
cd /root/ZedGamingHosting-latest
git log --oneline -20  # Find previous commit
git revert <commit-hash>
docker compose rebuild api
docker compose restart api
\`\`\`

## Database Restore

\`\`\`bash
docker exec -i zed-mysql mysql -u root -p < /root/backups/mysql_full_backup_2025-12-20.sql
\`\`\`
```

---

## Rollback Procedures

### If Services Don't Start

```bash
# Check logs
docker compose logs api
docker compose logs web
docker compose logs daemon

# Rollback code
cd /root/ZedGamingHosting-latest
git revert HEAD
git push

# Rebuild
docker compose build --no-cache api
docker compose up -d api
```

### If Database Issues

```bash
# Check database
docker exec -i zed-mysql mysql -u root -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt -e "SELECT 1;"

# Restore from backup
docker exec -i zed-mysql mysql -u root -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt \
  < /root/backups/mysql_full_backup_2025-12-20.sql

# Verify
docker exec -i zed-mysql mysql -u root -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt \
  zedhosting -e "SELECT COUNT(*) FROM User;"
```

### If Complete Disaster

```bash
# Restore /opt/zedhosting from backup
mv /root/zedhosting-backup-2025-12-20 /opt/zedhosting

# Restart from old location
cd /opt/zedhosting
docker compose restart

# Restore database if needed
docker exec -i zed-mysql mysql -u root -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt \
  < /root/backups/mysql_full_backup_2025-12-20.sql
```

---

## Success Criteria

- [ ] All 7 containers running and healthy
- [ ] Web app responsive (http://116.203.226.140)
- [ ] API responding (/api/health)
- [ ] Daemon responsive (port 3001)
- [ ] Database has all data
- [ ] Email notifications working
- [ ] Payment gateway working
- [ ] Server provisioning working
- [ ] Support tickets accessible
- [ ] Admin dashboard accessible
- [ ] No error logs in past 5 minutes
- [ ] Response times normal (< 1 second for API calls)

---

## Validation Script

```bash
#!/bin/bash
# consolidation-validation.sh

echo "=== Consolidation Validation ==="
echo ""

echo "1. Checking containers..."
docker ps -a | grep "zed-" || echo "❌ No containers found"

echo ""
echo "2. Checking git..."
cd /root/ZedGamingHosting-latest
echo "Latest commit: $(git log --oneline -1)"
echo "Status: $(git status -s | wc -l) changes"

echo ""
echo "3. Checking web..."
curl -s http://localhost:3000 -I | head -1 || echo "❌ Web not responding"

echo ""
echo "4. Checking API..."
curl -s http://localhost:3000/api/health || echo "❌ API not responding"

echo ""
echo "5. Checking database..."
docker exec -i zed-mysql mysql -u root -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt \
  zedhosting -e "SELECT 'Database OK' as status;" || echo "❌ Database error"

echo ""
echo "6. Checking directories..."
ls -la /root/ | grep -i zed
echo ""
ls -la /opt/ 2>/dev/null | grep -i zed || echo "No /opt/zed* (OK if consolidated to /root)"

echo ""
echo "=== Validation Complete ==="
```

---

## Execution Checklist

**Before Consolidation:**
- [ ] Read this entire playbook
- [ ] Understand rollback procedures
- [ ] Create database backup
- [ ] Notify team of maintenance window
- [ ] Schedule downtime (5-10 minutes)
- [ ] Have rollback plan ready

**During Consolidation:**
- [ ] Execute Phase 1A (backup & verify)
- [ ] Execute Phase 1B (upgrade code)
- [ ] Execute Phase 1C (cutover)
- [ ] Execute Phase 2 (cleanup)
- [ ] Execute Phase 3 (establish canonical)

**After Consolidation:**
- [ ] Run validation script
- [ ] Test all critical features
- [ ] Check logs for errors
- [ ] Monitor for 24 hours
- [ ] Update team documentation
- [ ] Plan next phases (monitoring, logging)

---

## Timeline

| Phase | Duration | Downtime | Risk |
|-------|----------|----------|------|
| 1A: Backup | ~10 min | None | Low |
| 1B: Upgrade | ~5 min | None | Low |
| 1C: Cutover | ~5 min | Yes (5-10 min) | Medium |
| 2: Cleanup | ~5 min | None | Low |
| 3: Establish | ~5 min | None | Low |
| **Total** | **~30 min** | **5-10 min** | **Medium** |

---

## Questions Before Proceeding?

1. Is `/opt/zedhosting` actually being used or is it just a backup?
2. Should we consolidate to `/root/ZedGamingHosting-latest` or create a new location?
3. How long is acceptable downtime?
4. Do we need to keep `/opt/zedhosting` for 30 days after consolidation?
5. Who needs to be notified before we execute?

