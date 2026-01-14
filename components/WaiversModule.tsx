import React, { useState } from 'react';
import { WaiverRecord, User, UserRole } from '../types';
import { Shield, Search, FileText, Eye, Calendar, User as UserIcon, Building, X, PenTool, CheckCircle, Clock } from 'lucide-react';

interface WaiversModuleProps {
  waivers: WaiverRecord[];
  currentUser: User;
}

export const WaiversModule: React.FC<WaiversModuleProps> = ({ waivers, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWaiver, setSelectedWaiver] = useState<WaiverRecord | null>(null);

  const isAdmin = currentUser.role !== UserRole.CLIENT;
  
  const filteredWaivers = waivers.filter(w => {
    const matchesSearch = w.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.orgName.toLowerCase().includes(searchQuery.toLowerCase());
    if (isAdmin) return matchesSearch;
    return w.userId === currentUser.id && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-headline font-light text-white mb-2">Legal Compliance & Waivers</h2>
          <p className="text-slate-400 font-body font-thin text-lg">
            {isAdmin ? 'Monitor and manage all signed liability waivers and privacy agreements.' : 'View your signed sanctuary agreements and legal documents.'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-96 mb-8">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
        <input 
          type="text" 
          placeholder="Search by name or organization..." 
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-sadaya-gold outline-none font-body font-light"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Waiver List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWaivers.length > 0 ? (
          filteredWaivers.map(waiver => (
            <div 
              key={waiver.id}
              className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-sadaya-gold/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-sadaya-gold/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-sadaya-gold/10 transition-all"></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-sadaya-gold/10 rounded-xl border border-sadaya-gold/20">
                  <Shield className="w-6 h-6 text-sadaya-gold" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                  <CheckCircle className="w-3 h-3" /> Signed & Valid
                </div>
              </div>

              <h3 className="text-white font-headline font-bold text-lg mb-1">{waiver.userName}</h3>
              <p className="text-sadaya-sage text-xs font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building className="w-3 h-3" /> {waiver.orgName}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4 text-sadaya-gold/60" />
                  <span>Executed on {waiver.signedDate}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <PenTool className="w-4 h-4 text-sadaya-gold/60" />
                  <span className="font-headline italic text-white/80">{waiver.signature}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedWaiver(waiver)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-sadaya-cream transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> View Document
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-white/10 border-dashed">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-20" />
            <p className="text-slate-500 font-headline uppercase tracking-widest text-sm">No signed waivers found</p>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {selectedWaiver && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-sadaya-forest border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-sadaya-gold" />
              <h2 className="text-xl font-headline text-white font-bold uppercase tracking-wider">
                Digital Agreement & Waiver
              </h2>
            </div>
              <button 
                onClick={() => setSelectedWaiver(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 font-body text-slate-300 leading-relaxed custom-scrollbar bg-[#080c14]">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center mb-12 border-b border-white/5 pb-12">
                   <h1 className="text-3xl font-headline font-bold text-white mb-4">SADAYA SANCTUARY</h1>
                   <p className="text-sadaya-gold font-bold uppercase tracking-[0.3em] text-sm">Legal Agreement & Release of Liability</p>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
                  <section>
                    <h4 className="text-white font-bold uppercase text-xs mb-3 tracking-widest flex items-center gap-2">
                      <Shield className="w-4 h-4 text-sadaya-gold" /> 1. Mission & Environment
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-400">At Sadaya Sanctuary our mission is to provide a safe place for the integration of all change in life. We do this by providing a safe, healthy and holistic environment. Where all nationalities, genders, race, species, orientations, religions and sovereign beings are able to heal, grow and expand together. Sadaya Sanctuary sits on religious land. Together our mission is to raise the vibration of the collective.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-bold uppercase text-xs mb-3 tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sadaya-gold" /> 2. Waiver of Liability
                    </h4>
                    <p className="text-sm italic text-slate-400">"For the purposes of this Agreement, the term 'Participant' refers to the individual signing this document. All references to 'I,' 'me,' or 'my' within this Agreement shall mean and apply to the Participant."</p>
                    <p className="text-sm mt-4 leading-relaxed text-slate-400">The Participant voluntarily assumes all risks related to activities provided by Sadaya Sanctuary, including but not limited to meditation, yoga, breathwork, and alternative holistic modalities. These activities are not a substitute for medical diagnosis or treatment.</p>
                  </section>

                  <section>
                    <h4 className="text-white font-bold uppercase text-xs mb-3 tracking-widest flex items-center gap-2">
                      <Eye className="w-4 h-4 text-sadaya-gold" /> 3. Privacy & Confidentiality
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-400">Sadaya respects the confidentiality of all individuals. Any personal, medical, or spiritual information provided remains private. Unauthorized recording or sharing of others' experiences is strictly prohibited.</p>
                  </section>
                </div>

                <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-2">
                      <p className="text-[10px] text-sadaya-sage uppercase font-bold tracking-widest">Executed Digital Signature</p>
                      <div className="font-headline text-4xl text-sadaya-gold italic">
                        {selectedWaiver.signature}
                      </div>
                      <div className="h-px bg-white/10 w-full mt-2"></div>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {selectedWaiver.id}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] text-sadaya-sage uppercase font-bold tracking-widest">Execution Date</p>
                      <div className="font-mono text-2xl text-white">
                        {selectedWaiver.signedDate}
                      </div>
                      <div className="h-px bg-white/10 w-full mt-2"></div>
                      <p className="text-[10px] text-green-500 font-bold">STATUS: LEGALLY BINDING</p>
                   </div>
                   <div className="col-span-full pt-4">
                      <p className="text-[10px] text-sadaya-sage uppercase font-bold tracking-widest mb-3">Animal Waiver Confirmation Initials</p>
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-sadaya-gold/10 border border-sadaya-gold/30 rounded-xl text-white font-headline text-2xl shadow-[0_0_15px_rgba(246,223,188,0.1)]">
                        {selectedWaiver.initials}
                      </div>
                   </div>
                </div>

                <div className="mt-12 p-8 bg-green-500/5 rounded-3xl border border-green-500/10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                   <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                   </div>
                   <div>
                      <h5 className="text-white font-bold text-lg mb-1">Verification Certified</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">This document was executed via the Sadaya Secure Portal. The participant has verified their identity and acknowledged all terms of service and liability releases.</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end gap-3">
              <button 
                onClick={() => window.print()}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-all"
              >
                Download PDF
              </button>
              <button 
                onClick={() => setSelectedWaiver(null)}
                className="px-8 py-2 bg-sadaya-gold text-black font-bold rounded-xl text-sm transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
