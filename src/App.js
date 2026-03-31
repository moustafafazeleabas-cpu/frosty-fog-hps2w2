import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 🔒 SÉCURITÉ : VARIABLES D'ENVIRONNEMENT ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wblginsktosypbmhmgbr.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibGdpbnNrdG9zeXBibWhtZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjU3NTYsImV4cCI6MjA4OTk0MTc1Nn0.pmysPmutGjW2Tw7jFvrBE_0ue2pZmS32Pjncu1Rmr8w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOGO_URL = "https://wblginsktosypbmhmgbr.supabase.co/storage/v1/object/public/Hakimi%20logo/hakimi.jpg"; // <-- N'oublie pas ton lien ImgBB ici

const CATEGORIES_PRODUITS = ["Huile", "Épicerie Indienne", "Produits surgelés", "Boissons & Eaux", "Papeterie", "Produits ménagers", "Informatique", "Épicerie pratique", "Cosmétique", "Quincaillerie", "Divers"];

// --- 🛡️ BOUCLIERS ANTI-CRASH GLOBAUX ---
const safeNum = (val) => { 
  if (val === null || val === undefined || val === '') return 0; 
  const n = Number(val); 
  return isNaN(n) ? 0 : n; 
};
const formatAr = (val) => safeNum(val).toLocaleString('fr-FR');
const formatDate = (dateStr) => { 
  if (!dateStr) return '-'; 
  const d = new Date(dateStr); 
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('fr-FR'); 
};
const formatDateTime = (dateStr) => { 
  if (!dateStr) return '-'; 
  const d = new Date(dateStr); 
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('fr-FR'); 
};
const formatHeureMessage = (dateStr) => { 
  if (!dateStr) return '-'; 
  const d = new Date(dateStr); 
  return isNaN(d.getTime()) ? '-' : `le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`; 
};

