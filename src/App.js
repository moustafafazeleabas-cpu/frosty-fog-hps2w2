import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 🔒 SÉCURITÉ : VARIABLES D'ENVIRONNEMENT ---
const supabaseUrl = 'https://wblginsktosypbmhmgbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibGdpbnNrdG9zeXBibWhtZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjU3NTYsImV4cCI6MjA4OTk0MTc1Nn0.pmysPmutGjW2Tw7jFvrBE_0ue2pZmS32Pjncu1Rmr8w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOGO_URL = "https://wblginsktosypbmhmgbr.supabase.co/storage/v1/object/public/Hakimi%20logo/hakimi.jpg"; // <-- N'oublie pas ton lien ImgBB ici

const CATEGORIES_PRODUITS = ["Huile", "Épicerie Indienne", "Produits surgelés", "Boissons & Eaux", "Papeterie", "Produits ménagers", "Informatique", "Épicerie pratique", "Cosmétique", "Quincaillerie", "Divers"];

const safeNum = (val) => { if (val === null || val === undefined || val === '') return 0; const n = Number(val); return isNaN(n) ? 0 : n; };
const formatAr = (val) => safeNum(val).toLocaleString('fr-FR');
const formatDate = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('fr-FR'); };
const formatDateTime = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : d.toLocaleString('fr-FR'); };
const formatHeureMessage = (dateStr) => { if (!dateStr) return '-'; const d = new Date(dateStr); return isNaN(d.getTime()) ? '-' : `le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`; };

const lancerImpression = (type, data, params) => {
  const isTicket = data.printSize === '58mm' || data.printSize === '80mm';
  const win = window.open('', '', isTicket ? 'width=350,height=600' : 'width=800,height=900');
  
  if (!win) { alert("⚠️ Votre navigateur a bloqué l'impression. Veuillez autoriser les Pop-ups."); return; }

  const dateDoc = formatDateTime(data.date || new Date());
  const panierList = Array.isArray(data.panier) ? data.panier : [];
  const fraisLivraison = safeNum(data.fraisLivraison);

  const getLineData = (i) => {
    const prixU = safeNum(i.prix_unitaire !== undefined ? i.prix_unitaire : i.prix_vente);
    const remiseU = safeNum(i.remise_unitaire_ar !== undefined ? i.remise_unitaire_ar : i.remise_montant);
    const qte = safeNum(i.qte);
    const totalLigne = safeNum(i.total_ligne !== undefined ? i.total_ligne : (prixU - remiseU) * qte);
    return { prixU, remiseU, qte, totalLigne };
  };

  if (isTicket) {
    let titreType = '';
    if (type === 'admin_credit') titreType = 'FACTURE À CRÉDIT';
    if (type === 'devis') titreType = 'DEVIS ESTIMATIF';
    if (type === 'facture_a4') titreType = 'FACTURE';

    win.document.write(`
      <html><head><title>${data.numero || 'Ticket'}</title>
        <style>@media print { @page { margin: 0; } body { margin: 0; } .no-print { display: none !important; } } body { font-family: monospace; width: ${data.printSize}; padding: 10px; font-size: 12px; margin: 0 auto; text-align: center; } .item-block { text-align: left; margin-bottom: 8px; border-bottom: 1px dotted #ccc; padding-bottom: 4px; } .item-line1 { font-weight: bold; font-size: 12px; } .item-line2 { display: flex; justify-content: space-between; margin-top: 3px; font-size: 11px; } .item-line3 { font-size: 10px; color: #555; margin-top: 2px; }</style>
      </head><body>
        <img src="${LOGO_URL}" style="max-width:80%; height:auto; margin-bottom:5px;" onerror="this.style.display='none'"/>
        <h2 style="margin:0;">${params.nom_entreprise || 'HAKIMI PLUS'}</h2>
        <p style="margin:0; font-size:10px;">${params.adresse || ''}<br/>${params.contact || ''}</p>
        ${params.message_entete ? `<p style="margin:3px 0; font-size:10px;">${String(params.message_entete).replace(/\n/g, '<br/>')}</p>` : ''}
        <p style="margin:5px 0; font-size:10px;">${dateDoc}</p>
        ${titreType ? `<div style="border: 2px solid #000; padding: 4px; margin: 5px 0;"><h3 style="margin:0; font-size:12px; text-transform:uppercase;">${titreType}</h3>${data.client_nom && data.client_nom !== 'Vente à consommateur' ? `<p style="margin:2px 0 0 0; font-size:10px; font-weight:bold;">Client: ${data.client_nom}</p>` : ''}${data.echeance ? `<p style="margin:2px 0 0 0; font-size:10px; color:red;">Échéance : ${formatDate(data.echeance)}</p>` : ''}</div>` : ''}
        ${data.numero ? `<p style="margin:0; font-weight:bold; font-size:11px; border:1px solid #000; padding:2px; display:inline-block;">${data.numero}</p>` : ''}
        ${data.methode && type !== 'admin_credit' && type !== 'devis' ? `<p style="margin:2px 0; font-weight:bold; font-size:10px;">Payé par : ${data.methode}${data.banque ? ` (${data.banque})` : ''}</p>` : ''}
        <hr style="border-top:1px dashed #000;"/>
        <div style="width:100%;">
          ${panierList.length > 0 ? panierList.map(i => {
            const { prixU, remiseU, qte, totalLigne } = getLineData(i);
            return `<div class="item-block"><div class="item-line1">${qte}x ${i.nom}</div><div class="item-line2"><span>${formatAr(prixU - remiseU)} Ar/u</span><span style="font-weight:bold;">${formatAr(totalLigne)} Ar</span></div><div class="item-line3">[${i.categorie || 'Divers'}]</div></div>`;
          }).join('') : `<p style="font-size:10px; text-align:left;">Ancien format : ${data.articles_liste || data.details_articles || 'Détails non disponibles'}</p>`}
        </div>
        <hr style="border-top:1px dashed #000;"/>
        <div style="text-align:right; font-size:12px; margin:3px 0;">Total Articles: ${formatAr(data.totalNet)} Ar</div>
        ${fraisLivraison > 0 ? `<div style="text-align:right; font-size:12px; margin:3px 0;">Livraison: ${formatAr(fraisLivraison)} Ar</div>` : ''}
        <h3 style="text-align:right; margin:5px 0;">${type === 'devis' ? 'TOTAL ESTIMÉ' : 'À PAYER'}: ${formatAr(safeNum(data.totalNet) + fraisLivraison)} Ar</h3>
        ${data.totalRemisesEnAr > 0 ? `<p style="text-align:right; font-size:10px; margin:0;">(Dont remise : ${formatAr(data.totalRemisesEnAr)} Ar)</p>` : ''}
        <p style="margin-top:10px; font-size:11px;">${(params.message_ticket ? String(params.message_ticket) : 'Merci de votre visite !').replace(/\n/g, '<br/>')}</p>
        <p style="color:#fff;">.</p>
      </body></html>
    `);
  } else {
    let titre = 'FACTURE'; if (type === 'devis') titre = 'PROFORMA / DEVIS'; if (type === 'admin_credit') titre = 'FACTURE À CRÉDIT';
    win.document.write(`
      <html><head><title>${data.numero || titre}</title>
        <style>@media print { @page { margin: 0; size: auto; } body { margin: 1cm; } .no-print { display: none !important; } } body { font-family: Arial, sans-serif; font-size: 13px; color: #333; } table { width: 100%; border-collapse: collapse; margin-top: 15px; } th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; } th { background-color: #800020; color: white; } .header-flex { display: flex; justify-content: space-between; border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 15px; } .client-box { background-color: #f9f9f9; border-left: 4px solid #800020; padding: 15px; width: 50%; margin-bottom: 20px; } .total-line { font-size: 20px; font-weight: bold; color: #800020; text-align: right; margin-top: 10px; }</style>
      </head><body>
        <div class="no-print" style="background:#fff3cd; color:#856404; padding:10px; text-align:center; font-weight:bold; margin-bottom:20px; border-radius:5px; border: 1px solid #ffeeba;">
           💡 Pour télécharger en PDF : Choisissez "Enregistrer au format PDF" dans la case "Destination" (ou Imprimante) ci-contre.
        </div>
        <div class="header-flex"><div><img src="${LOGO_URL}" style="height:50px; margin-bottom:5px;" onerror="this.style.display='none'"/><h3 style="margin:0; color:#800020;">${params.nom_entreprise || 'HAKIMI PLUS'}</h3><p style="margin:0; font-size:11px;">${params.adresse || ''}<br/>${params.nif_stat || ''}<br/>${params.contact || ''}</p></div><div style="text-align:right;"><h2 style="margin:0; color:#800020; font-size: 22px;">${titre}</h2>${data.numero ? `<h3 style="margin:5px 0;">N° ${data.numero}</h3>` : ''}<p style="margin:5px 0 0 0;">Date : ${dateDoc}</p>${data.methode && type !== 'admin_credit' ? `<p style="margin:5px 0 0 0; font-weight:bold; font-size:11px;">Payé par : ${data.methode}${data.banque ? ` (${data.banque})` : ''}</p>` : ''}</div></div>
        <div class="client-box"><strong>Client :</strong> ${data.client_nom}<br/><strong>NIF :</strong> ${data.client_nif || '-'}<br/><strong>STAT :</strong> ${data.client_stat || '-'}<br/>${data.client_tel ? `<strong>Contact :</strong> ${data.client_tel}<br/>` : ''}${type === 'admin_credit' && data.echeance ? `<br/><strong style="color:red;">Échéance : ${formatDate(data.echeance)}</strong>` : ''}</div>
        <table><thead><tr><th>Désignation</th><th>Qté</th><th>Prix U.</th><th style="text-align:right;">Total</th></tr></thead><tbody>
            ${panierList.length > 0 ? panierList.map(i => {
              const { prixU, remiseU, qte, totalLigne } = getLineData(i);
              return `<tr><td>${i.nom} <span style="font-size:10px; color:#666;">(${i.categorie || 'Divers'})</span></td><td>${qte}</td><td>${formatAr(prixU - remiseU)}</td><td style="text-align:right;">${formatAr(totalLigne)} Ar</td></tr>`;
            }).join('') : `<tr><td colspan="4">${data.articles_liste || data.details_articles || 'Détails non disponibles'}</td></tr>`}
        </tbody></table>
        <div style="margin-top:20px; text-align:right;"><div style="font-size:16px; font-weight:bold; color:#555;">TOTAL ARTICLES : ${formatAr(data.totalNet)} Ar</div>${fraisLivraison > 0 ? `<div style="font-size:16px; font-weight:bold; color:#555; margin-top:5px;">FRAIS LIVRAISON : ${formatAr(fraisLivraison)} Ar</div>` : ''}<div class="total-line">NET À PAYER : ${formatAr(safeNum(data.totalNet) + fraisLivraison)} Ar</div>${data.totalRemisesEnAr > 0 ? `<p style="font-size:11px; color:green; margin:5px 0;">(Remise globale appliquée : ${formatAr(data.totalRemisesEnAr)} Ar)</p>` : ''}</div>
        ${type === 'devis' ? '<p style="text-align:center; margin-top:40px; font-size:11px; font-style:italic; color:#888;">Ce document est un devis estimatif et ne constitue pas une facture. Valable 30 jours.</p>' : ''}
      </body></html>
    `);
  }
  win.document.close(); setTimeout(() => { win.print(); }, 800);
};

