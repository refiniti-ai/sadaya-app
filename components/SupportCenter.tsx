import React, { useState, useEffect, useRef } from 'react';
import { SupportTicket, TicketMessage, User, UserRole, Organization } from '../types';
import { 
  MessageSquare, Plus, Search, Archive, MoreHorizontal, Send, 
  CheckCircle, Clock, User as UserIcon, Building, ArrowLeft, RefreshCw, X
} from 'lucide-react';

interface SupportCenterProps {
    tickets: SupportTicket[];
    setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
    currentUser: User;
    organizations: Organization[];
}

export const SupportCenter: React.FC<SupportCenterProps> = ({ tickets, setTickets, currentUser, organizations }) => {
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [filter, setFilter] = useState<'Active' | 'Archived'>('Active');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyInput, setReplyInput] = useState('');
    
    // Modal State for New Ticket
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [newTicketForm, setNewTicketForm] = useState({ subject: '', priority: 'Medium' as 'High' | 'Medium' | 'Low', description: '' });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filter Logic
    const visibleTickets = tickets.filter(t => {
        // Filter by Active/Archived
        const matchesStatus = filter === 'Active' 
            ? (t.status === 'Open' || t.status === 'Resolved') 
            : t.status === 'Archived';
        
        // Filter by Role Permission
        if (currentUser.role === UserRole.CLIENT) {
            // Clients only see their own tickets (or tickets for their organization if we tracked orgId on user, but for now strict client id check)
            // Assuming simplified model where client sees tickets they created. 
            // Better: Filter by Organization. Finding org of current user:
            const userOrg = organizations.find(o => o.users.some(u => u.id === currentUser.id));
            if (userOrg) {
                return matchesStatus && t.organizationName === userOrg.name;
            }
            return matchesStatus && t.clientId === currentUser.id;
        }
        
        // Employees/Admins see all
        return matchesStatus;
    });

    const activeTicket = tickets.find(t => t.id === selectedTicketId);

    // Scroll to bottom of chat
    useEffect(() => {
        if (viewMode === 'detail') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTicket?.messages, viewMode]);

    // -- Actions --

    const handleCreateTicket = () => {
        if (!newTicketForm.subject || !newTicketForm.description) return;

        const userOrg = organizations.find(o => o.users.some(u => u.id === currentUser.id));

        const newTicket: SupportTicket = {
            id: `TCK-${Date.now()}`,
            clientId: currentUser.id,
            clientName: currentUser.name,
            organizationName: userOrg ? userOrg.name : 'Unknown Org',
            subject: newTicketForm.subject,
            status: 'Open',
            priority: newTicketForm.priority,
            createdAt: new Date().toLocaleDateString(),
            lastUpdated: 'Just now',
            messages: [
                {
                    id: `msg-${Date.now()}`,
                    senderId: currentUser.id,
                    senderName: currentUser.name,
                    text: newTicketForm.description,
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    isAdmin: false
                }
            ]
        };

        setTickets([newTicket, ...tickets]);
        setIsNewTicketOpen(false);
        setNewTicketForm({ subject: '', priority: 'Medium', description: '' });
    };

    const handleReply = () => {
        if (!replyInput.trim() || !activeTicket) return;

        const newMessage: TicketMessage = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: replyInput,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            isAdmin: currentUser.role !== UserRole.CLIENT
        };

        const updatedTicket = {
            ...activeTicket,
            messages: [...activeTicket.messages, newMessage],
            lastUpdated: 'Just now',
            status: activeTicket.status === 'Resolved' ? 'Open' : activeTicket.status // Reopen if replied to
        } as SupportTicket;

        setTickets(tickets.map(t => t.id === activeTicket.id ? updatedTicket : t));
        setReplyInput('');
    };

    const updateStatus = (status: 'Open' | 'Resolved' | 'Archived') => {
        if (!activeTicket) return;
        setTickets(tickets.map(t => t.id === activeTicket.id ? { ...t, status } : t));
        if (status === 'Archived') {
            setViewMode('list');
            setSelectedTicketId(null);
        }
    };

    // -- Views --

    if (viewMode === 'list') {
        return (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-6">
                    <div>
                        <h2 className="text-3xl font-headline font-light text-white mb-2">Support Center</h2>
                        <p className="text-slate-400 font-body font-thin text-lg">Manage inquiries and technical support tickets.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                            <button onClick={() => setFilter('Active')} className={`px-4 py-2 rounded-md text-sm font-headline transition-all ${filter === 'Active' ? 'bg-sadaya-gold text-black font-bold' : 'text-slate-400 hover:text-white'}`}>Active</button>
                            <button onClick={() => setFilter('Archived')} className={`px-4 py-2 rounded-md text-sm font-headline transition-all ${filter === 'Archived' ? 'bg-sadaya-gold text-black font-bold' : 'text-slate-400 hover:text-white'}`}>Archived</button>
                        </div>
                        {currentUser.role === UserRole.CLIENT && (
                            <button 
                                onClick={() => setIsNewTicketOpen(true)}
                                className="bg-white text-black px-6 py-3 rounded-lg font-headline font-medium hover:bg-sadaya-gold transition-colors flex items-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                <Plus className="w-5 h-5 mr-2"/> New Ticket
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {visibleTickets.map(ticket => (
                        <div 
                            key={ticket.id} 
                            onClick={() => { setSelectedTicketId(ticket.id); setViewMode('detail'); }}
                            className="glass-panel p-6 rounded-xl cursor-pointer hover:bg-white/5 transition-all group border border-white/10 hover:border-sadaya-gold/30"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${ticket.status === 'Open' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : ticket.status === 'Resolved' ? 'bg-slate-500' : 'bg-orange-500'}`}></span>
                                    <h3 className="text-lg font-bold text-white font-headline group-hover:text-sadaya-gold transition-colors">{ticket.subject}</h3>
                                    <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400 font-mono">{ticket.id}</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                    ticket.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    ticket.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>{ticket.priority}</span>
                            </div>
                            
                            <div className="flex justify-between items-end mt-4">
                                <div className="text-sm text-slate-400 font-body font-light">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building className="w-4 h-4"/> 
                                        <span className="text-white font-medium">{ticket.organizationName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3"/> Last updated: {ticket.lastUpdated}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500">Requested by</div>
                                        <div className="text-sm text-white">{ticket.clientName}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {visibleTickets.length === 0 && (
                        <div className="p-12 text-center border border-dashed border-white/10 rounded-xl text-slate-500 font-body font-light">
                            No {filter.toLowerCase()} tickets found.
                        </div>
                    )}
                </div>

                {/* New Ticket Modal */}
                {isNewTicketOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-headline text-white font-bold">Submit New Ticket</h2>
                                <button onClick={() => setIsNewTicketOpen(false)}><X className="w-6 h-6 text-slate-500 hover:text-white"/></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Subject</label>
                                    <input 
                                        value={newTicketForm.subject}
                                        onChange={(e) => setNewTicketForm({...newTicketForm, subject: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-sadaya-gold outline-none"
                                        placeholder="Brief summary of the issue..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Priority</label>
                                    <select 
                                        value={newTicketForm.priority}
                                        onChange={(e) => setNewTicketForm({...newTicketForm, priority: e.target.value as any})}
                                        className="w-full bg-[#0f172a] border border-white/10 rounded p-3 text-white focus:border-sadaya-gold outline-none"
                                    >
                                        <option value="Low">Low - General Inquiry</option>
                                        <option value="Medium">Medium - Feature Request / Minor Issue</option>
                                        <option value="High">High - Critical Issue / Blocker</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Description</label>
                                    <textarea 
                                        value={newTicketForm.description}
                                        onChange={(e) => setNewTicketForm({...newTicketForm, description: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded p-3 text-white h-32 focus:border-sadaya-gold outline-none resize-none"
                                        placeholder="Detailed explanation..."
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                                <button onClick={() => setIsNewTicketOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                                <button 
                                    onClick={handleCreateTicket}
                                    className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                >
                                    Submit Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (viewMode === 'detail' && activeTicket) {
        return (
            <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-500 relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('list')} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5"/>
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-bold text-white font-headline">{activeTicket.subject}</h2>
                                <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400 font-mono">{activeTicket.id}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center"><Building className="w-3 h-3 mr-1"/> {activeTicket.organizationName}</span>
                                <span className="flex items-center"><UserIcon className="w-3 h-3 mr-1"/> {activeTicket.clientName}</span>
                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {activeTicket.createdAt}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {activeTicket.status !== 'Archived' ? (
                            <>
                                {activeTicket.status === 'Open' ? (
                                    <button onClick={() => updateStatus('Resolved')} className="px-3 py-1.5 border border-green-500/30 text-green-400 bg-green-500/10 rounded text-xs font-bold hover:bg-green-500/20 flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1.5"/> Mark Resolved
                                    </button>
                                ) : (
                                    <button onClick={() => updateStatus('Open')} className="px-3 py-1.5 border border-white/10 text-slate-300 bg-white/5 rounded text-xs font-bold hover:bg-white/10 flex items-center">
                                        <RefreshCw className="w-3 h-3 mr-1.5"/> Reopen Ticket
                                    </button>
                                )}
                                <button onClick={() => updateStatus('Archived')} className="px-3 py-1.5 border border-white/10 text-slate-400 hover:text-white rounded text-xs font-bold hover:bg-white/5 flex items-center">
                                    <Archive className="w-3 h-3 mr-1.5"/> Archive
                                </button>
                            </>
                        ) : (
                            <button onClick={() => updateStatus('Open')} className="px-3 py-1.5 border border-sadaya-gold/30 text-sadaya-gold bg-sadaya-gold/10 rounded text-xs font-bold hover:bg-sadaya-gold/20 flex items-center">
                                <RefreshCw className="w-3 h-3 mr-1.5"/> Restore to Open
                            </button>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-black/20 rounded-xl border border-white/5 mb-4">
                    {activeTicket.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${msg.senderId === currentUser.id ? 'order-1' : 'order-2'}`}>
                                <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                                    msg.senderId === currentUser.id 
                                    ? 'bg-sadaya-gold/10 border border-sadaya-gold/20 text-white rounded-tr-none' 
                                    : 'bg-white/10 border border-white/5 text-slate-200 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                                <div className={`text-[10px] text-slate-500 mt-1 flex gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    <span className="font-bold">{msg.senderName} {msg.isAdmin && '(Staff)'}</span>
                                    <span>{msg.timestamp}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                {activeTicket.status !== 'Archived' ? (
                    <div className="p-4 glass-panel rounded-xl border border-white/10">
                        <div className="relative">
                            <textarea 
                                value={replyInput}
                                onChange={(e) => setReplyInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReply();
                                    }
                                }}
                                className="w-full bg-black/40 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:border-sadaya-gold focus:outline-none resize-none h-14"
                                placeholder="Type your reply..."
                            />
                            <button 
                                onClick={handleReply}
                                className="absolute right-3 top-3 text-slate-400 hover:text-sadaya-gold transition-colors"
                            >
                                <Send className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
                        This ticket is archived. Reopen it to send a reply.
                    </div>
                )}
            </div>
        );
    }

    return null;
};