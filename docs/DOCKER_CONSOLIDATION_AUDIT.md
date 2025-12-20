# Docker Environment Consolidation Audit

**Date:** December 20, 2025  
**Status:** Analysis Complete - Ready for Consolidation

## Executive Summary

The system currently has **3 separate deployment locations** with **2 active deployments** running containers. This creates maintenance burden, confusion, and synchronization issues. **Recommendation: Consolidate to single `/root/ZedGamingHosting-latest` deployment.**

---

## Current State Analysis

### 1. Deployment Locations

| Location | Status | Git Version | Docker Containers | Notes |
|----------|--------|-------------|-------------------|-------|
| `/root/ZedGamingHosting-latest` | ✅ **ACTIVE** | 8fe8d0e (latest) | web, api, daemon, mysql, redis, traefik, adminer | Primary deployment - UP TO DATE |
| `/opt/zedhosting` | ✅ **ACTIVE** | 22e0389 (6 commits behind) | Same as above | Legacy location - OUT OF SYNC |
| `/root/zedhosting` | ⚠️ **INACTIVE** | Incomplete repo | None | Partial/incomplete setup |

### 2. Running Containers

All 7 containers are currently running and healthy:

```
zed-mysql      mysql:8.0                   Up 2 days (healthy)
zed-redis      redis:7-alpine              Up 2 days (healthy)
zed-api        zedgaminghosting-latest-api Up 49 minutes
zed-web        zedgaminghosting-latest-web Up 14 minutes (healthy)
zed-daemon     zedgaminghosting-latest-daemon Up 5 hours
zed-traefik    traefik:v3.2                Up 3 hours
zed-adminer    adminer:latest              Up 2 days
```

**Issue:** All containers use same names (`zed-*`), suggesting both `/root/ZedGamingHosting-latest` and `/opt/zedhosting` share the same docker-compose setup or one is not actually running.

### 3. Git Repository Status

**`/root/ZedGamingHosting-latest`** (LATEST):
- Last commit: `8fe8d0e` - feat(i18n): Add update translation keys for HU and EN locales (Dec 20, 2025)
- Status: Clean working tree, up to date with origin/main
- ✅ Has full codebase with all recent features

**`/opt/zedhosting`** (OUTDATED):
- Last commit: `22e0389` - fix(api): Fix TypeScript compilation errors in promotions and auth guards (old)
- Status: 6+ commits behind `/root/ZedGamingHosting-latest`
- ⚠️ Contains untracked files
- ⚠️ Has incomplete codebase (missing recent features)

**`/root/zedhosting`** (INCOMPLETE):
- Partial repository setup
- Only has `apps/` and config files
- ❌ Not suitable for deployment

---

## Issues with Current Setup

1. **Version Mismatch**
   - `/opt/zedhosting` is 6+ commits behind
   - Containers may be running different code versions
   - Risk of inconsistency between web/api/daemon

2. **Maintenance Burden**
   - Two locations to update
   - Confusing which one is primary
   - Double deployment effort

3. **Disk Space Waste**
   - Duplicate repositories
   - Redundant node_modules, .next builds, etc.
   - Multiple Docker images for same code

4. **Deployment Ambiguity**
   - Team might deploy to wrong location
   - No clear "source of truth" for production
   - Risk of accidentally using stale code from `/opt/zedhosting`

5. **Backup/Recovery Confusion**
   - Multiple deployment points to maintain
   - Unclear which is the actual running instance
   - Harder to restore from backups

---

## Recommended Consolidation Plan

### Phase 1A: Preparation (Immediate)
1. ✅ Verify all running containers are working correctly
2. ✅ Document current production data (MySQL, Redis volumes)
3. ✅ Backup database state
4. Create comprehensive deployment documentation

### Phase 1B: Migration (Next Step)
1. Update `/opt/zedhosting` environment to match `/root/ZedGamingHosting-latest`
2. Test all containers with latest code
3. Verify functionality (web, api, daemon, database, payments, etc.)
4. Plan cutover time

