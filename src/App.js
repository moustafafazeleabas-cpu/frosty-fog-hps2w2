import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 🔒 CONFIGURATION ---
const supabaseUrl = 'https://wblginsktosypbmhmgbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibGdpbnNrdG9zeXBibWhtZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjU3NTYsImV4cCI6MjA4OTk0MTc1Nn0.pmysPmutGjW2Tw7jFvrBE_0ue2pZmS32Pjncu1Rmr8w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOGO_URL = "https://wblginsktosypbmhmgbr.supabase.co/storage/v1/object/public/Hakimi%20logo/hakimi.jpg";

// --- 🛠 UTILS ---
const safeNum = (val) => { if (val === null || val === undefined || val === '') return 0; const n = Number(val); return isNaN(n) ? 0 : n; };
const formatAr = (val) => safeNum(val).toLocaleString('fr-FR');
const formatDate = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('fr-FR'); };
const formatDateTime = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : d.toLocaleString('fr-FR'); };
const formatHeureMessage = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : `le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`; };

// --- 🖨 MOTEUR IMPRESSION ---
const lancerImpression = (type, data, params) => {
  const isTicket = data.printSize === '58mm' || data.printSize === '80mm';
  const win = window.open('', '', isTicket ? 'width=350,height=600' : 'width=800,height=900');
  if (!win) { alert("⚠️ Navigateur bloqué."); return; }

  const dateDoc = formatDateTime(data.date || new Date());
  const panierList = Array.isArray(data.panier) ? data.panier : [];
  const fraisLiv = safeNum(data.fraisLivraison);

  const getLineData = (i) => {
    const pU = safeNum(i.prix_unitaire !== undefined ? i.prix_unitaire : i.prix_vente);
    const rU = safeNum(i.remise_unitaire_ar !== undefined ? i.remise_unitaire_ar : i.remise_montant);
    const qte = safeNum(i.qte);
    const total = safeNum(i.total_ligne !== undefined ? i.total_ligne : (pU - rU) * qte);
    return { pU, rU, qte, total };
  };

  let titreType = '';
  if (type === 'admin_credit') titreType = 'FACTURE À CRÉDIT';
  if (type === 'devis') titreType = 'DEVIS ESTIMATIF';
  if (type === 'facture_a4' || type === 'caisse') titreType = 'FACTURE';

  win.document.write(`
    <html><head><title>${data.numero || 'Doc'}</title>
    <style>
      body { font-family: ${isTicket ? 'monospace' : 'Arial'}; padding: 20px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
      .text-right { text-align: right; }
    </style></head><body>
      <center><img src="${LOGO_URL}" style="max-width:150px;"/><br/><h2>${params.nom_entreprise || 'HAKIMI PLUS'}</h2></center>
      <p><b>${titreType} N° ${data.numero || ''}</b><br/>Date: ${dateDoc}</p>
      <p>Client: ${data.client_nom || 'Comptoir'}</p>
      <table><thead><tr><th>Article</th><th>Qté</th><th>P.U</th><th class="text-right">Total</th></tr></thead><tbody>
        ${panierList.map(i => {
          const d = getLineData(i);
          return `<tr><td>${i.nom}</td><td>${d.qte}</td><td>${formatAr(d.pU - d.rU)}</td><td class="text-right">${formatAr(d.total)} Ar</td></tr>`;
        }).join('')}
      </tbody></table>
      <div class="text-right">
        <p>Articles: ${formatAr(data.totalNet)} Ar</p>
        ${fraisLiv > 0 ? `<p>Livraison: ${formatAr(fraisLiv)} Ar</p>` : ''}
        <h3>NET À PAYER: ${formatAr(safeNum(data.totalNet) + fraisLiv)} Ar</h3>
      </div>
    </body></html>
  `);
  win.document.close(); setTimeout(() => { win.print(); }, 800);
};

