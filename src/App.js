import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 🔒 CONFIGURATION SUPABASE ---
const supabaseUrl = 'https://wblginsktosypbmhmgbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibGdpbnNrdG9zeXBibWhtZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjU3NTYsImV4cCI6MjA4OTk0MTc1Nn0.pmysPmutGjW2Tw7jFvrBE_0ue2pZmS32Pjncu1Rmr8w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOGO_URL = "https://wblginsktosypbmhmgbr.supabase.co/storage/v1/object/public/Hakimi%20logo/hakimi.jpg";

// --- 🛠 UTILITAIRES ---
const safeNum = (val) => { if (val === null || val === undefined || val === '') return 0; const n = Number(val); return isNaN(n) ? 0 : n; };
const formatAr = (val) => safeNum(val).toLocaleString('fr-FR');
const formatDate = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('fr-FR'); };
const formatDateTime = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : d.toLocaleString('fr-FR'); };
const formatHeureMessage = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : `le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`; };

// --- 🖨 MOTEUR D'IMPRESSION ---
const lancerImpression = (type, data, params) => {
  const isTicket = data.printSize === '58mm' || data.printSize === '80mm';
  const win = window.open('', '', isTicket ? 'width=350,height=600' : 'width=800,height=900');
  if (!win) { alert("⚠️ Autorisez les Pop-ups."); return; }

  const panierList = Array.isArray(data.panier) ? data.panier : [];
  const getLineData = (i) => {
    const pU = safeNum(i.prix_unitaire || i.prix_vente);
    const rU = safeNum(i.remise_unitaire_ar || i.remise_montant);
    const qte = safeNum(i.qte);
    return { pU, rU, qte, total: safeNum(i.total_ligne || (pU - rU) * qte) };
  };

  const html = `
    <html><head><title>${data.numero || 'Facture'}</title><style>
      body { font-family: monospace; padding: 10px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border-bottom: 1px dashed #ccc; padding: 5px; text-align: left; }
      .total { text-align: right; margin-top: 10px; font-weight: bold; }
    </style></head><body>
      <center><img src="${LOGO_URL}" style="max-width:150px;"/><br/><h2>${params.nom_entreprise || 'HAKIMI PLUS'}</h2></center>
      <p><b>${type.toUpperCase()} : ${data.numero || ''}</b><br/>Date: ${formatDateTime(data.date)}<br/>Client: ${data.client_nom}</p>
      <hr/>
      <table><thead><tr><th>Art.</th><th>Qté</th><th>Total</th></tr></thead>
      <tbody>${panierList.map(i => { const d = getLineData(i); return `<tr><td>${i.nom}</td><td>${d.qte}</td><td>${formatAr(d.total)}</td></tr>`; }).join('')}</tbody></table>
      <div class="total">NET À PAYER : ${formatAr(safeNum(data.totalNet) + safeNum(data.fraisLivraison))} Ar</div>
    </body></html>`;
  win.document.write(html); win.document.close(); setTimeout(() => { win.print(); }, 800);
};

