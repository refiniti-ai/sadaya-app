import React, { useState, useEffect } from 'react';
import { generateMarketingStrategy } from '../services/geminiService';
import { Organization, Invoice, Project, Task, DriveItem, MarketingStrategy, TaskStatus, Proposal, ProposalStatus, User, UserRole, StrategyStatus } from '../types';
import { 
  Sparkles, ChevronRight, CheckCircle, Lock, Upload, 
  FileText, Layout, Key, PlayCircle, Loader2, CreditCard,
  Briefcase, ArrowRight, Eye, X, Palette, Image as ImageIcon,
  ShieldCheck, AlertTriangle, Edit3, ArrowLeft, Save, AlertCircle,
  FileCheck
} from 'lucide-react';

interface MarketingStrategistProps {
    organizations: Organization[];
    invoices: Invoice[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    driveItems: DriveItem[];
    setDriveItems: React.Dispatch<React.SetStateAction<DriveItem[]>>;
    proposals: Proposal[];
    currentUser?: User;
}

type ViewState = 'CLIENT_SELECT' | 'DASHBOARD' | 'INTAKE_DYNAMIC' | 'INTAKE_ASSETS' | 'INTAKE_CREDS' | 'STRATEGY_HUB';

export const MarketingStrategist: React.FC<MarketingStrategistProps> = ({
    organizations, invoices, setProjects, setTasks, driveItems, setDriveItems, proposals: initialProposals, currentUser
}) => {
    // Local state for proposals to allow updates (Mock DB behavior)
    const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
    const [view, setView] = useState<ViewState>('CLIENT_SELECT');
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // UI Toggles
    const [showContext, setShowContext] = useState(false);
    const [hubTab, setHubTab] = useState<'PROPOSAL' | 'INVOICE' | 'STRATEGY' | 'ASSETS' | 'LOGINS'>('PROPOSAL');
    const [modificationNote, setModificationNote] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Intake Form State
    const [dynamicAnswers, setDynamicAnswers] = useState<any>({});
    const [assetsForm, setAssetsForm] = useState({
        rebranding: false,
        colors: ['#000000', '#ffffff'],
        fontStyle: 'Modern Sans-Serif',
        uploadedFiles: [] as File[]
    });
    const [logins, setLogins] = useState([{ platform: '', url: '', username: '', password: '' }]);

    // Derived Data
    const selectedOrg = organizations.find(o => o.id === selectedOrgId);
    const activeProposal = proposals.find(p => p.id === activeProposalId);
    const orgProposals = proposals.filter(p => p.clientId === selectedOrgId);
    
    const canEdit = currentUser?.role !== UserRole.CLIENT;

    // --- Helpers ---

    const isProposalPaid = (proposalId: string) => {
        // Check if there is a PAID invoice linked to this proposal or matching details
        const prop = proposals.find(p => p.id === proposalId);
        if (!prop) return false;
        
        // Exact Match
        const exactInv = invoices.find(i => i.proposalId === proposalId && i.status === 'Paid');
        if (exactInv) return true;

        // Loose Match (for mock data consistency)
        // If client name matches and invoice amount ~ proposal upfront
        const looseInv = invoices.find(i => i.clientName === prop.clientName && i.status === 'Paid' && Math.abs(i.amount - prop.estimatedUpfront) < 100);
        return !!looseInv;
    };

    const getDynamicQuestions = (services: string[]) => {
        const questions = [
            { id: 'goal', label: "What is the primary revenue goal for this campaign?" }
        ];
        if (services.some(s => s.toLowerCase().includes('seo') || s.toLowerCase().includes('web'))) {
            questions.push({ id: 'keywords', label: "List top 3 competitor websites or target keywords." });
        }
        if (services.some(s => s.toLowerCase().includes('social') || s.toLowerCase().includes('ads'))) {
            questions.push({ id: 'social_tone', label: "Describe the desired tone for social copy (e.g., Witty, Professional)." });
        }
        if (services.some(s => s.toLowerCase().includes('email'))) {
            questions.push({ id: 'email_offer', label: "What is the core lead magnet or offer for email capture?" });
        }
        return questions;
    };

    const updateProposalState = (updates: Partial<Proposal>) => {
        setProposals(prev => prev.map(p => p.id === activeProposalId ? { ...p, ...updates } : p));
    };

    const updateMarketingData = (updates: any) => {
        if (!activeProposal) return;
        const currentData = activeProposal.marketingData || {
            status: StrategyStatus.DRAFTING,
            content: null,
            assets: [],
            credentials: [],
            feedbackHistory: [],
            rebrandingRequired: false
        };
        
        updateProposalState({
            marketingData: { ...currentData, ...updates }
        });
    };

    // --- Handlers ---

    const handleGenerateStrategy = async () => {
        if (!selectedOrg || !activeProposal) return;
        setIsLoading(true);
        
        const fullContext = {
            ...dynamicAnswers,
            assets: assetsForm,
            proposalContext: {
                customDetails: activeProposal.customDetails,
                services: activeProposal.services,
                strategy: activeProposal.content.strategy
            }
        };

        const strategy = await generateMarketingStrategy(selectedOrg.name, fullContext);
        
        // Save initial state
        updateMarketingData({
            content: strategy,
            status: StrategyStatus.PENDING_APPROVAL, // Goes to team first
            assets: [
                ...assetsForm.colors.map(c => ({ type: 'color', value: c })),
                { type: 'font', value: assetsForm.fontStyle }
            ],
            credentials: logins.filter(l => l.platform),
            rebrandingRequired: assetsForm.rebranding
        });

        setIsLoading(false);
        setView('STRATEGY_HUB');
        setHubTab('STRATEGY');
    };

    const handleAdminApproval = () => {
        updateMarketingData({ status: StrategyStatus.APPROVED });
    };

    const handleClientAcceptance = () => {
        updateMarketingData({ status: StrategyStatus.LIVE });
        // Trigger project creation or other downstream effects here if needed
        alert("Strategy Live! Operations team notified.");
    };

    const handleRequestModification = () => {
        if (!modificationNote) return;
        const currentData = activeProposal?.marketingData;
        updateMarketingData({ 
            status: StrategyStatus.MODIFICATION_REQUESTED,
            feedbackHistory: [
                ...(currentData?.feedbackHistory || []),
                { date: new Date().toLocaleDateString(), note: modificationNote, author: currentUser?.name || 'Client' }
            ]
        });
        setModificationNote('');
        setShowRejectModal(false);
    };

    const handleAdminSaveEdits = (newContent: MarketingStrategy) => {
        updateMarketingData({ content: newContent });
        // If it was modification requested, move back to Approved or Pending? 
        // Let's move to Approved so client can see changes.
        if (activeProposal?.marketingData?.status === StrategyStatus.MODIFICATION_REQUESTED) {
            updateMarketingData({ status: StrategyStatus.APPROVED });
        }
    };

    // --- RENDER ---

    return (
        <div className="h-full flex flex-col animate-in fade-in relative bg-[#0f172a] text-white">
            
            {/* Context Sidebar (Available in Intake) */}
            {showContext && activeProposal && (
                <div className="absolute right-0 top-0 h-full w-80 bg-[#0f172a] border-l border-white/10 z-30 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right-10 backdrop-blur-xl bg-opacity-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-bold font-headline">Sales Discovery</h3>
                        <button onClick={() => setShowContext(false)}><X className="w-5 h-5 text-slate-400 hover:text-white"/></button>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs text-sadaya-gold font-bold uppercase mb-2">Notes</h4>
                            <div className="p-3 bg-white/5 rounded-lg text-sm text-slate-300 italic border border-white/5">
                                {activeProposal.customDetails || "No notes available."}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs text-sadaya-gold font-bold uppercase mb-2">Services Sold</h4>
                            <div className="flex flex-wrap gap-2">
                                {activeProposal.services.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-300">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW 1: CLIENT SELECT --- */}
            {view === 'CLIENT_SELECT' && (
                <div className="p-8 max-w-6xl mx-auto w-full">
                    <h2 className="text-3xl font-headline font-light mb-8">Select Client Entity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {organizations.map(org => (
                            <div 
                                key={org.id} 
                                onClick={() => { setSelectedOrgId(org.id); setView('DASHBOARD'); }}
                                className="group p-6 glass-panel rounded-2xl cursor-pointer hover:border-sadaya-gold/50 transition-all hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Briefcase className="w-8 h-8 text-slate-500 group-hover:text-sadaya-gold transition-colors"/>
                                    <span className="bg-white/5 px-2 py-1 rounded text-xs text-slate-400">{org.industry}</span>
                                </div>
                                <h3 className="text-xl font-bold font-headline">{org.name}</h3>
                                <p className="text-sm text-slate-500 mt-2">{org.users.length} Users • {proposals.filter(p => p.clientId === org.id).length} Proposals</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- VIEW 2: DASHBOARD (Proposal Select) --- */}
            {view === 'DASHBOARD' && selectedOrg && (
                <div className="p-8 max-w-5xl mx-auto w-full">
                    <button onClick={() => setView('CLIENT_SELECT')} className="mb-6 text-slate-400 hover:text-white flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Back to Clients</button>
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-3xl font-headline font-bold">{selectedOrg.name}</h2>
                            <p className="text-slate-400">Marketing Intelligence Dashboard</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-sadaya-gold uppercase tracking-widest">Active Proposals</h3>
                        {orgProposals.length === 0 ? (
                            <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-slate-500">No proposals found. Create one in the Proposal Builder.</div>
                        ) : (
                            orgProposals.map(prop => {
                                const isPaid = isProposalPaid(prop.id);
                                const hasStrategy = !!prop.marketingData;
                                
                                return (
                                    <div key={prop.id} className="glass-panel p-6 rounded-xl flex items-center justify-between border border-white/10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-bold text-white">{prop.content.hero.title}</h4>
                                                {!isPaid && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 flex items-center"><Lock className="w-3 h-3 mr-1"/> Unpaid</span>}
                                                {isPaid && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Paid</span>}
                                            </div>
                                            <p className="text-sm text-slate-400">{prop.services.join(', ')}</p>
                                        </div>
                                        <div>
                                            {hasStrategy ? (
                                                <button 
                                                    onClick={() => { setActiveProposalId(prop.id); setView('STRATEGY_HUB'); }}
                                                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-sm font-bold flex items-center"
                                                >
                                                    View Strategy Hub <ArrowRight className="w-4 h-4 ml-2"/>
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => { 
                                                        if(!isPaid) { alert("Strategy generation is locked until the proposal invoice is paid."); return; }
                                                        setActiveProposalId(prop.id); 
                                                        setView('INTAKE_DYNAMIC'); 
                                                    }}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center ${isPaid ? 'bg-sadaya-gold text-black hover:bg-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                                >
                                                    {isPaid ? <><Sparkles className="w-4 h-4 mr-2"/> Initialize Strategy</> : <><Lock className="w-4 h-4 mr-2"/> Initialize Locked</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* --- INTAKE FLOW (Views 3, 4, 5) --- */}
            {(view === 'INTAKE_DYNAMIC' || view === 'INTAKE_ASSETS' || view === 'INTAKE_CREDS') && activeProposal && (
                <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full py-8 px-4">
                    {/* Progress */}
                    <div className="flex justify-between mb-8">
                        {['Campaign Context', 'Brand Assets', 'Access'].map((step, i) => {
                            const stepMap = ['INTAKE_DYNAMIC', 'INTAKE_ASSETS', 'INTAKE_CREDS'];
                            const isActive = stepMap[i] === view;
                            const isPast = stepMap.indexOf(view) > i;
                            return (
                                <div key={step} className={`flex items-center gap-2 ${isActive ? 'text-sadaya-gold' : isPast ? 'text-green-400' : 'text-slate-600'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm font-bold ${isActive ? 'border-sadaya-gold bg-sadaya-gold/10' : isPast ? 'border-green-400 bg-green-400/10' : 'border-slate-700 bg-slate-800'}`}>
                                        {isPast ? <CheckCircle className="w-4 h-4"/> : i + 1}
                                    </div>
                                    <span className="hidden md:block text-sm font-bold uppercase">{step}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="glass-panel p-8 rounded-2xl border border-white/10 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-headline font-bold">
                                {view === 'INTAKE_DYNAMIC' && 'Campaign Context'}
                                {view === 'INTAKE_ASSETS' && 'Brand Assets'}
                                {view === 'INTAKE_CREDS' && 'Access Credentials'}
                            </h2>
                            <button onClick={() => setShowContext(!showContext)} className="text-xs text-sadaya-gold hover:underline flex items-center border border-sadaya-gold/20 px-3 py-1.5 rounded bg-sadaya-gold/5">
                                <Eye className="w-3 h-3 mr-2"/> Sales Notes
                            </button>
                        </div>

                        <div className="flex-1 space-y-6">
                            {view === 'INTAKE_DYNAMIC' && (
                                <>
                                    {getDynamicQuestions(activeProposal.services).map(q => (
                                        <div key={q.id}>
                                            <label className="text-sm text-slate-300 font-bold block mb-2">{q.label}</label>
                                            <textarea 
                                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-sadaya-gold outline-none min-h-[100px]"
                                                value={dynamicAnswers[q.id] || ''}
                                                onChange={(e) => setDynamicAnswers({...dynamicAnswers, [q.id]: e.target.value})}
                                            />
                                        </div>
                                    ))}
                                </>
                            )}

                            {view === 'INTAKE_ASSETS' && (
                                <>
                                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${assetsForm.rebranding ? 'bg-sadaya-gold' : 'bg-slate-700'}`} onClick={() => setAssetsForm({...assetsForm, rebranding: !assetsForm.rebranding})}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${assetsForm.rebranding ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className="text-sm font-bold text-white">Require Full Rebranding?</span>
                                    </div>

                                    {!assetsForm.rebranding ? (
                                        <div className="p-6 border-2 border-dashed border-white/20 rounded-xl text-center hover:border-sadaya-gold/50 hover:bg-white/5 transition-all">
                                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2"/>
                                            <p className="text-sm text-slate-300">Upload Current Logo (SVG/PNG)</p>
                                            <input type="file" className="hidden" />
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm rounded-lg flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2"/> We will generate new logo concepts in the strategy phase.
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm text-slate-300 font-bold block mb-2">Primary Brand Colors</label>
                                        <div className="flex gap-2">
                                            {assetsForm.colors.map((c, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input 
                                                        type="color" value={c} 
                                                        onChange={(e) => {
                                                            const newColors = [...assetsForm.colors];
                                                            newColors[i] = e.target.value;
                                                            setAssetsForm({...assetsForm, colors: newColors});
                                                        }}
                                                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm text-slate-300 font-bold block mb-2">Font Style Preference</label>
                                        <select 
                                            className="w-full bg-[#0f172a] border border-white/10 rounded p-3 text-white focus:border-sadaya-gold outline-none"
                                            value={assetsForm.fontStyle}
                                            onChange={(e) => setAssetsForm({...assetsForm, fontStyle: e.target.value})}
                                        >
                                            <option>Modern Sans-Serif (Clean, Tech)</option>
                                            <option>Serif (Traditional, Trust)</option>
                                            <option>Display (Bold, Loud)</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {view === 'INTAKE_CREDS' && (
                                <>
                                    <div className="space-y-3">
                                        {logins.map((l, i) => (
                                            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-black/20 p-2 rounded">
                                                <input placeholder="Platform" value={l.platform} onChange={e => { const n = [...logins]; n[i].platform = e.target.value; setLogins(n); }} className="bg-transparent border-b border-white/10 text-xs p-2 text-white outline-none focus:border-sadaya-gold"/>
                                                <input placeholder="URL" value={l.url} onChange={e => { const n = [...logins]; n[i].url = e.target.value; setLogins(n); }} className="bg-transparent border-b border-white/10 text-xs p-2 text-white outline-none focus:border-sadaya-gold"/>
                                                <input placeholder="User" value={l.username} onChange={e => { const n = [...logins]; n[i].username = e.target.value; setLogins(n); }} className="bg-transparent border-b border-white/10 text-xs p-2 text-white outline-none focus:border-sadaya-gold"/>
                                                <input placeholder="Pass" type="password" value={l.password} onChange={e => { const n = [...logins]; n[i].password = e.target.value; setLogins(n); }} className="bg-transparent border-b border-white/10 text-xs p-2 text-white outline-none focus:border-sadaya-gold"/>
                                            </div>
                                        ))}
                                        <button onClick={() => setLogins([...logins, { platform: '', url: '', username: '', password: '' }])} className="text-xs text-sadaya-gold hover:underline">+ Add Row</button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="pt-8 border-t border-white/10 flex justify-end">
                            {view === 'INTAKE_DYNAMIC' && <button onClick={() => setView('INTAKE_ASSETS')} className="btn-primary">Next: Assets</button>}
                            {view === 'INTAKE_ASSETS' && <button onClick={() => setView('INTAKE_CREDS')} className="btn-primary">Next: Access</button>}
                            {view === 'INTAKE_CREDS' && (
                                <button onClick={handleGenerateStrategy} className="btn-primary flex items-center">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Sparkles className="w-4 h-4 mr-2"/> Generate Strategy</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW 6: STRATEGY HUB (The Core) --- */}
            {view === 'STRATEGY_HUB' && activeProposal && activeProposal.marketingData && (
                <div className="flex h-full">
                    {/* Hub Sidebar */}
                    <div className="w-64 border-r border-white/10 bg-black/20 p-4">
                        <button onClick={() => setView('DASHBOARD')} className="mb-6 text-xs text-slate-400 hover:text-white flex items-center"><ArrowLeft className="w-3 h-3 mr-1"/> Back</button>
                        <h3 className="text-lg font-bold font-headline text-white mb-1 truncate">{activeProposal.clientName}</h3>
                        <div className="mb-6">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                                activeProposal.marketingData.status === StrategyStatus.APPROVED ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                activeProposal.marketingData.status === StrategyStatus.LIVE ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                                {activeProposal.marketingData.status}
                            </span>
                        </div>

                        <div className="space-y-1">
                            {[
                                {id: 'PROPOSAL', label: 'Proposal', icon: FileCheck},
                                {id: 'INVOICE', label: 'Invoice', icon: CreditCard},
                                {id: 'STRATEGY', label: 'Strategy Doc', icon: FileText},
                                {id: 'ASSETS', label: 'Brand Assets', icon: ImageIcon},
                                {id: 'LOGINS', label: 'Credentials', icon: Key},
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setHubTab(tab.id as any)}
                                    className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-bold transition-all ${hubTab === tab.id ? 'bg-sadaya-gold text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <tab.icon className="w-4 h-4 mr-3"/> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto bg-[#0f172a] p-8 custom-scrollbar">
                        {/* 1. STRATEGY DOC TAB */}
                        {hubTab === 'STRATEGY' && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                {/* Admin Controls / Client Status Header */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                                    <h3 className="text-xl font-headline font-bold">Marketing Strategy v1.0</h3>
                                    <div className="flex gap-3">
                                        {canEdit && activeProposal.marketingData.status !== StrategyStatus.APPROVED && activeProposal.marketingData.status !== StrategyStatus.LIVE && (
                                            <button onClick={handleAdminApproval} className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors text-sm">
                                                Approve for Client View
                                            </button>
                                        )}
                                        {currentUser?.role === UserRole.CLIENT && activeProposal.marketingData.status === StrategyStatus.APPROVED && (
                                            <>
                                                <button onClick={() => setShowRejectModal(true)} className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-bold">Request Changes</button>
                                                <button onClick={handleClientAcceptance} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded-lg hover:bg-white transition-colors text-sm shadow-lg">Accept Strategy</button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Modification Request Note Display */}
                                {activeProposal.marketingData.status === StrategyStatus.MODIFICATION_REQUESTED && (
                                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl text-orange-200 text-sm">
                                        <strong className="block mb-1 font-bold flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> Client Feedback:</strong>
                                        "{activeProposal.marketingData.feedbackHistory[activeProposal.marketingData.feedbackHistory.length - 1].note}"
                                    </div>
                                )}

                                {/* THE DOCUMENT VIEW */}
                                {(activeProposal.marketingData.status === StrategyStatus.PENDING_APPROVAL && currentUser?.role === UserRole.CLIENT) ? (
                                    <div className="h-96 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-black/20 text-slate-500">
                                        <Lock className="w-12 h-12 mb-4 opacity-50"/>
                                        <h3 className="text-xl font-bold text-white mb-2">Strategy Pending Approval</h3>
                                        <p className="max-w-md text-center">Our team is finalizing the strategy document based on your inputs. You will be notified once it is ready for review.</p>
                                    </div>
                                ) : (
                                    <div className="glass-panel p-8 rounded-2xl border border-white/10 min-h-[600px] font-body text-slate-300 space-y-8">
                                        {/* Mock Rendering of the Strategy JSON */}
                                        {activeProposal.marketingData.content && (
                                            <>
                                                <div>
                                                    <h4 className="text-sadaya-gold font-bold uppercase text-sm mb-2">Executive Summary</h4>
                                                    {canEdit ? (
                                                        <textarea 
                                                            className="w-full bg-black/40 border border-white/10 rounded p-4 text-white min-h-[150px] outline-none focus:border-sadaya-gold"
                                                            value={activeProposal.marketingData.content.executiveSummary}
                                                            onChange={(e) => handleAdminSaveEdits({...activeProposal.marketingData!.content!, executiveSummary: e.target.value})}
                                                        />
                                                    ) : (
                                                        <p className="leading-relaxed">{activeProposal.marketingData.content.executiveSummary}</p>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div>
                                                        <h4 className="text-sadaya-gold font-bold uppercase text-sm mb-2">Target Audience</h4>
                                                        <p className="text-sm border border-white/5 p-4 rounded-lg bg-black/20">{activeProposal.marketingData.content.targetAudience}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sadaya-gold font-bold uppercase text-sm mb-2">Brand Voice</h4>
                                                        <p className="text-sm border border-white/5 p-4 rounded-lg bg-black/20">{activeProposal.marketingData.content.brandVoice}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. ASSETS TAB */}
                        {hubTab === 'ASSETS' && (
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-2xl font-headline font-bold mb-6">Brand Assets</h3>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1 glass-panel p-6 rounded-xl text-center">
                                        <h4 className="text-slate-400 text-xs font-bold uppercase mb-4">Color Palette</h4>
                                        <div className="flex justify-center gap-4">
                                            {activeProposal.marketingData.assets.filter(a => a.type === 'color').map((c, i) => (
                                                <div key={i}>
                                                    <div className="w-16 h-16 rounded-full shadow-lg border border-white/10 mb-2" style={{backgroundColor: c.value}}></div>
                                                    <span className="text-xs font-mono text-slate-500">{c.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-1 glass-panel p-6 rounded-xl text-center">
                                        <h4 className="text-slate-400 text-xs font-bold uppercase mb-4">Typography</h4>
                                        <div className="text-3xl font-display text-white mb-2">Aa</div>
                                        <div className="text-sm text-sadaya-gold font-bold">{activeProposal.marketingData.assets.find(a => a.type === 'font')?.value || 'Sans-Serif'}</div>
                                    </div>
                                    <div className="col-span-1 glass-panel p-6 rounded-xl text-center flex flex-col items-center justify-center">
                                        <h4 className="text-slate-400 text-xs font-bold uppercase mb-4">Rebranding Status</h4>
                                        {activeProposal.marketingData.rebrandingRequired ? (
                                            <span className="text-yellow-400 font-bold flex items-center"><Sparkles className="w-4 h-4 mr-2"/> Rebranding Active</span>
                                        ) : (
                                            <span className="text-green-400 font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-2"/> Brand Locked</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. LOGINS TAB */}
                        {hubTab === 'LOGINS' && (
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-2xl font-headline font-bold mb-6">Secured Credentials</h3>
                                <div className="glass-panel rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-slate-400 font-bold border-b border-white/10">
                                            <tr><th className="p-4">Platform</th><th className="p-4">Username</th><th className="p-4">Status</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {activeProposal.marketingData.credentials.map((c, i) => (
                                                <tr key={i}>
                                                    <td className="p-4 font-bold text-white">{c.platform}</td>
                                                    <td className="p-4 font-mono text-slate-300">{c.username}</td>
                                                    <td className="p-4"><span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded">Encrypted</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 4. PROPOSAL & INVOICE TABS - Simplified View */}
                        {(hubTab === 'PROPOSAL' || hubTab === 'INVOICE') && (
                            <div className="max-w-4xl mx-auto text-center text-slate-500 py-20 border border-dashed border-white/10 rounded-xl">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                                <p>Detailed {hubTab.toLowerCase()} view is available in the respective Core Engine module.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Change Request Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] border border-white/10 p-6 rounded-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Request Changes</h3>
                        <p className="text-sm text-slate-400 mb-4">Please detail what needs to be adjusted in the strategy document.</p>
                        <textarea 
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white h-32 focus:border-sadaya-gold outline-none mb-4"
                            placeholder="Enter your feedback here..."
                            value={modificationNote}
                            onChange={(e) => setModificationNote(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleRequestModification} className="px-4 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors text-sm">Submit Request</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .btn-primary {
                    @apply px-6 py-3 bg-gradient-to-r from-sadaya-gold to-sadaya-tan text-white font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform;
                }
            `}</style>
        </div>
    );
};