// --- 🏠 APP ---
export default function App() {
  const [user, setUser] = useState(() => { const saved = localStorage.getItem('hakimi_user'); return saved ? JSON.parse(saved) : null; });
  const [view, setView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msgNonLus, setMsgNonLus] = useState(0);
  const [parametres, setParametres] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertesStockDLC, setAlertesStockDLC] = useState([]);
  const [categoriesDb, setCategoriesDb] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const loadInit = async () => {
    const { data: p } = await supabase.from('parametres').select('*').eq('id', 1).single();
    if (p) setParametres(p);
    const { data: c } = await supabase.from('categories').select('nom').order('nom');
    if (c) setCategoriesDb(c.map(i => i.nom));
    setLoading(false);
  };
  useEffect(() => { loadInit(); }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'vendeur' && view === 'dashboard') setView('caisse');
      const checkTasks = async () => {
        const { count } = await supabase.from('messagerie').select('*', { count: 'exact', head: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
        setMsgNonLus(count || 0);
        const { data: prods } = await supabase.from('produits').select('nom, stock_actuel, date_peremption');
        if (prods) {
          let a = []; const now = new Date();
          prods.forEach(p => {
            if (safeNum(p.stock_actuel) < 5) a.push({ type: 'stock', text: `${p.nom} : Stock critique (${p.stock_actuel})` });
            if (p.date_peremption && new Date(p.date_peremption) < now) a.push({ type: 'dlc', text: `${p.nom} : PÉRIMÉ !` });
          });
          setAlertesStockDLC(a);
        }
      };
      checkTasks();
    }
  }, [user, view]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black">HAKIMI PLUS CHARGEMENT...</div>;
  if (!user) return <LoginScreen onLogin={(u) => { localStorage.setItem('hakimi_user', JSON.stringify(u)); setUser(u); }} />;

  const changeView = (v) => { setView(v); setMenuOpen(false); };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      <div className="md:hidden bg-[#800020] text-white p-4 flex justify-between items-center sticky top-0 z-[60]">
        <span className="font-black">HAKIMI PLUS</span>
        <div className="flex gap-4">
           <button onClick={() => setNotifOpen(!notifOpen)} className="relative">🔔 {msgNonLus + alertesStockDLC.length > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-[10px] px-1 rounded-full">!</span>}</button>
           <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>

      <nav className={`fixed inset-y-0 left-0 z-[70] w-72 bg-[#800020] text-white p-6 shadow-2xl flex flex-col transition-transform transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="text-center mb-6 border-b border-white/10 pb-6">
            <img src={LOGO_URL} className="h-12 mx-auto bg-white p-1 rounded-xl mb-2" />
            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
            <NavBtn active={view==='messagerie'} onClick={()=>changeView('messagerie')}>✉️ Messagerie {msgNonLus > 0 && `(${msgNonLus})`}</NavBtn>
            <p className="text-[10px] font-black text-white/40 uppercase mt-4 mb-1 px-3">Menu</p>
            <NavBtn active={view==='caisse'} onClick={()=>changeView('caisse')}>🛒 Caisse Directe</NavBtn>
            <NavBtn active={view==='facture_a4'} onClick={()=>changeView('facture_a4')}>📄 Facture A4</NavBtn>
            <NavBtn active={view==='devis'} onClick={()=>changeView('devis')}>📝 Devis</NavBtn>
            <NavBtn active={view==='admin_credit'} onClick={()=>changeView('admin_credit')}>🔴 Ventes Crédit</NavBtn>
            <p className="text-[10px] font-black text-white/40 uppercase mt-4 mb-1 px-3">Registres</p>
            <NavBtn active={view==='historique'} onClick={()=>changeView('historique')}>📅 Historique Global</NavBtn>
            <NavBtn active={view==='suivi_credits'} onClick={()=>changeView('suivi_credits')}>📉 Suivi Dettes</NavBtn>
            {user.role === 'superadmin' && (
              <>
                <p className="text-[10px] font-black text-red-400 uppercase mt-4 mb-1 px-3">Direction</p>
                <NavBtn active={view==='dashboard'} onClick={()=>changeView('dashboard')}>📊 Dashboard</NavBtn>
                <NavBtn active={view==='commandes_web'} onClick={()=>changeView('commandes_web')}>🌐 Commandes Web</NavBtn>
                <NavBtn active={view==='gestion_site'} onClick={()=>changeView('gestion_site')}>🎨 Config Site</NavBtn>
                <NavBtn active={view==='admin_stock'} onClick={()=>changeView('admin_stock')}>📦 Stock & Web</NavBtn>
                <NavBtn active={view==='clients'} onClick={()=>changeView('clients')}>👥 Base Clients</NavBtn>
                <NavBtn active={view==='depenses'} onClick={()=>changeView('depenses')}>💸 Dépenses</NavBtn>
                <NavBtn active={view==='admin_utilisateurs'} onClick={()=>changeView('admin_utilisateurs')}>🔐 Comptes</NavBtn>
                <NavBtn active={view==='parametres'} onClick={()=>changeView('parametres')}>⚙️ Paramètres</NavBtn>
              </>
            )}
          </div>
          <button onClick={()=>{localStorage.removeItem('hakimi_user'); setUser(null);}} className="mt-8 p-3 bg-white/10 rounded-xl font-black text-xs uppercase hover:bg-red-600 transition">Déconnexion</button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
        {view==='messagerie' && <ModuleMessagerie user={user} onMessagesRead={()=>setMsgNonLus(0)} />}
        {view==='caisse' && <ModuleVente mode="caisse" params={parametres} categoriesDb={categoriesDb} />}
        {view==='facture_a4' && <ModuleVente mode="facture_a4" params={parametres} categoriesDb={categoriesDb} />}
        {view==='devis' && <ModuleVente mode="devis" params={parametres} categoriesDb={categoriesDb} />}
        {view==='admin_credit' && <ModuleVente mode="admin_credit" params={parametres} categoriesDb={categoriesDb} />}
        {view==='dashboard' && <AdminDashboard />}
        {view==='commandes_web' && <ModuleCommandesWeb />}
        {view==='gestion_site' && <ModuleGestionSite />}
        {view==='admin_stock' && <AdminStock categoriesDb={categoriesDb} />}
        {view==='historique' && <ModuleHistorique params={parametres} />}
        {view==='clients' && <ModuleClients />}
        {view==='depenses' && <ModuleDepenses />}
        {view==='suivi_credits' && <SuiviCredits params={parametres} />}
        {view==='admin_utilisateurs' && <AdminUtilisateurs />}
        {view==='parametres' && <AdminParametres params={parametres} setParams={setParametres} />}
      </main>
    </div>
  );
}

// --- 🧩 COMPOSANTS (Toutes les fonctions restaurées) ---

const NavBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`p-3 rounded-xl text-left font-bold text-sm transition-all ${active ? 'bg-white text-[#800020] shadow-xl' : 'hover:bg-white/5 text-white/80'}`}>{children}</button>
);

const LoginScreen = ({ onLogin }) => {
  const [creds, setCreds] = useState({ id: '', mdp: '' });
  const handle = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('utilisateurs').select('*').eq('identifiant', creds.id).eq('mot_de_passe', creds.mdp).single();
    if (data) onLogin(data); else alert("Identifiants incorrects.");
  };
  return (
    <div className="min-h-screen bg-[#800020] flex items-center justify-center p-4">
      <form onSubmit={handle} className="bg-white p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border-b-8 border-red-600 text-center">
        <img src={LOGO_URL} className="h-16 mx-auto mb-6" />
        <input className="w-full p-4 mb-4 bg-gray-50 border rounded-xl outline-none" placeholder="Utilisateur" onChange={e=>setCreds({...creds, id: e.target.value})} />
        <input className="w-full p-4 mb-6 bg-gray-50 border rounded-xl outline-none" type="password" placeholder="Mot de passe" onChange={e=>setCreds({...creds, mdp: e.target.value})} />
        <button className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-lg">Connexion</button>
      </form>
    </div>
  );
};

const ModuleVente = ({ mode, params, categoriesDb }) => {
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("");
  const [selClient, setSelClient] = useState("");
  const [methode, setMethode] = useState("CASH");
  const [fraisLiv, setFraisLiv] = useState(0);

  const load = async () => {
    const { data: p } = await supabase.from('produits').select('*').gt('stock_actuel', 0).order('nom');
    const { data: c } = await supabase.from('clients').select('*').order('nom');
    setProduits(p || []); setClients(c || []);
    if (mode === 'caisse') setSelClient("Vente à consommateur");
  };
  useEffect(() => { load(); }, [mode]);

  const totalNet = panier.reduce((acc, i) => acc + (i.prix_vente * i.qte), 0);

  const ajouter = (p) => {
    const ex = panier.find(i => i.id === p.id);
    if (ex) setPanier(panier.map(i => i.id === p.id ? {...i, qte: i.qte+1} : i));
    else setPanier([...panier, { ...p, qte: 1 }]);
  };

  const valider = async () => {
    if (panier.length === 0 || !selClient) return alert("Panier ou Client manquant");
    for (let item of panier) { await supabase.rpc('decrement_stock_by_name', { p_nom: item.nom, amount: item.qte }); }
    
    const details = { articles: panier, methode, frais_livraison: fraisLiv, date: new Date() };
    await supabase.from('historique_ventes').insert([{
      type_vente: mode.toUpperCase(), client_nom: selClient, montant_total: totalNet,
      articles_liste: panier.map(i=>`${i.qte}x ${i.nom}`).join(', '), methode_paiement: methode, details_json: details
    }]);

    if (mode === 'admin_credit') {
        await supabase.from('credits').insert([{ nom_client: selClient, montant_du: totalNet, details_articles: panier.map(i=>`${i.qte}x ${i.nom}`).join(', '), statut: 'non_paye' }]);
    }

    lancerImpression(mode, { numero: 'FA'+Date.now().toString().slice(-5), panier, totalNet, fraisLivraison: fraisLiv, client_nom: selClient, date: new Date(), printSize: '58mm' }, params);
    setPanier([]); alert("Réussi !"); load();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex gap-2 mb-4">
          <input className="flex-1 p-3 bg-gray-50 border rounded-xl" placeholder="🔍 Chercher..." onChange={e=>setSearch(e.target.value)} />
          <select className="p-3 bg-gray-50 border rounded-xl font-bold" onChange={e=>setSelCat(e.target.value)}>
            <option value="">Tous</option>
            {categoriesDb.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 custom-scrollbar">
          {produits.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()) && (selCat==='' || p.categorie === selCat)).map(p => (
            <button key={p.id} onClick={()=>ajouter(p)} className="p-3 border rounded-xl text-left hover:border-[#800020] transition group">
              <p className="font-bold text-[11px] uppercase truncate">{p.nom}</p>
              <p className="text-red-600 font-black">{formatAr(p.prix_vente)} Ar</p>
              <p className="text-[9px] text-gray-400">STK: {p.stock_actuel}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#800020] text-white p-6 rounded-[2.5rem] shadow-xl flex flex-col">
        <div className="mb-4 space-y-3">
          <h3 className="font-black uppercase tracking-widest border-b border-white/10 pb-2">Vente : {mode.replace('_',' ')}</h3>
          <select className="w-full p-3 bg-white/10 border border-white/20 rounded-xl font-bold text-white outline-none" value={selClient} onChange={e=>setSelClient(e.target.value)}>
             <option value="" className="text-black">-- Choisir Client --</option>
             {clients.map(c => <option key={c.id} value={c.nom} className="text-black">{c.nom}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
          {panier.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <div className="flex-1"><p className="font-bold text-xs">{item.nom}</p><p className="text-[10px] opacity-60">{item.qte} x {formatAr(item.prix_vente)}</p></div>
              <span className="font-black text-xs">{formatAr(item.prix_vente * item.qte)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center mb-4"><span className="text-xs uppercase font-bold opacity-60">Total Net</span><span className="text-3xl font-black">{formatAr(totalNet)} Ar</span></div>
          <div className="grid grid-cols-3 gap-2 mb-4">
             <button onClick={()=>setMethode('CASH')} className={`p-2 rounded-lg text-[10px] font-black ${methode==='CASH'?'bg-blue-600':'bg-white/10'}`}>CASH</button>
             <button onClick={()=>setMethode('MVOLA')} className={`p-2 rounded-lg text-[10px] font-black ${methode==='MVOLA'?'bg-green-600':'bg-white/10'}`}>MVOLA</button>
             <button onClick={()=>setMethode('ORANGE')} className={`p-2 rounded-lg text-[10px] font-black ${methode==='ORANGE'?'bg-orange-500':'bg-white/10'}`}>ORANGE</button>
          </div>
          <button onClick={valider} className="w-full p-4 bg-white text-[#800020] rounded-2xl font-black uppercase hover:bg-gray-100 transition shadow-xl">Valider & Imprimer</button>
        </div>
      </div>
    </div>
  );
};

const AdminStock = ({ categoriesDb }) => {
  const [prods, setProds] = useState([]);
  const [catsWeb, setCatsWeb] = useState([]);
  const [form, setForm] = useState({ nom: '', prix_a: '', prix_v: '', stock: '', fournisseur: '', categorie: 'Divers', afficher_web: false, categorie_web: '' });

  const load = async () => {
    const { data: p } = await supabase.from('produits').select('*').order('nom');
    const { data: cw } = await supabase.from('categories_web').select('nom').order('nom');
    const { data: f } = await supabase.from('fournisseurs').select('nom');
    setProds(p || []); setCatsWeb(cw || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await supabase.from('produits').insert([{
      nom: form.nom, prix_achat: safeNum(form.prix_a), prix_vente: safeNum(form.prix_v),
      stock_actuel: safeNum(form.stock), afficher_web: form.afficher_web, categorie_web: form.categorie_web,
      fournisseur_nom: form.fournisseur, categorie: form.categorie
    }]);
    setForm({ nom: '', prix_a: '', prix_v: '', stock: '', fournisseur: '', categorie: 'Divers', afficher_web: false, categorie_web: '' }); load(); alert("Ajouté !");
  };

  const toggleWeb = async (id, val) => { await supabase.from('produits').update({ afficher_web: !val }).eq('id', id); load(); };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Nouvelle référence</h2>
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="p-3 border rounded-xl text-sm" placeholder="Nom produit" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required />
          <input className="p-3 border rounded-xl text-sm" type="number" placeholder="Prix Achat" value={form.prix_a} onChange={e=>setForm({...form, prix_a: e.target.value})} required />
          <input className="p-3 border rounded-xl text-sm" type="number" placeholder="Prix Vente" value={form.prix_v} onChange={e=>setForm({...form, prix_v: e.target.value})} required />
          <input className="p-3 border rounded-xl text-sm" type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required />
          <div className="md:col-span-2 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-4">
             <label className="text-xs font-bold text-blue-900 flex items-center gap-2"><input type="checkbox" checked={form.afficher_web} onChange={e=>setForm({...form, afficher_web: e.target.checked})} /> Visible Site Web</label>
             {form.afficher_web && (
               <select className="flex-1 p-2 bg-white border rounded-lg text-[10px] font-bold" value={form.categorie_web} onChange={e=>setForm({...form, categorie_web: e.target.value})}>
                 <option value="">Choisir Catégorie Web</option>
                 {catsWeb.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
               </select>
             )}
          </div>
          <button className="bg-[#800020] text-white rounded-xl font-black uppercase text-[10px]">Enregistrer</button>
        </form>
      </div>
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
            <tr><th className="p-4">Produit</th><th>Achat</th><th>Vente</th><th className="text-center">Stock</th><th className="text-center">Web</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {prods.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-bold text-sm uppercase">{p.nom}</td>
                <td className="p-4 text-gray-500">{formatAr(p.prix_achat)}</td>
                <td className="p-4 font-black text-[#800020]">{formatAr(p.prix_vente)}</td>
                <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-black text-white ${p.stock_actuel < 5 ? 'bg-red-500' : 'bg-green-500'}`}>{p.stock_actuel}</span></td>
                <td className="p-4 text-center"><button onClick={()=>toggleWeb(p.id, p.afficher_web)}>{p.afficher_web?'✅':'❌'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ModuleCommandesWeb = () => {
  const [cmds, setCmds] = useState([]);
  const load = async () => { const { data } = await supabase.from('commandes_web').select('*').order('date_commande', { ascending: false }); setCmds(data || []); };
  useEffect(() => { load(); }, []);

  const valider = async (c) => {
    if (!window.confirm("Valider ?")) return;
    for (let a of c.articles_json.articles) { await supabase.rpc('decrement_stock_by_name', { p_nom: a.nom, amount: safeNum(a.qte) }); }
    
    // Auto-création Client
    const { data: exist } = await supabase.from('clients').select('id').eq('contact_whatsapp', c.client_whatsapp).maybeSingle();
    if (!exist) { await supabase.from('clients').insert([{ nom: c.client_nom, contact_whatsapp: c.client_whatsapp, telephone: c.client_whatsapp, adresse: `${c.quartier} - ${c.adresse_detail}` }]); }

    await supabase.from('historique_ventes').insert([{
      numero_facture: `WEB-${Date.now().toString().slice(-4)}`, type_vente: 'SITE_WEB', client_nom: c.client_nom,
      articles_liste: c.articles_json.articles.map(a=>`${a.qte}x ${a.nom}`).join(', '), montant_total: c.montant_total,
      methode_paiement: c.articles_json.methode_paiement, details_json: c.articles_json
    }]);

    await supabase.from('commandes_web').update({ statut: 'Validée' }).eq('id', c.id);
    load(); alert("Commande Validée !");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-[#800020] uppercase border-b-2 border-[#800020] pb-2">Commandes Site Web</h2>
      {cmds.map(c => (
        <div key={c.id} className={`bg-white p-6 rounded-3xl shadow-sm border-l-8 ${c.statut==='Validée'?'border-green-500 opacity-60':'border-blue-600'}`}>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <p className="font-black text-lg uppercase">{c.client_nom} <span className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded ml-2">📍 {c.quartier}</span></p>
              <p className="text-sm font-bold text-blue-600">📞 {c.client_whatsapp} | 💳 {c.articles_json?.methode_paiement}</p>
              <p className="text-xs italic text-gray-500 mt-1">{c.adresse_detail}</p>
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

const ModuleGestionSite = () => {
  const [config, setConfig] = useState({ carousel_urls: ["", "", ""], texte_livraison: "", texte_conditions: "", quartiers_json: [] });
  const load = async () => { const { data } = await supabase.from('parametres_web').select('*').eq('id', 1).single(); if (data) setConfig({...data, quartiers_json: data.quartiers_json || []}); };
  useEffect(() => { load(); }, []);

  const save = async () => { await supabase.from('parametres_web').update(config).eq('id', 1); alert("Site Mis à jour !"); };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-sm border space-y-6">
      <h2 className="text-xl font-black uppercase text-[#800020] mb-6">Configuration Boutique</h2>
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
         <h3 className="font-bold text-xs uppercase mb-4">📍 Quartiers & Frais</h3>
         <button onClick={()=>setConfig({...config, quartiers_json: [...config.quartiers_json, {nom: '', frais: 0}]})} className="mb-3 bg-[#800020] text-white px-3 py-1 rounded text-[10px]">+ Ajouter</button>
         <div className="space-y-2">{config.quartiers_json.map((q, i) => (
           <div key={i} className="flex gap-2"><input className="flex-1 p-2 border rounded text-xs" value={q.nom} onChange={e=>{const n=[...config.quartiers_json]; n[i].nom=e.target.value; setConfig({...config, quartiers_json: n})}} placeholder="Quartier"/><input className="w-24 p-2 border rounded text-xs font-bold" type="number" value={q.frais} onChange={e=>{const n=[...config.quartiers_json]; n[i].frais=Number(e.target.value); setConfig({...config, quartiers_json: n})}}/></div>
         ))}</div>
      </div>
      <button onClick={save} className="w-full p-4 bg-[#800020] text-white rounded-2xl font-black uppercase shadow-xl hover:bg-black transition">Sauvegarder les réglages</button>
    </div>
  );
};

const AdminDashboard = () => {
  const [data, setData] = useState({ v: [], d: [], p: [] });
  useEffect(() => {
    const load = async () => {
      const { data: v } = await supabase.from('historique_ventes').select('*');
      const { data: d } = await supabase.from('depenses').select('*');
      const { data: p } = await supabase.from('produits').select('*');
      setData({ v: v||[], d: d||[], p: p||[] });
    };
    load();
  }, []);
  const ca = data.v.reduce((acc, x) => acc + safeNum(x.montant_total), 0);
  const dep = data.d.reduce((acc, x) => acc + safeNum(x.montant), 0);
  const stockVal = data.p.reduce((acc, x) => acc + (safeNum(x.prix_achat)*safeNum(x.stock_actuel)), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020]">Tableau de Bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-[#800020]"><p className="text-xs font-bold text-gray-400 uppercase">Chiffre d'Affaires</p><p className="text-2xl font-black">{formatAr(ca)} Ar</p></div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-red-500"><p className="text-xs font-bold text-gray-400 uppercase">Dépenses</p><p className="text-2xl font-black text-red-600">{formatAr(dep)} Ar</p></div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-blue-500"><p className="text-xs font-bold text-gray-400 uppercase">Valeur Stock (Achat)</p><p className="text-2xl font-black text-blue-600">{formatAr(stockVal)} Ar</p></div>
      </div>
    </div>
  );
};

const ModuleHistorique = ({ params }) => {
  const [ventes, setVentes] = useState([]);
  useEffect(() => { const load = async () => { const { data } = await supabase.from('historique_ventes').select('*').order('date_vente', { ascending: false }); setVentes(data || []); }; load(); }, []);
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-black uppercase border-b pb-2">Journal des Ventes</h2>
      {ventes.map(v => (
        <div key={v.id} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
          <div><p className="font-bold text-sm uppercase">{v.client_nom || 'Comptoir'}</p><p className="text-[10px] text-gray-400">{formatDateTime(v.date_vente)} | {v.type_vente}</p></div>
          <div className="text-right">
            <p className="font-black text-[#800020]">{formatAr(v.montant_total)} Ar</p>
            <button onClick={() => lancerImpression('Facture', { ...v, panier: v.details_json?.articles || [], totalNet: v.montant_total, date: v.date_vente, printSize: '58mm' }, params)} className="text-[10px] font-bold text-blue-600 underline">Ré-imprimer</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const ModuleClients = () => {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ nom: '', tel: '' });
  const load = async () => { const { data } = await supabase.from('clients').select('*').order('nom'); setClients(data || []); };
  useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault(); await supabase.from('clients').insert([{ nom: form.nom, telephone: form.tel, contact_whatsapp: form.tel }]); setForm({ nom: '', tel: '' }); load(); };
  return (
    <div className="space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl border flex gap-4"><input className="flex-1 p-3 border rounded-xl" placeholder="Nom Client" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required /><input className="w-48 p-3 border rounded-xl" placeholder="WhatsApp" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} /><button className="bg-[#800020] text-white px-6 rounded-xl font-bold uppercase text-xs">Ajouter</button></form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{clients.map(c => (
        <div key={c.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center"><p className="font-bold uppercase text-sm">{c.nom}</p><p className="text-xs font-black text-green-600">{c.contact_whatsapp}</p></div>
      ))}</div>
    </div>
  );
};

const ModuleDepenses = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ d: '', m: '' });
  const load = async () => { const { data } = await supabase.from('depenses').select('*').order('date_depense', { ascending: false }); setList(data || []); };
  useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault(); await supabase.from('depenses').insert([{ description: form.d, montant: safeNum(form.m) }]); setForm({ d: '', m: '' }); load(); };
  return (
    <div className="space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl border flex gap-4"><input className="flex-1 p-3 border rounded-xl" placeholder="Motif dépense" value={form.d} onChange={e=>setForm({...form, d: e.target.value})} required /><input className="w-32 p-3 border rounded-xl text-red-600 font-bold" type="number" placeholder="Montant" value={form.m} onChange={e=>setForm({...form, m: e.target.value})} required /><button className="bg-red-600 text-white px-6 rounded-xl font-bold uppercase text-xs">OK</button></form>
      <div className="space-y-2">{list.map(d => (
        <div key={d.id} className="bg-white p-4 rounded-2xl border-l-8 border-red-500 flex justify-between items-center"><span className="font-bold uppercase text-xs">{d.description}</span><span className="font-black text-red-600">-{formatAr(d.montant)} Ar</span></div>
      ))}</div>
    </div>
  );
};

const SuiviCredits = ({ params }) => {
  const [list, setList] = useState([]);
  const load = async () => { const { data } = await supabase.from('credits').select('*').eq('statut', 'non_paye').order('date_credit', { ascending: false }); setList(data || []); };
  useEffect(() => { load(); }, []);
  const payer = async (id) => { if(window.confirm("Marquer comme payé ?")) { await supabase.from('credits').update({ statut: 'paye' }).eq('id', id); load(); } };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-red-600 uppercase border-b pb-2">Dettes Clients</h2>
      {list.map(c => (
        <div key={c.id} className="bg-white p-5 rounded-3xl shadow-sm border-l-8 border-red-600 flex justify-between items-center">
          <div><p className="font-black uppercase">{c.nom_client}</p><p className="text-[10px] opacity-50">Du {formatDate(c.date_credit)}</p></div>
          <div className="text-right flex items-center gap-4"><p className="text-xl font-black text-red-600">{formatAr(c.montant_du)} Ar</p><button onClick={()=>payer(c.id)} className="bg-green-600 text-white p-2 rounded-lg text-[10px] font-black uppercase">Encaisser</button></div>
        </div>
      ))}
    </div>
  );
};

const AdminUtilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ i: '', m: '', r: 'vendeur' });
  const load = async () => { const { data } = await supabase.from('utilisateurs').select('*').order('identifiant'); setUsers(data || []); };
  useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault(); await supabase.from('utilisateurs').insert([{ identifiant: form.i, mot_de_passe: form.m, role: form.r }]); setForm({ i: '', m: '', r: 'vendeur' }); load(); };
  return (
    <div className="space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl border grid grid-cols-1 md:grid-cols-4 gap-4"><input className="p-3 border rounded-xl" placeholder="ID" value={form.i} onChange={e=>setForm({...form, i: e.target.value})} required /><input className="p-3 border rounded-xl" placeholder="MDP" value={form.m} onChange={e=>setForm({...form, m: e.target.value})} required /><select className="p-3 border rounded-xl font-bold" value={form.r} onChange={e=>setForm({...form, r: e.target.value})}><option value="vendeur">Vendeur</option><option value="superadmin">Super Admin</option></select><button className="bg-[#800020] text-white rounded-xl font-black uppercase text-xs">Créer</button></form>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{users.map(u => (
        <div key={u.id} className="bg-white p-4 rounded-2xl border text-center"><p className="font-black uppercase text-xs">{u.identifiant}</p><p className="text-[10px] opacity-40 uppercase">{u.role}</p></div>
      ))}</div>
    </div>
  );
};