export default function App() {
  const [user, setUser] = useState(() => { const savedUser = localStorage.getItem('hakimi_user'); return savedUser ? JSON.parse(savedUser) : null; });
  const [view, setView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msgNonLus, setMsgNonLus] = useState(0);
  const [parametres, setParametres] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertesStockDLC, setAlertesStockDLC] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [categoriesDb, setCategoriesDb] = useState([]);
  const [hasClearedNotifsToday, setHasClearedNotifsToday] = useState(() => localStorage.getItem('notifClearedDate') === new Date().toLocaleDateString('fr-FR'));

  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);

  const loadCategories = async () => { const { data } = await supabase.from('categories').select('nom').order('nom'); if (data && data.length > 0) setCategoriesDb(data.map(c => c.nom)); };

  useEffect(() => {
    const loadInit = async () => { const { data: pData } = await supabase.from('parametres').select('*').eq('id', 1).single(); if (pData) setParametres(pData); await loadCategories(); setTimeout(() => setLoading(false), 1000); };
    loadInit();
  }, []);

  useEffect(() => {
    if (user) {
      if(user.role === 'vendeur' && view === 'dashboard') setView('caisse'); 
      const checkTasks = async () => {
        const { count } = await supabase.from('messagerie').select('*', { count: 'exact', head: true }).eq('destinataire', user.identifiant).eq('est_lu', false);
        setMsgNonLus(count || 0);
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
      };
      checkTasks(); const interval = setInterval(checkTasks, 30000); return () => clearInterval(interval);
    }
  }, [user, view]);

  const handleLogin = (userData) => { localStorage.setItem('hakimi_user', JSON.stringify(userData)); setUser(userData); };
  const handleLogout = () => { localStorage.removeItem('hakimi_user'); setUser(null); };
  const handleOpenNotif = () => { setNotifOpen(!notifOpen); if (!notifOpen) { localStorage.setItem('notifClearedDate', new Date().toLocaleDateString('fr-FR')); setHasClearedNotifsToday(true); } };

  if (loading) return (<div className="min-h-screen bg-white flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-[#800020] border-t-transparent rounded-full animate-spin mb-4"></div><img src={LOGO_URL} alt="Chargement..." className="h-12 animate-pulse" onError={(e) => e.target.style.display='none'} /></div>);
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const changeView = (newView) => { setView(newView); setMenuOpen(false); };
  const totalAlertes = msgNonLus + (hasClearedNotifsToday ? 0 : alertesStockDLC.length);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      <div className="md:hidden bg-[#800020] text-white p-4 flex justify-between items-center sticky top-0 z-[60] shadow-md">
        <img src={LOGO_URL} alt="Hakimi Plus" className="h-8 bg-white p-1 rounded" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<span class="font-black text-xl italic uppercase">HAKIMI PLUS</span>'; }} />
        <div className="flex items-center gap-4"><button onClick={handleOpenNotif} className="text-xl relative">🔔 {totalAlertes > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-black animate-pulse">{totalAlertes}</span>}</button><button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">☰</button></div>
      </div>
      {menuOpen && <div className="fixed inset-0 bg-black/60 z-[65] md:hidden" onClick={() => setMenuOpen(false)}></div>}

      <nav className={`fixed inset-y-0 left-0 z-[70] w-72 bg-[#800020] text-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div>
          <div className="mb-6 hidden md:flex flex-col items-center border-b border-white/10 pb-6 relative">
             <button onClick={handleOpenNotif} className="absolute top-0 right-0 text-xl hover:scale-110 transition">🔔 {totalAlertes > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-black animate-pulse shadow-lg">{totalAlertes}</span>}</button>
             <img src={LOGO_URL} alt="Hakimi Plus" className="max-w-[80%] h-auto bg-white p-2 rounded-xl shadow-inner mb-2 mt-4" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<h1 class="text-3xl font-black italic tracking-tighter text-center mt-4">HAKIMI <span class="text-red-500">PLUS</span></h1>'; }} />
             <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mt-2">{currentTime.toLocaleTimeString('fr-FR')}</span>
          </div>
          <div className="flex flex-col gap-1">
            <NavBtn active={view==='messagerie'} onClick={()=>changeView('messagerie')}><span className="flex items-center justify-between w-full"><span>✉️ Messagerie</span>{msgNonLus > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">{msgNonLus}</span>}</span></NavBtn>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-1 mt-4">Menu Principal</p>
            <NavBtn active={view==='caisse'} onClick={()=>changeView('caisse')}>🛒 Caisse Directe</NavBtn>
            <NavBtn active={view==='facture_a4'} onClick={()=>changeView('facture_a4')}>📄 Nouvelle Facture</NavBtn>
            <NavBtn active={view==='devis'} onClick={()=>changeView('devis')}>📝 Créer un Devis</NavBtn>
            <NavBtn active={view==='admin_credit'} onClick={()=>changeView('admin_credit')}>🔴 Ventes à Crédit</NavBtn>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-1 mt-4">Registres</p>
            <NavBtn active={view==='journal_factures'} onClick={()=>changeView('journal_factures')}>🧾 Journal Factures</NavBtn>
            <NavBtn active={view==='journal_devis'} onClick={()=>changeView('journal_devis')}>📚 Journal Devis</NavBtn>
            <NavBtn active={view==='historique'} onClick={()=>changeView('historique')}>📅 Historique Global</NavBtn>
            {user.role === 'superadmin' && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest px-4 mb-1">Direction</p>
                <NavBtn active={view==='dashboard'} onClick={()=>changeView('dashboard')}>📊 Tableau de Bord</NavBtn>
              <NavBtn active={view==='commandes_web'} onClick={()=>changeView('commandes_web')}>🌐 Commandes Site Web</NavBtn>
<NavBtn active={view==='gestion_site'} onClick={()=>changeView('gestion_site')}>🎨 Configuration Site</NavBtn>
                <NavBtn active={view==='admin_stock'} onClick={()=>changeView('admin_stock')}>📦 Stock & Réappro</NavBtn>
                <NavBtn active={view==='depenses'} onClick={()=>changeView('depenses')}>💸 Dépenses</NavBtn>
                <NavBtn active={view==='clients'} onClick={()=>changeView('clients')}>👥 Base Clients</NavBtn>
                <NavBtn active={view==='admin_fournisseurs'} onClick={()=>changeView('admin_fournisseurs')}>🚚 Fournisseurs</NavBtn>
                <NavBtn active={view==='suivi_credits'} onClick={()=>changeView('suivi_credits')}>📉 Suivi Dettes</NavBtn>
                <NavBtn active={view==='admin_utilisateurs'} onClick={()=>changeView('admin_utilisateurs')}>🔐 Comptes & Accès</NavBtn>
                <NavBtn active={view==='parametres'} onClick={()=>changeView('parametres')}>⚙️ Paramètres Ticket & ERP</NavBtn>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-4 text-center shrink-0"><p className="text-[10px] text-white/50 mb-2">Connecté : <span className="font-bold text-white uppercase">{user.identifiant}</span></p><button onClick={handleLogout} className="w-full p-3 bg-white/10 hover:bg-red-600 rounded-xl text-xs font-black uppercase transition border border-white/10">Déconnexion</button></div>
      </nav>

      {notifOpen && (
        <><div className="fixed inset-0 z-[75] md:hidden" onClick={() => setNotifOpen(false)}></div>
          <div className="fixed md:absolute top-16 md:top-6 right-4 md:left-80 w-[90%] md:w-80 bg-white rounded-2xl shadow-2xl z-[80] border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
             <div className="bg-[#800020] p-4 flex justify-between items-center text-white"><h3 className="font-black uppercase text-sm">Notifications</h3><button onClick={()=>setNotifOpen(false)} className="font-black text-lg">×</button></div>
             <div className="p-2 overflow-y-auto custom-scrollbar">
               {msgNonLus > 0 && (<button onClick={()=>{setView('messagerie'); setNotifOpen(false);}} className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 mb-2 transition"><p className="font-black text-blue-800 text-xs">✉️ {msgNonLus} Nouveau(x) Message(s)</p></button>)}
               {alertesStockDLC.map((al, idx) => (<div key={idx} className={`p-3 rounded-xl mb-2 border ${al.type === 'stock' ? 'bg-red-50 border-red-100 text-red-800' : (al.type === 'dlc_depasse' ? 'bg-gray-800 text-white' : 'bg-orange-50 border-orange-100 text-orange-800')}`}><p className="font-bold text-xs uppercase">{al.type === 'stock' ? '⚠️ RUPTURE' : (al.type === 'dlc_depasse' ? '☠️ PÉRIMÉ' : '⏳ EXPIRATION PROCHE')}</p><p className="text-[11px] mt-1">{al.text}</p></div>))}
               {(msgNonLus === 0 && alertesStockDLC.length === 0) && <p className="text-center text-gray-400 text-xs py-4 italic">Aucune notification.</p>}
             </div>
          </div>
        </>
      )}

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto relative">
        {view==='commandes_web' && <ModuleCommandesWeb />}
{view==='gestion_site' && <ModuleGestionSite />}
        {(view==='caisse' || view==='facture_a4' || view==='admin_credit' || view==='devis') && <ModuleVente mode={view} params={parametres} categoriesDb={categoriesDb} />}
        {view==='admin_stock' && <AdminStock categoriesDb={categoriesDb} refreshCategories={loadCategories} />}
        {view==='admin_fournisseurs' && <AdminFournisseurs />}
        {view==='dashboard' && <AdminDashboard />}
        {view==='historique' && <ModuleHistorique params={parametres} />}
        {view==='journal_factures' && <ModuleJournalFactures params={parametres} />}
        {view==='journal_devis' && <ModuleJournalDevis params={parametres} />}
        {view==='clients' && <ModuleClients />}
        {view==='depenses' && <ModuleDepenses />}
        {view==='suivi_credits' && <SuiviCredits params={parametres} />}
        {view==='messagerie' && <ModuleMessagerie user={user} onMessagesRead={() => setMsgNonLus(0)} />}
        {view==='parametres' && <AdminParametres params={parametres} setParams={setParametres} />}
        {view==='admin_utilisateurs' && <AdminUtilisateurs currentUser={user} onUpdateSession={handleLogin} />}
      </main>
    </div>
  );
}

const NavBtn = ({ active, onClick, disabled, children }) => (<button onClick={onClick} disabled={disabled} className={`p-3 rounded-xl text-left font-bold text-sm transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${active ? 'bg-white text-[#800020] shadow-xl translate-x-1' : (!disabled ? 'hover:bg-white/5 text-white/80' : 'text-white/80')}`}>{children}</button>);

const AdminUtilisateurs = ({ currentUser, onUpdateSession }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ identifiant: '', mot_de_passe: '', role: 'vendeur' });
  const load = async () => { const { data } = await supabase.from('utilisateurs').select('*').order('identifiant'); setUsers(data || []); };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); if(form.identifiant.length < 3) return alert("L'identifiant est trop court.");
    const ex = users.find(u => u.identifiant === form.identifiant);
    if (ex) { await supabase.from('utilisateurs').update({ mot_de_passe: form.mot_de_passe, role: form.role }).eq('identifiant', form.identifiant); alert("Utilisateur mis à jour !"); if (currentUser.identifiant === form.identifiant) onUpdateSession({ ...currentUser, mot_de_passe: form.mot_de_passe, role: form.role }); } else { await supabase.from('utilisateurs').insert([{ identifiant: form.identifiant, mot_de_passe: form.mot_de_passe, role: form.role }]); alert("Nouvel utilisateur créé !"); }
    setForm({ identifiant: '', mot_de_passe: '', role: 'vendeur' }); load();
  };
  const deleteUser = async (id) => { if(id === currentUser.identifiant) return alert("Impossible de supprimer votre compte !"); if(id === 'admin1996') return alert("Impossible de supprimer admin1996."); if(window.confirm(`Supprimer ${id} ?`)) { await supabase.from('utilisateurs').delete().eq('identifiant', id); load(); } };
  const selectUser = (u) => { setForm({ identifiant: u.identifiant, mot_de_passe: u.mot_de_passe, role: u.role }); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Comptes & Accès</h2>
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input placeholder="Identifiant" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.identifiant} onChange={e=>setForm({...form, identifiant: e.target.value})} required />
        <input placeholder="Mot de passe" type="text" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.mot_de_passe} onChange={e=>setForm({...form, mot_de_passe: e.target.value})} required />
        <select className="p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={form.role} onChange={e=>setForm({...form, role: e.target.value})}><option value="vendeur">Vendeur</option><option value="superadmin">Super Admin</option></select>
        <button className="bg-[#800020] text-white p-3 rounded-xl font-black uppercase text-xs hover:bg-[#5a0016] transition">Créer / Modifier</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map(u => (
          <div key={u.identifiant} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center"><div className="cursor-pointer" onClick={() => selectUser(u)}><p className="font-black text-lg text-gray-800 hover:text-[#800020]">{u.identifiant} {u.identifiant === currentUser.identifiant ? '(Vous)' : ''}</p><div className="flex gap-2 mt-1"><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${u.role === 'superadmin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span><span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">MDP: {u.mot_de_passe}</span></div></div>{u.identifiant !== currentUser.identifiant && u.identifiant !== 'admin1996' && (<button onClick={() => deleteUser(u.identifiant)} className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 w-10 h-10 rounded-full flex items-center justify-center font-black transition">🗑️</button>)}</div>
        ))}
      </div>
    </div>
  );
};

const ModuleMessagerie = ({ user, onMessagesRead }) => {
  const [messages, setMessages] = useState([]);
  const [destinataires, setDestinataires] = useState([]);
  const [form, setForm] = useState({ dest: '', obj: '', msg: '' });

  const load = async () => {
    const { data: usersData } = await supabase.from('utilisateurs').select('identifiant').neq('identifiant', user.identifiant); setDestinataires(usersData || []); if(usersData && usersData.length > 0) setForm(prev => ({...prev, dest: usersData[0].identifiant}));
    const { data } = await supabase.from('messagerie').select('*').or(`destinataire.eq.${user.identifiant},expediteur.eq.${user.identifiant}`).order('date_envoi', { ascending: false }); setMessages(data || []);
    await supabase.from('messagerie').update({ est_lu: true }).eq('destinataire', user.identifiant).eq('est_lu', false); if(onMessagesRead) onMessagesRead();
  };
  useEffect(() => { load(); }, []);

  const send = async (e) => { e.preventDefault(); if(!form.dest) return alert("Aucun destinataire sélectionné."); await supabase.from('messagerie').insert([{ expediteur: user.identifiant, destinataire: form.dest, objet: form.obj, message: form.msg }]); setForm({ ...form, obj: '', msg: '' }); load(); alert("Message envoyé !"); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020]"><h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Nouveau Message</h2><form onSubmit={send} className="space-y-3"><div className="flex gap-3"><select className="p-3 bg-gray-50 border rounded-xl font-bold uppercase text-xs" value={form.dest} onChange={e=>setForm({...form, dest: e.target.value})} required>{destinataires.length === 0 && <option value="">Aucun autre utilisateur</option>}{destinataires.map(d => <option key={d.identifiant} value={d.identifiant}>{d.identifiant}</option>)}</select><input placeholder="Objet du message..." className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none" value={form.obj} onChange={e=>setForm({...form, obj: e.target.value})} required /></div><textarea placeholder="Écrivez votre message ici..." className="w-full p-4 bg-gray-50 border rounded-xl outline-none min-h-[100px] resize-none" value={form.msg} onChange={e=>setForm({...form, msg: e.target.value})} required /><button className="bg-[#800020] text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-md">Envoyer 🚀</button></form></div>
      <div className="space-y-3">{messages.map(m => (<div key={m.id} className={`p-5 rounded-2xl border ${m.expediteur === user.identifiant ? 'bg-gray-50 border-gray-200 ml-8' : 'bg-red-50 border-red-100 mr-8 shadow-sm'}`}><div className="flex justify-between items-start mb-2"><div><span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${m.expediteur === user.identifiant ? 'bg-gray-200 text-gray-600' : 'bg-red-600 text-white'}`}>{m.expediteur === user.identifiant ? 'Moi' : m.expediteur} {m.expediteur === user.identifiant && ` ➔ ${m.destinataire}`}</span><span className="text-[10px] text-gray-400 font-bold ml-2">{formatHeureMessage(m.date_envoi)}</span></div></div><p className="font-black text-gray-800 text-sm mb-1">{m.objet}</p><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{m.message}</p></div>))}</div>
    </div>
  );
};

