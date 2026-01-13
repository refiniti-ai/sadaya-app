import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Grid, 
  Plus, 
  Trash2, 
  Users, 
  Clock, 
  DollarSign, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  CreditCard,
  X,
  User as UserIcon,
  Image as ImageIcon
} from 'lucide-react';
import { User, UserRole, ClassEvent, RecurringCycle } from '../types';

interface ClassesModuleProps {
  currentUser: User;
  teamMembers: User[];
  events: ClassEvent[];
  setEvents: React.Dispatch<React.SetStateAction<ClassEvent[]>>;
}

export const ClassesModule: React.FC<ClassesModuleProps> = ({
  currentUser,
  teamMembers,
  events,
  setEvents
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isAdminOrStaff = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.EMPLOYEE || currentUser.role === UserRole.SALES;
  const canManageEvents = currentUser.permissions.includes('edit_classes');

  // Form state for new event
  const [newEvent, setNewEvent] = useState<Partial<ClassEvent>>({
    name: '',
    description: '',
    coverImage: '',
    price: 0,
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    totalSeats: 20,
    isRecurring: false,
    recurringCycle: RecurringCycle.NONE,
    facilitatorId: '',
    facilitatorPayout: 0
  });

  const handleAddEvent = () => {
    if (!newEvent.name || !newEvent.facilitatorId) return;

    const facilitator = teamMembers.find(m => m.id === newEvent.facilitatorId);
    
    const event: ClassEvent = {
      id: `ev-${Date.now()}`,
      name: newEvent.name || '',
      description: newEvent.description || '',
      coverImage: newEvent.coverImage || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      price: newEvent.price || 0,
      date: newEvent.date || '',
      time: newEvent.time || '',
      totalSeats: newEvent.totalSeats || 0,
      availableSeats: newEvent.totalSeats || 0,
      isRecurring: newEvent.isRecurring || false,
      recurringCycle: newEvent.recurringCycle || RecurringCycle.NONE,
      facilitatorId: newEvent.facilitatorId || '',
      facilitatorName: facilitator?.name || '',
      facilitatorPicture: facilitator?.profilePicture,
      facilitatorBio: facilitator?.bio,
      facilitatorPayout: newEvent.facilitatorPayout || 0,
      attendees: []
    };

    setEvents(prev => [...prev, event]);
    setShowAddModal(false);
    setNewEvent({
      name: '',
      description: '',
      coverImage: '',
      price: 0,
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      totalSeats: 20,
      isRecurring: false,
      recurringCycle: RecurringCycle.NONE,
      facilitatorId: '',
      facilitatorPayout: 0
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleSignUp = (event: ClassEvent) => {
    if (event.availableSeats <= 0) return;
    setSelectedEvent(event);
    setShowPaymentModal(true);
  };

  const confirmBooking = () => {
    if (!selectedEvent) return;
    
    setEvents(prev => prev.map(e => {
      if (e.id === selectedEvent.id) {
        return {
          ...e,
          availableSeats: e.availableSeats - 1,
          attendees: [...e.attendees, currentUser.id]
        };
      }
      return e;
    }));
    
    setShowPaymentModal(false);
    setSelectedEvent(null);
    alert("Booking confirmed! Thank you for signing up.");
  };

  // Simple Calendar Logic
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const calendarDays = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];
    
    // Fill empty days before
    for (let i = 0; i < start.getDay(); i++) {
      days.push(null);
    }
    
    // Fill actual days
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    
    return days;
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-headline font-light text-white mb-2">Sanctuary Classes & Events</h2>
          <p className="text-slate-400 font-body font-thin text-lg">Join our guided workshops and healing sessions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-sadaya-gold text-black' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-sadaya-gold text-black' : 'text-slate-400 hover:text-white'}`}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
          
          {canManageEvents && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-sadaya-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-white transition-colors"
            >
              <Plus className="w-5 h-5" /> Add Event
            </button>
          )}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="glass-panel rounded-2xl overflow-hidden border border-white/10 group hover:border-sadaya-gold/30 transition-all flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-sadaya-gold font-bold text-sm">
                  ${event.price}
                </div>
                {event.isRecurring && (
                  <div className="absolute top-4 left-4 bg-purple-500/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
                    {event.recurringCycle}
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-headline font-bold text-white">{event.name}</h3>
                  {canManageEvents && (
                    <button onClick={() => handleDeleteEvent(event.id)} className="text-slate-500 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <p className="text-slate-400 text-sm font-body mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2 mb-6 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-sadaya-gold" />
                    <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sadaya-gold" />
                    <span>{event.availableSeats} / {event.totalSeats} seats available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-sadaya-gold" />
                    <span>Facilitated by {teamMembers.find(m => m.id === event.facilitatorId)?.name || event.facilitatorName}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedEvent(event)}
                    className="text-sadaya-gold hover:underline text-sm font-bold"
                  >
                    View Details
                  </button>
                  
                  {currentUser.role === UserRole.CLIENT && (
                    <button 
                      onClick={() => handleSignUp(event)}
                      disabled={event.availableSeats <= 0 || event.attendees.includes(currentUser.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        event.attendees.includes(currentUser.id)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                          : event.availableSeats <= 0
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-sadaya-gold text-black hover:bg-white'
                      }`}
                    >
                      {event.attendees.includes(currentUser.id) ? 'Booked' : event.availableSeats <= 0 ? 'Full' : 'Sign Up'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-headline font-bold text-white">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-white"><ChevronLeft /></button>
              <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-white"><ChevronRight /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-sadaya-sage uppercase tracking-widest pb-4">{day}</div>
            ))}
            
            {calendarDays.map((day, idx) => {
              const dayEvents = day ? events.filter(e => e.date === day.toISOString().split('T')[0]) : [];
              return (
                <div key={idx} className={`min-h-[100px] border border-white/5 rounded-lg p-2 ${day ? 'bg-white/5' : 'opacity-0'}`}>
                  {day && (
                    <>
                      <div className="text-right text-xs text-slate-500 mb-2">{day.getDate()}</div>
                      <div className="space-y-1">
                        {dayEvents.map(e => (
                          <div 
                            key={e.id} 
                            onClick={() => setSelectedEvent(e)}
                            className="text-[10px] bg-sadaya-gold/20 text-sadaya-gold px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-sadaya-gold/30"
                          >
                            {e.time} {e.name}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && !showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="md:w-2/5 relative">
              <img src={selectedEvent.coverImage} className="w-full h-full object-cover" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#0f172a] via-transparent to-transparent"></div>
            </div>
            
            <div className="md:w-3/5 p-8 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-headline font-bold text-white">{selectedEvent.name}</h2>
                <button onClick={() => setSelectedEvent(null)}><X className="text-slate-500 hover:text-white" /></button>
              </div>
              
              <div className="flex gap-4 mb-6">
                <span className="bg-sadaya-gold/10 text-sadaya-gold px-3 py-1 rounded-full text-xs font-bold">${selectedEvent.price}</span>
                <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">{selectedEvent.date} at {selectedEvent.time}</span>
              </div>
              
              <p className="text-slate-400 font-body mb-8 leading-relaxed">{selectedEvent.description}</p>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-8">
                <h4 className="text-xs font-bold text-sadaya-sage uppercase tracking-widest mb-3">Facilitator</h4>
                <div className="flex items-center gap-4">
                  <img src={selectedEvent.facilitatorPicture || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="text-white font-bold">{selectedEvent.facilitatorName}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{selectedEvent.facilitatorBio}</div>
                  </div>
                </div>
              </div>

              {(isAdminOrStaff && (currentUser.role === UserRole.SUPER_ADMIN || currentUser.id === selectedEvent.facilitatorId)) && (
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 mb-8">
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">Facilitator Payout</h4>
                  <div className="text-xl font-bold text-white">${selectedEvent.facilitatorPayout}</div>
                </div>
              )}

              {currentUser.role === UserRole.CLIENT && (
                <button 
                  onClick={() => handleSignUp(selectedEvent)}
                  disabled={selectedEvent.availableSeats <= 0 || selectedEvent.attendees.includes(currentUser.id)}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedEvent.attendees.includes(currentUser.id)
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : selectedEvent.availableSeats <= 0
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-sadaya-gold text-black hover:bg-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  {selectedEvent.attendees.includes(currentUser.id) ? (
                    <><CheckCircle className="w-5 h-5" /> Already Booked</>
                  ) : selectedEvent.availableSeats <= 0 ? (
                    'Sold Out'
                  ) : (
                    <><CreditCard className="w-5 h-5" /> Book Your Spot</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment/Booking Modal */}
      {showPaymentModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-headline font-bold text-white mb-2">Secure Booking</h2>
            <p className="text-slate-400 text-sm mb-6">Confirm your spot for <span className="text-sadaya-gold font-bold">{selectedEvent.name}</span></p>
            
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
              <div className="flex justify-between mb-4">
                <span className="text-slate-400">Class Fee</span>
                <span className="text-white font-bold">${selectedEvent.price}</span>
              </div>
              <div className="h-px bg-white/10 mb-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">Total Due</span>
                <span className="text-2xl font-headline font-bold text-sadaya-gold">${selectedEvent.price}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <label className="text-xs font-bold text-sadaya-sage uppercase tracking-widest">Select Payment Method</label>
              <div className="p-4 border-2 border-sadaya-gold bg-sadaya-gold/5 rounded-xl flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-sadaya-gold" />
                  <div>
                    <div className="text-white font-bold text-sm">•••• •••• •••• 4242</div>
                    <div className="text-xs text-slate-500">Expires 12/28</div>
                  </div>
                </div>
                <CheckCircle className="text-sadaya-gold w-5 h-5" />
              </div>
              <button className="w-full py-3 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add New Card
              </button>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 text-slate-400 hover:text-white font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={confirmBooking}
                className="flex-[2] py-3 bg-sadaya-gold text-black rounded-xl font-bold hover:bg-white transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-headline text-white font-bold">Create New Event</h2>
              <button onClick={() => setShowAddModal(false)}><X className="text-slate-500 hover:text-white" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Event Name</label>
                  <input 
                    type="text"
                    value={newEvent.name}
                    onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none"
                    placeholder="E.g. Sunrise Yoga Meditation"
                  />
                </div>
                
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Description</label>
                  <textarea 
                    value={newEvent.description}
                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none h-24"
                    placeholder="Tell guests about the event..."
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Cover Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      value={newEvent.coverImage}
                      onChange={e => setNewEvent({...newEvent, coverImage: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 pl-10 text-white focus:border-sadaya-gold outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="number"
                      value={newEvent.price}
                      onChange={e => setNewEvent({...newEvent, price: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 pl-10 text-white focus:border-sadaya-gold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Available Seats</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="number"
                      value={newEvent.totalSeats}
                      onChange={e => setNewEvent({...newEvent, totalSeats: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 pl-10 text-white focus:border-sadaya-gold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="date"
                      value={newEvent.date}
                      onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 pl-10 text-white focus:border-sadaya-gold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="time"
                      value={newEvent.time}
                      onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 pl-10 text-white focus:border-sadaya-gold outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-2 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-white">Is it recurring?</label>
                      <Info className="w-3 h-3 text-slate-500" />
                    </div>
                    <button 
                      onClick={() => setNewEvent({...newEvent, isRecurring: !newEvent.isRecurring})}
                      className={`w-10 h-5 rounded-full relative transition-colors ${newEvent.isRecurring ? 'bg-sadaya-gold' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${newEvent.isRecurring ? 'left-6' : 'left-1'}`}></div>
                    </button>
                  </div>
                  
                  {newEvent.isRecurring && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <label className="text-xs text-slate-400">Recurring Cycle</label>
                      <select 
                        value={newEvent.recurringCycle}
                        onChange={e => setNewEvent({...newEvent, recurringCycle: e.target.value as RecurringCycle})}
                        className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white outline-none"
                      >
                        {Object.values(RecurringCycle).map(cycle => (
                          <option key={cycle} value={cycle}>{cycle}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Facilitator</label>
                  <select 
                    value={newEvent.facilitatorId}
                    onChange={e => setNewEvent({...newEvent, facilitatorId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none"
                  >
                    <option value="">Select Facilitator</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Facilitator Payout ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="number"
                      value={newEvent.facilitatorPayout}
                      onChange={e => setNewEvent({...newEvent, facilitatorPayout: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 pl-10 text-white focus:border-sadaya-gold outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
              <button 
                onClick={handleAddEvent}
                className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded-lg hover:bg-white transition-colors text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
