import { addApplication, addTask, deleteApplication, getDashboardData, updateApplicationStatus, updateTask } from "./actions";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  saved: "Kaydedildi", preparing: "Hazırlanıyor", applied: "Başvuruldu", interview: "Mülakat", offer: "Teklif", rejected: "Olumsuz"
};

const statusOrder = ["saved", "preparing", "applied", "interview", "offer", "rejected"];

function formatDate(value: string | null) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

export default async function Home() {
  const { applications, tasks } = await getDashboardData();
  const appliedThisWeek = applications.filter((item) => ["applied", "interview", "offer"].includes(item.status)).length;
  const active = applications.filter((item) => !["rejected", "offer"].includes(item.status)).length;
  const avgScore = applications.length ? Math.round(applications.reduce((sum, item) => sum + item.score, 0) / applications.length) : 0;
  const completedTasks = tasks.filter((task) => task.done).length;

  return (
    <main>
      <aside className="sidebar">
        <div className="brand"><span>AT</span><div>Ahmet Tepe<small>Kariyer Komuta Merkezi</small></div></div>
        <nav aria-label="Ana menü">
          <a className="active" href="#genel">Genel Bakış</a>
          <a href="#basvurular">Başvurular <b>{active}</b></a>
          <a href="#gorevler">Bugünün Planı</a>
          <a href="#hedefler">Ana Hedefler</a>
        </nav>
        <div className="sidebar-goal">
          <small>HAFTALIK HEDEF</small>
          <strong>{Math.min(appliedThisWeek, 10)} / 10 başvuru</strong>
          <div className="progress"><i style={{ width: `${Math.min(appliedThisWeek * 10, 100)}%` }} /></div>
          <p>Her kaliteli başvuru, düzenli gelir ve vatandaşlık hedefine bir adım.</p>
        </div>
      </aside>

      <section className="content" id="genel">
        <header>
          <div><p className="eyebrow">2 AĞUSTOS 2026 · PAZAR</p><h1>Günaydın Ahmet.</h1><p>Bugün odağın net: az araştırma, kaliteli başvuru.</p></div>
          <details className="add-menu">
            <summary>+ Yeni kayıt</summary>
            <div className="form-popover">
              <h3>Yeni iş fırsatı</h3>
              <form action={addApplication}>
                <label>Şirket<input name="company" required placeholder="Şirket adı" /></label>
                <label>Pozisyon<input name="role" required placeholder="Örn. Matematik Öğretmeni" /></label>
                <div className="form-row"><label>Alan<select name="track"><option value="teaching">Öğretmenlik</option><option value="cyber">Siber Güvenlik</option><option value="other">Alternatif</option></select></label><label>Uygunluk puanı<input name="score" type="number" min="0" max="100" defaultValue="75" /></label></div>
                <div className="form-row"><label>Konum<input name="location" placeholder="Wolfsburg" /></label><label>Son tarih<input name="deadline" type="date" /></label></div>
                <label>İlan bağlantısı<input name="url" type="url" placeholder="https://…" /></label>
                <label>Not<textarea name="notes" placeholder="Önemli şartlar, iletişim kişisi…" /></label>
                <button type="submit">Fırsatı kaydet</button>
              </form>
            </div>
          </details>
        </header>

        <div className="stats">
          <article><span>Aktif fırsatlar</span><strong>{active}</strong><small>takip edilen ilan</small></article>
          <article><span>Haftalık başvuru</span><strong>{appliedThisWeek}<em>/10</em></strong><small>kaliteli başvuru hedefi</small></article>
          <article><span>Ortalama uygunluk</span><strong>%{avgScore}</strong><small>Ahmet profiline göre</small></article>
          <article><span>Tamamlanan görev</span><strong>{completedTasks}<em>/{tasks.length}</em></strong><small>bugünün ilerlemesi</small></article>
        </div>

        <div className="main-grid">
          <section className="panel applications" id="basvurular">
            <div className="panel-head"><div><p className="eyebrow">AKTİF BORU HATTI</p><h2>Başvuru takibi</h2></div><span>{applications.length} kayıt</span></div>
            <div className="table-head"><span>FIRSAT</span><span>PUAN</span><span>DURUM</span><span>SON TARİH</span><span /></div>
            <div className="application-list">
              {applications.map((item) => (
                <article className="application" key={item.id}>
                  <div className={`track-icon ${item.track}`}>{item.track === "teaching" ? "M" : item.track === "cyber" ? "S" : "İ"}</div>
                  <div className="job"><strong>{item.role}</strong><span>{item.company} · {item.location || "Konum belirtilmedi"}</span>{item.url && <a href={item.url} target="_blank" rel="noreferrer">İlanı aç ↗</a>}</div>
                  <div className={`score ${item.score >= 80 ? "high" : item.score >= 65 ? "mid" : "low"}`}><strong>{item.score}</strong><span>/100</span></div>
                  <form action={updateApplicationStatus} className="status-form"><input type="hidden" name="id" value={item.id} /><select aria-label={`${item.company} başvuru durumu`} name="status" defaultValue={item.status}>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><button type="submit">Kaydet</button></form>
                  <time>{formatDate(item.deadline)}</time>
                  <form action={deleteApplication}><input type="hidden" name="id" value={item.id} /><button className="delete" type="submit" aria-label={`${item.company} kaydını sil`}>×</button></form>
                </article>
              ))}
              {!applications.length && <div className="empty">İlk fırsatını ekle; puanla ve süreci buradan yönet.</div>}
            </div>
          </section>

          <section className="panel tasks" id="gorevler">
            <div className="panel-head"><div><p className="eyebrow">ODAK PLANI</p><h2>Bugünün 3 görevi</h2></div></div>
            <div className="task-list">
              {tasks.map((task, index) => (
                <form action={updateTask} key={task.id} className={task.done ? "task done" : "task"}>
                  <input type="hidden" name="id" value={task.id} /><input type="hidden" name="done" value={task.done ? "0" : "1"} />
                  <button type="submit" aria-label={task.done ? "Görevi geri aç" : "Görevi tamamla"}>{task.done ? "✓" : index + 1}</button>
                  <div><strong>{task.title}</strong><span>{task.category} · {task.estimate}</span></div>
                </form>
              ))}
            </div>
            <details className="quick-task"><summary>+ Görev ekle</summary><form action={addTask}><input name="title" required placeholder="Yeni görev" /><div className="form-row"><input name="category" placeholder="Kategori" /><input name="estimate" placeholder="30 dk" /></div><button type="submit">Ekle</button></form></details>
          </section>
        </div>

        <section className="goals" id="hedefler">
          <div><p className="eyebrow">KARAR PUSULASI</p><h2>Ana hedef zinciri</h2></div>
          <ol><li className="current"><span>01</span><div><strong>Uygun işe gir</strong><small>Öğretmenlik veya siber güvenlik</small></div></li><li><span>02</span><div><strong>Düzenli gelir</strong><small>Jobcenter bağımlılığından çıkış</small></div></li><li><span>03</span><div><strong>Süresiz oturum</strong><small>Gerekli şartları tamamla</small></div></li><li><span>04</span><div><strong>Vatandaşlık</strong><small>Mümkün olan en kısa sürede</small></div></li></ol>
        </section>
      </section>
    </main>
  );
}
