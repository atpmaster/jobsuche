import { addApplication, addApplicationUpdate, addTask, deleteApplication, getDashboardData, updateApplicationStatus, updateApplicationStep, updateTask } from "./actions";
import { LiveRefresh } from "./live-refresh";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  saved: "İlan kaydedildi",
  preparing: "Hazırlanıyor",
  applied: "Başvuru gönderildi",
  interview: "Mülakat",
  offer: "Teklif",
  rejected: "Olumsuz",
  withdrawn: "Vazgeçildi",
};

const statusOrder = ["saved", "preparing", "applied", "interview", "offer", "rejected", "withdrawn"];
const trackLabels: Record<string, string> = { teaching: "Öğretmenlik", cyber: "Siber güvenlik", other: "Alternatif" };
const updateTypes = ["Not", "E-posta", "Telefon", "Mülakat", "Durum"];

function formatDate(value: string | null | undefined, long = false) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: long ? "long" : "short", year: long ? "numeric" : undefined }).format(new Date(`${value}T12:00:00`));
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function Home() {
  const { applications, tasks } = await getDashboardData();
  const today = new Date().toISOString().slice(0, 10);
  const openStatuses = new Set(["saved", "preparing", "applied", "interview"]);
  const active = applications.filter((item) => openStatuses.has(item.status));
  const awaiting = applications.filter((item) => ["applied", "interview"].includes(item.status));
  const inMotion = applications.filter((item) => ["interview", "offer"].includes(item.status));
  const followUps = applications.filter((item) => item.nextActionDate && item.nextActionDate <= today && openStatuses.has(item.status));
  const completedTasks = tasks.filter((task) => task.done).length;
  const avgScore = applications.length ? Math.round(applications.reduce((sum, item) => sum + item.score, 0) / applications.length) : 0;
  const lastUpdate = applications.flatMap((item) => item.updates).sort((a, b) => b.happenedOn.localeCompare(a.happenedOn))[0];

  return (
    <main>
      <aside className="sidebar">
        <div className="brand-mark">AT</div>
        <div className="brand-copy"><strong>Ahmet Tepe</strong><span>Başvuru komuta merkezi</span></div>
        <nav aria-label="Ana menü">
          <a className="active" href="#genel"><span>◉</span> Genel görünüm</a>
          <a href="#basvurular"><span>↗</span> Başvurular <b>{active.length}</b></a>
          <a href="#takip"><span>⌁</span> Takip bekleyenler <b>{followUps.length}</b></a>
          <a href="#gorevler"><span>✓</span> Bugünün planı</a>
        </nav>
        <div className="sidebar-note">
          <span className="live-dot" />
          <div><strong>Canlı çalışma alanı</strong><p>Durum değişiklikleri kaydedilir ve ekran otomatik yenilenir.</p></div>
        </div>
      </aside>

      <section className="content" id="genel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</p>
            <h1>Başvuruların nerede, <em>net.</em></h1>
            <p className="lede">İlanı bulduğun andan geri dönüşe kadar her adım tek ekranda.</p>
          </div>
          <div className="top-actions"><LiveRefresh /><details className="add-menu"><summary>+ Yeni başvuru</summary><div className="form-popover">
            <div className="popover-head"><div><p className="eyebrow">KAYDA AL</p><h3>Yeni başvuru</h3></div><span>↳</span></div>
            <form action={addApplication}>
              <div className="form-row"><label>Şirket / kurum<input name="company" required placeholder="Örn. Landkreis Gifhorn" /></label><label>Pozisyon<input name="role" required placeholder="Örn. Mathematiklehrer" /></label></div>
              <div className="form-row"><label>Alan<select name="track"><option value="teaching">Öğretmenlik</option><option value="cyber">Siber güvenlik</option><option value="other">Alternatif</option></select></label><label>Uygunluk<input name="score" type="number" min="0" max="100" defaultValue="80" /></label></div>
              <div className="form-row"><label>Kaynak<input name="source" placeholder="Arbeitsagentur, LinkedIn…" /></label><label>Konum<input name="location" placeholder="Gifhorn" /></label></div>
              <div className="form-row"><label>Başvuru tarihi<input name="appliedOn" type="date" /></label><label>Takip tarihi<input name="nextActionDate" type="date" /></label></div>
              <label>İlan bağlantısı<input name="url" type="url" placeholder="https://…" /></label>
              <label>Sonraki adım<input name="nextAction" placeholder="Örn. 7 gün sonra e-posta kontrolü" /></label>
              <div className="form-row"><label>Muhatap<input name="contactName" placeholder="Ad soyad" /></label><label>E-posta<input name="contactEmail" type="email" placeholder="isim@kurum.de" /></label></div>
              <label>Not / şartlar<textarea name="notes" placeholder="İlan şartları, belgeler, hatırlatmalar…" /></label>
              <button type="submit">Başvuruyu kaydet</button>
            </form>
          </div></details></div>
        </header>

        <section className="stats" aria-label="Başvuru özeti">
          <article className="stat stat-primary"><span>Aktif başvurular</span><strong>{active.length}</strong><small>panoda açık akış</small><i className="stat-line" /></article>
          <article><span>Yanıt bekleyen</span><strong>{awaiting.length}</strong><small>başvuru / mülakat</small></article>
          <article><span>Mülakat veya teklif</span><strong>{inMotion.length}</strong><small>ileri aşamadaki kayıt</small></article>
          <article className={followUps.length ? "stat-alert" : ""}><span>Takip zamanı gelen</span><strong>{followUps.length}</strong><small>{followUps.length ? "bugün ilgilen" : "şimdilik temiz"}</small></article>
        </section>

        <div className="section-heading" id="takip"><div><p className="eyebrow">CANLI BORU HATTI</p><h2>Başvuru takibi</h2></div><div className="heading-meta"><span className="record-count">{applications.length} kayıt</span><span className="sync-copy">Son hareket: {lastUpdate ? formatDate(lastUpdate.happenedOn) : "henüz yok"}</span></div></div>

        <section className="application-board" id="basvurular">
          <div className="board-head"><span>FIRSAT</span><span>KAYNAK</span><span>DURUM</span><span>TAKİP</span><span /></div>
          {applications.map((item) => {
            const due = Boolean(item.nextActionDate && item.nextActionDate <= today && openStatuses.has(item.status));
            const doneSteps = item.steps.filter((step) => step.done).length;
            return <details className={`application-card ${due ? "is-due" : ""}`} key={item.id} open={due}>
              <summary className="application-summary">
                <span className={`avatar avatar-${item.track}`}>{initials(item.company)}</span>
                <span className="job-copy"><strong>{item.role}</strong><small>{item.company} · {item.location || "Konum belirtilmedi"}</small><span className="summary-tags"><b className={`track-tag ${item.track}`}>{trackLabels[item.track] || "Alternatif"}</b><b className={`score-tag ${item.score >= 85 ? "high" : item.score >= 70 ? "mid" : "low"}`}>Uyum %{item.score}</b></span></span>
                <span className="source-copy"><strong>{item.source || "Manuel kayıt"}</strong><small>{item.appliedOn ? `Başvuru: ${formatDate(item.appliedOn)}` : "Başvuru tarihi eklenmedi"}</small></span>
                <span className={`status-pill ${item.status}`}><i />{statusLabels[item.status] || item.status}</span>
                <span className={`next-copy ${due ? "due" : ""}`}><strong>{item.nextActionDate ? formatDate(item.nextActionDate) : "Tarih yok"}</strong><small>{item.nextAction || "Sonraki adım eklenmedi"}</small></span>
                <span className="chevron">⌄</span>
              </summary>

              <div className="application-detail">
                <div className="detail-grid">
                  <div className="detail-column"><p className="eyebrow">DURUMU GÜNCELLE</p><form action={updateApplicationStatus} className="status-editor"><input type="hidden" name="id" value={item.id} /><select aria-label={`${item.company} başvuru durumu`} name="status" defaultValue={item.status}>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><button type="submit">Kaydet</button></form>{item.url && <a className="job-link" href={item.url} target="_blank" rel="noreferrer">İlanı aç <span>↗</span></a>}</div>
                  <div className="detail-column"><p className="eyebrow">MUHATAP</p><strong>{item.contactName || "Henüz eklenmedi"}</strong><small>{item.contactEmail || item.contactPhone || "İletişim bilgisi yok"}</small>{item.lastContactOn && <small>Son temas: {formatDate(item.lastContactOn)}</small>}</div>
                  <div className="detail-column"><p className="eyebrow">SON GERİ DÖNÜŞ</p><strong>{item.feedback || "Henüz geri dönüş yok"}</strong><small>{item.notes || "Not eklenmedi"}</small></div>
                </div>

                <div className="detail-lower">
                  <div className="checklist"><div className="mini-heading"><div><p className="eyebrow">BAŞVURU ADIMLARI</p><strong>{doneSteps}/{item.steps.length} tamamlandı</strong></div><span>{item.steps.length ? Math.round(doneSteps / item.steps.length * 100) : 0}%</span></div><div className="step-progress"><i style={{ width: `${item.steps.length ? doneSteps / item.steps.length * 100 : 0}%` }} /></div>{item.steps.map((step) => <form action={updateApplicationStep} key={step.id} className={step.done ? "step done" : "step"}><input type="hidden" name="stepId" value={step.id} /><input type="hidden" name="done" value={step.done ? "0" : "1"} /><button type="submit" aria-label={step.done ? "Adımı geri aç" : "Adımı tamamla"}>{step.done ? "✓" : "○"}</button><span>{step.label}</span></form>)}</div>
                  <div className="timeline"><div className="mini-heading"><div><p className="eyebrow">ZAMAN ÇİZELGESİ</p><strong>Son hareketler</strong></div><span>{item.updates.length}</span></div>{item.updates.length ? <div className="timeline-list">{item.updates.slice(0, 4).map((update) => <div className="timeline-item" key={update.id}><i /><div><strong>{update.title}</strong><small>{formatDate(update.happenedOn)}{update.body ? ` · ${update.body}` : ""}</small></div></div>)}</div> : <p className="muted-text">Durum değişikliği veya not eklendiğinde burada görünecek.</p>}<form action={addApplicationUpdate} className="update-form"><input type="hidden" name="applicationId" value={item.id} /><div className="form-row"><select name="updateType" aria-label="Güncelleme türü">{updateTypes.map((type) => <option key={type}>{type}</option>)}</select><input name="happenedOn" type="date" defaultValue={today} /></div><input name="title" required placeholder="Yeni hareket başlığı" /><input name="body" placeholder="Kısa not veya alınan yanıt" /><button type="submit">+ Güncelleme ekle</button></form></div>
                </div>
                <div className="detail-footer"><span>Kaynak: {item.source || "Manuel kayıt"}</span><form action={deleteApplication}><input type="hidden" name="id" value={item.id} /><button className="delete" type="submit">Kaydı sil</button></form></div>
              </div>
            </details>;
          })}
          {!applications.length && <div className="empty"><strong>İlk başvurunu kaydet.</strong><span>+ Yeni başvuru ile takip akışını başlatabilirsin.</span></div>}
        </section>

        <div className="bottom-grid">
          <section className="tasks-panel" id="gorevler"><div className="section-heading compact"><div><p className="eyebrow">BUGÜNÜN ODAĞI</p><h2>Kontrol listesi</h2></div><span className="record-count">{completedTasks}/{tasks.length}</span></div><div className="task-list">{tasks.map((task, index) => <form action={updateTask} key={task.id} className={task.done ? "task done" : "task"}><input type="hidden" name="id" value={task.id} /><input type="hidden" name="done" value={task.done ? "0" : "1"} /><button type="submit" aria-label={task.done ? "Görevi geri aç" : "Görevi tamamla"}>{task.done ? "✓" : String(index + 1).padStart(2, "0")}</button><span><strong>{task.title}</strong><small>{task.category} · {task.estimate}</small></span></form>)}</div><details className="quick-task"><summary>+ Yeni görev ekle</summary><form action={addTask}><input name="title" required placeholder="Yeni görev" /><div className="form-row"><input name="category" placeholder="Kategori" /><input name="estimate" placeholder="30 dk" /></div><button type="submit">Ekle</button></form></details></section>
          <aside className="insight-panel"><p className="eyebrow">KARAR NOTU</p><h2>Bugünkü en güçlü hamle</h2><p>{followUps.length ? `${followUps.length} başvurunun takip zamanı geldi. Önce onları güncelle.` : "Takip kuyruğun temiz. Yeni ilanları eklemek veya en yüksek uyumlu başvuruyu ilerletmek için iyi bir gün."}</p><div className="insight-score"><span>Ortalama uyum</span><strong>%{avgScore}</strong></div><a href="#basvurular">Başvurulara git ↗</a></aside>
        </div>
      </section>
    </main>
  );
}
