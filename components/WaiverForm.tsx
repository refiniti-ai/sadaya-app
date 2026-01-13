import React, { useState } from 'react';
import { User } from '../types';
import { Check, PenTool, Shield, Info, AlertTriangle, Lock, Users, Heart } from 'lucide-react';

interface WaiverFormProps {
  user: User;
  onSign: (name: string, date: string, initials: string) => void;
}

const DocumentSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-8 p-6 md:p-8 bg-white/5 rounded-2xl border border-white/10 glass-panel">
    <div className="flex items-center gap-3 mb-6">
      <div className="text-sadaya-gold">{icon}</div>
      <h3 className="text-white font-headline font-bold text-lg md:text-xl tracking-wide uppercase">{title}</h3>
    </div>
    <div className="text-slate-300 font-body text-sm md:text-base leading-relaxed">
      {children}
    </div>
  </div>
);

export const WaiverForm: React.FC<WaiverFormProps> = ({ user, onSign }) => {
  const [signature, setSignature] = useState('');
  const [initials, setInitials] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreed && signature && initials) {
      onSign(signature, date, initials);
    }
  };

  return (
    <div className="min-h-screen bg-sadaya-forest flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4 p-3 rounded-full bg-sadaya-gold/10 border border-sadaya-gold/20">
            <Shield className="w-8 h-8 text-sadaya-gold" />
          </div>
          <h1 className="text-3xl md:text-5xl font-headline font-bold text-white mb-4 tracking-tight">
            Safety & <span className="text-transparent bg-clip-text bg-gradient-to-r from-sadaya-gold to-sadaya-tan">Privacy Agreement</span>
          </h1>
          <p className="text-sadaya-cream font-body text-lg max-w-2xl mx-auto opacity-80">
            Before we begin our journey together at Sadaya Sanctuary, please review and sign our mutual agreements.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <DocumentSection
            title="Our Mission & Welcome"
            icon={<Heart className="w-5 h-5" />}
          >
            <div className="space-y-4">
              <p>
                At Sadaya Sanctuary our mission is to provide a safe place for the integration of all change in life. We do this by providing a safe, healthy and holistic environment. Where all nationalities, genders, race, species, orientations, religions and sovereign beings are able to heal, grow and expand together.
              </p>
              <p>
                Sadaya Sanctuary sits on religious land. Where the owner knows our practices. We work with churches, Private Membership Associations and are owned a Corporation. As separate entities we have separate bylaws, protocols, rules and regulations. Together our mission is to raise the vibration of the collective.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-xs">
                    - <strong>The Waiver of Liability</strong> ensures that you understand the nature of our services which may include holistic or complementary wellness practices and that you accept responsibility for your own health and choices while here.
                  </p>
                </div>
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-xs">
                    - <strong>The Terms & Conditions</strong> outline how bookings, cancellations, payments, and participation work. Having these clear in writing helps everyone avoid confusion and ensures fairness.
                  </p>
                </div>
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-xs">
                    - <strong>The Privacy Policy</strong> safeguards your personal information and explains how it is collected, stored, and used responsibly.
                  </p>
                </div>
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-xs">
                    - <strong>The House Rules & Safety Guidelines</strong> set expectations for how we share the space respectfully, creating a serene and harmonious environment for all.
                  </p>
                </div>
              </div>
              <p className="mt-4">
                Together, these documents are not just legal protections — they are mutual agreements that help protect you, Everyday Ceremony INC and its investors, Sadaya LLC, Sadaya Sanctum, staff, contractors, members and the practitioners. By signing them, you help ensure trust, clarity, and safety for the entire community.
              </p>
              <p className="font-bold text-white italic">
                With Gratitude,<br />
                Luke Carver<br />
                Founder
              </p>
            </div>
          </DocumentSection>

          <DocumentSection
            title="Waiver of Liability & Assumption of Risk"
            icon={<Shield className="w-5 h-5" />}
          >
            <div className="space-y-4">
              <p className="font-bold text-white uppercase tracking-widest text-xs mb-2">WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND RELEASE AGREEMENT</p>
              <p>This Waiver of Liability (“Agreement”) is entered into by the undersigned participant (“Participant”) in connection with their attendance at, and participation in, any programs, retreats, workshops, treatments, activities, or services (“Activities”) provided by Sadaya Sanctuary, LLC (“Sadaya,” Sadaya Sanctuary).</p>
              <p className="italic text-sadaya-sage text-sm bg-sadaya-gold/5 p-3 rounded border border-sadaya-gold/10">"For the purposes of this Agreement, the term 'Participant' refers to the individual signing this document. All references to 'I,' 'me,' or 'my' within this Agreement shall mean and apply to the Participant."</p>
              
              <div className="space-y-6 pl-4 border-l-2 border-sadaya-gold/30 mt-6">
                <div>
                  <h4 className="text-white font-bold mb-1">1. Voluntary Participation</h4>
                  <p className="text-sm">I understand, agree and declare under penalty of purjury that my participation in any Activities at Sadaya is voluntary and that I am solely responsible for my own well-being, decisions, and actions.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">2. Nature of Services</h4>
                  <p className="text-sm">I acknowledge and I declare under penalty of purjury that Sadaya offers wellness and personal development services, which may include but are not limited to: meditation, yoga, breathwork, bodywork, sound therapy, energy healing, nutritional guidance, alternative or complementary medicine, and other holistic health modalities. I understand these Activities are not a substitute for medical diagnosis or treatment and are not intended to replace the care of a licensed medical provider.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">3. Assumption of Risk</h4>
                  <p className="text-sm">I understand that participation in the Activities may involve physical, emotional, and psychological risks, including but not limited to: physical exertion, emotional discomfort, allergic reactions, and unpredictable reactions to treatments, herbs, supplements, or alternative modalities. I voluntarily assume full responsibility for any and all risks, injuries, damages, or losses that I may sustain as a result of participating.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">4. Medical Responsibility</h4>
                  <p className="text-sm">I certify that I am physically and mentally capable of participating. I acknowledge that I have conducted my own research and assessment regarding my physical and mental capacity to participate. I accept full and sole responsibility for any health conditions or circumstances that could affect my participation. I understand and agree that Sadaya Sanctuary is not a medical facility, does not provide medical care, and is not involved in the practice of healthcare. I further release, indemnify, and hold harmless Sadaya Sanctuary, its owners, staff, affiliates, and representatives from any and all liability, claims, or demands arising from my participation, including those related to any undisclosed, unknown, or pre-existing conditions." I agree to disclose to Sadaya any relevant medical conditions, medications, or allergies prior to participation.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">5. Release of Liability</h4>
                  <p className="text-sm">In consideration of being permitted to participate in the Activities at Sadaya Sanctuary, I for myself and on behalf of my heirs, executors, administrators, assigns, and personal representatives, voluntarily and knowingly release, waive, and discharge Sadaya Sanctuary, LLC, and its owners, directors, officers, employees, contractors, agents, and affiliates (“Released Parties”) from any and all claims, demands, actions, or causes of action arising out of or related to any loss, damage, injury (including death), or expense that may occur in connection with my participation in the Activities, whether arising from the ordinary negligence of the Released Parties or otherwise, to the fullest extent permitted by law. I declare this under penalty of purjury.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">6. Indemnification</h4>
                  <p className="text-sm">I agree and declare under penalty of purjury to indemnify and hold harmless Sadaya and its representatives from any loss, liability, damage, or cost, including attorney’s fees, that may result from my participation or from any claims brought by third parties arising from my actions during my time at Sadaya.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1 text-sadaya-gold">7. Disclosure of Affiliations</h4>
                  <p className="text-sm">I Declare under penalty of perjury that I am not acting on behalf of, employed by, or collaborating with any governmental organization, law enforcement agency, or related entity in any capacity, whether as an agent, contractor, informant, investigator, or otherwise. Failure to provide such disclosure shall constitute a material breach of this agreement.</p>
                </div>
              </div>

              <div className="bg-sadaya-gold/10 p-6 rounded-2xl border border-sadaya-gold/30 mt-8">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5 text-sadaya-gold" /> 11. Animal Waiver & Initials
                </h4>
                <p className="mb-4 text-xs italic text-sadaya-cream/70">
                  "If an animal is approved to be on the property, its owner is solely responsible for its health, behavior, and veterinary records, and assumes full liability for any incident involving that animal. Sadaya Sanctuary, its owners, and staff are not responsible for any injury, harm, or damages arising from interaction with animals on the property."
                </p>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-white font-bold uppercase tracking-widest">Participant Initials:</label>
                  <input 
                    type="text" 
                    maxLength={3} 
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    placeholder="XYZ"
                    className="w-24 bg-black/40 border border-sadaya-gold/50 rounded-lg px-4 py-2 text-white outline-none focus:border-sadaya-gold text-center font-headline text-lg"
                    required
                  />
                </div>
              </div>
            </div>
          </DocumentSection>

          <DocumentSection
            title="Terms, Privacy & NDA"
            icon={<Lock className="w-5 h-5" />}
          >
            <div className="space-y-8">
              <div className="space-y-2">
                <h4 className="text-white font-bold uppercase tracking-widest text-xs">Terms & Conditions</h4>
                <p className="text-xs opacity-70">Bookings are confirmed upon payment. Cancellations within 14 days are non-refundable. Participants must respect staff, other guests, and property. Sadaya offers wellness services that do not replace licensed medical care.</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-bold uppercase tracking-widest text-xs">Privacy & Confidentiality</h4>
                <p className="text-xs opacity-70">Your personal, medical, and spiritual information remains private. We do not share your information with third parties. Unauthorized recording or photography of other participants is strictly prohibited.</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-bold uppercase tracking-widest text-xs">Non-Disclosure Agreement</h4>
                <p className="text-xs opacity-70">Recipient agrees to maintain confidentiality of all oral, written, or digital information disclosed during Activities, including personal stories and proprietary methods of Sadaya practitioners.</p>
              </div>
            </div>
          </DocumentSection>

          <DocumentSection
            title="House Rules & Safety"
            icon={<Info className="w-5 h-5" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex gap-3 text-sm"><Check className="w-4 h-4 text-sadaya-gold shrink-0 mt-1" /> Quiet hours: 10:00 PM – 7:00 AM.</div>
                <div className="flex gap-3 text-sm"><Check className="w-4 h-4 text-sadaya-gold shrink-0 mt-1" /> No TV or media (Sanctuary Focus).</div>
                <div className="flex gap-3 text-sm"><Check className="w-4 h-4 text-sadaya-gold shrink-0 mt-1" /> No Alcohol or Drugs permitted.</div>
                <div className="flex gap-3 text-sm"><Check className="w-4 h-4 text-sadaya-gold shrink-0 mt-1" /> Clean up shared spaces.</div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 text-sm"><Check className="w-4 h-4 text-sadaya-gold shrink-0 mt-1" /> Pets require prior approval.</div>
                <div className="flex gap-3 text-sm"><Check className="w-4 h-4 text-sadaya-gold shrink-0 mt-1" /> All activities require prior booking.</div>
                <div className="flex gap-3 text-sm"><Check className="w-4 h-4 text-sadaya-gold shrink-0 mt-1" /> Report accidents immediately.</div>
                <div className="flex gap-3 text-sm text-red-400 font-bold"><AlertTriangle className="w-4 h-4 shrink-0 mt-1" /> No harassment or violent behavior.</div>
              </div>
            </div>
          </DocumentSection>

          <DocumentSection
            title="Membership Tiers (PMA)"
            icon={<Users className="w-5 h-5" />}
          >
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Tier I: Community', price: '$0 - $111' },
                  { name: 'Tier II: Rebirth', price: '$888 - $2,222' },
                  { name: 'Tier III: Awaken', price: '$8,888' },
                  { name: 'Tier IV: Chief Council', price: '$22,222' }
                ].map(tier => (
                  <div key={tier.name} className="p-3 bg-black/30 border border-white/10 rounded-xl text-center">
                    <div className="text-[10px] text-sadaya-gold font-bold uppercase mb-1">{tier.name}</div>
                    <div className="text-xs text-white font-headline">{tier.price}</div>
                  </div>
                ))}
             </div>
          </DocumentSection>

          {/* Signature Section */}
          <div className="mt-12 glass-panel p-8 md:p-12 rounded-3xl border-2 border-sadaya-gold/40 shadow-[0_0_50px_rgba(246,223,188,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sadaya-gold/5 blur-[80px] rounded-full pointer-events-none"></div>
            
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-white mb-8 flex items-center gap-4">
              <PenTool className="text-sadaya-gold w-8 h-8" /> Final Signature & Sign Up
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <label className="text-xs text-sadaya-sage uppercase font-bold tracking-[0.2em]">Full Legal Signature</label>
                <div className="relative">
                   <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                   <input 
                    type="text" 
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Type your full legal name"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-sadaya-gold font-headline text-lg"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs text-sadaya-sage uppercase font-bold tracking-[0.2em]">Date of Execution</label>
                <div className="relative">
                   <input 
                    type="text" 
                    value={date}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-slate-400 outline-none cursor-not-allowed font-mono text-lg"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-sadaya-gold font-bold uppercase bg-sadaya-gold/10 px-2 py-1 rounded">Locked</div>
                </div>
              </div>
            </div>

            <div className="mb-10 bg-sadaya-gold/5 border border-sadaya-gold/20 p-6 rounded-2xl">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative mt-1">
                  <input 
                    type="checkbox" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                    required
                  />
                  <div className={`w-7 h-7 border-2 rounded-lg transition-all duration-300 flex items-center justify-center ${agreed ? 'bg-sadaya-gold border-sadaya-gold shadow-[0_0_20px_rgba(246,223,188,0.5)] scale-110' : 'border-white/20 group-hover:border-sadaya-gold/50'}`}>
                    {agreed && <Check className="w-5 h-5 text-black stroke-[3]" />}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm md:text-base group-hover:text-sadaya-cream transition-colors">
                    I have read, understood, and voluntarily agree to all terms, conditions, and waivers set forth in this document.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 italic">
                    By checking this box and typing my name above, I am providing a legally binding digital signature. I declare under penalty of perjury that all information provided is true and correct to the best of my knowledge.
                  </p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={!agreed || !signature || !initials}
              className={`w-full py-5 rounded-2xl font-headline font-bold uppercase tracking-[0.3em] transition-all duration-500 text-lg md:text-xl ${
                agreed && signature && initials
                ? 'bg-gradient-to-r from-sadaya-gold via-sadaya-tan to-sadaya-gold bg-[length:200%_auto] hover:bg-right text-black shadow-[0_10px_40px_rgba(246,223,188,0.3)] hover:scale-[1.02] active:scale-[0.95]'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              Sign & Complete Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