// --- 🏠 COMPOSANT PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(() => { const saved = localStorage.getItem('hakimi_user'); return saved ? JSON.parse(saved) : null; });
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [msgNonLus, setMsgNonLus] = useState(0);
  const [parametres, setParametres] = useState({});
  const [categoriesDb, setCategoriesDb] = useState([]);
  const [alertesStockDLC, setAlertesStockDLC] = useState([]);

  useEffect(() => {
    const init = async () => {
      const { data: p } = await supabase.from('parametres').select('*').eq('id', 1).single();
      if (p) setParametres(p);
      const { data: c } = await supabase.from('categories').select('nom').order('nom');
      if (c) setCategoriesDb(c.map(i => i.nom));
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      const check = async () => {
        const { count } = await supabase.from('messagerie').select('*', { count: 'exact', head: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
        setMsgNonLus(count || 0);
        const { data: prods } = await supabase.from('produits').select('nom, stock_actuel').lt('stock_actuel', 5);
        if (prods) setAlertesStockDLC(prods.map(p => `${p.nom} : Stock critique (${p.stock_actuel})`));
      };
      check();
    }
  }, [user, view]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#800020] animate-pulse">HAKIMI PLUS...</div>;
  if (!user) return <LoginScreen onLogin={(u) => { localStorage.setItem('hakimi_user', JSON.stringify(u)); setUser(u); }} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <nav className="w-full md:w-64 bg-[#800020] text-white p-6 flex flex-col shrink-0">
        <h1 className="text-xl font-black italic mb-8 border-b border-white/20 pb-4 text-center">HAKIMI PLUS</h1>
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <NavBtn active={view==='caisse'} onClick={()=>setView('caisse')}>🛒 Caisse</NavBtn>
          <NavBtn active={view==='commandes_web'} onClick={()=>setView('commandes_web')}>🌐 Commandes Web</NavBtn>
          <NavBtn active={view==='admin_stock'} onClick={()=>setView('admin_stock')}>📦 Stock & Web</NavBtn>
          <NavBtn active={view==='historique'} onClick={()=>setView('historique')}>📅 Historique</NavBtn>
          {user.role === 'superadmin' && (
            <>
              <hr className="my-2 opacity-20"/>
              <NavBtn active={view==='dashboard'} onClick={()=>setView('dashboard')}>📊 Dashboard</NavBtn>
              <NavBtn active={view==='gestion_site'} onClick={()=>setView('gestion_site')}>🎨 Config Site</NavBtn>
              <NavBtn active={view==='clients'} onClick={()=>setView('clients')}>👥 Clients</NavBtn>
              <NavBtn active={view==='depenses'} onClick={()=>setView('depenses')}>💸 Dépenses</NavBtn>
              <NavBtn active={view==='suivi_credits'} onClick={()=>setView('suivi_credits')}>📉 Dettes</NavBtn>
              <NavBtn active={view==='admin_utilisateurs'} onClick={()=>setView('admin_utilisateurs')}>🔐 Utilisateurs</NavBtn>
            </>
          )}
        </div>
        <button onClick={()=>{localStorage.removeItem('hakimi_user'); setUser(null);}} className="mt-4 p-3 bg-white/10 rounded-xl font-bold hover:bg-red-600 transition">Déconnexion</button>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {view === 'caisse' && <ModuleVente params={parametres} categoriesDb={categoriesDb} />}
        {view === 'commandes_web' && <ModuleCommandesWeb />}
        {view === 'admin_stock' && <AdminStock categoriesDb={categoriesDb} />}
        {view === 'gestion_site' && <ModuleGestionSite />}
        {view === 'dashboard' && <AdminDashboard />}
        {view === 'historique' && <ModuleHistorique params={parametres} />}
        {view === 'clients' && <ModuleClients />}
        {view === 'depenses' && <ModuleDepenses />}
        {view === 'suivi_credits' && <SuiviCredits params={parametres} />}
        {view === 'admin_utilisateurs' && <AdminUtilisateurs />}
      </main>
    </div>
  );
}

const NavBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`p-3 rounded-xl text-left font-bold text-sm transition-all ${active ? 'bg-white text-[#800020] shadow-lg' : 'hover:bg-white/10 text-white/80'}`}>{children}</button>
);