const ModuleVente = ({ mode, params, categoriesDb }) => {
  const [panier, setPanier] = useState([]); const [produits, setProduits] = useState([]); const [clients, setClients] = useState([]); const [search, setSearch] = useState(""); const [selectedCat, setSelectedCat] = useState(""); const [selectedClient, setSelectedClient] = useState(""); const [echeance, setEcheance] = useState(""); const [printSize, setPrintSize] = useState(mode === 'admin_credit' || mode === 'devis' ? 'A4' : '58mm'); const [remiseGlobale, setRemiseGlobale] = useState(""); const [methodePaiement, setMethodePaiement] = useState("CASH"); const [banqueCheque, setBanqueCheque] = useState(""); const [numeroCheque, setNumeroCheque] = useState(""); const [venteReussie, setVenteReussie] = useState(null); const [isLivraison, setIsLivraison] = useState(false); const [fraisLivraison, setFraisLivraison] = useState(1000);

  useEffect(() => {
    const load = async () => { const p = await supabase.from('produits').select('*').order('nom'); const c = await supabase.from('clients').select('*').order('nom'); setProduits(p.data || []); if (mode !== 'caisse') { setSelectedClient(""); setClients(c.data.filter(i => i.nom !== 'Vente à consommateur' && i.nom !== 'Vente à un utilisateur')); } else { setSelectedClient("Vente à consommateur"); setClients(c.data); } };
    load(); setPanier([]); setVenteReussie(null); setRemiseGlobale(""); setMethodePaiement("CASH"); setSelectedCat(""); setBanqueCheque(""); setNumeroCheque(""); setIsLivraison(false); setFraisLivraison(1000); if (mode === 'admin_credit' || mode === 'facture_a4' || mode === 'devis') setPrintSize('A4'); else setPrintSize('58mm');
  }, [mode]);

  const totalBrut = panier.reduce((acc, i) => acc + (safeNum(i.prix_vente) * safeNum(i.qte)), 0); const totalRemiseArticles = panier.reduce((acc, i) => acc + (safeNum(i.remise_montant) * safeNum(i.qte)), 0); const totalApresRemiseArticles = totalBrut - totalRemiseArticles; const montantRemiseGlobale = totalApresRemiseArticles * (safeNum(remiseGlobale) / 100); const totalNet = totalApresRemiseArticles - montantRemiseGlobale; const totalRemisesEnAr = totalRemiseArticles + montantRemiseGlobale; const beneficeArticles = panier.reduce((acc, i) => acc + ((safeNum(i.prix_vente) - safeNum(i.remise_montant) - safeNum(i.prix_achat)) * safeNum(i.qte)), 0); const beneficeNet = beneficeArticles - montantRemiseGlobale; const totalAPayerClient = totalNet + (isLivraison ? fraisLivraison : 0);

  const ajouter = (p) => { if (venteReussie) return; if (safeNum(p.stock_actuel) <= 0) return alert("⚠️ Stock épuisé !"); const ex = panier.find(i => i.id === p.id); if (ex) { if (safeNum(ex.qte) >= safeNum(p.stock_actuel)) return alert("⚠️ Stock maximum !"); setPanier(panier.map(i => i.id === p.id ? { ...i, qte: safeNum(i.qte) + 1 } : i)); } else { setPanier([...panier, { ...p, qte: 1, remise_montant: "" }]); } };
  const updateRemiseArticle = (id, val) => { setPanier(panier.map(i => i.id === id ? { ...i, remise_montant: val } : i)); };

  const valider = async () => {
    if (panier.length === 0) return; if (mode !== 'caisse' && !selectedClient) return alert("Client requis"); if (mode === 'admin_credit' && !echeance) return alert("Échéance requise"); if (methodePaiement === 'CHEQUE' && !banqueCheque) return alert("Banque chèque requise.");
    let numero_genere = ""; const today = new Date(); const dd = String(today.getDate()).padStart(2, '0'); const mm = String(today.getMonth() + 1).padStart(2, '0'); const yy = String(today.getFullYear()).slice(2, 4); const numDateStr = `${dd}${mm}${yy}`; const startOfToday = new Date(today); startOfToday.setHours(0, 0, 0, 0); const startIso = startOfToday.toISOString();
    if (mode !== 'caisse') { const isDevis = mode === 'devis'; const prefix = isDevis ? 'DV' : 'FA'; const table = isDevis ? 'devis' : 'historique_ventes'; const dateCol = isDevis ? 'date_devis' : 'date_vente'; const { count } = await supabase.from(table).select('*', {count: 'exact', head:true}).gte(dateCol, startIso); numero_genere = `${prefix}${numDateStr}-${String((count || 0) + 1).padStart(3, '0')}`; }
    const frais_liv_val = isLivraison ? fraisLivraison : 0;
    const detailsObj = { heure: formatDateTime(today), remise_globale_pourcent: safeNum(remiseGlobale), frais_livraison: frais_liv_val, paiement_infos: methodePaiement === 'CHEQUE' ? { banque: banqueCheque, numero: numeroCheque } : null, articles: panier.map(i => ({ nom: i.nom, categorie: i.categorie, qte: safeNum(i.qte), prix_unitaire: safeNum(i.prix_vente), remise_unitaire_ar: safeNum(i.remise_montant), total_ligne: (safeNum(i.prix_vente) - safeNum(i.remise_montant)) * safeNum(i.qte) })) };
    const strArticles = panier.map(i => `${safeNum(i.qte)}x ${i.nom}`).join(', ');
    if (mode === 'devis') { await supabase.from('devis').insert([{ numero_devis: numero_genere, client_nom: selectedClient, articles_liste: strArticles, montant_total: totalNet, total_remise_ar: totalRemisesEnAr, details_json: detailsObj }]); } else { for (let item of panier) { await supabase.rpc('decrement_stock', { row_id: item.id, amount: safeNum(item.qte) }); } const pMethode = mode === 'caisse' ? methodePaiement : 'CASH'; const dbTypeVente = mode === 'caisse' ? 'CAISSE' : mode.replace('admin_', '').toUpperCase(); await supabase.from('historique_ventes').insert([{ numero_facture: numero_genere, type_vente: dbTypeVente, client_nom: selectedClient, articles_liste: strArticles, montant_total: totalNet, benefice_total: beneficeNet, remise_globale_pourcent: safeNum(remiseGlobale), total_remise_ar: totalRemisesEnAr, details_json: detailsObj, methode_paiement: pMethode }]); if (mode === 'admin_credit') { await supabase.from('credits').insert([{ nom_client: selectedClient, montant_du: totalNet, details_articles: strArticles, date_echeance: echeance, numero_facture: numero_genere, details_json: detailsObj }]); } }
    const cData = clients.find(c => c.nom === selectedClient) || { nom: selectedClient, nif: '', stat: '' };
    setVenteReussie({ numero: numero_genere, panier, totalNet, totalRemisesEnAr, fraisLivraison: frais_liv_val, methode: mode === 'caisse' ? methodePaiement : null, banque: banqueCheque, client_nom: cData.nom, client_tel: cData.telephone, client_nif: cData.nif, client_stat: cData.stat, date: today, echeance, printSize });
  };

  const produitsFiltres = produits.filter(p => (p.nom||'').toLowerCase().includes(search.toLowerCase()) && (selectedCat === "" || p.categorie === selectedCat));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
      <div className="bg-white p-4 rounded-3xl shadow-sm border-t-4 border-[#800020] flex flex-col h-[50vh] xl:h-[85vh]">
        <div className="flex flex-col md:flex-row gap-2 mb-4"><input placeholder="🔍 Chercher..." className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#800020] w-full" onChange={e => setSearch(e.target.value)} disabled={venteReussie} autoFocus /><select className="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs font-bold md:w-1/3" value={selectedCat} onChange={e => setSelectedCat(e.target.value)} disabled={venteReussie}><option value="">Toutes Catégories</option>{(categoriesDb||[]).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar">
          {produitsFiltres.map(p => (
            <button key={p.id} onClick={() => ajouter(p)} disabled={venteReussie} className="flex flex-col justify-between p-3 border border-gray-200 rounded-xl text-left bg-white hover:border-[#800020] hover:shadow-md transition group min-h-[85px]">
              {p.image_url ? <img src={p.image_url} alt={p.nom} className="w-full h-16 object-cover rounded-lg mb-2" onError={(e)=>e.target.style.display='none'} /> : null}
              <div className="flex justify-between items-start w-full gap-1 mb-1">
                <div><p className="font-bold text-gray-800 text-[11px] uppercase truncate group-hover:text-[#800020]">{p.nom}</p><p className="text-[8px] text-gray-400 font-bold uppercase">{p.categorie || 'Divers'}</p></div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${safeNum(p.stock_actuel) <= 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-500'}`}>STK: {p.stock_actuel}</span>
              </div>
              <p className="text-red-600 font-black text-sm">{formatAr(p.prix_vente)} Ar</p>
            </button>
          ))}
        </div>
      </div>
      <div className={`p-4 md:p-6 rounded-[2.5rem] shadow-xl flex flex-col justify-between relative overflow-hidden ${mode === 'devis' ? 'bg-white border-4 border-[#800020]' : 'bg-[#800020] text-white'} h-auto xl:h-[85vh]`}>
        {venteReussie && <div className="absolute top-0 left-0 w-full h-2 bg-green-500 animate-pulse"></div>}
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="border-b border-white/20 pb-3 flex justify-between items-center shrink-0"><h3 className={`font-black italic uppercase tracking-widest ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{mode === 'devis' ? 'CRÉATION DEVIS' : mode.replace('admin_', '').replace('_', ' ')}</h3>{(mode === 'caisse' || mode === 'admin_credit') && (<select className="bg-black/20 text-xs p-1.5 rounded outline-none font-bold text-white border border-white/10" value={printSize} onChange={e => setPrintSize(e.target.value)} disabled={venteReussie}>{mode === 'admin_credit' && <option value="A4" className="text-black">Format A4</option>}<option value="58mm" className="text-black">Ticket 58mm</option><option value="80mm" className="text-black">Ticket 80mm</option></select>)}</div>
          {mode === 'caisse' ? (<div className="w-full p-3 rounded-xl font-bold border border-white/20 bg-white/10 text-white shrink-0 cursor-not-allowed opacity-90 text-center uppercase tracking-widest">Vente à consommateur</div>) : (<select className={`w-full p-3 rounded-xl font-bold border outline-none shrink-0 ${mode==='devis' ? 'bg-gray-50 text-gray-800 border-gray-200' : 'bg-white/10 text-white border-white/20'}`} value={selectedClient} onChange={e => setSelectedClient(e.target.value)} disabled={venteReussie}><option value="" className="text-black">⚠️ SÉLECTIONNER CLIENT</option>{clients.map(c => <option key={c.nom} value={c.nom} className="text-black">{c.nom}</option>)}</select>)}
          {mode === 'admin_credit' && (<input type="date" className="w-full bg-white/10 p-3 rounded-xl font-bold border border-white/20 outline-none text-white shrink-0 mt-1" onChange={e => setEcheance(e.target.value)} disabled={venteReussie} />)}
          <div className="space-y-2 overflow-y-auto pr-2 mt-2 custom-scrollbar flex-1">{panier.length === 0 && <p className="text-center italic mt-6 opacity-50">Panier vide</p>}{panier.map((item) => (<div key={item.id} className={`flex flex-col p-3 rounded-xl border-l-4 ${mode === 'devis' ? 'bg-gray-50 border-[#800020]' : 'bg-white/10 border-white'}`}><div className="flex justify-between items-center"><span className="truncate uppercase font-bold text-xs w-1/3">{item.nom} <span className="opacity-50 font-normal ml-1">({item.categorie||'Divers'})</span></span>{!venteReussie ? (<div className="flex items-center gap-2"><button onClick={() => setPanier(panier.map(x => x.id === item.id ? {...x, qte: Math.max(1, safeNum(x.qte)-1)} : x))} className="w-6 h-6 rounded bg-white/20 font-black">-</button><span className="font-black text-sm w-4 text-center">{safeNum(item.qte)}</span><button onClick={() => { const pStock = produits.find(p => p.id === item.id)?.stock_actuel || 0; if (safeNum(item.qte) < safeNum(pStock)) { setPanier(panier.map(x => x.id === item.id ? {...x, qte: safeNum(x.qte)+1} : x)); } else { alert("⚠️ Stock max !"); } }} className="w-6 h-6 rounded bg-white/20 font-black">+</button></div>) : (<span className="font-black opacity-60">Qté: {safeNum(item.qte)}</span>)}<span className="font-black">{formatAr((safeNum(item.prix_vente) - safeNum(item.remise_montant)) * safeNum(item.qte))}</span></div>{!venteReussie && (<div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2"><span className="text-[9px] uppercase font-bold opacity-60">Remise / pièce (Ar):</span><input type="number" min="0" className="w-20 p-1 text-right text-xs bg-black/20 rounded outline-none text-white placeholder-white/30" value={item.remise_montant !== undefined ? item.remise_montant : ''} onChange={e => updateRemiseArticle(item.id, e.target.value)} placeholder="0" /></div>)}</div>))}</div>
        </div>
        <div className={`pt-4 border-t shrink-0 ${mode==='devis' ? 'border-gray-200' : 'border-white/20'}`}>
          {!venteReussie && mode === 'caisse' && panier.length > 0 && (<div className="flex flex-col gap-2 mb-3 bg-black/20 p-2 rounded-xl"><div className="grid grid-cols-2 md:flex gap-2"><button onClick={()=>setMethodePaiement('CASH')} className={`flex-1 py-2 rounded-lg font-black text-[10px] transition ${methodePaiement==='CASH'?'bg-blue-600 text-white shadow':'text-white/50 hover:text-white border border-white/20'}`}>💵 CASH</button><button onClick={()=>setMethodePaiement('MVOLA')} className={`flex-1 py-2 rounded-lg font-black text-[10px] transition ${methodePaiement==='MVOLA'?'bg-green-600 text-white shadow':'text-white/50 hover:text-white border border-white/20'}`}>🟢 MVOLA</button><button onClick={()=>setMethodePaiement('ORANGE MONEY')} className={`flex-1 py-2 rounded-lg font-black text-[10px] transition ${methodePaiement==='ORANGE MONEY'?'bg-orange-500 text-white shadow':'text-white/50 hover:text-white border border-white/20'}`}>🟠 ORANGE</button><button onClick={()=>setMethodePaiement('CHEQUE')} className={`flex-1 py-2 rounded-lg font-black text-[10px] transition ${methodePaiement==='CHEQUE'?'bg-pink-500 text-white shadow':'text-white/50 hover:text-white border border-white/20'}`}>✍️ CHÈQUE</button></div>{methodePaiement === 'CHEQUE' && (<div className="flex gap-2 mt-1"><select className="flex-1 p-2 rounded text-black text-xs font-bold outline-none" value={banqueCheque} onChange={e=>setBanqueCheque(e.target.value)}><option value="">Sél. Banque...</option><option value="BOA">BOA</option><option value="BMOI">BMOI</option><option value="BRED">BRED</option><option value="BNI">BNI</option></select><input placeholder="N° Chèque (Opt.)" className="flex-1 p-2 rounded text-black text-xs outline-none" value={numeroCheque} onChange={e=>setNumeroCheque(e.target.value)} /></div>)}</div>)}
          {!venteReussie && panier.length > 0 && (<><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold uppercase opacity-70">Remise Globale (%) :</span><input type="number" min="0" className="w-16 p-1 text-center text-sm font-black text-black rounded outline-none" value={remiseGlobale !== undefined ? remiseGlobale : ''} onChange={e => setRemiseGlobale(e.target.value)} placeholder="0" /></div><div className="flex justify-between items-center mb-3"><label className="text-xs font-bold uppercase opacity-70 flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4" checked={isLivraison} onChange={e => setIsLivraison(e.target.checked)} />Facturez livraison ?</label>{isLivraison && (<select className="w-24 p-1 text-center text-sm font-black text-black rounded outline-none" value={fraisLivraison} onChange={e => setFraisLivraison(Number(e.target.value))}><option value={0}>0 Ar</option>{[1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000].map(v => <option key={v} value={v}>{formatAr(v)}</option>)}</select>)}</div></>)}
          <div className="flex flex-col gap-1 mb-4 border-t border-white/20 pt-2"><div className="flex justify-between items-center"><span className="font-bold uppercase text-[10px] opacity-70">Total Articles (Magasin)</span><span className="font-bold text-sm">{formatAr(totalNet)} Ar</span></div>{isLivraison && fraisLivraison > 0 && !venteReussie && (<div className="flex justify-between items-center"><span className="font-bold uppercase text-[10px] text-orange-300">Frais Livraison</span><span className="font-bold text-sm text-orange-300">+{formatAr(fraisLivraison)} Ar</span></div>)}<div className="flex justify-between items-end mt-2"><span className="font-bold uppercase text-[10px] opacity-70">NET À PAYER</span><span className={`text-3xl font-black tracking-tighter ${mode==='devis' ? 'text-[#800020]' : 'text-white'}`}>{formatAr(totalAPayerClient)} Ar</span></div></div>
          {!venteReussie ? (<button onClick={valider} className={`w-full p-4 rounded-xl font-black uppercase text-sm shadow-lg transition ${mode === 'devis' ? 'bg-[#800020] text-white hover:bg-[#5a0016]' : 'bg-white text-[#800020] hover:bg-gray-200'}`}>{mode === 'devis' ? 'Générer Devis' : 'Valider ('+methodePaiement+')'}</button>) : (<div className="flex flex-col md:flex-row gap-2"><button onClick={() => lancerImpression(mode, venteReussie, params)} className="flex-1 p-3 rounded-xl font-black uppercase bg-green-600 text-white shadow-lg hover:bg-green-700">🖨️ Imprimer</button><button onClick={() => {setPanier([]); setVenteReussie(null); setRemiseGlobale(""); setSelectedClient(mode==='caisse' ? "Vente à consommateur" : ""); setMethodePaiement("CASH"); setBanqueCheque(""); setNumeroCheque(""); setIsLivraison(false); setFraisLivraison(1000);}} className="flex-1 p-3 rounded-xl font-bold uppercase border border-white/50 text-white hover:bg-white/10">Nouveau</button></div>)}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const now = new Date(); const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const [dateDebut, setDateDebut] = useState(startOfMonth); const [dateFin, setDateFin] = useState(endOfMonth);
  const [ventes, setVentes] = useState([]); const [depenses, setDepenses] = useState([]); const [produits, setProduits] = useState([]); const [credits, setCredits] = useState([]);
  
  useEffect(() => { 
    const load = async () => { setProduits((await supabase.from('produits').select('*')).data || []); setCredits((await supabase.from('credits').select('*').eq('statut', 'non_paye')).data || []); let qV = supabase.from('historique_ventes').select('*'); if (dateDebut) qV = qV.gte('date_vente', `${dateDebut}T00:00:00`); if (dateFin) qV = qV.lte('date_vente', `${dateFin}T23:59:59`); setVentes((await qV).data || []); let qD = supabase.from('depenses').select('*'); if (dateDebut) qD = qD.gte('date_depense', dateDebut); if (dateFin) qD = qD.lte('date_depense', dateFin); setDepenses((await qD).data || []); }; load(); 
  }, [dateDebut, dateFin]);
  
  const caPeriode = ventes.reduce((acc, v) => acc + safeNum(v.montant_total), 0); const depPeriode = depenses.reduce((acc, d) => acc + safeNum(d.montant), 0); const benBrutPeriode = ventes.reduce((acc, v) => acc + safeNum(v.benefice_total||0), 0); const valeurStock = produits.reduce((acc, p) => acc + (safeNum(p.stock_actuel) * safeNum(p.prix_achat)), 0); const totalDettes = credits.reduce((acc, c) => acc + safeNum(c.montant_du), 0);
  const cashP = ventes.filter(v => v.methode_paiement === 'CASH' || !v.methode_paiement).reduce((acc, v) => acc + safeNum(v.montant_total), 0); const mvolaP = ventes.filter(v => v.methode_paiement === 'MVOLA').reduce((acc, v) => acc + safeNum(v.montant_total), 0); const omP = ventes.filter(v => v.methode_paiement === 'ORANGE MONEY').reduce((acc, v) => acc + safeNum(v.montant_total), 0); const chequeP = ventes.filter(v => v.methode_paiement === 'CHEQUE').reduce((acc, v) => acc + safeNum(v.montant_total), 0);
  let counts = {}; ventes.forEach(v => { if (v.details_json && Array.isArray(v.details_json.articles)) { v.details_json.articles.forEach(art => { counts[art.nom] = (counts[art.nom] || 0) + safeNum(art.qte); }); } });
  const topProducts = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nom, qte]) => { const pInfo = produits.find(p => p.nom === nom); return { nom, qte, fournisseur: pInfo ? pInfo.fournisseur_nom : 'Inconnu' }; });
  let countFournisseurs = {}; topProducts.forEach(p => { countFournisseurs[p.fournisseur] = (countFournisseurs[p.fournisseur] || 0) + p.qte; }); const topFournisseurs = Object.entries(countFournisseurs).sort((a,b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-gray-200 pb-4 gap-4"><h2 className="text-2xl font-black uppercase text-[#800020]">Tableau de Bord Stratégique</h2><div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm"><span className="text-[10px] font-bold text-gray-500 uppercase ml-2">Du :</span><input type="date" className="p-2 bg-gray-50 rounded outline-none text-xs font-bold" value={dateDebut} onChange={e=>setDateDebut(e.target.value)} /><span className="text-[10px] font-bold text-gray-500 uppercase">Au :</span><input type="date" className="p-2 bg-gray-50 rounded outline-none text-xs font-bold" value={dateFin} onChange={e=>setDateFin(e.target.value)} /></div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-[#800020]"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chiffre d'Affaires Période</p><p className="text-2xl font-black text-[#800020] mt-1">{formatAr(caPeriode)} Ar</p></div><div className="bg-gray-50 p-5 rounded-2xl shadow-sm border-l-4 border-gray-300"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Marge Brute (Bénéfice)</p><p className="text-2xl font-black text-gray-700 mt-1">{formatAr(benBrutPeriode)} Ar</p></div><div className="bg-red-50 p-5 rounded-2xl shadow-sm border-l-4 border-red-500"><p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Charges (Dépenses)</p><p className="text-2xl font-black text-red-700 mt-1">-{formatAr(depPeriode)} Ar</p></div></div>
      <div className="bg-green-700 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><p className="text-xs font-bold text-green-200 uppercase tracking-widest mb-1">Bénéfice Net Réel de la période</p><p className="text-[10px] opacity-70">Marge Brute - Charges</p></div><p className="text-4xl md:text-5xl font-black tracking-tighter">{formatAr(benBrutPeriode - depPeriode)} Ar</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col"><h3 className="font-black text-gray-800 uppercase text-xs mb-4">Répartition Paiements</h3><div className="space-y-3 flex-1 justify-center flex flex-col"><div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-500">💵 Cash</span><span className="font-black text-sm">{formatAr(cashP)} Ar</span></div><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: caPeriode>0 ? `${(cashP/caPeriode)*100}%` : '0%'}}></div></div><div className="flex justify-between items-center mt-1"><span className="text-xs font-bold text-gray-500">🟢 MVola</span><span className="font-black text-sm">{formatAr(mvolaP)} Ar</span></div><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{width: caPeriode>0 ? `${(mvolaP/caPeriode)*100}%` : '0%'}}></div></div><div className="flex justify-between items-center mt-1"><span className="text-xs font-bold text-gray-500">🟠 Orange</span><span className="font-black text-sm">{formatAr(omP)} Ar</span></div><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{width: caPeriode>0 ? `${(omP/caPeriode)*100}%` : '0%'}}></div></div><div className="flex justify-between items-center mt-1"><span className="text-xs font-bold text-gray-500">✍️ Chèques</span><span className="font-black text-sm">{formatAr(chequeP)} Ar</span></div><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-pink-500 h-1.5 rounded-full" style={{width: caPeriode>0 ? `${(chequeP/caPeriode)*100}%` : '0%'}}></div></div></div></div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col"><h3 className="font-black text-gray-800 uppercase text-xs mb-4">🏆 Top 5 Produits (Qté)</h3><div className="space-y-2">{topProducts.map((p, idx) => (<div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-xs font-bold uppercase truncate pr-2"><span className="text-[#800020] mr-1">#{idx+1}</span>{p.nom}</span><span className="font-black text-sm bg-white px-2 py-0.5 rounded shadow-sm">{p.qte}</span></div>))}{topProducts.length === 0 && <p className="text-[10px] text-gray-400 italic text-center">Aucune donnée</p>}</div></div>
        <div className="flex flex-col gap-4"><div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-1"><h3 className="font-black text-gray-800 uppercase text-[10px] mb-3">🚚 Top Fournisseurs de la période</h3><div className="space-y-2">{topFournisseurs.map((f, idx) => (<div key={idx} className="flex justify-between text-xs"><span className="font-bold text-gray-600">{f[0]}</span><span className="font-black text-[#800020]">{f[1]} pts</span></div>))}{topFournisseurs.length === 0 && <p className="text-[10px] text-gray-400 italic">Aucune donnée</p>}</div></div><div className="flex gap-4"><div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 text-center flex flex-col justify-center"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valeur Stock</p><p className="text-xl font-black text-gray-800">{formatAr(valeurStock)}</p></div><div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100 flex-1 text-center flex flex-col justify-center"><p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1">Créances Clients</p><p className="text-xl font-black text-red-700">{formatAr(totalDettes)}</p></div></div></div>
      </div>
    </div>
  );
};
const AdminStock = ({ categoriesDb, refreshCategories }) => { 
  const [produits, setProduits] = useState([]); const [fours, setFours] = useState([]); const [historique, setHistorique] = useState([]);
  const [selectedCatFilter, setSelectedCatFilter] = useState(""); const [searchStock, setSearchStock] = useState(""); const [sortConfig, setSortConfig] = useState({ key: 'nom', direction: 'asc' });
  const [form, setForm] = useState({ nom: '', prix_a: '', prix_v: '', marge: '', stock: '', fournisseur: '', categorie: 'Divers', dlc: '', image_file: null }); 
  const [reapproProd, setReapproProd] = useState(null); const [reapproForm, setReapproForm] = useState({ qte: '', prix_a: '', prix_v: '', marge: '', dlc: '' }); const [showHistoProd, setShowHistoProd] = useState(null); 
  const [editProd, setEditProd] = useState(null); const [editForm, setEditForm] = useState({ nom: '', prix_v: '', marge: '', pwd: '', image_file: null });
  const [deleteProd, setDeleteProd] = useState(null); const [deletePwd, setDeletePwd] = useState(""); const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => { const p = await supabase.from('produits').select('*').order('nom'); const f = await supabase.from('fournisseurs').select('nom'); const h = await supabase.from('historique_stock').select('*').order('date_ajout', { ascending: false }); setProduits(p.data || []); setFours(f.data || []); setHistorique(h.data || []); };
  useEffect(() => { load(); }, []);

  const uploadImage = async (file) => {
    if (!file) return null;
    if (file.size > 200 * 1024) { alert("⚠️ L'image dépasse 200 Ko."); return 'TOO_BIG'; }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
    const { error: errUp } = await supabase.storage.from('produits_images').upload(fileName, file);
    if (errUp) { alert("Erreur envoi image : " + errUp.message); return null; }
    const { data } = supabase.storage.from('produits_images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const saveNouveau = async (e) => { 
    e.preventDefault(); if(isSubmitting) return; setIsSubmitting(true);
    if(!form.fournisseur) { alert("Fournisseur obligatoire"); setIsSubmitting(false); return; }
    const ex = produits.find(p => p.nom.toLowerCase() === form.nom.trim().toLowerCase());
    if(ex) { alert("⚠️ Ce produit existe déjà !"); setIsSubmitting(false); return; }
    
    let imageUrl = null;
    if (form.image_file) {
      imageUrl = await uploadImage(form.image_file);
      if (imageUrl === 'TOO_BIG') { setIsSubmitting(false); return; }
    }

    await supabase.from('produits').insert([{ nom: form.nom.trim(), prix_achat: safeNum(form.prix_a), prix_vente: safeNum(form.prix_v), marge_pourcent: safeNum(form.marge), stock_actuel: safeNum(form.stock), fournisseur_nom: form.fournisseur, categorie: form.categorie, date_peremption: form.dlc || null, image_url: imageUrl }]); 
    await supabase.from('historique_stock').insert([{ produit_nom: form.nom.trim(), quantite: safeNum(form.stock), prix_achat: safeNum(form.prix_a) }]); 
    setForm({ nom:'', prix_a:'', prix_v:'', marge:'', stock:'', fournisseur:'', categorie: 'Divers', dlc: '', image_file: null }); load(); setIsSubmitting(false); alert("Produit ajouté avec succès !");
  };
  
  const addCategory = async () => { const newCat = prompt("Nouvelle catégorie :"); if(newCat) { await supabase.from('categories').insert([{ nom: newCat }]); await refreshCategories(); setForm({...form, categorie: newCat}); } };

  const handleAchat = (val) => { const pa = safeNum(val)||0; const pv = safeNum(form.prix_v)||0; let m = form.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setForm(prev => ({...prev, prix_a: val, marge: m})); };
  const handleVente = (val) => { const pv = safeNum(val)||0; const pa = safeNum(form.prix_a)||0; let m = form.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setForm(prev => ({...prev, prix_v: val, marge: m})); };
  const handleMarge = (val) => { const m = safeNum(val)||0; const pa = safeNum(form.prix_a)||0; let pv = form.prix_v; if(pa>0) pv = Math.round(pa*(1+(m/100))); setForm(prev => ({...prev, marge: val, prix_v: pv})); };

  const saveReappro = async (e) => { e.preventDefault(); await supabase.from('produits').update({ stock_actuel: reapproProd.stock_actuel + safeNum(reapproForm.qte), prix_achat: safeNum(reapproForm.prix_a), prix_vente: safeNum(reapproForm.prix_v), marge_pourcent: safeNum(reapproForm.marge), date_peremption: reapproForm.dlc || reapproProd.date_peremption }).eq('id', reapproProd.id); await supabase.from('historique_stock').insert([{ produit_nom: reapproProd.nom, quantite: safeNum(reapproForm.qte), prix_achat: safeNum(reapproForm.prix_a) }]); setReapproProd(null); load(); };
  const handleRAchat = (val) => { const pa = safeNum(val)||0; const pv = safeNum(reapproForm.prix_v)||0; let m = reapproForm.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setReapproForm(prev => ({...prev, prix_a: val, marge: m})); };
  const handleRVente = (val) => { const pv = safeNum(val)||0; const pa = safeNum(reapproForm.prix_a)||0; let m = reapproForm.marge; if(pa>0 && pv>0) m = (((pv-pa)/pa)*100).toFixed(2); setReapproForm(prev => ({...prev, prix_v: val, marge: m})); };
  const handleRMarge = (val) => { const m = safeNum(val)||0; const pa = safeNum(reapproForm.prix_a)||0; let pv = reapproForm.prix_v; if(pa>0) pv = Math.round(pa*(1+(m/100))); setReapproForm(prev => ({...prev, marge: val, prix_v: pv})); };

  const handleEditVente = (val) => { const pv = safeNum(val) || 0; const pa = safeNum(editProd.prix_achat) || 0; let m = editForm.marge; if (pa > 0 && pv > 0) m = (((pv - pa) / pa) * 100).toFixed(2); setEditForm(prev => ({ ...prev, prix_v: val, marge: m })); };
  const handleEditMarge = (val) => { const m = safeNum(val) || 0; const pa = safeNum(editProd.prix_achat) || 0; let pv = editForm.prix_v; if (pa > 0) pv = Math.round(pa * (1 + (m / 100))); setEditForm(prev => ({ ...prev, marge: val, prix_v: pv })); };
  
  const saveEdit = async (e) => { 
    e.preventDefault(); 
    if(isSubmitting) return; setIsSubmitting(true);
    const { data: admins } = await supabase.from('utilisateurs').select('*').eq('role', 'superadmin').eq('mot_de_passe', editForm.pwd);
    if (!admins || admins.length === 0) { alert("⚠️ Code Superadmin incorrect !"); setIsSubmitting(false); return; }
    
    let imageUrl = editProd.image_url;
    if (editForm.image_file) {
      const newUrl = await uploadImage(editForm.image_file);
      if (newUrl === 'TOO_BIG') { setIsSubmitting(false); return; }
      if (newUrl) imageUrl = newUrl;
    }

    const oldName = editProd.nom; const newName = editForm.nom;
    await supabase.from('produits').update({ nom: newName, prix_vente: safeNum(editForm.prix_v), marge_pourcent: safeNum(editForm.marge), image_url: imageUrl }).eq('id', editProd.id); 
    if (oldName !== newName) { await supabase.from('historique_stock').update({ produit_nom: newName }).eq('produit_nom', oldName); }
    setEditProd(null); load(); setIsSubmitting(false); alert("Produit modifié avec succès !"); 
  };

  const executerSuppressionProd = async (e) => {
    e.preventDefault();
    const { data: admins } = await supabase.from('utilisateurs').select('*').eq('role', 'superadmin').eq('mot_de_passe', deletePwd);
    if (!admins || admins.length === 0) return alert("⚠️ Code Superadmin incorrect !");
    await supabase.from('produits').delete().eq('id', deleteProd.id);
    setDeleteProd(null); setDeletePwd(""); load(); alert("Produit supprimé !");
  };

  const isDlcProche = (dlc) => { if(!dlc) return false; const diff = (new Date(dlc) - new Date()) / (1000 * 3600 * 24); return diff <= 10; };
  const requestSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const getSortIcon = (key) => { if (sortConfig.key !== key) return '↕️'; return sortConfig.direction === 'asc' ? '🔽' : '🔼'; };

  let produitsAffiches = produits.filter(p => (selectedCatFilter === "" || p.categorie === selectedCatFilter) && (p.nom || '').toLowerCase().includes(searchStock.toLowerCase()) );
  produitsAffiches.sort((a, b) => { let valA = a[sortConfig.key]; let valB = b[sortConfig.key]; if (['prix_achat', 'prix_vente', 'stock_actuel'].includes(sortConfig.key)) { valA = safeNum(valA); valB = safeNum(valB); } else if (sortConfig.key === 'date_peremption') { valA = valA ? new Date(valA).getTime() : 9999999999999; valB = valB ? new Date(valB).getTime() : 9999999999999; } else { valA = (valA||'').toLowerCase(); valB = (valB||'').toLowerCase(); } if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0; });

  return (
    <div className="space-y-8 relative">
      <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border-t-4 border-[#800020]">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Nouvelle référence</h2>
        <form onSubmit={saveNouveau} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Article</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required disabled={isSubmitting}/></div>
          <div><label className="text-[10px] font-bold text-[#800020] uppercase flex justify-between">Catégorie <button type="button" onClick={addCategory} className="text-[#800020] font-black">+ Nouveau</button></label><select className="w-full p-3 bg-gray-50 border border-[#800020]/30 rounded-xl outline-none font-bold text-[#800020]" value={form.categorie} onChange={e=>setForm({...form, categorie: e.target.value})} disabled={isSubmitting}>{(categoriesDb||[]).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Coût Achat</label><input type="number" className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none" value={form.prix_a} onChange={e=>handleAchat(e.target.value)} required disabled={isSubmitting}/></div>
          <div><label className="text-[10px] font-bold text-[#800020] uppercase">Marge (%)</label><input type="number" step="0.01" className="w-full p-3 bg-[#800020]/10 border border-[#800020]/30 rounded-xl font-black text-[#800020] outline-none" value={form.marge} onChange={e=>handleMarge(e.target.value)} disabled={isSubmitting}/></div>
          <div><label className="text-[10px] font-bold text-red-600 uppercase">Prix Vente</label><input type="number" className="w-full p-3 bg-red-50 border border-red-200 rounded-xl font-black text-red-600 outline-none" value={form.prix_v} onChange={e=>handleVente(e.target.value)} required disabled={isSubmitting}/></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Stock Initial</label><input type="number" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required disabled={isSubmitting}/></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Date Péremption (Optionnel)</label><input type="date" className="w-full p-3 bg-gray-50 border rounded-xl outline-none text-xs" value={form.dlc} onChange={e=>setForm({...form, dlc: e.target.value})} disabled={isSubmitting}/></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Fournisseur</label><select className="w-full p-3 bg-gray-50 border rounded-xl outline-none text-sm" value={form.fournisseur} onChange={e=>setForm({...form, fournisseur: e.target.value})} required disabled={isSubmitting}><option value="">Sélectionner</option>{fours.map(f=><option key={f.nom} value={f.nom}>{f.nom}</option>)}</select></div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Photo (Max 200Ko) - Optionnel</label>
            <input type="file" accept="image/*" className="w-full p-2 bg-gray-50 border rounded-xl text-xs" onChange={e=>setForm({...form, image_file: e.target.files[0]})} disabled={isSubmitting}/>
          </div>
          <button className="w-full bg-[#800020] text-white p-3 rounded-xl font-black uppercase shadow-md md:col-span-2 mt-4" disabled={isSubmitting}>{isSubmitting ? 'Ajout...' : 'Ajouter au Stock'}</button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"><h3 className="font-black text-[#800020] uppercase">Inventaire Global</h3><div className="flex w-full md:w-auto gap-2"><input type="text" placeholder="🔍 Rechercher un produit..." className="p-2 border rounded-lg text-xs outline-none flex-1 md:w-48" value={searchStock} onChange={e=>setSearchStock(e.target.value)} /><select className="p-2 border rounded-lg text-xs font-bold outline-none" value={selectedCatFilter} onChange={e=>setSelectedCatFilter(e.target.value)}><option value="">Toutes Catégories</option>{(categoriesDb||[]).map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm min-w-[900px]"><thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]"><tr><th className="p-4 cursor-pointer hover:bg-gray-200 transition" onClick={() => requestSort('nom')}>Article {getSortIcon('nom')}</th><th className="p-4 cursor-pointer hover:bg-gray-200 transition" onClick={() => requestSort('prix_achat')}>Achat {getSortIcon('prix_achat')}</th><th className="p-4 cursor-pointer hover:bg-gray-200 transition" onClick={() => requestSort('prix_vente')}>Vente {getSortIcon('prix_vente')}</th><th className="p-4 text-center cursor-pointer hover:bg-gray-200 transition" onClick={() => requestSort('stock_actuel')}>Stock {getSortIcon('stock_actuel')}</th><th className="p-4 text-center cursor-pointer hover:bg-gray-200 transition" onClick={() => requestSort('date_peremption')}>Péremption {getSortIcon('date_peremption')}</th><th className="p-4 text-center">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{produitsAffiches.map(p => (<tr key={p.id} className="hover:bg-gray-50 transition"><td className="p-4 flex items-center gap-3">{p.image_url ? <img src={p.image_url} alt="img" className="w-8 h-8 object-cover rounded shadow-sm border border-gray-200" onError={(e)=>e.target.outerHTML="<div class='w-8 h-8 bg-red-100 flex items-center justify-center rounded text-[8px]'>Err</div>"} /> : <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-[8px] text-gray-400">Pas d'img</div>}<div><p className="font-bold uppercase text-gray-800">{p.nom}</p><p className="text-[9px] text-gray-400 uppercase font-bold">{p.categorie || 'DIVERS'}</p></div></td><td className="p-4 text-gray-500">{formatAr(p.prix_achat)}</td><td className="p-4 font-black text-red-600">{formatAr(p.prix_vente)}</td><td className="p-4 text-center"><span className={`px-2 py-1 rounded font-black text-[10px] text-white ${safeNum(p.stock_actuel)<=5?'bg-red-600 animate-pulse':'bg-green-600'}`}>{p.stock_actuel}</span></td><td className="p-4 text-center text-xs font-bold">{p.date_peremption ? (<span className={`${isDlcProche(p.date_peremption) ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-gray-500'}`}>{formatDate(p.date_peremption)}</span>) : '-'}</td><td className="p-4 text-center flex justify-center gap-1"><button onClick={() => { setEditProd(p); setEditForm({ nom: p.nom, prix_v: p.prix_vente, marge: p.marge_pourcent, pwd: '', image_file: null }); }} className="bg-blue-600 text-white px-2 py-1 rounded shadow text-[9px] font-bold uppercase">✏️ Modifier</button><button onClick={() => { setReapproProd(p); setReapproForm({ qte: '', prix_a: p.prix_achat, prix_v: p.prix_vente, marge: p.marge_pourcent, dlc: p.date_peremption || '' }); }} className="bg-[#800020] text-white px-2 py-1 rounded shadow text-[9px] font-bold uppercase">Réappro</button><button onClick={() => setShowHistoProd(p)} className="bg-gray-200 px-2 py-1 rounded shadow text-[9px] font-bold uppercase">Histo</button><button onClick={() => setDeleteProd(p)} className="bg-red-600 text-white px-2 py-1 rounded shadow text-[9px] font-bold uppercase">🗑️ Suppr</button></td></tr>))}{produitsAffiches.length === 0 && (<tr><td colSpan="6" className="text-center p-8 text-gray-400 italic">Aucun produit trouvé.</td></tr>)}</tbody></table></div>
      </div>

      {editProd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md">
            <h2 className="text-lg font-black uppercase text-[#800020] mb-4">Modifier : {editProd.nom}</h2>
            <form onSubmit={saveEdit} className="space-y-3">
              <div><label className="text-[10px] font-bold text-gray-400 uppercase">Nom du Produit</label><input className="w-full p-3 border rounded-xl font-bold outline-none" value={editForm.nom} onChange={e=>setEditForm({...editForm, nom: e.target.value})} required disabled={isSubmitting}/></div>
              <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] font-bold text-red-600 uppercase">Prix Vente</label><input type="number" className="w-full p-3 border rounded-xl text-red-600 font-bold outline-none" value={editForm.prix_v} onChange={e=>handleEditVente(e.target.value)} required disabled={isSubmitting}/></div><div className="flex-1"><label className="text-[10px] font-bold text-[#800020] uppercase">Marge (%)</label><input type="number" step="0.01" className="w-full p-3 border rounded-xl text-[#800020] font-bold outline-none" value={editForm.marge} onChange={e=>handleEditMarge(e.target.value)} disabled={isSubmitting}/></div></div>
              <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Remplacer l'image (Max 200Ko)</label>
                 {editProd.image_url && <img src={editProd.image_url} alt="actuelle" className="h-10 mb-2 rounded object-cover" />}
                 <input type="file" accept="image/*" className="w-full p-2 border rounded-xl text-xs" onChange={e=>setEditForm({...editForm, image_file: e.target.files[0]})} disabled={isSubmitting}/>
              </div>
              <div className="pt-2 border-t"><label className="text-[10px] font-bold text-gray-400 uppercase">Code Superadmin</label><input type="password" placeholder="Mot de passe requis" className="w-full p-3 border rounded-xl font-bold outline-none text-center" value={editForm.pwd} onChange={e=>setEditForm({...editForm, pwd: e.target.value})} required disabled={isSubmitting}/></div>
              <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setEditProd(null)} className="p-3 bg-gray-100 rounded-xl flex-1 font-bold text-gray-600" disabled={isSubmitting}>Annuler</button><button type="submit" className="p-3 bg-blue-600 text-white rounded-xl font-bold flex-1 shadow-md" disabled={isSubmitting}>{isSubmitting ? '...' : 'Enregistrer'}</button></div>
            </form>
          </div>
        </div>
      )}

      {reapproProd && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"><div className="bg-white p-6 rounded-3xl w-full max-w-md"><h2 className="text-lg font-black uppercase text-[#800020] mb-4">Réappro : {reapproProd.nom}</h2><form onSubmit={saveReappro} className="space-y-3"><input type="number" placeholder="Qté" className="w-full p-3 border rounded-xl" value={reapproForm.qte} onChange={e=>setReapproForm({...reapproForm, qte: e.target.value})} required /><input type="number" placeholder="Nouv. Prix Achat" className="w-full p-3 border rounded-xl" value={reapproForm.prix_a} onChange={e=>handleRAchat(e.target.value)} required /><div className="flex gap-2"><input type="number" className="w-full p-3 border rounded-xl text-red-600 font-bold" value={reapproForm.prix_v} onChange={e=>handleRVente(e.target.value)} required /><input type="number" className="w-full p-3 border rounded-xl text-[#800020] font-bold" value={reapproForm.marge} onChange={e=>handleRMarge(e.target.value)} /></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Nouvelle Date Péremption (Optionnel)</label><input type="date" className="w-full p-3 border rounded-xl" value={reapproForm.dlc} onChange={e=>setReapproForm({...reapproForm, dlc: e.target.value})} /></div><div className="flex gap-2 pt-2"><button type="button" onClick={()=>setReapproProd(null)} className="p-3 bg-gray-100 rounded-xl flex-1">Annuler</button><button type="submit" className="p-3 bg-[#800020] text-white rounded-xl font-bold flex-1">Valider</button></div></form></div></div>)}
      {showHistoProd && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"><div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl"><div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-black uppercase text-[#800020]">Historique d'Achat</h2><button onClick={() => setShowHistoProd(null)} className="text-gray-400 font-black text-xl">×</button></div><p className="text-gray-800 font-black mb-4 text-sm">{showHistoProd.nom}</p><div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">{historique.filter(h => h.produit_nom === showHistoProd.nom).map(h => (<div key={h.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center"><div><p className="font-bold text-gray-800 text-xs">+{h.quantite} pièces</p><p className="text-[10px] text-gray-500 uppercase">{formatDate(h.date_ajout)}</p></div><p className="font-black text-red-600 text-sm">{formatAr(h.prix_achat)} Ar</p></div>))}{historique.filter(h => h.produit_nom === showHistoProd.nom).length === 0 && <p className="text-center text-gray-400 italic text-xs">Aucun historique</p>}</div></div></div>)}
      {deleteProd && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[90]"><div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-t-8 border-red-600 text-center"><div className="text-4xl mb-4">⚠️</div><h3 className="font-black text-red-600 text-lg uppercase mb-2">Supprimer ce produit ?</h3><p className="text-xs text-gray-500 mb-6">Action définitive. <strong>{deleteProd.nom}</strong> disparaîtra du stock.</p><form onSubmit={executerSuppressionProd} className="space-y-4"><div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Code Superadmin requis</label><input type="password" placeholder="Mot de passe direction" className="w-full p-3 bg-gray-50 border rounded-xl outline-none text-center font-bold" value={deletePwd} onChange={e=>setDeletePwd(e.target.value)} required /></div><div className="flex gap-2"><button type="button" onClick={() => {setDeleteProd(null); setDeletePwd("");}} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-xl font-bold text-xs transition">Annuler</button><button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-black uppercase text-xs shadow-md transition">Supprimer</button></div></form></div></div>)}
    </div>
  );
};

const ModuleHistorique = ({ params }) => {
  const [ventes, setVentes] = useState([]); 
  const [dateFiltre, setDateFiltre] = useState("");
  const [searchHisto, setSearchHisto] = useState("");
  const [detailModal, setDetailModal] = useState(null);
  
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelPwd, setCancelPwd] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  
  const load = async () => { let q = supabase.from('historique_ventes').select('*').order('date_vente', { ascending: false }); if (dateFiltre) q = q.gte('date_vente', `${dateFiltre}T00:00:00`).lte('date_vente', `${dateFiltre}T23:59:59`); const { data } = await q; setVentes(data || []); }; 
  useEffect(() => { load(); }, [dateFiltre]);

  const reImprimer = (v) => { const type = v.type_vente === 'CAISSE' ? 'caisse' : (v.type_vente === 'FACTURE' ? 'facture_a4' : 'admin_credit'); const dataPrint = { numero: v.numero_facture, methode: v.methode_paiement, banque: v.details_json?.paiement_infos?.banque, client_nom: v.client_nom, date: v.date_vente, totalNet: v.montant_total, totalRemisesEnAr: v.total_remise_ar, panier: v.details_json?.articles || [], fraisLivraison: safeNum(v.details_json?.frais_livraison), printSize: '58mm' }; lancerImpression(type, dataPrint, params); };
  const imprimerPDF = (v) => { const dataPrint = { numero: v.numero_facture, methode: v.methode_paiement, banque: v.details_json?.paiement_infos?.banque, client_nom: v.client_nom, date: v.date_vente, totalNet: v.montant_total, totalRemisesEnAr: v.total_remise_ar, panier: v.details_json?.articles || [], fraisLivraison: safeNum(v.details_json?.frais_livraison), printSize: 'A4' }; lancerImpression('facture_a4', dataPrint, params); };

  const executerAnnulation = async (e) => { e.preventDefault(); if(isCancelling) return; setIsCancelling(true); const { data: admins } = await supabase.from('utilisateurs').select('*').eq('role', 'superadmin').eq('mot_de_passe', cancelPwd); if (!admins || admins.length === 0) { alert("⚠️ Code Superadmin incorrect !"); setIsCancelling(false); return; } if (cancelModal.details_json && cancelModal.details_json.articles) { for (let art of cancelModal.details_json.articles) { const { data: pData } = await supabase.from('produits').select('stock_actuel').eq('nom', art.nom).single(); if (pData) { await supabase.from('produits').update({ stock_actuel: safeNum(pData.stock_actuel) + safeNum(art.qte) }).eq('nom', art.nom); } } } await supabase.from('historique_ventes').delete().eq('id', cancelModal.id); alert("✅ Vente annulée avec succès. Le stock a été restauré."); setCancelModal(null); setCancelPwd(""); setIsCancelling(false); load(); };

  const BadgePaiement = ({ methode }) => { if(methode === 'MVOLA') return <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded">🟢 MVOLA</span>; if(methode === 'ORANGE MONEY') return <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded">🟠 ORANGE M.</span>; if(methode === 'CHEQUE') return <span className="bg-pink-100 text-pink-700 text-[9px] font-black px-2 py-0.5 rounded">✍️ CHÈQUE</span>; return <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded">💵 CASH</span>; };

  const ventesAffiches = ventes.filter(v => {
    if(!searchHisto) return true;
    const term = searchHisto.toLowerCase();
    return (v.client_nom||'').toLowerCase().includes(term) || (v.numero_facture||'').toLowerCase().includes(term) || (v.articles_liste||'').toLowerCase().includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#800020] pb-2 gap-2">
        <h2 className="text-2xl font-black uppercase text-[#800020]">Historique Global</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <input type="text" placeholder="🔍 Client, Produit, N°..." className="p-2 bg-white border rounded-xl font-bold text-xs flex-1 md:w-48 outline-none" value={searchHisto} onChange={e => setSearchHisto(e.target.value)} />
          <input type="date" className="p-2 bg-white border rounded-xl font-bold text-xs" onChange={e => setDateFiltre(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-3">{ventesAffiches.map(v => (<div key={v.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-3"><div className="flex-1 w-full cursor-pointer" onClick={() => setDetailModal(v)}><div className="flex items-center gap-2 mb-1">{v.numero_facture && <span className="font-black text-gray-800 text-[10px]">{v.numero_facture}</span>}<span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${v.type_vente === 'CRÉDIT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{v.type_vente}</span>{v.type_vente !== 'CRÉDIT' && <BadgePaiement methode={v.methode_paiement} />}<span className="text-[10px] text-gray-400 font-bold">{formatDateTime(v.date_vente)}</span></div><p className="font-black uppercase text-sm">{v.client_nom}</p><p className="text-[10px] text-gray-500 mt-1 line-clamp-1">🛒 {v.articles_liste}</p></div><p className="text-lg font-black text-[#800020] shrink-0">{formatAr(v.montant_total)} Ar</p><div className="flex gap-2 w-full md:w-auto shrink-0"><button onClick={(e)=>{e.stopPropagation(); imprimerPDF(v);}} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg font-bold text-xs shadow-sm transition">📄 PDF (A4)</button><button onClick={(e)=>{e.stopPropagation(); reImprimer(v);}} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-bold text-xs shadow-sm transition">🖨️ Re-imprimer</button><button onClick={(e)=>{e.stopPropagation(); setCancelModal(v);}} className="flex-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 px-3 py-2 rounded-lg font-bold text-xs shadow-sm transition">🗑️ Annuler</button></div></div>))}{ventesAffiches.length === 0 && <p className="text-center text-gray-400 italic">Aucune vente trouvée.</p>}</div>
      {detailModal && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"><div className="bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl"><div className="flex justify-between items-center border-b pb-3 mb-4"><div><h3 className="font-black text-[#800020] text-lg uppercase">Détails de Vente</h3><p className="text-xs text-gray-500 font-bold">{formatDateTime(detailModal.date_vente)}</p></div><button onClick={() => setDetailModal(null)} className="text-2xl font-black text-gray-400">×</button></div><p className="text-sm font-bold uppercase mb-4 text-gray-800">👤 {detailModal.client_nom} {detailModal.methode_paiement && `- Payé par ${detailModal.methode_paiement}`}</p><div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-xl max-h-48 overflow-y-auto custom-scrollbar">{detailModal.details_json?.articles?.map((art, idx) => { const pu = safeNum(art.prix_unitaire !== undefined ? art.prix_unitaire : art.prix_vente) - safeNum(art.remise_unitaire_ar !== undefined ? art.remise_unitaire_ar : art.remise_montant); const tl = safeNum(art.total_ligne !== undefined ? art.total_ligne : pu * safeNum(art.qte)); return (<div key={idx} className="flex justify-between text-xs border-b border-gray-200 pb-2 last:border-0"><div><span className="font-bold">{art.qte}x {art.nom}</span>{(art.remise_unitaire_ar > 0 || art.remise_montant > 0) && <p className="text-[9px] text-green-600 font-bold">Remise unitaire appliquée</p>}</div><span className="font-black">{formatAr(tl)} Ar</span></div>) })}</div><div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col gap-2"><div className="flex justify-between items-center"><p className="text-[10px] font-bold text-red-600 uppercase">Total Articles (Magasin)</p><p className="text-lg font-black text-[#800020]">{formatAr(detailModal.montant_total)} Ar</p></div>{safeNum(detailModal.details_json?.frais_livraison) > 0 && (<div className="flex justify-between items-center"><p className="text-[10px] font-bold text-orange-600 uppercase">Frais Livraison (Livreur)</p><p className="text-sm font-black text-orange-600">+{formatAr(detailModal.details_json.frais_livraison)} Ar</p></div>)}{safeNum(detailModal.details_json?.frais_livraison) > 0 && (<div className="flex justify-between items-center border-t border-red-200 pt-2 mt-1"><p className="text-xs font-black text-[#800020] uppercase">Total payé par client</p><p className="text-xl font-black text-[#800020]">{formatAr(safeNum(detailModal.montant_total) + safeNum(detailModal.details_json.frais_livraison))} Ar</p></div>)}</div></div></div>)}
      {cancelModal && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[90]"><div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-t-8 border-red-600 text-center"><div className="text-4xl mb-4">⚠️</div><h3 className="font-black text-red-600 text-lg uppercase mb-2">Annuler la vente ?</h3><p className="text-xs text-gray-500 mb-6">Action définitive. Stock restauré et vente supprimée.</p><form onSubmit={executerAnnulation} className="space-y-4"><div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Code Superadmin requis</label><input type="password" placeholder="Mot de passe direction" className="w-full p-3 bg-gray-50 border rounded-xl outline-none text-center font-bold" value={cancelPwd} onChange={e=>setCancelPwd(e.target.value)} required disabled={isCancelling} /></div><div className="flex gap-2"><button type="button" onClick={() => {setCancelModal(null); setCancelPwd("");}} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-xl font-bold text-xs transition" disabled={isCancelling}>Retour</button><button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-black uppercase text-xs shadow-md transition" disabled={isCancelling}>{isCancelling ? 'En cours...' : 'Confirmer'}</button></div></form></div></div>)}
    </div>
  );
};

const ModuleJournalDevis = ({ params }) => {
  const [devis, setDevis] = useState([]);
  const load = async () => { const { data } = await supabase.from('devis').select('*').order('date_devis', { ascending: false }); setDevis(data || []); };
  useEffect(() => { load(); }, []);

  const transformerFacture = async (d) => { if(!window.confirm(`Transformer en Facture ? Le stock sera déduit.`)) return; const today = new Date(); const dd = String(today.getDate()).padStart(2, '0'); const mm = String(today.getMonth() + 1).padStart(2, '0'); const yy = String(today.getFullYear()).slice(2, 4); const numDateStr = `${dd}${mm}${yy}`; const startOfToday = new Date(today); startOfToday.setHours(0, 0, 0, 0); const startIso = startOfToday.toISOString(); const { count } = await supabase.from('historique_ventes').select('*', {count: 'exact', head:true}).gte('date_vente', startIso); const numFacture = `FA${numDateStr}-${String((count || 0) + 1).padStart(3, '0')}`; let beneficeTotal = 0; if (d.details_json && Array.isArray(d.details_json.articles)) { for (let art of d.details_json.articles) { await supabase.rpc('decrement_stock_by_name', { p_nom: art.nom, amount: safeNum(art.qte) }); const { data: pData } = await supabase.from('produits').select('prix_achat').eq('nom', art.nom).single(); const pa = pData ? pData.prix_achat : 0; beneficeTotal += ((safeNum(art.prix_unitaire) - safeNum(art.remise_unitaire_ar) - pa) * safeNum(art.qte)); } } const remiseGl = d.details_json ? safeNum(d.details_json.remise_globale_pourcent) : 0; beneficeTotal -= (beneficeTotal * (remiseGl/100)); await supabase.from('historique_ventes').insert([{ numero_facture: numFacture, type_vente: 'FACTURE', client_nom: d.client_nom, articles_liste: d.articles_liste, montant_total: d.montant_total, benefice_total: beneficeTotal, remise_globale_pourcent: remiseGl, total_remise_ar: d.total_remise_ar, details_json: d.details_json, methode_paiement: 'CASH' }]); await supabase.from('devis').update({ statut: 'Facturé ✅', numero_facture_liee: numFacture }).eq('id', d.id); load(); alert(`Transformé avec succès ! Numéro de facture : ${numFacture}`); };
  const imprimerPDF = (d) => { const dataPrint = { numero: d.statut === 'Facturé ✅' ? d.numero_facture_liee : d.numero_devis, client_nom: d.client_nom, date: d.date_devis, totalNet: d.montant_total, totalRemisesEnAr: d.total_remise_ar, panier: d.details_json?.articles || [], fraisLivraison: safeNum(d.details_json?.frais_livraison), printSize: 'A4' }; lancerImpression(d.statut === 'Facturé ✅' ? 'facture_a4' : 'devis', dataPrint, params); };
  const reImprimer = (d) => { const dataPrint = { numero: d.statut === 'Facturé ✅' ? d.numero_facture_liee : d.numero_devis, client_nom: d.client_nom, date: d.date_devis, totalNet: d.montant_total, totalRemisesEnAr: d.total_remise_ar, panier: d.details_json?.articles || [], fraisLivraison: safeNum(d.details_json?.frais_livraison), printSize: '58mm' }; lancerImpression(d.statut === 'Facturé ✅' ? 'facture_a4' : 'devis', dataPrint, params); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b-2 border-[#800020] pb-2"><h2 className="text-2xl font-black uppercase text-[#800020]">Journal des Devis</h2></div>
      <div className="grid gap-3">{devis.map(d => (<div key={d.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4"><div className="flex-1 w-full"><div className="flex items-center gap-3 mb-1"><span className="font-black text-[#800020]">{d.numero_devis || 'Sans N°'}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.statut === 'En attente' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{d.statut || 'En attente'}</span><span className="text-[10px] text-gray-400 font-bold">{formatDate(d.date_devis)}</span></div><p className="font-black text-sm uppercase">{d.client_nom}</p><p className="text-[10px] text-gray-500 mt-1 line-clamp-1">🛒 {d.articles_liste}</p></div><p className="text-xl font-black text-gray-800 shrink-0">{formatAr(d.montant_total)} Ar</p><div className="flex gap-2 w-full md:w-auto shrink-0"><button onClick={()=>imprimerPDF(d)} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg font-bold text-xs shadow-sm transition">📄 PDF (A4)</button><button onClick={()=>reImprimer(d)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-bold text-xs shadow-sm transition">🖨️ Imprimer</button>{d.statut !== 'Facturé ✅' && <button onClick={()=>transformerFacture(d)} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-black text-xs shadow-sm transition">🔄 Transformer Facture</button>}</div></div>))}{devis.length === 0 && <p className="text-center text-gray-400 italic">Aucun devis enregistré.</p>}</div>
    </div>
  );
};

const ModuleJournalFactures = ({ params }) => {
  const [factures, setFactures] = useState([]); const [dateFiltre, setDateFiltre] = useState("");
  useEffect(() => { const load = async () => { let q = supabase.from('historique_ventes').select('*').in('type_vente', ['FACTURE', 'FACTURE_A4']).order('date_vente', { ascending: false }); if (dateFiltre) q = q.gte('date_vente', `${dateFiltre}T00:00:00`).lte('date_vente', `${dateFiltre}T23:59:59`); const { data } = await q; setFactures(data || []); }; load(); }, [dateFiltre]);
  
  const imprimerPDF = (v) => { const dataPrint = { numero: v.numero_facture, client_nom: v.client_nom, date: v.date_vente, totalNet: v.montant_total, totalRemisesEnAr: v.total_remise_ar, panier: v.details_json?.articles || [], methode: v.methode_paiement, banque: v.details_json?.paiement_infos?.banque, fraisLivraison: safeNum(v.details_json?.frais_livraison), printSize: 'A4' }; lancerImpression('facture_a4', dataPrint, params); };
  const reImprimer = (v) => { const dataPrint = { numero: v.numero_facture, client_nom: v.client_nom, date: v.date_vente, totalNet: v.montant_total, totalRemisesEnAr: v.total_remise_ar, panier: v.details_json?.articles || [], methode: v.methode_paiement, banque: v.details_json?.paiement_infos?.banque, fraisLivraison: safeNum(v.details_json?.frais_livraison), printSize: '58mm' }; lancerImpression('facture_a4', dataPrint, params); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b-2 border-[#800020] pb-2"><h2 className="text-2xl font-black uppercase text-[#800020]">Journal des Factures</h2><input type="date" className="p-2 bg-white border rounded-xl font-bold text-xs" onChange={e => setDateFiltre(e.target.value)} /></div>
      <div className="grid gap-3">{factures.map(v => (<div key={v.id} className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-3"><div className="flex-1 w-full"><div className="flex items-center gap-2 mb-1">{v.numero_facture && <span className="font-black text-[#800020]">{v.numero_facture}</span>}<span className="text-[10px] text-gray-400 font-bold ml-2">{formatDate(v.date_vente)}</span></div><p className="font-black uppercase text-sm">{v.client_nom}</p><p className="text-[10px] text-gray-500 mt-1 line-clamp-1">🛒 {v.articles_liste}</p></div><p className="text-xl font-black text-gray-800 shrink-0">{formatAr(v.montant_total)} Ar</p><div className="flex gap-2 w-full md:w-auto shrink-0"><button onClick={()=>imprimerPDF(v)} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-3 rounded-lg font-black text-xs shadow-sm transition">📄 PDF (A4)</button><button onClick={()=>reImprimer(v)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-black text-xs shadow-sm transition">🖨️ Imprimer</button></div></div>))}{factures.length === 0 && <p className="text-center text-gray-400 italic">Aucune facture.</p>}</div>
    </div>
  );
};

const AdminParametres = ({ params, setParams }) => {
  const [form, setForm] = useState(params);
  const save = async (e) => { e.preventDefault(); const { data } = await supabase.from('parametres').update(form).eq('id', 1).select(); if (data) { setParams(data[0]); alert("Mise à jour OK !"); } };
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Paramètres Ticket & ERP</h2>
      <form onSubmit={save} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Nom de l'entreprise</label><input className="w-full p-3 bg-gray-50 border rounded-xl font-black text-lg outline-none" value={form.nom_entreprise||''} onChange={e=>setForm({...form, nom_entreprise: e.target.value})} required /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Contact (Tél)</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.contact||''} onChange={e=>setForm({...form, contact: e.target.value})} /></div></div>
        <div><label className="text-xs font-bold text-gray-500 uppercase">Adresse</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.adresse||''} onChange={e=>setForm({...form, adresse: e.target.value})} required /></div>
        <div><label className="text-xs font-bold text-gray-500 uppercase">NIF / STAT</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={form.nif_stat||''} onChange={e=>setForm({...form, nif_stat: e.target.value})} /></div>
        <div className="border-t border-gray-200 pt-4 mt-4"><h3 className="font-black text-[#800020] mb-3 uppercase text-sm">Personnalisation du Ticket 58mm</h3><div className="space-y-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Message d'en-tête</label><textarea className="w-full p-3 bg-gray-50 border rounded-xl outline-none text-sm" rows="2" value={form.message_entete||''} onChange={e=>setForm({...form, message_entete: e.target.value})} /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Message de fin</label><textarea className="w-full p-3 bg-gray-50 border rounded-xl outline-none text-sm italic" rows="3" value={form.message_ticket||''} onChange={e=>setForm({...form, message_ticket: e.target.value})} /></div></div></div>
        <button type="submit" className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-md mt-4 hover:bg-[#5a0016] transition">Enregistrer les modifications</button>
      </form>
    </div>
  );
};

const ModuleClients = () => {
  const [list, setList] = useState([]); 
  const [form, setForm] = useState({ nom: '', tel: '', wa: '', adresse: '', nif: '', stat: '' });
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ nom: '', tel: '', wa: '', adresse: '', nif: '', stat: '', pwd: '' });

  const load = async () => { const { data } = await supabase.from('clients').select('*').order('nom'); setList(data || []); }; 
  useEffect(() => { load(); }, []);

  const saveNouveau = async (e) => { 
    e.preventDefault(); 
    await supabase.from('clients').insert([{nom: form.nom, telephone: form.tel, contact_whatsapp: form.wa, adresse: form.adresse, nif: form.nif, stat: form.stat}]); 
    setForm({ nom: '', tel: '', wa: '', adresse: '', nif: '', stat: '' }); 
    load(); 
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const { data: admins } = await supabase.from('utilisateurs').select('*').eq('role', 'superadmin').eq('mot_de_passe', editForm.pwd);
    if (!admins || admins.length === 0) return alert("⚠️ Code Superadmin incorrect !");

    const oldName = editModal.nom;
    const newName = editForm.nom;

    await supabase.from('clients').update({ nom: newName, telephone: editForm.tel, contact_whatsapp: editForm.wa, adresse: editForm.adresse, nif: editForm.nif, stat: editForm.stat }).eq('id', editModal.id);

    if (oldName !== newName) {
       await supabase.from('credits').update({ nom_client: newName }).eq('nom_client', oldName);
       await supabase.from('devis').update({ client_nom: newName }).eq('client_nom', oldName);
       await supabase.from('historique_ventes').update({ client_nom: newName }).eq('client_nom', oldName);
    }

    setEditModal(null); load(); alert("Client modifié avec succès !");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <form onSubmit={saveNouveau} className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-[#800020] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"><input placeholder="Nom / Société" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required /><input placeholder="Tél Normal" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} /><input placeholder="N° WhatsApp" className="p-3 bg-green-50 border border-green-100 rounded-xl outline-none" value={form.wa} onChange={e=>setForm({...form, wa: e.target.value})} /><div className="flex gap-2"><input placeholder="NIF" className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none w-full" value={form.nif} onChange={e=>setForm({...form, nif: e.target.value})} /><input placeholder="STAT" className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none w-full" value={form.stat} onChange={e=>setForm({...form, stat: e.target.value})} /></div><input placeholder="Adresse" className="p-3 bg-gray-50 border rounded-xl outline-none md:col-span-2" value={form.adresse} onChange={e=>setForm({...form, adresse: e.target.value})} /><button className="bg-[#800020] text-white p-3 rounded-xl font-black uppercase lg:col-span-3">Ajouter Client</button></form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{list.map(c => (<div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start"><div><p className="font-black uppercase text-sm text-gray-800">{c.nom}</p><p className="text-[10px] text-gray-500 mt-1">📞 {c.telephone || '-'}</p>{c.contact_whatsapp && <a href={`https://wa.me/${String(c.contact_whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-[10px] text-green-600 font-bold underline">💬 WhatsApp</a>}</div><div className="flex flex-col gap-1 items-end"><span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">NIF: {c.nif || c.raison_fiscale || '-'}</span><span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">STAT: {c.stat || '-'}</span><button onClick={() => { setEditModal(c); setEditForm({ nom: c.nom, tel: c.telephone||'', wa: c.contact_whatsapp||'', adresse: c.adresse||'', nif: c.nif||'', stat: c.stat||'', pwd: '' }); }} className="text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition mt-1">✏️ Modifier</button></div></div>))}</div>

      {editModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black uppercase text-[#800020] mb-4">Modifier Client</h2>
            <form onSubmit={saveEdit} className="space-y-3">
              <div><label className="text-[10px] font-bold text-gray-400 uppercase">Nom / Société</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none font-bold" value={editForm.nom} onChange={e=>setEditForm({...editForm, nom: e.target.value})} required /></div>
              <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Tél Normal</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={editForm.tel} onChange={e=>setEditForm({...editForm, tel: e.target.value})} /></div><div className="flex-1"><label className="text-[10px] font-bold text-green-600 uppercase">N° WhatsApp</label><input className="w-full p-3 bg-green-50 border border-green-200 rounded-xl outline-none text-green-700" value={editForm.wa} onChange={e=>setEditForm({...editForm, wa: e.target.value})} /></div></div>
              <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">NIF</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={editForm.nif} onChange={e=>setEditForm({...editForm, nif: e.target.value})} /></div><div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">STAT</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={editForm.stat} onChange={e=>setEditForm({...editForm, stat: e.target.value})} /></div></div>
              <div><label className="text-[10px] font-bold text-gray-400 uppercase">Adresse</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={editForm.adresse} onChange={e=>setEditForm({...editForm, adresse: e.target.value})} /></div>
              <div className="pt-2 border-t"><label className="text-[10px] font-bold text-gray-400 uppercase">Code Superadmin</label><input type="password" placeholder="Mot de passe requis" className="w-full p-3 border rounded-xl font-bold outline-none text-center" value={editForm.pwd} onChange={e=>setEditForm({...editForm, pwd: e.target.value})} required /></div>
              <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setEditModal(null)} className="p-3 bg-gray-100 rounded-xl flex-1 font-bold text-gray-600">Annuler</button><button type="submit" className="p-3 bg-[#800020] text-white rounded-xl font-bold flex-1 shadow-md">Enregistrer</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  ); 
};

const AdminFournisseurs = () => {
  const [list, setList] = useState([]); const [form, setForm] = useState({ nom: '', tel: '', wa: '' });
  const [editModal, setEditModal] = useState(null); const [editForm, setEditForm] = useState({ nom: '', tel: '', wa: '', pwd: '' });

  const load = async () => { const { data } = await supabase.from('fournisseurs').select('*').order('nom'); setList(data || []); }; useEffect(() => { load(); }, []);

  const saveNouveau = async (e) => { e.preventDefault(); await supabase.from('fournisseurs').insert([{ nom: form.nom, telephone: form.tel, contact_whatsapp: form.wa }]); setForm({ nom: '', tel: '', wa: '' }); load(); };

  const saveEdit = async (e) => {
    e.preventDefault();
    const { data: admins } = await supabase.from('utilisateurs').select('*').eq('role', 'superadmin').eq('mot_de_passe', editForm.pwd);
    if (!admins || admins.length === 0) return alert("⚠️ Code Superadmin incorrect !");

    const oldName = editModal.nom; const newName = editForm.nom;
    await supabase.from('fournisseurs').update({ nom: newName, telephone: editForm.tel, contact_whatsapp: editForm.wa }).eq('id', editModal.id);

    if (oldName !== newName) { await supabase.from('produits').update({ fournisseur_nom: newName }).eq('fournisseur_nom', oldName); }
    setEditModal(null); load(); alert("Fournisseur modifié !");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <form onSubmit={saveNouveau} className="bg-white p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 border-t-4 border-[#800020]"><input placeholder="Société" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.nom} onChange={e=>setForm({...form, nom: e.target.value})} required /><input placeholder="Tél Fixe" className="p-3 bg-gray-50 border rounded-xl outline-none" value={form.tel} onChange={e=>setForm({...form, tel: e.target.value})} required /><input placeholder="WhatsApp" className="p-3 bg-green-50 border border-green-100 rounded-xl outline-none" value={form.wa} onChange={e=>setForm({...form, wa: e.target.value})} /><button className="bg-[#800020] text-white p-3 rounded-xl font-black uppercase md:col-span-3">Ajouter</button></form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{list.map(f => (<div key={f.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex justify-between items-start"><p className="font-black text-sm uppercase text-gray-800 mb-2">{f.nom}</p><button onClick={() => { setEditModal(f); setEditForm({ nom: f.nom, tel: f.telephone||'', wa: f.contact_whatsapp||'', pwd: '' }); }} className="text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition">✏️</button></div><div className="flex gap-2"><span className="flex-1 bg-gray-100 text-gray-600 p-2 rounded text-center text-[10px] font-bold">📞 {f.telephone}</span>{f.contact_whatsapp && <a href={`https://wa.me/${String(f.contact_whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white p-2 rounded text-center text-[10px] font-black hover:bg-green-600">💬 WhatsApp</a>}</div></div>))}</div>

      {editModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black uppercase text-[#800020] mb-4">Modifier Fournisseur</h2>
            <form onSubmit={saveEdit} className="space-y-3">
              <div><label className="text-[10px] font-bold text-gray-400 uppercase">Nom / Société</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none font-bold" value={editForm.nom} onChange={e=>setEditForm({...editForm, nom: e.target.value})} required /></div>
              <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Tél Fixe</label><input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={editForm.tel} onChange={e=>setEditForm({...editForm, tel: e.target.value})} required /></div><div className="flex-1"><label className="text-[10px] font-bold text-green-600 uppercase">N° WhatsApp</label><input className="w-full p-3 bg-green-50 border border-green-200 rounded-xl outline-none text-green-700" value={editForm.wa} onChange={e=>setEditForm({...editForm, wa: e.target.value})} /></div></div>
              <div className="pt-2 border-t"><label className="text-[10px] font-bold text-gray-400 uppercase">Code Superadmin</label><input type="password" placeholder="Mot de passe requis" className="w-full p-3 border rounded-xl font-bold outline-none text-center" value={editForm.pwd} onChange={e=>setEditForm({...editForm, pwd: e.target.value})} required /></div>
              <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setEditModal(null)} className="p-3 bg-gray-100 rounded-xl flex-1 font-bold text-gray-600">Annuler</button><button type="submit" className="p-3 bg-[#800020] text-white rounded-xl font-bold flex-1 shadow-md">Enregistrer</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SuiviCredits = ({ params }) => {
  const [credits, setCredits] = useState([]); const [clients, setClients] = useState([]); const [filtre, setFiltre] = useState('non_paye'); const [detailModal, setDetailModal] = useState(null); const [reprintSize, setReprintSize] = useState('A4');
  const load = async () => { const cr = await supabase.from('credits').select('*').order('date_credit', { ascending: false }); const cl = await supabase.from('clients').select('nom, contact_whatsapp'); setCredits(cr.data || []); setClients(cl.data || []); }; useEffect(() => { load(); }, []);
  const encaisser = async (id) => { if(window.confirm("Confirmer encaissement ?")) { await supabase.from('credits').update({ statut: 'paye', date_paiement: new Date().toISOString() }).eq('id', id); load(); setDetailModal(null); } };
  const relancerWA = (credit) => { const client = clients.find(c => c.nom === credit.nom_client); if(!client || !client.contact_whatsapp) return alert("Pas de WhatsApp enregistré."); const num = String(client.contact_whatsapp).replace(/[^0-9]/g, ''); const txt = encodeURIComponent(`Bonjour, c'est Hakimi Plus. Votre facture de ${formatAr(credit.montant_du)} Ar arrive à échéance. Merci.`); window.open(`https://wa.me/${num}?text=${txt}`, '_blank'); };
  const reImprimer = (c) => { const dataPrint = { numero: c.numero_facture, client_nom: c.nom_client, date: c.date_credit, echeance: c.date_echeance, totalNet: c.montant_du, totalRemisesEnAr: c.details_json?.total_remise_ar || 0, panier: c.details_json?.articles || [], fraisLivraison: safeNum(c.details_json?.frais_livraison), printSize: reprintSize, methode: 'CRÉDIT' }; lancerImpression('admin_credit', dataPrint, params); };
  const dataAffichee = credits.filter(c => c.statut === filtre); const aujourdHui = new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <div className="flex gap-2 border-b-2 border-gray-100 pb-4 overflow-x-auto"><button onClick={() => setFiltre('non_paye')} className={`px-4 py-2 rounded-xl font-black uppercase text-xs whitespace-nowrap ${filtre === 'non_paye' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}>🔴 Dettes en cours</button><button onClick={() => setFiltre('paye')} className={`px-4 py-2 rounded-xl font-black uppercase text-xs whitespace-nowrap ${filtre === 'paye' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>✅ Payés</button></div>
      <div className="grid gap-3">{dataAffichee.map(c => { const echeanceDate = new Date(c.date_echeance); const enRetard = filtre === 'non_paye' && c.date_echeance && echeanceDate <= aujourdHui; return (<div key={c.id} className={`bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:shadow-md transition ${filtre === 'non_paye' ? (enRetard ? 'border-red-600 bg-red-50' : 'border-[#800020]') : 'border-green-500'}`} onClick={() => setDetailModal(c)}><div className="flex-1"><p className="font-black text-lg uppercase text-gray-800">{c.nom_client}</p><div className="flex flex-wrap gap-2 mt-1"><p className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded border">Créé: {formatDate(c.date_credit)}</p>{filtre === 'non_paye' && c.date_echeance && (<p className={`text-[10px] font-bold px-2 py-1 rounded border ${enRetard ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-50 text-orange-700'}`}>Échéance: {formatDate(c.date_echeance)}</p>)}</div><p className="text-xs italic text-gray-500 mt-2 line-clamp-1">🛒 {c.details_articles}</p></div><div className="text-left md:text-right w-full md:w-auto flex flex-col items-end"><p className={`text-2xl font-black ${filtre === 'non_paye' ? 'text-red-600' : 'text-green-600'}`}>{formatAr(c.montant_du)} Ar</p>{filtre === 'non_paye' && (<div className="flex gap-2 mt-2 w-full md:w-auto">{enRetard && <button onClick={(e) => { e.stopPropagation(); relancerWA(c); }} className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg font-black uppercase text-[9px] shadow-md hover:bg-green-600">💬 Relancer</button>}<button onClick={(e) => { e.stopPropagation(); encaisser(c.id); }} className="flex-1 bg-[#800020] text-white px-3 py-2 rounded-lg font-black uppercase text-[9px] shadow-md hover:bg-red-900">Encaisser</button></div>)}</div></div>)})}</div>
      {detailModal && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"><div className="bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl"><div className="flex justify-between items-center border-b pb-3 mb-4"><div><h3 className="font-black text-[#800020] text-lg uppercase">Détails Crédit</h3><p className="text-xs text-gray-500 font-bold">{formatDateTime(detailModal.date_credit)}</p></div><button onClick={() => setDetailModal(null)} className="text-2xl font-black text-gray-400">×</button></div><p className="text-sm font-bold uppercase mb-4 text-gray-800">👤 {detailModal.nom_client}</p><div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-xl max-h-48 overflow-y-auto custom-scrollbar">{detailModal.details_json?.articles ? detailModal.details_json.articles.map((art, idx) => { const pu = safeNum(art.prix_unitaire !== undefined ? art.prix_unitaire : art.prix_vente) - safeNum(art.remise_unitaire_ar !== undefined ? art.remise_unitaire_ar : art.remise_montant); const tl = safeNum(art.total_ligne !== undefined ? art.total_ligne : pu * safeNum(art.qte)); return (<div key={idx} className="flex justify-between text-xs border-b border-gray-200 pb-2 last:border-0"><div><span className="font-bold">{art.qte}x {art.nom}</span><p className="text-[9px] text-gray-500">[{art.categorie || 'Divers'}]</p></div><div className="text-right"><span className="text-[10px] text-gray-500 block">{formatAr(pu)} Ar/u</span><span className="font-black">{formatAr(tl)} Ar</span></div></div>) }) : <p className="text-xs italic text-gray-500">{detailModal.details_articles}</p>}</div><div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col gap-2 mb-4"><div className="flex justify-between items-center"><p className="text-[10px] font-bold text-red-600 uppercase">Montant Dû</p><p className="text-2xl font-black text-[#800020]">{formatAr(detailModal.montant_du)} Ar</p></div></div><div className="flex gap-2 items-center border-t pt-4"><select className="p-3 bg-gray-50 border rounded-xl outline-none text-xs font-bold" value={reprintSize} onChange={e=>setReprintSize(e.target.value)}><option value="A4">Format A4</option><option value="58mm">Ticket 58mm</option><option value="80mm">Ticket 80mm</option></select><button onClick={() => reImprimer(detailModal)} className="flex-1 bg-gray-800 hover:bg-black text-white p-3 rounded-xl font-black uppercase text-xs transition">🖨️ Réimprimer</button></div></div></div>)}
    </div>
  );
};

const ModuleDepenses = () => {
  const [depenses, setDepenses] = useState([]); const [form, setForm] = useState({ desc: '', montant: '', date: new Date().toISOString().split('T')[0] });
  const load = async () => { const { data } = await supabase.from('depenses').select('*').order('date_depense', { ascending: false }); setDepenses(data || []); }; useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault(); await supabase.from('depenses').insert([{ description: form.desc, montant: safeNum(form.montant), date_depense: form.date }]); setForm({ ...form, desc: '', montant: '' }); load(); };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={save} className="bg-white p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 border-t-4 border-[#800020]"><input placeholder="Dépense" className="p-3 bg-gray-50 border rounded-xl md:col-span-2" value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} required /><input type="number" placeholder="Montant" className="p-3 bg-red-50 text-red-600 font-bold border rounded-xl" value={form.montant} onChange={e=>setForm({...form, montant: e.target.value})} required /><button className="bg-[#800020] text-white p-3 rounded-xl font-black">Ajouter</button></form>
      <div className="space-y-2">{depenses.map(d => (<div key={d.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-600 flex justify-between"><p className="font-bold text-sm uppercase">{d.description}</p><p className="font-black text-red-600">-{formatAr(d.montant)}</p></div>))}</div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [creds, setCreds] = useState({ id: '', mdp: '' });
  const handle = async (e) => { e.preventDefault(); const { data } = await supabase.from('utilisateurs').select('*').eq('identifiant', creds.id).eq('mot_de_passe', creds.mdp).single(); if (data) onLogin(data); else alert("Identifiants incorrects."); };
  return (
    <div className="min-h-screen bg-[#800020] flex items-center justify-center p-4"><form onSubmit={handle} className="bg-white p-12 rounded-[2rem] shadow-2xl w-full max-w-md border-b-8 border-red-600"><div className="flex justify-center mb-6"><img src={LOGO_URL} alt="Logo" className="h-16" onerror="this.style.display='none'" /></div><input type="text" placeholder="Utilisateur" className="w-full p-4 mb-4 bg-gray-50 border rounded-xl outline-none" onChange={e=>setCreds({...creds, id: e.target.value})} /><input type="password" placeholder="Mot de passe" className="w-full p-4 mb-6 bg-gray-50 border rounded-xl outline-none" onChange={e=>setCreds({...creds, mdp: e.target.value})} /><button className="w-full bg-[#800020] text-white p-4 rounded-xl font-black uppercase shadow-lg">Connexion</button></form></div>
  );
};
// ==========================================
// COMPOSANT 1 : GESTION DES COMMANDES WEB (CORRIGÉ SUPABASE)
// ==========================================
// ==========================================
const ModuleCommandesWeb = () => {
  const [commandes, setCommandes] = React.useState([]);
  
  const load = async () => {
    const { data } = await supabase.from('commandes_web').select('*').order('date_commande', { ascending: false });
    setCommandes(data || []);
  };
  React.useEffect(() => { load(); }, []);

  const validerCommandeWeb = async (cmd) => {
    if (!window.confirm("Valider cette commande ? Le stock physique sera déduit.")) return;
    const articles = cmd.articles_json.articles;
    for (let art of articles) {
      await supabase.rpc('decrement_stock_by_name', { p_nom: art.nom, amount: Number(art.qte) });
    }
    await supabase.from('historique_ventes').insert([{
      numero_facture: `WEB-${cmd.id.toString().slice(0,5)}`,
      type_vente: 'SITE_WEB',
      client_nom: cmd.client_nom,
      articles_liste: articles.map(a => `${a.qte}x ${a.nom}`).join(', '),
      montant_total: Number(cmd.montant_total),
      details_json: cmd.articles_json,
      methode_paiement: 'LIVRAISON'
    }]);
    await supabase.from('commandes_web').update({ statut: 'Validée' }).eq('id', cmd.id);
    alert("✅ Commande validée !");
    load();
  };

  const annulerCommandeWeb = async (cmd) => {
    if (!window.confirm("Annuler définitivement cette commande ?")) return;
    
    // On met à jour le statut en "Annulée"
    await supabase.from('commandes_web').update({ statut: 'Annulée' }).eq('id', cmd.id);
    
    // On prépare le lien WhatsApp
    const numeroNet = String(cmd.client_whatsapp).replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Bonjour ${cmd.client_nom}, c'est Hakimi Plus. Votre commande sur notre site a été annulée car `);
    
    // On ouvre WhatsApp
    window.open(`https://wa.me/${numeroNet}?text=${message}`, '_blank');
    
    load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Commandes du Site</h2>
      <div className="grid gap-3">
        {commandes.map(cmd => {
          const numeroNet = String(cmd.client_whatsapp).replace(/[^0-9]/g, '');
          return (
            <div key={cmd.id} className={`bg-white p-5 rounded-2xl shadow-sm border-l-8 ${
              cmd.statut === 'Validée' ? 'border-green-500 opacity-60' : 
              cmd.statut === 'Annulée' ? 'border-gray-400 opacity-50' : 'border-blue-500'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-gray-800 uppercase text-sm">{cmd.client_nom}</p>
                    {/* Lien WhatsApp cliquable sur le numéro */}
                    <a href={`https://wa.me/${numeroNet}`} target="_blank" rel="noreferrer" className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg font-black text-[10px] hover:bg-green-200 transition">
                      🟢 WHATSAPP: {cmd.client_whatsapp}
                    </a>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{cmd.quartier} | {new Date(cmd.date_commande).toLocaleString()}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cmd.articles_json?.articles?.map((a, i) => (
                      <span key={i} className="text-[10px] font-bold bg-gray-100 p-1 px-2 rounded border border-gray-200"> {a.qte}x {a.nom} </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-[#800020]">{Number(cmd.montant_total).toLocaleString()} Ar</p>
                  
                  {cmd.statut === 'En attente' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => annulerCommandeWeb(cmd)} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase hover:bg-red-100 hover:text-red-600 transition">
                        ❌ Annuler
                      </button>
                      <button onClick={() => validerCommandeWeb(cmd)} className="bg-[#800020] text-white px-3 py-2 rounded-xl font-black text-[9px] uppercase shadow-md hover:bg-black transition">
                        ✅ Valider
                      </button>
                    </div>
                  )}
                  
                  {cmd.statut === 'Validée' && <span className="mt-2 text-green-600 font-black text-[10px] uppercase block">Facturé ✅</span>}
                  {cmd.statut === 'Annulée' && <span className="mt-2 text-red-600 font-black text-[10px] uppercase block">Annulée ❌</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// ==========================================
// COMPOSANT 2 : CONFIGURATION DU SITE (CORRIGÉ SUPABASE)
// ==========================================
const ModuleGestionSite = () => {
  // On utilise les noms exacts de ta table parametres_web
  const [config, setConfig] = React.useState({ carousel_urls: ["", "", ""], texte_livraison: "", texte_conditions: "" });
  
  const load = async () => {
    const { data } = await supabase.from('parametres_web').select('*').eq('id', 1).single();
    if (data) setConfig(data);
  };
  React.useEffect(() => { load(); }, []);

  const save = async () => {
    // Mise à jour vers la table parametres_web
    await supabase.from('parametres_web').update({
        carousel_urls: config.carousel_urls,
        texte_livraison: config.texte_livraison,
        texte_conditions: config.texte_conditions
    }).eq('id', 1);
    alert("🚀 Site Hakimi Plus mis à jour avec succès !");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase text-[#800020] border-b-2 border-[#800020] pb-2">Gestion Hakimi Plus (Configuration)</h2>
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Photos du Carrousel (Liens directes)</label>
          {config.carousel_urls?.map((url, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
               <span className="bg-gray-100 p-2 rounded-lg text-[10px] font-black w-8 text-center">{idx+1}</span>
               <input className="flex-1 p-2 bg-gray-50 border rounded-xl text-xs outline-none focus:border-[#800020]" value={url} 
                onChange={e => {
                  const newC = [...config.carousel_urls]; newC[idx] = e.target.value; 
                  setConfig({...config, carousel_urls: newC});
                }} placeholder="Lien image ImgBB / Supabase" 
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Infos Livraison</label>
            <textarea className="w-full p-4 bg-gray-50 border rounded-2xl text-xs h-32 outline-none focus:border-[#800020]" value={config.texte_livraison} 
              onChange={e => setConfig({...config, texte_livraison: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Conditions de vente</label>
            <textarea className="w-full p-4 bg-gray-50 border rounded-2xl text-xs h-32 outline-none focus:border-[#800020]" value={config.texte_conditions} 
              onChange={e => setConfig({...config, texte_conditions: e.target.value})} />
          </div>
        </div>
        <button onClick={save} className="w-full bg-[#800020] text-white p-5 rounded-2xl font-black uppercase shadow-xl hover:bg-black transition">
          Mettre à jour le site Hakimi Plus
        </button>
      </div>
    </div>
  );
};
