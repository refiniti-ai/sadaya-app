import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewState, UserRole, Invoice, Organization, Project, Task, User, TaskStatus, Proposal, ProposalStatus, SupportTicket, DriveItem, WaiverRecord, ClassEvent, RecurringCycle, PayoutType } from './types';
import { WaiverForm } from './components/WaiverForm';
import { WaiversModule } from './components/WaiversModule';
import { ProposalBuilder } from './components/ProposalBuilder';
import { OperationsHub } from './components/OperationsHub';
import { InvoiceSystem } from './components/InvoiceSystem';
import { SupportBot } from './components/SupportBot';
import { UserManagement } from './components/UserManagement';
import { SupportCenter } from './components/SupportCenter';
import { MarketingStrategist } from './components/MarketingStrategist';
import { CommunicationHub } from './components/CommunicationHub';
import { ClassesModule } from './components/ClassesModule';
import { 
  LayoutDashboard, 
  FileEdit, 
  CreditCard, 
  Briefcase, 
  BarChart, 
  Settings, 
  Bell, 
  UserCircle,
  LogOut,
  Menu,
  Users,
  Calendar,
  CheckCircle,
  FileText,
  Plus,
  Clock,
  ShieldAlert,
  LifeBuoy,
  Ban,
  MessageSquare,
  AlertCircle,
  Zap,
  Phone,
  PenTool,
  Activity,
  Server,
  Database,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  Shield,
  ShieldCheck
} from 'lucide-react';