// --- 🖨️ MOTEUR D'IMPRESSION PARTAGÉ ---
const lancerImpression = (type, data, params) => {
  const win = window.open('', '', type === 'caisse' ? 'width=350,height=600' : 'width=800,height=900');
  if (!win) { 
    alert("⚠️ Votre navigateur a bloqué l'impression. Veuillez autoriser les Pop-ups."); 
    return; 
  }

  const dateDoc = formatDateTime(data.date || new Date());

  if (type === 'caisse') {
    win.document.write(`
      <html><head>
        <title>Ticket de Caisse</title>
        <style>
          @media print { @page { margin: 0; } body { margin: 0; } } 
          body { font-family: monospace; width: ${data.printSize || '58mm'}; padding: 10px; font-size: 12px; margin: 0 auto; text-align: center; }
        </style>
      </head>
      <body>
        <img src="${LOGO_URL}" style="max-width:80%; height:auto; margin-bottom:5px;" onerror="this.style.display='none'"/>
        <h2 style="margin:0;">${params.nom_entreprise || 'HAKIMI PLUS'}</h2>
        <p style="margin:0; font-size:10px;">${params.adresse || ''}<br/>${params.contact || ''}</p>
        <p style="margin:5px 0; font-size:10px;">${dateDoc}</p>
        ${data.numero ? `<p style="margin:0; font-weight:bold; font-size:11px; border:1px solid #000; padding:2px; display:inline-block;">${data.numero}</p>` : ''}
        ${data.methode ? `<p style="margin:2px 0; font-weight:bold; font-size:10px;">Payé par : ${data.methode}${data.banque ? ` (${data.banque})` : ''}</p>` : ''}
        <hr style="border-top:1px dashed #000;"/>
        <table style="width:100%; text-align:left; font-size:11px;">
          ${data.panier.map(i => `
            <tr>
              <td style="width:15%; font-weight:bold; vertical-align:top;">${safeNum(i.qte)}x</td>
              <td style="width:50%; vertical-align:top;">
                ${(i.nom||'').substring(0,15)}<br/>
                <span style="font-size:9px;">[${i.categorie || 'Divers'}]</span>
              </td>
              <td style="width:35%; text-align:right; vertical-align:top;">${formatAr((safeNum(i.prix_vente) - safeNum(i.remise_montant)) * safeNum(i.qte))}</td>
            </tr>
          `).join('')}
        </table>
        <hr style="border-top:1px dashed #000;"/>
        <h3 style="text-align:right; margin:5px 0;">TOTAL: ${formatAr(data.totalNet)} Ar</h3>
        ${data.totalRemisesEnAr > 0 ? `<p style="text-align:right; font-size:10px; margin:0;">(Dont remise : ${formatAr(data.totalRemisesEnAr)} Ar)</p>` : ''}
        <p style="margin-top:10px;">${params.message_ticket || 'Merci de votre visite !'}</p>
        <p style="color:#fff;">.</p>
      </body></html>
    `);
  } else {
    let titre = 'FACTURE'; 
    if (type === 'devis') titre = 'PROFORMA / DEVIS'; 
    if (type === 'admin_credit') titre = 'FACTURE À CRÉDIT';
    
    win.document.write(`
      <html><head>
        <title>${titre}</title>
        <style>
          @media print { @page { margin: 0; size: auto; } body { margin: 1cm; } } 
          body { font-family: Arial, sans-serif; font-size: 13px; color: #333; } 
          table { width: 100%; border-collapse: collapse; margin-top: 15px; } 
          th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; } 
          th { background-color: #800020; color: white; } 
          .header-flex { display: flex; justify-content: space-between; border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 15px; } 
          .client-box { background-color: #f9f9f9; border-left: 4px solid #800020; padding: 15px; width: 50%; margin-bottom: 20px; } 
          .total-line { font-size: 20px; font-weight: bold; color: #800020; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header-flex">
          <div>
            <img src="${LOGO_URL}" style="height:50px; margin-bottom:5px;" onerror="this.style.display='none'"/>
            <h3 style="margin:0; color:#800020;">${params.nom_entreprise || 'HAKIMI PLUS'}</h3>
            <p style="margin:0; font-size:11px;">${params.adresse || ''}<br/>${params.nif_stat || ''}<br/>${params.contact || ''}</p>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0; color:#800020; font-size: 22px;">${titre}</h2>
            ${data.numero ? `<h3 style="margin:5px 0;">N° ${data.numero}</h3>` : ''}
            <p style="margin:5px 0 0 0;">Date : ${dateDoc}</p>
            ${data.methode ? `<p style="margin:5px 0 0 0; font-weight:bold; font-size:11px;">Payé par : ${data.methode}${data.banque ? ` (${data.banque})` : ''}</p>` : ''}
          </div>
        </div>
        <div class="client-box">
          <strong>Client :</strong> ${data.client_nom}<br/>
          <strong>NIF :</strong> ${data.client_nif || '-'}<br/>
          <strong>STAT :</strong> ${data.client_stat || '-'}<br/>
          ${data.client_tel ? `<strong>Contact :</strong> ${data.client_tel}<br/>` : ''}
          ${type === 'admin_credit' && data.echeance ? `<br/><strong style="color:red;">Échéance : ${formatDate(data.echeance)}</strong>` : ''}
        </div>
        <table>
          <thead><tr><th>Désignation</th><th>Qté</th><th>Prix U.</th><th style="text-align:right;">Total</th></tr></thead>
          <tbody>
            ${data.panier.map(i => `
              <tr>
                <td>${i.nom} <span style="font-size:10px; color:#666;">(${i.categorie || 'Divers'})</span></td>
                <td>${safeNum(i.qte)}</td>
                <td>${formatAr(safeNum(i.prix_vente) - safeNum(i.remise_montant))}</td>
                <td style="text-align:right;">${formatAr((safeNum(i.prix_vente) - safeNum(i.remise_montant)) * safeNum(i.qte))} Ar</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-line">TOTAL NET : ${formatAr(data.totalNet)} Ar</div>
        ${data.totalRemisesEnAr > 0 ? `<p style="text-align:right; font-size:11px; color:green; margin:5px 0;">(Remise globale appliquée : ${formatAr(data.totalRemisesEnAr)} Ar)</p>` : ''}
        ${type === 'devis' ? '<p style="text-align:center; margin-top:40px; font-size:11px; font-style:italic; color:#888;">Ce document est un devis estimatif et ne constitue pas une facture. Valable 30 jours.</p>' : ''}
      </body></html>
    `);
  }
  win.document.close(); setTimeout(() => { win.print(); }, 800);
};

export default function App() {
  const [user, setUser] = useState(() => { 
    const savedUser = localStorage.getItem('hakimi_user'); 
    return savedUser ? JSON.parse(savedUser) : null; 
  });
  const [view, setView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msgNonLus, setMsgNonLus] = useState(0);
  const [parametres, setParametres] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLocked, setIsLocked] = useState(false); 
  const [alertesStockDLC, setAlertesStockDLC] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [categoriesDb, setCategoriesDb] = useState([]);

  const [hasClearedNotifsToday, setHasClearedNotifsToday] = useState(() => 
    localStorage.getItem('notifClearedDate') === new Date().toLocaleDateString('fr-FR')
  );

  useEffect(() => { 
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); 
    return () => clearInterval(timer); 
  }, []);

  const loadCategories = async () => {
     const { data } = await supabase.from('categories').select('nom').order('nom');
     if (data && data.length > 0) setCategoriesDb(data.map(c => c.nom));
  };

  useEffect(() => {
    const loadInit = async () => {
      const { data: pData } = await supabase.from('parametres').select('*').eq('id', 1).single();
      if (pData) setParametres(pData);
      await loadCategories();
      setTimeout(() => setLoading(false), 1000);
    };
    loadInit();
  }, []);

  useEffect(() => {
    if (user) {
      if(user.role === 'vendeur' && !isLocked && view === 'dashboard') setView('caisse'); 
      
      const checkTasks = async () => {
        // Messagerie
        const { count } = await supabase.from('messagerie').select('*', { count: 'exact', head: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
        setMsgNonLus(count || 0);

        // Alertes Stock
        const { data: prods } = await supabase.from('produits').select('nom, stock_actuel, date_peremption');
        if (prods) {
          let alertes = []; const now = new Date();
          prods.forEach(p => {
             if (safeNum(p.stock_actuel) < 5) alertes.push({ type: 'stock', text: `${p.nom} : Stock critique (${p.stock_actuel})` });
             if (p.date_peremption) {
                const diffDays = Math.ceil((new Date(p.date_peremption) - now) / (1000 * 3600 * 24));
                if (diffDays <= 10 && diffDays >= 0) alertes.push({ type: 'dlc', text: `${p.nom} : Périme dans ${diffDays}j` });
                else if (diffDays < 0) alertes.push({ type: 'dlc_depasse', text: `${p.nom} : PÉRIMÉ` });
             }
          });
          setAlertesStockDLC(alertes);
        }

        // Clôture Check
        const now2 = new Date(); const h = now2.getHours();
        const isLockTime = (h >= 18 || h < 7);
        if (isLockTime) {
           let lockWindowStart = new Date(now2); 
           if (h < 7) lockWindowStart.setDate(lockWindowStart.getDate() - 1); 
           lockWindowStart.setHours(18, 0, 0, 0);
           
           const { data: latestCloture } = await supabase.from('cloture_caisse').select('date_cloture').gte('date_cloture', lockWindowStart.toISOString()).limit(1);
           if (latestCloture && latestCloture.length > 0) { 
               setIsLocked(false); 
           } else { 
               setIsLocked(true); 
               setView('cloture'); 
           }
        } else { 
           setIsLocked(false); 
        }
      };
      
      checkTasks(); 
      const interval = setInterval(checkTasks, 30000); 
      return () => clearInterval(interval);
    }
  }, [user, isLocked]);

  const handleLogin = (userData) => { 
    localStorage.setItem('hakimi_user', JSON.stringify(userData)); 
    setUser(userData); 
  };
  const handleLogout = () => { 
    localStorage.removeItem('hakimi_user'); 
    setUser(null); 
  };

  const handleOpenNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) { 
       localStorage.setItem('notifClearedDate', new Date().toLocaleDateString('fr-FR'));
       setHasClearedNotifsToday(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#800020] border-t-transparent rounded-full animate-spin mb-4"></div>
      <img src={LOGO_URL} alt="Chargement..." className="h-12 animate-pulse" onError={(e) => e.target.style.display='none'} />
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const changeView = (newView) => { 
    if(!isLocked) { 
      setView(newView); 
      setMenuOpen(false); 
    } 
  };
  
  const totalAlertes = msgNonLus + (hasClearedNotifsToday ? 0 : alertesStockDLC.length);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* HEADER MOBILE FIXE */}
      <div className="md:hidden bg-[#800020] text-white p-4 flex justify-between items-center sticky top-0 z-[60] shadow-md">
        <img src={LOGO_URL} alt="Hakimi Plus" className="h-8 bg-white p-1 rounded" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<span class="font-black text-xl italic uppercase">HAKIMI PLUS</span>'; }} />
        <div className="flex items-center gap-4">
          <button onClick={handleOpenNotif} className="text-xl relative">
            🔔 {totalAlertes > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-black animate-pulse">{totalAlertes}</span>}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">☰</button>
        </div>
      </div>

      {/* OVERLAY MOBILE POUR FERMER LE MENU */}
      {menuOpen && <div className="fixed inset-0 bg-black/60 z-[65] md:hidden" onClick={() => setMenuOpen(false)}></div>}

      {/* MENU LATÉRAL */}
      <nav className={`fixed inset-y-0 left-0 z-[70] w-72 bg-[#800020] text-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div>
          <div className="mb-6 hidden md:flex flex-col items-center border-b border-white/10 pb-6 relative">
             <button onClick={handleOpenNotif} className="absolute top-0 right-0 text-xl hover:scale-110 transition">
               🔔 {totalAlertes > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-black animate-pulse shadow-lg">{totalAlertes}</span>}
             </button>
             <img src={LOGO_URL} alt="Hakimi Plus" className="max-w-[80%] h-auto bg-white p-2 rounded-xl shadow-inner mb-2 mt-4" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<h1 class="text-3xl font-black italic tracking-tighter text-center mt-4">HAKIMI <span class="text-red-500">PLUS</span></h1>'; }} />
             <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mt-2">{currentTime.toLocaleTimeString('fr-FR')}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            {isLocked && <div className="p-3 bg-red-600 text-white font-black rounded-xl text-xs uppercase animate-pulse mb-2 text-center shadow-lg border border-red-400">⚠️ Clôture Obligatoire</div>}
            
            <NavBtn active={view==='messagerie'} onClick={()=>changeView('messagerie')} disabled={isLocked}>
               <span className="flex items-center justify-between w-full">
                 <span>✉️ Messagerie</span>
                 {msgNonLus > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">{msgNonLus}</span>}
               </span>
            </NavBtn>
            
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-1 mt-4">Menu Principal</p>
            <NavBtn active={view==='caisse'} onClick={()=>changeView('caisse')} disabled={isLocked}>🛒 Caisse Directe</NavBtn>
            <NavBtn active={view==='facture_a4'} onClick={()=>changeView('facture_a4')} disabled={isLocked}>📄 Nouvelle Facture</NavBtn>
            <NavBtn active={view==='devis'} onClick={()=>changeView('devis')} disabled={isLocked}>📝 Créer un Devis</NavBtn>
            <NavBtn active={view==='admin_credit'} onClick={()=>changeView('admin_credit')} disabled={isLocked}>🔴 Ventes à Crédit</NavBtn>
            
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-1 mt-4">Registres</p>
            <NavBtn active={view==='journal_factures'} onClick={()=>changeView('journal_factures')} disabled={isLocked}>🧾 Journal Factures</NavBtn>
            <NavBtn active={view==='journal_devis'} onClick={()=>changeView('journal_devis')} disabled={isLocked}>📚 Journal Devis</NavBtn>
            <NavBtn active={view==='historique'} onClick={()=>changeView('historique')} disabled={isLocked}>📅 Historique Global</NavBtn>
            <NavBtn active={view==='journal_clotures'} onClick={()=>changeView('journal_clotures')} disabled={isLocked}>🔒 Journal Clôtures</NavBtn>
            <NavBtn active={view==='cloture'} onClick={()=>setView('cloture')}>💰 Faire la Clôture</NavBtn>

            {user.role === 'superadmin' && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest px-4 mb-1">Direction</p>
                <NavBtn active={view==='dashboard'} onClick={()=>changeView('dashboard')} disabled={isLocked}>📊 Tableau de Bord</NavBtn>
                <NavBtn active={view==='admin_stock'} onClick={()=>changeView('admin_stock')} disabled={isLocked}>📦 Stock & Réappro</NavBtn>
                <NavBtn active={view==='depenses'} onClick={()=>changeView('depenses')} disabled={isLocked}>💸 Dépenses</NavBtn>
                <NavBtn active={view==='clients'} onClick={()=>changeView('clients')} disabled={isLocked}>👥 Base Clients</NavBtn>
                <NavBtn active={view==='admin_fournisseurs'} onClick={()=>changeView('admin_fournisseurs')} disabled={isLocked}>🚚 Fournisseurs</NavBtn>
                <NavBtn active={view==='suivi_credits'} onClick={()=>changeView('suivi_credits')} disabled={isLocked}>📉 Suivi Dettes</NavBtn>
                <NavBtn active={view==='admin_utilisateurs'} onClick={()=>changeView('admin_utilisateurs')} disabled={isLocked}>🔐 Comptes & Accès</NavBtn>
                <NavBtn active={view==='parametres'} onClick={()=>changeView('parametres')} disabled={isLocked}>⚙️ Paramètres ERP</NavBtn>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-4 text-center shrink-0">
           <p className="text-[10px] text-white/50 mb-2">Connecté : <span className="font-bold text-white uppercase">{user.identifiant}</span></p>
           <button onClick={handleLogout} className="w-full p-3 bg-white/10 hover:bg-red-600 rounded-xl text-xs font-black uppercase transition border border-white/10">Déconnexion</button>
        </div>
      </nav>

      {/* PANNEAU NOTIFICATIONS OVERLAY */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-[75] md:hidden" onClick={() => setNotifOpen(false)}></div>
          <div className="fixed md:absolute top-16 md:top-6 right-4 md:left-80 w-[90%] md:w-80 bg-white rounded-2xl shadow-2xl z-[80] border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
             <div className="bg-[#800020] p-4 flex justify-between items-center text-white">
               <h3 className="font-black uppercase text-sm">Notifications</h3>
               <button onClick={()=>setNotifOpen(false)} className="font-black text-lg">×</button>
             </div>
             <div className="p-2 overflow-y-auto custom-scrollbar">
               {msgNonLus > 0 && (
                 <button onClick={()=>{setView('messagerie'); setNotifOpen(false);}} className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 mb-2 transition">
                   <p className="font-black text-blue-800 text-xs">✉️ {msgNonLus} Nouveau(x) Message(s)</p>
                 </button>
               )}
               {alertesStockDLC.map((al, idx) => (
                 <div key={idx} className={`p-3 rounded-xl mb-2 border ${al.type === 'stock' ? 'bg-red-50 border-red-100 text-red-800' : (al.type === 'dlc_depasse' ? 'bg-gray-800 text-white' : 'bg-orange-50 border-orange-100 text-orange-800')}`}>
                   <p className="font-bold text-xs uppercase">{al.type === 'stock' ? '⚠️ RUPTURE' : (al.type === 'dlc_depasse' ? '☠️ PÉRIMÉ' : '⏳ EXPIRATION PROCHE')}</p>
                   <p className="text-[11px] mt-1">{al.text}</p>
                 </div>
               ))}
               {(msgNonLus === 0 && alertesStockDLC.length === 0) && <p className="text-center text-gray-400 text-xs py-4 italic">Aucune notification.</p>}
             </div>
          </div>
        </>
      )}

      {/* ZONE CENTRALE */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto relative">
        {isLocked && view !== 'cloture' && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 animate-bounce">🔒</div>
              <h2 className="text-2xl font-black text-[#800020] uppercase text-center">Accès Verrouillé</h2>
              <p className="font-bold text-gray-500 mt-2 text-center px-4">Il est temps de clôturer la caisse.<br/>Veuillez effectuer la clôture pour continuer.</p>
           </div>
        )}
        
        {(view==='caisse' || view==='facture_a4' || view==='admin_credit' || view==='devis') && <ModuleVente mode={view} params={parametres} categoriesDb={categoriesDb} />}
        {view==='admin_stock' && <AdminStock categoriesDb={categoriesDb} refreshCategories={loadCategories} />}
        {view==='cloture' && <ModuleCloture user={user} onClotureDone={() => setIsLocked(false)} />}
        {view==='admin_fournisseurs' && <AdminFournisseurs />}
        {view==='dashboard' && <AdminDashboard />}
        {view==='historique' && <ModuleHistorique params={parametres} />}
        {view==='journal_factures' && <ModuleJournalFactures params={parametres} />}
        {view==='journal_devis' && <ModuleJournalDevis params={parametres} />}
        {view==='journal_clotures' && <ModuleJournalClotures />}
        {view==='clients' && <ModuleClients />}
        {view==='depenses' && <ModuleDepenses />}
        {view==='suivi_credits' && <SuiviCredits />}
        {view==='messagerie' && <ModuleMessagerie user={user} onMessagesRead={() => setMsgNonLus(0)} />}
        {view==='parametres' && <AdminParametres params={parametres} setParams={setParametres} />}
        {view==='admin_utilisateurs' && <AdminUtilisateurs currentUser={user} onUpdateSession={handleLogin} />}
      </main>
    </div>
  );
}

const NavBtn = ({ active, onClick, disabled, children }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`p-3 rounded-xl text-left font-bold text-sm transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${active ? 'bg-white text-[#800020] shadow-xl translate-x-1' : (!disabled ? 'hover:bg-white/5 text-white/80' : 'text-white/80')}`}
  >
    {children}
  </button>
);

// ==========================================
// ADMIN UTILISATEURS (COMPTES ET ACCÈS)
// ==========================================
const AdminUtilisateurs = ({ currentUser, onUpdateSession }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ identifiant: '', mot_de_passe: '', role: 'vendeur' });

  const load = async () => { 
    const { data } = await supabase.from('utilisateurs').select('*').order('identifiant'); 
    setUsers(data || []); 
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if(form.identifiant.length < 3) return alert("L'identifiant est trop court.");
    const ex = users.find(u => u.identifiant === form.identifiant);
    
    if (ex) {
       await supabase.from('utilisateurs').update({ mot_de_passe: form.mot_de_passe, role: form.role }).eq('identifiant', form.identifiant);
       alert("Utilisateur mis à jour !");
       if (currentUser.identifiant === form.identifiant) {
           onUpdateSession({ ...currentUser, mot_de_passe: form.mot_de_passe, role: form.role });
       }
    } else {
       await supabase.from('utilisateurs').insert([{ identifiant: form.identifiant, mot_de_passe: form.mot_de_passe, role: form.role }]);
       alert("Nouvel utilisateur créé !");
    }
    setForm({ identifiant: '', mot_de_passe: '', role: 'vendeur' }); 
    load();
  };

  const deleteUser = async (id) => {
    if(id === currentUser.identifiant) return alert("Impossible de supprimer votre propre compte en cours d'utilisation !");
    if(id === 'admin1996') return alert("Impossible de supprimer le compte d'origine admin1996.");
    if(window.confirm(`Supprimer définitivement l'accès pour ${id} ?`)) {
      await supabase.from('utilisateurs').delete().eq('identifiant', id); 
      load();
    }
  };

  const selectUser = (u) => { 
    setForm({ identifiant: u.identifiant, mot_de_passe: u.mot_de_passe, role: u.role }); 
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Comptes & Accès</h2>
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input placeholder="Identifiant (ex: vendeur2)" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.identifiant} onChange={e=>setForm({...form, identifiant: e.target.value})} required />
        <input placeholder="Mot de passe" type="text" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.mot_de_passe} onChange={e=>setForm({...form, mot_de_passe: e.target.value})} required />
        <select className="p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
           <option value="vendeur">Vendeur (Accès Caisse)</option>
           <option value="superadmin">Super Admin (Accès Total)</option>
        </select>
        <button className="bg-[#800020] text-white p-3 rounded-xl font-black uppercase text-xs hover:bg-[#5a0016] transition">Créer / Modifier</button>
      </form>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map(u => (
          <div key={u.identifiant} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
             <div className="cursor-pointer" onClick={() => selectUser(u)}>
               <p className="font-black text-lg text-gray-800 hover:text-[#800020]">
                 {u.identifiant} {u.identifiant === currentUser.identifiant ? '(Vous)' : ''}
               </p>
               <div className="flex gap-2 mt-1">
                 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${u.role === 'superadmin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                 <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">MDP: {u.mot_de_passe}</span>
               </div>
             </div>
             {u.identifiant !== currentUser.identifiant && u.identifiant !== 'admin1996' && (
               <button onClick={() => deleteUser(u.identifiant)} className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 w-10 h-10 rounded-full flex items-center justify-center font-black transition">🗑️</button>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// MODULE MESSAGERIE 
// ==========================================
const ModuleMessagerie = ({ user, onMessagesRead }) => {
  const [messages, setMessages] = useState([]);
  const [destinataires, setDestinataires] = useState([]);
  const [form, setForm] = useState({ dest: '', obj: '', msg: '' });

  const load = async () => {
    // Empêcher l'envoi à soi-même
    const { data: usersData } = await supabase.from('utilisateurs').select('identifiant').neq('identifiant', user.identifiant);
    setDestinataires(usersData || []);
    if(usersData && usersData.length > 0) setForm(prev => ({...prev, dest: usersData[0].identifiant}));

    const { data } = await supabase.from('messagerie').select('*').or(`destinataire.eq.${user.identifiant},expediteur.eq.${user.identifiant}`).order('date_envoi', { ascending: false });
    setMessages(data || []);
    
    // Marquer lu et clear cloche
    await supabase.from('messagerie').update({ est_lu: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
    if(onMessagesRead) onMessagesRead();
  };
  useEffect(() => { load(); }, []);

  const send = async (e) => {
    e.preventDefault();
    if(!form.dest) return alert("Aucun destinataire sélectionné.");
    await supabase.from('messagerie').insert([{ expediteur: user.identifiant, destinataire: form.dest, objet: form.obj, message: form.msg }]);
    setForm({ ...form, obj: '', msg: '' }); 
    load(); 
    alert("Message envoyé !");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Nouveau Message</h2>
        <form onSubmit={send} className="space-y-3">
          <div className="flex gap-3">
            <select className="p-3 bg-gray-50 border rounded-xl font-bold uppercase text-xs" value={form.dest} onChange={e=>setForm({...form, dest: e.target.value})} required>
              {destinataires.length === 0 && <option value="">Aucun autre utilisateur</option>}
              {destinataires.map(d => <option key={d.identifiant} value={d.identifiant}>{d.identifiant}</option>)}
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
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${m.expediteur === user.identifiant ? 'bg-gray-200 text-gray-600' : 'bg-red-600 text-white'}`}>
                  {m.expediteur === user.identifiant ? 'Moi' : m.expediteur} 
                  {m.expediteur === user.identifiant && ` ➔ ${m.destinataire}`}
                </span>
                <span className="text-[10px] text-gray-400 font-bold ml-2">{formatHeureMessage(m.date_envoi)}</span>
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
// MODULE VENTE 
// ==========================================
const ModuleVente = ({ mode, params, categoriesDb }) => {
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [echeance, setEcheance] = useState("");
  const [printSize, setPrintSize] = useState('58mm');
  const [remiseGlobale, setRemiseGlobale] = useState(""); 
  const [methodePaiement, setMethodePaiement] = useState("CASH"); 
  const [banqueCheque, setBanqueCheque] = useState("");
  const [numeroCheque, setNumeroCheque] = useState("");
  const [venteReussie, setVenteReussie] = useState(null); 

  useEffect(() => {
    const load = async () => {
      const p = await supabase.from('produits').select('*').order('nom');
      const c = await supabase.from('clients').select('*').order('nom');
      setProduits(p.data || []);
      if (mode !== 'caisse') { setSelectedClient(""); setClients(c.data.filter(i => i.nom !== 'Vente à un utilisateur')); }
      else { setSelectedClient("Vente à un utilisateur"); setClients(c.data); }
    };
    load(); setPanier([]); setVenteReussie(null); setRemiseGlobale(""); setMethodePaiement("CASH"); setSelectedCat(""); setBanqueCheque(""); setNumeroCheque("");
  }, [mode]);

  const totalBrut = panier.reduce((acc, i) => acc + (safeNum(i.prix_vente) * safeNum(i.qte)), 0);
  const totalRemiseArticles = panier.reduce((acc, i) => acc + (safeNum(i.remise_montant) * safeNum(i.qte)), 0);
  const totalApresRemiseArticles = totalBrut - totalRemiseArticles;
  const montantRemiseGlobale = totalApresRemiseArticles * (safeNum(remiseGlobale) / 100);
  const totalNet = totalApresRemiseArticles - montantRemiseGlobale;
  const totalRemisesEnAr = totalRemiseArticles + montantRemiseGlobale;
  const beneficeArticles = panier.reduce((acc, i) => acc + ((safeNum(i.prix_vente) - safeNum(i.remise_montant) - safeNum(i.prix_achat)) * safeNum(i.qte)), 0);
  const beneficeNet = beneficeArticles - montantRemiseGlobale;

  const ajouter = (p) => {
    if (venteReussie) return;
    const ex = panier.find(i => i.id === p.id);
    if (ex) setPanier(panier.map(i => i.id === p.id ? { ...i, qte: safeNum(i.qte) + 1 } : i));
    else setPanier([...panier, { ...p, qte: 1, remise_montant: "" }]); 
  };
  const updateRemiseArticle = (id, val) => { setPanier(panier.map(i => i.id === id ? { ...i, remise_montant: val } : i)); };

  const valider = async () => {
    if (panier.length === 0) return;
    if (mode !== 'caisse' && !selectedClient) return alert("Client requis");
    if (mode === 'admin_credit' && !echeance) return alert("Échéance requise");
    if (methodePaiement === 'CHEQUE' && !banqueCheque) return alert("Veuillez sélectionner la banque pour le chèque.");
    
    let numero_genere = "";
    const today = new Date(); 
    
    // FORMAT DE LA DATE: DDMMYY (Ex: 280326)
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(2, 4);
    const numDateStr = `${dd}${mm}${yy}`; 
    
    // Pour la requête base de données, il faut chercher depuis minuit aujourd'hui
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const startIso = startOfToday.toISOString();

    if (mode !== 'caisse') {
      const isDevis = mode === 'devis';
      const prefix = isDevis ? 'DV' : 'FA';
      const table = isDevis ? 'devis' : 'historique_ventes';
      const dateCol = isDevis ? 'date_devis' : 'date_vente';
      
      const { count } = await supabase.from(table).select('*', {count: 'exact', head:true}).gte(dateCol, startIso);
      numero_genere = `${prefix}${numDateStr}-${String((count || 0) + 1).padStart(3, '0')}`;
    }

    const detailsObj = {
      heure: formatDateTime(today),
      remise_globale_pourcent: safeNum(remiseGlobale),
      paiement_infos: methodePaiement === 'CHEQUE' ? { banque: banqueCheque, numero: numeroCheque } : null,
      articles: panier.map(i => ({ 
        nom: i.nom, 
        categorie: i.categorie, 
        qte: safeNum(i.qte), 
        prix_unitaire: safeNum(i.prix_vente), 
        remise_unitaire_ar: safeNum(i.remise_montant), 
        total_ligne: (safeNum(i.prix_vente) - safeNum(i.remise_montant)) * safeNum(i.qte) 
      }))
    };
    const strArticles = panier.map(i => `${safeNum(i.qte)}x ${i.nom}`).join(', ');

    if (mode === 'devis') {
      await supabase.from('devis').insert([{ numero_devis: numero_genere, client_nom: selectedClient, articles_liste: strArticles, montant_total: totalNet, total_remise_ar: totalRemisesEnAr, details_json: detailsObj }]);
    } else {
      for (let item of panier) { 
        await supabase.rpc('decrement_stock', { row_id: item.id, amount: safeNum(item.qte) }); 
      }
      
      const pMethode = mode === 'caisse' ? methodePaiement : 'CASH'; 
      const dbTypeVente = mode === 'caisse' ? 'CAISSE' : mode.replace('admin_', '').toUpperCase();
      
      await supabase.from('historique_ventes').insert([{
        numero_facture: numero_genere, type_vente: dbTypeVente, client_nom: selectedClient,
        articles_liste: strArticles, montant_total: totalNet, benefice_total: beneficeNet,
        remise_globale_pourcent: safeNum(remiseGlobale), total_remise_ar: totalRemisesEnAr, details_json: detailsObj,
        methode_paiement: pMethode
      }]);

      if (mode === 'admin_credit') {
        await supabase.from('credits').insert([{ nom_client: selectedClient, montant_du: totalNet, details_articles: strArticles, date_echeance: echeance }]);
      }
    }
    
    const cData = clients.find(c => c.nom === selectedClient) || { nom: selectedClient, nif: '', stat: '' };
    setVenteReussie({
      numero: numero_genere, panier, totalNet, totalRemisesEnAr, 
      methode: mode === 'caisse' ? methodePaiement : null, banque: banqueCheque,
      client_nom: cData.nom, client_tel: cData.telephone, client_nif: cData.nif, client_stat: cData.stat,
      date: today, echeance, printSize
    });
  };

  const produitsFiltres = produits.filter(p => (p.nom||'').toLowerCase().includes(search.toLowerCase()) && (selectedCat === "" || p.categorie === selectedCat));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
      <div className="bg-white p-4 rounded-3xl shadow-sm border-t-4 border-[#800020] flex flex-col h-[50vh] xl:h-[85vh]">
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input placeholder="🔍 Chercher..." className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#800020] w-full" onChange={e => setSearch(e.target.value)} disabled={venteReussie} autoFocus />
          <select className="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs font-bold md:w-1/3" value={selectedCat} onChange={e => setSelectedCat(e.target.value)} disabled={venteReussie}>
            <option value="">Toutes Catégories</option>
            {(categoriesDb||[]).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar">
          {produitsFiltres.map(p => (
            <button key={p.id} onClick={() => ajouter(p)} disabled={venteReussie} className="flex flex-col justify-between p-3 border border-gray-200 rounded-xl text-left bg-white hover:border-[#800020] hover:shadow-md transition group min-h-[85px]">
              <div className="flex justify-between items-start w-full gap-1 mb-1">
                <div>
                   <p className="font-bold text-gray-800 text-[11px] uppercase truncate group-hover:text-[#800020]">{p.nom}</p>
                   <p className="text-[8px] text-gray-400 font-bold uppercase">{p.categorie || 'Divers'}</p>
                </div>
                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[9px] font-black shrink-0">STK: {p.stock_actuel}</span>
              </div>
              <p className="text-red-600 font-black text-sm">{formatAr(p.prix_vente)} Ar</p>
            </button>
          ))}
        </div>
      </div>

      <div className={`p-4 md:p-6 rounded-[2.5rem] shadow-xl flex flex-col justify-between relative overflow-hidden ${mode === 'devis' ? 'bg-white border-4 border-[#800020]' : 'bg-[#800020] text-white'} h-auto xl:h-[85vh]`}>
        {venteReussie && <div className="absolute top-0 left-0 w-full h-2 bg-green-500 animate-pulse"></div>}
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="border-b border-white/20 pb-3 flex justify-between items-center shrink-0">
             <h3 className={`font-black italic uppercase tracking-widest ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{mode === 'devis' ? 'CRÉATION DEVIS' : mode.replace('admin_', '').replace('_', ' ')}</h3>
             {mode === 'caisse' && (
               <select className="bg-black/20 text-xs p-1.5 rounded outline-none font-bold text-white border border-white/10" value={printSize} onChange={e => setPrintSize(e.target.value)} disabled={venteReussie}>
                 <option value="58mm" className="text-black">Ticket 58mm</option>
                 <option value="80mm" className="text-black">Ticket 80mm</option>
               </select>
             )}
          </div>
          
          <select className={`w-full p-3 rounded-xl font-bold border outline-none shrink-0 ${mode==='devis' ? 'bg-gray-50 text-gray-800 border-gray-200' : 'bg-white/10 text-white border-white/20'}`} value={selectedClient} onChange={e => setSelectedClient(e.target.value)} disabled={venteReussie}>
            {mode !== 'caisse' && <option value="" className="text-black">⚠️ SÉLECTIONNER CLIENT</option>}
            {clients.map(c => <option key={c.nom} value={c.nom} className="text-black">{c.nom}</option>)}
          </select>
          
          {mode === 'admin_credit' && (
            <input type="date" className="w-full bg-white/10 p-3 rounded-xl font-bold border border-white/20 outline-none text-white shrink-0 mt-1" onChange={e => setEcheance(e.target.value)} disabled={venteReussie} />
          )}
          
          <div className="space-y-2 overflow-y-auto pr-2 mt-2 custom-scrollbar flex-1">
            {panier.length === 0 && <p className="text-center italic mt-6 opacity-50">Panier vide</p>}
            {panier.map((item) => (
              <div key={item.id} className={`flex flex-col p-3 rounded-xl border-l-4 ${mode === 'devis' ? 'bg-gray-50 border-[#800020]' : 'bg-white/10 border-white'}`}>
                <div className="flex justify-between items-center">
                  <span className="truncate uppercase font-bold text-xs w-1/3">
                    {item.nom} <span className="opacity-50 font-normal ml-1">({item.categorie||'Divers'})</span>
                  </span>
                  {!venteReussie ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPanier(panier.map(x => x.id === item.id ? {...x, qte: Math.max(1, safeNum(x.qte)-1)} : x))} className="w-6 h-6 rounded bg-white/20 font-black">-</button>
                      <span className="font-black text-sm w-4 text-center">{safeNum(item.qte)}</span>
                      <button onClick={() => setPanier(panier.map(x => x.id === item.id ? {...x, qte: safeNum(x.qte)+1} : x))} className="w-6 h-6 rounded bg-white/20 font-black">+</button>
                    </div>
                  ) : (<span className="font-black opacity-60">Qté: {safeNum(item.qte)}</span>)}
                  <span className="font-black">{formatAr((safeNum(item.prix_vente) - safeNum(item.remise_montant)) * safeNum(item.qte))}</span>
                </div>
                {!venteReussie && (
                  <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                    <span className="text-[9px] uppercase font-bold opacity-60">Remise / pièce (Ar):</span>
                    <input type="number" min="0" className="w-20 p-1 text-right text-xs bg-black/20 rounded outline-none text-white placeholder-white/30" value={item.remise_montant !== undefined ? item.remise_montant : ''} onChange={e => updateRemiseArticle(item.id, e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`pt-4 border-t shrink-0 ${mode==='devis' ? 'border-gray-200' : 'border-white/20'}`}>
          {!venteReussie && mode === 'caisse' && panier.length > 0 && (
             <div className="flex flex-col gap-2 mb-3 bg-black/20 p-2 rounded-xl">
               <div className="grid grid-cols-2 md:flex gap-2">
                 <button onClick={()=>setMethodePaiement('CASH')} className={`flex-1 py-2 rounded-lg font-black text-[10px] transition ${methodePaiement==='CASH'?'bg-blue-600 text-white shadow':'text-white/50 hover:text-white border border-white/20'}`}>💵 CASH</button>
                 <button onClick={()=>setMethodePaiement('MVOLA')} className={`flex-1 py-2 rounded-lg font-black text-[10px] transition ${methodePaiement==='MVOLA'?'bg-green-600 text-white shadow':'text-white/50 hover:text-white border border-white/20'}`}>🟢 MVOLA</button>
                 <button onClick={()=>setMethodePaiement('ORANGE MONEY')} className={`flex-1 py-2 rounded-lg font-black text-[10px] transition ${methodePaiement==='ORANGE MONEY'?'bg-orange-500 text-white shadow':'text-white/50 hover:text-white border border-white/20'}`}>🟠 ORANGE</button>
                 <button onClick={()=>setMethodePaiement('CHEQUE')} className={`flex-1 py-2 rounded-lg font-black text-[10px] transition ${methodePaiement==='CHEQUE'?'bg-pink-500 text-white shadow':'text-white/50 hover:text-white border border-white/20'}`}>✍️ CHÈQUE</button>
               </div>
               {methodePaiement === 'CHEQUE' && (
                 <div className="flex gap-2 mt-1">
                    <select className="flex-1 p-2 rounded text-black text-xs font-bold outline-none" value={banqueCheque} onChange={e=>setBanqueCheque(e.target.value)}>
                      <option value="">Sél. Banque...</option>
                      <option value="BOA">BOA</option>
                      <option value="BMOI">BMOI</option>
                      <option value="BRED">BRED</option>
                      <option value="BNI">BNI</option>
                    </select>
                    <input placeholder="N° Chèque (Opt.)" className="flex-1 p-2 rounded text-black text-xs outline-none" value={numeroCheque} onChange={e=>setNumeroCheque(e.target.value)} />
                 </div>
               )}
             </div>
          )}
          
          {!venteReussie && panier.length > 0 && (
             <div className="flex justify-between items-center mb-3">
               <span className="text-xs font-bold uppercase opacity-70">Remise Globale (%) :</span>
               <input type="number" min="0" className="w-16 p-1 text-center text-sm font-black text-black rounded outline-none" value={remiseGlobale !== undefined ? remiseGlobale : ''} onChange={e => setRemiseGlobale(e.target.value)} placeholder="0" />
             </div>
          )}
          
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col">
              <span className="font-bold uppercase text-[10px] opacity-70">Total Net à payer</span>
              {totalRemisesEnAr > 0 && <span className="text-[10px] text-green-300 font-bold tracking-wider">ÉCONOMIE: {formatAr(totalRemisesEnAr)} Ar</span>}
            </div>
            <span className={`text-3xl font-black tracking-tighter ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{formatAr(totalNet)} Ar</span>
          </div>

          {!venteReussie ? (
            <button onClick={valider} className={`w-full p-4 rounded-xl font-black uppercase text-sm shadow-lg transition ${mode === 'devis' ? 'bg-[#800020] text-white hover:bg-[#5a0016]' : 'bg-white text-[#800020] hover:bg-gray-200'}`}>
              {mode === 'devis' ? 'Générer Devis' : 'Valider ('+methodePaiement+')'}
            </button>
          ) : (
            <div className="flex flex-col md:flex-row gap-2">
              <button onClick={() => lancerImpression(mode, venteReussie, params)} className="flex-1 p-3 rounded-xl font-black uppercase bg-green-600 text-white shadow-lg hover:bg-green-700">
                🖨️ {mode==='caisse'?'Ticket':(mode==='devis'?'Devis':'Facture')}
              </button>
              <button onClick={() => {setPanier([]); setVenteReussie(null); setRemiseGlobale(""); setSelectedClient(mode==='caisse' ? "Vente à un utilisateur" : ""); setMethodePaiement("CASH"); setBanqueCheque(""); setNumeroCheque("");}} className="flex-1 p-3 rounded-xl font-bold uppercase border border-white/50 text-white hover:bg-white/10">
                Nouveau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// TABLEAU DE BORD
// ==========================================
const AdminDashboard = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [dateDebut, setDateDebut] = useState(startOfMonth);
  const [dateFin, setDateFin] = useState(endOfMonth);

  const [ventes, setVentes] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [produits, setProduits] = useState([]);
  const [credits, setCredits] = useState([]);
  
  useEffect(() => { 
    const load = async () => { 
      setProduits((await supabase.from('produits').select('*')).data || []); 
      setCredits((await supabase.from('credits').select('*').eq('statut', 'non_paye')).data || []); 
      
      let qV = supabase.from('historique_ventes').select('*');
      if (dateDebut) qV = qV.gte('date_vente', `${dateDebut}T00:00:00`);
      if (dateFin) qV = qV.lte('date_vente', `${dateFin}T23:59:59`);
      setVentes((await qV).data || []);

      let qD = supabase.from('depenses').select('*');
      if (dateDebut) qD = qD.gte('date_depense', dateDebut);
      if (dateFin) qD = qD.lte('date_depense', dateFin);
      setDepenses((await qD).data || []);
    }; 
    load(); 
  }, [dateDebut, dateFin]);
  
  const caPeriode = ventes.reduce((acc, v) => acc + safeNum(v.montant_total), 0); 
  const depPeriode = depenses.reduce((acc, d) => acc + safeNum(d.montant), 0); 
  const benBrutPeriode = ventes.reduce((acc, v) => acc + safeNum(v.benefice_total||0), 0);
  
  const valeurStock = produits.reduce((acc, p) => acc + (safeNum(p.stock_actuel) * safeNum(p.prix_achat)), 0);
  const totalDettes = credits.reduce((acc, c) => acc + safeNum(c.montant_du), 0);

  const cashP = ventes.filter(v => v.methode_paiement === 'CASH' || !v.methode_paiement).reduce((acc, v) => acc + safeNum(v.montant_total), 0);
  const mvolaP = ventes.filter(v => v.methode_paiement === 'MVOLA').reduce((acc, v) => acc + safeNum(v.montant_total), 0);
  const omP = ventes.filter(v => v.methode_paiement === 'ORANGE MONEY').reduce((acc, v) => acc + safeNum(v.montant_total), 0);
  const chequeP = ventes.filter(v => v.methode_paiement === 'CHEQUE').reduce((acc, v) => acc + safeNum(v.montant_total), 0);

  let counts = {}; 
  ventes.forEach(v => { 
    if (v.details_json && Array.isArray(v.details_json.articles)) {
       v.details_json.articles.forEach(art => { counts[art.nom] = (counts[art.nom] || 0) + safeNum(art.qte); });
    }
  });
  
  const topProducts = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nom, qte]) => { 
    const pInfo = produits.find(p => p.nom === nom); 
    return { nom, qte, fournisseur: pInfo ? pInfo.fournisseur_nom : 'Inconnu' }; 
  });
  
  let countFournisseurs = {};
  topProducts.forEach(p => { countFournisseurs[p.fournisseur] = (countFournisseurs[p.fournisseur] || 0) + p.qte; });
  const topFournisseurs = Object.entries(countFournisseurs).sort((a,b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-gray-200 pb-4 gap-4">
        <h2 className="text-2xl font-black uppercase text-[#800020]">Tableau de Bord Stratégique</h2>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
           <span className="text-[10px] font-bold text-gray-500 uppercase ml-2">Du :</span>
           <input type="date" className="p-2 bg-gray-50 rounded outline-none text-xs font-bold" value={dateDebut} onChange={e=>setDateDebut(e.target.value)} />
           <span className="text-[10px] font-bold text-gray-500 uppercase">Au :</span>
           <input type="date" className="p-2 bg-gray-50 rounded outline-none text-xs font-bold" value={dateFin} onChange={e=>setDateFin(e.target.value)} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-[#800020]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chiffre d'Affaires Période</p>
          <p className="text-2xl font-black text-[#800020] mt-1">{formatAr(caPeriode)} Ar</p>
        </div>
        <div className="bg-gray-50 p-5 rounded-2xl shadow-sm border-l-4 border-gray-300">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Marge Brute (Bénéfice Ventes)</p>
          <p className="text-2xl font-black text-gray-700 mt-1">{formatAr(benBrutPeriode)} Ar</p>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Charges (Dépenses)</p>
          <p className="text-2xl font-black text-red-700 mt-1">-{formatAr(depPeriode)} Ar</p>
        </div>
      </div>
      
      <div className="bg-green-700 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-green-200 uppercase tracking-widest mb-1">Bénéfice Net Réel de la période</p>
          <p className="text-[10px] opacity-70">Marge Brute - Charges</p>
        </div>
        <p className="text-4xl md:text-5xl font-black tracking-tighter">{formatAr(benBrutPeriode - depPeriode)} Ar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-black text-gray-800 uppercase text-xs mb-4">Répartition Paiements</h3>
          <div className="space-y-3 flex-1 justify-center flex flex-col">
             <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-500">💵 Cash</span><span className="font-black text-sm">{formatAr(cashP)} Ar</span></div>
             <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: caPeriode>0 ? `${(cashP/caPeriode)*100}%` : '0%'}}></div></div>
             
             <div className="flex justify-between items-center mt-1"><span className="text-xs font-bold text-gray-500">🟢 MVola</span><span className="font-black text-sm">{formatAr(mvolaP)} Ar</span></div>
             <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{width: caPeriode>0 ? `${(mvolaP/caPeriode)*100}%` : '0%'}}></div></div>
             
             <div className="flex justify-between items-center mt-1"><span className="text-xs font-bold text-gray-500">🟠 Orange</span><span className="font-black text-sm">{formatAr(omP)} Ar</span></div>
             <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{width: caPeriode>0 ? `${(omP/caPeriode)*100}%` : '0%'}}></div></div>
             
             <div className="flex justify-between items-center mt-1"><span className="text-xs font-bold text-gray-500">✍️ Chèques</span><span className="font-black text-sm">{formatAr(chequeP)} Ar</span></div>
             <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-pink-500 h-1.5 rounded-full" style={{width: caPeriode>0 ? `${(chequeP/caPeriode)*100}%` : '0%'}}></div></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-black text-gray-800 uppercase text-xs mb-4">🏆 Top 5 Produits (Qté)</h3>
          <div className="space-y-2">
             {topProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-xs font-bold uppercase truncate pr-2"><span className="text-[#800020] mr-1">#{idx+1}</span>{p.nom}</span>
                  <span className="font-black text-sm bg-white px-2 py-0.5 rounded shadow-sm">{p.qte}</span>
                </div>
             ))}
             {topProducts.length === 0 && <p className="text-[10px] text-gray-400 italic text-center">Aucune donnée</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-1">
             <h3 className="font-black text-gray-800 uppercase text-[10px] mb-3">🚚 Top Fournisseurs de la période</h3>
             <div className="space-y-2">
                {topFournisseurs.map((f, idx) => (
                   <div key={idx} className="flex justify-between text-xs">
                     <span className="font-bold text-gray-600">{f[0]}</span>
                     <span className="font-black text-[#800020]">{f[1]} pts</span>
                   </div>
                ))}
                {topFournisseurs.length === 0 && <p className="text-[10px] text-gray-400 italic">Aucune donnée</p>}
             </div>
           </div>
           
           <div className="flex gap-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 text-center flex flex-col justify-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valeur Stock</p>
                <p className="text-xl font-black text-gray-800">{formatAr(valeurStock)}</p>
             </div>
             <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100 flex-1 text-center flex flex-col justify-center">
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1">Créances Clients</p>
                <p className="text-xl font-black text-red-700">{formatAr(totalDettes)}</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ADMIN STOCK (AVEC MODIFICATION DU PRIX)
// ==========================================
const AdminStock = ({ categoriesDb, refreshCategories }) => { 
  const [produits, setProduits] = useState([]);
  const [fours, setFours] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [selectedCatFilter, setSelectedCatFilter] = useState("");
  const [form, setForm] = useState({ nom: '', prix_a: '', prix_v: '', marge: '', stock: '', fournisseur: '', categorie: 'Divers', dlc: '' }); 
  const [reapproProd, setReapproProd] = useState(null); 
  const [reapproForm, setReapproForm] = useState({ qte: '', prix_a: '', prix_v: '', marge: '', dlc: '' }); 
  const [showHistoProd, setShowHistoProd] = useState(null); 

  // Modal pour Édition Prix
  const [editProd, setEditProd] = useState(null);
  const [editForm, setEditForm] = useState({ prix_v: '', marge: '' });

  const load = async () => { 
    const p = await supabase.from('produits').select('*').order('nom'); 
    const f = await supabase.from('fournisseurs').select('nom'); 
    const h = await supabase.from('historique_stock').select('*').order('date_ajout', { ascending: false });
    setProduits(p.data || []); setFours(f.data || []); setHistorique(h.data || []);
  };
  
  useEffect(() => { load(); }, []);

  const saveNouveau = async (e) => { 
    e.preventDefault(); 
    if(!form.fournisseur) return alert("Fournisseur obligatoire"); 
    
    await supabase.from('produits').insert([{ 
      nom: form.nom, prix_achat: safeNum(form.prix_a), prix_vente: safeNum(form.prix_v), 
      marge_pourcent: safeNum(form.marge), stock_actuel: safeNum(form.stock), 
      fournisseur_nom: form.fournisseur, categorie: form.categorie, date_peremption: form.dlc || null 
    }]); 
    
    await supabase.from('historique_stock').insert([{ produit_nom: form.nom, quantite: safeNum(form.stock), prix_achat: safeNum(form.prix_a) }]);
    setForm({ nom:'', prix_a:'', prix_v:'', marge:'', stock:'', fournisseur:'', categorie: 'Divers', dlc: '' }); 
    load(); 
  };
  
  const addCategory = async () => { 
    const newCat = prompt("Nom de la nouvelle catégorie :"); 
    if(newCat) { 
      await supabase.from('categories').insert([{ nom: newCat }]); 
      await refreshCategories(); 
      setForm({...form, categorie: newCat}); 
    } 
  };

  const handleAchat = (val) => { const pa = safeNum(val)||0; const pv = safeNum(form.prix_v)||0; let m = form.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setForm(prev => ({...prev, prix_a: val, marge: m})); };
  const handleVente = (val) => { const pv = safeNum(val)||0; const pa = safeNum(form.prix_a)||0; let m = form.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setForm(prev => ({...prev, prix_v: val, marge: m})); };
  const handleMarge = (val) => { const m = safeNum(val)||0; const pa = safeNum(form.prix_a)||0; let pv = form.prix_v; if(pa>0) pv = Math.round(pa*(1+(m/100))); setForm(prev => ({...prev, marge: val, prix_v: pv})); };

  const saveReappro = async (e) => {
    e.preventDefault();
    await supabase.from('produits').update({ 
      stock_actuel: reapproProd.stock_actuel + safeNum(reapproForm.qte), prix_achat: safeNum(reapproForm.prix_a), 
      prix_vente: safeNum(reapproForm.prix_v), marge_pourcent: safeNum(reapproForm.marge), 
      date_peremption: reapproForm.dlc || reapproProd.date_peremption 
    }).eq('id', reapproProd.id);
    
    await supabase.from('historique_stock').insert([{ produit_nom: reapproProd.nom, quantite: safeNum(reapproForm.qte), prix_achat: safeNum(reapproForm.prix_a) }]);
    setReapproProd(null); load();
  };

  const handleRAchat = (val) => { const pa = safeNum(val)||0; const pv = safeNum(reapproForm.prix_v)||0; let m = reapproForm.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setReapproForm(prev => ({...prev, prix_a: val, marge: m})); };
  const handleRVente = (val) => { const pv = safeNum(val)||0; const pa = safeNum(reapproForm.prix_a)||0; let m = reapproForm.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setReapproForm(prev => ({...prev, prix_v: val, marge: m})); };
  const handleRMarge = (val) => { const m = safeNum(val)||0; const pa = safeNum(reapproForm.prix_a)||0; let pv = reapproForm.prix_v; if(pa>0) pv = Math.round(pa*(1+(m/100))); setReapproForm(prev => ({...prev, marge: val, prix_v: pv})); };

  // NOUVEAU: GESTION DE LA MODIFICATION DE PRIX
  const handleEditVente = (val) => {
    const pv = safeNum(val) || 0;
    const pa = safeNum(editProd.prix_achat) || 0;
    let m = editForm.marge;
    if (pa > 0 && pv > 0) m = (((pv - pa) / pa) * 100).toFixed(2);
    setEditForm(prev => ({ ...prev, prix_v: val, marge: m }));
  };
  const handleEditMarge = (val) => {
    const m = safeNum(val) || 0;
    const pa = safeNum(editProd.prix_achat) || 0;
    let pv = editForm.prix_v;
    if (pa > 0) pv = Math.round(pa * (1 + (m / 100)));
    setEditForm(prev => ({ ...prev, marge: val, prix_v: pv }));
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    await supabase.from('produits').update({
      prix_vente: safeNum(editForm.prix_v),
      marge_pourcent: safeNum(editForm.marge)
    }).eq('id', editProd.id);
    setEditProd(null);
    load();
    alert("Prix modifié avec succès !");
  };

  const isDlcProche = (dlc) => {
    if(!dlc) return false;
    const diff = (new Date(dlc) - new Date()) / (1000 * 3600 * 24);
    return diff <= 10;
  };

  const produitsAffiches = selectedCatFilter ? produits.filter(p => p.categorie === selectedCatFilter) : produits;

  return (
    <div className="space-y-8 relative">
      <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Nouvelle référence</h2>
        <form onSubmit={saveNouveau} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Article</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required /></div>
          <div>
             <label className="text-[10px] font-bold text-[#800020] uppercase flex justify-between">Catégorie <button type="button" onClick={addCategory} className="text-[#800020] font-black">+ Nouveau</button></label>
             <select className="w-full p-3 bg-gray-50 border border-[#800020]/30 rounded-xl outline-none font-bold text-[#800020]" value={form.categorie} onChange={e=>setForm({...form, categorie: e.target.value})}>
               {(categoriesDb||[]).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Coût Achat</label><input type="number" className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={form.prix_a} onChange={e=>handleAchat(e.target.value)} required /></div>
          <div><label className="text-[10px] font-bold text-[#800020] uppercase">Marge (%)</label><input type="number" step="0.01" className="w-full p-3 bg-[#800020]/10 border border-[#800020]/30 rounded-xl font-black text-[#800020] outline-none" value={form.marge} onChange={e=>handleMarge(e.target.value)} /></div>
          <div><label className="text-[10px] font-bold text-red-600 uppercase">Prix Vente</label><input type="number" className="w-full p-3 bg-red-50 border border-red-200 rounded-xl font-black text-red-600 outline-none" value={form.prix_v} onChange={e=>handleVente(e.target.value)} required /></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Stock Initial</label><input type="number" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required /></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Date Péremption (Optionnel)</label><input type="date" className="w-full p-3 bg-gray-50 border rounded-xl outline-none text-xs" value={form.dlc} onChange={e=>setForm({...form, dlc: e.target.value})} /></div>
          <div>
             <label className="text-[10px] font-bold text-gray-400 uppercase">Fournisseur</label>
             <select className="w-full p-3 bg-gray-50 border rounded-xl outline-none text-sm" value={form.fournisseur} onChange={e=>setForm({...form, fournisseur: e.target.value})} required>
               <option value="">Sélectionner</option>
               {fours.map(f=><option key={f.nom} value={f.nom}>{f.nom}</option>)}
             </select>
          </div>
          <button className="w-full bg-[#800020] text-white p-3 rounded-xl font-black uppercase shadow-md md:col-span-4">Ajouter au Stock</button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
           <h3 className="font-black text-[#800020] uppercase">Inventaire Global</h3>
           <select className="p-2 border rounded-lg text-xs font-bold outline-none w-full md:w-auto" value={selectedCatFilter} onChange={e=>setSelectedCatFilter(e.target.value)}>
             <option value="">Toutes Catégories</option>
             {(categoriesDb||[]).map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
              <tr><th className="p-4">Article</th><th className="p-4">Achat</th><th className="p-4">Vente</th><th className="p-4 text-center">Stock</th><th className="p-4 text-center">Péremption</th><th className="p-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produitsAffiches.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <p className="font-bold uppercase text-gray-800">{p.nom}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-bold">{p.categorie || 'DIVERS'}</p>
                  </td>
                  <td className="p-4 text-gray-500">{formatAr(p.prix_achat)}</td>
                  <td className="p-4 font-black text-red-600">{formatAr(p.prix_vente)}</td>
                  <td className="p-4 text-center"><span className={`px-2 py-1 rounded font-black text-[10px] text-white ${safeNum(p.stock_actuel)<=5?'bg-red-600 animate-pulse':'bg-green-600'}`}>{p.stock_actuel}</span></td>
                  <td className="p-4 text-center text-xs font-bold">
                    {p.date_peremption ? (
                      <span className={`${isDlcProche(p.date_peremption) ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-gray-500'}`}>{formatDate(p.date_peremption)}</span>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-center flex justify-center gap-1">
                    <button onClick={() => { setEditProd(p); setEditForm({ prix_v: p.prix_vente, marge: p.marge_pourcent }); }} className="bg-blue-600 text-white px-3 py-1 rounded shadow text-[10px] font-bold uppercase">✏️ Prix</button>
                    <button onClick={() => { setReapproProd(p); setReapproForm({ qte: '', prix_a: p.prix_achat, prix_v: p.prix_vente, marge: p.marge_pourcent, dlc: p.date_peremption || '' }); }} className="bg-[#800020] text-white px-3 py-1 rounded shadow text-[10px] font-bold uppercase">Réappro</button>
                    <button onClick={() => setShowHistoProd(p)} className="bg-gray-200 px-3 py-1 rounded shadow text-[10px] font-bold uppercase">Histo</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MODIFICATION PRIX */}
      {editProd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md">
            <h2 className="text-lg font-black uppercase text-[#800020] mb-4">Modifier Prix : {editProd.nom}</h2>
            <p className="text-xs text-gray-500 mb-4">Coût d'achat actuel : {formatAr(editProd.prix_achat)} Ar</p>
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-red-600 uppercase">Nouveau Prix Vente</label>
                  <input type="number" className="w-full p-3 border rounded-xl text-red-600 font-bold outline-none" value={editForm.prix_v} onChange={e=>handleEditVente(e.target.value)} required />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#800020] uppercase">Marge (%)</label>
                  <input type="number" step="0.01" className="w-full p-3 border rounded-xl text-[#800020] font-bold outline-none" value={editForm.marge} onChange={e=>handleEditMarge(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setEditProd(null)} className="p-3 bg-gray-100 rounded-xl flex-1 font-bold text-gray-600">Annuler</button>
                <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl font-bold flex-1 shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REAPPRO */}
      {reapproProd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md">
            <h2 className="text-lg font-black uppercase text-[#800020] mb-4">Réappro : {reapproProd.nom}</h2>
            <form onSubmit={saveReappro} className="space-y-3">
              <input type="number" placeholder="Qté" className="w-full p-3 border rounded-xl" value={reapproForm.qte} onChange={e=>setReapproForm({...reapproForm, qte: e.target.value})} required />
              <input type="number" placeholder="Nouv. Prix Achat" className="w-full p-3 border rounded-xl" value={reapproForm.prix_a} onChange={e=>handleRAchat(e.target.value)} required />
              <div className="flex gap-2">
                <input type="number" className="w-full p-3 border rounded-xl text-red-600 font-bold" value={reapproForm.prix_v} onChange={e=>handleRVente(e.target.value)} required />
                <input type="number" className="w-full p-3 border rounded-xl text-[#800020] font-bold" value={reapproForm.marge} onChange={e=>handleRMarge(e.target.value)} />
              </div>
              <div><label className="text-[10px] font-bold text-gray-400 uppercase">Nouvelle Date Péremption (Optionnel)</label><input type="date" className="w-full p-3 border rounded-xl" value={reapproForm.dlc} onChange={e=>setReapproForm({...reapproForm, dlc: e.target.value})} /></div>
              <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setReapproProd(null)} className="p-3 bg-gray-100 rounded-xl flex-1">Annuler</button><button type="submit" className="p-3 bg-[#800020] text-white rounded-xl font-bold flex-1">Valider</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTORIQUE */}
      {showHistoProd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-black uppercase text-[#800020]">Historique d'Achat</h2><button onClick={() => setShowHistoProd(null)} className="text-gray-400 font-black text-xl">×</button></div>
            <p className="text-gray-800 font-black mb-4 text-sm">{showHistoProd.nom}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {historique.filter(h => h.produit_nom === showHistoProd.nom).map(h => (
                <div key={h.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div><p className="font-bold text-gray-800 text-xs">+{h.quantite} pièces</p><p className="text-[10px] text-gray-500 uppercase">{formatDate(h.date_ajout)}</p></div>
                  <p className="font-black text-red-600 text-sm">{formatAr(h.prix_achat)} Ar</p>
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

// ==========================================
// CLÔTURE CAISSE ET JOURNAUX
// ==========================================
const ModuleCloture = ({ user, onClotureDone }) => {
  const [caCash, setCaCash] = useState(0);
  const [caMvola, setCaMvola] = useState(0);
  const [caOM, setCaOM] = useState(0);
  const [caCheque, setCaCheque] = useState(0);
  const [totalSorties, setTotalSorties] = useState(0);
  
  const [montantDeclare, setMontantDeclare] = useState('');
  const [justification, setJustification] = useState('');
  const [clotureOk, setClotureOk] = useState(false);
  const [tropTot, setTropTot] = useState(false);
  
  const [sortiesListe, setSortiesListe] = useState([]);
  const [formSortie, setFormSortie] = useState({ motif: '', montant: '', fichier: null });
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    const now = new Date(); const h = now.getHours();
    
    if (h >= 7 && h < 18) { setTropTot(true); return; }

    let shiftStart = new Date(now); 
    if (h < 7) { shiftStart.setDate(shiftStart.getDate() - 1); } 
    shiftStart.setHours(7, 0, 0, 0);

    const { data: lastClotureData } = await supabase.from('cloture_caisse').select('date_cloture').order('date_cloture', { ascending: false }).limit(1).single();
    
    if (lastClotureData && new Date(lastClotureData.date_cloture) >= shiftStart && h >= 18) {
       setClotureOk(true);
    }

    const startIso = lastClotureData ? lastClotureData.date_cloture : shiftStart.toISOString();

    const { data: v } = await supabase.from('historique_ventes').select('montant_total, methode_paiement, type_vente').gte('date_vente', startIso);
    let tCash = 0; let tMvola = 0; let tOM = 0; let tCheque = 0;
    (v || []).forEach(x => {
       if (x.type_vente !== 'CRÉDIT') {
           if (x.methode_paiement === 'MVOLA') tMvola += safeNum(x.montant_total);
           else if (x.methode_paiement === 'ORANGE MONEY') tOM += safeNum(x.montant_total);
           else if (x.methode_paiement === 'CHEQUE') tCheque += safeNum(x.montant_total);
           else tCash += safeNum(x.montant_total); 
       }
    });

    const { data: s } = await supabase.from('sorties_caisse').select('*').gte('date_sortie', startIso);
    const sumSorties = (s || []).reduce((acc, x) => acc + safeNum(x.montant), 0);
    
    setSortiesListe(s || []); setTotalSorties(sumSorties); setCaCash(tCash - sumSorties); setCaMvola(tMvola); setCaOM(tOM); setCaCheque(tCheque);
  };
  
  useEffect(() => { loadData(); }, []);

  const ecartEnCours = safeNum(montantDeclare) - caCash;

  const validerCloture = async () => {
    if (montantDeclare === '') return alert("Saisissez l'argent physique (Cash) compté.");
    if (ecartEnCours !== 0 && justification.trim() === '') return alert("L'écart n'est pas nul. Une justification est OBLIGATOIRE.");

    await supabase.from('cloture_caisse').insert([{ utilisateur: user.identifiant, montant_attendu: caCash, montant_declare: safeNum(montantDeclare), ecart: ecartEnCours, justification: justification }]);
    localStorage.setItem('lastClotureDate', new Date().toISOString());
    setClotureOk(true);
    if (onClotureDone) onClotureDone(); 
  };

  const declarerSortie = async (e) => {
    e.preventDefault(); if(uploading) return; setUploading(true); let publicUrl = null;
    if (formSortie.fichier) { 
      const fileExt = formSortie.fichier.name.split('.').pop(); 
      const fileName = `justif_${Date.now()}.${fileExt}`; 
      const { error: errUp } = await supabase.storage.from('justificatifs').upload(fileName, formSortie.fichier); 
      if (!errUp) { const { data } = supabase.storage.from('justificatifs').getPublicUrl(fileName); publicUrl = data.publicUrl; } 
    }
    await supabase.from('sorties_caisse').insert([{ utilisateur: user.identifiant, motif: formSortie.motif, montant: safeNum(formSortie.montant), photo_url: publicUrl }]);
    setFormSortie({ motif: '', montant: '', fichier: null }); setUploading(false); loadData(); alert("Sortie enregistrée !");
  };

  if (tropTot) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
         <div className="text-6xl mb-4">⏳</div>
         <h2 className="text-2xl font-black text-[#800020] uppercase">Trop tôt !</h2>
         <p className="font-bold text-gray-500 mt-2">La clôture de caisse ne peut se faire qu'entre 18h00 et 06h59.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className={`bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 h-fit ${clotureOk ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-lg font-black uppercase text-gray-800 mb-2">💸 Sorties Exceptionnelles</h3>
        <p className="text-[10px] text-gray-500 mb-6 uppercase font-bold">Achats de matériels, urgences (déduits du Cash).</p>
        
        <form onSubmit={declarerSortie} className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <input placeholder="Motif (ex: Cadenas)" className="w-full p-3 border rounded-xl text-sm outline-none" value={formSortie.motif} onChange={e=>setFormSortie({...formSortie, motif: e.target.value})} required disabled={uploading}/>
          <input type="number" placeholder="Montant (Ar)" className="w-full p-3 border rounded-xl text-sm font-bold text-red-600 outline-none" value={formSortie.montant} onChange={e=>setFormSortie({...formSortie, montant: e.target.value})} required disabled={uploading} />
          <div className="text-xs">
            <label className="font-bold text-gray-500 block mb-1">Preuve / Facture (Optionnel) :</label>
            <input type="file" accept="image/*" onChange={e=>setFormSortie({...formSortie, fichier: e.target.files[0]})} className="text-[10px]" disabled={uploading} />
          </div>
          <button className="w-full bg-gray-800 text-white p-3 rounded-xl font-black text-xs uppercase hover:bg-black transition">{uploading ? 'Enregistrement...' : 'Déclarer la sortie'}</button>
        </form>

        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {sortiesListe.map(s => (
            <div key={s.id} className="p-3 bg-white border border-red-100 rounded-xl flex justify-between items-center shadow-sm">
              <div><p className="font-bold text-xs uppercase text-gray-800">{s.motif}</p>{s.photo_url && <a href={s.photo_url} target="_blank" rel="noreferrer" className="text-[9px] text-blue-600 underline font-bold">📄 Voir justif.</a>}</div>
              <span className="font-black text-red-600 text-sm">-{formatAr(s.montant)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-t-8 border-[#800020] text-center flex flex-col justify-center relative">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#800020] mb-1">Clôture du Shift</h2>
        <p className="text-[9px] text-gray-400 font-bold uppercase mb-6">Prise en compte des ventes depuis la dernière clôture.</p>
        
        {!clotureOk ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
               <div className="bg-green-50 p-3 rounded-xl border border-green-200"><p className="text-[9px] font-bold text-green-700 uppercase">MVola</p><p className="text-sm md:text-base font-black text-green-800">{formatAr(caMvola)}</p></div>
               <div className="bg-orange-50 p-3 rounded-xl border border-orange-200"><p className="text-[9px] font-bold text-orange-700 uppercase">Orange</p><p className="text-sm md:text-base font-black text-orange-800">{formatAr(caOM)}</p></div>
               <div className="bg-pink-50 p-3 rounded-xl border border-pink-200"><p className="text-[9px] font-bold text-pink-700 uppercase">Chèques</p><p className="text-sm md:text-base font-black text-pink-800">{formatAr(caCheque)}</p></div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 relative">
              <p className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">Espèces (Cash) Attendues</p>
              <p className="text-4xl font-black text-blue-900 tracking-tighter">{formatAr(caCash)} Ar</p>
              {totalSorties > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] px-2 py-1 rounded font-black">- {formatAr(totalSorties)} sorties</span>}
            </div>
            
            <div className="pt-4 border-t border-gray-100 text-left">
              <label className="block text-[11px] font-black text-red-600 uppercase mb-2 text-center">Combien de billets avez-vous physiquement ?</label>
              <input type="number" className="w-full text-center text-2xl p-4 bg-red-50 border border-red-200 rounded-xl outline-none font-black text-red-700 placeholder-red-300" placeholder="0" value={montantDeclare} onChange={e => setMontantDeclare(e.target.value)} />
            </div>

            {montantDeclare !== '' && ecartEnCours !== 0 && (
               <div className="animate-pulse bg-orange-50 p-3 rounded-xl border border-orange-300 text-left">
                  <p className="text-[10px] font-black text-orange-800 uppercase mb-1">⚠️ Écart détecté ({formatAr(ecartEnCours)} Ar) - Justification OBLIGATOIRE</p>
                  <input type="text" className="w-full p-2 text-xs border rounded outline-none" placeholder="Pourquoi y a-t-il une différence ?" value={justification} onChange={e=>setJustification(e.target.value)} required />
               </div>
            )}

            <button onClick={validerCloture} className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-md hover:bg-[#5a0016] transition mt-2">Valider Définitivement</button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-500 p-8 rounded-2xl mt-4">
            <h3 className="text-xl font-black text-green-700 uppercase mb-2">Shift Clôturé ! ✅</h3>
            <p className="font-bold text-gray-600 text-sm">Les opérations reprennent au prochain shift.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ModuleJournalClotures = () => {
  const [clotures, setClotures] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const load = async () => { const { data } = await supabase.from('cloture_caisse').select('*').order('date_cloture', { ascending: false }); setClotures(data || []); }; load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Journal des Clôtures</h2>
      <div className="grid gap-3">
        {clotures.map(c => (
           <div key={c.id} onClick={()=>setModal(c)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center cursor-pointer hover:border-[#800020] transition">
             <div>
                <p className="font-bold uppercase text-xs text-gray-500">{formatDateTime(c.date_cloture)}</p>
                <p className="font-black text-gray-800 text-sm mt-1">Par {c.utilisateur}</p>
             </div>
             <div className="text-right">
                <span className={`text-xs font-black px-2 py-1 rounded uppercase ${safeNum(c.ecart) === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{safeNum(c.ecart) === 0 ? 'Caisse Juste' : `Écart : ${formatAr(c.ecart)} Ar`}</span>
             </div>
           </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
             <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-black text-[#800020] uppercase">Détails Clôture</h3><button onClick={()=>setModal(null)} className="font-black text-xl text-gray-400">×</button></div>
             <div className="space-y-4">
                <div><p className="text-[10px] uppercase font-bold text-gray-400">Date et Heure</p><p className="font-black">{formatDateTime(modal.date_cloture)}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400">Opérateur</p><p className="font-black">{modal.utilisateur}</p></div>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border">
                  <div><p className="text-[10px] uppercase font-bold text-gray-400">Attendu</p><p className="font-black text-blue-800">{formatAr(modal.montant_attendu)}</p></div>
                  <div><p className="text-[10px] uppercase font-bold text-gray-400">Déclaré (Compté)</p><p className="font-black text-green-800">{formatAr(modal.montant_declare)}</p></div>
                </div>
                <div className={`p-3 rounded-xl border ${safeNum(modal.ecart) === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-[10px] uppercase font-bold opacity-60">Écart Final</p>
                  <p className={`font-black text-xl ${safeNum(modal.ecart) === 0 ? 'text-green-700' : 'text-red-700'}`}>{formatAr(modal.ecart)} Ar</p>
                </div>
                {safeNum(modal.ecart) !== 0 && (
                   <div className="bg-orange-50 p-3 rounded-xl border border-orange-200"><p className="text-[10px] font-bold text-orange-800 uppercase mb-1">Justification du vendeur :</p><p className="text-xs italic text-orange-900">{modal.justification || 'Aucune justification enregistrée'}</p></div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ModuleJournalDevis = ({ params }) => {
  const [devis, setDevis] = useState([]);
  
  const load = async () => { const { data } = await supabase.from('devis').select('*').order('date_devis', { ascending: false }); setDevis(data || []); };
  useEffect(() => { load(); }, []);

  const transformerFacture = async (d) => {
    if(!window.confirm(`Transformer le devis ${d.numero_devis || 'Sans N°'} en Facture ? Le stock sera déduit.`)) return;
    
    const today = new Date(); 
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(2, 4);
    const numDateStr = `${dd}${mm}${yy}`; 
    
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const startIso = startOfToday.toISOString();

    const { count } = await supabase.from('historique_ventes').select('*', {count: 'exact', head:true}).gte('date_vente', startIso);
    const numFacture = `FA${numDateStr}-${String((count || 0) + 1).padStart(3, '0')}`;

    let beneficeTotal = 0;
    if (d.details_json && Array.isArray(d.details_json.articles)) {
      for (let art of d.details_json.articles) {
         await supabase.rpc('decrement_stock_by_name', { p_nom: art.nom, amount: safeNum(art.qte) });
         const { data: pData } = await supabase.from('produits').select('prix_achat').eq('nom', art.nom).single();
         const pa = pData ? pData.prix_achat : 0;
         beneficeTotal += ((safeNum(art.prix_unitaire) - safeNum(art.remise_unitaire_ar) - pa) * safeNum(art.qte));
      }
    }
    const remiseGl = d.details_json ? safeNum(d.details_json.remise_globale_pourcent) : 0;
    beneficeTotal -= (beneficeTotal * (remiseGl/100));

    await supabase.from('historique_ventes').insert([{ numero_facture: numFacture, type_vente: 'FACTURE', client_nom: d.client_nom, articles_liste: d.articles_liste, montant_total: d.montant_total, benefice_total: beneficeTotal, remise_globale_pourcent: remiseGl, total_remise_ar: d.total_remise_ar, details_json: d.details_json, methode_paiement: 'CASH' }]);
    await supabase.from('devis').update({ statut: 'Facturé ✅', numero_facture_liee: numFacture }).eq('id', d.id);
    load(); alert(`Transformé avec succès ! Numéro de facture : ${numFacture}`);
  };

  const reImprimer = (d) => {
    if (d.statut === 'Facturé ✅') {
       const dataPrint = { numero: d.numero_facture_liee, client_nom: d.client_nom, date: d.date_devis, totalNet: d.montant_total, totalRemisesEnAr: d.total_remise_ar, panier: d.details_json?.articles || [] };
       lancerImpression('facture_a4', dataPrint, params);
    } else {
       const dataPrint = { numero: d.numero_devis, client_nom: d.client_nom, date: d.date_devis, totalNet: d.montant_total, totalRemisesEnAr: d.total_remise_ar, panier: d.details_json?.articles || [] };
       lancerImpression('devis', dataPrint, params);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Journal des Devis</h2>
      <div className="grid gap-3">
        {devis.map(d => (
          <div key={d.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-black text-[#800020]">{d.numero_devis || 'Sans N°'}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.statut === 'En attente' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{d.statut || 'En attente'}</span>
                <span className="text-[10px] text-gray-400 font-bold">{formatDate(d.date_devis)}</span>
              </div>
              <p className="font-black text-sm uppercase">{d.client_nom}</p>
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">🛒 {d.articles_liste}</p>
            </div>
            <p className="text-xl font-black text-gray-800 shrink-0">{formatAr(d.montant_total)} Ar</p>
            <div className="flex gap-2 w-full md:w-auto shrink-0">
               <button onClick={()=>reImprimer(d)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-bold text-xs shadow-sm transition">🖨️ {d.statut === 'Facturé ✅' ? 'Imprimer Facture' : 'Imprimer Devis'}</button>
               {d.statut !== 'Facturé ✅' && <button onClick={()=>transformerFacture(d)} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-black text-xs shadow-sm transition">🔄 Transformer Facture</button>}
            </div>
          </div>
        ))}
        {devis.length === 0 && <p className="text-center text-gray-400 italic">Aucun devis enregistré.</p>}
      </div>
    </div>
  );
};

const ModuleJournalFactures = ({ params }) => {
  const [factures, setFactures] = useState([]); 
  const [dateFiltre, setDateFiltre] = useState("");
  
  useEffect(() => { 
    const load = async () => { 
      let q = supabase.from('historique_ventes').select('*').in('type_vente', ['FACTURE', 'FACTURE_A4']).order('date_vente', { ascending: false }); 
      if (dateFiltre) q = q.gte('date_vente', `${dateFiltre}T00:00:00`).lte('date_vente', `${dateFiltre}T23:59:59`); 
      const { data } = await q; setFactures(data || []); 
    }; load(); 
  }, [dateFiltre]);

  const reImprimer = (v) => {
    const dataPrint = { numero: v.numero_facture, client_nom: v.client_nom, date: v.date_vente, totalNet: v.montant_total, totalRemisesEnAr: v.total_remise_ar, panier: v.details_json?.articles || [], methode: v.methode_paiement, banque: v.details_json?.paiement_infos?.banque };
    lancerImpression('facture_a4', dataPrint, params);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b-2 border-[#800020] pb-2">
        <h2 className="text-2xl font-black uppercase text-[#800020]">Journal des Factures</h2>
        <input type="date" className="p-2 bg-white border rounded-xl font-bold text-xs" onChange={e => setDateFiltre(e.target.value)} />
      </div>
      <div className="grid gap-3">
        {factures.map(v => (
          <div key={v.id} className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-1">
                {v.numero_facture && <span className="font-black text-[#800020]">{v.numero_facture}</span>}
                <span className="text-[10px] text-gray-400 font-bold ml-2">{formatDate(v.date_vente)}</span>
              </div>
              <p className="font-black uppercase text-sm">{v.client_nom}</p>
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">🛒 {v.articles_liste}</p>
            </div>
            <p className="text-xl font-black text-gray-800 shrink-0">{formatAr(v.montant_total)} Ar</p>
            <button onClick={()=>reImprimer(v)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-black text-xs shadow-sm transition w-full md:w-auto shrink-0">🖨️ Imprimer Facture</button>
          </div>
        ))}
        {factures.length === 0 && <p className="text-center text-gray-400 italic">Aucune facture enregistrée.</p>}
      </div>
    </div>
  );
};

const ModuleHistorique = ({ params }) => {
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

  const reImprimer = (v) => {
    const type = v.type_vente === 'CAISSE' ? 'caisse' : (v.type_vente === 'FACTURE' ? 'facture_a4' : 'admin_credit');
    const dataPrint = { numero: v.numero_facture, methode: v.methode_paiement, banque: v.details_json?.paiement_infos?.banque, client_nom: v.client_nom, date: v.date_vente, totalNet: v.montant_total, totalRemisesEnAr: v.total_remise_ar, panier: v.details_json?.articles || [], printSize: '58mm' };
    lancerImpression(type, dataPrint, params);
  };

  const BadgePaiement = ({ methode }) => {
    if(methode === 'MVOLA') return <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded">🟢 MVOLA</span>;
    if(methode === 'ORANGE MONEY') return <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded">🟠 ORANGE M.</span>;
    if(methode === 'CHEQUE') return <span className="bg-pink-100 text-pink-700 text-[9px] font-black px-2 py-0.5 rounded">✍️ CHÈQUE</span>;
    return <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded">💵 CASH</span>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center border-b-2 border-[#800020] pb-2">
        <h2 className="text-2xl font-black uppercase text-[#800020]">Historique Global</h2>
        <input type="date" className="p-2 bg-white border rounded-xl font-bold text-xs" onChange={e => setDateFiltre(e.target.value)} />
      </div>
      <div className="grid gap-3">
        {ventes.map(v => (
          <div key={v.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex-1 w-full cursor-pointer" onClick={() => setDetailModal(v)}>
              <div className="flex items-center gap-2 mb-1">
                {v.numero_facture && <span className="font-black text-gray-800 text-[10px]">{v.numero_facture}</span>}
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${v.type_vente === 'CRÉDIT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{v.type_vente}</span>
                {v.type_vente !== 'CRÉDIT' && <BadgePaiement methode={v.methode_paiement} />}
                <span className="text-[10px] text-gray-400 font-bold">{formatDateTime(v.date_vente)}</span>
              </div>
              <p className="font-black uppercase text-sm">{v.client_nom}</p>
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">🛒 {v.articles_liste}</p>
            </div>
            <p className="text-lg font-black text-[#800020] shrink-0">{formatAr(v.montant_total)} Ar</p>
            <button onClick={(e)=>{e.stopPropagation(); reImprimer(v);}} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-bold text-xs shadow-sm transition w-full md:w-auto shrink-0">🖨️ Re-imprimer</button>
          </div>
        ))}
      </div>

      {detailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
               <div><h3 className="font-black text-[#800020] text-lg uppercase">Détails de Vente</h3><p className="text-xs text-gray-500 font-bold">{formatDateTime(detailModal.date_vente)}</p></div>
               <button onClick={() => setDetailModal(null)} className="text-2xl font-black text-gray-400">×</button>
            </div>
            <p className="text-sm font-bold uppercase mb-4 text-gray-800">👤 {detailModal.client_nom} {detailModal.methode_paiement && `- Payé par ${detailModal.methode_paiement}`}</p>
            <div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-xl max-h-48 overflow-y-auto custom-scrollbar">
              {detailModal.details_json?.articles?.map((art, idx) => (
                <div key={idx} className="flex justify-between text-xs border-b border-gray-200 pb-2 last:border-0">
                  <div>
                    <span className="font-bold">{art.qte}x {art.nom}</span>
                    {art.remise_unitaire_ar > 0 && <p className="text-[9px] text-green-600 font-bold">Remise unitaire: -{formatAr(art.remise_unitaire_ar)} Ar</p>}
                  </div>
                  <span className="font-black">{formatAr(art.total_ligne)} Ar</span>
                </div>
              ))}
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center">
               <div>
                 <p className="text-[10px] font-bold text-red-600 uppercase">Total Payé</p>
                 {detailModal.total_remise_ar > 0 && <p className="text-[9px] text-green-600 font-black mt-1">Économie: {formatAr(detailModal.total_remise_ar)} Ar</p>}
               </div>
               <p className="text-2xl font-black text-[#800020]">{formatAr(detailModal.montant_total)} Ar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminParametres = ({ params, setParams }) => {
  const [form, setForm] = useState(params);
  const save = async (e) => { 
    e.preventDefault(); 
    const { data } = await supabase.from('parametres').update(form).eq('id', 1).select(); 
    if (data) { setParams(data[0]); alert("Paramètres mis à jour avec succès !"); } 
  };
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Paramètres d'Impression</h2>
      <form onSubmit={save} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div><label className="text-xs font-bold text-gray-500 uppercase">Nom de l'entreprise</label><input className="w-full p-3 bg-gray-50 border rounded-xl font-black text-lg outline-none" value={form.nom_entreprise||''} onChange={e=>setForm({...form, nom_entreprise: e.target.value})} required /></div>
        <div><label className="text-xs font-bold text-gray-500 uppercase">Adresse</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.adresse||''} onChange={e=>setForm({...form, adresse: e.target.value})} required /></div>
        <div><label className="text-xs font-bold text-gray-500 uppercase">Contact (Tél)</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.contact||''} onChange={e=>setForm({...form, contact: e.target.value})} /></div>
        <div><label className="text-xs font-bold text-gray-500 uppercase">NIF / STAT (Ex: NIF: 123 | STAT: 456)</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.nif_stat||''} onChange={e=>setForm({...form, nif_stat: e.target.value})} /></div>
        <div><label className="text-xs font-bold text-gray-500 uppercase">Message de fin de ticket</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none italic" value={form.message_ticket||''} onChange={e=>setForm({...form, message_ticket: e.target.value})} /></div>
        <button type="submit" className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-md mt-4">Enregistrer les modifications</button>
      </form>
    </div>
  );
};

const ModuleClients = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ nom: '', tel: '', wa: '', adresse: '', nif: '', stat: '' });
  
  const load = async () => { const { data } = await supabase.from('clients').select('*').order('nom'); setList(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => { 
    e.preventDefault(); 
    await supabase.from('clients').insert([{nom: form.nom, telephone: form.tel, contact_whatsapp: form.wa, adresse: form.adresse, nif: form.nif, stat: form.stat}]); 
    setForm({ nom: '', tel: '', wa: '', adresse: '', nif: '', stat: '' }); 
    load(); 
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <input placeholder="Nom / Société" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required />
        <input placeholder="Tél Normal" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} />
        <input placeholder="N° WhatsApp" className="p-3 bg-green-50 border border-green-100 rounded-xl outline-none" value={form.wa} onChange={e=>setForm({...form, wa: e.target.value})} />
        <div className="flex gap-2">
          <input placeholder="NIF" className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none w-full" value={form.nif} onChange={e=>setForm({...form, nif: e.target.value})} />
          <input placeholder="STAT" className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none w-full" value={form.stat} onChange={e=>setForm({...form, stat: e.target.value})} />
        </div>
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
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">NIF: {c.nif || c.raison_fiscale || '-'}</span>
              <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">STAT: {c.stat || '-'}</span>
            </div>
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
        <input placeholder="Société" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required />
        <input placeholder="Tél Fixe" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} required />
        <input placeholder="WhatsApp" className="p-3 bg-green-50 border border-green-100 rounded-xl outline-none" value={form.wa} onChange={e=>setForm({...form, wa: e.target.value})} />
        <button className="bg-[#800020] text-white p-3 rounded-xl font-black uppercase md:col-span-3">Ajouter</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map(f => (
          <div key={f.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="font-black text-sm uppercase text-gray-800 mb-2">{f.nom}</p>
            <div className="flex gap-2">
              <span className="flex-1 bg-gray-100 text-gray-600 p-2 rounded text-center text-[10px] font-bold">📞 {f.telephone}</span>
              {f.contact_whatsapp && <a href={`https://wa.me/${f.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white p-2 rounded text-center text-[10px] font-black hover:bg-green-600">💬 WhatsApp</a>}
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
    setCredits(cr.data || []); 
    setClients(cl.data || []); 
  };
  useEffect(() => { load(); }, []);

  const encaisser = async (id) => { 
    if(window.confirm("Confirmer encaissement ?")) { 
      await supabase.from('credits').update({ statut: 'paye', date_paiement: new Date().toISOString() }).eq('id', id); 
      load(); 
    } 
  };

  const relancerWA = (credit) => { 
    const client = clients.find(c => c.nom === credit.nom_client); 
    if(!client || !client.contact_whatsapp) return alert("Pas de WhatsApp enregistré."); 
    const num = client.contact_whatsapp.replace(/[^0-9]/g, ''); 
    const txt = encodeURIComponent(`Bonjour, c'est Hakimi Plus. Votre facture de ${formatAr(credit.montant_du)} Ar arrive à échéance le ${formatDate(credit.date_echeance)}. Merci.`); 
    window.open(`https://wa.me/${num}?text=${txt}`, '_blank'); 
  };

  const dataAffichee = credits.filter(c => c.statut === filtre);
  const aujourdHui = new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex gap-2 border-b-2 border-gray-100 pb-4 overflow-x-auto">
        <button onClick={() => setFiltre('non_paye')} className={`px-4 py-2 rounded-xl font-black uppercase text-xs whitespace-nowrap ${filtre === 'non_paye' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}>🔴 Dettes en cours</button>
        <button onClick={() => setFiltre('paye')} className={`px-4 py-2 rounded-xl font-black uppercase text-xs whitespace-nowrap ${filtre === 'paye' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>✅ Payés</button>
      </div>
      <div className="grid gap-3">
        {dataAffichee.map(c => { 
          const echeanceDate = new Date(c.date_echeance); 
          const enRetard = filtre === 'non_paye' && c.date_echeance && echeanceDate <= aujourdHui; 
          return (
            <div key={c.id} className={`bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${filtre === 'non_paye' ? (enRetard ? 'border-red-600 bg-red-50' : 'border-[#800020]') : 'border-green-500'}`}>
              <div className="flex-1">
                <p className="font-black text-lg uppercase text-gray-800">{c.nom_client}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <p className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded border">Créé: {formatDate(c.date_credit)}</p>
                  {filtre === 'non_paye' && c.date_echeance && (<p className={`text-[10px] font-bold px-2 py-1 rounded border ${enRetard ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-50 text-orange-700'}`}>Échéance: {formatDate(c.date_echeance)}</p>)}
                </div>
                <p className="text-xs italic text-gray-500 mt-2 line-clamp-1">🛒 {c.details_articles}</p>
              </div>
              <div className="text-left md:text-right w-full md:w-auto flex flex-col items-end">
                <p className={`text-2xl font-black ${filtre === 'non_paye' ? 'text-red-600' : 'text-green-600'}`}>{formatAr(c.montant_du)} Ar</p>
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

const ModuleDepenses = () => {
  const [depenses, setDepenses] = useState([]);
  const [form, setForm] = useState({ desc: '', montant: '', date: new Date().toISOString().split('T')[0] });

  const load = async () => { const { data } = await supabase.from('depenses').select('*').order('date_depense', { ascending: false }); setDepenses(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => { 
    e.preventDefault(); 
    await supabase.from('depenses').insert([{ description: form.desc, montant: safeNum(form.montant), date_depense: form.date }]); 
    setForm({ ...form, desc: '', montant: '' }); load(); 
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 border-t-4 border-[#800020]">
        <input placeholder="Dépense" className="p-3 bg-gray-50 border rounded-xl md:col-span-2" value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} required />
        <input type="number" placeholder="Montant" className="p-3 bg-red-50 text-red-600 font-bold border rounded-xl" value={form.montant} onChange={e=>setForm({...form, montant: e.target.value})} required />
        <button className="bg-[#800020] text-white p-3 rounded-xl font-black">Ajouter</button>
      </form>
      <div className="space-y-2">
        {depenses.map(d => (
          <div key={d.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-600 flex justify-between">
            <p className="font-bold text-sm uppercase">{d.description}</p>
            <p className="font-black text-red-600">-{formatAr(d.montant)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [creds, setCreds] = useState({ id: '', mdp: '' });
  
  const handle = async (e) => { 
    e.preventDefault(); 
    const { data } = await supabase.from('utilisateurs').select('*').eq('identifiant', creds.id).eq('mot_de_passe', creds.mdp).single(); 
    if (data) onLogin(data); else alert("Identifiants incorrects."); 
  };

  return (
    <div className="min-h-screen bg-[#800020] flex items-center justify-center p-4">
      <form onSubmit={handle} className="bg-white p-12 rounded-[2rem] shadow-2xl w-full max-w-md border-b-8 border-red-600">
        <div className="flex justify-center mb-6"><img src={LOGO_URL} alt="Logo" className="h-16" onerror="this.style.display='none'" /></div>
        <input type="text" placeholder="Utilisateur" className="w-full p-4 mb-4 bg-gray-50 border rounded-xl outline-none" onChange={e=>setCreds({...creds, id: e.target.value})} />
        <input type="password" placeholder="Mot de passe" className="w-full p-4 mb-6 bg-gray-50 border rounded-xl outline-none" onChange={e=>setCreds({...creds, mdp: e.target.value})} />
        <button className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-lg">Connexion</button>
      </form>
    </div>
  );
};
