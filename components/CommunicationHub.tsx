import React, { useState, useEffect, useRef } from 'react';
import { User, Organization, ChatChannel, ChatMessage, UserRole } from '../types';
import { 
  Hash, Lock, Plus, Search, MoreVertical, Send, 
  Smile, Paperclip, Users, Trash2, X, Settings, 
  ChevronDown, CheckCircle, AtSign, Building
} from 'lucide-react';

interface CommunicationHubProps {
    organizations: Organization[];
    teamMembers: User[];
    currentUser: User;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({ 
    organizations, teamMembers, currentUser 
}) => {
    // --- STATE ---
    
    // Org Scope
    const availableOrgs = currentUser.role === UserRole.CLIENT
        ? organizations.filter(o => o.users.some(u => u.id === currentUser.id))
        : organizations; // Employees see all for now, or filter by assignedEmployees if desired
    
    const [activeOrgId, setActiveOrgId] = useState<string>(availableOrgs[0]?.id || '');
    const activeOrg = organizations.find(o => o.id === activeOrgId);

    // Initial Data Mocking (In a real app, this comes from backend filtered by Org)
    const [channels, setChannels] = useState<ChatChannel[]>([
        { id: 'c1', orgId: 'org1', name: 'general', type: 'public', members: [] },
        { id: 'c2', orgId: 'org1', name: 'project-alpha', type: 'private', members: ['1', '2', 'c1'] },
        { id: 'c3', orgId: 'org2', name: 'general', type: 'public', members: [] },
    ]);

    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'm1', channelId: 'c1', senderId: '1', senderName: 'Varia Admin', text: 'Welcome to the secure comms channel.', timestamp: '10:00 AM' },
        { id: 'm2', channelId: 'c2', senderId: '2', senderName: 'Sarah Designer', text: 'Hey @John Apex, designs are ready.', timestamp: '11:30 AM', mentions: ['c1'] }
    ]);

    const [activeChannelId, setActiveChannelId] = useState<string>('');
    const [messageInput, setMessageInput] = useState('');
    
    // Modals
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [showManageMembers, setShowManageMembers] = useState(false);
    
    // Forms
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');

    // Mention State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number>(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // --- COMPUTED ---

    // Filtered Content
    const orgChannels = channels.filter(c => c.orgId === activeOrgId);
    
    // Automatically select first channel if none selected
    useEffect(() => {
        if (orgChannels.length > 0 && !orgChannels.find(c => c.id === activeChannelId)) {
            setActiveChannelId(orgChannels[0].id);
        }
    }, [activeOrgId, orgChannels, activeChannelId]);

    const activeChannel = channels.find(c => c.id === activeChannelId);
    const channelMessages = messages.filter(m => m.channelId === activeChannelId);

    // All Users in this Org (Team Members + Org Clients)
    const orgUsers = [
        ...teamMembers.filter(m => m.role === UserRole.SUPER_ADMIN || activeOrg?.assignedEmployees?.includes(m.id)),
        ...(activeOrg?.users || [])
    ];

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeChannelId]);

    // --- HANDLERS ---

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            channelId: activeChannelId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: messageInput,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mentions: [] // TODO: Parse mentions from text if needed for notifications
        };

        setMessages([...messages, newMessage]);
        setMessageInput('');
        setMentionQuery(null);
    };

    const handleCreateChannel = () => {
        if (!newChannelName.trim()) return;
        const newChan: ChatChannel = {
            id: `c-${Date.now()}`,
            orgId: activeOrgId,
            name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
            type: newChannelType,
            members: [currentUser.id]
        };
        setChannels([...channels, newChan]);
        setActiveChannelId(newChan.id);
        setShowCreateChannel(false);
        setNewChannelName('');
    };

    const handleDeleteChannel = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this channel?')) {
            setChannels(prev => prev.filter(c => c.id !== id));
            if (activeChannelId === id) setActiveChannelId('');
        }
    };

    const toggleChannelMember = (userId: string) => {
        if (!activeChannel) return;
        
        const currentMembers = activeChannel.members || [];
        let updatedMembers;
        
        if (currentMembers.includes(userId)) {
            updatedMembers = currentMembers.filter(id => id !== userId);
        } else {
            updatedMembers = [...currentMembers, userId];
        }

        setChannels(channels.map(c => c.id === activeChannel.id ? { ...c, members: updatedMembers } : c));
    };

    // Mention Logic
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMessageInput(val);

        const lastAt = val.lastIndexOf('@');
        if (lastAt !== -1) {
            // Check if there's a space after the @ (invalid mention start)
            const textAfterAt = val.substring(lastAt + 1);
            if (!textAfterAt.includes(' ')) {
                setMentionQuery(textAfterAt);
                setMentionIndex(lastAt);
                return;
            }
        }
        setMentionQuery(null);
    };

    const insertMention = (userName: string) => {
        if (mentionIndex === -1) return;
        const before = messageInput.substring(0, mentionIndex);
        const after = messageInput.substring(mentionIndex + (mentionQuery?.length || 0) + 1); // +1 for @
        setMessageInput(`${before}@${userName} ${after}`);
        setMentionQuery(null);
        inputRef.current?.focus();
    };

    const getMentionCandidates = () => {
        if (!mentionQuery) return [];
        return orgUsers.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()));
    };

    // --- RENDER ---

    return (
        <div className="h-full flex bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden animate-in fade-in">
            {/* SIDEBAR */}
            <div className="w-64 bg-black/20 border-r border-white/10 flex flex-col">
                {/* Org Switcher */}
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <select 
                            value={activeOrgId}
                            onChange={(e) => setActiveOrgId(e.target.value)}
                            className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-2 pl-9 text-sm text-white appearance-none outline-none focus:border-sadaya-gold font-bold"
                        >
                            {availableOrgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                        </select>
                        <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none"/>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Channels */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2 group px-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Channels</span>
                            <button onClick={() => setShowCreateChannel(true)} className="text-slate-500 hover:text-white"><Plus className="w-4 h-4"/></button>
                        </div>
                        <div className="space-y-0.5">
                            {orgChannels.map(channel => (
                                <div 
                                    key={channel.id}
                                    onClick={() => setActiveChannelId(channel.id)}
                                    className={`group flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${activeChannelId === channel.id ? 'bg-sadaya-gold/20 text-white font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        {channel.type === 'private' ? <Lock className="w-3 h-3"/> : <Hash className="w-3 h-3"/>}
                                        <span className="truncate">{channel.name}</span>
                                    </div>
                                    {currentUser.role !== UserRole.CLIENT && (
                                        <button onClick={(e) => handleDeleteChannel(channel.id, e)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400">
                                            <X className="w-3 h-3"/>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Direct Messages (Simulated as users list for now) */}
                    <div>
                        <div className="flex justify-between items-center mb-2 px-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Direct Messages</span>
                            <Plus className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white"/>
                        </div>
                        <div className="space-y-0.5">
                            {orgUsers.filter(u => u.id !== currentUser.id).map(u => (
                                <div key={u.id} className="flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200">
                                    <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                                    <span className="truncate">{u.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col relative bg-[#0f172a]">
                {activeChannel ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 bg-white/5 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                {activeChannel.type === 'private' ? <Lock className="w-5 h-5 text-slate-400"/> : <Hash className="w-5 h-5 text-slate-400"/>}
                                <h2 className="font-bold text-white text-lg">{activeChannel.name}</h2>
                                {activeChannel.type === 'private' && <span className="text-xs border border-white/10 px-2 py-0.5 rounded text-slate-400">Private</span>}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {activeChannel.members.slice(0, 3).map((mid, i) => {
                                        const mem = orgUsers.find(u => u.id === mid);
                                        return mem ? (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#0f172a] flex items-center justify-center text-xs text-white font-bold" title={mem.name}>
                                                {mem.name.charAt(0)}
                                            </div>
                                        ) : null;
                                    })}
                                    {activeChannel.members.length > 3 && (
                                        <div className="w-8 h-8 rounded-full bg-black/50 border-2 border-[#0f172a] flex items-center justify-center text-xs text-slate-300">
                                            +{activeChannel.members.length - 3}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setShowManageMembers(true)}
                                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                                    title="Manage Members"
                                >
                                    <Users className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
                            {channelMessages.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Hash className="w-8 h-8 text-slate-500"/>
                                    </div>
                                    <h3 className="text-white font-bold text-xl mb-2">Welcome to #{activeChannel.name}!</h3>
                                    <p className="text-slate-400 text-sm">This is the start of the <span className="text-sadaya-gold">@{activeOrg?.name}</span> channel.</p>
                                </div>
                            ) : (
                                channelMessages.map((msg, idx) => {
                                    const isSequential = idx > 0 && channelMessages[idx - 1].senderId === msg.senderId && (new Date(msg.timestamp).getTime() - new Date(channelMessages[idx - 1].timestamp).getTime() < 60000); // Simple time check simulation
                                    return (
                                        <div key={msg.id} className={`flex gap-4 group ${isSequential ? 'mt-1' : 'mt-4'}`}>
                                            {!isSequential ? (
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
                                                    {msg.senderName.charAt(0)}
                                                </div>
                                            ) : (
                                                <div className="w-10 text-xs text-slate-600 text-right opacity-0 group-hover:opacity-100 select-none pt-1">
                                                    {msg.timestamp.split(' ')[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 max-w-4xl">
                                                {!isSequential && (
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="font-bold text-white hover:underline cursor-pointer">{msg.senderName}</span>
                                                        <span className="text-xs text-slate-500">{msg.timestamp}</span>
                                                    </div>
                                                )}
                                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {msg.text.split(/(@[\w\s]+)/g).map((part, i) => 
                                                        part.startsWith('@') ? <span key={i} className="bg-sadaya-gold/20 text-sadaya-gold px-1 rounded font-medium">{part}</span> : part
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 pt-2">
                            <div className="relative bg-white/5 border border-white/10 rounded-xl focus-within:border-sadaya-gold/50 focus-within:bg-black/40 transition-all">
                                {/* Mention Popover */}
                                {mentionQuery !== null && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1e293b] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="bg-black/20 px-3 py-2 text-xs font-bold text-slate-400 border-b border-white/5">
                                            Members matching "{mentionQuery}"
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {getMentionCandidates().map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => insertMention(u.name)}
                                                    className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-slate-200 flex items-center gap-2"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px]">{u.name.charAt(0)}</div>
                                                    {u.name}
                                                </button>
                                            ))}
                                            {getMentionCandidates().length === 0 && (
                                                <div className="px-4 py-2 text-xs text-slate-500 italic">No members found</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <input 
                                    ref={inputRef}
                                    type="text"
                                    value={messageInput}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={`Message #${activeChannel.name}`}
                                    className="w-full bg-transparent text-white px-4 py-3 outline-none placeholder-slate-500 font-light"
                                    autoComplete="off"
                                />
                                <div className="flex justify-between items-center px-2 pb-2">
                                    <div className="flex items-center gap-1">
                                        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"><Plus className="w-4 h-4"/></button>
                                        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"><Smile className="w-4 h-4"/></button>
                                        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"><AtSign className="w-4 h-4"/></button>
                                    </div>
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim()}
                                        className="p-2 bg-sadaya-gold text-black rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-600 mt-2 text-center">
                                <strong>Tip:</strong> Type <code>@</code> to mention a team member.
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <Hash className="w-16 h-16 mb-4 opacity-20"/>
                        <p>Select a channel to start communicating</p>
                    </div>
                )}
            </div>

            {/* CREATE CHANNEL MODAL */}
            {showCreateChannel && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6 font-headline">Create Channel</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Channel Name</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                    <input 
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white outline-none focus:border-sadaya-gold"
                                        placeholder="e.g. marketing-updates"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Privacy</label>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setNewChannelType('public')}
                                        className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${newChannelType === 'public' ? 'bg-sadaya-gold/10 border-sadaya-gold text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                    >
                                        <Hash className="w-5 h-5"/>
                                        <span className="text-xs font-bold">Public</span>
                                    </button>
                                    <button 
                                        onClick={() => setNewChannelType('private')}
                                        className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${newChannelType === 'private' ? 'bg-sadaya-gold/10 border-sadaya-gold text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                    >
                                        <Lock className="w-5 h-5"/>
                                        <span className="text-xs font-bold">Private</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowCreateChannel(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleCreateChannel} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white text-sm">Create Channel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MANAGE MEMBERS MODAL */}
            {showManageMembers && activeChannel && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white font-headline">Manage Members</h3>
                                <p className="text-xs text-slate-400">#{activeChannel.name}</p>
                            </div>
                            <button onClick={() => setShowManageMembers(false)}><X className="w-5 h-5 text-slate-500 hover:text-white"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-2">
                            {orgUsers.map(user => {
                                const isMember = activeChannel.members.includes(user.id);
                                return (
                                    <div 
                                        key={user.id}
                                        onClick={() => toggleChannelMember(user.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isMember ? 'bg-sadaya-gold/10 border-sadaya-gold/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.role}</div>
                                            </div>
                                        </div>
                                        {isMember && <CheckCircle className="w-5 h-5 text-sadaya-gold"/>}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-6 border-t border-white/10 text-right">
                            <button onClick={() => setShowManageMembers(false)} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white text-sm">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};