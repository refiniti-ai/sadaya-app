
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // CEO
  SALES = 'SALES',
  OPS_HEAD = 'OPS_HEAD',
  CLIENT = 'CLIENT',
  EMPLOYEE = 'EMPLOYEE'
}

export enum ProposalStatus {
  DRAFT = 'Draft',
  REVIEW_PENDING = 'Review Pending',
  SENT_TO_CLIENT = 'Sent to Client',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected'
}

export enum StrategyStatus {
    NOT_STARTED = 'Not Started',
    DRAFTING = 'Drafting', // In intake phase
    PENDING_APPROVAL = 'Pending Team Approval', // Generated, internal review
    APPROVED = 'Approved', // Visible to Client
    MODIFICATION_REQUESTED = 'Changes Requested', // Client asked for changes
    LIVE = 'Live' // Final accepted
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done'
}

export interface ClientData {
  id: string;
  organizationName: string;
  contactName: string;
  email: string;
  websiteUrl: string;
  industry: string;
}

export interface ProposalContent {
  hero: {
    title: string;
    subtitle: string;
  };
  engine: {
    generatedValue: number;
    description: string;
  };
  phases: Array<{
    title: string;
    description: string;
    items: string[];
  }>;
  investment: Array<{
    item: string;
    costInitial: number;
    costMonthly: number;
  }>;
  strategy: Array<{
    title: string;
    content: string;
  }>;
  adSpend: Array<{
    phase: string;
    monthlySpend: string;
    targetCPL: string;
    expectedLeads: string;
  }>;
}

export interface BrandAsset {
    type: 'logo' | 'color' | 'font' | 'image';
    value: string; // URL or Hex code
    name?: string;
}

export interface StrategyData {
    status: StrategyStatus;
    content: MarketingStrategy | null;
    assets: BrandAsset[];
    credentials: Array<{platform: string, username: string, password: string, url: string}>;
    feedbackHistory: Array<{date: string, note: string, author: string}>;
    rebrandingRequired: boolean;
}

export interface Proposal {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  services: string[];
  customDetails: string;
  estimatedUpfront: number;
  estimatedRetainer: number;
  content: ProposalContent;
  status: ProposalStatus;
  createdAt: string;
  // New field to link strategy lifecycle to the proposal
  marketingData?: StrategyData; 
}

export interface Invoice {
  id: string;
  proposalId?: string;
  clientName: string;
  amount: number;
  type: 'Upfront' | 'Retainer' | 'One-Time';
  status: 'Pending' | 'Paid' | 'Overdue' | 'Draft';
  dueDate: string;
  issueDate?: string;
  terms?: string;
  items: { description: string; cost: number }[];
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: 'Active' | 'Completed' | 'On Hold';
  progress: number;
  dueDate: string;
  members: string[]; // User IDs or Names
  isArchived?: boolean;
}

export interface TaskLabel {
    text: string;
    color: string;
}

export interface Task {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string; // Employee Name
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  label?: TaskLabel;
  checklist: { id: string; text: string; completed: boolean }[];
  isArchived?: boolean;
  attachments?: string[]; // IDs of DriveItems
}

export interface DriveItem {
  id: string;
  parentId: string | null; // For folder structure
  name: string;
  type: 'folder' | 'file' | 'spreadsheet';
  size?: string;
  updatedAt: string;
  tags?: string[];
  content?: any[]; // For spreadsheet rows
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
  status?: 'Active' | 'Suspended';
  waiverSigned?: boolean;
  waiverSignedDate?: string;
  bio?: string;
  profilePicture?: string;
}

export enum RecurringCycle {
  NONE = 'None',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  BIWEEKLY = 'Bi-Weekly',
  MONTHLY = 'Monthly'
}

export enum PayoutType {
  FLAT = 'Flat Fee',
  PERCENTAGE = 'Percentage'
}

export interface ClassEvent {
  id: string;
  seriesId?: string; // To link recurring events together
  name: string;
  description: string;
  coverImage: string;
  price: number;
  date: string;
  time: string;
  duration: string; // e.g., "60 mins", "2 hours"
  totalSeats: number;
  availableSeats: number;
  isRecurring: boolean;
  recurringCycle?: RecurringCycle;
  facilitatorId: string;
  facilitatorName: string;
  facilitatorPicture?: string;
  facilitatorBio?: string;
  facilitatorPayoutType: PayoutType;
  facilitatorPayoutValue: number; // Amount or Percentage
  organizerId?: string;
  organizerName?: string;
  organizerPicture?: string;
  organizerBio?: string;
  organizerPayoutType?: PayoutType;
  organizerPayoutValue?: number; // Amount or Percentage
  attendees: string[]; // User IDs
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  users: User[]; // Client users
  assignedEmployees?: string[]; // Internal Employee IDs who have access
  status: 'Active' | 'Onboarding' | 'Churned' | 'Suspended';
  logo?: string;
}

export interface ChatChannel {
    id: string;
    orgId: string;
    name: string;
    type: 'public' | 'private' | 'dm';
    members: string[]; // User IDs
}

export interface ChatMessage {
    id: string;
    channelId: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
    mentions?: string[]; // User IDs mentioned
    avatarColor?: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
}

export interface SupportTicket {
  id: string;
  clientId: string;
  clientName: string;
  organizationName: string;
  subject: string;
  status: 'Open' | 'Resolved' | 'Archived';
  priority: 'High' | 'Medium' | 'Low';
  messages: TicketMessage[];
  createdAt: string;
  lastUpdated: string;
}

export interface MarketingStrategy {
    executiveSummary: string;
    targetAudience: string;
    brandVoice: string;
    roadmap: Array<{
        phase: string;
        timeline: string;
        objectives: string[];
    }>;
    channels: string[];
    kpis: string[];
}

export interface WaiverRecord {
  id: string;
  userId: string;
  userName: string;
  orgId: string;
  orgName: string;
  signedDate: string;
  signature: string;
  initials: string;
}

export type ViewState = 'dashboard' | 'proposals' | 'invoices' | 'operations' | 'marketing' | 'communication' | 'support_center' | 'users' | 'waivers' | 'classes';
