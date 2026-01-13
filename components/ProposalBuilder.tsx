import React, { useState, useEffect } from 'react';
import { Proposal, ProposalStatus, ProposalContent, Organization, User, UserRole } from '../types';
import { generateProposalContent } from '../services/geminiService';
import { 
  Loader2, Send, CheckCircle, FileText, Edit3, 
  Trash2, Copy, Plus, ChevronDown, ChevronUp,
  BrainCircuit, Users, Filter, DollarSign, Database,
  Eye, Save, X, ChevronLeft, Building, UserCheck, Globe, MinusCircle, Lock
} from 'lucide-react';

interface ProposalBuilderProps {
  organizations: Organization[];
  proposals: Proposal[];
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  onSave: () => void;
  currentUser: User;
  onProposalAccepted: (id: string) => void;
}

// ... (AccordionItem same as before)
interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isEditing?: boolean;
  onTitleChange?: (val: string) => void;
  onDelete?: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, defaultOpen = false, isEditing, onTitleChange, onDelete }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/10 rounded-xl bg-[#0f172a]/80 backdrop-blur-md overflow-hidden mb-3 shadow-lg">
      <div 
        className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors text-left"
      >
        {isEditing ? (
            <div className="flex-1 flex items-center gap-2 mr-4">
                 <input 
                    value={title}
                    onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-white font-bold w-full focus:border-sadaya-gold outline-none"
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Strategy Title"
                />
                {onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                        className="p-2 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Strategy Item"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        ) : (
            <button onClick={() => setIsOpen(!isOpen)} className="flex-1 text-left font-display font-bold text-white text-sm tracking-wide">
                {title}
            </button>
        )}
        <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronUp className="w-4 h-4 text-sadaya-gold"/> : <ChevronDown className="w-4 h-4 text-slate-500"/>}
        </button>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-white/10 text-sm text-slate-300 bg-black/40">
          {children}
        </div>
      )}
    </div>
  );
};

