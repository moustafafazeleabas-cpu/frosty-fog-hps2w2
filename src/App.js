import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 🔒 SÉCURITÉ : VARIABLES D'ENVIRONNEMENT ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wblginsktosypbmhmgbr.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibGdpbnNrdG9zeXBibWhtZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjU3NTYsImV4cCI6MjA4OTk0MTc1Nn0.pmysPmutGjW2Tw7jFvrBE_0ue2pZmS32Pjncu1Rmr8w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOGO_URL = "https://wblginsktosypbmhmgbr.supabase.co/storage/v1/object/public/Hakimi%20logo/hakimi.jpg"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('caisse');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Écran de chargement pro
  useEffect(() => {
    setTimeout(() => setLoading(false), 1500);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#800020] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[#800020] font-black uppercase tracking-tighter animate-pulse text-2xl">HAKIMI PLUS</p>
    </div>
  );

  if (!user) return <LoginScreen onLogin={setUser} />;

  const changeView = (newView) => {
    setView(newView);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      {/* HEADER MOBILE */}
      <div className="md:hidden bg-[#800020] text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <span className="font-black text-xl italic uppercase">HAKIMI PLUS</span>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">☰</button>
      </div>

      {/* MENU LATÉRAL BORDEAUX */}
      <nav className={`${menuOpen ? 'block' : 'hidden'} md:block w-full md:w-72 bg-[#800020] text-white p-6 shadow-2xl flex flex-col justify-between md:sticky md:top-0 md:h-screen overflow-y-auto z-40 transition-all`}>
        <div>
          <div className="mb-10 hidden md:block text-center border-b border-white/10 pb-6">
             <h1 className="text-3xl font-black italic tracking-tighter">HAKIMI <span className="text-red-500">PLUS</span></h1>
             <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mt-1 text-center">Software Management</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-1">Menu Principal</p>
            <NavBtn active={view==='caisse'} onClick={()=>changeView('caisse')}>🛒 Caisse Directe</NavBtn>
            <NavBtn active={view==='facture_a4'} onClick={()=>changeView('facture_a4')}>📄 Facturation A4</NavBtn>
            <NavBtn active={view==='devis'} onClick={()=>changeView('devis')}>📝 Devis / Proforma</NavBtn>
            <NavBtn active={view==='admin_credit'} onClick={()=>changeView('admin_credit')}>🔴 Ventes à Crédit</NavBtn>
            
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-1 mt-6">Gestion</p>
            <NavBtn active={view==='clients'} onClick={()=>changeView('clients')}>👥 Base Clients</NavBtn>
            <NavBtn active={view==='historique'} onClick={()=>changeView('historique')}>📅 Journal Ventes</NavBtn>
            <NavBtn active={view==='cloture'} onClick={()=>changeView('cloture')}>💰 Clôture Caisse</NavBtn>

            {user.role === 'superadmin' && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
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
        <button onClick={()=>setUser(null)} className="mt-10 p-4 bg-white/10 hover:bg-red-600 rounded-xl text-xs font-black uppercase transition border border-white/10">Déconnexion</button>
      </nav>

      {/* ZONE CENTRALE */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        {(view==='caisse' || view==='facture_a4' || view==='admin_credit' || view==='devis') && <ModuleVente mode={view} />}
        {view==='admin_stock' && <AdminStock />}
        {view==='cloture' && <ModuleCloture user={user} />}
        {view==='admin_fournisseurs' && <AdminFournisseurs />}
        {view==='dashboard' && <AdminDashboard />}
        {view==='historique' && <ModuleHistorique />}
        {view==='clients' && <ModuleClients />}
        {view==='depenses' && <ModuleDepenses />}
        {view==='suivi_credits' && <SuiviCredits />}
      </main>
    </div>
  );
}

const NavBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`p-4 rounded-xl text-left font-bold text-sm transition-all ${active ? 'bg-white text-[#800020] shadow-xl translate-x-1' : 'hover:bg-white/5 text-white/80'}`}>{children}</button>
);

