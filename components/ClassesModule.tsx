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
  Image as ImageIcon,
  Edit,
  Eye,
  Settings
} from 'lucide-react';
import { User, UserRole, ClassEvent, RecurringCycle, PayoutType } from '../types';

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
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSeries, setEditingSeries] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSignupsModal, setShowSignupsModal] = useState(false);
  const [showPayoutsToggle, setShowPayoutsToggle] = useState(false);

  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isStaff = currentUser.role === UserRole.EMPLOYEE || currentUser.role === UserRole.SALES;
  const isAdminOrStaff = isAdmin || isStaff;
  const canManageEvents = currentUser.permissions.includes('edit_classes');

  // Form state
  const initialFormState: Partial<ClassEvent> = {
    name: '',
    description: '',
    coverImage: '',
    price: 0,
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: '60 mins',
    totalSeats: 20,
    isRecurring: false,
    recurringCycle: RecurringCycle.NONE,
    facilitatorId: '',
    facilitatorPayoutType: PayoutType.FLAT,
    facilitatorPayoutValue: 0,
    organizerId: '',
    organizerPayoutType: PayoutType.FLAT,
    organizerPayoutValue: 0
  };

  const [formEvent, setFormEvent] = useState<Partial<ClassEvent>>(initialFormState);

  const calculatePayout = (type: PayoutType, value: number, price: number, signups: number) => {
    if (type === PayoutType.FLAT) return value;
    return (price * signups * value) / 100;
  };

  const generateRecurringEvents = (baseEvent: ClassEvent, cycle: RecurringCycle, count: number = 12) => {
    const recurringEvents: ClassEvent[] = [];
    const baseDate = new Date(baseEvent.date);
    const seriesId = `series-${Date.now()}`;

    for (let i = 0; i < count; i++) {
      const newDate = new Date(baseDate);
      if (cycle === RecurringCycle.DAILY) newDate.setDate(baseDate.getDate() + i);
      if (cycle === RecurringCycle.WEEKLY) newDate.setDate(baseDate.getDate() + (i * 7));
      if (cycle === RecurringCycle.BIWEEKLY) newDate.setDate(baseDate.getDate() + (i * 14));
      if (cycle === RecurringCycle.MONTHLY) newDate.setMonth(baseDate.getMonth() + i);

      recurringEvents.push({
        ...baseEvent,
        id: `ev-${seriesId}-${i}`,
        seriesId,
        date: newDate.toISOString().split('T')[0],
        attendees: [] // Each instance has its own attendees
      });
    }
    return recurringEvents;
  };

  const handleSaveEvent = () => {
    if (!formEvent.name || !formEvent.facilitatorId) return;

    const facilitator = teamMembers.find(m => m.id === formEvent.facilitatorId);
    const organizer = teamMembers.find(m => m.id === formEvent.organizerId);
    
    const baseEvent: ClassEvent = {
      id: isEditing ? (formEvent.id || `ev-${Date.now()}`) : `ev-${Date.now()}`,
      name: formEvent.name || '',
      description: formEvent.description || '',
      coverImage: formEvent.coverImage || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      price: formEvent.price || 0,
      date: formEvent.date || '',
      time: formEvent.time || '',
      duration: formEvent.duration || '60 mins',
      totalSeats: formEvent.totalSeats || 0,
      availableSeats: formEvent.totalSeats || 0,
      isRecurring: formEvent.isRecurring || false,
      recurringCycle: formEvent.recurringCycle || RecurringCycle.NONE,
      facilitatorId: formEvent.facilitatorId || '',
      facilitatorName: facilitator?.name || '',
      facilitatorPicture: facilitator?.profilePicture,
      facilitatorBio: facilitator?.bio,
      facilitatorPayoutType: formEvent.facilitatorPayoutType || PayoutType.FLAT,
      facilitatorPayoutValue: formEvent.facilitatorPayoutValue || 0,
      organizerId: formEvent.organizerId,
      organizerName: organizer?.name,
      organizerPicture: organizer?.profilePicture,
      organizerBio: organizer?.bio,
      organizerPayoutType: formEvent.organizerPayoutType || PayoutType.FLAT,
      organizerPayoutValue: formEvent.organizerPayoutValue || 0,
      attendees: formEvent.attendees || []
    };

    if (isEditing) {
      if (editingSeries && baseEvent.seriesId) {
        setEvents(prev => prev.map(e => e.seriesId === baseEvent.seriesId ? { ...baseEvent, id: e.id, date: e.date, attendees: e.attendees } : e));
      } else {
        setEvents(prev => prev.map(e => e.id === baseEvent.id ? baseEvent : e));
      }
    } else {
      if (baseEvent.isRecurring && baseEvent.recurringCycle !== RecurringCycle.NONE) {
        const recurring = generateRecurringEvents(baseEvent, baseEvent.recurringCycle!);
        setEvents(prev => [...prev, ...recurring]);
      } else {
        setEvents(prev => [...prev, baseEvent]);
      }
    }

    setShowFormModal(false);
    setIsEditing(false);
    setEditingSeries(false);
    setFormEvent(initialFormState);
  };

  const handleEditClick = (event: ClassEvent, series: boolean = false) => {
    setFormEvent(event);
    setIsEditing(true);
    setEditingSeries(series);
    setShowFormModal(true);
  };

  const handleDeleteEvent = (id: string, seriesId?: string) => {
    if (seriesId && window.confirm("Delete the entire series?")) {
      setEvents(prev => prev.filter(e => e.seriesId !== seriesId));
    } else {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
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

    // Record payment in Billing/Invoices
    const newInvoice: Invoice = {
      id: `EVT-${Date.now()}`,
      clientName: currentUser.name,
      amount: selectedEvent.price,
      type: 'One-Time',
      status: 'Paid',
      dueDate: new Date().toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      terms: 'Immediate',
      items: [{ description: `Event Signup: ${selectedEvent.name}`, cost: selectedEvent.price }]
    };
    
    if (onPayment) onPayment(newInvoice);
    
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
    
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let i = 1; i <= end.getDate(); i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    
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
          {(isAdmin || (isStaff && canManageEvents)) && (
            <button 
              onClick={() => setShowPayoutsToggle(!showPayoutsToggle)}
              className={`p-2 rounded border transition-colors ${showPayoutsToggle ? 'bg-sadaya-gold text-black border-sadaya-gold' : 'text-slate-400 border-white/10 hover:text-white'}`}
              title="Toggle Payout Visibility"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
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
              onClick={() => { setFormEvent(initialFormState); setIsEditing(false); setShowFormModal(true); }}
              className="bg-sadaya-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-white transition-colors"
            >
              <Plus className="w-5 h-5" /> Add Event
            </button>
          )}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const isFacilitator = currentUser.id === event.facilitatorId;
            const isOrganizer = currentUser.id === event.organizerId;
            const canSeePayouts = isAdmin || (showPayoutsToggle && (isFacilitator || isOrganizer));

            return (
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
                    <div className="flex gap-2">
                      {canManageEvents && (
                        <>
                          <button onClick={() => handleEditClick(event)} className="text-slate-500 hover:text-sadaya-gold p-1" title="Edit Single">
                            <Edit className="w-4 h-4" />
                          </button>
                          {event.seriesId && (
                            <button onClick={() => handleEditClick(event, true)} className="text-slate-500 hover:text-purple-400 p-1" title="Edit Series">
                              <CalendarIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteEvent(event.id, event.seriesId)} className="text-slate-500 hover:text-red-400 p-1" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-sm font-body mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-6 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-sadaya-gold" />
                      <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sadaya-gold" />
                      <span>{event.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-sadaya-gold" />
                      <span>{event.availableSeats} / {event.totalSeats} seats available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-sadaya-gold" />
                      <span>Facilitator: {teamMembers.find(m => m.id === event.facilitatorId)?.name || event.facilitatorName}</span>
                    </div>
                    {event.organizerName && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-purple-400" />
                        <span>Organizer: {event.organizerName}</span>
                      </div>
                    )}
                  </div>

                  {canSeePayouts && (
                    <div className="mt-auto mb-4 p-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Total Revenue:</span>
                        <span className="text-white font-bold">${event.price * (event.totalSeats - event.availableSeats)}</span>
                      </div>
                      {(isAdmin || isFacilitator) && (
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-sadaya-gold">Facilitator Payout:</span>
                          <span className="text-sadaya-gold font-bold">
                            ${calculatePayout(event.facilitatorPayoutType, event.facilitatorPayoutValue, event.price, event.totalSeats - event.availableSeats)}
                          </span>
                        </div>
                      )}
                      {(isAdmin || isOrganizer) && event.organizerId && (
                        <div className="flex justify-between text-xs">
                          <span className="text-purple-400">Organizer Payout:</span>
                          <span className="text-purple-400 font-bold">
                            ${calculatePayout(event.organizerPayoutType!, event.organizerPayoutValue!, event.price, event.totalSeats - event.availableSeats)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSelectedEvent(event)}
                        className="text-sadaya-gold hover:underline text-sm font-bold flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> Details
                      </button>
                      {(isAdmin || isFacilitator || isOrganizer) && (
                        <button 
                          onClick={() => { setSelectedEvent(event); setShowSignupsModal(true); }}
                          className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1"
                        >
                          <Users className="w-4 h-4" /> Signups ({event.totalSeats - event.availableSeats})
                        </button>
                      )}
                    </div>
                    
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
            );
          })}
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

      {/* Signups Modal */}
      {showSignupsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-headline font-bold text-white">Event Signups</h2>
              <button onClick={() => setShowSignupsModal(false)}><X className="text-slate-500 hover:text-white" /></button>
            </div>
            <div className="mb-4 text-sm text-slate-400">
              Event: <span className="text-white font-bold">{selectedEvent.name}</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {selectedEvent.attendees.length > 0 ? (
                selectedEvent.attendees.map((attendeeId, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-sadaya-gold/20 flex items-center justify-center text-sadaya-gold font-bold text-xs">
                      {attendeeId.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white text-sm font-bold">User {attendeeId}</div>
                      <div className="text-[10px] text-slate-500">Member since 2024</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">No signups yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && !showPaymentModal && !showSignupsModal && (
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
                <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">{selectedEvent.duration}</span>
              </div>
              
              <p className="text-slate-400 font-body mb-8 leading-relaxed">{selectedEvent.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-bold text-sadaya-sage uppercase tracking-widest mb-3">Facilitator</h4>
                  <div className="flex items-center gap-3">
                    <img src={selectedEvent.facilitatorPicture || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-white font-bold text-sm">{selectedEvent.facilitatorName}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{selectedEvent.facilitatorBio}</div>
                    </div>
                  </div>
                </div>
                {selectedEvent.organizerName && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Organizer</h4>
                    <div className="flex items-center gap-3">
                      <img src={selectedEvent.organizerPicture || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="text-white font-bold text-sm">{selectedEvent.organizerName}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{selectedEvent.organizerBio}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

      {/* Payment Modal */}
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
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 text-slate-400 hover:text-white font-bold">Cancel</button>
              <button onClick={confirmBooking} className="flex-[2] py-3 bg-sadaya-gold text-black rounded-xl font-bold hover:bg-white transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-headline text-white font-bold">{isEditing ? (editingSeries ? 'Edit Event Series' : 'Edit Single Event') : 'Create New Event'}</h2>
              <button onClick={() => setShowFormModal(false)}><X className="text-slate-500 hover:text-white" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Event Name</label>
                  <input type="text" value={formEvent.name} onChange={e => setFormEvent({...formEvent, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                </div>
                
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Description</label>
                  <textarea value={formEvent.description} onChange={e => setFormEvent({...formEvent, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none h-24" />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Cover Image URL</label>
                  <input type="text" value={formEvent.coverImage} onChange={e => setFormEvent({...formEvent, coverImage: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Price ($)</label>
                  <input type="number" value={formEvent.price} onChange={e => setFormEvent({...formEvent, price: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Duration (e.g. 60 mins)</label>
                  <input type="text" value={formEvent.duration} onChange={e => setFormEvent({...formEvent, duration: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Date</label>
                  <input type="date" value={formEvent.date} onChange={e => setFormEvent({...formEvent, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Time</label>
                  <input type="time" value={formEvent.time} onChange={e => setFormEvent({...formEvent, time: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Total Seats</label>
                  <input type="number" value={formEvent.totalSeats} onChange={e => setFormEvent({...formEvent, totalSeats: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                </div>

                {!isEditing && (
                  <div className="col-span-2 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-white">Is it recurring?</label>
                      <button onClick={() => setFormEvent({...formEvent, isRecurring: !formEvent.isRecurring})} className={`w-10 h-5 rounded-full relative transition-colors ${formEvent.isRecurring ? 'bg-sadaya-gold' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${formEvent.isRecurring ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>
                    {formEvent.isRecurring && (
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400">Recurring Cycle</label>
                        <select value={formEvent.recurringCycle} onChange={e => setFormEvent({...formEvent, recurringCycle: e.target.value as RecurringCycle})} className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white outline-none">
                          {Object.values(RecurringCycle).map(cycle => <option key={cycle} value={cycle}>{cycle}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="col-span-2 grid grid-cols-2 gap-4 p-4 bg-sadaya-gold/5 rounded-xl border border-sadaya-gold/20">
                  <h3 className="col-span-2 text-xs font-bold text-sadaya-gold uppercase tracking-widest">Facilitator Payout Settings</h3>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Facilitator</label>
                    <select value={formEvent.facilitatorId} onChange={e => setFormEvent({...formEvent, facilitatorId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white outline-none">
                      <option value="">Select Facilitator</option>
                      {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Payout Type</label>
                    <select value={formEvent.facilitatorPayoutType} onChange={e => setFormEvent({...formEvent, facilitatorPayoutType: e.target.value as PayoutType})} className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white outline-none">
                      {Object.values(PayoutType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">{formEvent.facilitatorPayoutType === PayoutType.FLAT ? 'Amount ($)' : 'Percentage (%)'}</label>
                    <input type="number" value={formEvent.facilitatorPayoutValue} onChange={e => setFormEvent({...formEvent, facilitatorPayoutValue: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                  <h3 className="col-span-2 text-xs font-bold text-purple-400 uppercase tracking-widest">Organizer Payout Settings</h3>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Organizer (Optional)</label>
                    <select value={formEvent.organizerId} onChange={e => setFormEvent({...formEvent, organizerId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white outline-none">
                      <option value="">None</option>
                      {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Payout Type</label>
                    <select value={formEvent.organizerPayoutType} onChange={e => setFormEvent({...formEvent, organizerPayoutType: e.target.value as PayoutType})} className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white outline-none">
                      {Object.values(PayoutType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">{formEvent.organizerPayoutType === PayoutType.FLAT ? 'Amount ($)' : 'Percentage (%)'}</label>
                    <input type="number" value={formEvent.organizerPayoutValue} onChange={e => setFormEvent({...formEvent, organizerPayoutValue: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-sadaya-gold outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
              <button onClick={() => setShowFormModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
              <button onClick={handleSaveEvent} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded-lg hover:bg-white transition-colors text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                {isEditing ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