export const ProposalBuilder: React.FC<ProposalBuilderProps> = ({ organizations, proposals, setProposals, onSave, currentUser, onProposalAccepted }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'preview'>('list');
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  
  // State for Create Form
  const [formData, setFormData] = useState({
    selectedOrgId: '',
    selectedUserIds: [] as string[],
    clientName: '',
    industry: '',
    website: '',
    selectedServices: [] as string[],
    notes: ''
  });
  
  // State for generated content
  const [generatedContent, setGeneratedContent] = useState<ProposalContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for Editing
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const SERVICES_LIST = [
    "Website Development", "Branding Identity", "Asset Generation", 
    "Video Production (Animated)", "Video Editing (Live Action)",
    "Social Media Management", "Paid Ads", "CRM & Automation Setup",
    "Cold Email Campaigns", "Sales Funnel Architecture"
  ];

  const canEdit = currentUser.permissions.includes('edit_proposals');

  // Actions
  const handleProposalClick = (p: Proposal) => {
    setActiveProposalId(p.id);
    setGeneratedContent(p.content);
    setIsEditingContent(false);
    setViewMode('preview');
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Immediate delete, no confirm
    // Force a new array reference to ensure state update triggers re-render
    setProposals(prev => [...prev.filter(p => p.id !== id)]);
    if (activeProposalId === id) {
        setViewMode('list');
        setActiveProposalId(null);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter(s => s !== service)
        : [...prev.selectedServices, service]
    }));
  };

  const handleOrgSelection = (orgId: string) => {
      const org = organizations.find(o => o.id === orgId);
      if (org) {
          setFormData(prev => ({
              ...prev,
              selectedOrgId: orgId,
              clientName: org.name,
              industry: org.industry,
              website: `https://www.${org.name.toLowerCase().replace(/\s/g, '')}.com`, 
              selectedUserIds: []
          }));
      } else {
           setFormData(prev => ({...prev, selectedOrgId: orgId, clientName: '', industry: '', website: '', selectedUserIds: []}));
      }
  };

  const toggleUserSelection = (userId: string) => {
      setFormData(prev => ({
          ...prev,
          selectedUserIds: prev.selectedUserIds.includes(userId) 
            ? prev.selectedUserIds.filter(id => id !== userId)
            : [...prev.selectedUserIds, userId]
      }));
  };

  const handleGenerate = async () => {
    if (!formData.selectedOrgId) {
        alert("Please select an organization.");
        return;
    }
    setIsGenerating(true);
    setViewMode('preview');
    
    // Call Gemini
    const result = await generateProposalContent(
      formData.clientName,
      formData.industry,
      formData.selectedServices,
      formData.notes
    );
    
    setGeneratedContent(result.content);
    setIsGenerating(false);
    setIsEditingContent(true);
  };

  const saveProposalState = (status: ProposalStatus) => {
    if (!generatedContent) return;
    
    // Calculate totals
    const upfront = generatedContent.investment.reduce((acc, item) => acc + item.costInitial, 0);
    const retainer = generatedContent.investment.reduce((acc, item) => acc + item.costMonthly, 0);

    const updatedProposal: Proposal = {
        id: activeProposalId || Date.now().toString(),
        clientId: formData.selectedOrgId || (activeProposalId ? proposals.find(p=>p.id===activeProposalId)?.clientId || '' : ''),
        clientName: formData.clientName || (activeProposalId ? proposals.find(p=>p.id===activeProposalId)?.clientName || '' : ''),
        clientEmail: organizations.find(o => o.id === formData.selectedOrgId)?.users.filter(u => formData.selectedUserIds.includes(u.id)).map(u => u.email).join(', '),
        services: formData.selectedServices.length > 0 ? formData.selectedServices : (activeProposalId ? proposals.find(p=>p.id===activeProposalId)?.services || [] : []),
        customDetails: formData.notes,
        estimatedUpfront: upfront,
        estimatedRetainer: retainer,
        content: generatedContent,
        status: status,
        createdAt: activeProposalId ? (proposals.find(p=>p.id===activeProposalId)?.createdAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    };

    if (activeProposalId) {
        setProposals(prev => prev.map(p => p.id === activeProposalId ? updatedProposal : p));
    } else {
        setProposals(prev => [updatedProposal, ...prev]);
        setActiveProposalId(updatedProposal.id);
    }
    
    return updatedProposal;
  };

  const handleSaveDraft = () => {
      if (!canEdit) return;
      setSaveState('saving');
      setTimeout(() => {
          saveProposalState(ProposalStatus.DRAFT);
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
      }, 800);
  };

  const handleSendToClient = () => {
      if (!canEdit) return;
      saveProposalState(ProposalStatus.SENT_TO_CLIENT);
      setIsEditingContent(false);
      alert(`Proposal Sent to Client Portal.`);
      setViewMode('list');
      setFormData({ selectedOrgId: '', selectedUserIds: [], clientName: '', industry: '', website: '', selectedServices: [], notes: '' });
      setActiveProposalId(null);
  };

  const handleAcceptProposal = () => {
      if (activeProposalId) {
          onProposalAccepted(activeProposalId);
      }
  };

  // --- Editing Functions (Generic logic mostly same) ---

  const handleUpdateContent = (section: keyof ProposalContent, key: string, value: any, idx?: number, subkey?: string) => {
      if (!generatedContent || !canEdit) return;
      // ... same logic
      const newContent = { ...generatedContent };
      if (section === 'hero' || section === 'engine') {
          // @ts-ignore
          newContent[section][key] = value;
      } 
      else if (section === 'investment' && idx !== undefined && subkey) {
           // @ts-ignore
           newContent.investment[idx][subkey] = subkey.includes('cost') ? Number(value) : value;
      }
      else if (section === 'adSpend' && idx !== undefined && subkey) {
           // @ts-ignore
           newContent.adSpend[idx][subkey] = value;
      }
      else if (section === 'phases' && idx !== undefined && subkey === 'title') {
           newContent.phases[idx].title = value;
      }
      else if (section === 'phases' && idx !== undefined && subkey === 'description') {
           newContent.phases[idx].description = value;
      }
      else if (section === 'strategy' && idx !== undefined && subkey) {
           // @ts-ignore
           newContent.strategy[idx][subkey] = value;
      }
      setGeneratedContent(newContent);
  };

  const updatePhaseItem = (phaseIdx: number, itemIdx: number, val: string) => {
      if (!generatedContent || !canEdit) return;
      const newPhases = [...generatedContent.phases];
      newPhases[phaseIdx].items[itemIdx] = val;
      setGeneratedContent({ ...generatedContent, phases: newPhases });
  };

  const deletePhaseItem = (phaseIdx: number, itemIdx: number) => {
      if (!generatedContent || !canEdit) return;
      const newPhases = [...generatedContent.phases];
      newPhases[phaseIdx].items = newPhases[phaseIdx].items.filter((_, i) => i !== itemIdx);
      setGeneratedContent({ ...generatedContent, phases: newPhases });
  };

  const addPhase = () => {
      if (!generatedContent || !canEdit) return;
      const newPhase = { title: 'New Phase', description: 'Description of the phase objectives.', items: ['Deliverable 1'] };
      setGeneratedContent({ ...generatedContent, phases: [...generatedContent.phases, newPhase] });
  };

  const deletePhase = (phaseIdx: number) => {
      if (!generatedContent || !canEdit) return;
      // Immediate delete, no confirm
      const newPhases = generatedContent.phases.filter((_, i) => i !== phaseIdx);
      setGeneratedContent({ ...generatedContent, phases: newPhases });
  };

  const addInvestmentItem = () => {
      if (!generatedContent || !canEdit) return;
      const newItem = { item: 'New Item', costInitial: 0, costMonthly: 0 };
      setGeneratedContent({ ...generatedContent, investment: [...generatedContent.investment, newItem] });
  };

  const deleteInvestmentItem = (idx: number) => {
      if (!generatedContent || !canEdit) return;
      const newInv = generatedContent.investment.filter((_, i) => i !== idx);
      setGeneratedContent({ ...generatedContent, investment: newInv });
  };

  const addAdSpendItem = () => {
      if (!generatedContent || !canEdit) return;
      const newItem = { phase: 'New Phase', monthlySpend: '$0', targetCPL: '$0', expectedLeads: '0' };
      setGeneratedContent({ ...generatedContent, adSpend: [...generatedContent.adSpend, newItem] });
  };

  const deleteAdSpendItem = (idx: number) => {
      if (!generatedContent || !canEdit) return;
      const newAdSpend = generatedContent.adSpend.filter((_, i) => i !== idx);
      setGeneratedContent({ ...generatedContent, adSpend: newAdSpend });
  };

  const addStrategyItem = () => {
      if (!generatedContent || !canEdit) return;
      const newItem = { title: 'New Strategy Point', content: 'Details about this strategic initiative.' };
      setGeneratedContent({ ...generatedContent, strategy: [...generatedContent.strategy, newItem] });
  };

  const deleteStrategyItem = (idx: number) => {
      if (!generatedContent || !canEdit) return;
      // Immediate delete, no confirm
      const newStrat = generatedContent.strategy.filter((_, i) => i !== idx);
      setGeneratedContent({ ...generatedContent, strategy: newStrat });
  };

  // --- Render Views ---

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-3xl font-headline font-light text-white">Proposal Intelligence</h2>
             <p className="text-slate-400 font-body font-thin">Manage client agreements and generate new strategies.</p>
           </div>
           {canEdit && (
               <button 
                 onClick={() => {
                     setActiveProposalId(null);
                     setFormData({ selectedOrgId: '', selectedUserIds: [], clientName: '', industry: '', website: '', selectedServices: [], notes: '' });
                     setViewMode('create');
                 }}
                 className="px-6 py-2 bg-gradient-to-r from-sadaya-gold to-sadaya-tan text-white font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center hover:opacity-90 transition-all font-headline"
               >
                 <Plus className="w-4 h-4 mr-2" /> Initialize Proposal
               </button>
           )}
        </div>

        <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-400 text-xs uppercase font-headline font-bold">
              <tr>
                <th className="p-4">Client</th>
                <th className="p-4">Created</th>
                <th className="p-4">Services</th>
                <th className="p-4">Value</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-body font-light">
              {proposals.map(p => (
                <tr 
                    key={p.id} 
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => handleProposalClick(p)}
                >
                  <td className="p-4 font-bold text-white group-hover:text-sadaya-gold transition-colors">{p.clientName}</td>
                  <td className="p-4 text-slate-400">{p.createdAt}</td>
                  <td className="p-4 text-slate-300 truncate max-w-[200px]">{p.services.join(', ')}</td>
                  <td className="p-4 text-sadaya-gold font-mono">${p.estimatedUpfront.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      p.status === ProposalStatus.ACCEPTED ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      p.status === ProposalStatus.DRAFT ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                     {canEdit && (
                         <button 
                            onClick={(e) => handleDelete(p.id, e)} 
                            className="p-2 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400" 
                            title="Delete"
                         >
                             <Trash2 className="w-4 h-4"/>
                         </button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {proposals.length === 0 && <div className="p-8 text-center text-slate-500">No proposals found. Initialize the engine.</div>}
        </div>
      </div>
    );
  }

  // ... (Create mode follows same canEdit pattern implicitly since button is hidden)
  if (viewMode === 'create' && canEdit) {
     const selectedOrg = organizations.find(o => o.id === formData.selectedOrgId);
     return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* ... Form Content ... */}
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-white text-sm uppercase font-bold tracking-wider">← Back</button>
            <h2 className="text-2xl font-display text-white font-headline">Initialize New Proposal</h2>
          </div>
          <div className="glass-panel p-8 rounded-2xl border-t border-sadaya-gold/30 shadow-[0_0_40px_rgba(6,182,212,0.05)]">
             {/* ... Form Inputs ... */}
             <div className="grid grid-cols-2 gap-6 mb-6">
                 {/* ... Inputs ... */}
                 <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm text-slate-400 font-medium">Organization</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                        <select 
                            value={formData.selectedOrgId}
                            onChange={(e) => handleOrgSelection(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg font-body font-light appearance-none text-white focus:border-sadaya-gold outline-none bg-[#0f172a]"
                        >
                            <option value="">Select Organization...</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                  {/* ... other inputs ... */}
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm text-slate-400 font-medium">Website (Autofill)</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                        <input 
                            type="text" 
                            readOnly
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/40 border border-white/10 text-slate-400 font-mono text-sm cursor-not-allowed"
                            placeholder="https://..."
                            value={formData.website}
                        />
                    </div>
                  </div>
             </div>
             {/* ... Services, Notes ... */}
             <div className="mb-8">
               <label className="text-sm text-slate-400 font-medium mb-3 block">Product Suite Requirement</label>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {SERVICES_LIST.map(service => (
                   <button
                     key={service}
                     onClick={() => toggleService(service)}
                     className={`text-left px-4 py-3 rounded-lg text-sm border transition-all duration-300 font-body ${
                       formData.selectedServices.includes(service)
                         ? 'bg-sadaya-tan/20 border-sadaya-gold text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                         : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-500'
                     }`}
                   >
                     {service}
                   </button>
                 ))}
               </div>
             </div>
             <div className="space-y-2 mb-8">
               <label className="text-sm text-slate-400 font-medium">Discovery Notes (Gemini Context)</label>
               <textarea 
                 className="w-full px-4 py-3 rounded-lg glass-input min-h-[120px] font-body font-light"
                 placeholder="Paste meeting notes or specific goals here..."
                 value={formData.notes}
                 onChange={(e) => setFormData({...formData, notes: e.target.value})}
               />
             </div>
             <div className="flex justify-end">
              <button 
                onClick={handleGenerate}
                disabled={!formData.selectedOrgId}
                className="px-8 py-4 bg-white text-black font-display font-bold rounded-lg hover:bg-sadaya-gold hover:text-white transition-all duration-300 flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-headline"
              >
                <FileText className="w-5 h-5 mr-2" />
                GENERATE PROPOSAL
              </button>
            </div>
          </div>
        </div>
     );
  }

  // --- PREVIEW / EDIT MODE ---
  
  if (isGenerating || !generatedContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 animate-pulse">
        <div className="relative">
          <div className="absolute inset-0 bg-sadaya-sage blur-xl opacity-20 animate-ping"></div>
          <Loader2 className="w-16 h-16 text-sadaya-sage animate-spin relative z-10" />
        </div>
        <h3 className="text-xl font-display text-sadaya-gold tracking-wider font-headline">VARIA IS THINKING...</h3>
        <p className="text-slate-400 font-body font-light">Analyzing industry trends and formulating strategy</p>
      </div>
    );
  }

  const currentStatus = activeProposalId ? proposals.find(p => p.id === activeProposalId)?.status : ProposalStatus.DRAFT;
  const isEditable = (currentStatus === ProposalStatus.DRAFT || currentStatus === ProposalStatus.SENT_TO_CLIENT) && canEdit;

  return (
    <div className="h-full flex flex-col relative">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-sadaya-forest/90 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center mb-6">
         <div className="flex items-center gap-4">
             <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-white flex items-center gap-2 font-headline"><ChevronLeft className="w-4 h-4"/> Back to List</button>
             {isEditable ? (
                 <button 
                    onClick={() => setIsEditingContent(!isEditingContent)} 
                    className={`text-sm font-bold px-3 py-1 rounded border transition-colors ${isEditingContent ? 'bg-sadaya-gold text-black border-sadaya-gold' : 'text-slate-400 border-white/20 hover:text-white'}`}
                >
                    {isEditingContent ? 'Editing Enabled' : 'Enable Editing'}
                </button>
             ) : (
                <div className="flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded border border-yellow-500/20">
                    <Lock className="w-3 h-3 mr-2"/> {currentStatus === ProposalStatus.ACCEPTED ? 'Proposal Accepted & Locked' : 'Read Only View'}
                </div>
             )}
         </div>
         
         {/* Only show actions if canEdit */}
         {canEdit && (
             <div className="flex gap-3">
                 {activeProposalId && (
                    <button 
                        onClick={(e) => handleDelete(activeProposalId, e)}
                        className="p-2 border border-red-500/20 text-red-400 rounded hover:bg-red-500/10 flex items-center text-sm"
                        title="Delete Proposal Permanently"
                    >
                        <Trash2 className="w-4 h-4"/>
                    </button>
                 )}

                 <button 
                    onClick={handleSaveDraft}
                    disabled={saveState !== 'idle' || !isEditable}
                    className={`px-4 py-2 border text-sm rounded flex items-center transition-all duration-300 font-headline ${
                        saveState === 'saved' ? 'border-green-500 text-green-400 bg-green-500/10' : 
                        saveState === 'saving' ? 'border-sadaya-gold text-sadaya-gold bg-sadaya-gold/10' : 
                        'border-white/20 text-slate-300 hover:bg-white/10 disabled:opacity-50'
                    }`}
                 >
                     {saveState === 'saving' ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : 
                      saveState === 'saved' ? <CheckCircle className="w-4 h-4 mr-2"/> : 
                      <Save className="w-4 h-4 mr-2"/>}
                     {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save Draft'}
                 </button>

                {(currentStatus === ProposalStatus.SENT_TO_CLIENT || currentStatus === ProposalStatus.ACCEPTED) ? (
                    <div className="px-6 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded font-bold flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2"/> {currentStatus}
                    </div>
                ) : (
                    <button 
                        onClick={handleSendToClient} 
                        className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)] font-headline flex items-center"
                    >
                        <Send className="w-4 h-4 mr-2"/> Send to Client
                    </button>
                )}
             </div>
         )}
      </div>

      {/* The Proposal Document - Render Logic uses isEditingContent state which is only toggleable if canEdit is true */}
      <div className="max-w-4xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
         <div className="glass-panel p-1 rounded-3xl border border-white/10 overflow-hidden bg-black/40">
            <div className="bg-[#050a14] p-8 md:p-12 rounded-[22px]">
                {/* ... Header ... */}
                <div className="text-center mb-12">
                    {isEditingContent ? (
                        <div className="space-y-4 mb-6">
                            <input 
                                className="w-full bg-black/50 text-center text-4xl text-white font-headline border border-white/20 rounded p-2 focus:border-sadaya-gold outline-none"
                                value={generatedContent.hero.title}
                                onChange={(e) => handleUpdateContent('hero', 'title', e.target.value)}
                            />
                            <input 
                                className="w-full bg-black/50 text-center text-slate-400 font-body border border-white/20 rounded p-2 focus:border-sadaya-gold outline-none"
                                value={generatedContent.hero.subtitle}
                                onChange={(e) => handleUpdateContent('hero', 'subtitle', e.target.value)}
                            />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-tight font-headline">
                            {generatedContent.hero.title}
                            </h1>
                            {/* ... */}
                            <h2 className="text-2xl md:text-3xl font-display text-transparent bg-clip-text bg-gradient-to-r from-sadaya-gold to-sadaya-tan neon-text mb-6 font-headline">
                            Sadaya Strategic Plan
                            </h2>
                            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base font-body font-light">
                            {generatedContent.hero.subtitle}
                            </p>
                        </>
                    )}
                </div>
                
                {/* ... Engine Card ... */}
                <div className="grid md:grid-cols-12 gap-8 mb-12 items-center">
                    <div className="md:col-span-5 text-sm text-slate-300 space-y-4 font-body font-light">
                        <h3 className="text-white font-bold font-display text-lg font-headline">The Sadaya Path</h3>
                        {isEditingContent ? (
                             <textarea 
                                className="w-full bg-black/50 text-slate-300 border border-white/20 rounded p-2 h-32 focus:border-sadaya-gold outline-none resize-none"
                                value={generatedContent.engine.description}
                                onChange={(e) => handleUpdateContent('engine', 'description', e.target.value)}
                            />
                        ) : (
                            <p>{generatedContent.engine.description}</p>
                        )}
                    </div>
                    {/* ... Visuals ... */}
                    <div className="md:col-span-7">
                        <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group">
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-sadaya-gold/20 blur-3xl rounded-full"></div>
                             {/* ... Icons ... */}
                             <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5"><Users className="w-4 h-4 text-slate-500"/></div>
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5"><Filter className="w-4 h-4 text-slate-500"/></div>
                             </div>

                             <div className="text-center relative z-10">
                                 <BrainCircuit className="w-12 h-12 text-sadaya-gold mx-auto mb-2 animate-pulse"/>
                                 <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Sadaya Integration</span>
                                 <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-sadaya-gold to-transparent mx-auto mt-2"></div>
                             </div>

                             <div className="text-center relative z-10">
                                 <div className="w-10 h-10 rounded-full bg-sadaya-gold/20 flex items-center justify-center mx-auto mb-2 border border-sadaya-gold/50">
                                     <DollarSign className="w-5 h-5 text-sadaya-gold"/>
                                 </div>
                                 <div className="text-xl font-display font-bold text-green-400 font-mono">
                                     {isEditingContent ? (
                                         <input 
                                            type="number"
                                            className="bg-transparent text-center w-24 border-b border-white/20 outline-none text-green-400"
                                            value={generatedContent.engine.generatedValue}
                                            onChange={(e) => handleUpdateContent('engine', 'generatedValue', e.target.value)}
                                         />
                                     ) : (
                                        `$${generatedContent.engine.generatedValue.toLocaleString()}`
                                     )}
                                 </div>
                                 <div className="text-[8px] uppercase text-slate-500">Generated Value</div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* ... Phases ... */}
                <div className="space-y-8 mb-12">
                   {generatedContent.phases.map((phase, idx) => (
                      <div key={idx} className="bg-slate-900/20 p-4 rounded-xl border border-white/5 relative group">
                          {isEditingContent && (
                              <button 
                                onClick={() => deletePhase(idx)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 bg-black/20 rounded hover:bg-black/40"
                              >
                                  <Trash2 className="w-4 h-4"/>
                              </button>
                          )}
                          {isEditingContent ? (
                              <div className="mb-4 space-y-2 pr-10">
                                  <input 
                                    className="w-full bg-transparent font-display text-white text-xl font-bold border-b border-white/10 focus:border-sadaya-gold outline-none"
                                    value={phase.title}
                                    onChange={(e) => handleUpdateContent('phases', 'title', e.target.value, idx, 'title')}
                                  />
                                  <input 
                                    className="w-full bg-transparent text-sm text-slate-400 border-b border-white/10 focus:border-sadaya-gold outline-none"
                                    value={phase.description}
                                    onChange={(e) => handleUpdateContent('phases', 'description', e.target.value, idx, 'description')}
                                  />
                              </div>
                          ) : (
                              <>
                                <h3 className="text-xl font-display text-white mb-2 font-headline">{phase.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 font-body font-light">{phase.description}</p>
                              </>
                          )}
                          
                          <div className="border-t border-white/5 pt-4">
                              <h4 className="text-xs uppercase text-slate-500 font-bold mb-2">Deliverables</h4>
                              <ul className="space-y-2">
                                  {phase.items.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 font-body font-light">
                                          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-sadaya-gold flex-shrink-0"></div>
                                          {isEditingContent ? (
                                              <div className="flex-1 flex gap-2 items-center">
                                                  <input 
                                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-slate-300 focus:border-sadaya-gold outline-none"
                                                    value={item}
                                                    onChange={(e) => updatePhaseItem(idx, i, e.target.value)}
                                                  />
                                                  <button onClick={() => deletePhaseItem(idx, i)} className="text-slate-600 hover:text-red-400">
                                                      <Trash2 className="w-4 h-4"/>
                                                  </button>
                                              </div>
                                          ) : (
                                              <span>{item}</span>
                                          )}
                                      </li>
                                  ))}
                                  {isEditingContent && (
                                      <button 
                                        onClick={() => {
                                            const newPhases = [...generatedContent.phases];
                                            newPhases[idx].items.push("New Deliverable");
                                            setGeneratedContent({...generatedContent, phases: newPhases});
                                        }}
                                        className="text-xs text-sadaya-gold flex items-center hover:underline mt-2"
                                      >
                                          <Plus className="w-3 h-3 mr-1"/> Add Deliverable
                                      </button>
                                  )}
                              </ul>
                          </div>
                      </div>
                   ))}
                   {isEditingContent && (
                       <button 
                         onClick={addPhase}
                         className="w-full py-6 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:text-sadaya-gold hover:border-sadaya-gold/30 hover:bg-white/5 transition-all flex items-center justify-center font-bold font-headline"
                       >
                           <Plus className="w-5 h-5 mr-2"/> Add New Phase
                       </button>
                   )}
                </div>
                
                {/* ... Investment Summary ... */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-display text-white font-headline">Investment Summary</h3>
                        {isEditingContent && (
                            <button onClick={addInvestmentItem} className="text-xs text-sadaya-gold hover:underline flex items-center">
                                <Plus className="w-3 h-3 mr-1"/> Add Item
                            </button>
                        )}
                    </div>
                    {/* ... Table logic ... */}
                    <div className="w-full overflow-hidden rounded-xl border border-white/10 font-sans text-sm">
                        <div className={`grid ${isEditingContent ? 'grid-cols-4' : 'grid-cols-3'} bg-sadaya-gold text-black font-bold uppercase tracking-wider text-xs py-3 px-4`}>
                            <div>Item</div>
                            <div>Cost (Initial)</div>
                            <div>Cost (Monthly)</div>
                            {isEditingContent && <div className="text-center">Action</div>}
                        </div>
                        <div className="bg-slate-900/60 divide-y divide-white/5">
                            {generatedContent.investment.map((row, i) => (
                                <div key={i} className={`grid ${isEditingContent ? 'grid-cols-4' : 'grid-cols-3'} py-3 px-4 items-center hover:bg-white/5 transition-colors`}>
                                    {isEditingContent ? (
                                        <>
                                            <input value={row.item} onChange={(e) => handleUpdateContent('investment', '', e.target.value, i, 'item')} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white w-full mr-2"/>
                                            <input type="number" value={row.costInitial} onChange={(e) => handleUpdateContent('investment', '', e.target.value, i, 'costInitial')} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-green-400 w-full mr-2"/>
                                            <input type="number" value={row.costMonthly} onChange={(e) => handleUpdateContent('investment', '', e.target.value, i, 'costMonthly')} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-green-400 w-full"/>
                                            <div className="text-center">
                                                <button onClick={() => deleteInvestmentItem(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4 mx-auto"/></button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-white font-medium">{row.item}</div>
                                            <div className="text-green-400 font-mono">${row.costInitial.toLocaleString()}</div>
                                            <div className="text-green-400 font-mono">${row.costMonthly.toLocaleString()}/mo</div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className={`bg-slate-900/40 border border-t-0 border-white/10 rounded-b-xl p-4 grid ${isEditingContent ? 'grid-cols-4' : 'grid-cols-3'}`}>
                         <div className="font-bold text-white font-headline">Totals</div>
                         <div className="font-bold text-green-400 font-mono">${generatedContent.investment.reduce((a,b) => a + b.costInitial, 0).toLocaleString()}</div>
                         <div className="font-bold text-green-400 font-mono">${generatedContent.investment.reduce((a,b) => a + b.costMonthly, 0).toLocaleString()}/mo</div>
                     </div>
                </div>

                {/* ... Strategy Section ... */}
                <div className="mb-12">
                    <h3 className="text-xl font-display text-white mb-2 font-headline">Sadaya Strategy</h3>
                    <div className="space-y-2">
                        {generatedContent.strategy.map((s, i) => (
                            <AccordionItem 
                                key={i} 
                                title={s.title} 
                                isEditing={isEditingContent}
                                onTitleChange={(val) => handleUpdateContent('strategy', '', val, i, 'title')}
                                onDelete={isEditingContent ? () => deleteStrategyItem(i) : undefined}
                            >
                                {isEditingContent ? (
                                    <textarea 
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-slate-300 min-h-[100px] outline-none focus:border-sadaya-gold"
                                        value={s.content}
                                        onChange={(e) => handleUpdateContent('strategy', '', e.target.value, i, 'content')}
                                    />
                                ) : (
                                    <p className="font-body font-light">{s.content}</p>
                                )}
                            </AccordionItem>
                        ))}
                    </div>
                    {isEditingContent && (
                        <button 
                            onClick={addStrategyItem}
                            className="mt-4 w-full py-4 border border-dashed border-white/10 rounded-lg text-slate-400 hover:text-sadaya-gold hover:bg-white/5 transition-all flex items-center justify-center font-bold text-sm uppercase tracking-wide"
                        >
                            <Plus className="w-4 h-4 mr-2"/> Add Strategy Point
                        </button>
                    )}
                </div>

                {/* ... Ad Spend Table ... */}
                <div className="mb-8">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-display text-white font-headline">Ad Spend & Performance Targets</h3>
                        {isEditingContent && (
                            <button onClick={addAdSpendItem} className="text-xs text-sadaya-gold hover:underline flex items-center">
                                <Plus className="w-3 h-3 mr-1"/> Add Phase
                            </button>
                        )}
                     </div>
                     <div className="w-full overflow-hidden rounded-xl border border-white/10 font-sans text-sm">
                        <div className={`grid ${isEditingContent ? 'grid-cols-5' : 'grid-cols-4'} bg-sadaya-gold text-black font-bold uppercase tracking-wider text-xs py-3 px-4`}>
                            <div>Phase</div>
                            <div>Spend</div>
                            <div>CPL Target</div>
                            <div>Leads</div>
                            {isEditingContent && <div className="text-center">Action</div>}
                        </div>
                        <div className="bg-slate-900/60 divide-y divide-white/5">
                            {generatedContent.adSpend.map((row, i) => (
                                <div key={i} className={`grid ${isEditingContent ? 'grid-cols-5' : 'grid-cols-4'} py-3 px-4 items-center hover:bg-white/5 transition-colors`}>
                                    {isEditingContent ? (
                                        <>
                                            <input value={row.phase} onChange={(e) => handleUpdateContent('adSpend', '', e.target.value, i, 'phase')} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white w-full mr-1"/>
                                            <input value={row.monthlySpend} onChange={(e) => handleUpdateContent('adSpend', '', e.target.value, i, 'monthlySpend')} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-green-400 w-full mr-1"/>
                                            <input value={row.targetCPL} onChange={(e) => handleUpdateContent('adSpend', '', e.target.value, i, 'targetCPL')} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-green-400 w-full mr-1"/>
                                            <input value={row.expectedLeads} onChange={(e) => handleUpdateContent('adSpend', '', e.target.value, i, 'expectedLeads')} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sadaya-gold w-full"/>
                                            <div className="text-center">
                                                <button onClick={() => deleteAdSpendItem(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4 mx-auto"/></button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-white">{row.phase}</div>
                                            <div className="text-green-400 font-mono">{row.monthlySpend}</div>
                                            <div className="text-green-400 font-mono">{row.targetCPL}</div>
                                            <div className="text-sadaya-gold font-mono">{row.expectedLeads}</div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Client Acceptance CTA */}
                {currentUser.role === UserRole.CLIENT && currentStatus === ProposalStatus.SENT_TO_CLIENT && (
                    <div className="mt-16 pt-12 border-t border-white/10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20">
                            <CheckCircle className="w-8 h-8 text-green-500"/>
                        </div>
                        <h3 className="text-2xl font-display text-white mb-4 font-headline">Ready to Initialize?</h3>
                        <p className="text-slate-400 font-body font-light mb-8 max-w-lg leading-relaxed">
                            By accepting this strategic plan, you authorize Sadaya Sanctuary to begin the infrastructure setup and healing path generation phases as outlined above.
                        </p>
                        <button 
                            onClick={handleAcceptProposal}
                            className="group relative px-8 py-4 bg-green-500 text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-100 group-hover:opacity-90 transition-opacity"></div>
                            <span className="relative flex items-center font-headline text-lg tracking-wide">
                                ACCEPT PROPOSAL <CheckCircle className="w-5 h-5 ml-3"/>
                            </span>
                        </button>
                    </div>
                )}

            </div>
         </div>
      </div>
    </div>
  );
};