// ==========================================
// 1. MODULE VENTE 
// ==========================================
const ModuleVente = ({ mode }) => {
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [echeance, setEcheance] = useState("");
  const [printSize, setPrintSize] = useState('58mm');
  const [venteValidee, setVenteValidee] = useState(false);

  useEffect(() => {
    const load = async () => {
      const p = await supabase.from('produits').select('*').order('nom');
      const c = await supabase.from('clients').select('*').order('nom');
      setProduits(p.data || []);
      if (mode !== 'caisse') { setSelectedClient(""); setClients(c.data.filter(i => i.nom !== 'Vente à un utilisateur')); }
      else { setSelectedClient("Vente à un utilisateur"); setClients(c.data); }
    };
    load(); setPanier([]); setVenteValidee(false);
  }, [mode]);

  const total = panier.reduce((acc, i) => acc + (i.prix_vente * i.qte), 0);

  const ajouter = (p) => {
    if (venteValidee) return;
    const ex = panier.find(i => i.id === p.id);
    if (ex) setPanier(panier.map(i => i.id === p.id ? { ...i, qte: i.qte + 1 } : i));
    else setPanier([...panier, { ...p, qte: 1 }]);
  };

  const valider = async () => {
    if (panier.length === 0) return;
    if (mode !== 'caisse' && !selectedClient) return alert("Client requis");
    
    for (let item of panier) { await supabase.rpc('decrement_stock', { row_id: item.id, amount: item.qte }); }
    
    await supabase.from('historique_ventes').insert([{
      type_vente: mode.replace('admin_', '').toUpperCase(), client_nom: selectedClient,
      articles_liste: panier.map(i => `${i.qte}x ${i.nom}`).join(', '),
      montant_total: total, benefice_total: panier.reduce((acc, i) => acc + ((i.prix_vente - i.prix_achat) * i.qte), 0)
    }]);

    if (mode === 'admin_credit') {
      await supabase.from('credits').insert([{ nom_client: selectedClient, montant_du: total, details_articles: panier.map(i => `${i.qte}x ${i.nom}`).join(', '), date_echeance: echeance }]);
    }
    setVenteValidee(true);
  };

  const imprimer = () => {
    if (mode === 'caisse') {
      const win = window.open('', '', `width=${printSize === '58mm' ? 300 : 400},height=600`);
      win.document.write(`<html><body style="font-family:monospace; width:${printSize}; padding:10px; font-size:12px; margin:0 auto; text-align:center;">
        <h2 style="margin:0;">HAKIMI PLUS</h2>
        <p style="margin:0; font-size:10px;">${new Date().toLocaleString()}</p>
        <hr style="border-top:1px dashed #000;"/>
        ${panier.map(i => `<div style="display:flex; justify-content:space-between; margin:5px 0;"><span>${i.qte}x ${i.nom}</span><span>${(i.prix_vente * i.qte).toLocaleString()}</span></div>`).join('')}
        <hr style="border-top:1px dashed #000;"/>
        <h3 style="text-align:right;">TOTAL: ${total.toLocaleString()} Ar</h3>
        <p>Merci de votre visite !</p>
      </body></html>`);
      win.document.close(); setTimeout(() => { win.print(); win.close(); }, 800);
    } else {
      const cData = clients.find(c => c.nom === selectedClient) || { nom: selectedClient, raison_fiscale: '', adresse: '' };
      const win = window.open('', '', 'width=800,height=900');
      let titre = mode === 'devis' ? 'PROFORMA / DEVIS' : (mode === 'admin_credit' ? 'FACTURE À CRÉDIT' : 'FACTURE');
      
      win.document.write(`<html><body style="font-family:Arial; padding:40px;">
        <div style="display:flex; justify-content:space-between; border-bottom:3px solid #800020; padding-bottom:15px; margin-bottom:20px;">
          <div><h1 style="color:#800020; margin:0;">HAKIMI PLUS</h1><p style="margin:0; color:#555;">Antananarivo, Mada<br/>Non assujetti à la TVA (0%)</p></div>
          <div style="text-align:right;"><h2 style="margin:0; color:#800020;">${titre}</h2><p>Date : ${new Date().toLocaleDateString()}</p></div>
        </div>
        <div style="margin:30px 0; padding:20px; background:#f9f9f9; border-left:5px solid #800020; border-radius:5px; width:60%;">
          <strong>Client :</strong> ${cData.nom}<br/>
          <strong>NIF/STAT :</strong> ${cData.raison_fiscale || '-'}<br/>
          ${mode === 'admin_credit' ? `<br/><strong style="color:red;">Échéance : ${new Date(echeance).toLocaleDateString()}</strong>` : ''}
        </div>
        <table style="width:100%; border-collapse:collapse; margin-top:20px;">
          <thead><tr style="background:#800020; color:#fff; text-align:left;"><th style="padding:12px;">Désignation</th><th style="padding:12px;">Qté</th><th style="padding:12px;">Prix U.</th><th style="padding:12px; text-align:right;">Total</th></tr></thead>
          <tbody>${panier.map(i => `<tr><td style="padding:12px; border-bottom:1px solid #eee;">${i.nom}</td><td style="padding:12px; border-bottom:1px solid #eee;">${i.qte}</td><td style="padding:12px; border-bottom:1px solid #eee;">${i.prix_vente.toLocaleString()}</td><td style="padding:12px; border-bottom:1px solid #eee; text-align:right;">${(i.prix_vente * i.qte).toLocaleString()} Ar</td></tr>`).join('')}</tbody>
        </table>
        <div style="text-align:right; margin-top:30px; font-size:24px; font-weight:900; color:#800020;">TOTAL : ${total.toLocaleString()} Ar</div>
        ${mode === 'devis' ? '<p style="text-align:center; margin-top:50px; font-style:italic; color:#888;">Ce document est un devis estimatif et ne constitue pas une facture. Valable 30 jours.</p>' : ''}
      </body></html>`);
      win.document.close(); setTimeout(() => { win.print(); }, 800);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 h-full">
      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border-t-4 border-[#800020] flex flex-col h-[50vh] md:h-[80vh]">
        <input placeholder="🔍 Rechercher un produit..." className="p-4 mb-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#800020] text-lg w-full" onChange={e => setSearch(e.target.value)} disabled={venteValidee} autoFocus />
        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar">
          {produits.filter(p => p.nom.toLowerCase().includes(search.toLowerCase())).map(p => (
            <button key={p.id} onClick={() => ajouter(p)} disabled={venteValidee} className="p-3 border border-gray-200 rounded-xl text-left bg-white hover:border-[#800020] hover:shadow-md transition group">
              <p className="font-bold text-gray-800 text-xs uppercase truncate pr-8 group-hover:text-[#800020]">{p.nom}</p>
              <p className="text-red-600 font-black mt-1">{p.prix_vente.toLocaleString()} Ar</p>
              <span className="absolute top-2 right-2 bg-gray-100 text-gray-500 px-2 py-1 rounded text-[9px] font-black">STK: {p.stock_actuel}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`p-4 md:p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between relative overflow-hidden ${mode === 'devis' ? 'bg-white border-4 border-[#800020]' : 'bg-[#800020] text-white'}`}>
        {venteValidee && <div className="absolute top-0 left-0 w-full h-2 bg-green-500 animate-pulse"></div>}
        
        <div className="space-y-4">
          <div className={`flex justify-between items-center border-b pb-3 ${mode==='devis' ? 'border-gray-200' : 'border-white/20'}`}>
             <h3 className={`font-black italic uppercase text-lg tracking-widest ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{mode === 'devis' ? 'CRÉATION DEVIS' : mode.replace('admin_', '').replace('_', ' ')}</h3>
             {mode === 'caisse' && (
               <select className="bg-white/10 text-xs p-2 rounded outline-none font-bold border border-white/20 text-white" value={printSize} onChange={e => setPrintSize(e.target.value)} disabled={venteValidee}>
                 <option value="58mm" className="text-black">Ticket 58mm</option><option value="80mm" className="text-black">Ticket 80mm</option>
               </select>
             )}
          </div>
          
          <select className={`w-full p-4 rounded-xl font-bold border outline-none ${mode==='devis' ? 'bg-gray-50 text-gray-800 border-gray-200' : 'bg-white/10 text-white border-white/20'}`} value={selectedClient} onChange={e => setSelectedClient(e.target.value)} disabled={venteValidee}>
            {mode !== 'caisse' && <option value="" className="text-black">⚠️ SÉLECTIONNER CLIENT</option>}
            {clients.map(c => <option key={c.nom} value={c.nom} className="text-black">{c.nom}</option>)}
          </select>

          {mode === 'admin_credit' && (
            <div className="mt-2">
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Date d'échéance</label>
              <input type="date" className="w-full bg-white/10 p-3 rounded-xl font-bold border border-white/20 outline-none text-white mt-1" onChange={e => setEcheance(e.target.value)} disabled={venteValidee} />
            </div>
          )}

          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {panier.length === 0 && <p className={`text-center italic mt-6 ${mode==='devis' ? 'text-gray-400' : 'text-white/50'}`}>Panier vide</p>}
            {panier.map((item, i) => (
              <div key={i} className={`flex justify-between items-center p-3 rounded-xl border-l-4 ${mode === 'devis' ? 'bg-gray-50 border-[#800020]' : 'bg-white/10 border-white'}`}>
                <span className={`w-24 md:w-28 truncate uppercase font-bold text-xs ${mode==='devis' ? 'text-gray-800' : 'text-white'}`}>{item.nom}</span>
                {!venteValidee ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPanier(panier.map(x => x.id === item.id ? {...x, qte: Math.max(1, x.qte-1)} : x))} className={`w-6 h-6 md:w-8 md:h-8 rounded-lg font-black transition ${mode==='devis' ? 'bg-gray-200 text-gray-800' : 'bg-white/20 text-white hover:bg-red-500'}`}>-</button>
                    <span className={`font-black w-4 text-center ${mode==='devis' ? 'text-gray-800' : 'text-white'}`}>{item.qte}</span>
                    <button onClick={() => setPanier(panier.map(x => x.id === item.id ? {...x, qte: x.qte+1} : x))} className={`w-6 h-6 md:w-8 md:h-8 rounded-lg font-black transition ${mode==='devis' ? 'bg-gray-200 text-gray-800' : 'bg-white/20 text-white hover:bg-green-500'}`}>+</button>
                  </div>
                ) : (<span className={`font-black ${mode==='devis' ? 'text-gray-500' : 'text-white/60'}`}>Qté: {item.qte}</span>)}
                <span className={`font-black ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{(item.prix_vente * item.qte).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`pt-4 border-t mt-4 ${mode==='devis' ? 'border-gray-200' : 'border-white/20'}`}>
          <div className="flex justify-between items-end mb-4">
            <span className={`font-bold uppercase text-xs ${mode==='devis' ? 'text-gray-500' : 'text-white/70'}`}>Total Net</span>
            <span className={`text-2xl md:text-3xl font-black tracking-tighter ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{total.toLocaleString()} Ar</span>
          </div>
          {!venteValidee ? (
            <button onClick={valider} className={`w-full p-4 rounded-xl font-black uppercase text-sm md:text-lg shadow-lg transition-all ${mode === 'devis' ? 'bg-[#800020] text-white hover:bg-[#5a0016]' : 'bg-white text-[#800020] hover:bg-gray-100'}`}>
              {mode === 'devis' ? 'Générer le Devis' : 'Valider la Vente'}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button onClick={imprimer} className={`w-full p-4 rounded-xl font-black uppercase shadow-lg ${mode==='devis' ? 'bg-green-600 text-white' : 'bg-white text-green-700'}`}>🖨️ Imprimer</button>
              <button onClick={() => {setPanier([]); setVenteValidee(false); setSelectedClient(mode === 'caisse' ? "Vente à un utilisateur" : ""); setEcheance("");}} className={`w-full p-3 rounded-xl font-bold uppercase border ${mode==='devis' ? 'bg-gray-100 text-gray-800' : 'bg-transparent text-white border-white'}`}>Nouvelle Opération</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. DASHBOARD (AVEC DEPENSES MOIS & ANNEE)
// ==========================================
const AdminDashboard = () => {
  const [ventes, setVentes] = useState([]); 
  const [depenses, setDepenses] = useState([]); 
  const [produits, setProduits] = useState([]);
  
  useEffect(() => { 
    const loadData = async () => { 
      const v = await supabase.from('historique_ventes').select('*'); 
      const d = await supabase.from('depenses').select('*'); 
      const p = await supabase.from('produits').select('nom, fournisseur_nom'); 
      setVentes(v.data || []); setDepenses(d.data || []); setProduits(p.data || []); 
    }; 
    loadData(); 
  }, []);

  const now = new Date(); 
  const getVentesFiltrees = (daysOffset) => ventes.filter(v => (now - new Date(v.date_vente)) / (1000 * 60 * 60 * 24) <= daysOffset);
  const caJour = getVentesFiltrees(1).reduce((acc, v) => acc + v.montant_total, 0); 
  const caHebdo = getVentesFiltrees(7).reduce((acc, v) => acc + v.montant_total, 0);
  
  const ventesMois = ventes.filter(v => new Date(v.date_vente).getMonth() === now.getMonth() && new Date(v.date_vente).getFullYear() === now.getFullYear()); 
  const caMois = ventesMois.reduce((acc, v) => acc + v.montant_total, 0);
  const beneficeBrutMois = ventesMois.reduce((acc, v) => acc + (v.benefice_total || 0), 0); 
  
  // Dépenses
  const depensesMois = depenses.filter(d => new Date(d.date_depense).getMonth() === now.getMonth() && new Date(d.date_depense).getFullYear() === now.getFullYear()).reduce((acc, d) => acc + d.montant, 0); 
  const depensesAnnee = depenses.filter(d => new Date(d.date_depense).getFullYear() === now.getFullYear()).reduce((acc, d) => acc + d.montant, 0); 
  
  const beneficeNet = beneficeBrutMois - depensesMois;
  
  let counts = {}; 
  ventes.forEach(v => { if(!v.articles_liste) return; v.articles_liste.split(', ').forEach(itemStr => { const match = itemStr.match(/^(\d+)x\s+(.+)$/); if(match) counts[match[2]] = (counts[match[2]] || 0) + parseInt(match[1]); }); });
  const topProducts = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nom, qte]) => { const pInfo = produits.find(p => p.nom === nom); return { nom, qte, fournisseur: pInfo ? pInfo.fournisseur_nom : 'Inconnu' }; });
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[#800020] border-b-2 border-gray-200 pb-2">Tableau de Bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Marge Brute (Mois)</p>
          <p className="text-2xl md:text-3xl font-black text-gray-800 mt-2">{beneficeBrutMois.toLocaleString()} Ar</p>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl shadow-sm border border-red-100">
          <p className="text-xs font-bold text-red-600 uppercase">Charges ce Mois</p>
          <p className="text-2xl md:text-3xl font-black text-red-700 mt-2">- {depensesMois.toLocaleString()} Ar</p>
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-[10px] font-bold text-red-500 uppercase">Total Année en cours</p>
            <p className="text-sm font-black text-red-800">- {depensesAnnee.toLocaleString()} Ar</p>
          </div>
        </div>
        <div className={`p-6 rounded-3xl shadow-md text-white ${beneficeNet >= 0 ? 'bg-green-700' : 'bg-red-700'}`}>
          <p className="text-xs font-bold text-white/80 uppercase">BÉNÉFICE NET (Mois)</p>
          <p className="text-3xl md:text-4xl font-black tracking-tighter mt-2">{beneficeNet.toLocaleString()} Ar</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020] overflow-x-auto">
        <h3 className="font-black text-[#800020] uppercase text-xs mb-4">Chiffre d'Affaires</h3>
        <div className="flex justify-between min-w-[400px]">
          <div><p className="text-[10px] uppercase font-bold text-gray-400">Aujourd'hui</p><p className="font-black text-lg">{caJour.toLocaleString()}</p></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400">Cette semaine</p><p className="font-black text-lg">{caHebdo.toLocaleString()}</p></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400">Ce mois</p><p className="font-black text-xl text-[#800020]">{caMois.toLocaleString()}</p></div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-400 uppercase text-xs mb-4">Top 5 Ventes</h3>
        <div className="grid gap-2">
          {topProducts.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="bg-[#800020] text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]">#{idx+1}</span>
                <div><p className="font-black text-gray-800 uppercase text-xs">{p.nom}</p><p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">🚚 {p.fournisseur}</p></div>
              </div>
              <p className="font-black text-sm text-gray-800">{p.qte}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. JOURNAL VENTES (AVEC EXPORT EXCEL)
// ==========================================
const ModuleHistorique = () => {
  const [ventes, setVentes] = useState([]); 
  const [dateFiltre, setDateFiltre] = useState("");
  
  useEffect(() => { 
    const load = async () => { 
      let q = supabase.from('historique_ventes').select('*').order('date_vente', { ascending: false }); 
      if (dateFiltre) q = q.gte('date_vente', `${dateFiltre}T00:00:00`).lte('date_vente', `${dateFiltre}T23:59:59`); 
      const { data } = await q; setVentes(data || []); 
    }; 
    load(); 
  }, [dateFiltre]);

  // Fonction Export EXCEL (CSV Français)
  const exporterExcel = () => {
    // Entêtes avec points-virgules pour Excel FR
    const headers = ["Date", "Type de Vente", "Client", "Articles", "Montant Total (Ar)", "Benefice (Ar)"];
    
    const csvContent = [
      headers.join(";"),
      ...ventes.map(v => [
        new Date(v.date_vente).toLocaleString('fr-FR'),
        v.type_vente,
        v.client_nom,
        `"${v.articles_liste}"`, // Guillemets pour éviter de casser les colonnes s'il y a des virgules dans la liste
        v.montant_total,
        v.benefice_total || 0
      ].join(";"))
    ].join("\n");

    // Création du fichier et téléchargement forcé
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF pour l'encodage des accents
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Hakimi_Export_Ventes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-[#800020] pb-2">
        <h2 className="text-2xl font-black uppercase text-[#800020]">Historique</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input type="date" className="p-2 bg-white border rounded-xl font-bold text-xs w-full md:w-auto" onChange={e => setDateFiltre(e.target.value)} />
          <button onClick={exporterExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md whitespace-nowrap transition">
            📊 Export Excel
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {ventes.map(v => (
          <div key={v.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${v.type_vente === 'CRÉDIT' ? 'bg-red-100 text-red-700' : (v.type_vente === 'FACTURE' ? 'bg-[#800020] text-white' : 'bg-gray-100 text-gray-600')}`}>{v.type_vente}</span>
                <span className="text-[10px] text-gray-400 font-bold">{new Date(v.date_vente).toLocaleDateString()} {new Date(v.date_vente).toLocaleTimeString()}</span>
              </div>
              <p className="font-black text-gray-800 uppercase text-sm">{v.client_nom}</p>
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">🛒 {v.articles_liste}</p>
            </div>
            <p className="text-lg font-black text-[#800020]">{parseFloat(v.montant_total).toLocaleString()} Ar</p>
          </div>
        ))}
        {ventes.length === 0 && <p className="text-center text-gray-400 italic mt-10">Aucune vente trouvée.</p>}
      </div>
    </div>
  );
};

// ==========================================
// AUTRES MODULES 
// ==========================================
const AdminStock = () => {
  const [produits, setProduits] = useState([]);
  const [fours, setFours] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [form, setForm] = useState({ nom: '', prix_a: '', prix_v: '', marge: '', stock: '', fournisseur: '' });
  
  const [reapproProd, setReapproProd] = useState(null);
  const [reapproForm, setReapproForm] = useState({ qte: '', prix_a: '', prix_v: '', marge: '' });
  const [showHistoProd, setShowHistoProd] = useState(null); 

  const load = async () => { 
    const p = await supabase.from('produits').select('*').order('nom'); 
    const f = await supabase.from('fournisseurs').select('nom'); 
    const h = await supabase.from('historique_stock').select('*').order('date_ajout', { ascending: false });
    setProduits(p.data || []); setFours(f.data || []); setHistorique(h.data || []);
  };
  useEffect(() => { load(); }, []);

  const handleAchat = (val) => { const pa = parseFloat(val)||0; const pv = parseFloat(form.prix_v)||0; let m = form.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setForm(prev => ({...prev, prix_a: val, marge: m})); };
  const handleVente = (val) => { const pv = parseFloat(val)||0; const pa = parseFloat(form.prix_a)||0; let m = form.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setForm(prev => ({...prev, prix_v: val, marge: m})); };
  const handleMarge = (val) => { const m = parseFloat(val)||0; const pa = parseFloat(form.prix_a)||0; let pv = form.prix_v; if(pa>0) pv = Math.round(pa*(1+(m/100))); setForm(prev => ({...prev, marge: val, prix_v: pv})); };
  
  const saveNouveau = async (e) => { 
    e.preventDefault(); 
    await supabase.from('produits').insert([{ nom: form.nom, prix_achat: parseFloat(form.prix_a)||0, prix_vente: parseFloat(form.prix_v)||0, marge_pourcent: parseFloat(form.marge)||0, stock_actuel: parseInt(form.stock)||0, fournisseur_nom: form.fournisseur }]); 
    await supabase.from('historique_stock').insert([{ produit_nom: form.nom, quantite: parseInt(form.stock)||0, prix_achat: parseFloat(form.prix_a)||0 }]);
    setForm({ nom:'', prix_a:'', prix_v:'', marge:'', stock:'', fournisseur:'' }); load(); 
  };

  const handleReapproAchat = (val) => { const pa = parseFloat(val)||0; const pv = parseFloat(reapproForm.prix_v)||0; let m = reapproForm.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setReapproForm(prev => ({...prev, prix_a: val, marge: m})); };
  const handleReapproVente = (val) => { const pv = parseFloat(val)||0; const pa = parseFloat(reapproForm.prix_a)||0; let m = reapproForm.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setReapproForm(prev => ({...prev, prix_v: val, marge: m})); };
  const handleReapproMarge = (val) => { const m = parseFloat(val)||0; const pa = parseFloat(reapproForm.prix_a)||0; let pv = reapproForm.prix_v; if(pa>0) pv = Math.round(pa*(1+(m/100))); setReapproForm(prev => ({...prev, marge: val, prix_v: pv})); };

  const saveReappro = async (e) => {
    e.preventDefault();
    const newQte = parseInt(reapproForm.qte) || 0;
    const newAchat = parseFloat(reapproForm.prix_a) || 0;
    const newVente = parseFloat(reapproForm.prix_v) || 0;
    const newMarge = parseFloat(reapproForm.marge) || 0;
    await supabase.from('produits').update({ stock_actuel: reapproProd.stock_actuel + newQte, prix_achat: newAchat, prix_vente: newVente, marge_pourcent: newMarge }).eq('id', reapproProd.id);
    await supabase.from('historique_stock').insert([{ produit_nom: reapproProd.nom, quantite: newQte, prix_achat: newAchat }]);
    setReapproProd(null); load(); alert("Stock mis à jour avec succès !");
  };

  return (
    <div className="space-y-8 relative">
      <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Créer une nouvelle référence</h2>
        <form onSubmit={saveNouveau} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Article</label><input className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Coût Achat</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" value={form.prix_a} onChange={e=>handleAchat(e.target.value)} required /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-[#800020] uppercase">Marge (%)</label><input type="number" step="0.01" className="w-full p-4 bg-[#800020]/10 border border-[#800020]/30 rounded-xl font-black text-[#800020] outline-none" value={form.marge} onChange={e=>handleMarge(e.target.value)} /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-red-600 uppercase">Prix Vente</label><input type="number" className="w-full p-4 bg-red-50 border border-red-200 rounded-xl font-black text-red-600 outline-none" value={form.prix_v} onChange={e=>handleVente(e.target.value)} required /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Stock Initial</label><input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Fournisseur</label><select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={form.fournisseur} onChange={e=>setForm({...form, fournisseur: e.target.value})}><option value="">Sélectionner</option>{fours.map(f=><option key={f.nom} value={f.nom}>{f.nom}</option>)}</select></div>
          <div className="md:col-span-2 lg:col-span-3 mt-4"><button className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-md hover:bg-[#5a0016]">Ajouter Référence</button></div>
        </form>
      </div>
      <div className="bg-white rounded-3xl shadow-sm overflow-x-auto border border-gray-200">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-gray-50 text-[#800020] font-black uppercase text-xs border-b">
            <tr><th className="p-4">Article</th><th className="p-4">Achat</th><th className="p-4">Vente</th><th className="p-4">Marge</th><th className="p-4 text-center">Stock</th><th className="p-4 text-center">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produits.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-bold uppercase text-gray-800">{p.nom}</td>
                <td className="p-4 text-gray-500">{parseFloat(p.prix_achat||0).toLocaleString()} Ar</td>
                <td className="p-4 font-black text-red-600">{parseFloat(p.prix_vente).toLocaleString()} Ar</td>
                <td className="p-4 text-[#800020] font-bold">{p.marge_pourcent||0}%</td>
                <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full font-black text-xs text-white ${p.stock_actuel <= 5 ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`}>{p.stock_actuel}</span></td>
                <td className="p-4 text-center flex justify-center gap-2">
                  <button onClick={() => { setReapproProd(p); setReapproForm({ qte: '', prix_a: p.prix_achat, prix_v: p.prix_vente, marge: p.marge_pourcent }); }} className="bg-[#800020] text-white px-2 py-1 rounded shadow text-[10px] font-bold uppercase hover:bg-[#5a0016]">➕ Réappro</button>
                  <button onClick={() => setShowHistoProd(p)} className="bg-gray-200 text-gray-800 px-2 py-1 rounded shadow text-[10px] font-bold uppercase hover:bg-gray-300">🕒 Histo</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reapproProd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black uppercase text-[#800020] mb-1">Rajout de stock</h2>
            <p className="text-gray-500 font-bold mb-6 italic text-sm">{reapproProd.nom}</p>
            <form onSubmit={saveReappro} className="space-y-4">
              <div><label className="text-[10px] font-bold text-gray-400 uppercase">Quantité reçue</label><input type="number" className="w-full p-3 border-2 rounded-xl outline-none font-black" value={reapproForm.qte} onChange={e=>setReapproForm({...reapproForm, qte: e.target.value})} required autoFocus /></div>
              <div><label className="text-[10px] font-bold text-gray-400 uppercase">Nouveau Prix Achat</label><input type="number" className="w-full p-3 border-2 rounded-xl outline-none" value={reapproForm.prix_a} onChange={e=>handleReapproAchat(e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-[#800020] uppercase">Marge (%)</label><input type="number" step="0.01" className="w-full p-3 bg-[#800020]/10 rounded-xl text-[#800020] font-black outline-none" value={reapproForm.marge} onChange={e=>handleReapproMarge(e.target.value)} /></div>
                <div><label className="text-[10px] font-bold text-red-600 uppercase">Prix Vente</label><input type="number" className="w-full p-3 bg-red-50 rounded-xl text-red-600 font-black outline-none" value={reapproForm.prix_v} onChange={e=>handleReapproVente(e.target.value)} required /></div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setReapproProd(null)} className="flex-1 p-3 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase">Annuler</button>
                <button type="submit" className="flex-[2] p-3 bg-[#800020] text-white rounded-xl font-black uppercase shadow-lg hover:bg-[#5a0016]">Valider Entrée</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoProd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-black uppercase text-[#800020]">Historique d'Achat</h2>
              <button onClick={() => setShowHistoProd(null)} className="text-gray-400 font-black text-xl">X</button>
            </div>
            <p className="text-gray-800 font-black mb-4 text-sm">{showHistoProd.nom}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {historique.filter(h => h.produit_nom === showHistoProd.nom).map(h => (
                <div key={h.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800 text-xs">+{h.quantite} pièces</p>
                    <p className="text-[10px] text-gray-500 uppercase">{new Date(h.date_ajout).toLocaleDateString()}</p>
                  </div>
                  <p className="font-black text-red-600 text-sm">{parseFloat(h.prix_achat).toLocaleString()} Ar</p>
                </div>
              ))}
              {historique.filter(h => h.produit_nom === showHistoProd.nom).length === 0 && <p className="text-center text-gray-400 italic text-xs">Aucun historique</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ModuleCloture = ({ user }) => {
  const [caAttendu, setCaAttendu] = useState(0);
  const [montantDeclare, setMontantDeclare] = useState('');
  const [clotureOk, setClotureOk] = useState(false);

  useEffect(() => {
    const calcCaisse = async () => {
      const todayStart = new Date().toISOString().split('T')[0] + "T00:00:00.000Z";
      const { data } = await supabase.from('historique_ventes').select('*').gte('date_vente', todayStart).eq('type_vente', 'CASH');
      const totalCash = data?.reduce((acc, v) => acc + v.montant_total, 0) || 0;
      setCaAttendu(totalCash);
    };
    calcCaisse();
  }, []);

  const validerCloture = async () => {
    if (montantDeclare === '') return alert("Saisissez le montant de votre caisse.");
    const ecart = parseFloat(montantDeclare) - caAttendu;
    await supabase.from('cloture_caisse').insert([{ utilisateur: user.identifiant, montant_attendu: caAttendu, montant_declare: parseFloat(montantDeclare), ecart: ecart }]);
    setClotureOk(true);
  };

  return (
    <div className="max-w-2xl mx-auto mt-4 md:mt-10">
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border-t-4 border-[#800020] text-center">
        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#800020] mb-2">Clôture Journalière</h2>
        <p className="text-gray-500 font-bold mb-8 text-sm">Comptez l'argent physique présent dans la caisse.</p>
        {!clotureOk ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Espèces attendues</p>
              <p className="text-3xl md:text-4xl font-black text-gray-800 tracking-tighter">{caAttendu.toLocaleString()} Ar</p>
            </div>
            <div className="pt-4">
              <label className="block text-xs font-bold text-red-600 uppercase mb-2">Montant Réel compté (Ar) :</label>
              <input type="number" className="w-full text-center text-2xl p-4 bg-red-50 border border-red-200 rounded-xl outline-none font-black text-red-700" value={montantDeclare} onChange={e => setMontantDeclare(e.target.value)} autoFocus />
            </div>
            <button onClick={validerCloture} className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-md hover:bg-[#5a0016] transition mt-2">Soumettre</button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-500 p-8 rounded-2xl">
            <h3 className="text-xl font-black text-green-700 uppercase mb-2">Caisse Clôturée ! ✅</h3>
            <p className="font-bold text-gray-600 text-sm">Écart constaté : <span className={parseFloat(montantDeclare) - caAttendu === 0 ? 'text-green-600' : 'text-red-600'}>{(parseFloat(montantDeclare) - caAttendu).toLocaleString()} Ar</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminFournisseurs = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ nom: '', tel: '' });
  const [editId, setEditId] = useState(null);

  const load = async () => { const { data } = await supabase.from('fournisseurs').select('*').order('nom'); setList(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (editId) { await supabase.from('fournisseurs').update({ nom: form.nom, contact_whatsapp: form.tel }).eq('id', editId); setEditId(null); } 
    else { await supabase.from('fournisseurs').insert([{ nom: form.nom, contact_whatsapp: form.tel }]); }
    setForm({ nom: '', tel: '' }); load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-3 border-t-4 border-[#800020]">
        <input placeholder="Nom Société" className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required />
        <input placeholder="Numéro WhatsApp" className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} required />
        <button className="text-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-md bg-[#800020] hover:bg-[#5a0016]">{editId ? 'Mettre à jour' : 'Ajouter'}</button>
      </form>
      <div className="grid gap-3">
        {list.map(f => (
          <div key={f.id} className="bg-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-100">
            <div>
              <p className="font-black text-lg uppercase text-gray-800">{f.nom}</p>
              <p className="text-xs font-bold text-gray-500">{f.contact_whatsapp}</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <button onClick={() => {setForm({ nom: f.nom, tel: f.contact_whatsapp }); setEditId(f.id);}} className="flex-1 md:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold text-[10px] uppercase">Modifier</button>
              <a href={`https://wa.me/${f.contact_whatsapp.replace(/[^0-9]/g, '')}?text=Bonjour`} target="_top" className="flex-[2] md:flex-none bg-green-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase text-center no-underline shadow-sm">WhatsApp</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModuleDepenses = () => {
  const [depenses, setDepenses] = useState([]); const [form, setForm] = useState({ desc: '', montant: '', date: new Date().toISOString().split('T')[0] });
  const load = async () => { const { data } = await supabase.from('depenses').select('*').order('date_depense', { ascending: false }); setDepenses(data || []); }; useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault(); await supabase.from('depenses').insert([{ description: form.desc, montant: parseFloat(form.montant), date_depense: form.date }]); setForm({ ...form, desc: '', montant: '' }); load(); };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020]"><h2 className="text-lg font-black text-[#800020] uppercase mb-4">Saisir une Dépense</h2><form onSubmit={save} className="grid grid-cols-1 md:grid-cols-4 gap-3"><input placeholder="Description" className="p-3 bg-gray-50 border rounded-xl col-span-1 md:col-span-2 outline-none" value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} required /><input placeholder="Montant (Ar)" type="number" className="p-3 bg-red-50 border border-red-100 text-red-600 font-bold rounded-xl" value={form.montant} onChange={e=>setForm({...form, montant: e.target.value})} required /><input type="date" className="p-3 bg-gray-50 border rounded-xl font-bold" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required /><button className="bg-[#800020] text-white p-3 rounded-xl font-black uppercase col-span-full shadow-md">Enregistrer</button></form></div>
      <div className="grid gap-2">{depenses.map(d => (<div key={d.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-600 flex justify-between items-center"><div><p className="font-bold text-gray-800 uppercase text-sm">{d.description}</p><p className="text-[10px] text-gray-400">{new Date(d.date_depense).toLocaleDateString()}</p></div><p className="font-black text-red-600 text-base">- {parseFloat(d.montant).toLocaleString()} Ar</p></div>))}</div>
    </div>
  );
};

const SuiviCredits = () => {
  const [credits, setCredits] = useState([]); const [filtre, setFiltre] = useState('non_paye');
  const load = async () => { const { data } = await supabase.from('credits').select('*').order('date_credit', { ascending: false }); setCredits(data || []); }; useEffect(() => { load(); }, []);
  const encaisser = async (id) => { if(window.confirm("Confirmer l'encaissement ?")) { await supabase.from('credits').update({ statut: 'paye', date_paiement: new Date().toISOString() }).eq('id', id); load(); } };
  const dataAffichee = credits.filter(c => c.statut === filtre); const aujourdHui = new Date();
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex gap-2 border-b-2 border-gray-100 pb-4 overflow-x-auto"><button onClick={() => setFiltre('non_paye')} className={`px-4 py-2 rounded-xl font-black uppercase text-xs whitespace-nowrap transition ${filtre === 'non_paye' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}>🔴 Dettes en cours</button><button onClick={() => setFiltre('paye')} className={`px-4 py-2 rounded-xl font-black uppercase text-xs whitespace-nowrap transition ${filtre === 'paye' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>✅ Payés</button></div>
      <div className="grid gap-3">{dataAffichee.map(c => { const echeanceDate = new Date(c.date_echeance); const enRetard = filtre === 'non_paye' && c.date_echeance && echeanceDate < aujourdHui; return (<div key={c.id} className={`bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${filtre === 'non_paye' ? (enRetard ? 'border-red-600 bg-red-50' : 'border-[#800020]') : 'border-green-500'}`}><div className="flex-1"><p className="font-black text-lg md:text-xl uppercase text-gray-800">{c.nom_client}</p><div className="flex flex-wrap gap-2 mt-1"><p className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded border">Pris: {new Date(c.date_credit).toLocaleDateString()}</p>{filtre === 'non_paye' && c.date_echeance && (<p className={`text-[10px] font-bold px-2 py-1 rounded border ${enRetard ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-orange-700'}`}>Échéance: {echeanceDate.toLocaleDateString()}</p>)}</div><p className="text-xs italic text-gray-500 mt-2">🛒 {c.details_articles}</p></div><div className="text-left md:text-right w-full md:w-auto"><p className={`text-2xl font-black ${filtre === 'non_paye' ? 'text-red-600' : 'text-green-600'}`}>{parseFloat(c.montant_du).toLocaleString()} Ar</p>{filtre === 'non_paye' && (<button onClick={() => encaisser(c.id)} className="w-full md:w-auto bg-green-600 text-white px-4 py-2 rounded-lg font-bold uppercase text-[10px] mt-2">Encaisser</button>)}</div></div>)})}</div>
    </div>
  );
};

const ModuleClients = () => {
  const [list, setList] = useState([]); const [form, setForm] = useState({ nom: '', tel: '', adresse: '', raison_fiscale: '' });
  const load = async () => { const { data } = await supabase.from('clients').select('*').order('nom'); setList(data || []); }; useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault(); await supabase.from('clients').insert([{nom: form.nom, telephone: form.tel, adresse: form.adresse, raison_fiscale: form.raison_fiscale}]); setForm({ nom: '', tel: '', adresse: '', raison_fiscale: '' }); load(); };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020] grid grid-cols-1 md:grid-cols-2 gap-3"><input placeholder="Nom / Société" className="p-3 bg-gray-50 border rounded-xl" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required /><input placeholder="Téléphone" className="p-3 bg-gray-50 border rounded-xl" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} /><input placeholder="NIF/STAT" className="p-3 bg-gray-50 border rounded-xl" value={form.raison_fiscale} onChange={e=>setForm({...form, raison_fiscale: e.target.value})} /><input placeholder="Adresse" className="p-3 bg-gray-50 border rounded-xl" value={form.adresse} onChange={e=>setForm({...form, adresse: e.target.value})} /><button className="bg-[#800020] text-white p-4 rounded-xl font-black uppercase col-span-full">Ajouter</button></form>
      <div className="grid gap-2">{list.map(c => (<div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-2"><div><p className="font-bold uppercase text-sm">{c.nom}</p><p className="text-[9px] text-gray-500 font-bold mt-0.5">NIF/STAT: {c.raison_fiscale || '-'}</p></div><div className="text-left md:text-right text-[10px] text-gray-500"><p>{c.telephone}</p><p>{c.adresse}</p></div></div>))}</div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [creds, setCreds] = useState({ id: '', mdp: '' });
  const handle = async (e) => { e.preventDefault(); const { data } = await supabase.from('utilisateurs').select('*').eq('identifiant', creds.id).eq('mot_de_passe', creds.mdp).single(); if (data) onLogin(data); else alert("Identifiants incorrects."); };
  return (
    <div className="min-h-screen bg-[#800020] flex items-center justify-center p-4">
      <form onSubmit={handle} className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl w-full max-w-md border-b-[10px] border-red-600">
        <div className="flex justify-center mb-6"><img src={LOGO_URL} alt="Logo" className="h-16" /></div>
        <div className="space-y-4">
          <input type="text" placeholder="Utilisateur" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#800020]" onChange={e=>setCreds({...creds, id: e.target.value})} />
          <input type="password" placeholder="Mot de passe" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#800020]" onChange={e=>setCreds({...creds, mdp: e.target.value})} />
          <button className="w-full bg-[#800020] text-white p-4 rounded-xl font-black mt-6 uppercase hover:bg-red-800 shadow-md">Connexion</button>
        </div>
      </form>
    </div>
  );
};
