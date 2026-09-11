# Beğenilen sürüm — 11 Eylül 2026

- Git tag: `checkpoint-liked-2026-09-11`
- Commit: `37f51a9f7945726920dcc441455dec05616e9c86`
- Sites project: `appgprj_6aa064b88e88819190c43090339b21bc`
- Published version: `appgprj_6aa064b88e88819190c43090339b21bc~appgver_020994200cd08191a09bb38e2de74539` (7)
- Site: https://ahmet-basvuru-merkezi.yapay-zeka-e-5918.chatgpt.site
- Archive: `publish-37f51a9.tar.gz`

Approved design includes TR/DE flags, filtered PDF export, search, date editor, recycle bin and JSON export.

## Safe rollback

Redeploy the existing Sites version above, preserving the current audience. Do not restore an old database, remove migrations, delete new records, or reset the working tree. The source checkpoint and deployment archive are not a database backup. Newer feature data may not be displayed by the old UI, but must remain stored. Verify current records before and after rollback. Keep later source commits separately; use a worktree from the tag if rebuilding is necessary.