const ModuleMessagerie = ({ user, onMessagesRead }) => {
  const [msgs, setMsgs] = useState([]);
  const [destinataires, setDestinataires] = useState([]);
  const [form, setForm] = useState({ d: '', o: '', m: '' });

  const load = async () => {
    const { data: u } = await supabase.from('utilisateurs').select('identifiant').neq('identifiant', user.identifiant);
    const { data: m } = await supabase.from('messagerie').select('*').or(`destinataire.eq.${user.identifiant},expediteur.eq.${user.identifiant}`).order('date_envoi', { ascending: false });
    setDestinataires(u || []); setMsgs(m || []);
    await supabase.from('messagerie').update({ est_lu: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
    if(onMessagesRead) onMessagesRead();
  };
  useEffect(() => { load(); }, []);

  const send = async (e) => {
    e.preventDefault(); if(!form.d) return;
    await supabase.from('messagerie').insert([{ expediteur: user.identifiant, destinataire: form.d, objet: form.o, message: form.m }]);
    setForm({ ...form, o: '', m: '' }); load(); alert("Envoyé !");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl border-t-4 border-[#800020]">
        <form onSubmit={send} className="space-y-3">
          <div className="flex gap-3">
            <select className="p-3 bg-gray-50 border rounded-xl font-bold text-xs" value={form.d} onChange={e=>setForm({...form, d: e.target.value})} required>
              <option value="">Destinataire...</option>
              {destinataires.map(d=><option key={d.identifiant} value={d.identifiant}>{d.identifiant}</option>)}
            </select>
            <input className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none" placeholder="Objet" value={form.o} onChange={e=>setForm({...form, o: e.target.value})} required />
          </div>
          <textarea className="w-full p-4 bg-gray-50 border rounded-xl outline-none min-h-[100px]" placeholder="Message..." value={form.m} onChange={e=>setForm({...form, m: e.target.value})} required />
          <button className="bg-[#800020] text-white px-8 py-3 rounded-xl font-black uppercase text-xs">🚀 Envoyer</button>
        </form>
      </div>
      <div className="space-y-3">{msgs.map(m => (
        <div key={m.id} className={`p-4 rounded-2xl border ${m.expediteur === user.identifiant ? 'bg-gray-50 ml-10' : 'bg-red-50 mr-10'}`}>
          <p className="text-[10px] font-black uppercase opacity-40 mb-1">{m.expediteur === user.identifiant ? 'MOI' : m.expediteur} ➔ {m.destinataire}</p>
          <p className="font-bold text-sm">{m.objet}</p>
          <p className="text-xs opacity-70 whitespace-pre-wrap">{m.message}</p>
        </div>
      ))}</div>
    </div>
  );
};

const AdminParametres = ({ params, setParams }) => {
  const [form, setForm] = useState(params);
  const save = async (e) => { e.preventDefault(); const { data } = await supabase.from('parametres').update(form).eq('id', 1).select(); if(data) setParams(data[0]); alert("OK !"); };
  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border space-y-4">
      <h2 className="text-xl font-black text-[#800020] uppercase border-b pb-2">Paramètres de l'entreprise</h2>
      <form onSubmit={save} className="space-y-4">
        <input className="w-full p-3 border rounded-xl" placeholder="Nom Entreprise" value={form.nom_entreprise||''} onChange={e=>setForm({...form, nom_entreprise: e.target.value})} />
        <input className="w-full p-3 border rounded-xl" placeholder="Contact" value={form.contact||''} onChange={e=>setForm({...form, contact: e.target.value})} />
        <textarea className="w-full p-3 border rounded-xl" placeholder="Adresse" value={form.adresse||''} onChange={e=>setForm({...form, adresse: e.target.value})} />
        <textarea className="w-full p-3 border rounded-xl" placeholder="Message Ticket" value={form.message_ticket||''} onChange={e=>setForm({...form, message_ticket: e.target.value})} />
        <button className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase transition shadow-xl">Enregistrer</button>
      </form>
    </div>
  );
};
