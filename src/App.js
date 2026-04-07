import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 🔒 SÉCURITÉ & CONFIGURATION ---
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

// --- 🖨 MOTEUR D'IMPRESSION (VERSION COMPLÈTE) ---
const lancerImpression = (type, data, params) => {
  const isTicket = data.printSize === '58mm' || data.printSize === '80mm';
  const win = window.open('', '', isTicket ? 'width=350,height=600' : 'width=800,height=900');
  if (!win) { alert("⚠️ Navigateur bloqué."); return; }

  const panierList = Array.isArray(data.panier) ? data.panier : [];
  const getLineData = (i) => {
    const pU = safeNum(i.prix_unitaire !== undefined ? i.prix_unitaire : i.prix_vente);
    const rU = safeNum(i.remise_unitaire_ar !== undefined ? i.remise_unitaire_ar : i.remise_montant);
    const qte = safeNum(i.qte);
    return { pU, rU, qte, total: safeNum(i.total_ligne !== undefined ? i.total_ligne : (pU - rU) * qte) };
  };

  let titre = 'FACTURE'; if (type === 'devis') titre = 'DEVIS ESTIMATIF'; if (type === 'admin_credit') titre = 'FACTURE À CRÉDIT';

  win.document.write(`
    <html><head><title>${data.numero || titre}</title>
    <style>
      body { font-family: ${isTicket ? 'monospace' : 'Arial, sans-serif'}; padding: ${isTicket ? '10px' : '40px'}; font-size: 12px; line-height: 1.4; }
      .text-right { text-align: right; } .text-center { text-align: center; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #800020; color: white; padding: 8px; text-align: left; }
      td { border-bottom: 1px solid #eee; padding: 8px; }
      .total-box { font-size: 16px; font-weight: bold; color: #800020; margin-top: 20px; }
      img { max-width: ${isTicket ? '80%' : '150px'}; margin-bottom: 10px; }
    </style></head><body>
      <div class="text-center">
        <img src="${LOGO_URL}" />
        <h2 style="margin:0;">${params.nom_entreprise || 'HAKIMI PLUS'}</h2>
        <p>${params.adresse || ''}<br/>${params.contact || ''}</p>
        ${params.message_entete ? `<p>${params.message_entete}</p>` : ''}
      </div>
      <hr/>
      <p><b>${titre} N° ${data.numero || ''}</b><br/>Date: ${formatDateTime(data.date)}</p>
      <p><b>Client:</b> ${data.client_nom || 'Comptoir'}</p>
      <table><thead><tr><th>Désign.</th><th>Qté</th><th>P.U Net</th><th class="text-right">Total</th></tr></thead><tbody>
        ${panierList.map(i => {
          const d = getLineData(i);
          return `<tr><td>${i.nom}</td><td>${d.qte}</td><td>${formatAr(d.pU - d.rU)}</td><td class="text-right">${formatAr(d.total)} Ar</td></tr>`;
        }).join('')}
      </tbody></table>
      <div class="text-right total-box">
        <p style="font-size:12px; color:#666;">Total Articles: ${formatAr(data.totalNet)} Ar</p>
        ${data.fraisLivraison > 0 ? `<p style="font-size:12px; color:#666;">Livraison: ${formatAr(data.fraisLivraison)} Ar</p>` : ''}
        <p>NET À PAYER : ${formatAr(safeNum(data.totalNet) + safeNum(data.fraisLivraison))} Ar</p>
      </div>
      <p class="text-center" style="margin-top:30px;">${params.message_ticket || 'Merci de votre confiance !'}</p>
    </body></html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); }, 800);
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
  const [menuOpen, setMenuOpen] = useState(false);

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
      if (user.role === 'vendeur' && view === 'dashboard') setView('caisse');
      const fetchSync = async () => {
        const { count } = await supabase.from('messagerie').select('*', { count: 'exact', head: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
        setMsgNonLus(count || 0);
        const { data: prods } = await supabase.from('produits').select('nom, stock_actuel').lt('stock_actuel', 5);
        if (prods) setAlertesStockDLC(prods.map(p => `${p.nom} (Reste ${p.stock_actuel})`));
      };
      fetchSync();
    }
  }, [user, view]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#800020] bg-white animate-pulse">HAKIMI PLUS...</div>;
  if (!user) return <LoginScreen onLogin={(u) => { localStorage.setItem('hakimi_user', JSON.stringify(u)); setUser(u); }} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      <nav className="w-full md:w-72 bg-[#800020] text-white p-6 flex flex-col shrink-0 shadow-2xl z-50">
        <div className="text-center mb-8 border-b border-white/10 pb-6">
            <img src={LOGO_URL} className="h-14 mx-auto bg-white p-2 rounded-2xl mb-4 shadow-inner" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Gestionnaire Connecté</p>
            <p className="font-bold text-sm">{user.identifiant.toUpperCase()}</p>
        </div>
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
          <NavBtn active={view==='messagerie'} onClick={()=>setView('messagerie')}>✉️ Messagerie {msgNonLus > 0 && <span className="bg-red-500 px-2 rounded-full text-[10px]">{msgNonLus}</span>}</NavBtn>
          <p className="text-[10px] font-black text-white/40 uppercase mt-4 mb-1 px-3">Opérations</p>
          <NavBtn active={view==='caisse'} onClick={()=>setView('caisse')}>🛒 Caisse Directe</NavBtn>
          <NavBtn active={view==='facture_a4'} onClick={()=>setView('facture_a4')}>📄 Nouvelle Facture</NavBtn>
          <NavBtn active={view==='devis'} onClick={()=>setView('devis')}>📝 Devis / Proforma</NavBtn>
          <NavBtn active={view==='admin_credit'} onClick={()=>setView('admin_credit')}>🔴 Ventes à Crédit</NavBtn>
          <p className="text-[10px] font-black text-white/40 uppercase mt-4 mb-1 px-3">Registres</p>
          <NavBtn active={view==='historique'} onClick={()=>setView('historique')}>📅 Historique Global</NavBtn>
          <NavBtn active={view==='suivi_credits'} onClick={()=>setView('suivi_credits')}>📉 Suivi des Dettes</NavBtn>
          {user.role === 'superadmin' && (
            <>
              <p className="text-[10px] font-black text-red-400 uppercase mt-4 mb-1 px-3">Direction</p>
              <NavBtn active={view==='dashboard'} onClick={()=>setView('dashboard')}>📊 Dashboard Stratégique</NavBtn>
              <NavBtn active={view==='commandes_web'} onClick={()=>setView('commandes_web')}>🌐 Commandes Site Web</NavBtn>
              <NavBtn active={view==='gestion_site'} onClick={()=>setView('gestion_site')}>🎨 Configuration Site</NavBtn>
              <NavBtn active={view==='admin_stock'} onClick={()=>setView('admin_stock')}>📦 Stock & Catalogue</NavBtn>
              <NavBtn active={view==='clients'} onClick={()=>setView('clients')}>👥 Base Clients</NavBtn>
              <NavBtn active={view==='depenses'} onClick={()=>setView('depenses')}>💸 Dépenses & Charges</NavBtn>
              <NavBtn active={view==='admin_utilisateurs'} onClick={()=>setView('admin_utilisateurs')}>🔐 Comptes & Accès</NavBtn>
              <NavBtn active={view==='parametres'} onClick={()=>setView('parametres')}>⚙️ Paramètres ERP</NavBtn>
            </>
          )}
        </div>
        <button onClick={()=>{localStorage.removeItem('hakimi_user'); setUser(null);}} className="mt-8 p-4 bg-white/10 rounded-2xl font-black text-xs uppercase hover:bg-red-600 transition border border-white/10">Déconnexion</button>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
        {view === 'dashboard' && <AdminDashboard />}
        {view === 'caisse' && <ModuleVente mode="caisse" params={parametres} categoriesDb={categoriesDb} />}
        {view === 'facture_a4' && <ModuleVente mode="facture_a4" params={parametres} categoriesDb={categoriesDb} />}
        {view === 'devis' && <ModuleVente mode="devis" params={parametres} categoriesDb={categoriesDb} />}
        {view === 'admin_credit' && <ModuleVente mode="admin_credit" params={parametres} categoriesDb={categoriesDb} />}
        {view === 'commandes_web' && <ModuleCommandesWeb />}
        {view === 'admin_stock' && <AdminStock categoriesDb={categoriesDb} />}
        {view === 'gestion_site' && <ModuleGestionSite />}
        {view === 'historique' && <ModuleHistorique params={parametres} />}
        {view === 'clients' && <ModuleClients />}
        {view === 'depenses' && <ModuleDepenses />}
        {view === 'suivi_credits' && <SuiviCredits params={parametres} />}
        {view === 'messagerie' && <ModuleMessagerie user={user} onMessagesRead={()=>setMsgNonLus(0)} />}
        {view === 'admin_utilisateurs' && <AdminUtilisateurs currentUser={user} onUpdateSession={setUser} />}
        {view === 'parametres' && <AdminParametres params={parametres} setParams={setParametres} />}
      </main>
    </div>
  );
}

const NavBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`p-3.5 rounded-2xl text-left font-bold text-sm transition-all ${active ? 'bg-white text-[#800020] shadow-xl translate-x-1' : 'hover:bg-white/5 text-white/70'}`}>{children}</button>
);

// --- 📊 DASHBOARD COMPLET ---
const AdminDashboard = () => {
  const [ventes, setVentes] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [prods, setProds] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: v } = await supabase.from('historique_ventes').select('*');
      const { data: d } = await supabase.from('depenses').select('*');
      const { data: p } = await supabase.from('produits').select('*');
      setVentes(v || []); setDepenses(d || []); setProds(p || []);
    };
    load();
  }, []);

  const totalCA = ventes.reduce((acc, v) => acc + safeNum(v.montant_total), 0);
  const totalDep = depenses.reduce((acc, d) => acc + safeNum(d.montant), 0);
  const totalBeneficeBrut = ventes.reduce((acc, v) => acc + safeNum(v.benefice_total || (v.montant_total * 0.2)), 0);
  const stockValue = prods.reduce((acc, p) => acc + (safeNum(p.stock_actuel) * safeNum(p.prix_achat)), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-gray-200 pb-4">Tableau de Bord Stratégique</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border-l-8 border-[#800020]">
          <p className="text-[10px] font-bold text-gray-400 uppercase">CA Total</p>
          <p className="text-xl font-black">{formatAr(totalCA)} Ar</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border-l-8 border-red-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Dépenses</p>
          <p className="text-xl font-black text-red-600">-{formatAr(totalDep)} Ar</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border-l-8 border-blue-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Valeur Stock</p>
          <p className="text-xl font-black text-blue-600">{formatAr(stockValue)} Ar</p>
        </div>
        <div className="bg-[#800020] p-5 rounded-3xl shadow-lg text-white">
          <p className="text-[10px] font-bold uppercase opacity-60">Bénéfice Réel</p>
          <p className="text-xl font-black">{formatAr(totalBeneficeBrut - totalDep)} Ar</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="font-black uppercase text-xs mb-4">Répartition des Paiements</h3>
          <div className="space-y-4">
             {['CASH', 'MVOLA', 'ORANGE MONEY', 'CHEQUE'].map(m => {
               const val = ventes.filter(v => v.methode_paiement === m).reduce((acc, v) => acc + safeNum(v.montant_total), 0);
               const perc = totalCA > 0 ? (val / totalCA) * 100 : 0;
               return (
                 <div key={m}>
                    <div className="flex justify-between text-[10px] font-bold mb-1"><span>{m}</span><span>{formatAr(val)} Ar</span></div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="bg-[#800020] h-full" style={{width: `${perc}%`}}></div></div>
                 </div>
               )
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 🔐 GESTION UTILISATEURS COMPLETE ---
const AdminUtilisateurs = ({ currentUser, onUpdateSession }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ identifiant: '', mot_de_passe: '', role: 'vendeur' });

  const load = async () => { const { data } = await supabase.from('utilisateurs').select('*').order('identifiant'); setUsers(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if(form.identifiant.length < 3) return alert("Identifiant trop court");
    const existing = users.find(u => u.identifiant === form.identifiant);
    if (existing) {
      await supabase.from('utilisateurs').update({ mot_de_passe: form.mot_de_passe, role: form.role }).eq('identifiant', form.identifiant);
      alert("Mis à jour !");
      if(currentUser.identifiant === form.identifiant) onUpdateSession({...currentUser, mot_de_passe: form.mot_de_passe, role: form.role});
    } else {
      await supabase.from('utilisateurs').insert([form]);
      alert("Utilisateur créé !");
    }
    setForm({ identifiant: '', mot_de_passe: '', role: 'vendeur' }); load();
  };

  const deleteU = async (id) => {
    if(id === currentUser.identifiant) return alert("Impossible de supprimer votre propre compte");
    if(window.confirm(`Supprimer ${id} ?`)) { await supabase.from('utilisateurs').delete().eq('identifiant', id); load(); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Utilisateurs & Accès</h2>
      <form onSubmit={save} className="bg-white p-6 rounded-[2rem] shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="p-3 bg-gray-50 border rounded-xl font-bold" placeholder="Identifiant" value={form.identifiant} onChange={e=>setForm({...form, identifiant: e.target.value})} required />
        <input className="p-3 bg-gray-50 border rounded-xl font-bold" placeholder="Mot de passe" value={form.mot_de_passe} onChange={e=>setForm({...form, mot_de_passe: e.target.value})} required />
        <select className="p-3 bg-gray-50 border rounded-xl font-bold" value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
           <option value="vendeur">Vendeur</option>
           <option value="superadmin">Super Admin</option>
        </select>
        <button className="bg-[#800020] text-white rounded-xl font-black uppercase text-xs hover:bg-black transition">Enregistrer</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map(u => (
          <div key={u.identifiant} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div onClick={()=>setForm({identifiant: u.identifiant, mot_de_passe: u.mot_de_passe, role: u.role})} className="cursor-pointer">
              <p className="font-black">{u.identifiant} {u.identifiant === currentUser.identifiant && '(Moi)'}</p>
              <div className="flex gap-2 text-[10px] font-bold uppercase opacity-50"><span className={u.role==='superadmin'?'text-red-600':''}>{u.role}</span><span>MDP: {u.mot_de_passe}</span></div>
            </div>
            <button onClick={()=>deleteU(u.identifiant)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ⚙️ PARAMÈTRES ERP COMPLETS ---
const AdminParametres = ({ params, setParams }) => {
  const [form, setForm] = useState(params);
  useEffect(() => { setForm(params); }, [params]);

  const save = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('parametres').update(form).eq('id', 1).select();
    if (data) { setParams(data[0]); alert("Paramètres ERP enregistrés !"); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Configuration ERP & Tickets</h2>
      <form onSubmit={save} className="bg-white p-8 rounded-[2.5rem] shadow-sm border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold uppercase opacity-50 px-2">Nom Entreprise</label><input className="w-full p-3 bg-gray-50 border rounded-xl font-bold" value={form.nom_entreprise||''} onChange={e=>setForm({...form, nom_entreprise: e.target.value})} required /></div>
          <div><label className="text-[10px] font-bold uppercase opacity-50 px-2">Contact</label><input className="w-full p-3 bg-gray-50 border rounded-xl font-bold" value={form.contact||''} onChange={e=>setForm({...form, contact: e.target.value})} /></div>
        </div>
        <div><label className="text-[10px] font-bold uppercase opacity-50 px-2">Adresse Siège</label><input className="w-full p-3 bg-gray-50 border rounded-xl font-bold" value={form.adresse||''} onChange={e=>setForm({...form, adresse: e.target.value})} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold uppercase opacity-50 px-2">NIF / STAT</label><input className="w-full p-3 bg-gray-50 border rounded-xl font-bold" value={form.nif_stat||''} onChange={e=>setForm({...form, nif_stat: e.target.value})} /></div>
        </div>
        <div className="pt-4 border-t">
           <h3 className="font-black text-xs uppercase mb-3">Personnalisation Ticket (Pied de page)</h3>
           <textarea className="w-full p-4 bg-gray-50 border rounded-2xl text-sm italic h-24" value={form.message_ticket||''} onChange={e=>setForm({...form, message_ticket: e.target.value})} placeholder="Merci de votre visite..." />
        </div>
        <button className="w-full bg-[#800020] text-white p-4 rounded-2xl font-black uppercase shadow-xl hover:bg-black transition">Enregistrer les réglages</button>
      </form>
    </div>
  );
};

// --- 🧩 VENTE (VERSION AVANCÉE RESTAURÉE) ---
const ModuleVente = ({ mode, params, categoriesDb }) => {
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("");
  const [selClient, setSelClient] = useState(mode === 'caisse' ? "Vente à consommateur" : "");
  const [methode, setMethode] = useState("CASH");
  const [remiseGl, setRemiseGl] = useState(0);
  const [fraisLiv, setFraisLiv] = useState(0);
  const [isLiv, setIsLiv] = useState(false);
  const [banque, setBanque] = useState("");

  const load = async () => {
    const { data: p } = await supabase.from('produits').select('*').gt('stock_actuel', 0).order('nom');
    const { data: c } = await supabase.from('clients').select('*').order('nom');
    setProduits(p || []); setClients(c || []);
  };
  useEffect(() => { load(); setPanier([]); }, [mode]);

  const totalBrut = panier.reduce((acc, i) => acc + (i.prix_vente * i.qte), 0);
  const totalRemiseArticles = panier.reduce((acc, i) => acc + (safeNum(i.remise_montant) * i.qte), 0);
  const totalNet = (totalBrut - totalRemiseArticles) * (1 - remiseGl/100);

  const ajouter = (p) => {
    const ex = panier.find(i => i.id === p.id);
    if (ex) setPanier(panier.map(i => i.id === p.id ? {...i, qte: i.qte + 1} : i));
    else setPanier([...panier, { ...p, qte: 1, remise_montant: 0 }]);
  };

  const valider = async () => {
    if (panier.length === 0 || !selClient) return alert("Données manquantes");
    if (methode === 'CHEQUE' && !banque) return alert("Banque requise");

    for (let item of panier) { await supabase.rpc('decrement_stock_by_name', { p_nom: item.nom, amount: item.qte }); }
    
    const details = { 
        articles: panier, 
        methode, 
        frais_livraison: isLiv ? fraisLiv : 0, 
        remise_globale: remiseGl,
        banque: methode === 'CHEQUE' ? banque : null
    };

    await supabase.from('historique_ventes').insert([{
      type_vente: mode.toUpperCase(), client_nom: selClient, montant_total: totalNet,
      articles_liste: panier.map(i=>`${i.qte}x ${i.nom}`).join(', '), methode_paiement: methode, details_json: details
    }]);

    if (mode === 'admin_credit') {
        await supabase.from('credits').insert([{ nom_client: selClient, montant_du: totalNet, details_articles: panier.map(i=>`${i.qte}x ${i.nom}`).join(', '), statut: 'non_paye', details_json: details }]);
    }

    lancerImpression(mode, { numero: 'FA'+Date.now().toString().slice(-6), panier, totalNet, fraisLivraison: isLiv ? fraisLiv : 0, client_nom: selClient, date: new Date(), printSize: '58mm' }, params);
    setPanier([]); load(); alert("Transaction Terminée !");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border flex flex-col h-[80vh]">
        <div className="flex gap-2 mb-4">
          <input className="flex-1 p-3 bg-gray-50 border rounded-xl font-bold" placeholder="🔍 Rechercher produit..." onChange={e=>setSearch(e.target.value)} />
          <select className="p-3 bg-gray-50 border rounded-xl font-bold text-xs" onChange={e=>setSelCat(e.target.value)}>
            <option value="">Toutes Catégories</option>
            {categoriesDb.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {produits.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()) && (selCat==='' || p.categorie === selCat)).map(p => (
            <button key={p.id} onClick={()=>ajouter(p)} className="p-3 border rounded-2xl text-left hover:border-[#800020] transition group bg-white shadow-sm hover:shadow-md">
              <p className="font-bold text-[10px] uppercase truncate opacity-70 mb-1">{p.categorie}</p>
              <p className="font-black text-xs h-8 leading-tight">{p.nom}</p>
              <p className="text-red-600 font-black text-sm mt-2">{formatAr(p.prix_vente)} Ar</p>
              <p className="text-[9px] font-bold text-gray-400">Stock: {p.stock_actuel}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#800020] text-white p-6 rounded-[3rem] shadow-2xl flex flex-col h-[80vh] relative overflow-hidden">
        <div className="mb-4 space-y-2">
          <h3 className="font-black uppercase tracking-tighter text-xl mb-4 border-b border-white/20 pb-2">Caisse : {mode.replace('_',' ')}</h3>
          <select className="w-full p-3 bg-white/10 border border-white/20 rounded-xl font-bold text-white outline-none" value={selClient} onChange={e=>setSelClient(e.target.value)}>
             <option value="" className="text-black">-- Sélectionner Client --</option>
             {clients.map(c => <option key={c.id} value={c.nom} className="text-black">{c.nom}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
          {panier.length === 0 && <p className="text-center opacity-30 mt-10 italic">Le panier est vide</p>}
          {panier.map(item => (
            <div key={item.id} className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 font-bold text-sm">{item.nom}</div>
                <button onClick={()=>setPanier(panier.filter(x=>x.id!==item.id))} className="text-xs opacity-50 hover:text-red-400">✕</button>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-70">
                <div className="flex items-center gap-3 bg-black/20 p-1 px-2 rounded-lg">
                    <button onClick={()=>setPanier(panier.map(x=>x.id===item.id?{...x, qte: Math.max(1, x.qte-1)}:x))}>-</button>
                    <span>Qté: {item.qte}</span>
                    <button onClick={()=>setPanier(panier.map(x=>x.id===item.id?{...x, qte: x.qte+1}:x))}>+</button>
                </div>
                <span>Total: {formatAr(item.prix_vente * item.qte)} Ar</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
          <div className="flex justify-between items-end"><span className="text-xs uppercase font-bold opacity-60 tracking-widest">Net à Payer</span><span className="text-4xl font-black tracking-tighter">{formatAr(totalNet + (isLiv ? fraisLiv : 0))} Ar</span></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
             {['CASH', 'MVOLA', 'ORANGE', 'CHEQUE'].map(m => (
               <button key={m} onClick={()=>setMethode(m)} className={`p-2 rounded-xl text-[9px] font-black transition ${methode===m?'bg-white text-[#800020] shadow-lg scale-105':'bg-white/10 hover:bg-white/20'}`}>{m}</button>
             ))}
          </div>
          {methode === 'CHEQUE' && <input className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-xs" placeholder="Banque du chèque..." onChange={e=>setBanque(e.target.value)} />}
          
          <div className="flex gap-2">
              <div className="flex-1"><label className="text-[9px] font-bold opacity-50 block ml-1 uppercase">Remise %</label><input type="number" className="w-full p-2 bg-black/20 rounded-lg outline-none font-bold" value={remiseGl} onChange={e=>setRemiseGl(Number(e.target.value))} /></div>
              <div className="flex-1 flex flex-col justify-end"><label className="flex items-center gap-1 text-[9px] font-bold opacity-50 mb-1"><input type="checkbox" checked={isLiv} onChange={e=>setIsLiv(e.target.checked)}/> Livraison?</label>{isLiv && <input type="number" className="w-full p-2 bg-black/20 rounded-lg outline-none font-bold" value={fraisLiv} onChange={e=>setFraisLiv(Number(e.target.value))} />}</div>
          </div>
          
          <button onClick={valider} className="w-full p-4 bg-white text-[#800020] rounded-[1.5rem] font-black uppercase text-sm hover:scale-[1.02] transition shadow-2xl">Confirmer & Imprimer</button>
        </div>
      </div>
    </div>
  );
};

// --- 📦 STOCK & CATALOGUE ---
const AdminStock = ({ categoriesDb }) => {
  const [prods, setProds] = useState([]);
  const [catsWeb, setCatsWeb] = useState([]);
  const [form, setForm] = useState({ nom: '', prix_a: '', prix_v: '', stock: '', fournisseur: '', categorie: 'Divers', afficher_web: false, categorie_web: '' });

  const load = async () => {
    const { data: p } = await supabase.from('produits').select('*').order('nom');
    const { data: cw } = await supabase.from('categories_web').select('nom');
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
    setForm({ nom: '', prix_a: '', prix_v: '', stock: '', fournisseur: '', categorie: 'Divers', afficher_web: false, categorie_web: '' }); load(); alert("Produit ajouté !");
  };

  const toggleWeb = async (id, val) => { await supabase.from('produits').update({ afficher_web: !val }).eq('id', id); load(); };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Ajouter un produit</h2>
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input className="p-3 bg-gray-50 border rounded-xl font-bold" placeholder="Désignation" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required />
          <input className="p-3 bg-gray-50 border rounded-xl font-bold" type="number" placeholder="P. Achat" value={form.prix_a} onChange={e=>setForm({...form, prix_a: e.target.value})} required />
          <input className="p-3 bg-gray-50 border rounded-xl font-bold" type="number" placeholder="P. Vente" value={form.prix_v} onChange={e=>setForm({...form, prix_v: e.target.value})} required />
          <input className="p-3 bg-gray-50 border rounded-xl font-bold" type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required />
          <div className="md:col-span-2 flex items-center gap-4 bg-blue-50 p-3 rounded-2xl border border-blue-100">
             <label className="text-xs font-black text-blue-900 flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.afficher_web} onChange={e=>setForm({...form, afficher_web: e.target.checked})} /> Visible sur le Web</label>
             {form.afficher_web && (
               <select className="flex-1 p-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-blue-900" value={form.categorie_web} onChange={e=>setForm({...form, categorie_web: e.target.value})}>
                 <option value="">Choisir Catégorie Web...</option>
                 {catsWeb.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
               </select>
             )}
          </div>
          <button className="bg-[#800020] text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-black transition">Enregistrer</button>
        </form>
      </div>
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
            <tr><th className="p-5">Produit</th><th>Coût Achat</th><th>P. Vente</th><th className="text-center">Inventaire</th><th className="text-center">Statut Web</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {prods.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition group">
                <td className="p-5 font-black text-sm uppercase group-hover:text-[#800020]">{p.nom}</td>
                <td className="p-5 text-gray-500 font-bold">{formatAr(p.prix_achat)}</td>
                <td className="p-5 font-black text-[#800020]">{formatAr(p.prix_vente)}</td>
                <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black text-white ${p.stock_actuel < 5 ? 'bg-red-500 animate-pulse' : 'bg-green-600'}`}>{p.stock_actuel}</span></td>
                <td className="p-5 text-center"><button onClick={()=>toggleWeb(p.id, p.afficher_web)} className="text-xl">{p.afficher_web ? '🌐' : '❌'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 🌐 COMMANDES WEB ---
const ModuleCommandesWeb = () => {
  const [cmds, setCmds] = useState([]);
  const load = async () => { const { data } = await supabase.from('commandes_web').select('*').order('date_commande', { ascending: false }); setCmds(data || []); };
  useEffect(() => { load(); }, []);

  const valider = async (c) => {
    if (!window.confirm("Valider & Déduire le stock ?")) return;
    for (let a of c.articles_json.articles) { await supabase.rpc('decrement_stock_by_name', { p_nom: a.nom, amount: safeNum(a.qte) }); }
    
    // Création Auto Client
    const { data: ex } = await supabase.from('clients').select('id').eq('contact_whatsapp', c.client_whatsapp).maybeSingle();
    if (!ex) { await supabase.from('clients').insert([{ nom: c.client_nom, contact_whatsapp: c.client_whatsapp, telephone: c.client_whatsapp, adresse: `${c.quartier} - ${c.adresse_detail}` }]); }

    await supabase.from('historique_ventes').insert([{
      numero_facture: `WEB-${c.id.toString().slice(0,4)}`, type_vente: 'SITE_WEB', client_nom: c.client_nom,
      articles_liste: c.articles_json.articles.map(a=>`${a.qte}x ${a.nom}`).join(', '), montant_total: c.montant_total,
      methode_paiement: c.articles_json.methode_paiement || 'LIVRAISON', details_json: c.articles_json
    }]);

    await supabase.from('commandes_web').update({ statut: 'Validée' }).eq('id', c.id);
    load(); alert("Commande passée en Historique !");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-2xl font-black text-[#800020] uppercase border-b-2 border-[#800020] pb-2">Commandes Boutique en Ligne</h2>
      {cmds.map(c => (
        <div key={c.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border-l-8 ${c.statut==='Validée'?'border-green-500 opacity-60':'border-blue-600'}`}>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-black text-lg uppercase">{c.client_nom}</p>
                <span className="text-[10px] font-black bg-red-50 text-red-700 px-3 py-1 rounded-full uppercase">📍 {c.quartier}</span>
              </div>
              <p className="text-sm font-bold text-blue-600 mb-2">📞 {c.client_whatsapp} | 💳 {c.articles_json?.methode_paiement || 'Paiement Livraison'}</p>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 italic text-xs text-gray-500 mb-4">{c.adresse_detail}</div>
              <div className="flex flex-wrap gap-2">{c.articles_json?.articles.map((a,i)=><span key={i} className="text-[10px] font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">{a.qte}x {a.nom}</span>)}</div>
            </div>
            <div className="text-right flex flex-col justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-40">Total Commande</p>
                <p className="text-3xl font-black text-[#800020] tracking-tighter">{formatAr(Number(c.montant_total) + Number(c.frais_livraison))} Ar</p>
              </div>
              {c.statut === 'En attente' ? (
                <div className="flex gap-2">
                    <button onClick={()=>valider(c)} className="bg-[#800020] text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl">Valider & Facturer</button>
                </div>
              ) : <span className="font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl text-xs uppercase">Traitée ✅</span>}
            </div>
          </div>
        </div>
      ))}
      {cmds.length === 0 && <p className="text-center py-20 italic opacity-30">Aucune commande pour le moment.</p>}
    </div>
  );
};

// --- 🎨 CONFIG SITE WEB ---
const ModuleGestionSite = () => {
  const [config, setConfig] = useState({ carousel_urls: ["", "", ""], texte_livraison: "", texte_conditions: "", quartiers_json: [] });
  const load = async () => { const { data } = await supabase.from('parametres_web').select('*').eq('id', 1).single(); if (data) setConfig({...data, quartiers_json: data.quartiers_json || []}); };
  useEffect(() => { load(); }, []);

  const save = async () => { await supabase.from('parametres_web').update(config).eq('id', 1); alert("Site Mis à jour !"); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Configuration Boutique</h2>
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border space-y-6">
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
           <div className="flex justify-between items-center mb-4"><h3 className="font-black text-xs uppercase text-[#800020]">📍 Zones & Frais de Livraison</h3><button onClick={()=>setConfig({...config, quartiers_json: [...config.quartiers_json, {nom: '', frais: 0}]})} className="bg-[#800020] text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md">+ Ajouter</button></div>
           <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
             {config.quartiers_json.map((q, i) => (
               <div key={i} className="flex gap-2 bg-white p-2 rounded-xl border border-red-100 shadow-sm">
                 <input className="flex-1 p-2 bg-gray-50 border-none rounded-lg text-xs font-bold" value={q.nom} onChange={e=>{const n=[...config.quartiers_json]; n[i].nom=e.target.value; setConfig({...config, quartiers_json: n})}} placeholder="Ex: Ivandry..."/>
                 <input className="w-28 p-2 bg-gray-50 border-none rounded-lg text-xs font-black text-red-600" type="number" value={q.frais} onChange={e=>{const n=[...config.quartiers_json]; n[i].frais=Number(e.target.value); setConfig({...config, quartiers_json: n})}} placeholder="Frais (Ar)"/>
                 <button onClick={()=>{const n=[...config.quartiers_json]; n.splice(i,1); setConfig({...config, quartiers_json: n})}} className="text-red-500 px-2 font-black">✕</button>
               </div>
             ))}
           </div>
        </div>
        
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 px-4 mb-2 block tracking-widest">Images Carrousel (Liens direct)</label>
          <div className="space-y-2">
            {config.carousel_urls.map((url, i) => (
              <input key={i} className="w-full p-3 bg-gray-50 border rounded-xl text-xs" value={url} onChange={e=>{const n=[...config.carousel_urls]; n[i]=e.target.value; setConfig({...config, carousel_urls: n})}} placeholder={`Lien image ${i+1}`} />
            ))}
          </div>
        </div>

        <button onClick={save} className="w-full p-5 bg-[#800020] text-white rounded-[2rem] font-black uppercase shadow-2xl hover:bg-black transition scale-100 active:scale-95">Mettre à jour le site web</button>
      </div>
    </div>
  );
};

// --- 📅 HISTORIQUE COMPLET ---
const ModuleHistorique = ({ params }) => {
  const [ventes, setVentes] = useState([]);
  const load = async () => { const { data } = await supabase.from('historique_ventes').select('*').order('date_vente', { ascending: false }); setVentes(data || []); };
  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h2 className="text-2xl font-black text-[#800020] uppercase border-b-2 border-gray-200 pb-2">Registre des encaissements</h2>
      <div className="grid gap-3">
        {ventes.map(v => (
          <div key={v.id} className="bg-white p-5 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-[#800020] transition">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-gray-100 px-2 py-1 rounded uppercase">{v.type_vente}</span>
                <span className="text-[10px] font-bold text-gray-400">{formatDateTime(v.date_vente)}</span>
                <span className="text-[10px] font-black text-green-600 ml-auto md:ml-2">💳 {v.methode_paiement}</span>
              </div>
              <p className="font-black uppercase text-sm text-gray-700">{v.client_nom || 'Vente Directe'}</p>
              <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">🛒 {v.articles_liste}</p>
            </div>
            <div className="text-right w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
              <p className="text-xl font-black text-[#800020]">{formatAr(v.montant_total)} Ar</p>
              <button onClick={() => lancerImpression('Facture', { ...v, panier: v.details_json?.articles || [], totalNet: v.montant_total, date: v.date_vente, printSize: '58mm' }, params)} className="text-[10px] font-black uppercase text-blue-600 hover:underline mt-2">Ré-imprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 👥 BASE CLIENTS ---
const ModuleClients = () => {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ nom: '', tel: '', adresse: '' });
  const load = async () => { const { data } = await supabase.from('clients').select('*').order('nom'); setClients(data || []); };
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    await supabase.from('clients').insert([{ nom: form.nom, telephone: form.tel, contact_whatsapp: form.tel, adresse: form.adresse }]);
    setForm({ nom: '', tel: '', adresse: '' }); load(); alert("Client ajouté !");
  };
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Répertoire Clients</h2>
      <form onSubmit={save} className="bg-white p-8 rounded-[3rem] shadow-sm border grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="p-3 bg-gray-50 border rounded-xl font-bold" placeholder="Nom Complet" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required />
        <input className="p-3 bg-gray-50 border rounded-xl font-bold" placeholder="N° WhatsApp" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} />
        <input className="p-3 bg-gray-50 border rounded-xl font-bold" placeholder="Adresse" value={form.adresse} onChange={e=>setForm({...form, adresse: e.target.value})} />
        <button className="bg-[#800020] text-white rounded-xl font-black uppercase text-xs md:col-span-3 py-3 shadow-lg">Ajouter à la base</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {clients.map(c => (
          <div key={c.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="font-black uppercase text-sm mb-2">{c.nom}</p>
            <p className="text-xs text-green-600 font-bold mb-1">💬 {c.contact_whatsapp}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{c.adresse || 'Pas d\'adresse'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 💸 DÉPENSES ---
const ModuleDepenses = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ d: '', m: '' });
  const load = async () => { const { data } = await supabase.from('depenses').select('*').order('date_depense', { ascending: false }); setList(data || []); };
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    await supabase.from('depenses').insert([{ description: form.d, montant: safeNum(form.m), date_depense: new Date() }]);
    setForm({ d: '', m: '' }); load();
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-red-600 border-b-2 border-red-100 pb-2">Journal des Dépenses</h2>
      <form onSubmit={save} className="bg-white p-6 rounded-[2rem] shadow-sm border flex flex-col md:flex-row gap-4">
        <input className="flex-1 p-3 bg-gray-50 border rounded-xl font-bold" placeholder="Motif de la dépense (ex: Loyer, Electricité...)" value={form.d} onChange={e=>setForm({...form, d: e.target.value})} required />
        <input className="w-48 p-3 bg-red-50 border border-red-100 rounded-xl font-black text-red-600" type="number" placeholder="Montant Ar" value={form.m} onChange={e=>setForm({...form, m: e.target.value})} required />
        <button className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-xl">OK</button>
      </form>
      <div className="grid gap-2">
        {list.map(d => (
          <div key={d.id} className="bg-white p-5 rounded-2xl border-l-8 border-red-500 flex justify-between items-center shadow-sm">
            <div className="flex flex-col"><span className="font-black uppercase text-sm">{d.description}</span><span className="text-[10px] font-bold text-gray-400">{formatDate(d.date_depense)}</span></div>
            <span className="font-black text-red-600 text-lg">-{formatAr(d.montant)} Ar</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 📉 SUIVI CRÉDITS ---
const SuiviCredits = ({ params }) => {
  const [list, setList] = useState([]);
  const load = async () => { const { data } = await supabase.from('credits').select('*').eq('statut', 'non_paye').order('date_credit', { ascending: false }); setList(data || []); };
  useEffect(() => { load(); }, []);
  const payer = async (id) => { if(window.confirm("Confirmer le paiement total de cette dette ?")) { await supabase.from('credits').update({ statut: 'paye' }).eq('id', id); load(); } };
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-red-600 uppercase border-b-2 border-red-100 pb-2">Suivi des Dettes Clients</h2>
      <div className="grid gap-3">
        {list.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-[2rem] shadow-sm border-l-[12px] border-red-600 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 w-full text-center md:text-left">
                <p className="font-black text-xl uppercase text-gray-800">{c.nom_client}</p>
                <p className="text-xs font-bold text-gray-400 mb-2">Dette créée le {formatDate(c.date_credit)}</p>
                <p className="text-[10px] font-medium bg-gray-50 p-2 rounded-xl border italic text-gray-500">{c.details_articles}</p>
            </div>
            <div className="text-center md:text-right w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                <p className="text-[10px] font-black uppercase text-red-600 opacity-60">Montant Restant</p>
                <p className="text-3xl font-black text-red-600 tracking-tighter mb-4">{formatAr(c.montant_du)} Ar</p>
                <div className="flex gap-2 justify-center md:justify-end">
                    <button onClick={()=>payer(c.id)} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-green-700 transition">💰 Encaisser</button>
                    <button onClick={()=>{window.open(`https://wa.me/?text=Bonjour ${c.nom_client}, c'est Hakimi Plus. Petit rappel concernant votre dette de ${formatAr(c.montant_du)} Ar. Merci !`)}} className="bg-blue-500 text-white p-3 rounded-2xl shadow-lg font-black">💬</button>
                </div>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <div className="text-center py-32"><p className="text-4xl mb-4">🎉</p><p className="font-black uppercase opacity-20 tracking-widest">Aucune dette client en cours</p></div>}
    </div>
  );
};

// --- ✉️ MESSAGERIE ---
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
    e.preventDefault(); if(!form.d) return alert("Sél. Destinataire");
    await supabase.from('messagerie').insert([{ expediteur: user.identifiant, destinataire: form.d, objet: form.o, message: form.m }]);
    setForm({ ...form, o: '', m: '' }); load(); alert("Message envoyé !");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-gray-100 pb-2">Messagerie Interne</h2>
      <div className="bg-white p-8 rounded-[2.5rem] border-t-8 border-[#800020] shadow-sm">
        <form onSubmit={send} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <select className="p-4 bg-gray-50 border rounded-2xl font-bold text-xs outline-none" value={form.d} onChange={e=>setForm({...form, d: e.target.value})} required>
              <option value="">Envoyer à...</option>
              {destinataires.map(d=><option key={d.identifiant} value={d.identifiant}>{d.identifiant.toUpperCase()}</option>)}
            </select>
            <input className="flex-1 p-4 bg-gray-50 border rounded-2xl outline-none font-bold" placeholder="Objet du message" value={form.o} onChange={e=>setForm({...form, o: e.target.value})} required />
          </div>
          <textarea className="w-full p-5 bg-gray-50 border rounded-[2rem] outline-none min-h-[120px] font-medium" placeholder="Écrivez votre message ici..." value={form.m} onChange={e=>setForm({...form, m: e.target.value})} required />
          <button className="bg-[#800020] text-white px-10 py-4 rounded-[1.5rem] font-black uppercase text-xs shadow-2xl hover:bg-black transition">🚀 Envoyer le message</button>
        </form>
      </div>
      <div className="space-y-4">
        {msgs.map(m => (
          <div key={m.id} className={`p-6 rounded-[2rem] border shadow-sm ${m.expediteur === user.identifiant ? 'bg-gray-50 ml-12 border-gray-100' : 'bg-white mr-12 border-[#800020]/10 shadow-lg'}`}>
            <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${m.expediteur === user.identifiant ? 'bg-gray-200 text-gray-500' : 'bg-[#800020] text-white'}`}>
                    {m.expediteur === user.identifiant ? 'MOI' : m.expediteur.toUpperCase()} ➔ {m.destinataire.toUpperCase()}
                </span>
                <span className="text-[10px] font-bold text-gray-400">{formatHeureMessage(m.date_envoi)}</span>
            </div>
            <p className="font-black text-gray-800 mb-1">{m.objet}</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
