with open('server/routers.ts', 'r') as f:
    content = f.read()

old1 = """    getLatestReport: adminProcedure.query(async () => {
      const { getDb } = await import('./db');
      const d = await getDb();
      const { weeklyRevenueReports } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      const reports = await d.select().from(weeklyRevenueReports)
        .orderBy(desc(weeklyRevenueReports.createdAt)).limit(1);
      return reports[0] || null;
    }),"""

new1 = """    getLatestReport: adminProcedure.query(async () => {
      const { getDb } = await import('./db');
      const d = await getDb();
      if (d == null) return null;
      const { weeklyRevenueReports } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      const reports = await d.select().from(weeklyRevenueReports)
        .orderBy(desc(weeklyRevenueReports.createdAt)).limit(1);
      return reports[0] || null;
    }),"""

old2 = """    getReports: adminProcedure.query(async () => {
      const { getDb } = await import('./db');
      const d = await getDb();
      const { weeklyRevenueReports } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      return d.select().from(weeklyRevenueReports)
        .orderBy(desc(weeklyRevenueReports.createdAt)).limit(12);
    }),"""

new2 = """    getReports: adminProcedure.query(async () => {
      const { getDb } = await import('./db');
      const d = await getDb();
      if (d == null) return [];
      const { weeklyRevenueReports } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      return d.select().from(weeklyRevenueReports)
        .orderBy(desc(weeklyRevenueReports.createdAt)).limit(12);
    }),"""

if old1 in content:
    content = content.replace(old1, new1)
    print("Fixed getLatestReport null d")
else:
    print("WARNING: getLatestReport pattern not found")

if old2 in content:
    content = content.replace(old2, new2)
    print("Fixed getReports null d")
else:
    print("WARNING: getReports pattern not found")

with open('server/routers.ts', 'w') as f:
    f.write(content)
print("Done")
