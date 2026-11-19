import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%'")
tables = [r[0] for r in c.fetchall()]
print(f"Total tables: {len(tables)}")
for t in sorted(tables):
    c.execute(f"SELECT count(*) FROM {t}")
    cnt = c.fetchone()[0]
    print(f"{t:28} : {cnt} rows")

print("\n--- SAMPLE JOBS ---")
c.execute("SELECT title, departmentId, status FROM Job")
for row in c.fetchall():
    print(row)

print("\n--- SAMPLE USERS ---")
c.execute("SELECT name, email, role, status FROM User")
for row in c.fetchall():
    print(row)

print("\n--- SAMPLE RESUME ANALYSES ---")
c.execute("SELECT tfidfScore, skillScore, finalScore, algorithmVersion, summary FROM ResumeAnalysis LIMIT 3")
for row in c.fetchall():
    print(row)

