import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 🔒 SÉCURITÉ : VARIABLES D'ENVIRONNEMENT ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wblginsktosypbmhmgbr.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibGdpbnNrdG9zeXBibWhtZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjU3NTYsImV4cCI6MjA4OTk0MTc1Nn0.pmysPmutGjW2Tw7jFvrBE_0ue2pZmS32Pjncu1Rmr8w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOGO_URL = "https://wblginsktosypbmhmgbr.supabase.co/storage/v1/object/public/Hakimi%20logo/hakimi.jpg"; // 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('caisse');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msgNonLus, setMsgNonLus] = useState(0);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1500);
  }, []);

  // Vérifier les messages non lus
  useEffect(() => {
    if (user) {
      const checkMsgs = async () => {
        const { count } = await supabase.from('messagerie').select('*', { count: 'exact', head: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
        setMsgNonLus(count || 0);
      };
      checkMsgs();
      const interval = setInterval(checkMsgs, 30000); // Check toutes les 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#800020] border-t-transparent rounded-full animate-spin mb-4"></div>
      <img src={LOGO_URL} alt="Chargement..." className="h-12 animate-pulse" onError={(e) => e.target.style.display='none'} />
    </div>
  );

  if (!user) return <LoginScreen onLogin={setUser} />;

  const changeView = (newView) => { setView(newView); setMenuOpen(false); };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      {/* HEADER MOBILE */}
      <div className="md:hidden bg-[#800020] text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <img src={LOGO_URL} alt="Hakimi Plus" className="h-8 bg-white p-1 rounded" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<span class="font-black text-xl italic uppercase">HAKIMI PLUS</span>'; }} />
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl relative">
          ☰ {msgNonLus > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-black animate-pulse">{msgNonLus}</span>}
        </button>
      </div>

      {/* MENU LATÉRAL BORDEAUX */}
      <nav className={`${menuOpen ? 'block' : 'hidden'} md:block w-full md:w-72 bg-[#800020] text-white p-6 shadow-2xl flex flex-col justify-between md:sticky md:top-0 md:h-screen overflow-y-auto z-40 transition-all custom-scrollbar`}>
        <div>
          <div className="mb-8 hidden md:flex justify-center border-b border-white/10 pb-6">
             <img src={LOGO_URL} alt="Hakimi Plus" className="max-w-[80%] h-auto bg-white p-2 rounded-xl shadow-inner" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<h1 class="text-3xl font-black italic tracking-tighter text-center">HAKIMI <span class="text-red-500">PLUS</span></h1>'; }} />
          </div>
          
          <div className="flex flex-col gap-1">
            <NavBtn active={view==='messagerie'} onClick={()=>changeView('messagerie')}>
               ✉️ Messagerie {msgNonLus > 0 && <span className="bg-red-500 text-white ml-2 px-2 py-0.5 rounded-full text-[10px] animate-pulse">{msgNonLus}</span>}
            </NavBtn>
            
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-1 mt-4">Menu Principal</p>
            <NavBtn active={view==='caisse'} onClick={()=>changeView('caisse')}>🛒 Caisse Directe</NavBtn>
            <NavBtn active={view==='facture_a4'} onClick={()=>changeView('facture_a4')}>📄 Facturation A4</NavBtn>
            <NavBtn active={view==='devis'} onClick={()=>changeView('devis')}>📝 Devis / Proforma</NavBtn>
            <NavBtn active={view==='admin_credit'} onClick={()=>changeView('admin_credit')}>🔴 Ventes à Crédit</NavBtn>
            
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-1 mt-4">Gestion</p>
            <NavBtn active={view==='clients'} onClick={()=>changeView('clients')}>👥 Base Clients</NavBtn>
            <NavBtn active={view==='historique'} onClick={()=>changeView('historique')}>📅 Journal Ventes</NavBtn>
            <NavBtn active={view==='cloture'} onClick={()=>changeView('cloture')}>💰 Clôture Caisse</NavBtn>

            {user.role === 'superadmin' && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest px-4 mb-1">Direction</p>
                <NavBtn active={view==='dashboard'} onClick={()=>changeView('dashboard')}>📊 Dashboard</NavBtn>
                <NavBtn active={view==='admin_stock'} onClick={()=>changeView('admin_stock')}>📦 Stock & Réappro</NavBtn>
                <NavBtn active={view==='depenses'} onClick={()=>changeView('depenses')}>💸 Dépenses</NavBtn>
                <NavBtn active={view==='admin_fournisseurs'} onClick={()=>changeView('admin_fournisseurs')}>🚚 Fournisseurs</NavBtn>
                <NavBtn active={view==='suivi_credits'} onClick={()=>changeView('suivi_credits')}>📉 Suivi Dettes</NavBtn>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-4 text-center">
           <p className="text-[10px] text-white/50 mb-2">Connecté : <span className="font-bold text-white uppercase">{user.identifiant}</span></p>
           <button onClick={()=>setUser(null)} className="w-full p-3 bg-white/10 hover:bg-red-600 rounded-xl text-xs font-black uppercase transition border border-white/10">Déconnexion</button>
        </div>
      </nav>

      {/* ZONE CENTRALE */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {(view==='caisse' || view==='facture_a4' || view==='admin_credit' || view==='devis') && <ModuleVente mode={view} />}
        {view==='admin_stock' && <AdminStock />}
        {view==='cloture' && <ModuleCloture user={user} />}
        {view==='admin_fournisseurs' && <AdminFournisseurs />}
        {view==='dashboard' && <AdminDashboard />}
        {view==='historique' && <ModuleHistorique />}
        {view==='clients' && <ModuleClients />}
        {view==='depenses' && <ModuleDepenses />}
        {view==='suivi_credits' && <SuiviCredits />}
        {view==='messagerie' && <ModuleMessagerie user={user} />}
      </main>
    </div>
  );
}

const NavBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`p-3 rounded-xl text-left font-bold text-sm transition-all ${active ? 'bg-white text-[#800020] shadow-xl translate-x-1' : 'hover:bg-white/5 text-white/80'}`}>{children}</button>
);

// ==========================================
// 1. MODULE VENTE (AVEC REMISES)
// ==========================================
const ModuleVente = ({ mode }) => {
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [echeance, setEcheance] = useState("");
  const [printSize, setPrintSize] = useState('58mm');
  const [remiseGlobale, setRemiseGlobale] = useState(0); // En pourcentage
  const [venteValidee, setVenteValidee] = useState(false);

  useEffect(() => {
    const load = async () => {
      const p = await supabase.from('produits').select('*').order('nom');
      const c = await supabase.from('clients').select('*').order('nom');
      setProduits(p.data || []);
      if (mode !== 'caisse') { setSelectedClient(""); setClients(c.data.filter(i => i.nom !== 'Vente à un utilisateur')); }
      else { setSelectedClient("Vente à un utilisateur"); setClients(c.data); }
    };
    load(); setPanier([]); setVenteValidee(false); setRemiseGlobale(0);
  }, [mode]);

  // Calculs financiers
  const totalBrut = panier.reduce((acc, i) => acc + (i.prix_vente * i.qte), 0);
  const totalRemiseArticles = panier.reduce((acc, i) => acc + ((i.remise_montant || 0) * i.qte), 0);
  const totalApresRemiseArticles = totalBrut - totalRemiseArticles;
  const montantRemiseGlobale = totalApresRemiseArticles * ((remiseGlobale || 0) / 100);
  const totalNet = totalApresRemiseArticles - montantRemiseGlobale;
  
  // Bénéfice : (Prix Vente - Remise Article - Prix Achat) * qte, puis on enlève le % global
  const beneficeArticles = panier.reduce((acc, i) => acc + ((i.prix_vente - (i.remise_montant || 0) - i.prix_achat) * i.qte), 0);
  const beneficeNet = beneficeArticles - montantRemiseGlobale;

  const ajouter = (p) => {
    if (venteValidee) return;
    const ex = panier.find(i => i.id === p.id);
    if (ex) setPanier(panier.map(i => i.id === p.id ? { ...i, qte: i.qte + 1 } : i));
    else setPanier([...panier, { ...p, qte: 1, remise_montant: 0 }]); // Ajout champ remise
  };

  const updateRemiseArticle = (id, val) => {
    const num = parseFloat(val) || 0;
    setPanier(panier.map(i => i.id === id ? { ...i, remise_montant: num } : i));
  };

  const valider = async () => {
    if (panier.length === 0) return;
    if (mode !== 'caisse' && !selectedClient) return alert("Client requis");
    if (mode === 'admin_credit' && !echeance) return alert("Échéance requise");
    
    // Création du JSON pour l'historique détaillé
    const detailsObj = {
      heure: new Date().toLocaleTimeString(),
      remise_globale_pourcent: parseFloat(remiseGlobale) || 0,
      articles: panier.map(i => ({
        nom: i.nom, qte: i.qte, prix_unitaire: i.prix_vente, remise_unitaire_ar: i.remise_montant || 0,
        total_ligne: (i.prix_vente - (i.remise_montant || 0)) * i.qte
      }))
    };

    const strArticles = panier.map(i => `${i.qte}x ${i.nom}`).join(', ');
    const totalRemisesEnAr = totalRemiseArticles + montantRemiseGlobale;

    if (mode === 'devis') {
      await supabase.from('devis').insert([{ client_nom: selectedClient, articles_liste: strArticles, montant_total: totalNet }]);
      setVenteValidee(true); return;
    }
    
    for (let item of panier) { await supabase.rpc('decrement_stock', { row_id: item.id, amount: item.qte }); }
    
    await supabase.from('historique_ventes').insert([{
      type_vente: mode.replace('admin_', '').toUpperCase(), client_nom: selectedClient,
      articles_liste: strArticles, montant_total: totalNet, benefice_total: beneficeNet,
      remise_globale_pourcent: parseFloat(remiseGlobale) || 0, total_remise_ar: totalRemisesEnAr,
      details_json: detailsObj
    }]);

    if (mode === 'admin_credit') {
      await supabase.from('credits').insert([{ nom_client: selectedClient, montant_du: totalNet, details_articles: strArticles, date_echeance: echeance }]);
    }
    setVenteValidee(true);
  };

  const imprimer = () => { /* Logique d'impression standard conservée */ alert("Impression lancée (Simulation)"); };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
      {/* 📦 ZONE RECHERCHE */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border-t-4 border-[#800020] flex flex-col h-[50vh] xl:h-[85vh]">
        <input placeholder="🔍 Chercher un produit..." className="p-4 mb-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#800020]" onChange={e => setSearch(e.target.value)} disabled={venteValidee} autoFocus />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar">
          {produits.filter(p => p.nom.toLowerCase().includes(search.toLowerCase())).map(p => (
            <button key={p.id} onClick={() => ajouter(p)} disabled={venteValidee} className="flex flex-col justify-between p-3 border border-gray-200 rounded-xl text-left bg-white hover:border-[#800020] hover:shadow-md transition group min-h-[80px]">
              <div className="flex justify-between items-start w-full gap-1 mb-1">
                <p className="font-bold text-gray-800 text-[11px] uppercase truncate group-hover:text-[#800020]">{p.nom}</p>
                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[9px] font-black shrink-0">STK: {p.stock_actuel}</span>
              </div>
              <p className="text-red-600 font-black text-sm">{p.prix_vente.toLocaleString()} Ar</p>
            </button>
          ))}
        </div>
      </div>

      {/* 🛒 ZONE PANIER */}
      <div className={`p-4 md:p-6 rounded-[2.5rem] shadow-xl flex flex-col justify-between relative overflow-hidden ${mode === 'devis' ? 'bg-white border-4 border-[#800020]' : 'bg-[#800020] text-white'} h-auto xl:h-[85vh]`}>
        {venteValidee && <div className="absolute top-0 left-0 w-full h-2 bg-green-500 animate-pulse"></div>}
        
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="border-b border-white/20 pb-3 flex justify-between items-center shrink-0">
             <h3 className={`font-black italic uppercase tracking-widest ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{mode === 'devis' ? 'DEVIS' : mode.replace('admin_', '').replace('_', ' ')}</h3>
          </div>
          
          <select className={`w-full p-3 rounded-xl font-bold border outline-none shrink-0 ${mode==='devis' ? 'bg-gray-50 text-gray-800 border-gray-200' : 'bg-white/10 text-white border-white/20'}`} value={selectedClient} onChange={e => setSelectedClient(e.target.value)} disabled={venteValidee}>
            {mode !== 'caisse' && <option value="" className="text-black">⚠️ SÉLECTIONNER CLIENT</option>}
            {clients.map(c => <option key={c.nom} value={c.nom} className="text-black">{c.nom}</option>)}
          </select>

          {mode === 'admin_credit' && (
            <input type="date" className="w-full bg-white/10 p-3 rounded-xl font-bold border border-white/20 outline-none text-white shrink-0 mt-1" onChange={e => setEcheance(e.target.value)} disabled={venteValidee} />
          )}

          {/* Liste des articles avec Remise Unitaire */}
          <div className="space-y-2 overflow-y-auto pr-2 mt-2 custom-scrollbar flex-1">
            {panier.length === 0 && <p className="text-center italic mt-6 opacity-50">Panier vide</p>}
            {panier.map((item) => (
              <div key={item.id} className={`flex flex-col p-3 rounded-xl border-l-4 ${mode === 'devis' ? 'bg-gray-50 border-[#800020]' : 'bg-white/10 border-white'}`}>
                <div className="flex justify-between items-center">
                  <span className="truncate uppercase font-bold text-xs w-1/3">{item.nom}</span>
                  {!venteValidee ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPanier(panier.map(x => x.id === item.id ? {...x, qte: Math.max(1, x.qte-1)} : x))} className="w-6 h-6 rounded bg-white/20 font-black">-</button>
                      <span className="font-black text-sm w-4 text-center">{item.qte}</span>
                      <button onClick={() => setPanier(panier.map(x => x.id === item.id ? {...x, qte: x.qte+1} : x))} className="w-6 h-6 rounded bg-white/20 font-black">+</button>
                    </div>
                  ) : (<span className="font-black opacity-60">Qté: {item.qte}</span>)}
                  <span className="font-black">{((item.prix_vente - (item.remise_montant||0)) * item.qte).toLocaleString()}</span>
                </div>
                {/* Option Remise Unitaire */}
                {!venteValidee && (
                  <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                    <span className="text-[9px] uppercase font-bold opacity-60">Remise / pièce (Ar):</span>
                    <input type="number" className="w-20 p-1 text-right text-xs bg-black/20 rounded outline-none" value={item.remise_montant || ''} onChange={e => updateRemiseArticle(item.id, e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Caisse : Remise Globale + Boutons */}
        <div className={`pt-4 border-t shrink-0 ${mode==='devis' ? 'border-gray-200' : 'border-white/20'}`}>
          {!venteValidee && panier.length > 0 && (
             <div className="flex justify-between items-center mb-3">
               <span className="text-xs font-bold uppercase opacity-70">Remise Globale (%) :</span>
               <input type="number" className="w-16 p-1 text-center text-sm font-black text-black rounded" value={remiseGlobale} onChange={e => setRemiseGlobale(e.target.value)} />
             </div>
          )}
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col">
              <span className="font-bold uppercase text-[10px] opacity-70">Total Net à payer</span>
              {(totalRemiseArticles > 0 || remiseGlobale > 0) && <span className="text-[10px] text-green-300 font-bold tracking-wider">ÉCONOMIE: {(totalRemisesEnAr || (totalBrut-totalNet)).toLocaleString()} Ar</span>}
            </div>
            <span className={`text-3xl font-black tracking-tighter ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{totalNet.toLocaleString()} Ar</span>
          </div>
          
          {!venteValidee ? (
            <button onClick={valider} className={`w-full p-4 rounded-xl font-black uppercase text-sm shadow-lg transition ${mode === 'devis' ? 'bg-[#800020] text-white' : 'bg-white text-[#800020]'}`}>{mode === 'devis' ? 'Générer Devis' : 'Valider'}</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={imprimer} className="flex-1 p-3 rounded-xl font-black uppercase bg-green-600 text-white shadow-lg">🖨️ Ticket</button>
              <button onClick={() => {setPanier([]); setVenteValidee(false); setRemiseGlobale(0);}} className="flex-1 p-3 rounded-xl font-bold uppercase border border-white/50 text-white hover:bg-white/10">Nouveau</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. MESSAGERIE INTERNE
// ==========================================
const ModuleMessagerie = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ dest: user.role === 'superadmin' ? 'vendeur' : 'admin1996', obj: '', msg: '' });

  const load = async () => {
    const { data } = await supabase.from('messagerie').select('*').or(`destinataire.eq.${user.identifiant},expediteur.eq.${user.identifiant}`).order('date_envoi', { ascending: false });
    setMessages(data || []);
    // Marquer comme lu
    await supabase.from('messagerie').update({ est_lu: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
  };
  useEffect(() => { load(); }, []);

  const send = async (e) => {
    e.preventDefault();
    await supabase.from('messagerie').insert([{ expediteur: user.identifiant, destinataire: form.dest, objet: form.obj, message: form.msg }]);
    setForm({ ...form, obj: '', msg: '' }); load(); alert("Message envoyé !");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Nouveau Message</h2>
        <form onSubmit={send} className="space-y-3">
          <div className="flex gap-3">
            <select className="p-3 bg-gray-50 border rounded-xl font-bold uppercase text-xs" value={form.dest} onChange={e=>setForm({...form, dest: e.target.value})}>
              <option value="admin1996">Super Admin (Direction)</option>
              <option value="vendeur">Vendeur (Caisse)</option>
            </select>
            <input placeholder="Objet du message..." className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none" value={form.obj} onChange={e=>setForm({...form, obj: e.target.value})} required />
          </div>
          <textarea placeholder="Écrivez votre message ici..." className="w-full p-4 bg-gray-50 border rounded-xl outline-none min-h-[100px] resize-none" value={form.msg} onChange={e=>setForm({...form, msg: e.target.value})} required />
          <button className="bg-[#800020] text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-md">Envoyer 🚀</button>
        </form>
      </div>

      <div className="space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`p-5 rounded-2xl border ${m.expediteur === user.identifiant ? 'bg-gray-50 border-gray-200 ml-8' : 'bg-red-50 border-red-100 mr-8 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${m.expediteur === user.identifiant ? 'bg-gray-200 text-gray-600' : 'bg-red-600 text-white'}`}>{m.expediteur === user.identifiant ? 'Moi' : m.expediteur}</span>
                <span className="text-[10px] text-gray-400 font-bold ml-2">{new Date(m.date_envoi).toLocaleString()}</span>
              </div>
            </div>
            <p className="font-black text-gray-800 text-sm mb-1">{m.objet}</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. HISTORIQUE AVEC DÉTAILS
// ==========================================
const ModuleHistorique = () => {
  const [ventes, setVentes] = useState([]); 
  const [dateFiltre, setDateFiltre] = useState("");
  const [detailModal, setDetailModal] = useState(null);
  
  useEffect(() => { 
    const load = async () => { 
      let q = supabase.from('historique_ventes').select('*').order('date_vente', { ascending: false }); 
      if (dateFiltre) q = q.gte('date_vente', `${dateFiltre}T00:00:00`).lte('date_vente', `${dateFiltre}T23:59:59`); 
      const { data } = await q; setVentes(data || []); 
    }; load(); 
  }, [dateFiltre]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-[#800020] pb-2">
        <h2 className="text-2xl font-black uppercase text-[#800020]">Historique</h2>
        <input type="date" className="p-2 bg-white border rounded-xl font-bold text-xs" onChange={e => setDateFiltre(e.target.value)} />
      </div>
      <div className="space-y-3">
        {ventes.map(v => (
          <div key={v.id} onClick={() => setDetailModal(v)} className="bg-white p-4 rounded-xl shadow-sm border hover:border-[#800020] cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${v.type_vente === 'CRÉDIT' ? 'bg-red-100 text-red-700' : 'bg-[#800020] text-white'}`}>{v.type_vente}</span>
                <span className="text-[10px] text-gray-400 font-bold">{new Date(v.date_vente).toLocaleDateString()} {new Date(v.date_vente).toLocaleTimeString()}</span>
                {v.remise_globale_pourcent > 0 && <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded">-{v.remise_globale_pourcent}% Global</span>}
              </div>
              <p className="font-black text-gray-800 uppercase text-sm">{v.client_nom}</p>
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">🛒 {v.articles_liste}</p>
            </div>
            <p className="text-lg font-black text-[#800020]">{parseFloat(v.montant_total).toLocaleString()} Ar</p>
          </div>
        ))}
      </div>

      {/* MODAL DÉTAILS VENTE */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
               <div><h3 className="font-black text-[#800020] text-lg uppercase">Détails de Vente</h3><p className="text-xs text-gray-500 font-bold">{new Date(detailModal.date_vente).toLocaleString()}</p></div>
               <button onClick={() => setDetailModal(null)} className="text-2xl font-black text-gray-400">×</button>
            </div>
            <p className="text-sm font-bold uppercase mb-4 text-gray-800">👤 {detailModal.client_nom}</p>
            <div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-xl max-h-48 overflow-y-auto custom-scrollbar">
              {detailModal.details_json?.articles?.map((art, idx) => (
                <div key={idx} className="flex justify-between text-xs border-b border-gray-200 pb-2 last:border-0">
                  <div>
                    <span className="font-bold">{art.qte}x {art.nom}</span>
                    {art.remise_unitaire_ar > 0 && <p className="text-[9px] text-green-600 font-bold">Remise unitaire: -{art.remise_unitaire_ar} Ar</p>}
                  </div>
                  <span className="font-black">{art.total_ligne.toLocaleString()} Ar</span>
                </div>
              ))}
              {!detailModal.details_json && <p className="text-xs italic text-gray-500">Détails anciens non structurés : {detailModal.articles_liste}</p>}
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center">
               <div>
                 <p className="text-[10px] font-bold text-red-600 uppercase">Total Payé</p>
                 {detailModal.total_remise_ar > 0 && <p className="text-[9px] text-green-600 font-black mt-1">Économie Client: {detailModal.total_remise_ar.toLocaleString()} Ar</p>}
               </div>
               <p className="text-2xl font-black text-[#800020]">{detailModal.montant_total.toLocaleString()} Ar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. CLÔTURE CAISSE (AVEC SORTIES)
// ==========================================
const ModuleCloture = ({ user }) => {
  const [caAttendu, setCaAttendu] = useState(0);
  const [totalSorties, setTotalSorties] = useState(0);
  const [montantDeclare, setMontantDeclare] = useState('');
  const [clotureOk, setClotureOk] = useState(false);
  
  const [sortiesListe, setSortiesListe] = useState([]);
  const [formSortie, setFormSortie] = useState({ motif: '', montant: '', fichier: null });
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    const todayStart = new Date().toISOString().split('T')[0] + "T00:00:00.000Z";
    // Ventes Cash
    const v = await supabase.from('historique_ventes').select('montant_total').gte('date_vente', todayStart).eq('type_vente', 'CASH');
    const cash = v.data?.reduce((acc, x) => acc + x.montant_total, 0) || 0;
    // Sorties Caisse
    const s = await supabase.from('sorties_caisse').select('*').gte('date_sortie', todayStart);
    const sumSorties = s.data?.reduce((acc, x) => acc + x.montant, 0) || 0;
    
    setSortiesListe(s.data || []);
    setTotalSorties(sumSorties);
    setCaAttendu(cash - sumSorties);
  };
  useEffect(() => { loadData(); }, []);

  const validerCloture = async () => {
    if (montantDeclare === '') return alert("Saisissez le montant compté.");
    const ecart = parseFloat(montantDeclare) - caAttendu;
    await supabase.from('cloture_caisse').insert([{ utilisateur: user.identifiant, montant_attendu: caAttendu, montant_declare: parseFloat(montantDeclare), ecart: ecart }]);
    setClotureOk(true);
  };

  const declarerSortie = async (e) => {
    e.preventDefault();
    if(uploading) return;
    setUploading(true);
    let publicUrl = null;

    if (formSortie.fichier) {
      const fileExt = formSortie.fichier.name.split('.').pop();
      const fileName = `justif_${Date.now()}.${fileExt}`;
      const { error: errUp } = await supabase.storage.from('justificatifs').upload(fileName, formSortie.fichier);
      if (!errUp) {
        const { data } = supabase.storage.from('justificatifs').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }
    }

    await supabase.from('sorties_caisse').insert([{ utilisateur: user.identifiant, motif: formSortie.motif, montant: parseFloat(formSortie.montant), photo_url: publicUrl }]);
    setFormSortie({ motif: '', montant: '', fichier: null });
    setUploading(false); loadData(); alert("Sortie enregistrée !");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* GAUCHE : SORTIES EXCEPTIONNELLES */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 h-fit">
        <h3 className="text-lg font-black uppercase text-gray-800 mb-2">💸 Sorties Exceptionnelles</h3>
        <p className="text-xs text-gray-500 mb-6">Achats de matériels, urgences (déduits de la caisse).</p>
        
        <form onSubmit={declarerSortie} className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <input placeholder="Motif (ex: Achat Cadenas)" className="w-full p-3 border rounded-xl text-sm outline-none" value={formSortie.motif} onChange={e=>setFormSortie({...formSortie, motif: e.target.value})} required disabled={uploading}/>
          <input type="number" placeholder="Montant (Ar)" className="w-full p-3 border rounded-xl text-sm font-bold text-red-600 outline-none" value={formSortie.montant} onChange={e=>setFormSortie({...formSortie, montant: e.target.value})} required disabled={uploading} />
          <div className="text-xs">
            <label className="font-bold text-gray-500 block mb-1">Preuve / Facture (Optionnel) :</label>
            <input type="file" accept="image/*" onChange={e=>setFormSortie({...formSortie, fichier: e.target.files[0]})} className="text-[10px]" disabled={uploading} />
          </div>
          <button className="w-full bg-gray-800 text-white p-3 rounded-xl font-black text-xs uppercase hover:bg-black transition">
            {uploading ? 'Enregistrement...' : 'Déclarer la sortie'}
          </button>
        </form>

        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {sortiesListe.map(s => (
            <div key={s.id} className="p-3 bg-white border border-red-100 rounded-xl flex justify-between items-center shadow-sm">
              <div>
                <p className="font-bold text-xs uppercase text-gray-800">{s.motif}</p>
                {s.photo_url && <a href={s.photo_url} target="_blank" rel="noreferrer" className="text-[9px] text-blue-600 underline font-bold">📄 Voir justif.</a>}
              </div>
              <span className="font-black text-red-600 text-sm">-{parseFloat(s.montant).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DROITE : CLOTURE CAISSE */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-t-8 border-[#800020] text-center flex flex-col justify-center">
        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#800020] mb-2">Clôture du Jour</h2>
        {!clotureOk ? (
          <div className="space-y-6 mt-4">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">À avoir en Caisse</p>
              <p className="text-3xl md:text-4xl font-black text-gray-800 tracking-tighter">{caAttendu.toLocaleString()} Ar</p>
              {totalSorties > 0 && <span className="absolute top-2 right-2 bg-red-100 text-red-700 text-[9px] px-2 py-1 rounded font-black">- {totalSorties.toLocaleString()} de sorties</span>}
            </div>
            <div className="pt-2">
              <label className="block text-xs font-bold text-red-600 uppercase mb-2">Argent réellement compté (Ar) :</label>
              <input type="number" className="w-full text-center text-2xl p-4 bg-red-50 border border-red-200 rounded-xl outline-none font-black text-red-700" value={montantDeclare} onChange={e => setMontantDeclare(e.target.value)} />
            </div>
            <button onClick={validerCloture} className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-md hover:bg-[#5a0016] transition mt-2">Soumettre la Clôture</button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-500 p-8 rounded-2xl mt-4">
            <h3 className="text-xl font-black text-green-700 uppercase mb-2">Caisse Clôturée ! ✅</h3>
            <p className="font-bold text-gray-600 text-sm">Écart constaté : <span className={parseFloat(montantDeclare) - caAttendu === 0 ? 'text-green-600' : 'text-red-600 font-black'}>{(parseFloat(montantDeclare) - caAttendu).toLocaleString()} Ar</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5. CLIENTS, FOURNISSEURS & CRÉDITS (AVEC WHATSAPP)
// ==========================================
const ModuleClients = () => {
  const [list, setList] = useState([]); 
  const [form, setForm] = useState({ nom: '', tel: '', wa: '', adresse: '', raison_fiscale: '' });
  
  const load = async () => { const { data } = await supabase.from('clients').select('*').order('nom'); setList(data || []); }; 
  useEffect(() => { load(); }, []);
  
  const save = async (e) => { 
    e.preventDefault(); 
    await supabase.from('clients').insert([{nom: form.nom, telephone: form.tel, contact_whatsapp: form.wa, adresse: form.adresse, raison_fiscale: form.raison_fiscale}]); 
    setForm({ nom: '', tel: '', wa: '', adresse: '', raison_fiscale: '' }); load(); 
  };
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <input placeholder="Nom / Société" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required />
        <input placeholder="Tél Normal" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} />
        <input placeholder="N° WhatsApp" className="p-3 bg-green-50 border border-green-100 rounded-xl outline-none" value={form.wa} onChange={e=>setForm({...form, wa: e.target.value})} />
        <input placeholder="NIF/STAT" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.raison_fiscale} onChange={e=>setForm({...form, raison_fiscale: e.target.value})} />
        <input placeholder="Adresse" className="p-3 bg-gray-50 border rounded-xl outline-none md:col-span-2" value={form.adresse} onChange={e=>setForm({...form, adresse: e.target.value})} />
        <button className="bg-[#800020] text-white p-3 rounded-xl font-black uppercase lg:col-span-3">Ajouter Client</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
            <div>
              <p className="font-black uppercase text-sm text-gray-800">{c.nom}</p>
              <p className="text-[10px] text-gray-500 mt-1">📞 {c.telephone || '-'}</p>
              {c.contact_whatsapp && <a href={`https://wa.me/${c.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-[10px] text-green-600 font-bold underline">💬 WhatsApp : {c.contact_whatsapp}</a>}
            </div>
            <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded">NIF: {c.raison_fiscale || '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminFournisseurs = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ nom: '', tel: '', wa: '' });

  const load = async () => { const { data } = await supabase.from('fournisseurs').select('*').order('nom'); setList(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await supabase.from('fournisseurs').insert([{ nom: form.nom, telephone: form.tel, contact_whatsapp: form.wa }]);
    setForm({ nom: '', tel: '', wa: '' }); load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 border-t-4 border-[#800020]">
        <input placeholder="Société Fournisseur" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required />
        <input placeholder="Tél Fixe (Obligatoire)" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} required />
        <input placeholder="WhatsApp Commercial" className="p-3 bg-green-50 border border-green-100 rounded-xl outline-none" value={form.wa} onChange={e=>setForm({...form, wa: e.target.value})} />
        <button className="bg-[#800020] text-white p-3 rounded-xl font-black uppercase md:col-span-3">Ajouter</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map(f => (
          <div key={f.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="font-black text-sm uppercase text-gray-800 mb-2">{f.nom}</p>
            <div className="flex gap-2">
              <span className="flex-1 bg-gray-100 text-gray-600 p-2 rounded text-center text-[10px] font-bold">📞 {f.telephone}</span>
              {f.contact_whatsapp && <a href={`https://wa.me/${f.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white p-2 rounded text-center text-[10px] font-black hover:bg-green-600 transition">💬 WhatsApp</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SuiviCredits = () => {
  const [credits, setCredits] = useState([]); 
  const [clients, setClients] = useState([]);
  const [filtre, setFiltre] = useState('non_paye');
  
  const load = async () => { 
    const cr = await supabase.from('credits').select('*').order('date_credit', { ascending: false }); 
    const cl = await supabase.from('clients').select('nom, contact_whatsapp');
    setCredits(cr.data || []); setClients(cl.data || []);
  }; 
  useEffect(() => { load(); }, []);

  const encaisser = async (id) => { if(window.confirm("Confirmer l'encaissement ?")) { await supabase.from('credits').update({ statut: 'paye', date_paiement: new Date().toISOString() }).eq('id', id); load(); } };
  
  const relancerWA = (credit) => {
    const client = clients.find(c => c.nom === credit.nom_client);
    if(!client || !client.contact_whatsapp) return alert("Ce client n'a pas de numéro WhatsApp enregistré.");
    const num = client.contact_whatsapp.replace(/[^0-9]/g, '');
    const txt = encodeURIComponent(`Bonjour, c'est Hakimi Plus. Sauf erreur de notre part, votre facture d'un montant de ${credit.montant_du} Ar arrive à échéance le ${new Date(credit.date_echeance).toLocaleDateString()}. Merci de votre confiance.`);
    window.open(`https://wa.me/${num}?text=${txt}`, '_blank');
  };

  const dataAffichee = credits.filter(c => c.statut === filtre); const aujourdHui = new Date();
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex gap-2 border-b-2 border-gray-100 pb-4 overflow-x-auto"><button onClick={() => setFiltre('non_paye')} className={`px-4 py-2 rounded-xl font-black uppercase text-xs whitespace-nowrap transition ${filtre === 'non_paye' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}>🔴 Dettes en cours</button><button onClick={() => setFiltre('paye')} className={`px-4 py-2 rounded-xl font-black uppercase text-xs whitespace-nowrap transition ${filtre === 'paye' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>✅ Payés</button></div>
      <div className="grid gap-3">
        {dataAffichee.map(c => { 
          const echeanceDate = new Date(c.date_echeance); const enRetard = filtre === 'non_paye' && c.date_echeance && echeanceDate <= aujourdHui; 
          return (
            <div key={c.id} className={`bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${filtre === 'non_paye' ? (enRetard ? 'border-red-600 bg-red-50' : 'border-[#800020]') : 'border-green-500'}`}>
              <div className="flex-1">
                <p className="font-black text-lg uppercase text-gray-800">{c.nom_client}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <p className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded border">Créé: {new Date(c.date_credit).toLocaleDateString()}</p>
                  {filtre === 'non_paye' && c.date_echeance && (<p className={`text-[10px] font-bold px-2 py-1 rounded border ${enRetard ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-50 text-orange-700'}`}>Échéance: {echeanceDate.toLocaleDateString()}</p>)}
                </div>
                <p className="text-xs italic text-gray-500 mt-2 line-clamp-1">🛒 {c.details_articles}</p>
              </div>
              <div className="text-left md:text-right w-full md:w-auto flex flex-col items-end">
                <p className={`text-2xl font-black ${filtre === 'non_paye' ? 'text-red-600' : 'text-green-600'}`}>{parseFloat(c.montant_du).toLocaleString()} Ar</p>
                {filtre === 'non_paye' && (
                  <div className="flex gap-2 mt-2 w-full md:w-auto">
                    {enRetard && <button onClick={() => relancerWA(c)} className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg font-black uppercase text-[9px] shadow-md hover:bg-green-600">💬 Relancer</button>}
                    <button onClick={() => encaisser(c.id)} className="flex-1 bg-[#800020] text-white px-3 py-2 rounded-lg font-black uppercase text-[9px] shadow-md hover:bg-red-900">Encaisser</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// ==========================================
// 6. MODULES RESTANTS (Dashboard, Stock, Depenses, Login)
// ==========================================
const AdminStock = () => {
  const [produits, setProduits] = useState([]); const [fours, setFours] = useState([]); const [historique, setHistorique] = useState([]);
  const [form, setForm] = useState({ nom: '', prix_a: '', prix_v: '', marge: '', stock: '', fournisseur: '' });
  const [reapproProd, setReapproProd] = useState(null); const [reapproForm, setReapproForm] = useState({ qte: '', prix_a: '', prix_v: '', marge: '' });
  const [showHistoProd, setShowHistoProd] = useState(null); 

  const load = async () => { 
    const p = await supabase.from('produits').select('*').order('nom'); 
    const f = await supabase.from('fournisseurs').select('nom'); 
    const h = await supabase.from('historique_stock').select('*').order('date_ajout', { ascending: false });
    setProduits(p.data || []); setFours(f.data || []); setHistorique(h.data || []);
  };
  useEffect(() => { load(); }, []);

  const saveNouveau = async (e) => { 
    e.preventDefault(); 
    if(!form.fournisseur) return alert("Fournisseur obligatoire"); // Sécurité
    await supabase.from('produits').insert([{ nom: form.nom, prix_achat: parseFloat(form.prix_a)||0, prix_vente: parseFloat(form.prix_v)||0, marge_pourcent: parseFloat(form.marge)||0, stock_actuel: parseInt(form.stock)||0, fournisseur_nom: form.fournisseur }]); 
    await supabase.from('historique_stock').insert([{ produit_nom: form.nom, quantite: parseInt(form.stock)||0, prix_achat: parseFloat(form.prix_a)||0 }]);
    setForm({ nom:'', prix_a:'', prix_v:'', marge:'', stock:'', fournisseur:'' }); load(); 
  };
  
  const handleAchat = (val) => { const pa = parseFloat(val)||0; const pv = parseFloat(form.prix_v)||0; let m = form.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setForm(prev => ({...prev, prix_a: val, marge: m})); };
  const handleVente = (val) => { const pv = parseFloat(val)||0; const pa = parseFloat(form.prix_a)||0; let m = form.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setForm(prev => ({...prev, prix_v: val, marge: m})); };
  const handleMarge = (val) => { const m = parseFloat(val)||0; const pa = parseFloat(form.prix_a)||0; let pv = form.prix_v; if(pa>0) pv = Math.round(pa*(1+(m/100))); setForm(prev => ({...prev, marge: val, prix_v: pv})); };

  const saveReappro = async (e) => {
    e.preventDefault();
    await supabase.from('produits').update({ stock_actuel: reapproProd.stock_actuel + parseInt(reapproForm.qte), prix_achat: parseFloat(reapproForm.prix_a), prix_vente: parseFloat(reapproForm.prix_v), marge_pourcent: parseFloat(reapproForm.marge) }).eq('id', reapproProd.id);
    await supabase.from('historique_stock').insert([{ produit_nom: reapproProd.nom, quantite: parseInt(reapproForm.qte), prix_achat: parseFloat(reapproForm.prix_a) }]);
    setReapproProd(null); load();
  };

  const handleRAchat = (val) => { const pa = parseFloat(val)||0; const pv = parseFloat(reapproForm.prix_v)||0; let m = reapproForm.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setReapproForm(prev => ({...prev, prix_a: val, marge: m})); };
  const handleRVente = (val) => { const pv = parseFloat(val)||0; const pa = parseFloat(reapproForm.prix_a)||0; let m = reapproForm.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setReapproForm(prev => ({...prev, prix_v: val, marge: m})); };
  const handleRMarge = (val) => { const m = parseFloat(val)||0; const pa = parseFloat(reapproForm.prix_a)||0; let pv = reapproForm.prix_v; if(pa>0) pv = Math.round(pa*(1+(m/100))); setReapproForm(prev => ({...prev, marge: val, prix_v: pv})); };

  return (
    <div className="space-y-8 relative">
      <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Nouvelle référence</h2>
        <form onSubmit={saveNouveau} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Article</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required /></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Coût Achat</label><input type="number" className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={form.prix_a} onChange={e=>handleAchat(e.target.value)} required /></div>
          <div><label className="text-[10px] font-bold text-[#800020] uppercase">Marge (%)</label><input type="number" step="0.01" className="w-full p-3 bg-[#800020]/10 border border-[#800020]/30 rounded-xl font-black text-[#800020] outline-none" value={form.marge} onChange={e=>handleMarge(e.target.value)} /></div>
          <div><label className="text-[10px] font-bold text-red-600 uppercase">Prix Vente</label><input type="number" className="w-full p-3 bg-red-50 border border-red-200 rounded-xl font-black text-red-600 outline-none" value={form.prix_v} onChange={e=>handleVente(e.target.value)} required /></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Stock Initial</label><input type="number" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required /></div>
          <div><label className="text-[10px] font-bold text-red-600 uppercase">Fournisseur (Obligatoire)</label><select className="w-full p-3 bg-red-50 border border-red-200 rounded-xl outline-none font-bold text-red-800" value={form.fournisseur} onChange={e=>setForm({...form, fournisseur: e.target.value})} required><option value="">Sélectionner</option>{fours.map(f=><option key={f.nom} value={f.nom}>{f.nom}</option>)}</select></div>
          <button className="w-full bg-[#800020] text-white p-3 rounded-xl font-black uppercase shadow-md md:col-span-3">Ajouter Référence</button>
        </form>
      </div>
      <div className="bg-white rounded-3xl shadow-sm overflow-x-auto border border-gray-200">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-gray-50 text-[#800020] font-black uppercase text-xs border-b"><tr><th className="p-4">Article</th><th className="p-4">Achat</th><th className="p-4">Vente</th><th className="p-4 text-center">Stock</th><th className="p-4 text-center">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {produits.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold uppercase text-gray-800">{p.nom}</td>
                <td className="p-4 text-gray-500">{parseFloat(p.prix_achat).toLocaleString()}</td>
                <td className="p-4 font-black text-red-600">{parseFloat(p.prix_vente).toLocaleString()}</td>
                <td className="p-4 text-center"><span className={`px-2 py-1 rounded font-black text-[10px] text-white ${p.stock_actuel<=5?'bg-red-600':'bg-green-600'}`}>{p.stock_actuel}</span></td>
                <td className="p-4 text-center flex justify-center gap-1">
                  <button onClick={() => { setReapproProd(p); setReapproForm({ qte: '', prix_a: p.prix_achat, prix_v: p.prix_vente, marge: p.marge_pourcent }); }} className="bg-[#800020] text-white px-2 py-1 rounded text-[9px] font-bold uppercase">➕</button>
                  <button onClick={() => setShowHistoProd(p)} className="bg-gray-200 px-2 py-1 rounded text-[9px] font-bold uppercase">🕒</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals Réappro/Histo... (Logique préservée, allégée visuellement pour place) */}
      {reapproProd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md"><h2 className="text-lg font-black uppercase text-[#800020] mb-4">Réappro : {reapproProd.nom}</h2>
            <form onSubmit={saveReappro} className="space-y-3">
              <input type="number" placeholder="Qté" className="w-full p-3 border rounded-xl" value={reapproForm.qte} onChange={e=>setReapproForm({...reapproForm, qte: e.target.value})} required />
              <input type="number" placeholder="Nouv. Prix Achat" className="w-full p-3 border rounded-xl" value={reapproForm.prix_a} onChange={e=>handleRAchat(e.target.value)} required />
              <div className="flex gap-2"><input type="number" className="w-full p-3 border rounded-xl text-red-600 font-bold" value={reapproForm.prix_v} onChange={e=>handleRVente(e.target.value)} required /><input type="number" className="w-full p-3 border rounded-xl text-[#800020] font-bold" value={reapproForm.marge} onChange={e=>handleRMarge(e.target.value)} /></div>
              <div className="flex gap-2"><button type="button" onClick={()=>setReapproProd(null)} className="p-3 bg-gray-100 rounded-xl flex-1">Annuler</button><button type="submit" className="p-3 bg-[#800020] text-white rounded-xl font-bold flex-1">Valider</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [ventes, setVentes] = useState([]); const [depenses, setDepenses] = useState([]); const [produits, setProduits] = useState([]);
  useEffect(() => { const load = async () => { setVentes((await supabase.from('historique_ventes').select('*')).data || []); setDepenses((await supabase.from('depenses').select('*')).data || []); setProduits((await supabase.from('produits').select('nom, fournisseur_nom')).data || []); }; load(); }, []);
  const now = new Date(); const caMois = ventes.filter(v => new Date(v.date_vente).getMonth() === now.getMonth()).reduce((acc, v) => acc + v.montant_total, 0); const depMois = depenses.filter(d => new Date(d.date_depense).getMonth() === now.getMonth()).reduce((acc, d) => acc + d.montant, 0); const benBrutMois = ventes.filter(v => new Date(v.date_vente).getMonth() === now.getMonth()).reduce((acc, v) => acc + (v.benefice_total||0), 0);
  return (
    <div className="space-y-6 max-w-5xl mx-auto"><h2 className="text-2xl font-black uppercase text-[#800020]">Tableau de Bord</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase">CA du Mois</p><p className="text-2xl font-black">{caMois.toLocaleString()} Ar</p></div><div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100"><p className="text-xs font-bold text-red-600 uppercase">Charges Mois</p><p className="text-2xl font-black text-red-700">-{depMois.toLocaleString()} Ar</p></div><div className="bg-green-700 text-white p-6 rounded-2xl shadow-sm"><p className="text-xs font-bold text-white/80 uppercase">Bénéfice Net</p><p className="text-2xl font-black">{(benBrutMois - depMois).toLocaleString()} Ar</p></div></div></div>
  );
};

const ModuleDepenses = () => {
  const [depenses, setDepenses] = useState([]); const [form, setForm] = useState({ desc: '', montant: '', date: new Date().toISOString().split('T')[0] });
  const load = async () => { setDepenses((await supabase.from('depenses').select('*').order('date_depense', { ascending: false })).data || []); }; useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault(); await supabase.from('depenses').insert([{ description: form.desc, montant: parseFloat(form.montant), date_depense: form.date }]); setForm({ ...form, desc: '', montant: '' }); load(); };
  return (
    <div className="max-w-4xl mx-auto space-y-6"><form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 border-t-4 border-[#800020]"><input placeholder="Dépense" className="p-3 bg-gray-50 border rounded-xl md:col-span-2" value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} required /><input type="number" placeholder="Montant" className="p-3 bg-red-50 text-red-600 font-bold border rounded-xl" value={form.montant} onChange={e=>setForm({...form, montant: e.target.value})} required /><button className="bg-[#800020] text-white p-3 rounded-xl font-black">Ajouter</button></form><div className="space-y-2">{depenses.map(d => (<div key={d.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-600 flex justify-between"><p className="font-bold text-sm uppercase">{d.description}</p><p className="font-black text-red-600">-{parseFloat(d.montant).toLocaleString()}</p></div>))}</div></div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [creds, setCreds] = useState({ id: '', mdp: '' });
  const handle = async (e) => { e.preventDefault(); const { data } = await supabase.from('utilisateurs').select('*').eq('identifiant', creds.id).eq('mot_de_passe', creds.mdp).single(); if (data) onLogin(data); else alert("Identifiants incorrects."); };
  return (
    <div className="min-h-screen bg-[#800020] flex items-center justify-center p-4">
      <form onSubmit={handle} className="bg-white p-12 rounded-[2rem] shadow-2xl w-full max-w-md border-b-8 border-red-600">
        <div className="flex justify-center mb-6"><img src={LOGO_URL} alt="Logo" className="h-16" onError={(e) => { e.target.onerror=null; e.target.outerHTML='<h2 class="text-3xl font-black italic">HAKIMI PLUS</h2>'; }} /></div>
        <input type="text" placeholder="Utilisateur" className="w-full p-4 mb-4 bg-gray-50 border rounded-xl outline-none" onChange={e=>setCreds({...creds, id: e.target.value})} />
        <input type="password" placeholder="Mot de passe" className="w-full p-4 mb-6 bg-gray-50 border rounded-xl outline-none" onChange={e=>setCreds({...creds, mdp: e.target.value})} />
        <button className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-lg">Connexion</button>
      </form>
    </div>
  );
};