// ... (INITIAL_DRIVE_ITEMS const remains the same)
const INITIAL_DRIVE_ITEMS: DriveItem[] = [
    // ROOT FOLDERS
    { id: '1', parentId: null, name: 'Brand Assets', type: 'folder', updatedAt: '2023-10-25' },
    { id: '2', parentId: null, name: 'Legal Documents', type: 'folder', updatedAt: '2023-10-22' },
    { id: '3', parentId: null, name: 'Project Intake Forms', type: 'folder', updatedAt: '2023-10-24' },
    
    // ROOT FILES
    { 
        id: '4', 
        parentId: null, 
        name: 'Client_Logins_Master.xlsx', 
        type: 'spreadsheet', 
        size: '15 KB', 
        updatedAt: '2023-10-20', 
        tags: ['sensitive'],
        content: [
            { platform: 'Guest Portal Admin', url: 'https://sadayasanctuary.com/admin', username: 'admin_sadaya', password: 'secure_password_123', notes: 'Main CMS access' },
            { platform: 'Google Analytics', url: 'https://analytics.google.com', username: 'marketing@client.com', password: 'shared_access_2024', notes: 'View only' },
            { platform: 'Meta Business Suite', url: 'https://business.facebook.com', username: 'social@client.com', password: 'fb_ads_manager_key', notes: 'Ad account ID: 123456789' },
            { platform: 'Mailchimp', url: 'https://mailchimp.com', username: 'newsletter@client.com', password: 'email_blast_key_99', notes: '2FA enabled' },
            { platform: 'Stripe Dashboard', url: 'https://dashboard.stripe.com', username: 'billing@client.com', password: 'finance_key_secure', notes: 'Finance team only' },
        ]
    },
    
    // BRAND ASSETS CONTENT
    { id: '11', parentId: '1', name: 'Logo_Pack_Vector.zip', type: 'file', size: '24 MB', updatedAt: '2023-10-25' },
    { id: '12', parentId: '1', name: 'Brand_Guidelines_V2.pdf', type: 'file', size: '4.2 MB', updatedAt: '2023-10-25' },
    { id: '13', parentId: '1', name: 'Social_Media_Kit', type: 'folder', updatedAt: '2023-10-26' },

    // SOCIAL MEDIA KIT CONTENT
    { id: '131', parentId: '13', name: 'Instagram_Templates.psd', type: 'file', size: '120 MB', updatedAt: '2023-10-26' },
    { id: '132', parentId: '13', name: 'LinkedIn_Banners.ai', type: 'file', size: '45 MB', updatedAt: '2023-10-26' },

    // LEGAL CONTENT
    { id: '21', parentId: '2', name: 'MSA_Signed.pdf', type: 'file', size: '1.2 MB', updatedAt: '2023-09-15' },
    { id: '22', parentId: '2', name: 'NDA_Executed.pdf', type: 'file', size: '850 KB', updatedAt: '2023-09-10' },

    // INTAKE CONTENT
    { id: '31', parentId: '3', name: 'Q4_Marketing_Brief.docx', type: 'file', size: '24 KB', updatedAt: '2023-10-24' },
    { id: '32', parentId: '3', name: 'Website_Requirements.pdf', type: 'file', size: '1.5 MB', updatedAt: '2023-10-24' },
    { id: '33', parentId: '3', name: 'User_Personas.pdf', type: 'file', size: '2.1 MB', updatedAt: '2023-10-23' },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'6months' | 'ytd'>('6months');
  
  // Notification Settings State
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
      proposals: true,
      invoices: true,
      tasks: true,
      tickets: true,
      classes: true
  });

  // Refs for click outside
  const notificationRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
          if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
              setShowQuickActions(false);
          }
          if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
              setShowProfileSettings(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper for dates
  const getFutureDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
  }

  // Helper to get a past date string
  const getPastDate = (monthsAgo: number, day: number = 15) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    d.setDate(day);
    return d.toISOString().split('T')[0];
  };

  // --- DATA STATE ---
  
  // Drive State (Lifted from OperationsHub)
  const [driveItems, setDriveItems] = useState<DriveItem[]>(INITIAL_DRIVE_ITEMS);

  // Waivers Records
  const [waivers, setWaivers] = useState<WaiverRecord[]>([
      { id: 'wv-1', userId: 'c1', userName: 'James Wilson', orgId: 'org1', orgName: 'Executive Wellness Group', signedDate: '2025-12-15', signature: 'James Wilson', initials: 'JW' },
      { id: 'wv-2', userId: 'c2', userName: 'Elena Rodriguez', orgId: 'org2', orgName: 'Holistic Life Path', signedDate: '2026-01-01', signature: 'Elena Rodriguez', initials: 'ER' }
  ]);

  // Organizations & Users
  const [organizations, setOrganizations] = useState<Organization[]>([
      { 
          id: 'org1', name: 'Executive Wellness Group', industry: 'Corporate Wellness', status: 'Active',
          logo: '',
          assignedEmployees: ['2', '3'], // Sarah & Mike
        users: [
            { id: 'c1', name: 'James Wilson', email: 'james@corpwell.com', phone: '555-0201', role: UserRole.CLIENT, status: 'Active', waiverSigned: true, waiverSignedDate: '2025-12-15', permissions: ['view_dashboard', 'view_proposals', 'view_operations', 'view_finance', 'view_support', 'view_users', 'view_marketing', 'view_classes'], bio: 'Executive seeking balance and stress management.', profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
            { id: 'c3', name: 'Sarah Miller', email: 'sarah@corpwell.com', phone: '555-0203', role: UserRole.CLIENT, status: 'Active', waiverSigned: false, permissions: ['view_dashboard', 'view_finance', 'view_users', 'view_classes'], bio: 'Focusing on nutritional health and wellness.', profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' }
        ]
    },
    { 
        id: 'org2', name: 'Holistic Life Path', industry: 'Individual Coaching', status: 'Onboarding',
        assignedEmployees: ['2'], // Sarah only
        users: [
            { id: 'c2', name: 'Elena Rodriguez', email: 'elena@lifepath.com', phone: '555-0202', role: UserRole.CLIENT, status: 'Active', waiverSigned: true, waiverSignedDate: '2026-01-01', permissions: ['view_dashboard', 'view_proposals', 'view_support', 'view_marketing', 'view_users', 'view_classes'], bio: 'Spiritual seeker and holistic health enthusiast.', profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' }
        ]
    },
      { id: 'org3', name: 'Serenity Foundation', industry: 'Non-Profit', status: 'Active', assignedEmployees: [], users: [] },
  ]);

  const [individuals, setIndividuals] = useState<User[]>([
    { 
        id: 'ind1', name: 'Michael Chen', email: 'michael@gmail.com', phone: '555-0301', role: UserRole.CLIENT, status: 'Active', waiverSigned: true, waiverSignedDate: '2026-01-05', permissions: ['view_dashboard', 'view_classes'], bio: 'Self-employed wellness seeker.', profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' 
    }
  ]);

  const [teamMembers, setTeamMembers] = useState<User[]>([
      { 
          id: '1', name: 'Sadaya Admin', email: 'admin@sadaya.com', phone: '555-0101', role: UserRole.SUPER_ADMIN, status: 'Active',
          permissions: ['view_dashboard', 'view_proposals', 'edit_proposals', 'view_operations', 'edit_operations', 'view_finance', 'edit_finance', 'view_users', 'edit_users', 'view_marketing', 'edit_marketing', 'view_support', 'edit_support', 'view_classes', 'edit_classes'],
          bio: 'Lead administrator at Sadaya Sanctuary with over 15 years of experience in holistic wellness management.',
          profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
      },
      { 
          id: '2', name: 'Dr. Aris (Naturopath)', email: 'aris@sadaya.com', phone: '555-0102', role: UserRole.EMPLOYEE, status: 'Active',
          permissions: ['view_dashboard', 'view_operations', 'edit_operations', 'view_proposals', 'view_classes', 'edit_classes'],
          bio: 'Licensed Naturopathic Doctor specializing in detox and nutritional recovery.',
          profilePicture: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop'
      },
      { 
          id: '3', name: 'Marcus (Chief)', email: 'marcus@sadaya.com', phone: '555-0103', role: UserRole.SALES, status: 'Active',
          permissions: ['view_dashboard', 'view_proposals', 'edit_proposals', 'view_invoices', 'view_users', 'view_classes'],
          bio: 'Culinary expert and wellness chef focused on healing through nutrition.',
          profilePicture: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100&h=100&fit=crop'
      },
  ]);

  // Current User State
  const [currentUser, setCurrentUser] = useState<User>(teamMembers[0]);
  const [originalUser, setOriginalUser] = useState<User | null>(null); // For reverting "Login As"

  // SECURITY: Prevent deleted users from staying logged in
  useEffect(() => {
    const allUsers = [
      ...teamMembers,
      ...organizations.flatMap(org => org.users),
      ...individuals
    ];
    
    const userStillExists = allUsers.some(u => u.id === currentUser.id);
    
    if (!userStillExists && currentUser.role !== UserRole.SUPER_ADMIN && !originalUser) {
      // Revert to first team member (Admin) if current user is deleted
      setCurrentUser(teamMembers[0]);
      setOriginalUser(null);
      setView('dashboard');
    }
  }, [teamMembers, organizations, individuals, currentUser.id]);

  // Projects & Tasks
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', clientId: 'org1', title: 'Executive Burnout Recovery', description: '4-week comprehensive recovery plan.', status: 'Active', progress: 65, dueDate: getFutureDate(14), members: ['Dr. Aris (Naturopath)', 'Marcus (Chief)'] },
    { id: 'p2', clientId: 'org1', title: 'Holistic Nutritional Plan', description: 'Customized chief prepared meals and supplements.', status: 'Active', progress: 30, dueDate: getFutureDate(30), members: ['Marcus (Chief)', 'Sadaya Admin'] },
    { id: 'p3', clientId: 'org2', title: 'PTSD Integration Path', description: 'Alternative treatments and spiritual workshops.', status: 'Active', progress: 90, dueDate: getFutureDate(5), members: ['Sadaya Admin'] },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: 't1', projectId: 'p1', clientId: 'org1', title: 'Initial Blood Panel Analysis', description: 'Review comprehensive blood work for James Wilson.', status: TaskStatus.IN_PROGRESS, assignee: 'Dr. Aris (Naturopath)', dueDate: getFutureDate(1), priority: 'High',
      checklist: [{id: 'c1', text: 'Receive lab results', completed: true}, {id: 'c2', text: 'Draft care plan', completed: true}, {id: 'c3', text: 'Schedule review session', completed: false}]
    },
    { 
      id: 't2', projectId: 'p1', clientId: 'org1', title: 'Cold Plunge & Sauna Schedule', description: 'Set up daily sessions for recovery.', status: TaskStatus.TODO, assignee: 'Marcus (Chief)', dueDate: getFutureDate(5), priority: 'Medium',
      checklist: [{id: 'c4', text: 'Check temperature stability', completed: false}, {id: 'c5', text: 'Provision towels and herbs', completed: false}]
    },
    { 
      id: 't3', projectId: 'p1', clientId: 'org1', title: 'Spiritual Workshop Setup', description: 'Prepare materials for the daily workshop.', status: TaskStatus.DONE, assignee: 'Sadaya Admin', dueDate: getFutureDate(-2), priority: 'Low',
      checklist: []
    },
    { 
      id: 't4', projectId: 'p2', clientId: 'org1', title: 'Menu Customization', description: 'Adjust meals for gluten-free requirements.', status: TaskStatus.REVIEW, assignee: 'Marcus (Chief)', dueDate: getFutureDate(10), priority: 'High',
      checklist: [{id: 'c6', text: 'Audit pantry', completed: true}, {id: 'c7', text: 'Draft weekly menu', completed: false}]
    },
    // New Tasks for Gantt Visualization
    {
      id: 't5', projectId: 'p1', clientId: 'org1', title: 'Therapy Session Coordination', description: 'Align coaching and therapy schedules.', status: TaskStatus.TODO, assignee: 'Sadaya Admin', dueDate: getFutureDate(8), priority: 'High',
      checklist: [{id: 'c8', text: 'Confirm therapist availability', completed: false}, {id: 'c9', text: 'Update digital calendar', completed: false}]
    },
    {
      id: 't6', projectId: 'p1', clientId: 'org1', title: 'Pickleball Court Maintenance', description: 'Routine check of onsite court.', status: TaskStatus.TODO, assignee: 'Marcus (Chief)', dueDate: getFutureDate(12), priority: 'Medium',
      checklist: [{id: 'c10', text: 'Sweep surface', completed: false}, {id: 'c11', text: 'Check net tension', completed: false}]
    },
    {
      id: 't7', projectId: 'p2', clientId: 'org1', title: 'Supplement Supply Audit', description: 'Check stock for naturopathic package.', status: TaskStatus.IN_PROGRESS, assignee: 'Marcus (Chief)', dueDate: getFutureDate(15), priority: 'Medium',
      checklist: [{id: 'c12', text: 'Inventory check', completed: true}, {id: 'c13', text: 'Order magnesium', completed: false}, {id: 'c14', text: 'Order vitamin D3', completed: false}]
    },
    {
      id: 't8', projectId: 'p1', clientId: 'org1', title: 'Final Integration Report', description: 'Summarize healing paths unlocked.', status: TaskStatus.DONE, assignee: 'Sadaya Admin', dueDate: getFutureDate(-1), priority: 'Low',
      checklist: []
    }
  ]);

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([
      {
          id: 'TCK-1001',
          clientId: 'c1',
          clientName: 'James Wilson',
          organizationName: 'Executive Wellness Group',
          subject: 'Meal Preference Update',
          status: 'Open',
          priority: 'High',
          createdAt: 'Jan 08, 2026',
          lastUpdated: '2 hours ago',
          messages: [
              { id: 'm1', senderId: 'c1', senderName: 'James Wilson', text: 'I would like to increase my protein intake for the evening meals.', timestamp: '10:00 AM', isAdmin: false },
              { id: 'm2', senderId: '1', senderName: 'Sadaya Admin', text: 'Relaying this to Marcus. He will adjust the menu.', timestamp: '10:05 AM', isAdmin: true }
          ]
      },
      {
          id: 'TCK-1002',
          clientId: 'c2',
          clientName: 'Elena Rodriguez',
          organizationName: 'Holistic Life Path',
          subject: 'Tour Schedule Inquiry',
          status: 'Resolved',
          priority: 'Medium',
          createdAt: 'Jan 05, 2026',
          lastUpdated: '1 day ago',
          messages: [
              { id: 'm3', senderId: 'c2', senderName: 'Elena Rodriguez', text: 'Can I schedule a tour for this Saturday?', timestamp: '09:00 AM', isAdmin: false }
          ]
      }
  ]);

  // Proposals
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: '1',
      clientId: 'org1',
      clientName: 'Executive Wellness Group',
      clientEmail: 'james@corpwell.com',
      services: ['Retreat Stay', 'Naturopathic Package'],
      customDetails: 'Executive seeks burnout recovery and holistic healing.',
      estimatedUpfront: 12000,
      estimatedRetainer: 4000,
      content: {
         hero: { title: "Wellness Proposal for James Wilson", subtitle: "4-Week Recovery Path" },
         engine: { generatedValue: 25000, description: "Holistic health optimization." },
         phases: [
            {
                title: "Phase 1: Foundation & Detox",
                description: "Initial week focusing on physical rest and nutritional reset.",
                items: ["Blood Panel", "Custom Meal Plan", "Daily Cold Plunge"]
            }
         ], 
         investment: [
             { item: 'Retreat Stay (4 Weeks)', costInitial: 8000, costMonthly: 0 },
             { item: 'Naturopathic Package', costInitial: 4000, costMonthly: 0 },
             { item: 'Integration Coaching', costInitial: 0, costMonthly: 4000 }
         ], 
         strategy: [{ title: 'Healing Path', content: 'Focus on mind-body-soul integration.'}], 
         adSpend: []
      },
      status: ProposalStatus.SENT_TO_CLIENT,
      createdAt: '2026-01-08'
    },
    {
      id: '2',
      clientId: 'org2',
      clientName: 'Holistic Life Path',
      services: ['2-Week Retreat'],
      customDetails: '',
      estimatedUpfront: 6000,
      estimatedRetainer: 2000,
      content: {
         hero: { title: "Retreat Proposal for Elena Rodriguez", subtitle: "Path to Integration" },
         engine: { generatedValue: 12000, description: "Healing paths unlocked." },
         phases: [], 
         investment: [], 
         strategy: [], 
         adSpend: []
      },
      status: ProposalStatus.DRAFT,
      createdAt: '2026-01-09'
    }
  ]);

  // Invoices with realistic historical data for chart visualization
  const [invoices, setInvoices] = useState<Invoice[]>([
    // Current month
    {
      id: 'INV-2026-001',
      proposalId: 'p1',
      clientName: 'Apex Innovations',
      amount: 5000,
      type: 'Upfront',
      status: 'Paid',
      dueDate: getFutureDate(10),
      issueDate: getPastDate(0, 3),
      terms: 'Net 14',
      items: [
        {description: 'Digital Infrastructure Setup', cost: 2000},
        {description: 'Brand Identity Vectorization', cost: 1500},
        {description: 'Initial Strategy Development', cost: 1500},
      ]
    },
    {
      id: 'INV-2026-002',
      proposalId: 'p1',
      clientName: 'Apex Innovations',
      amount: 2500,
      type: 'Retainer',
      status: 'Pending',
      dueDate: getFutureDate(15),
      issueDate: getPastDate(0, 1),
      terms: 'Net 30',
      items: [
        {description: 'Monthly Performance Marketing Suite', cost: 2500}
      ]
    },
    {
      id: 'INV-2026-004',
      proposalId: 'p2',
      clientName: 'Zenith Health',
      amount: 4800,
      type: 'Retainer',
      status: 'Pending',
      dueDate: getFutureDate(7),
      issueDate: getPastDate(0, 2),
      terms: 'Net 14',
      items: [
        {description: 'Monthly Healthcare Marketing', cost: 2800},
        {description: 'Patient Engagement Automation', cost: 2000}
      ]
    },
    {
      id: 'INV-2026-005',
      proposalId: 'p3',
      clientName: 'Vortex Logistics',
      amount: 6500,
      type: 'Upfront',
      status: 'Overdue',
      dueDate: getPastDate(0, 5),
      issueDate: getPastDate(0, 20),
      terms: 'Net 14',
      items: [
        {description: 'Logistics Dashboard Phase 2', cost: 4000},
        {description: 'Mobile App Integration', cost: 2500}
      ]
    },
    // 1 month ago
    {
      id: 'INV-2025-012',
      proposalId: 'p1',
      clientName: 'Apex Innovations',
      amount: 8500,
      type: 'Upfront',
      status: 'Paid',
      dueDate: getPastDate(1, 20),
      issueDate: getPastDate(1, 5),
      terms: 'Net 14',
      items: [
        {description: 'Q4 Campaign Launch', cost: 5000},
        {description: 'Landing Page Redesign', cost: 3500},
      ]
    },
    {
      id: 'INV-2025-011',
      proposalId: 'p2',
      clientName: 'Zenith Health',
      amount: 3200,
      type: 'Retainer',
      status: 'Paid',
      dueDate: getPastDate(1, 15),
      issueDate: getPastDate(1, 1),
      terms: 'Net 14',
      items: [
        {description: 'Monthly SEO & Content', cost: 3200},
      ]
    },
    // 2 months ago
    {
      id: 'INV-2025-010',
      proposalId: 'p1',
      clientName: 'Apex Innovations',
      amount: 12000,
      type: 'Upfront',
      status: 'Paid',
      dueDate: getPastDate(2, 25),
      issueDate: getPastDate(2, 10),
      terms: 'Net 14',
      items: [
        {description: 'Enterprise Platform Build', cost: 8000},
        {description: 'API Integration Suite', cost: 4000},
      ]
    },
    {
      id: 'INV-2025-009',
      proposalId: 'p2',
      clientName: 'Zenith Health',
      amount: 4500,
      type: 'Upfront',
      status: 'Paid',
      dueDate: getPastDate(2, 20),
      issueDate: getPastDate(2, 5),
      terms: 'Net 14',
      items: [
        {description: 'Patient Portal MVP', cost: 4500},
      ]
    },
    // 3 months ago
    {
      id: 'INV-2025-008',
      proposalId: 'p1',
      clientName: 'Apex Innovations',
      amount: 6800,
      type: 'Retainer',
      status: 'Paid',
      dueDate: getPastDate(3, 15),
      issueDate: getPastDate(3, 1),
      terms: 'Net 14',
      items: [
        {description: 'Performance Marketing Q3', cost: 4000},
        {description: 'Social Media Management', cost: 2800},
      ]
    },
    {
      id: 'INV-2025-007',
      proposalId: 'p3',
      clientName: 'Vortex Logistics',
      amount: 9500,
      type: 'Upfront',
      status: 'Paid',
      dueDate: getPastDate(3, 20),
      issueDate: getPastDate(3, 8),
      terms: 'Net 14',
      items: [
        {description: 'Supply Chain Dashboard', cost: 6000},
        {description: 'Fleet Tracking Integration', cost: 3500},
      ]
    },
    // 4 months ago
    {
      id: 'INV-2025-006',
      proposalId: 'p2',
      clientName: 'Zenith Health',
      amount: 15000,
      type: 'Upfront',
      status: 'Paid',
      dueDate: getPastDate(4, 25),
      issueDate: getPastDate(4, 12),
      terms: 'Net 14',
      items: [
        {description: 'HIPAA Compliance Audit', cost: 5000},
        {description: 'Telehealth Platform', cost: 10000},
      ]
    },
    {
      id: 'INV-2025-005',
      proposalId: 'p1',
      clientName: 'Apex Innovations',
      amount: 3500,
      type: 'Retainer',
      status: 'Paid',
      dueDate: getPastDate(4, 15),
      issueDate: getPastDate(4, 1),
      terms: 'Net 14',
      items: [
        {description: 'Monthly Retainer - August', cost: 3500},
      ]
    },
    // 5 months ago
    {
      id: 'INV-2025-004',
      proposalId: 'p1',
      clientName: 'Apex Innovations',
      amount: 7200,
      type: 'Upfront',
      status: 'Paid',
      dueDate: getPastDate(5, 20),
      issueDate: getPastDate(5, 5),
      terms: 'Net 14',
      items: [
        {description: 'Brand Refresh Package', cost: 4200},
        {description: 'Video Production', cost: 3000},
      ]
    },
    {
      id: 'INV-2025-003',
      proposalId: 'p3',
      clientName: 'Vortex Logistics',
      amount: 5500,
      type: 'Upfront',
      status: 'Paid',
      dueDate: getPastDate(5, 18),
      issueDate: getPastDate(5, 3),
      terms: 'Net 14',
      items: [
        {description: 'Initial Consulting & Strategy', cost: 2500},
        {description: 'UX Research & Wireframes', cost: 3000},
      ]
    },
    // Draft invoice for current period
    {
      id: 'INV-2026-003',
      proposalId: 'p2',
      clientName: 'Zenith Health',
      amount: 12500,
      type: 'Upfront',
      status: 'Draft',
      dueDate: getFutureDate(30),
      issueDate: '',
      terms: 'Net 30',
      items: [
        {description: 'Enterprise Web Development', cost: 8000},
        {description: 'Video Production (3D Animation)', cost: 4500}
      ]
    }
  ]);

  // Classes & Events State
  const [events, setEvents] = useState<ClassEvent[]>([
    {
      id: 'ev-1',
      name: 'Sunrise Flow Yoga',
      description: 'A gentle morning flow to awaken the body and mind. Perfect for all levels. Focus on breath-to-movement connection and setting positive intentions for the day.',
      coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      price: 25,
      date: getFutureDate(2),
      time: '07:00',
      duration: '60 mins',
      totalSeats: 15,
      availableSeats: 12,
      isRecurring: true,
      recurringCycle: RecurringCycle.DAILY,
      facilitatorId: '2',
      facilitatorName: 'Dr. Aris (Naturopath)',
      facilitatorPicture: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop',
      facilitatorBio: 'Licensed Naturopathic Doctor specializing in detox and nutritional recovery.',
      facilitatorPayoutType: PayoutType.FLAT,
      facilitatorPayoutValue: 15,
      attendees: ['c1', 'c2']
    },
    {
      id: 'ev-2',
      name: 'Trauma Release Workshop',
      description: 'Deep somatic processing workshop focused on releasing stored tension and emotional blockages through guided movement and breathwork.',
      coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
      price: 150,
      date: getFutureDate(5),
      time: '14:00',
      duration: '2 hours',
      totalSeats: 10,
      availableSeats: 4,
      isRecurring: false,
      recurringCycle: RecurringCycle.NONE,
      facilitatorId: '1',
      facilitatorName: 'Sadaya Admin',
      facilitatorPicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      facilitatorBio: 'Lead administrator at Sadaya Sanctuary with over 15 years of experience in holistic wellness management.',
      facilitatorPayoutType: PayoutType.PERCENTAGE,
      facilitatorPayoutValue: 50,
      attendees: ['c1']
    }
  ]);

  // Handle Permissions
  const hasPermission = (module: string) => currentUser.permissions.includes(module);

  // Handle Login As
  const handleLoginAs = (user: User) => {
    if (user.status === 'Suspended') {
        alert("Access Denied: This user account is currently suspended.");
        return;
    }
    if (!originalUser) {
        setOriginalUser(currentUser);
    }
    setCurrentUser(user);
    // Reset view to dashboard to avoid permission conflict on current view
    setView('dashboard');
  };

  const handleRevertLogin = () => {
      if (originalUser) {
          setCurrentUser(originalUser);
          setOriginalUser(null);
          setView('dashboard');
      }
  };

  const handleWaiverSigned = (name: string, signedDate: string, initials: string) => {
    // 1. Update current user state
    const updatedUser = { ...currentUser, waiverSigned: true, waiverSignedDate: signedDate };
    setCurrentUser(updatedUser);

    // 2. Update organizations state to persist the change for this user
    setOrganizations(prev => prev.map(org => ({
      ...org,
      users: org.users.map(u => u.id === currentUser.id ? { ...u, waiverSigned: true, waiverSignedDate: signedDate } : u)
    })));

    // 3. Create a new waiver record
    const userOrg = organizations.find(o => o.users.some(u => u.id === currentUser.id));
    const newRecord: WaiverRecord = {
      id: `wv-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      orgId: userOrg?.id || 'unknown',
      orgName: userOrg?.name || 'Individual',
      signedDate: signedDate,
      signature: name,
      initials: initials
    };
    setWaivers(prev => [newRecord, ...prev]);

    // 4. (Optional) Show a success toast or notification
    console.log(`Waiver signed by ${name} on ${signedDate} with initials ${initials}`);
  };

  // ... (Rest of component remains the same)
  // ... (ACTIONS, FILTERS, ACTIVITY FEED logic remains same)
  // --- ACTIONS ---
  const handleProposalAccepted = (proposalId: string) => {
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) return;

      // 1. Update Proposal Status
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: ProposalStatus.ACCEPTED } : p));

      // 2. Generate Invoice (Draft/Review Status)
      const upfrontItems = proposal.content.investment.filter(i => i.costInitial > 0);
      const newInvoice: Invoice = {
          id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          proposalId: proposal.id,
          clientName: proposal.clientName,
          type: 'Upfront',
          amount: upfrontItems.reduce((acc, i) => acc + i.costInitial, 0),
          status: 'Draft',
          dueDate: getFutureDate(30), // Default Net 30
          issueDate: getFutureDate(0), // Today
          terms: 'Net 30',
          items: upfrontItems.map(i => ({ description: i.item, cost: i.costInitial }))
      };

      setInvoices(prev => [newInvoice, ...prev]);
  };

  // --- FILTERS ---
  const getFilteredProposals = () => {
      if (currentUser.role === UserRole.CLIENT) {
          const userOrg = organizations.find(o => o.users.some(u => u.id === currentUser.id));
          return proposals.filter(p => p.clientId === userOrg?.id);
      }
      return proposals;
  };

  const getFilteredInvoices = () => {
      if (currentUser.role === UserRole.CLIENT) {
          const userOrg = organizations.find(o => o.users.some(u => u.id === currentUser.id));
          return invoices.filter(i => i.clientName === userOrg?.name && i.status !== 'Draft');
      }
      return invoices;
  };

  const getFilteredTickets = () => {
      if (currentUser.role === UserRole.CLIENT) {
          const userOrg = organizations.find(o => o.users.some(u => u.id === currentUser.id));
          return tickets.filter(t => t.organizationName === userOrg?.name);
      }
      return tickets;
  }

  const getFilteredProjects = () => {
      if (currentUser.role === UserRole.CLIENT) {
          const userOrg = organizations.find(o => o.users.some(u => u.id === currentUser.id));
          return projects.filter(p => p.clientId === userOrg?.id);
      }
      // For employees, show projects they are a member of OR if they are admin
      if (currentUser.role === UserRole.SUPER_ADMIN) return projects;
      return projects.filter(p => p.members.includes(currentUser.name) || p.members.includes(currentUser.id));
  }

  // --- DYNAMIC NOTIFICATIONS & FEED ---
  const activityFeed = useMemo(() => {
      const feed = [];
      const now = new Date();
      const nowTime = now.getTime();

      // 1. Proposals
      if (notificationPreferences.proposals) {
          getFilteredProposals().forEach(p => {
              if (new Date(p.createdAt).getTime() > nowTime - 86400000 * 2) {
                  feed.push({ id: `np-${p.id}`, type: 'proposal', title: 'New Proposal Created', desc: `${p.clientName} - ${p.services.join(', ')}`, time: 'Recently', timestamp: new Date(p.createdAt).getTime(), linkView: 'proposals', icon: FileText, color: 'text-blue-400' });
              }
              if (p.status === ProposalStatus.ACCEPTED) {
                  feed.push({ id: `ap-${p.id}`, type: 'proposal', title: 'Proposal Accepted', desc: `${p.clientName} accepted proposal`, time: 'Recently', timestamp: new Date(p.createdAt).getTime(), linkView: 'proposals', icon: CheckCircle, color: 'text-green-400' });
              }
          });
      }

      // 2. Tasks
      if (notificationPreferences.tasks) {
          tasks.forEach(t => {
              if (t.assignee === currentUser.name || t.description.includes(`@${currentUser.name}`)) {
                  feed.push({ id: `nt-${t.id}`, type: 'task', title: 'Task Assignment', desc: `${t.title} assigned to you`, time: 'Recently', timestamp: Date.now(), linkView: 'operations', icon: Briefcase, color: 'text-yellow-400' });
              }
              const due = new Date(t.dueDate);
              if (due.getTime() > nowTime && due.getTime() < nowTime + 86400000 * 2 && t.status !== TaskStatus.DONE) {
                  // Sort based on current time (notification trigger), not due date, so it doesn't float to top forever
                  feed.push({ id: `dl-${t.id}`, type: 'task', title: 'Approaching Deadline', desc: `${t.title} due soon`, time: t.dueDate, timestamp: nowTime, linkView: 'operations', icon: AlertCircle, color: 'text-red-400' });
              }
          });
      }

      // 3. Invoices
      if (notificationPreferences.invoices) {
          const allInvoices = currentUser.role === UserRole.CLIENT ? getFilteredInvoices() : invoices;
          allInvoices.forEach(i => {
              if (i.status === 'Paid') {
                  feed.push({ id: `ip-${i.id}`, type: 'invoice', title: 'Invoice Paid', desc: `#${i.id} - $${i.amount.toLocaleString()}`, time: 'Recently', timestamp: Date.now() - 3600000, linkView: 'invoices', icon: CheckCircle, color: 'text-green-400' });
              }
              if (i.status === 'Pending' && new Date(i.issueDate || '').getTime() > nowTime - 86400000 * 2) {
                  feed.push({ id: `ni-${i.id}`, type: 'invoice', title: 'New Invoice Issued', desc: `#${i.id} to ${i.clientName}`, time: 'Recently', timestamp: new Date(i.issueDate || '').getTime(), linkView: 'invoices', icon: CreditCard, color: 'text-purple-400' });
              }
              if (i.status === 'Draft' && currentUser.role !== UserRole.CLIENT) {
                   // Offset timestamp slightly so it appears at top if generated concurrently with other actions
                   feed.push({ id: `dr-${i.id}`, type: 'invoice', title: 'Invoice Needs Review', desc: `#${i.id} for ${i.clientName} generated. Review before sending.`, time: 'Action Required', timestamp: nowTime + 100, linkView: 'invoices', icon: FileEdit, color: 'text-orange-400' });
              }
          });
      }

      // 4. Tickets
      if (notificationPreferences.tickets) {
          getFilteredTickets().forEach(t => {
              if (t.status === 'Open') {
                  feed.push({ id: `tk-${t.id}`, type: 'ticket', title: 'New Support Ticket', desc: `${t.subject} (${t.priority})`, time: t.lastUpdated, timestamp: Date.now(), linkView: 'support_center', icon: LifeBuoy, color: 'text-orange-400' });
              }
          });
      }

      return feed.sort((a, b) => b.timestamp - a.timestamp);
  }, [proposals, tasks, invoices, tickets, currentUser, notificationPreferences]);

  const invoicePerformanceData = useMemo(() => {
    const now = new Date();
    
    // Determine number of months based on chartPeriod
    let monthCount: number;
    if (chartPeriod === 'ytd') {
      // Year to date: from January to current month
      monthCount = now.getMonth() + 1; // getMonth() is 0-indexed
    } else {
      // Last 6 months
      monthCount = 6;
    }
    
    const months = Array.from({ length: monthCount }, (_, idx) => {
      const date = chartPeriod === 'ytd'
        ? new Date(now.getFullYear(), idx, 1) // Jan to current month
        : new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - idx), 1); // Last 6 months
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return {
        key,
        label: date.toLocaleString('en-US', { month: 'short' }),
        value: 0
      };
    });
    const monthMap = new Map(months.map(month => [month.key, month]));

    invoices.forEach((invoice) => {
      const dateCandidate = invoice.issueDate || invoice.dueDate;
      const parsed = new Date(dateCandidate);
      if (Number.isNaN(parsed.getTime())) return;
      const invoiceKey = `${parsed.getFullYear()}-${parsed.getMonth()}`;
      const monthEntry = monthMap.get(invoiceKey);
      if (monthEntry) {
        monthEntry.value += invoice.amount;
      }
    });

    return months;
  }, [invoices, chartPeriod]);
  const maxInvoiceValue = Math.max(1, ...invoicePerformanceData.map(item => item.value));

  // Logo Component
  const Logo = () => (
    <div className="flex flex-col font-display select-none">
       <div className="relative leading-none">
         <span className="text-2xl font-headline font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sadaya-gold to-sadaya-tan filter drop-shadow-[0_0_8px_rgba(246,223,188,0.3)]">
           SADAYA
         </span>
       </div>
       <div className="relative leading-none mt-1">
         <span className="text-xl font-headline font-light text-sadaya-sage italic tracking-[0.2em]">SANCTUARY</span>
       </div>
    </div>
  );

  const NavItem = ({ id, label, icon: Icon, reqPerm }: { id: ViewState, label: string, icon: any, reqPerm: string }) => {
    if (!hasPermission(reqPerm)) return null;
    return (
        <button
          onClick={() => {
              setView(id);
              if (window.innerWidth < 1024) setSidebarOpen(false); // Close on mobile click
          }}
          className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200 group relative overflow-hidden ${
            view === id 
              ? 'text-white bg-white/10 border-r-2 border-sadaya-gold' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icon className={`w-5 h-5 mr-3 ${view === id ? 'text-sadaya-gold' : 'group-hover:text-sadaya-gold'}`} />
          <span className="font-medium tracking-wide font-headline">{label}</span>
          {view === id && (
            <div className="absolute inset-0 bg-gradient-to-r from-sadaya-gold/10 to-transparent pointer-events-none" />
          )}
        </button>
    );
  };

  if (currentUser.status === 'Suspended') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-sadaya-forest text-white">
              <div className="glass-panel p-12 rounded-2xl text-center max-w-md">
                  <Ban className="w-16 h-16 text-red-500 mx-auto mb-6"/>
                  <h1 className="text-2xl font-headline font-bold mb-2">Access Suspended</h1>
                  <p className="text-slate-400 font-body mb-8">Your account has been suspended by the administrator. Please contact support for assistance.</p>
                  {originalUser && (
                      <button 
                        onClick={handleRevertLogin}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold"
                      >
                          Revert to Admin
                      </button>
                  )}
              </div>
          </div>
      );
  }

  // Waiver Enforcement Gate
  if (currentUser.role === UserRole.CLIENT && !currentUser.waiverSigned) {
    return <WaiverForm user={currentUser} onSign={handleWaiverSigned} />;
  }

  return (
    <div className="min-h-screen flex bg-sadaya-forest text-slate-200 font-sans selection:bg-sadaya-gold selection:text-black overflow-hidden">
      {/* ... (Rest of render code remains the same) ... */}
      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
          <div className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <Logo />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400"><LogOut className="w-5 h-5 rotate-180"/></button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <p className="px-4 text-xs font-bold text-sadaya-sage uppercase tracking-widest mb-2 font-headline">Main Navigation</p>
            <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} reqPerm="view_dashboard" />
            <NavItem id="proposals" label="Retreats" icon={FileEdit} reqPerm="view_proposals" />
            <NavItem id="availability" label="Availability" icon={Clock} reqPerm="view_dashboard" />
            <NavItem id="operations" label="Integration" icon={Briefcase} reqPerm="view_operations" />
            <NavItem id="invoices" label="Billing" icon={CreditCard} reqPerm="view_finance" />
            <NavItem id="support_center" label="Concierge" icon={LifeBuoy} reqPerm="view_support" />
            <NavItem id="classes" label="Events" icon={Calendar} reqPerm="view_classes" />
            <NavItem id="waivers" label="Waivers" icon={Shield} reqPerm="view_dashboard" />
            <NavItem id="users" label="Users" icon={Users} reqPerm="view_users" />
          </div>
          
          <div className="mb-6">
            <p className="px-4 text-xs font-bold text-sadaya-sage uppercase tracking-widest mb-2 font-headline">Tools</p>
            <NavItem id="marketing" label="Wellness AI" icon={BarChart} reqPerm="view_marketing" />
            <NavItem id="communication" label="Chat" icon={MessageCircle} reqPerm="view_operations" />
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 relative" ref={profileRef}>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sadaya-gold to-blue-600 p-[1px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-sadaya-gold"/>
                        </div>
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate font-headline">{currentUser.name}</p>
                        <p className="text-xs text-sadaya-gold truncate font-body">{currentUser.role}</p>
                    </div>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileSettings(!showProfileSettings);
                    }}
                    className="p-1 text-slate-500 hover:text-white"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* Profile Settings Dropdown */}
            {showProfileSettings && (
                <div className="absolute bottom-full left-0 w-full mb-2 px-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Notification Preferences</h4>
                        <div className="space-y-2">
                            {Object.entries(notificationPreferences).map(([key, enabled]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400 capitalize">{key}</span>
                                    <button 
                                        onClick={() => setNotificationPreferences({...notificationPreferences, [key]: !enabled})}
                                        className={`w-8 h-4 rounded-full relative transition-colors ${enabled ? 'bg-sadaya-gold' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${enabled ? 'left-4.5' : 'left-0.5'}`} style={{left: enabled ? '18px' : '2px'}}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {originalUser && (
                <button 
                    onClick={handleRevertLogin}
                    className="mt-2 w-full py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-500/30 transition-colors flex items-center justify-center"
                >
                    <ShieldAlert className="w-3 h-3 mr-1"/> Revert to Admin
                </button>
            )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
         {/* Top Header */}
         <header className="h-16 border-b border-white/5 bg-sadaya-forest/80 backdrop-blur-md flex justify-between items-center px-4 md:px-6 z-30 shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400"><Menu className="w-6 h-6"/></button>
            {originalUser && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse"></div>
            )}
            {originalUser && (
                 <div className="hidden md:flex bg-red-500/10 border border-red-500/20 px-3 py-1 rounded text-red-400 text-xs font-bold items-center ml-4">
                     <ShieldAlert className="w-3 h-3 mr-2"/> VIEWING AS {currentUser.name.toUpperCase()}
                 </div>
            )}

            <div className="flex items-center gap-4 ml-auto">
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <Bell className="w-5 h-5"/>
                        {activityFeed.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sadaya-gold rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {activityFeed.map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => {
                                            setView(n.linkView as ViewState);
                                            setShowNotifications(false);
                                        }}
                                        className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                <n.icon className={`w-3 h-3 ${n.color}`}/> {n.title}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2 line-clamp-2">{n.desc}</p>
                                        <div className="flex items-center text-[10px] text-slate-600">
                                            <Clock className="w-3 h-3 mr-1"/> {n.time}
                                        </div>
                                    </div>
                                ))}
                                {activityFeed.length === 0 && (
                                    <div className="p-6 text-center text-xs text-slate-500">No new notifications</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={quickActionsRef}>
                    <button 
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className={`p-2 text-slate-400 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5 ${showQuickActions ? 'bg-white/5 text-white' : ''}`} 
                        title="Quick Actions"
                    >
                        <Zap className="w-5 h-5"/>
                    </button>
                    {showQuickActions && (
                        <div className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-1">
                                <button onClick={() => { setView('proposals'); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center transition-colors">
                                    <FileEdit className="w-4 h-4 mr-3 text-sadaya-gold"/> New Proposal
                                </button>
                                <button onClick={() => { setView('invoices'); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center transition-colors">
                                    <CreditCard className="w-4 h-4 mr-3 text-purple-400"/> Draft Invoice
                                </button>
                                <button onClick={() => { setView('support_center'); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center transition-colors">
                                    <LifeBuoy className="w-4 h-4 mr-3 text-orange-400"/> Log Ticket
                                </button>
                                <div className="h-px bg-white/10 my-1"></div>
                                <button onClick={() => { alert("Quick Note feature coming soon."); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white rounded-lg flex items-center transition-colors">
                                    <PenTool className="w-4 h-4 mr-3"/> Quick Note
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
         </header>

         {/* Content Viewport */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
             <div className="max-w-7xl mx-auto h-full">
                
                {/* Dashboard View */}
                {view === 'dashboard' && hasPermission('view_dashboard') && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                        {/* Welcome Banner */}
                        <div className="bg-gradient-to-r from-sadaya-gold/10 to-sadaya-forest/20 rounded-2xl p-6 md:p-8 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-sadaya-gold/5 blur-[80px] rounded-full pointer-events-none"></div>
                            <div className="relative z-10">
                                <h1 className="text-2xl md:text-3xl font-headline font-bold text-white mb-2">
                                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-sadaya-gold to-sadaya-tan">Sadaya Sanctuary</span>
                                </h1>
                                <p className="text-sadaya-cream font-body font-light max-w-2xl text-sm md:text-base leading-relaxed">
                                    A luxurious holistic wellness retreat designed for executives and individuals seeking paths to healing. 
                                    Specializing in integration, treating depression, trauma, PTSD, and anxiety through mind, body, and soul alignment.
                                </p>
                            </div>
                        </div>

                        {/* KPI Cards (Clickable) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div 
                            onClick={() => hasPermission('view_proposals') && setView('proposals')}
                            className={`bg-[#0f172a] p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-32 relative overflow-hidden group transition-all ${hasPermission('view_proposals') ? 'cursor-pointer hover:border-sadaya-gold/30' : ''}`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-sadaya-gold/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-sadaya-gold/10 transition-all"></div>
                            <h3 className="text-sadaya-sage text-xs font-bold uppercase tracking-widest font-headline">Pending Care Plans</h3>
                            <div className="flex items-end gap-3">
                              <span className="text-4xl font-headline font-medium text-white">{getFilteredProposals().length}</span>
                              <span className="bg-sadaya-tan/20 text-sadaya-tan text-xs font-bold px-2 py-1 rounded-full mb-1 border border-sadaya-tan/20">View</span>
                            </div>
                          </div>
                           <div 
                             onClick={() => hasPermission('view_finance') && setView('invoices')}
                             className={`bg-sadaya-forest p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-32 relative overflow-hidden group transition-all ${hasPermission('view_finance') ? 'cursor-pointer hover:border-sadaya-gold/30' : ''}`}
                           >
                             <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-orange-500/10 transition-all"></div>
                            <h3 className="text-sadaya-sage text-xs font-bold uppercase tracking-widest font-headline">Pending Payments</h3>
                            <div className="flex items-end gap-3">
                              <span className="text-4xl font-headline font-medium text-white">${getFilteredInvoices().filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0).toLocaleString()}</span>
                              <span className="bg-orange-500/10 text-orange-400 text-xs font-bold px-2 py-1 rounded-full mb-1 border border-orange-500/20">Due</span>
                            </div>
                          </div>
                          <div 
                            onClick={() => hasPermission('view_operations') && setView('operations')}
                            className={`bg-sadaya-forest p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-32 relative overflow-hidden group transition-all ${hasPermission('view_operations') ? 'cursor-pointer hover:border-sadaya-gold/30' : ''}`}
                          >
                             <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                            <h3 className="text-sadaya-sage text-xs font-bold uppercase tracking-widest font-headline">Healing Paths</h3>
                            <div className="flex items-end gap-3">
                              <span className="text-4xl font-headline font-medium text-white">{getFilteredProjects().length}</span>
                              <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded-full mb-1 border border-green-500/20">Live</span>
                            </div>
                          </div>
                          <div 
                            onClick={() => hasPermission('view_support') && setView('support_center')}
                            className={`bg-sadaya-forest p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-32 relative overflow-hidden group transition-all ${hasPermission('view_support') ? 'cursor-pointer hover:border-sadaya-gold/30' : ''}`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
                            <h3 className="text-sadaya-sage text-xs font-bold uppercase tracking-widest font-headline">Concierge Requests</h3>
                            <div className="flex items-end gap-3">
                              <span className="text-4xl font-headline font-medium text-white">{getFilteredTickets().filter(t => t.status === 'Open').length}</span>
                              <span className="bg-purple-500/10 text-purple-400 text-xs font-bold px-2 py-1 rounded-full mb-1 border border-purple-500/20">Open</span>
                            </div>
                          </div>
                        </div>

                        {/* Manager Analytics Bar (Visible to Admin/Head) */}
                        {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.OPS_HEAD) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                                <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Average Inspection Score</h4>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-headline font-bold text-white">
                                                {(() => {
                                                    const tasksWithScores = tasks.filter(t => t.report?.inspectionScore !== undefined);
                                                    if (tasksWithScores.length === 0) return '94.8%';
                                                    const avg = tasksWithScores.reduce((sum, t) => sum + (t.report?.inspectionScore || 0), 0) / tasksWithScores.length;
                                                    return `${avg.toFixed(1)}%`;
                                                })()}
                                            </span>
                                            <span className="text-green-400 text-xs font-bold mb-1 flex items-center">
                                                <TrendingUp className="w-3 h-3 mr-1"/> +2.4%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6 text-green-400" />
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Partner Payouts</h4>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-headline font-bold text-sadaya-gold">
                                                ${(() => {
                                                    // Placeholder calculation for pending payouts
                                                    const unpaidInvoices = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);
                                                    return unpaidInvoices.toLocaleString();
                                                })()}
                                            </span>
                                            <span className="text-slate-500 text-xs mb-1">Due in 7 days</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-sadaya-gold/10 border border-sadaya-gold/20 flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-sadaya-gold" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ANALYTICS & HEALTH SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Analytics Chart (Simulated) */}
                            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-white font-headline flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-sadaya-gold"/> Retreat Growth & Wellness
                                    </h3>
                                    <select 
                                        className="bg-white/5 border border-white/10 rounded text-xs text-sadaya-cream p-1 outline-none cursor-pointer hover:bg-white/10 transition-colors"
                                        value={chartPeriod}
                                        onChange={(e) => setChartPeriod(e.target.value as '6months' | 'ytd')}
                                    >
                                        <option value="6months">Last 6 Months</option>
                                        <option value="ytd">Year to Date</option>
                                    </select>
                                </div>
                                <div className="h-48 flex flex-col">
                                    <div className="flex-1 flex items-end justify-between gap-2 px-2">
                                        {invoicePerformanceData.map((bar) => {
                                            const normalizedHeight = bar.value > 0 
                                                ? Math.min(100, Math.max(8, (bar.value / maxInvoiceValue) * 100))
                                                : 4;
                                            return (
                                                <div 
                                                    key={bar.key} 
                                                    className="flex-1 bg-sadaya-forest/40 rounded-t-sm relative overflow-hidden group cursor-pointer hover:bg-sadaya-forest/60 transition-colors"
                                                    style={{height: `${normalizedHeight}%`}}
                                                    title={`$${bar.value.toLocaleString()}`}
                                                >
                                                    <div 
                                                        className="absolute inset-0 bg-gradient-to-t from-sadaya-gold to-sadaya-tan opacity-90 group-hover:opacity-100 transition-opacity"
                                                    ></div>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-sadaya-forest px-2 py-1 rounded text-[10px] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                        ${bar.value.toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between gap-2 px-2 pt-2">
                                        {invoicePerformanceData.map((bar) => (
                                            <span key={`label-${bar.key}`} className="flex-1 text-center text-[10px] text-sadaya-sage font-mono">{bar.label}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sanctuary Highlights */}
                            <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                                <h3 className="text-lg font-bold text-white font-headline flex items-center gap-2 mb-4">
                                    <Activity className="w-5 h-5 text-green-400"/> Sanctuary Status
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                            <div className="text-sm font-medium text-white">Daily Workshops</div>
                                        </div>
                                        <span className="text-xs font-bold text-sadaya-sage">Active</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-sadaya-gold"></div>
                                            <div className="text-sm font-medium text-white">Wellness Kitchen</div>
                                        </div>
                                        <span className="text-xs font-bold text-sadaya-sage">Ready</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-sadaya-tan"></div>
                                            <div className="text-sm font-medium text-white">Spa & Recovery</div>
                                        </div>
                                        <span className="text-xs font-bold text-sadaya-sage">Open</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Priority Action Feed */}
                        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-sadaya-forest/50">
                                <h3 className="text-lg font-bold text-white font-headline flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-sadaya-tan"/> Sanctuary Priorities
                                </h3>
                                <button onClick={() => setView('history')} className="text-xs text-sadaya-gold hover:underline font-bold">View History</button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {tasks.filter(t => t.priority === 'High' && t.status !== TaskStatus.DONE).slice(0, 3).map(t => (
                                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-sadaya-gold/10 border border-sadaya-gold/20 flex items-center justify-center shrink-0">
                                                <Briefcase className="w-5 h-5 text-sadaya-gold"/>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{t.title}</div>
                                                <div className="text-xs text-sadaya-sage">Retreat Task • Due {t.dueDate}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setView('operations')}
                                            className="px-3 py-1.5 border border-white/10 text-sadaya-cream text-xs rounded hover:bg-white/10"
                                        >
                                            Details
                                        </button>
                                    </div>
                                ))}
                                {tickets.filter(t => t.status === 'Open').slice(0, 2).map(t => (
                                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-sadaya-tan/10 border border-sadaya-tan/20 flex items-center justify-center shrink-0">
                                                <LifeBuoy className="w-5 h-5 text-sadaya-tan"/>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{t.subject}</div>
                                                <div className="text-xs text-sadaya-sage">Concierge • {t.clientName}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setView('support_center')}
                                            className="px-3 py-1.5 border border-white/10 text-sadaya-cream text-xs rounded hover:bg-white/10"
                                        >
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Other Views ... */}
                {view === 'proposals' && hasPermission('view_proposals') && (
                  <ProposalBuilder 
                    organizations={organizations}
                    proposals={getFilteredProposals()}
                    setProposals={setProposals}
                    onSave={() => setView('proposals')}
                    currentUser={currentUser}
                    onProposalAccepted={handleProposalAccepted}
                  />
                )}
                
                {view === 'operations' && hasPermission('view_operations') && (
                    <OperationsHub 
                        organizations={organizations}
                        setOrganizations={setOrganizations}
                        projects={projects}
                        setProjects={setProjects}
                        tasks={tasks}
                        setTasks={setTasks}
                        teamMembers={teamMembers}
                        currentUserRole={currentUser.role}
                        currentUser={currentUser}
                        driveItems={driveItems}
                        setDriveItems={setDriveItems}
                    />
                )}
                {view === 'invoices' && hasPermission('view_finance') && (
                    <InvoiceSystem 
                        invoices={getFilteredInvoices()} 
                        onUpdateInvoices={setInvoices}
                        organizations={organizations}
                        individuals={individuals}
                        currentUser={currentUser}
                    />
                )}
                {view === 'support_center' && hasPermission('view_support') && (
                    <SupportCenter 
                        tickets={getFilteredTickets()}
                        setTickets={setTickets}
                        currentUser={currentUser}
                        organizations={organizations}
                    />
                )}
                {view === 'users' && hasPermission('view_users') && (
                    <UserManagement 
                        organizations={organizations} 
                        setOrganizations={setOrganizations}
                        teamMembers={teamMembers}
                        setTeamMembers={setTeamMembers}
                        individuals={individuals}
                        setIndividuals={setIndividuals}
                        currentUser={currentUser}
                        onLoginAs={handleLoginAs}
                    />
                )}
                
                {view === 'marketing' && hasPermission('view_marketing') && (
                    <MarketingStrategist 
                        organizations={organizations}
                        invoices={invoices}
                        setProjects={setProjects}
                        setTasks={setTasks}
                        driveItems={driveItems}
                        setDriveItems={setDriveItems}
                        proposals={getFilteredProposals()}
                    />
                )}

                {view === 'communication' && hasPermission('view_operations') && (
                    <CommunicationHub 
                        organizations={organizations}
                        teamMembers={teamMembers}
                        currentUser={currentUser}
                    />
                )}

                {view === 'waivers' && hasPermission('view_dashboard') && (
                    <WaiversModule 
                        waivers={waivers}
                        currentUser={currentUser}
                    />
                )}

                {view === 'classes' && hasPermission('view_classes') && (
                    <ClassesModule 
                        currentUser={currentUser}
                        teamMembers={teamMembers}
                        events={events}
                        setEvents={setEvents}
                        onPayment={(inv) => setInvoices(prev => [inv, ...prev])}
                    />
                )}

                {view === 'availability' && (
                    <div className="h-full flex flex-col animate-in fade-in duration-500">
                        <div className="mb-8">
                            <h2 className="text-3xl font-headline font-light text-white mb-2">My Availability</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="glass-panel p-4 rounded-xl border border-white/10">
                                    <h3 className="text-white font-bold mb-4">{day}</h3>
                                    <div className="space-y-2">
                                        {['09:00', '11:00', '14:00', '16:00'].map(slot => (
                                            <div key={slot} className="p-2 bg-white/5 border border-white/5 rounded text-xs text-center hover:bg-sadaya-gold hover:text-black cursor-pointer transition-colors">
                                                {slot}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'history' && (
                    <div className="h-full flex flex-col animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-headline font-light text-white mb-2">Operations History</h2>
                                <p className="text-slate-400 font-body font-thin text-lg">Review completed integration paths and historical performance.</p>
                            </div>
                            <button onClick={() => setView('dashboard')} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4">Integration Path</th>
                                        <th className="p-4">Completed On</th>
                                        <th className="p-4">Score</th>
                                        <th className="p-4">Payout</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[
                                        { name: 'Executive Burnout Recovery - Phase 1', date: '2025-12-20', score: '98%', payout: '$1,200' },
                                        { name: 'PTSD Integration Path - Phase 2', date: '2025-12-15', score: '92%', payout: '$850' },
                                        { name: 'Holistic Nutritional Plan - Initial', date: '2025-12-10', score: '95%', payout: '$400' },
                                    ].map((item, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-white font-medium">{item.name}</td>
                                            <td className="p-4 text-slate-400">{item.date}</td>
                                            <td className="p-4 text-green-400 font-bold">{item.score}</td>
                                            <td className="p-4 text-sadaya-gold font-mono">{item.payout}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

             </div>
         </div>
      </main>

      {/* Support Widget */}
      <SupportBot />

    </div>
  );
};

export default App;
