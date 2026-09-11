import { addApplication, addApplicationUpdate, addTask, deleteApplication, getDashboardData, updateApplicationStatus, updateApplicationStep, updateTask } from "./actions";
import { LiveRefresh } from "./live-refresh";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  saved: "Kaydedildi",
  preparing: "Hazırlanıyor",
  applied: "Gönderildi",
  interview: "Mülakat",
  offer: "Teklif",
  rejected: "Olumsuz",
  withdrawn: "Vazgeçildi",
};

const statusOrder = ["saved", "preparing", "applied", "interview", "offer", "rejected", "withdrawn"];
const trackLabels: Record<string, string> = { teaching: "Eğitim", cyber: "Siber güvenlik", other: "Alternatif" };
const updateTypes = ["Not", "E-posta", "Telefon", "Mülakat", "Durum"];

function formatDate(value: string | null | undefined, long = false) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: long ? "long" : "short", year: long ? "numeric" : undefined }).format(new Date(`${value}T12:00:00`));
}

function daysUntil(value: string | null | undefined, today: string) {
  if (!value) return null;
  const target = Date.parse(`${value}T12:00:00Z`);
  const base = Date.parse(`${today}T12:00:00Z`);
  return Math.round((target - base) / 86400000);
}

function relativeDate(value: string | null | undefined, today: string) {
  const days = daysUntil(value, today);
  if (days === null) return "Planlanmadı";
  if (days < 0) return `${Math.abs(days)} gün gecikti`;
  if (days === 0) return "Bugün";
  if (days === 1) return "Yarın";
  return `${days} gün sonra`;
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function Home() {
  const { applications, tasks } = await getDashboardData();
  const today = new Date().toISOString().slice(0, 10);
  const todayLabel = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const openStatuses = new Set(["saved", "preparing", "applied", "interview"]);
  const active = applications.filter((item) => openStatuses.has(item.status));
  const awaiting = applications.filter((item) => ["applied", "interview"].includes(item.status));
  const inMotion = applications.filter((item) => ["interview", "offer"].includes(item.status));
  const followUps = applications.filter((item) => item.nextActionDate && item.nextActionDate <= today && openStatuses.has(item.status));
  const completedTasks = tasks.filter((task) => task.done).length;
  const avgScore = applications.length ? Math.round(applications.reduce((sum, item) => sum + item.score, 0) / applications.length) : 0;
  const priority = followUps[0] ?? [...active].sort((a, b) => b.score - a.score)[0];
  const recentUpdates = applications.flatMap((application) => application.updates.map((update) => ({ ...update, applicationName: application.company, applicationId: application.id }))).sort((a, b) => b.happenedOn.localeCompare(a.happenedOn)).slice(0, 5);

  return (
    <main className="file-manager">
      <aside className="side-rail">
        <div className="rail-brand"><span className="brand-mark">AT</span><span><strong>Ahmet Tepe</strong><small>iş arama dosyası</small></span></div>
        <div className="rail-rule" />
        <nav aria-label="Dosya gezintisi">
          <p className="rail-label">ÇALIŞMA ALANI</p>
          <a className="rail-link active" href="#basvurular"><span>01</span> Dosyalar <b>{applications.length}</b></a>
          <a className="rail-link" href="#takip"><span>02</span> Takip <b className={followUps.length ? "alert-count" : ""}>{followUps.length}</b></a>
          <a className="rail-link" href="#gorevler"><span>03</span> Görevler <b>{tasks.length - completedTasks}</b></a>
          <a className="rail-link" href="#gunluk"><span>04</span> Günlük</a>
        </nav>
        <div className="rail-footer"><span className="live-dot" /> <strong>Canlı kayıt</strong><p>Son kontrol<br />{formatDate(today, true)}</p></div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="breadcrumb">AHMET TEPE <span>/</span> İŞ ARAMA</p>
            <h1>Başvuru dosyaları<span>.</span></h1>
            <p className="workspace-intro">İlanları, görüşmeleri ve sıradaki adımları tek yerde tut.</p>
          </div>
          <div className="header-actions"><LiveRefresh /><details className="add-menu"><summary><span>＋</span> Yeni başvuru</summary><div className="form-popover">
            <div className="popover-head"><div><p className="eyebrow">DOSYAYA EKLE</p><h3>Yeni fırsat</h3><p>Takipte kalmak istediğin ilanı kaydet.</p></div><span className="popover-number">+</span></div>
            <form action={addApplication}>
              <div className="form-row"><label>Şirket / kurum<input name="company" required placeholder="Örn. Landkreis Gifhorn" /></label><label>Pozisyon<input name="role" required placeholder="Örn. Mathematiklehrer" /></label></div>
              <div className="form-row"><label>Alan<select name="track"><option value="teaching">Eğitim</option><option value="cyber">Siber güvenlik</option><option value="other">Alternatif</option></select></label><label>Uygunluk<input name="score" type="number" min="0" max="100" defaultValue="80" /></label></div>
              <div className="form-row"><label>Kaynak<input name="source" placeholder="Arbeitsagentur, LinkedIn…" /></label><label>Konum<input name="location" placeholder="Gifhorn" /></label></div>
              <div className="form-row"><label>Başvuru tarihi<input name="appliedOn" type="date" /></label><label>Takip tarihi<input name="nextActionDate" type="date" /></label></div>
              <label>İlan bağlantısı<input name="url" type="url" placeholder="https://…" /></label>
              <label>Sonraki adım<input name="nextAction" placeholder="Örn. 7 gün sonra e-posta kontrolü" /></label>
              <div className="form-row"><label>Muhatap<input name="contactName" placeholder="Ad soyad" /></label><label>E-posta<input name="contactEmail" type="email" placeholder="isim@kurum.de" /></label></div>
              <label>Not / şartlar<textarea name="notes" placeholder="İlan şartları, belgeler, hatırlatmalar…" /></label>
              <button type="submit">Başvuruyu kaydet <span>↗</span></button>
            </form>
          </div></details></div>
        </header>

        <div className="file-toolbar" id="takip">
          <div className="toolbar-title"><span className="folder-tab">A</span><strong>Açık dosyalar</strong><b>{applications.length}</b></div>
          <div className="toolbar-stats"><span><strong>{active.length}</strong> açık</span><span><strong>{awaiting.length}</strong> yanıt bekleyen</span><span><strong>{inMotion.length}</strong> ileri aşama</span><span className={followUps.length ? "is-alert" : ""}><strong>{followUps.length}</strong> takip gereken</span><span><strong>%{avgScore}</strong> ort. uyum</span></div>
          <span className="toolbar-date">{todayLabel}</span>
        </div>

        <div className="file-layout">
          <section className="file-list" id="basvurular" aria-label="Başvuru takibi">
            <div className="list-intro"><div><p className="eyebrow"><span className="eyebrow-line" /> KAYITLAR</p><h2>Başvurular</h2></div><span className="list-note">Açmak için satıra tıkla</span></div>
            <div className="list-head"><span>NO</span><span></span><span>İLAN / KURUM</span><span>KAYNAK</span><span>DURUM</span><span>TAKİP</span><span></span></div>
            {applications.map((item, index) => {
              const due = Boolean(item.nextActionDate && item.nextActionDate <= today && openStatuses.has(item.status));
              const doneSteps = item.steps.filter((step) => step.done).length;
              return <details className={`file-entry ${due ? "is-due" : ""}`} id={`app-${item.id}`} key={item.id} open={due}>
                <summary className="file-summary">
                  <span className="file-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`file-avatar avatar-${item.track}`}>{initials(item.company)}</span>
                  <span className="file-main"><strong>{item.role}</strong><small>{item.company} · {item.location || "Konum belirtilmedi"}</small><span className="file-tags"><b className={`track-tag ${item.track}`}>{trackLabels[item.track] || "Alternatif"}</b><b className={`score-tag ${item.score >= 85 ? "high" : item.score >= 70 ? "mid" : "low"}`}>%{item.score} uyum</b></span></span>
                  <span className="file-source"><strong>{item.source || "Manuel kayıt"}</strong><small>{item.appliedOn ? formatDate(item.appliedOn) : "Tarih yok"}</small></span>
                  <span className={`status-pill ${item.status}`}><i />{statusLabels[item.status] || item.status}</span>
                  <span className={`file-follow ${due ? "due" : ""}`}><strong>{item.nextActionDate ? `${relativeDate(item.nextActionDate, today)} · ${formatDate(item.nextActionDate)}` : "Planlanmadı"}</strong><small>{item.nextAction || "Sonraki adım eklenmedi"}</small></span>
                  <span className="file-chevron">⌄</span>
                </summary>

                <div className="file-detail">
                  <div className="detail-grid">
                    <div className="detail-column"><p className="eyebrow">DURUMU GÜNCELLE</p><form action={updateApplicationStatus} className="status-editor"><input type="hidden" name="id" value={item.id} /><select aria-label={`${item.company} başvuru durumu`} name="status" defaultValue={item.status}>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><button type="submit">Kaydet</button></form>{item.url && <a className="job-link" href={item.url} target="_blank" rel="noreferrer">İlanı aç <span>↗</span></a>}</div>
                    <div className="detail-column"><p className="eyebrow">MUHATAP</p><strong>{item.contactName || "Henüz eklenmedi"}</strong><small>{item.contactEmail || item.contactPhone || "İletişim bilgisi yok"}</small>{item.lastContactOn && <small>Son temas: {formatDate(item.lastContactOn)}</small>}</div>
                    <div className="detail-column"><p className="eyebrow">SON GERİ DÖNÜŞ</p><strong>{item.feedback || "Henüz geri dönüş yok"}</strong><small>{item.notes || "Not eklenmedi"}</small></div>
                  </div>
                  <div className="detail-lower">
                    <div className="checklist"><div className="mini-heading"><div><p className="eyebrow">BAŞVURU ADIMLARI</p><strong>{doneSteps}/{item.steps.length} tamamlandı</strong></div><span>{item.steps.length ? Math.round(doneSteps / item.steps.length * 100) : 0}%</span></div><div className="step-progress"><i style={{ width: `${item.steps.length ? doneSteps / item.steps.length * 100 : 0}%` }} /></div>{item.steps.map((step) => <form action={updateApplicationStep} key={step.id} className={step.done ? "step done" : "step"}><input type="hidden" name="stepId" value={step.id} /><input type="hidden" name="done" value={step.done ? "0" : "1"} /><button type="submit" aria-label={step.done ? "Adımı geri aç" : "Adımı tamamla"}>{step.done ? "✓" : "○"}</button><span>{step.label}</span></form>)}</div>
                    <div className="timeline"><div className="mini-heading"><div><p className="eyebrow">ZAMAN ÇİZELGESİ</p><strong>Son hareketler</strong></div><span>{item.updates.length}</span></div>{item.updates.length ? <div className="timeline-list">{item.updates.slice(0, 4).map((update) => <div className="timeline-item" key={update.id}><i className={`timeline-dot ${update.updateType.toLowerCase().replace("-", "")}`} /><div><strong>{update.title}</strong><small>{formatDate(update.happenedOn)}{update.body ? ` · ${update.body}` : ""}</small></div></div>)}</div> : <p className="muted-text">Durum değişikliği veya not eklendiğinde burada görünecek.</p>}<form action={addApplicationUpdate} className="update-form"><input type="hidden" name="applicationId" value={item.id} /><div className="form-row"><select name="updateType" aria-label="Güncelleme türü">{updateTypes.map((type) => <option key={type}>{type}</option>)}</select><input name="happenedOn" type="date" defaultValue={today} /></div><input name="title" required placeholder="Yeni hareket başlığı" /><input name="body" placeholder="Kısa not veya alınan yanıt" /><button type="submit">＋ Güncelleme ekle</button></form></div>
                  </div>
                  <div className="detail-footer"><span>Kaynak: {item.source || "Manuel kayıt"}</span><form action={deleteApplication}><input type="hidden" name="id" value={item.id} /><button className="delete" type="submit">Kaydı sil</button></form></div>
                </div>
              </details>;
            })}
            {!applications.length && <div className="empty"><strong>İlk dosyanı oluştur.</strong><span>＋ Yeni başvuru ile kişisel takip akışını başlatabilirsin.</span></div>}
          </section>

          <aside className="inspector-column">
            {priority ? <section className="inspector-panel"><div className="inspector-heading"><p className="eyebrow"><span className="eyebrow-line" /> ÖNCELİKLİ DOSYA</p><span className={`status-pill ${priority.status}`}><i />{statusLabels[priority.status]}</span></div><h2>{priority.role}</h2><p className="inspector-company">{priority.company} · {priority.location || "Konum belirtilmedi"}</p><a className="job-link" href={priority.url || `#app-${priority.id}`} target={priority.url ? "_blank" : undefined} rel={priority.url ? "noreferrer" : undefined}>İlanı aç <span>↗</span></a><div className="inspector-rule" /><dl className="meta-list"><div><dt>Takip</dt><dd className={followUps.includes(priority) ? "is-alert" : ""}>{priority.nextActionDate ? `${formatDate(priority.nextActionDate, true)} · ${relativeDate(priority.nextActionDate, today)}` : "Planlanmadı"}</dd></div><div><dt>Kaynak</dt><dd>{priority.source || "Manuel kayıt"}</dd></div><div><dt>Muhatap</dt><dd>{priority.contactName || "Henüz eklenmedi"}</dd></div><div><dt>Uyum</dt><dd>%{priority.score}</dd></div></dl><div className="inspector-note"><span>SON NOT</span><p>{priority.feedback || priority.notes || "Henüz not eklenmedi."}</p></div><form action={updateApplicationStatus} className="inspector-status"><input type="hidden" name="id" value={priority.id} /><select aria-label="Öncelikli dosya durumu" name="status" defaultValue={priority.status}>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><button type="submit">Durumu kaydet</button></form><a className="inspector-open" href={`#app-${priority.id}`}>Dosya ayrıntılarına git <span>↗</span></a></section> : <section className="inspector-panel empty-inspector"><p className="eyebrow">ÖNCELİKLİ DOSYA</p><h2>Henüz dosya yok.</h2><p>İlk başvurunu eklediğinde ayrıntıları burada göreceksin.</p></section>}

            <section className="side-section" id="gunluk"><div className="side-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> GÜNLÜK</p><h2>Son hareketler</h2></div><span>{recentUpdates.length}</span></div>{recentUpdates.length ? <div className="activity-list">{recentUpdates.map((update) => <a className="activity-item" href={`#app-${update.applicationId}`} key={`${update.applicationId}-${update.id}`}><span className={`activity-icon ${update.updateType.toLowerCase().replace("-", "")}`}>{update.updateType === "E-posta" ? "@" : update.updateType === "Durum" ? "↗" : "•"}</span><span><strong>{update.title}</strong><small>{update.applicationName} · {formatDate(update.happenedOn)}</small></span></a>)}</div> : <p className="muted-text">İlk durum değişikliği burada görünecek.</p>}</section>

            <section className="side-section tasks-section" id="gorevler"><div className="side-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> BUGÜN</p><h2>Yapılacaklar</h2></div><span>{completedTasks}/{tasks.length}</span></div><div className="task-list">{tasks.map((task, index) => <form action={updateTask} key={task.id} className={task.done ? "task done" : "task"}><input type="hidden" name="id" value={task.id} /><input type="hidden" name="done" value={task.done ? "0" : "1"} /><button type="submit" aria-label={task.done ? "Görevi geri aç" : "Görevi tamamla"}>{task.done ? "✓" : String(index + 1).padStart(2, "0")}</button><span><strong>{task.title}</strong><small>{task.category} · {task.estimate}</small></span></form>)}</div><details className="quick-task"><summary>＋ Yeni görev ekle</summary><form action={addTask}><input name="title" required placeholder="Yeni görev" /><div className="form-row"><input name="category" placeholder="Kategori" /><input name="estimate" placeholder="30 dk" /></div><button type="submit">Ekle</button></form></details></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
