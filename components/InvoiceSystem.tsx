import React, { useState, useEffect } from 'react';
import { Invoice, User, UserRole } from '../types';
import { generateInvoiceEmail } from '../services/geminiService';
import { 
  Download, CreditCard, Mail, Plus, FileText, 
  CheckCircle, ChevronLeft, Loader2, Send, Save, Trash2, Edit2, Calendar
} from 'lucide-react';

interface InvoiceSystemProps {
    invoices: Invoice[];
    onUpdateInvoices: (invoices: Invoice[]) => void;
    organizations: Organization[];
    individuals: User[];
    currentUser: User;
}

export const InvoiceSystem: React.FC<InvoiceSystemProps> = ({ 
    invoices, onUpdateInvoices, organizations, individuals, currentUser 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'edit'>('list');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [emailDraft, setEmailDraft] = useState<{subject: string, body: string} | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const ALL_CLIENTS = [
    ...organizations.map(o => o.name),
    ...individuals.map(i => i.name),
    'Sadaya Sanctuary Internal'
  ];

  // Form State for Create/Edit
  const [formData, setFormData] = useState<Partial<Invoice>>({
      clientName: '',
      type: 'One-Time',
      terms: 'Net 30',
      items: [{ description: '', cost: 0 }]
  });

  const getToday = () => new Date().toISOString().split('T')[0];

  const calculateDueDate = (issueDate: string, terms: string): string => {
      if (!issueDate) return '';
      const date = new Date(issueDate);
      if (terms === 'Net 14') date.setDate(date.getDate() + 14);
      if (terms === 'Net 30') date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0];
  };

  const handleCreateNew = () => {
      setFormData({
          id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          clientName: ALL_CLIENTS[0],
          type: 'One-Time',
          terms: 'Immediate',
          status: 'Draft',
          issueDate: getToday(),
          dueDate: getToday(),
          items: [{ description: 'Service Fee', cost: 1000 }]
      });
      setViewMode('edit');
  };

  const handleEditDraft = (invoice: Invoice) => {
      setFormData({ ...invoice });
      setViewMode('edit');
  };

  const handleDeleteInvoice = (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      // Immediate delete, no confirm
      onUpdateInvoices(invoices.filter(i => i.id !== id));
      if (activeInvoice && activeInvoice.id === id) {
          setActiveInvoice(null);
          setViewMode('list');
      }
  };

  const handleFormChange = (field: keyof Invoice, value: any) => {
      setFormData(prev => {
          const newData = { ...prev, [field]: value };
          
          // Auto-calculate Due Date if Terms or Issue Date changes
          if (field === 'terms' || field === 'issueDate') {
              const baseDate = field === 'issueDate' ? value : prev.issueDate;
              const term = field === 'terms' ? value : prev.terms;
              newData.dueDate = calculateDueDate(baseDate || getToday(), term || 'Immediate');
          }
          return newData;
      });
  };

  const updateLineItem = (index: number, field: 'description' | 'cost', value: any) => {
      const newItems = [...(formData.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addLineItem = () => {
      setFormData(prev => ({ ...prev, items: [...(prev.items || []), { description: '', cost: 0 }] }));
  };

  const removeLineItem = (index: number) => {
      setFormData(prev => ({ ...prev, items: (prev.items || []).filter((_, i) => i !== index) }));
  };

  const calculateTotal = () => {
      return (formData.items || []).reduce((sum, item) => sum + Number(item.cost), 0);
  };

  const handleSaveDraft = () => {
      const total = calculateTotal();
      const newInvoice = { 
          ...formData, 
          amount: total, 
          status: 'Draft' 
      } as Invoice;
      
      const exists = invoices.find(i => i.id === newInvoice.id);
      if (exists) {
          onUpdateInvoices(invoices.map(i => i.id === newInvoice.id ? newInvoice : i));
      } else {
          onUpdateInvoices([newInvoice, ...invoices]);
      }
      setViewMode('list');
  };

  const handleApproveAndSend = () => {
      const total = calculateTotal();
      const today = getToday();
      const newInvoice = { 
          ...formData, 
          amount: total, 
          status: 'Pending',
          issueDate: today, // Set issue date to now on approval
          dueDate: calculateDueDate(today, formData.terms || 'Immediate')
      } as Invoice;

      const exists = invoices.find(i => i.id === newInvoice.id);
      if (exists) {
          onUpdateInvoices(invoices.map(i => i.id === newInvoice.id ? newInvoice : i));
      } else {
          onUpdateInvoices([newInvoice, ...invoices]);
      }
      setViewMode('list');
  };

  const prepareEmail = async (inv: Invoice) => {
    setIsGeneratingEmail(true);
    const draft = await generateInvoiceEmail(inv.clientName, inv.id, inv.amount, inv.dueDate);
    setEmailDraft(draft);
    setIsGeneratingEmail(false);
  };

  const sendEmail = () => {
    alert("Email sent successfully via Varia Agent.");
    setEmailDraft(null);
  };

  const handlePay = (id: string) => {
    onUpdateInvoices(invoices.map(inv => inv.id === id ? {...inv, status: 'Paid'} : inv));
    if (activeInvoice && activeInvoice.id === id) {
        setActiveInvoice({...activeInvoice, status: 'Paid'});
    }
  };

  const canEdit = currentUser.role !== UserRole.CLIENT;

  // --- RENDER: EDIT FORM ---
  if (viewMode === 'edit') {
      return (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-white transition-colors"><ChevronLeft/></button>
                      <h2 className="text-2xl font-headline font-bold text-white">
                          {formData.status === 'Draft' ? 'Edit Draft Invoice' : 'New Invoice'}
                      </h2>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={handleSaveDraft} className="px-4 py-2 border border-white/20 text-slate-300 rounded hover:bg-white/10 flex items-center text-sm font-headline">
                          <Save className="w-4 h-4 mr-2"/> Save as Draft
                      </button>
                      <button onClick={handleApproveAndSend} className="px-4 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors flex items-center text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] font-headline">
                          <Send className="w-4 h-4 mr-2"/> Approve & Send
                      </button>
                  </div>
              </div>

              <div className="glass-panel p-8 rounded-2xl flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Invoice ID</label>
                          <input disabled value={formData.id} className="w-full bg-white/5 border border-white/10 rounded p-2 text-slate-400 font-mono text-sm"/>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Issue Date (Autoset on Send)</label>
                          <input disabled value={formData.issueDate || getToday()} className="w-full bg-white/5 border border-white/10 rounded p-2 text-slate-400 font-mono text-sm"/>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Bill To Organization</label>
                          <select 
                              value={formData.clientName} 
                              onChange={(e) => handleFormChange('clientName', e.target.value)}
                              className="w-full bg-[#0f172a] border border-white/10 rounded p-2 text-white focus:border-sadaya-gold outline-none"
                          >
                              {ALL_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Payment Terms</label>
                              <select 
                                  value={formData.terms} 
                                  onChange={(e) => handleFormChange('terms', e.target.value)}
                                  className="w-full bg-[#0f172a] border border-white/10 rounded p-2 text-white focus:border-sadaya-gold outline-none"
                              >
                                  <option value="Immediate">Immediate</option>
                                  <option value="Net 14">Net 14</option>
                                  <option value="Net 30">Net 30</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Due Date</label>
                              <div className="w-full bg-white/5 border border-white/10 rounded p-2 text-sadaya-gold font-mono text-sm flex items-center">
                                  <Calendar className="w-4 h-4 mr-2"/>
                                  {formData.dueDate}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="mb-8">
                      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                          <h3 className="font-headline font-bold text-white">Line Items</h3>
                          <button onClick={addLineItem} className="text-xs text-sadaya-gold hover:underline flex items-center">
                              <Plus className="w-3 h-3 mr-1"/> Add Item
                          </button>
                      </div>
                      <div className="space-y-3">
                          {formData.items?.map((item, idx) => (
                              <div key={idx} className="flex gap-4 items-center">
                                  <div className="flex-1">
                                      <input 
                                          placeholder="Description"
                                          value={item.description}
                                          onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                                          className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm focus:border-sadaya-gold outline-none"
                                      />
                                  </div>
                                  <div className="w-32">
                                      <input 
                                          type="number"
                                          placeholder="Cost"
                                          value={item.cost}
                                          onChange={(e) => updateLineItem(idx, 'cost', Number(e.target.value))}
                                          className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm text-right focus:border-sadaya-gold outline-none"
                                      />
                                  </div>
                                  <button onClick={() => removeLineItem(idx)} className="text-slate-500 hover:text-red-400">
                                      <Trash2 className="w-4 h-4"/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="flex justify-end border-t border-white/10 pt-6">
                      <div className="w-64">
                          <div className="flex justify-between text-slate-400 mb-2">
                              <span>Subtotal</span>
                              <span>${calculateTotal().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-white font-bold text-xl">
                              <span>Total Due</span>
                              <span className="text-sadaya-gold">${calculateTotal().toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: LIST VIEW ---
  if (viewMode === 'list' && !activeInvoice) {
      return (
        <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-end border-b border-white/10 pb-6">
            <div>
                <h2 className="text-3xl font-headline font-light text-white mb-2">Financial Ledger</h2>
                <p className="text-slate-400 font-body font-thin text-lg">Manage invoices, automate collections, and track revenue.</p>
            </div>
            {canEdit && (
                <button 
                    onClick={handleCreateNew}
                    className="bg-white text-black px-6 py-3 rounded-lg font-headline font-medium hover:bg-sadaya-gold transition-colors flex items-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    <Plus className="w-5 h-5 mr-2"/> Create New Invoice
                </button>
            )}
          </div>
    
          <div className="glass-panel rounded-2xl overflow-hidden flex-1 border border-white/10">
            <table className="w-full text-left">
                <thead className="bg-black/40 text-slate-500 text-xs font-headline font-bold uppercase tracking-widest">
                    <tr>
                        <th className="p-6">Invoice ID</th>
                        <th className="p-6">Client Organization</th>
                        <th className="p-6">Type</th>
                        <th className="p-6">Total Value</th>
                        <th className="p-6">Status</th>
                        <th className="p-6">Due Date</th>
                        <th className="p-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-body font-light">
                    {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setActiveInvoice(inv)}>
                            <td className="p-6 font-headline text-sadaya-gold">{inv.id}</td>
                            <td className="p-6 text-white text-base">{inv.clientName}</td>
                            <td className="p-6 text-slate-400">{inv.type}</td>
                            <td className="p-6 text-white font-headline text-xl">${inv.amount.toLocaleString()}</td>
                            <td className="p-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${
                                    inv.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    inv.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                    inv.status === 'Draft' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                    {inv.status}
                                </span>
                            </td>
                            <td className="p-6 text-slate-400">{inv.dueDate}</td>
                            <td className="p-6 text-right">
                                <div className="flex justify-end space-x-2">
                                    {canEdit && inv.status === 'Draft' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditDraft(inv); }}
                                            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4"/>
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button 
                                            onClick={(e) => handleDeleteInvoice(inv.id, e)}
                                            className="p-2 hover:bg-red-500/10 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                                            title="Delete Invoice"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      );
  }

  // --- RENDER: DETAIL VIEW ---
  if (activeInvoice) {
      return (
        <div className="h-full flex flex-col relative animate-in slide-in-from-right-8 duration-500">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => {setActiveInvoice(null); setEmailDraft(null);}} className="flex items-center text-slate-400 hover:text-white transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10">
                        <ChevronLeft className="w-5 h-5"/>
                    </div>
                    <span className="font-headline font-light text-lg">Back to Ledger</span>
                </button>
                
                <div className="flex items-center gap-3">
                    {canEdit && (
                        <button 
                            onClick={(e) => handleDeleteInvoice(activeInvoice.id, e)}
                            className="px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 flex items-center font-bold text-sm"
                        >
                            <Trash2 className="w-4 h-4 mr-2"/> Delete
                        </button>
                    )}
                    {canEdit && activeInvoice.status === 'Draft' ? (
                        <button 
                            onClick={() => handleEditDraft(activeInvoice)}
                            className="px-5 py-2.5 bg-sadaya-gold text-black rounded-lg hover:bg-white transition-colors flex items-center font-headline font-bold text-sm"
                        >
                            <Edit2 className="w-4 h-4 mr-2"/> Edit Draft
                        </button>
                    ) : canEdit && (
                        <>
                            <button 
                                onClick={() => prepareEmail(activeInvoice)}
                                className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors flex items-center font-headline font-light text-sm"
                            >
                                <Mail className="w-4 h-4 mr-2"/> Email Client
                            </button>
                            <button className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors flex items-center font-headline font-light text-sm">
                                <Download className="w-4 h-4 mr-2"/> PDF
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* INVOICE PAPER */}
                    <div className="lg:col-span-2">
                        <div className="glass-panel p-1 rounded-[24px] border border-white/10">
                            <div className="bg-[#080c14] rounded-[20px] p-10 relative overflow-hidden">
                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-sadaya-gold/5 blur-[80px] rounded-full pointer-events-none"></div>
                                
                                {/* Header */}
                                <div className="flex justify-between items-start mb-16 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                             <span className="text-3xl font-headline font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sadaya-gold to-sadaya-tan">
                                                SADAYA SANCTUARY
                                             </span>
                                             <span className="text-3xl font-headline font-light text-slate-500">AI</span>
                                        </div>
                                        <div className="text-slate-400 font-body font-thin text-sm leading-relaxed">
                                            Sadaya Sanctuary Operations<br/>
                                            123 Healing Lane<br/>
                                            Wellness Valley, CA 90210<br/>
                                            hello@sadayasanctuary.com
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h1 className="text-5xl font-headline font-light text-white mb-2">INVOICE</h1>
                                        <p className="text-sadaya-gold font-mono text-lg tracking-widest">#{activeInvoice.id}</p>
                                        <div className="mt-6 space-y-1">
                                            <div className="flex justify-end gap-4 text-sm font-body font-thin">
                                                <span className="text-slate-500">Issued:</span>
                                                <span className="text-slate-200">{activeInvoice.issueDate || 'Draft'}</span>
                                            </div>
                                            <div className="flex justify-end gap-4 text-sm font-body font-thin">
                                                <span className="text-slate-500">Due Date:</span>
                                                <span className="text-slate-200">{activeInvoice.dueDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bill To */}
                                <div className="mb-16 border-t border-white/5 pt-8">
                                    <h3 className="text-xs font-headline font-bold uppercase tracking-widest text-slate-500 mb-4">Bill To</h3>
                                    <h2 className="text-2xl font-headline font-medium text-white mb-2">{activeInvoice.clientName}</h2>
                                    <p className="text-slate-400 font-body font-thin text-sm">
                                        Attn: Accounts Payable<br/>
                                        {activeInvoice.clientName} HQ<br/>
                                        client@example.com
                                    </p>
                                </div>

                                {/* Line Items */}
                                <div className="mb-12">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10 text-left">
                                                <th className="py-4 text-xs font-headline font-bold uppercase tracking-widest text-slate-500 w-1/2">Description</th>
                                                <th className="py-4 text-xs font-headline font-bold uppercase tracking-widest text-slate-500 text-right">Qty</th>
                                                <th className="py-4 text-xs font-headline font-bold uppercase tracking-widest text-slate-500 text-right">Price</th>
                                                <th className="py-4 text-xs font-headline font-bold uppercase tracking-widest text-slate-500 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {activeInvoice.items.map((item, i) => (
                                                <tr key={i}>
                                                    <td className="py-6 font-body font-light text-white">{item.description}</td>
                                                    <td className="py-6 font-body font-thin text-slate-400 text-right">1</td>
                                                    <td className="py-6 font-mono font-light text-slate-300 text-right">${item.cost.toLocaleString()}</td>
                                                    <td className="py-6 font-mono font-medium text-white text-right">${item.cost.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="flex justify-end mb-16">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between text-sm font-body font-thin text-slate-400">
                                            <span>Subtotal</span>
                                            <span>${activeInvoice.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-body font-thin text-slate-400">
                                            <span>Tax (0%)</span>
                                            <span>$0.00</span>
                                        </div>
                                        <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                                            <span className="font-headline font-bold text-white">Total Due</span>
                                            <span className="font-headline font-light text-3xl text-sadaya-gold">${activeInvoice.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-white/5 pt-8">
                                    <h4 className="font-headline font-medium text-white mb-2">Payment Terms: {activeInvoice.terms || 'Net 30'}</h4>
                                    <p className="font-body font-thin text-slate-400 text-sm max-w-lg mb-8">
                                        Payment is due within {activeInvoice.terms === 'Immediate' ? '0' : activeInvoice.terms === 'Net 14' ? '14' : '30'} days of the issue date.
                                    </p>
                                    {activeInvoice.status === 'Pending' && (
                                        <button 
                                            onClick={() => handlePay(activeInvoice.id)}
                                            className="w-full bg-[#635BFF] hover:bg-[#5851E0] text-white py-4 rounded-lg font-headline font-medium flex justify-center items-center transition-all shadow-lg"
                                        >
                                            <CreditCard className="w-5 h-5 mr-3"/> Pay via Stripe
                                        </button>
                                    )}
                                    {activeInvoice.status === 'Paid' && (
                                        <div className="w-full bg-green-500/10 border border-green-500/20 text-green-400 py-4 rounded-lg font-headline font-medium flex justify-center items-center">
                                            <CheckCircle className="w-5 h-5 mr-3"/> Paid in Full
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR: EMAIL AI */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Status Card */}
                        <div className="glass-panel p-6 rounded-2xl border-t-4 border-sadaya-gold">
                            <h3 className="font-headline font-light text-slate-400 text-sm uppercase mb-1">Invoice Status</h3>
                            <div className="text-3xl font-headline font-medium text-white mb-4">{activeInvoice.status}</div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm font-body font-thin border-b border-white/5 pb-2">
                                    <span className="text-slate-500">Sent to Client</span>
                                    <span className="text-slate-300">{activeInvoice.status === 'Draft' ? 'No' : 'Yes'}</span>
                                </div>
                                <div className="flex justify-between text-sm font-body font-thin border-b border-white/5 pb-2">
                                    <span className="text-slate-500">Terms</span>
                                    <span className="text-slate-300">{activeInvoice.terms || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Email Composer (Only if not Draft) */}
                        {activeInvoice.status !== 'Draft' && canEdit && (
                            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-sadaya-gold animate-pulse"></div>
                                    <h3 className="font-headline font-bold text-white">Varia Email Agent</h3>
                                </div>

                                {!emailDraft && !isGeneratingEmail && (
                                    <div className="text-center py-8">
                                        <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4"/>
                                        <p className="text-slate-400 font-body font-thin text-sm mb-6">
                                            Generate a personalized email for this invoice using Varia intelligence.
                                        </p>
                                        <button 
                                            onClick={() => prepareEmail(activeInvoice)}
                                            className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-sadaya-gold/50 text-white rounded-lg transition-all font-headline font-light text-sm"
                                        >
                                            Generate Draft
                                        </button>
                                    </div>
                                )}

                                {isGeneratingEmail && (
                                    <div className="text-center py-12">
                                        <Loader2 className="w-8 h-8 text-sadaya-gold animate-spin mx-auto mb-4"/>
                                        <p className="text-slate-300 font-headline font-light">Drafting communication...</p>
                                    </div>
                                )}

                                {emailDraft && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                                                <input 
                                                    value={emailDraft.subject} 
                                                    onChange={(e) => setEmailDraft({...emailDraft, subject: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white font-body font-light mt-1 focus:border-sadaya-gold outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Body</label>
                                                <textarea 
                                                    value={emailDraft.body}
                                                    onChange={(e) => setEmailDraft({...emailDraft, body: e.target.value})}
                                                    rows={8}
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white font-body font-thin mt-1 focus:border-sadaya-gold outline-none resize-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setEmailDraft(null)} className="flex-1 py-3 border border-white/10 text-slate-400 rounded-lg hover:text-white transition-colors font-headline font-light text-sm">Discard</button>
                                            <button onClick={sendEmail} className="flex-1 py-3 bg-sadaya-gold text-black rounded-lg hover:bg-white transition-colors font-headline font-medium text-sm flex justify-center items-center shadow-lg shadow-cyan-900/20">
                                                <Send className="w-4 h-4 mr-2"/> Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeInvoice.status === 'Draft' && (
                            <div className="glass-panel p-6 rounded-2xl flex items-center justify-center text-center text-slate-500 border-dashed border-slate-700">
                                Invoice is currently in Draft mode.<br/>Approve to enable emailing.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return null;
};