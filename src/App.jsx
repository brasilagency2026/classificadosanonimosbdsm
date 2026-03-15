import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase client ───────────────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PAYPAL_EMAIL  = import.meta.env.VITE_PAYPAL_EMAIL || "seu@email.com";
const supabase      = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── PayPal polling ────────────────────────────────────────────────────────────
// Soumet un formulaire POST vers PayPal avec le custom UUID
// puis poll /api/verify-payment toutes les 3s (max 10 min)
function startPaypalPolling(paymentId, onSuccess, onTimeout, stopRef) {
  // Créer un formulaire POST vers PayPal avec le champ custom
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://www.paypal.com/cgi-bin/webscr";
  form.target = "_blank";

  const fields = {
    cmd:           "_xclick",
    business:      PAYPAL_EMAIL,
    item_name:     "Fotos no anuncio - Kinkonetos",
    amount:        "10.00",
    currency_code: "BRL",
    custom:        paymentId,
    no_shipping:   "1",
    return:        window.location.href,
    cancel_return: window.location.href,
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type  = "hidden";
    input.name  = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  // Polling toutes les 3s pendant 10 min max
  const start = Date.now();
  const interval = setInterval(async () => {
    if (Date.now() - start > 10 * 60 * 1000) {
      clearInterval(interval);
      onTimeout();
      return;
    }
    try {
      const res  = await fetch(`/api/verify-payment?payment_id=${paymentId}`);
      const data = await res.json();
      if (data.valid) { clearInterval(interval); onSuccess(); }
    } catch (_) {}
  }, 3000);
  if (stopRef) stopRef.current = () => clearInterval(interval);
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const POSICOES  = ["Dom","Sub","Switch","Dominant","Submissivo(a)","Sadista","Masoquista","Master","Slave","Pet","Owner","Rigger","Bunny"];
const BUSCAS    = ["Dom","Sub","Switch","Dominant","Submissivo(a)","Sadista","Masoquista","Master","Slave","Pet","Owner","Rigger","Bunny","Parceiro(a) cena","Amizade kinky","Relação séria","Exploração"];
const SEXOS     = ["Homem","Mulher","Homem trans","Mulher trans","Não-binário","Outro"];
const PRATICAS  = ["Bondage","Disciplina","Dominação","Submissão","Sadismo","Masoquismo","Roleplay","Wax play","Impact play","Shibari","Chastity","Age play","Pet play","Service submission","Outros"];

const BADGE_COLORS = {
  Dom:"#c0392b", Dominant:"#c0392b", Master:"#8e1a1a", Owner:"#6d1010",
  Sub:"#2980b9", "Submissivo(a)":"#2471a3", Slave:"#1a5276",
  Switch:"#8e44ad", Rigger:"#d35400", Bunny:"#e91e8c",
  Sadista:"#922b21", Masoquista:"#1a5276", Pet:"#27ae60", default:"#555"
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0a0608; --surface:#110d0f; --surface2:#1a1215; --surface3:#221820;
    --border:#2e1e26; --accent:#8b0000; --accent2:#c41e3a; --accent3:#ff4d6d;
    --gold:#b8962e; --gold2:#d4af37; --text:#e8ddd0; --text2:#a89080; --text3:#6a5048;
    --font-head:'Cinzel',serif; --font-body:'Crimson Pro',serif;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); font-size:17px; line-height:1.6; }
  .app { min-height:100vh; }

  /* HEADER */
  .header { background:linear-gradient(180deg,#0a0608 0%,#140a0d 100%); border-bottom:1px solid var(--border); padding:0 2rem; position:sticky; top:0; z-index:100; backdrop-filter:blur(10px); }
  .header-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; height:64px; }
  .logo { font-family:var(--font-head); font-size:1.3rem; color:var(--gold2); letter-spacing:0.12em; cursor:pointer; display:flex; align-items:center; gap:10px; }
  .logo-icon { font-size:1.6rem; }
  .logo span { color:var(--text2); font-size:0.75rem; display:block; letter-spacing:0.2em; }
  .header-nav { display:flex; gap:12px; align-items:center; }
  .btn { font-family:var(--font-head); font-size:0.75rem; letter-spacing:0.1em; padding:8px 18px; border:none; cursor:pointer; transition:all 0.2s; border-radius:2px; }
  .btn-ghost { background:transparent; color:var(--text2); border:1px solid var(--border); }
  .btn-ghost:hover { border-color:var(--gold); color:var(--gold); }
  .btn-primary { background:var(--accent); color:var(--text); border:1px solid var(--accent2); }
  .btn-primary:hover { background:var(--accent2); }
  .btn-gold { background:linear-gradient(135deg,#8b6914,#d4af37); color:#0a0608; font-weight:700; }
  .btn-gold:hover { background:linear-gradient(135deg,#a07820,#e0c040); }
  .btn:disabled { opacity:0.5; cursor:not-allowed; }

  /* HERO */
  .hero { text-align:center; padding:4rem 2rem 3rem; background:radial-gradient(ellipse at 50% 0%,#1a0810 0%,transparent 70%); position:relative; overflow:hidden; }
  .hero::before { content:''; position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(139,0,0,0.03) 48px,rgba(139,0,0,0.03) 49px),repeating-linear-gradient(90deg,transparent,transparent 48px,rgba(139,0,0,0.03) 48px,rgba(139,0,0,0.03) 49px); pointer-events:none; }
  .hero-ornament { font-size:2.5rem; color:var(--accent); margin-bottom:1rem; opacity:0.7; }
  .hero h1 { font-family:var(--font-head); font-size:2.6rem; color:var(--gold2); letter-spacing:0.06em; line-height:1.2; margin-bottom:0.5rem; }
  .hero p { color:var(--text2); font-style:italic; font-size:1.1rem; margin-bottom:2rem; }
  .hero-stats { display:flex; justify-content:center; gap:3rem; }
  .stat { text-align:center; }
  .stat-num { font-family:var(--font-head); font-size:1.8rem; color:var(--accent3); }
  .stat-label { color:var(--text3); font-size:0.85rem; letter-spacing:0.1em; }

  /* LAYOUT */
  .main { max-width:1200px; margin:0 auto; padding:2rem; display:grid; grid-template-columns:280px 1fr; gap:2rem; }

  /* SIDEBAR */
  .sidebar { position:sticky; top:80px; height:fit-content; }
  .filter-box { background:var(--surface); border:1px solid var(--border); border-radius:4px; padding:1.5rem; margin-bottom:1rem; }
  .filter-box h3 { font-family:var(--font-head); font-size:0.8rem; letter-spacing:0.2em; color:var(--gold); margin-bottom:1rem; text-transform:uppercase; border-bottom:1px solid var(--border); padding-bottom:0.5rem; }
  .filter-select,.filter-input { width:100%; background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:8px 12px; font-family:var(--font-body); font-size:0.9rem; border-radius:2px; margin-bottom:8px; }
  .filter-select:focus,.filter-input:focus { outline:none; border-color:var(--accent); }
  .filter-checkgroup { display:flex; flex-direction:column; gap:6px; max-height:200px; overflow-y:auto; }
  .filter-checkgroup::-webkit-scrollbar { width:4px; }
  .filter-checkgroup::-webkit-scrollbar-thumb { background:var(--accent); }
  .check-label { display:flex; align-items:center; gap:8px; cursor:pointer; color:var(--text2); font-size:0.9rem; }
  .check-label input { accent-color:var(--accent); }
  .check-label:hover { color:var(--text); }

  /* ADS */
  .ads-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; }
  .ads-header h2 { font-family:var(--font-head); font-size:1rem; letter-spacing:0.1em; color:var(--text2); }
  .ads-count { color:var(--accent3); font-family:var(--font-head); }
  .ads-grid { display:grid; gap:1rem; }

  /* CARD */
  .ad-card { background:var(--surface); border:1px solid var(--border); border-radius:4px; overflow:hidden; transition:border-color 0.2s,box-shadow 0.2s; cursor:pointer; }
  .ad-card:hover { border-color:var(--accent); box-shadow:0 0 20px rgba(139,0,0,0.15); }
  .ad-card.destaque { border-color:var(--gold); }
  .ad-card.destaque:hover { box-shadow:0 0 20px rgba(180,150,46,0.2); }
  .ad-card-inner { display:grid; grid-template-columns:1fr; }
  .ad-card.has-fotos .ad-card-inner { grid-template-columns:160px 1fr; }
  .ad-photo { width:160px; height:160px; object-fit:cover; display:block; }
  .ad-body { padding:1.2rem; }
  .ad-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem; }
  .ad-apelido { font-family:var(--font-head); font-size:1rem; color:var(--text); letter-spacing:0.05em; }
  .destaque-badge { font-size:0.65rem; font-family:var(--font-head); letter-spacing:0.1em; background:linear-gradient(135deg,#8b6914,#d4af37); color:#0a0608; padding:2px 8px; border-radius:2px; }
  .ad-meta { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:0.6rem; }
  .meta-tag { font-size:0.78rem; color:var(--text3); }
  .ad-badges { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:0.6rem; }
  .badge { font-size:0.7rem; padding:2px 8px; border-radius:2px; font-family:var(--font-head); letter-spacing:0.05em; border:1px solid; }
  .ad-desc { color:var(--text2); font-size:0.9rem; line-height:1.5; margin-bottom:0.8rem; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .ad-praticas { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:0.8rem; }
  .pratica-tag { font-size:0.7rem; color:var(--text3); background:var(--surface2); padding:2px 6px; border-radius:2px; border:1px solid var(--border); }
  .ad-footer { display:flex; justify-content:space-between; align-items:center; }
  .ad-date { font-size:0.78rem; color:var(--text3); }
  .btn-contact { font-family:var(--font-head); font-size:0.72rem; letter-spacing:0.1em; padding:6px 14px; background:var(--accent); color:var(--text); border:none; cursor:pointer; border-radius:2px; transition:background 0.2s; }
  .btn-contact:hover { background:var(--accent2); }

  /* MODAL */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:200; display:flex; align-items:center; justify-content:center; padding:1rem; }
  .modal { background:var(--surface); border:1px solid var(--border); border-radius:4px; max-width:680px; width:100%; max-height:90vh; overflow-y:auto; }
  .modal::-webkit-scrollbar { width:4px; }
  .modal::-webkit-scrollbar-thumb { background:var(--accent); }
  .modal-header { padding:1.5rem 1.5rem 1rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
  .modal-header h2 { font-family:var(--font-head); font-size:1.1rem; color:var(--gold2); letter-spacing:0.08em; }
  .modal-close { background:none; border:none; color:var(--text3); font-size:1.4rem; cursor:pointer; line-height:1; }
  .modal-close:hover { color:var(--text); }
  .modal-body { padding:1.5rem; }
  .modal-fotos { display:grid; grid-template-columns:repeat(1,1fr); gap:8px; margin-bottom:1.5rem; }
  .modal-foto { width:100%; aspect-ratio:4/3; object-fit:cover; border-radius:2px; }

  /* FORM */
  .form-group { margin-bottom:1.2rem; }
  .form-label { display:block; font-family:var(--font-head); font-size:0.72rem; letter-spacing:0.15em; color:var(--gold); margin-bottom:6px; text-transform:uppercase; }
  .form-input,.form-select,.form-textarea { width:100%; background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:10px 14px; font-family:var(--font-body); font-size:0.95rem; border-radius:2px; transition:border-color 0.2s; }
  .form-input:focus,.form-select:focus,.form-textarea:focus { outline:none; border-color:var(--accent); }
  .form-textarea { resize:vertical; min-height:100px; }
  .checkbox-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .form-check { display:flex; align-items:center; gap:8px; cursor:pointer; color:var(--text2); font-size:0.9rem; }
  .form-check input { accent-color:var(--accent); }
  .form-hint { font-size:0.82rem; color:var(--text3); margin-top:4px; font-style:italic; }
  .form-error { font-size:0.82rem; color:var(--accent3); margin-top:4px; }

  /* PAYPAL / FOTOS */
  .paypal-box { background:var(--surface2); border:1px solid var(--gold); border-radius:4px; padding:1.2rem; margin-top:0.5rem; }
  .paypal-box h4 { font-family:var(--font-head); font-size:0.85rem; color:var(--gold2); margin-bottom:0.5rem; letter-spacing:0.08em; }
  .paypal-box p { font-size:0.88rem; color:var(--text2); margin-bottom:0.8rem; }
  .upload-zone { border:2px dashed var(--border); border-radius:4px; padding:1.5rem; text-align:center; cursor:pointer; transition:border-color 0.2s; margin-top:0.8rem; }
  .upload-zone:hover { border-color:var(--gold); }
  .upload-zone input { display:none; }
  .upload-zone p { color:var(--text3); font-size:0.88rem; }
  .upload-previews { display:grid; grid-template-columns:repeat(1,1fr); gap:8px; margin-top:0.8rem; }
  .upload-preview { position:relative; aspect-ratio:4/3; }
  .upload-preview img { width:100%; height:100%; object-fit:cover; border-radius:2px; }
  .upload-preview-remove { position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.7); border:none; color:white; cursor:pointer; border-radius:50%; width:20px; height:20px; font-size:0.8rem; display:flex; align-items:center; justify-content:center; }
  .progress-bar { height:4px; background:var(--border); border-radius:2px; margin-top:0.5rem; overflow:hidden; }
  .progress-bar-inner { height:100%; background:var(--gold2); transition:width 0.3s; }

  /* ELEMENT BOX */
  .element-box { background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:1.2rem; margin-top:0.8rem; text-align:center; }
  .element-box p { color:var(--text2); font-size:0.9rem; margin-bottom:0.8rem; }
  .element-id { font-family:'Courier New',monospace; background:var(--surface); border:1px solid var(--border); padding:4px 10px; border-radius:2px; color:var(--accent3); font-size:0.9rem; }
  .btn-element { background:#0dbd8b; color:white; font-family:var(--font-head); font-size:0.8rem; letter-spacing:0.1em; padding:10px 22px; border:none; cursor:pointer; border-radius:2px; transition:background 0.2s; margin-top:0.8rem; }
  .btn-element:hover { background:#0fce99; }

  /* MISC */
  .divider { border:none; border-top:1px solid var(--border); margin:1.5rem 0; }
  .alert { padding:0.8rem 1rem; border-radius:2px; font-size:0.9rem; margin-bottom:1rem; }
  .alert-success { background:rgba(39,174,96,0.15); border:1px solid #27ae60; color:#27ae60; }
  .alert-info { background:rgba(139,0,0,0.15); border:1px solid var(--accent); color:var(--accent3); }
  .alert-error { background:rgba(196,30,58,0.15); border:1px solid var(--accent2); color:var(--accent3); }
  .loading { text-align:center; padding:4rem 2rem; color:var(--text3); font-family:var(--font-head); letter-spacing:0.1em; font-size:0.9rem; }
  .loading-spinner { display:inline-block; width:32px; height:32px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:1rem; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .empty { text-align:center; padding:4rem 2rem; color:var(--text3); }
  .empty-icon { font-size:3rem; margin-bottom:1rem; }
  .empty p { font-family:var(--font-head); letter-spacing:0.08em; }

  /* SECTION / FOOTER */
  .section-full { background:var(--surface); border:1px solid var(--border); border-top:2px solid var(--accent); padding:2rem; margin:2rem auto; max-width:1200px; }
  .section-full h2 { font-family:var(--font-head); font-size:1.2rem; color:var(--gold2); letter-spacing:0.1em; margin-bottom:0.5rem; }
  .section-full p { color:var(--text2); font-size:0.9rem; margin-bottom:1rem; }
  .footer { border-top:1px solid var(--border); padding:2rem; text-align:center; color:var(--text3); font-size:0.82rem; margin-top:3rem; }
  .footer a { color:var(--accent3); text-decoration:none; }
  .footer p { margin-bottom:0.4rem; }

  @media (max-width:768px) {
    .main { grid-template-columns:1fr; }
    .sidebar { position:static; }
    .hero h1 { font-size:1.8rem; }
    .hero-stats { gap:1.5rem; }
    .ad-card.has-fotos .ad-card-inner { grid-template-columns:1fr; }
  }
`;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getBadgeStyle(label) {
  const color = BADGE_COLORS[label] || BADGE_COLORS.default;
  return { color, borderColor: color + "66", background: color + "18" };
}

function openElement(elementId) {
  window.open(`https://matrix.to/#/${elementId}`, "_blank");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [ads, setAds]               = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    estado: "", cidade: "", sexo: "", posicao: [], busca: []
  });

  const [form, setForm] = useState({
    apelido: "", estado: "", cidade: "", sexo: "",
    posicao: [], busca: [], praticas: [], descricao: "", elementId: "",
    wantFotos: false
  });

  const [photoFiles, setPhotoFiles]       = useState([]);   // File[]
  const [photoPreviews, setPhotoPreviews] = useState([]);   // dataURL[]
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paymentId, setPaymentId]         = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | waiting | verified | timeout
  const stopPollingRef = useRef(null);

  // ── Fetch annonces ────────────────────────────────────────────────────────
  const fetchAds = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let q = supabase
        .from("anuncios")
        .select("*", { count: "exact" })
        .eq("ativo", true)
        .order("destaque", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters.estado) q = q.eq("estado", filters.estado);
      if (filters.cidade) q = q.ilike("cidade", `%${filters.cidade}%`);
      if (filters.sexo)   q = q.eq("sexo", filters.sexo);
      if (filters.posicao.length) q = q.overlaps("posicao", filters.posicao);
      if (filters.busca.length)   q = q.overlaps("busca",   filters.busca);

      const { data, error, count } = await q;
      if (error) throw error;
      setAds(data || []);
      setTotal(count || 0);
    } catch (e) {
      setLoadError("Erro ao carregar anúncios. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  // ── Photo previews ────────────────────────────────────────────────────────
  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files).slice(0, 1 - photoFiles.length);
    const newFiles = [...photoFiles, ...files].slice(0, 1);
    setPhotoFiles(newFiles);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreviews(prev => {
        const updated = [...prev];
        updated[newFiles.indexOf(f)] = ev.target.result;
        return updated;
      });
      reader.readAsDataURL(f);
    });
  }

  function removePhoto(i) {
    setPhotoFiles(prev => prev.filter((_,idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_,idx) => idx !== i));
  }

  // ── Upload photos to Supabase Storage ─────────────────────────────────────
  async function uploadPhotos(anuncioId) {
    const urls = [];
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const ext  = file.name.split(".").pop();
      const path = `${anuncioId}/${i}.${ext}`;
      const { error } = await supabase.storage
        .from("fotos")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("fotos").getPublicUrl(path);
      urls.push(data.publicUrl);
      setUploadProgress(Math.round(((i + 1) / photoFiles.length) * 100));
    }
    return urls;
  }

  // ── Submit annonce ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    setFormError(null);
    if (!form.apelido || !form.estado || !form.sexo || !form.elementId || !form.descricao) {
      setFormError("Preencha todos os campos obrigatórios (*).");
      return;
    }
    if (form.posicao.length === 0) {
      setFormError("Selecione ao menos uma posição no BDSM.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Insert annonce sans photos
      const payload = {
        apelido:    form.apelido,
        estado:     form.estado,
        cidade:     form.cidade || null,
        sexo:       form.sexo,
        posicao:    form.posicao,
        busca:      form.busca,
        praticas:   form.praticas,
        descricao:  form.descricao,
        element_id: form.elementId,
        fotos:      [],
        destaque:   false,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("anuncios")
        .insert(payload)
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 2. Upload photos si présentes
      if (form.wantFotos && paymentStatus === "verified" && photoFiles.length > 0) {
        const fotoUrls = await uploadPhotos(inserted.id);
        const { error: updateErr } = await supabase
          .from("anuncios")
          .update({ fotos: fotoUrls, destaque: true })
          .eq("id", inserted.id);
        if (updateErr) throw updateErr;
        // Marquer le token de paiement comme utilisé
        await fetch("/api/consume-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_id: paymentId, anuncio_id: inserted.id }),
        });
      }

      // 3. Reset & refresh
      setShowForm(false);
      setFormSuccess(true);
      setForm({ apelido:"",estado:"",cidade:"",sexo:"",posicao:[],busca:[],praticas:[],descricao:"",elementId:"",wantFotos:false });
      setPaymentId(null);
      setPaymentStatus("idle");
      if (stopPollingRef.current) stopPollingRef.current();
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setUploadProgress(0);
      fetchAds();
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (e) {
      setFormError("Erro ao publicar: " + (e.message || "tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleArr(arr, val) {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <div className="logo" onClick={() => { setShowForm(false); setSelectedAd(null); }}>
              <span className="logo-icon">⛓</span>
              <div>
                <span style={{background:"linear-gradient(135deg,#009c3b,#ffdf00,#002776)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontFamily:"var(--font-head)",fontSize:"1.3rem",letterSpacing:"0.12em",fontWeight:"700"}}>BDSMBRAZIL</span>
                <span style={{color:"var(--text2)",fontSize:"0.75rem",display:"block",letterSpacing:"0.2em"}}>anúncios • brasil</span>
              </div>
            </div>
            <nav className="header-nav">
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setSelectedAd(null); }}>Anúncios</button>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Publicar Anúncio</button>
            </nav>
          </div>
        </header>

        {/* HERO */}
        <div className="hero">
          <div className="hero-ornament">✦ ⛓ ✦</div>
          <h1>Encontre sua Conexão</h1>
          <p>Anúncios anônimos para a comunidade BDSM brasileira</p>
          <div className="hero-stats">
            <div className="stat"><div className="stat-num">{total}</div><div className="stat-label">Anúncios</div></div>
            <div className="stat"><div className="stat-num">100%</div><div className="stat-label">Anônimo</div></div>
            <div className="stat"><div className="stat-num">27</div><div className="stat-label">Estados</div></div>
          </div>
        </div>

        {formSuccess && (
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 2rem"}}>
            <div className="alert alert-success">✓ Seu anúncio foi publicado com sucesso!</div>
          </div>
        )}

        {/* ── FORM MODAL ────────────────────────────────────────────────────── */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✦ Publicar Anúncio</h2>
                <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">Seu anúncio é totalmente anônimo. Nenhum dado pessoal é coletado.</div>
                {formError && <div className="alert alert-error">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">Apelido *</label>
                  <input className="form-input" placeholder="Como deseja ser chamado(a)" value={form.apelido} onChange={e => setForm({...form,apelido:e.target.value})} />
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                  <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select className="form-select" value={form.estado} onChange={e => setForm({...form,estado:e.target.value,cidade:""})}>
                      <option value="">Selecione</option>
                      {ESTADOS.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cidade <span style={{color:"var(--text3)",fontWeight:"normal",fontSize:"0.7rem"}}>(opcional)</span></label>
                    <input className="form-input" placeholder="Sua cidade" value={form.cidade} onChange={e => setForm({...form,cidade:e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gênero *</label>
                  <select className="form-select" value={form.sexo} onChange={e => setForm({...form,sexo:e.target.value})}>
                    <option value="">Selecione</option>
                    {SEXOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sua posição no BDSM *</label>
                  <div className="checkbox-grid">
                    {POSICOES.map(p => (
                      <label key={p} className="form-check">
                        <input type="checkbox" checked={form.posicao.includes(p)} onChange={() => setForm({...form,posicao:toggleArr(form.posicao,p)})} />{p}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">O que você busca</label>
                  <div className="checkbox-grid">
                    {BUSCAS.map(b => (
                      <label key={b} className="form-check">
                        <input type="checkbox" checked={form.busca.includes(b)} onChange={() => setForm({...form,busca:toggleArr(form.busca,b)})} />{b}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Práticas de interesse</label>
                  <div className="checkbox-grid">
                    {PRATICAS.map(p => (
                      <label key={p} className="form-check">
                        <input type="checkbox" checked={form.praticas.includes(p)} onChange={() => setForm({...form,praticas:toggleArr(form.praticas,p)})} />{p}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <textarea className="form-textarea" placeholder="Apresente-se, descreva o que busca..." value={form.descricao} onChange={e => setForm({...form,descricao:e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Seu ID no Element/Matrix *</label>
                  <input className="form-input" placeholder="@seunome:matrix.org" value={form.elementId} onChange={e => setForm({...form,elementId:e.target.value})} />
                  <p className="form-hint">Quem responder ao seu anúncio abrirá o Element direto no seu perfil.</p>
                </div>

                <hr className="divider" />

                {/* FOTOS PAYANTES */}
                <div className="form-group">
                  <label className="form-label">📸 Adicionar fotos (opcional)</label>
                  <div className="paypal-box">
                    <h4>✦ Anúncio com fotos — R$ 10,00</h4>
                    <p>Adicione até 1 foto diretamente no seu anúncio. Após o pagamento via PayPal, faça o upload abaixo.</p>

                    <label className="form-check" style={{marginBottom:"0.8rem"}}>
                      <input type="checkbox" checked={form.wantFotos} onChange={() => setForm({...form,wantFotos:!form.wantFotos,paypalDone:false})} />
                      Quero adicionar fotos (R$ 10,00)
                    </label>

                    {form.wantFotos && (
                      <>
                        {paymentStatus === "idle" && (
                          <div>
                            <button className="btn btn-gold" style={{width:"100%"}} onClick={() => {
                              const pid = crypto.randomUUID();
                              setPaymentId(pid);
                              setPaymentStatus("waiting");
                              startPaypalPolling(
                                pid,
                                () => setPaymentStatus("verified"),
                                () => setPaymentStatus("timeout"),
                                stopPollingRef
                              );
                            }}>
                              💳 Pagar R$ 10,00 via PayPal
                            </button>
                            <p style={{fontSize:"0.8rem",color:"var(--text3)",marginTop:"0.5rem",fontStyle:"italic"}}>
                              Um UUID unique sera gerado pour identifier votre paiement. Após o pagamento, o upload será liberado automaticamente.
                            </p>
                          </div>
                        )}
                        {paymentStatus === "waiting" && (
                          <div className="alert alert-info" style={{display:"flex",alignItems:"center",gap:"12px"}}>
                            <div className="loading-spinner" style={{width:"20px",height:"20px",flexShrink:0}} />
                            Aguardando confirmação do pagamento PayPal...
                            <button className="btn btn-ghost" style={{marginLeft:"auto",fontSize:"0.7rem"}} onClick={() => { setPaymentStatus("idle"); if(stopPollingRef.current) stopPollingRef.current(); }}>Cancelar</button>
                          </div>
                        )}
                        {paymentStatus === "timeout" && (
                          <div>
                            <div className="alert alert-error" style={{marginBottom:"0.8rem"}}>⚠ Pagamento não detectado após 10 minutos. Tente novamente.</div>
                            <button className="btn btn-ghost" style={{width:"100%"}} onClick={() => setPaymentStatus("idle")}>Tentar novamente</button>
                          </div>
                        )}
                        {paymentStatus === "verified" && (
                          <div>
                            <div className="alert alert-success" style={{marginBottom:"0.8rem"}}>✓ Pagamento confirmado — faça o upload das suas fotos abaixo.</div>
                            <label className="upload-zone">
                              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} disabled={photoFiles.length >= 1} />
                              <p>{photoFiles.length >= 1 ? "Máximo de 1 foto atingido" : `Clique para selecionar foto (${photoFiles.length}/1)`}</p>
                            </label>
                            {photoPreviews.length > 0 && (
                              <div className="upload-previews">
                                {photoPreviews.map((src, i) => (
                                  <div key={i} className="upload-preview">
                                    <img src={src} alt="" />
                                    <button className="upload-preview-remove" onClick={() => removePhoto(i)}>×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="progress-bar"><div className="progress-bar-inner" style={{width:uploadProgress+"%"}} /></div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <button className="btn btn-primary" style={{width:"100%",padding:"12px"}} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Publicando..." : "Publicar Anúncio Gratuito"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── AD DETAIL MODAL ───────────────────────────────────────────────── */}
        {selectedAd && (
          <div className="modal-overlay" onClick={() => setSelectedAd(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedAd.apelido}</h2>
                <button className="modal-close" onClick={() => setSelectedAd(null)}>×</button>
              </div>
              <div className="modal-body">
                {selectedAd.fotos?.length > 0 && (
                  <div className="modal-fotos">
                    {selectedAd.fotos.map((f,i) => <img key={i} src={f} className="modal-foto" alt="" />)}
                  </div>
                )}
                <div className="ad-meta" style={{marginBottom:"1rem"}}>
                  <span className="meta-tag">📍 {selectedAd.cidade ? `${selectedAd.cidade}, ` : ""}{selectedAd.estado}</span>
                  <span className="meta-tag">⚧ {selectedAd.sexo}</span>
                  <span className="meta-tag">🗓 {formatDate(selectedAd.created_at)}</span>
                </div>
                <div className="ad-badges" style={{marginBottom:"1rem"}}>
                  {selectedAd.posicao?.map(p => <span key={p} className="badge" style={getBadgeStyle(p)}>{p}</span>)}
                  {selectedAd.busca?.length > 0 && <span style={{color:"var(--text3)",fontSize:"0.82rem",alignSelf:"center"}}>busca:</span>}
                  {selectedAd.busca?.map(b => <span key={b} className="badge" style={{...getBadgeStyle(b),opacity:0.7}}>{b}</span>)}
                </div>
                <p style={{color:"var(--text2)",lineHeight:1.7,marginBottom:"1rem"}}>{selectedAd.descricao}</p>
                {selectedAd.praticas?.length > 0 && (
                  <div className="ad-praticas">{selectedAd.praticas.map(p => <span key={p} className="pratica-tag">{p}</span>)}</div>
                )}
                <hr className="divider" />
                <div className="element-box">
                  <p>Para responder a este anúncio, clique abaixo para abrir uma conversa privada e criptografada:</p>
                  <div className="element-id">{selectedAd.element_id}</div>
                  <button className="btn-element" onClick={() => openElement(selectedAd.element_id)}>💬 Contatar via Element</button>
                  <p style={{fontSize:"0.78rem",color:"var(--text3)",marginTop:"0.6rem"}}>Sua identidade permanece anônima. Conversa criptografada E2E.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN ─────────────────────────────────────────────────────────── */}
        <div className="main">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="filter-box">
              <h3>Filtros</h3>
              <select className="filter-select" value={filters.estado} onChange={e => setFilters({...filters,estado:e.target.value,cidade:""})}>
                <option value="">Todos os estados</option>
                {ESTADOS.map(e => <option key={e}>{e}</option>)}
              </select>
              <input className="filter-input" placeholder="Cidade..." value={filters.cidade} onChange={e => setFilters({...filters,cidade:e.target.value})} />
              <select className="filter-select" value={filters.sexo} onChange={e => setFilters({...filters,sexo:e.target.value})}>
                <option value="">Todos os gêneros</option>
                {SEXOS.map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="btn btn-ghost" style={{width:"100%",marginTop:"4px"}} onClick={() => setFilters({estado:"",cidade:"",sexo:"",posicao:[],busca:[]})}>
                Limpar filtros
              </button>
            </div>

            <div className="filter-box">
              <h3>Posição</h3>
              <div className="filter-checkgroup">
                {POSICOES.map(p => (
                  <label key={p} className="check-label">
                    <input type="checkbox" checked={filters.posicao.includes(p)} onChange={() => setFilters({...filters,posicao:toggleArr(filters.posicao,p)})} />{p}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-box">
              <h3>Busca</h3>
              <div className="filter-checkgroup">
                {BUSCAS.slice(0,10).map(b => (
                  <label key={b} className="check-label">
                    <input type="checkbox" checked={filters.busca.includes(b)} onChange={() => setFilters({...filters,busca:toggleArr(filters.busca,b)})} />{b}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* ANNONCES */}
          <div>
            <div className="ads-header">
              <h2>Anúncios <span className="ads-count">({total})</span></h2>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Publicar</button>
            </div>

            {loading ? (
              <div className="loading">
                <div className="loading-spinner" />
                <div>Carregando anúncios...</div>
              </div>
            ) : loadError ? (
              <div className="alert alert-error">{loadError} <button className="btn btn-ghost" style={{marginLeft:"1rem"}} onClick={fetchAds}>Tentar novamente</button></div>
            ) : ads.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">⛓</div>
                <p>Nenhum anúncio encontrado com esses filtros.</p>
              </div>
            ) : (
              <div className="ads-grid">
                {ads.map(ad => (
                  <div key={ad.id} className={`ad-card ${ad.destaque ? "destaque" : ""} ${ad.fotos?.length > 0 ? "has-fotos" : ""}`} onClick={() => setSelectedAd(ad)}>
                    <div className="ad-card-inner">
                      {ad.fotos?.length > 0 && <img src={ad.fotos[0]} className="ad-photo" alt="" />}
                      <div className="ad-body">
                        <div className="ad-top">
                          <span className="ad-apelido">{ad.apelido}</span>
                          {ad.destaque && <span className="destaque-badge">✦ DESTAQUE</span>}
                        </div>
                        <div className="ad-meta">
                          <span className="meta-tag">📍 {ad.cidade ? `${ad.cidade}, ` : ""}{ad.estado}</span>
                          <span className="meta-tag">⚧ {ad.sexo}</span>
                        </div>
                        <div className="ad-badges">
                          {ad.posicao?.map(p => <span key={p} className="badge" style={getBadgeStyle(p)}>{p}</span>)}
                        </div>
                        <p className="ad-desc">{ad.descricao}</p>
                        <div className="ad-praticas">
                          {ad.praticas?.slice(0,4).map(p => <span key={p} className="pratica-tag">{p}</span>)}
                        </div>
                        <div className="ad-footer">
                          <span className="ad-date">{formatDate(ad.created_at)}</span>
                          <button className="btn-contact" onClick={e => { e.stopPropagation(); openElement(ad.element_id); }}>💬 Contatar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ELEMENT TUTORIAL */}
        <div className="section-full" style={{borderTopColor:"var(--gold)"}}>
          <h2 style={{marginBottom:"1.5rem"}}>📱 Como usar o Element / Matrix</h2>
          <div style={{marginBottom:"2rem"}}>
            <h3 style={{fontFamily:"var(--font-head)",fontSize:"0.9rem",letterSpacing:"0.12em",color:"var(--accent3)",marginBottom:"0.8rem",textTransform:"uppercase"}}>① Baixe o aplicativo</h3>
            <p style={{color:"var(--text2)",marginBottom:"1rem"}}>O Element é gratuito e disponível em todas as plataformas:</p>
            <div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
              {[
                ["🍎","App Store (iPhone / iPad)","https://apps.apple.com/app/element-messenger/id1083446067"],
                ["🤖","Google Play (Android)","https://play.google.com/store/apps/details?id=im.vector.app"],
                ["🌐","Versão Web (navegador)","https://app.element.io"],
              ].map(([icon,label,href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                  <button className="btn btn-ghost" style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 18px"}}>
                    <span style={{fontSize:"1.2rem"}}>{icon}</span> {label}
                  </button>
                </a>
              ))}
            </div>
          </div>
          <div style={{marginBottom:"2rem"}}>
            <h3 style={{fontFamily:"var(--font-head)",fontSize:"0.9rem",letterSpacing:"0.12em",color:"var(--accent3)",marginBottom:"0.8rem",textTransform:"uppercase"}}>② Crie sua conta anônima</h3>
            <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"4px",padding:"1.2rem",display:"grid",gap:"0.7rem"}}>
              {[["1","Abra o Element e toque em Criar conta."],["2","Escolha o servidor matrix.org (padrão) ou envs.net para mais privacidade."],["3","Escolha um nome de usuário anônimo — não use seu nome real. Ex: gatinha_sp, rigger_bh..."],["4","Adicione um e-mail de recuperação (opcional) e uma senha forte."],["5","Pronto! Sua conta está criada e é completamente anônima."]].map(([n,txt]) => (
                <div key={n} style={{display:"flex",gap:"12px",alignItems:"flex-start"}}>
                  <span style={{fontFamily:"var(--font-head)",fontSize:"0.75rem",background:"var(--accent)",color:"white",borderRadius:"50%",width:"22px",height:"22px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>{n}</span>
                  <span style={{color:"var(--text2)",fontSize:"0.92rem"}}>{txt}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginBottom:"2rem"}}>
            <h3 style={{fontFamily:"var(--font-head)",fontSize:"0.9rem",letterSpacing:"0.12em",color:"var(--accent3)",marginBottom:"0.8rem",textTransform:"uppercase"}}>③ Encontre seu ID para o anúncio</h3>
            <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"4px",padding:"1.2rem",display:"grid",gap:"0.7rem",marginBottom:"1rem"}}>
              {[["1","Toque na sua foto de perfil ou inicial no canto superior esquerdo."],["2","Vá em Configurações → Perfil."],["3","Copie seu ID Matrix no formato @seuapelido:matrix.org"],["4","Cole esse ID no campo correspondente ao publicar seu anúncio aqui."]].map(([n,txt]) => (
                <div key={n} style={{display:"flex",gap:"12px",alignItems:"flex-start"}}>
                  <span style={{fontFamily:"var(--font-head)",fontSize:"0.75rem",background:"var(--gold)",color:"#0a0608",borderRadius:"50%",width:"22px",height:"22px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>{n}</span>
                  <span style={{color:"var(--text2)",fontSize:"0.92rem"}}>{txt}</span>
                </div>
              ))}
            </div>
            <div style={{background:"var(--surface3)",border:"1px dashed var(--gold)",borderRadius:"4px",padding:"1rem",display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"1.4rem"}}>💡</span>
              <div>
                <p style={{color:"var(--gold2)",fontFamily:"var(--font-head)",fontSize:"0.8rem",letterSpacing:"0.08em",marginBottom:"0.3rem"}}>Exemplo de ID válido:</p>
                <code style={{fontFamily:"'Courier New',monospace",color:"var(--accent3)",fontSize:"0.95rem"}}>@gatinha_sp:matrix.org</code>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{fontFamily:"var(--font-head)",fontSize:"0.9rem",letterSpacing:"0.12em",color:"var(--accent3)",marginBottom:"0.8rem",textTransform:"uppercase"}}>④ Como funciona o contato</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"12px"}}>
              {[["🔒","Criptografia E2E","Mensagens visíveis apenas para você e seu interlocutor."],["👤","Zero dados pessoais","Nenhum nome real, telefone ou e-mail exposto."],["🗑","Mensagens efêmeras","Ative o autodelete de mensagens no Element."],["🌐","Sem número de telefone","Ao contrário do WhatsApp, o Element não exige seu número."]].map(([icon,title,desc]) => (
                <div key={title} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"4px",padding:"1rem"}}>
                  <div style={{fontSize:"1.5rem",marginBottom:"0.4rem"}}>{icon}</div>
                  <div style={{fontFamily:"var(--font-head)",fontSize:"0.78rem",color:"var(--gold)",letterSpacing:"0.08em",marginBottom:"0.3rem"}}>{title}</div>
                  <div style={{color:"var(--text3)",fontSize:"0.83rem"}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="section-full">
          <h2>Como funciona</h2>
          <p>Todos os anúncios são gratuitos e anônimos. Para contatar um anunciante, clique em "Contatar" — isso abrirá o Element diretamente na conversa criptografada.</p>
          <p>Quer adicionar fotos? Por apenas R$ 10,00 via PayPal, você pode incluir até 1 foto no seu anúncio.</p>
          <p style={{color:"var(--text3)",fontSize:"0.85rem",fontStyle:"italic"}}>Este espaço é dedicado a adultos (+18). Ao publicar ou responder anúncios, você confirma ser maior de idade e declara agir de forma consensual e respeitosa.</p>
        </div>

        <footer className="footer">
          <p>✦ BDSMBRAZIL — Anúncios BDSM Anônimos no Brasil ✦</p>
          <p>Comunicação via <a href="https://element.io" target="_blank" rel="noopener">Element / Matrix</a> — 100% criptografada e anônima</p>
          <p style={{marginTop:"0.5rem"}}>+18 apenas · Consentimento sempre · Seja SSC ou RACK</p>
        </footer>
      </div>
    </>
  );
}