### Phase 2: Cleanup
1. Remove redundant `/root/zedhosting` directory
2. Archive `/opt/zedhosting` as backup (keep for 30 days)
3. Establish `/root/ZedGamingHosting-latest` as canonical deployment
4. Document standard deployment procedures

### Phase 3: Infrastructure
1. Set up Prometheus + Grafana monitoring (Phase 2)
2. Implement JSON logging (Phase 3)
3. Add automated deployment scripts
4. Create runbooks for common operations

---

## Directory Structure (Proposed Final State)

```
/root/
  ├── ZedGamingHosting-latest/     # PRIMARY DEPLOYMENT (KEEP)
  │   ├── apps/
  │   ├── libs/
  │   ├── docker-compose.yml
  │   ├── .git/
  │   └── ...
  │
  ├── zedhosting-backup-2025-12-20/  # ARCHIVED BACKUP (optional, 30 days)
  │
  └── [other system files]

/opt/
  └── [reserved for other services if needed]
```

---

## Key Metrics

| Metric | Current | After Consolidation |
|--------|---------|---------------------|
| Deployment locations | 2 (active) + 1 (inactive) | 1 |
| Git repositories | 2 active + 1 incomplete | 1 |
| Disk usage (approx) | ~3GB for repos | ~1.5GB for repo + backup |
| Deployment time | ~5 min (risk of errors) | ~3 min (single source) |
| Maintenance burden | 2 locations | 1 location |

---

## Rollback Plan

If issues arise after migration:

1. **Before Consolidation**
   - Full database backup at `/root/backups/mysql_backup_2025-12-20.sql`
   - Docker volume snapshots preserved
   - `/opt/zedhosting` kept as reference

2. **After Issues**
   - Restore from MySQL backup: `docker exec zed-mysql mysql -u root -p < backup.sql`
   - Revert git commit: `git revert <commit-hash>`
   - Restart containers: `docker compose restart`

3. **Worst Case**
   - Revert to `/opt/zedhosting` if needed (has stable state)
   - Restore volume snapshots
   - Document what went wrong

---

## Dependencies & Prerequisites

- ✅ All containers healthy
- ✅ Database up and running
- ✅ Web, API, Daemon all operational
- ✅ Latest code in `/root/ZedGamingHosting-latest`
- ⏳ Monitoring setup (Phase 2)
- ⏳ Automated backups (recommended before consolidation)

---

## Next Steps

1. **Immediate (Today)**
   - ✅ Complete this audit
   - Document current state
   - Create deployment procedures

2. **Short-term (This week)**
   - Test update/upgrade of `/opt/zedhosting` to latest
   - Verify all containers work with latest code
   - Plan cutover procedure

3. **Medium-term (Next week)**
   - Execute consolidation
   - Clean up redundant files
   - Update deployment documentation

4. **Long-term (Next phases)**
   - Implement monitoring (Prometheus + Grafana)
   - Add structured logging (JSON)
   - Automate deployment procedures

---

## Consolidation Checklist

- [ ] Database backup created
- [ ] Docker volumes documented
- [ ] Current logs archived
- [ ] `/opt/zedhosting` updated to latest code
- [ ] All containers tested with new code
- [ ] Performance verified (no slowdowns)
- [ ] Email/payments working
- [ ] Support ticketing working
- [ ] Server provisioning working
- [ ] `/opt/zedhosting` moved to backup
- [ ] Deployment docs updated
- [ ] Team trained on new process
- [ ] Monitoring setup (Phase 2)

---

## Questions for Team

1. Are both `/opt/zedhosting` and `/root/ZedGamingHosting-latest` actually being used in parallel?
2. Is there any reason to keep the old `/opt/zedhosting` location?
3. Do we have automated backups in place?
4. What's the acceptable downtime for consolidation (if any)?

---

## References

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [ADMIN_INFRASTRUCTURE.md](./ADMIN_INFRASTRUCTURE.md)
- Docker Compose files: `/root/ZedGamingHosting-latest/docker-compose.yml`
- Git history: `git log --oneline -20`