// --- 🧩 MODULE VENTE ---
const ModuleVente = ({ params, categoriesDb }) => {
  const [prods, setProds] = useState([]);
  const [panier, setPanier] = useState([]);
  const [search, setSearch] = useState('');
  const [selCat, setSelCat] = useState('');

  const load = async () => { const { data } = await supabase.from('produits').select('*').gt('stock_actuel', 0).order('nom'); setProds(data || []); };
  useEffect(() => { load(); }, []);

  const total = panier.reduce((acc, i) => acc + (i.prix_vente * i.qte), 0);

  const ajouter = (p) => {
    const ex = panier.find(i => i.id === p.id);
    if (ex) setPanier(panier.map(i => i.id === p.id ? {...i, qte: i.qte + 1} : i));
    else setPanier([...panier, {...p, qte: 1}]);
  };

  const valider = async () => {
    if (panier.length === 0) return;
    for (let item of panier) { await supabase.rpc('decrement_stock_by_name', { p_nom: item.nom, amount: item.qte }); }
    await supabase.from('historique_ventes').insert([{ type_vente: 'CAISSE', montant_total: total, articles_liste: panier.map(i=>`${i.qte}x ${i.nom}`).join(', '), details_json: { articles: panier } }]);
    lancerImpression('caisse', { panier, totalNet: total, client_nom: 'Client Comptoir', date: new Date(), printSize: '58mm' }, params);
    setPanier([]); load(); alert("Vente Validée !");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex gap-2 mb-4">
          <input className="flex-1 p-3 bg-gray-50 border rounded-xl" placeholder="🔍 Chercher..." onChange={e=>setSearch(e.target.value)} />
          <select className="p-3 bg-gray-50 border rounded-xl" onChange={e=>setSelCat(e.target.value)}>
            <option value="">Tous</option>
            {categoriesDb.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-2">
          {prods.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()) && (selCat==='' || p.categorie === selCat)).map(p => (
            <button key={p.id} onClick={()=>ajouter(p)} className="p-4 border rounded-2xl text-left hover:border-[#800020] transition group">
              <p className="font-bold text-sm uppercase truncate">{p.nom}</p>
              <p className="text-[#800020] font-black">{formatAr(p.prix_vente)} Ar</p>
              <p className="text-[10px] text-gray-400">Stock: {p.stock_actuel}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-[#800020] text-white p-6 rounded-[2.5rem] shadow-xl flex flex-col">
        <h3 className="font-black uppercase mb-4 tracking-widest">Panier Actuel</h3>
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {panier.map(i => (
            <div key={i.id} className="flex justify-between items-center bg-white/10 p-3 rounded-xl border border-white/10">
              <div className="flex-1"><p className="font-bold text-sm">{i.nom}</p><p className="text-xs opacity-60">{i.qte} x {formatAr(i.prix_vente)}</p></div>
              <button onClick={()=>setPanier(panier.filter(x=>x.id!==i.id))} className="ml-4 text-xs bg-red-500/20 px-2 py-1 rounded">Suppr</button>
            </div>
          ))}
        </div>
        <div className="border-t border-white/20 pt-4">
          <div className="flex justify-between items-end mb-4"><span className="text-xs font-bold uppercase opacity-60">Total à payer</span><span className="text-3xl font-black tracking-tighter">{formatAr(total)} Ar</span></div>
          <button onClick={valider} className="w-full p-4 bg-white text-[#800020] rounded-2xl font-black uppercase shadow-xl hover:bg-gray-100 transition">Valider l'encaissement</button>
        </div>
      </div>
    </div>
  );
};

// --- 🧩 MODULE STOCK ---
const AdminStock = ({ categoriesDb }) => {
  const [prods, setProds] = useState([]);
  const [catsWeb, setCatsWeb] = useState([]);
  const [form, setForm] = useState({ nom: '', prix_v: '', stock: '', afficher_web: false, categorie_web: '' });

  const load = async () => {
    const { data: p } = await supabase.from('produits').select('*').order('nom');
    const { data: cw } = await supabase.from('categories_web').select('nom');
    setProds(p || []); setCatsWeb(cw || []);
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    await supabase.from('produits').insert([{ nom: form.nom, prix_vente: safeNum(form.prix_v), stock_actuel: safeNum(form.stock), afficher_web: form.afficher_web, categorie_web: form.categorie_web }]);
    setForm({ nom: '', prix_v: '', stock: '', afficher_web: false, categorie_web: '' }); load(); alert("Produit ajouté !");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Ajouter une référence</h2>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="p-3 border rounded-xl" placeholder="Désignation" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required/>
          <input className="p-3 border rounded-xl" type="number" placeholder="Prix Vente (Ar)" value={form.prix_v} onChange={e=>setForm({...form, prix_v: e.target.value})} required/>
          <input className="p-3 border rounded-xl" type="number" placeholder="Stock Initial" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required/>
          <div className="md:col-span-2 flex items-center gap-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <label className="flex items-center gap-2 font-bold text-blue-900 text-xs"><input type="checkbox" checked={form.afficher_web} onChange={e=>setForm({...form, afficher_web: e.target.checked})}/> Afficher sur le Site Web</label>
            {form.afficher_web && (
              <select className="flex-1 p-2 bg-white border rounded-lg text-xs font-bold" value={form.categorie_web} onChange={e=>setForm({...form, categorie_web: e.target.value})}>
                <option value="">Choisir Catégorie Web</option>
                {catsWeb.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
              </select>
            )}
          </div>
          <button className="bg-[#800020] text-white rounded-xl font-black uppercase text-xs">Enregistrer</button>
        </form>
      </div>
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400"><tr><th className="p-4">Produit</th><th>Prix</th><th className="text-center">Stock</th><th className="text-center">Web</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{prods.map(p => (
            <tr key={p.id} className="hover:bg-gray-50 transition">
              <td className="p-4 font-bold text-sm">{p.nom}</td>
              <td className="p-4 font-black text-[#800020]">{formatAr(p.prix_vente)}</td>
              <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-black text-white ${p.stock_actuel < 5 ? 'bg-red-500' : 'bg-green-500'}`}>{p.stock_actuel}</span></td>
              <td className="p-4 text-center">{p.afficher_web ? '✅' : '❌'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

// --- 🧩 MODULE COMMANDES WEB ---
const ModuleCommandesWeb = () => {
  const [cmds, setCmds] = useState([]);
  const load = async () => { const { data } = await supabase.from('commandes_web').select('*').order('date_commande', { ascending: false }); setCmds(data || []); };
  useEffect(() => { load(); }, []);

  const valider = async (c) => {
    if (!window.confirm("Valider cette commande ?")) return;
    for (let a of c.articles_json.articles) { await supabase.rpc('decrement_stock_by_name', { p_nom: a.nom, amount: Number(a.qte) }); }
    await supabase.from('historique_ventes').insert([{ type_vente: 'SITE_WEB', montant_total: c.montant_total, client_nom: c.client_nom, articles_liste: c.articles_json.articles.map(a=>`${a.qte}x ${a.nom}`).join(', '), methode_paiement: c.articles_json.methode_paiement }]);
    await supabase.from('commandes_web').update({ statut: 'Validée' }).eq('id', c.id);
    load(); alert("Commande Validée et Facturée !");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-2xl font-black text-[#800020] uppercase border-b-2 border-[#800020] pb-2">Commandes Site Web</h2>
      {cmds.map(c => (
        <div key={c.id} className={`bg-white p-6 rounded-3xl shadow-sm border-l-8 ${c.statut==='Validée'?'border-green-500 opacity-60':'border-blue-600'}`}>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="font-black text-lg uppercase">{c.client_nom} <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded ml-2">📍 {c.quartier}</span></p>
              <p className="text-sm font-bold text-blue-600">📞 {c.client_whatsapp} | 💳 {c.articles_json?.methode_paiement}</p>
              <div className="mt-3 flex flex-wrap gap-2">{c.articles_json?.articles.map((a,i)=><span key={i} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded">{a.qte}x {a.nom}</span>)}</div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#800020]">{formatAr(Number(c.montant_total) + Number(c.frais_livraison))} Ar</p>
              {c.statut === 'En attente' ? <button onClick={()=>valider(c)} className="mt-4 bg-[#800020] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">Valider & Facturer</button> : <span className="font-black text-green-600">TRAITÉE ✅</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 🧩 MODULE GESTION SITE ---
const ModuleGestionSite = () => {
  const [config, setConfig] = useState({ carousel_urls: ["", "", ""], texte_livraison: "", texte_conditions: "", quartiers_json: [] });
  const load = async () => { const { data } = await supabase.from('parametres_web').select('*').eq('id', 1).single(); if (data) setConfig({...data, quartiers_json: data.quartiers_json || []}); };
  useEffect(() => { load(); }, []);

  const save = async () => { await supabase.from('parametres_web').update(config).eq('id', 1); alert("Site Hakimi Plus mis à jour !"); };
  const addQ = () => setConfig({...config, quartiers_json: [...config.quartiers_json, {nom: '', frais: 0}]});

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-sm border">
      <h2 className="text-xl font-black uppercase text-[#800020] mb-6">Configuration de la boutique en ligne</h2>
      <div className="space-y-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <div className="flex justify-between items-center mb-4"><h3 className="font-bold uppercase text-xs">📍 Zones de Livraison</h3><button onClick={addQ} className="bg-[#800020] text-white px-3 py-1 rounded text-[10px]">+ Ajouter</button></div>
          <div className="space-y-2">{config.quartiers_json.map((q, i) => (
            <div key={i} className="flex gap-2 bg-white p-2 rounded-lg border">
              <input className="flex-1 p-2 bg-gray-50 border rounded text-xs" value={q.nom} onChange={e=>{const n=[...config.quartiers_json]; n[i].nom=e.target.value; setConfig({...config, quartiers_json: n})}} placeholder="Quartier"/>
              <input className="w-24 p-2 bg-gray-50 border rounded text-xs font-bold" type="number" value={q.frais} onChange={e=>{const n=[...config.quartiers_json]; n[i].frais=Number(e.target.value); setConfig({...config, quartiers_json: n})}} placeholder="Frais"/>
            </div>
          ))}</div>
        </div>
        <button onClick={save} className="w-full bg-[#800020] text-white p-4 rounded-2xl font-black uppercase shadow-xl hover:bg-black transition">Enregistrer les modifications</button>
      </div>
    </div>
  );
};

// --- 🧩 MODULE DASHBOARD ---
const AdminDashboard = () => {
  const [ventes, setVentes] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const load = async () => {
    const { data: v } = await supabase.from('historique_ventes').select('*');
    const { data: d } = await supabase.from('depenses').select('*');
    setVentes(v || []); setDepenses(d || []);
  };
  useEffect(() => { load(); }, []);

  const totalCA = ventes.reduce((acc, v) => acc + safeNum(v.montant_total), 0);
  const totalDep = depenses.reduce((acc, d) => acc + safeNum(d.montant), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020]">Tableau de Bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-[#800020]"><p className="text-xs font-bold text-gray-400 uppercase">Chiffre d'Affaires</p><p className="text-2xl font-black">{formatAr(totalCA)} Ar</p></div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-red-500"><p className="text-xs font-bold text-gray-400 uppercase">Dépenses Total</p><p className="text-2xl font-black text-red-600">{formatAr(totalDep)} Ar</p></div>
        <div className="bg-green-600 p-6 rounded-3xl shadow-lg text-white border-l-8 border-green-800"><p className="text-xs font-bold uppercase opacity-80">Bénéfice Théorique</p><p className="text-2xl font-black">{formatAr(totalCA - totalDep)} Ar</p></div>
      </div>
    </div>
  );
};

// --- 🧩 MODULE HISTORIQUE ---
const ModuleHistorique = ({ params }) => {
  const [ventes, setVentes] = useState([]);
  const load = async () => { const { data } = await supabase.from('historique_ventes').select('*').order('date_vente', { ascending: false }); setVentes(data || []); };
  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-xl font-black uppercase border-b pb-2">Journal des Ventes</h2>
      {ventes.map(v => (
        <div key={v.id} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
          <div>
            <p className="font-bold text-sm uppercase">{v.client_nom || 'Comptoir'}</p>
            <p className="text-[10px] text-gray-400">{formatDateTime(v.date_vente)} | {v.type_vente}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-[#800020]">{formatAr(v.montant_total)} Ar</p>
            <button onClick={() => lancerImpression('Facture', { ...v, panier: v.details_json?.articles || [], totalNet: v.montant_total, date: v.date_vente, printSize: '58mm' }, params)} className="text-[10px] font-bold text-blue-600 underline">Ré-imprimer</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 🧩 MODULE CLIENTS ---
const ModuleClients = () => {
  const [clients, setClients] = useState([]);
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const load = async () => { const { data } = await supabase.from('clients').select('*').order('nom'); setClients(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await supabase.from('clients').insert([{ nom, telephone: tel }]);
    setNom(''); setTel(''); load(); alert("Client ajouté !");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm border flex gap-4">
        <input className="flex-1 p-3 border rounded-xl" placeholder="Nom du client" value={nom} onChange={e=>setNom(e.target.value)} required />
        <input className="w-48 p-3 border rounded-xl" placeholder="Téléphone" value={tel} onChange={e=>setTel(e.target.value)} />
        <button className="bg-[#800020] text-white px-6 rounded-xl font-bold">Ajouter</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clients.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center">
            <p className="font-bold uppercase text-sm">{c.nom}</p>
            <p className="text-xs font-black text-gray-400">{c.telephone}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 🧩 MODULE DÉPENSES ---
const ModuleDepenses = () => {
  const [dep, setDep] = useState([]);
  const [form, setForm] = useState({ desc: '', mont: '' });
  const load = async () => { const { data } = await supabase.from('depenses').select('*').order('date_depense', { ascending: false }); setDep(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await supabase.from('depenses').insert([{ description: form.desc, montant: safeNum(form.mont) }]);
    setForm({ desc: '', mont: '' }); load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm flex gap-2">
        <input className="flex-1 p-3 border rounded-xl" placeholder="Motif de dépense" value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} required/>
        <input className="w-32 p-3 border rounded-xl text-red-600 font-bold" type="number" placeholder="Montant" value={form.mont} onChange={e=>setForm({...form, mont: e.target.value})} required/>
        <button className="bg-red-600 text-white px-6 rounded-xl font-bold">OK</button>
      </form>
      <div className="space-y-2">
        {dep.map(d => (
          <div key={d.id} className="bg-white p-4 rounded-2xl border-l-8 border-red-500 flex justify-between items-center">
            <span className="font-bold uppercase text-xs">{d.description}</span>
            <span className="font-black text-red-600">-{formatAr(d.montant)} Ar</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 🧩 MODULE DETTES (SUIVI CRÉDITS) ---
const SuiviCredits = ({ params }) => {
  const [credits, setCredits] = useState([]);
  const load = async () => { const { data } = await supabase.from('credits').select('*').eq('statut', 'non_paye'); setCredits(data || []); };
  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-xl font-black text-red-600 uppercase">Dettes clients en cours</h2>
      {credits.map(c => (
        <div key={c.id} className="bg-white p-5 rounded-3xl shadow-sm border-l-8 border-red-600 flex justify-between items-center">
          <div><p className="font-black uppercase">{c.nom_client}</p><p className="text-[10px] opacity-50">Échéance : {formatDate(c.date_echeance)}</p></div>
          <p className="text-xl font-black text-red-600">{formatAr(c.montant_du)} Ar</p>
        </div>
      ))}
      {credits.length === 0 && <p className="text-center italic opacity-40 py-10">Aucune dette enregistrée.</p>}
    </div>
  );
};

// --- 🧩 MODULE UTILISATEURS ---
const AdminUtilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ id: '', mdp: '', role: 'vendeur' });
  const load = async () => { const { data } = await supabase.from('utilisateurs').select('*'); setUsers(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await supabase.from('utilisateurs').insert([{ identifiant: form.id, mot_de_passe: form.mdp, role: form.role }]);
    setForm({ id: '', mdp: '', role: 'vendeur' }); load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-4">
        <input className="p-3 border rounded-xl" placeholder="Identifiant" value={form.id} onChange={e=>setForm({...form, id: e.target.value})} required/>
        <input className="p-3 border rounded-xl" placeholder="Mot de passe" value={form.mdp} onChange={e=>setForm({...form, mdp: e.target.value})} required/>
        <select className="p-3 border rounded-xl font-bold" value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
          <option value="vendeur">Vendeur</option>
          <option value="superadmin">Super Admin</option>
        </select>
        <button className="bg-[#800020] text-white rounded-xl font-bold">Créer</button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white p-4 rounded-2xl border text-center">
            <p className="font-black uppercase">{u.identifiant}</p>
            <p className="text-[10px] opacity-40">{u.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 🧩 ÉCRAN CONNEXION ---
const LoginScreen = ({ onLogin }) => {
  const [creds, setCreds] = useState({ id: '', mdp: '' });
  const handle = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('utilisateurs').select('*').eq('identifiant', creds.id).eq('mot_de_passe', creds.mdp).single();
    if (data) onLogin(data); else alert("Identifiants incorrects !");
  };
  return (
    <div className="min-h-screen bg-[#800020] flex items-center justify-center p-4">
      <form onSubmit={handle} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-sm">
        <center><img src={LOGO_URL} className="h-16 mb-6"/></center>
        <div className="space-y-4">
          <input className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" placeholder="Identifiant" onChange={e=>setCreds({...creds, id: e.target.value})} required />
          <input className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" type="password" placeholder="Mot de passe" onChange={e=>setCreds({...creds, mdp: e.target.value})} required />
          <button className="w-full p-4 bg-[#800020] text-white rounded-2xl font-black uppercase shadow-xl hover:bg-black transition">Se Connecter</button>
        </div>
      </form>
    </div>
  );
};
