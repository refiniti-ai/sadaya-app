import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, DriveItem, Project, Organization, User, ChatChannel, ChatMessage, UserRole, TaskLabel } from '../types';
import { generateProjectTasks } from '../services/geminiService';
import { 
  Folder, File, MoreVertical, Plus, CheckSquare, MessageSquare, 
  HardDrive, Send, Layout, ChevronRight, Calendar, User as UserIcon, 
  CheckCircle, Circle, Clock, Archive, Trash2, ArrowLeft,
  Building, Briefcase, Lock, Image, FileText, X, Sparkles,
  AlignLeft, BarChart2, Hash, Search, Paperclip, Users,
  UserPlus, FolderOpen, Grid, List, Tag, ArrowRightCircle, ArrowRight,
  Settings, Edit, LogOut, ChevronDown, UserMinus, Shield,
  Home, Table, ExternalLink, Eye, EyeOff, LayoutGrid, StretchHorizontal,
  Activity, Layers, Check, ChevronUp, PlayCircle, ShieldCheck, Image as ImageIcon
} from 'lucide-react';

interface OperationsHubProps {
    organizations: Organization[];
    setOrganizations?: React.Dispatch<React.SetStateAction<Organization[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    teamMembers: User[];
    currentUserRole: UserRole;
    currentUser?: User;
    driveItems?: DriveItem[];
    setDriveItems?: React.Dispatch<React.SetStateAction<DriveItem[]>>;
}

// --- TaskCard Component ---
interface TaskCardProps {
    task: Task;
    handleDragStart: (e: React.DragEvent, taskId: string) => void;
    setActiveTask: (task: Task) => void;
    updateTaskState: (taskId: string, updates: Partial<Task>) => void;
    getDueDateColor: (dateStr: string) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, handleDragStart, setActiveTask, updateTaskState, getDueDateColor }) => (
    <div 
        draggable={true}
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={(e) => {
            e.stopPropagation();
            setActiveTask(task);
        }}
        className="glass-panel p-4 rounded-lg hover:border-sadaya-gold/50 cursor-pointer group transition-all mb-3 relative active:cursor-grabbing border-l-2 flex flex-col gap-2 w-full z-10"
        style={{ borderLeftColor: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#eab308' : '#3b82f6' }}
    >
        <div className="flex justify-between items-start">
             {task.label ? (
                 <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider" style={{ backgroundColor: task.label.color, color: '#000' }}>
                     {task.label.text}
                 </span>
             ) : (
                 <span></span>
             )}
             {task.attachments && task.attachments.length > 0 && <Paperclip className="w-3 h-3 text-sadaya-gold"/>}
        </div>
        <h4 className="text-white font-medium group-hover:text-sadaya-gold transition-colors text-sm text-left">{task.title}</h4>
        
        {task.checklist.length > 0 && (
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div 
                    className="bg-green-400 h-full transition-all" 
                    style={{ width: `${(task.checklist.filter(i => i.completed).length / task.checklist.length) * 100}%` }}
                ></div>
            </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <div className={`flex items-center text-xs ${getDueDateColor(task.dueDate)}`}>
                <Calendar className="w-3 h-3 mr-1"/>
                {task.dueDate}
            </div>
            
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center text-[10px] text-white" title={task.assignee}>
                    {task.assignee.charAt(0)}
                </div>
            </div>
        </div>
        
        {/* Move To Section */}
        <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between"
        >
            <span className="text-[10px] text-slate-500 uppercase font-bold">Move To</span>
            <select 
                className="bg-[#0f172a] border border-white/10 rounded px-1 py-0.5 text-[10px] text-slate-300 outline-none hover:border-sadaya-gold cursor-pointer w-24"
                value={task.status}
                onChange={(e) => updateTaskState(task.id, { status: e.target.value as TaskStatus })}
            >
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
    </div>
);

export const OperationsHub: React.FC<OperationsHubProps> = ({ 
    organizations, setOrganizations, projects, setProjects, tasks, setTasks, teamMembers, currentUserRole, currentUser,
    driveItems = [], setDriveItems
}) => {
  // Navigation State
  const [viewLevel, setViewLevel] = useState<'orgs' | 'org-detail' | 'project-board'>('orgs');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [kbTab, setKbTab] = useState<'drive' | 'chat'>('drive');

  // Filters & Toggles
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'gantt'>('kanban');
  
  // Settings Dropdown State
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // Drive State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<DriveItem | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

  // Modals & Pickers
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskGenerating, setIsTaskGenerating] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isManageProjectMembersOpen, setIsManageProjectMembersOpen] = useState(false);
  
  // Org Management Modal
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);

  // Gantt State
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Mention State (Tasks)
  const [mentionState, setMentionState] = useState<{
      isOpen: boolean;
      type: 'user' | 'file';
      triggerIdx: number;
      field: 'description' | 'checklist';
      checklistItemId?: string;
  }>({ isOpen: false, type: 'user', triggerIdx: 0, field: 'description' });

  // New Project Form
  const [newProjectForm, setNewProjectForm] = useState({
      title: '', description: '', members: [] as string[], dueDate: '', strategy: ''
  });

  // Chat State
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [isChannelSettingsOpen, setIsChannelSettingsOpen] = useState(false);
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>([
      { id: 'general', orgId: 'org1', name: 'general', type: 'public', members: ['Sarah Designer', 'Mike Sales'] },
      { id: 'updates', orgId: 'org1', name: 'project-updates', type: 'public', members: [] },
      { id: 'random', orgId: 'org1', name: 'random', type: 'public', members: ['Sarah Designer'] }
  ]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { id: 'm1', channelId: 'general', senderId: '1', senderName: 'Varia Admin', text: 'Welcome to the operations hub.', timestamp: '10:00 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  // Chat Channel Creation State
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  // Chat Mention State
  const [chatMentionState, setChatMentionState] = useState<{
      isOpen: boolean;
      type: 'user' | 'file';
      triggerIdx: number;
  }>({ isOpen: false, type: 'user', triggerIdx: 0 });

  const isAdminOrStaff = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.EMPLOYEE || currentUser?.role === UserRole.SALES || currentUser?.role === UserRole.OPS_HEAD;

  const simulateUpload = (type: 'image' | 'video', category: 'Before' | 'After' | 'Work' = 'Work') => {
      setUploadProgress(0);
      const interval = setInterval(() => {
          setUploadProgress(prev => {
              if (prev! >= 100) {
                  clearInterval(interval);
                  setTimeout(() => setUploadProgress(null), 300);
                  if (activeTask) {
                      const newMedia = { type, category, url: type === 'image' ? 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200' : 'https://www.w3schools.com/html/mov_bbb.mp4' };
                      updateTaskState(activeTask.id, { report: { ...activeTask.report!, media: [...(activeTask.report?.media || []), newMedia] } });
                  }
                  return 100;
              }
              return prev! + 25;
          });
      }, 50);
  };

  const handleChecklistImageUpload = (taskId: string, itemId: string) => {
      setUploadProgress(0);
      const interval = setInterval(() => {
          setUploadProgress(prev => {
              if (prev! >= 100) {
                  clearInterval(interval);
                  setTimeout(() => setUploadProgress(null), 300);
                  const task = tasks.find(t => t.id === taskId);
                  if (task) {
                      const newChecklist = task.checklist.map(i => i.id === itemId ? { ...i, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100' } : i);
                      updateTaskState(taskId, { checklist: newChecklist });
                  }
                  return 100;
              }
              return prev! + 34;
          });
      }, 50);
  };

  // Dropdown Refs
  const projectSettingsRef = useRef<HTMLDivElement>(null);

  const LABEL_COLORS = [
      { bg: '#ef4444', text: '#fee2e2' }, // Red
      { bg: '#f97316', text: '#ffedd5' }, // Orange
      { bg: '#eab308', text: '#fef9c3' }, // Yellow
      { bg: '#22c55e', text: '#dcfce7' }, // Green
      { bg: '#06b6d4', text: '#cffafe' }, // Cyan
      { bg: '#3b82f6', text: '#dbeafe' }, // Blue
      { bg: '#a855f7', text: '#f3e8ff' }, // Purple
      { bg: '#ec4899', text: '#fce7f3' }, // Pink
  ];

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (projectSettingsRef.current && !projectSettingsRef.current.contains(event.target as Node)) {
              setIsSettingsMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper functions
  const getOrg = (id: string) => organizations.find(o => o.id === id);
  const getProject = (id: string) => projects.find(p => p.id === id);
  
  // View Level State Logic
  const activeOrg = selectedOrgId ? getOrg(selectedOrgId) : undefined;
  const activeProject = selectedProjectId ? getProject(selectedProjectId) : undefined;

  // Handles navigation click on Org Card
  const handleOrgClick = (orgId: string) => {
      setSelectedOrgId(orgId);
      setViewLevel('org-detail');
  };

  const toggleTaskExpansion = (taskId: string) => {
      const newSet = new Set(expandedTaskIds);
      if (newSet.has(taskId)) {
          newSet.delete(taskId);
      } else {
          newSet.add(taskId);
      }
      setExpandedTaskIds(newSet);
  };

  // DRIVE HELPERS
  const getCurrentFolderItems = () => driveItems.filter(item => item.parentId === currentFolderId);
  
  const getBreadcrumbs = () => {
      const crumbs = [];
      let currentId = currentFolderId;
      while (currentId) {
          const folder = driveItems.find(i => i.id === currentId);
          if (folder) {
              crumbs.unshift(folder);
              currentId = folder.parentId || null;
          } else {
              break;
          }
      }
      return crumbs;
  };

  const handleDriveItemClick = (item: DriveItem) => {
      if (item.type === 'folder') {
          setCurrentFolderId(item.id);
      } else if (item.type === 'spreadsheet') {
          setViewingFile(item);
      } else {
          console.log("Opening file:", item.name);
      }
  };

  const handleDriveBack = () => {
      if (!currentFolderId) return;
      const currentFolder = driveItems.find(i => i.id === currentFolderId);
      setCurrentFolderId(currentFolder?.parentId || null);
  };

  const togglePasswordVisibility = (index: number) => {
      const newSet = new Set(visiblePasswords);
      if (newSet.has(index)) {
          newSet.delete(index);
      } else {
          newSet.add(index);
      }
      setVisiblePasswords(newSet);
  };

  // ACCESS CONTROL FILTERING
  const visibleOrganizations = organizations.filter(org => {
      if (currentUser?.role === UserRole.SUPER_ADMIN) return true;
      if (currentUser?.role === UserRole.CLIENT) {
          return org.users.some(u => u.id === currentUser.id);
      }
      return org.assignedEmployees?.includes(currentUser?.id || '');
  });

  const getDueDateColor = (dateStr: string) => {
      if (!dateStr) return 'text-slate-400';
      const due = new Date(dateStr);
      const now = new Date();
      const diffMs = due.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0) return 'text-red-500 font-bold'; // Overdue
      if (diffHours < 48) return 'text-yellow-500 font-bold'; // Due Soon
      return 'text-green-500'; // Safe
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => { e.dataTransfer.setData("taskId", taskId); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    updateTaskState(taskId, { status });
  };

  // Task State Management
  const updateTaskState = (taskId: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      if (activeTask && activeTask.id === taskId) {
          setActiveTask(prev => prev ? { ...prev, ...updates } : null);
      }
  };

  const toggleChecklistItem = (taskId: string, itemId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const newChecklist = task.checklist.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i);
      updateTaskState(taskId, { checklist: newChecklist });
  };

  const updateChecklistText = (taskId: string, itemId: string, text: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const newChecklist = task.checklist.map(i => i.id === itemId ? { ...i, text } : i);
      updateTaskState(taskId, { checklist: newChecklist });
      handleInputTrigger(text, 'checklist', itemId);
  };

  const addChecklistItem = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const newItem = { id: `ci-${Date.now()}`, text: '', completed: false };
      updateTaskState(taskId, { checklist: [...task.checklist, newItem] });
  };

  const deleteChecklistItem = (taskId: string, itemId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const newChecklist = task.checklist.filter(i => i.id !== itemId);
      updateTaskState(taskId, { checklist: newChecklist });
  };

  const archiveTask = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        updateTaskState(taskId, { isArchived: !task.isArchived });
      }
  };

  const deleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setActiveTask(null);
  };

  const attachFileToTask = (fileId: string) => {
      if (!activeTask) return;
      const currentAttachments = activeTask.attachments || [];
      if (!currentAttachments.includes(fileId)) {
          updateTaskState(activeTask.id, { attachments: [...currentAttachments, fileId] });
      }
      setIsDrivePickerOpen(false);
  };

  const calculateProjectProgress = (projectId: string) => {
      const projectTasks = tasks.filter(t => t.projectId === projectId && !t.isArchived);
      if (projectTasks.length === 0) return 0;
      const completedTasks = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
      return Math.round((completedTasks / projectTasks.length) * 100);
  };

  // --- MENTIONS LOGIC (Tasks) ---
  const handleInputTrigger = (text: string, field: 'description' | 'checklist', checklistItemId?: string) => {
      const lastChar = text.slice(-1);
      if (lastChar === '@') {
          setMentionState({ isOpen: true, type: 'user', triggerIdx: text.length - 1, field, checklistItemId });
      } else if (lastChar === '#') {
          setMentionState({ isOpen: true, type: 'file', triggerIdx: text.length - 1, field, checklistItemId });
      } else if (mentionState.isOpen && text.length < mentionState.triggerIdx) {
          setMentionState({ ...mentionState, isOpen: false });
      }
  };

  const insertMention = (value: string) => {
      if (!activeTask) return;
      const insert = `${value} `;
      
      if (mentionState.field === 'description') {
          const before = activeTask.description.substring(0, mentionState.triggerIdx);
          const after = activeTask.description.substring(mentionState.triggerIdx + 1);
          updateTaskState(activeTask.id, { description: before + insert + after });
      } else if (mentionState.field === 'checklist' && mentionState.checklistItemId) {
          const item = activeTask.checklist.find(i => i.id === mentionState.checklistItemId);
          if (item) {
              const before = item.text.substring(0, mentionState.triggerIdx);
              const after = item.text.substring(mentionState.triggerIdx + 1);
              updateChecklistText(activeTask.id, mentionState.checklistItemId, before + insert + after);
          }
      }
      setMentionState({ ...mentionState, isOpen: false });
  };

  // --- CHAT LOGIC ---

  const handleSendMessage = () => {
      if (!chatInput.trim()) return;
      const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          channelId: activeChannelId,
          senderId: currentUser?.id || 'me',
          senderName: currentUser?.name || 'Varia Admin', 
          text: chatInput,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      setChatMessages([...chatMessages, newMsg]);
      setChatInput('');
      setChatMentionState({ ...chatMentionState, isOpen: false });
  };

  const handleChatInput = (text: string) => {
      setChatInput(text);
      const lastChar = text.slice(-1);
      if (lastChar === '@') {
          setChatMentionState({ isOpen: true, type: 'user', triggerIdx: text.length - 1 });
      } else if (lastChar === '#') {
          setChatMentionState({ isOpen: true, type: 'file', triggerIdx: text.length - 1 });
      } else if (chatMentionState.isOpen && text.length < chatMentionState.triggerIdx) {
          setChatMentionState({ ...chatMentionState, isOpen: false });
      }
  };

  // --- PROJECT ACTIONS ---
  
  const handleCreateProject = async () => {
      if (!selectedOrgId) return;
      
      const projectId = `p-${Date.now()}`;
      const newProject: Project = {
          id: projectId,
          clientId: selectedOrgId,
          title: newProjectForm.title,
          description: newProjectForm.description,
          status: 'Active',
          progress: 0,
          dueDate: newProjectForm.dueDate,
          members: newProjectForm.members,
          isArchived: false
      };

      setProjects(prev => [...prev, newProject]);

      if (newProjectForm.strategy.length > 10) {
          setIsTaskGenerating(true);
          const generatedTasks = await generateProjectTasks(newProjectForm.strategy, newProjectForm.title);
          
          const getFutureDate = (daysFromNow: number) => {
              const d = new Date();
              d.setDate(d.getDate() + daysFromNow);
              return d.toISOString().split('T')[0];
          };
          
          const fullTasks = generatedTasks.map((t, idx) => ({
              ...t,
              id: `t-${Date.now()}-${idx}`,
              projectId: projectId,
              clientId: selectedOrgId,
              status: TaskStatus.TODO, 
              assignee: 'Unassigned',
              dueDate: getFutureDate(7 + idx * 3), 
              priority: t.priority || 'Medium',
              checklist: t.checklist || [],
              isArchived: false,
              report: { inspectionScore: 0, comments: '', media: [] }
          } as Task));
          setTasks(prev => [...prev, ...fullTasks]);
          setIsTaskGenerating(false);
      }

      setIsProjectModalOpen(false);
      setNewProjectForm({ title: '', description: '', members: [], dueDate: '', strategy: '' });
  };

  const handleUpdateProject = (updatedProject: Project) => {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setEditingProject(null);
  };

  const deleteProject = (projId: string, e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      setProjects(prev => prev.filter(p => p.id !== projId));
      setTasks(prev => prev.filter(t => t.projectId !== projId));
      if (viewLevel === 'project-board') setViewLevel('org-detail');
      setEditingProject(null);
      setIsSettingsMenuOpen(false);
  };

  const toggleArchiveProject = () => {
      if (activeProject) {
          setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, isArchived: !p.isArchived } : p));
          setIsSettingsMenuOpen(false);
      }
  }

  const toggleProjectMember = (memberName: string) => {
      const projectToUpdate = editingProject || activeProject;
      if (!projectToUpdate) return;
      
      const currentMembers = projectToUpdate.members || [];
      const newMembers = currentMembers.includes(memberName) 
          ? currentMembers.filter(m => m !== memberName)
          : [...currentMembers, memberName];
      
      const updated = { ...projectToUpdate, members: newMembers };
      
      if (editingProject) {
          setEditingProject(updated);
      } else {
          setProjects(prev => prev.map(p => p.id === projectToUpdate.id ? updated : p));
      }
  };

  const toggleOrgEmployee = (empId: string) => {
      if (!selectedOrgId || !setOrganizations) return;
      setOrganizations(prev => prev.map(org => {
          if (org.id === selectedOrgId) {
              const current = org.assignedEmployees || [];
              const updated = current.includes(empId)
                  ? current.filter(id => id !== empId)
                  : [...current, empId];
              return { ...org, assignedEmployees: updated };
          }
          return org;
      }));
  };

  // --- TIMELINE GENERATOR ---
  const renderTimeline = () => {
      if (!activeProject) return null;
      
      const projectTasks = tasks.filter(t => t.projectId === activeProject.id && (showArchivedTasks ? t.isArchived : !t.isArchived));
      if (projectTasks.length === 0) {
          return (
              <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl m-4 text-slate-500">
                  No tasks found to display on timeline.
              </div>
          );
      }

      const today = new Date();
      today.setHours(0,0,0,0);
      const dates = [];
      for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          dates.push(d);
      }

      return (
          <div className="flex-1 overflow-auto custom-scrollbar bg-black/20 rounded-xl border border-white/10 relative">
              <div className="flex sticky top-0 z-20 bg-[#0f172a] border-b border-white/10">
                  <div className="w-72 shrink-0 p-4 font-bold text-white border-r border-white/10 bg-[#0f172a] sticky left-0 z-30">
                      Task Name
                  </div>
                  {dates.map((date, i) => (
                      <div key={i} className="w-24 shrink-0 p-2 text-center border-r border-white/5 text-xs text-slate-400">
                          <div className="font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div>{date.getDate()}</div>
                      </div>
                  ))}
              </div>
              <div className="divide-y divide-white/5">
                  {projectTasks.map(task => {
                      const dueDate = new Date(task.dueDate);
                      dueDate.setHours(0,0,0,0);
                      const diffTime = dueDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                      const startOffset = Math.max(0, diffDays - 3); 
                      const duration = Math.max(1, diffDays - startOffset + 1);
                      const isExpanded = expandedTaskIds.has(task.id);
                      const hasChecklist = task.checklist.length > 0;

                      return (
                          <React.Fragment key={task.id}>
                              <div className="flex hover:bg-white/5 transition-colors group">
                                  <div className="w-72 shrink-0 p-3 border-r border-white/10 bg-[#0f172a] sticky left-0 z-20 flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                                          {hasChecklist && (
                                              <button onClick={() => toggleTaskExpansion(task.id)} className="text-slate-500 hover:text-white">
                                                  {isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                                              </button>
                                          )}
                                          {!hasChecklist && <div className="w-4"></div>}
                                          <div className="overflow-hidden">
                                              <div className="text-sm text-slate-300 truncate font-medium cursor-pointer hover:text-white" onClick={() => setActiveTask(task)}>{task.title}</div>
                                              <select 
                                                  value={task.status}
                                                  onChange={(e) => updateTaskState(task.id, { status: e.target.value as TaskStatus })}
                                                  className={`text-[10px] uppercase font-bold bg-[#0f172a] border-none outline-none cursor-pointer mt-1 ${
                                                      task.status === TaskStatus.DONE ? 'text-green-400' : 
                                                      task.status === TaskStatus.IN_PROGRESS ? 'text-sadaya-gold' : 'text-slate-500'
                                                  }`}
                                              >
                                                  {Object.values(TaskStatus).map(s => <option key={s} value={s} className="bg-slate-800 text-slate-200">{s}</option>)}
                                              </select>
                                          </div>
                                      </div>
                                      <button onClick={() => setActiveTask(task)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white"><Edit className="w-3 h-3"/></button>
                                  </div>
                                  <div className="flex relative">
                                      {dates.map((d, i) => (
                                          <div key={i} className={`w-24 shrink-0 border-r border-white/5 h-12 ${[0,6].includes(d.getDay()) ? 'bg-black/20' : ''}`}></div>
                                      ))}
                                      {diffDays >= 0 && diffDays < 30 && (
                                          <div 
                                              className={`absolute top-3 h-6 rounded-md flex items-center px-2 text-xs font-bold text-black whitespace-nowrap overflow-hidden cursor-pointer shadow-lg hover:scale-105 transition-transform z-10
   ${task.status === 'Done' ? 'bg-green-400' : task.priority === 'High' ? 'bg-red-400' : 'bg-sadaya-gold'}
 `}
                                              style={{
                                                  left: `${startOffset * 96 + (startOffset > 0 ? 1 : 0)}px`,
                                                  width: `${Math.min(30 - startOffset, duration) * 96 - 4}px`
                                              }}
                                              onClick={() => setActiveTask(task)}
                                          >
                                              {task.title}
                                          </div>
                                      )}
                                  </div>
                              </div>
                              {/* Sub-rows for Checklist */}
                              {isExpanded && task.checklist.map((item, idx) => {
                                  const itemDuration = Math.max(1, Math.floor(duration / task.checklist.length));
                                  const itemStartOffset = startOffset + (idx * itemDuration);
                                  const isVisible = itemStartOffset < 30;

                                  return (
                                      <div key={item.id} className="flex bg-white/5 border-t border-white/5">
                                          <div className="w-72 shrink-0 p-2 pl-10 border-r border-white/10 bg-[#0f172a] sticky left-0 z-20 flex items-center">
                                              <div className={`w-3 h-3 rounded-full border mr-2 flex items-center justify-center ${item.completed ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-slate-600'}`}>
                                                  {item.completed && <Check className="w-2 h-2"/>}
                                              </div>
                                              <span className={`text-xs truncate ${item.completed ? 'text-slate-500 line-through' : 'text-slate-400'}`}>{item.text}</span>
                                          </div>
                                          <div className="flex relative">
                                              {dates.map((d, i) => (
                                                  <div key={i} className={`w-24 shrink-0 border-r border-white/5 h-8 ${[0,6].includes(d.getDay()) ? 'bg-black/20' : ''}`}></div>
                                              ))}
                                              {isVisible && diffDays >= 0 && (
                                                  <div 
                                                      className={`absolute top-2 h-4 rounded-full opacity-60 ${item.completed ? 'bg-green-500' : 'bg-slate-500'}`}
                                                      style={{
                                                          left: `${itemStartOffset * 96 + 2}px`,
                                                          width: `${Math.min(30 - itemStartOffset, itemDuration) * 96 - 4}px`
                                                      }}
                                                  ></div>
                                              )}
                                          </div>
                                      </div>
                                  );
                              })}
                          </React.Fragment>
                      );
                  })}
              </div>
          </div>
      );
  }

  // --- RENDER LOGIC ---

  if (viewLevel === 'project-board' && activeProject && activeOrg) {
      return (
          <>
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 relative z-0">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 bg-[#0f172a] p-4 rounded-xl border border-white/10">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                      <button onClick={() => setViewLevel('org-detail')} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                          <ArrowLeft className="w-5 h-5"/>
                      </button>
                      <div>
                          <h2 className="text-lg font-bold text-white font-headline flex items-center gap-2">
                              {activeProject.title}
                              {activeProject.isArchived && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30">ARCHIVED</span>}
                          </h2>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>{activeOrg.name}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                              <span>Due {activeProject.dueDate}</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                          <button onClick={() => setTaskViewMode('kanban')} className={`p-2 rounded transition-all ${taskViewMode === 'kanban' ? 'bg-white/10 text-sadaya-gold shadow-sm' : 'text-slate-500 hover:text-white'}`}><LayoutGrid className="w-4 h-4"/></button>
                          <div className="w-px bg-white/10 my-1 mx-1"></div>
                          <button onClick={() => setTaskViewMode('gantt')} className={`p-2 rounded transition-all ${taskViewMode === 'gantt' ? 'bg-white/10 text-sadaya-gold shadow-sm' : 'text-slate-500 hover:text-white'}`}><StretchHorizontal className="w-4 h-4"/></button>
                      </div>
                      <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                           <button onClick={() => setShowArchivedTasks(false)} className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${!showArchivedTasks ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Active</button>
                           <button onClick={() => setShowArchivedTasks(true)} className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${showArchivedTasks ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Archived</button>
                      </div>
                      <div className="h-8 w-px bg-white/10"></div>
                      <div className="relative" ref={projectSettingsRef}>
                          <button onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)} className={`p-2 rounded-lg border transition-colors ${isSettingsMenuOpen ? 'bg-white/10 text-white border-white/20' : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'}`}><Settings className="w-5 h-5"/></button>
                          {isSettingsMenuOpen && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                  <div className="p-1">
                                      <button onClick={() => { setEditingProject(activeProject); setIsSettingsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center transition-colors"><Edit className="w-4 h-4 mr-2"/> Edit Details</button>
                                      <button onClick={toggleArchiveProject} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center transition-colors"><Archive className="w-4 h-4 mr-2"/> {activeProject.isArchived ? 'Unarchive' : 'Archive'}</button>
                                      <div className="h-px bg-white/10 my-1"></div>
                                      <button onClick={(e) => deleteProject(activeProject.id, e)} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center transition-colors"><Trash2 className="w-4 h-4 mr-2"/> Delete Project</button>
                                  </div>
                              </div>
                          )}
                      </div>
                      <div className="flex -space-x-2">
                          {activeProject.members.map((m, i) => (
                              <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#0f172a] flex items-center justify-center text-xs font-bold text-white shadow-sm" title={m}>{m.charAt(0)}</div>
                          ))}
                          <button onClick={() => setIsManageProjectMembersOpen(true)} className="w-8 h-8 rounded-full bg-black/40 border-2 border-[#0f172a] border-dashed border-slate-500 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-colors" title="Manage Project Team"><UserPlus className="w-3 h-3"/></button>
                      </div>
                  </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                  {taskViewMode === 'kanban' ? (
                      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                          <div className="flex gap-6 min-w-[1000px] h-full px-1">
                              {Object.values(TaskStatus).map(status => {
                                  const columnTasks = tasks.filter(t => t.projectId === activeProject.id && t.status === status && (showArchivedTasks ? t.isArchived : !t.isArchived));
                                  return (
                                      <div key={status} className="flex-1 min-w-[280px] bg-white/5 rounded-xl border border-white/10 flex flex-col h-full" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, status)}>
                                          <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0f172a]/90 backdrop-blur z-10 rounded-t-xl">
                                              <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                  <div className={`w-2 h-2 rounded-full ${status === TaskStatus.TODO ? 'bg-slate-500' : status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : status === TaskStatus.REVIEW ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                  {status}
                                              </h3>
                                              <span className="text-xs bg-black/40 px-2 py-1 rounded text-slate-500 font-mono">{columnTasks.length}</span>
                                          </div>
                                          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                                              {columnTasks.map(task => (
                                                  <TaskCard key={task.id} task={task} handleDragStart={handleDragStart} setActiveTask={setActiveTask} updateTaskState={updateTaskState} getDueDateColor={getDueDateColor}/>
                                              ))}
                                              <button onClick={() => {
                                                    const newTask: Task = { id: `t-${Date.now()}`, projectId: activeProject.id, clientId: activeOrg.id, title: 'New Task', description: '', status: status as TaskStatus, assignee: 'Unassigned', dueDate: new Date().toISOString().split('T')[0], priority: 'Medium', checklist: [], report: { inspectionScore: 0, comments: '', media: [] } };
                                                    setTasks([newTask, ...tasks]);
                                                    setActiveTask(newTask);
                                                }} className="w-full py-2 mt-2 border border-dashed border-white/10 rounded-lg text-slate-500 text-xs hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center"><Plus className="w-3 h-3 mr-1"/> Add Task</button>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  ) : (renderTimeline())}
              </div>
          </div>

          {activeTask && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative">
                      <div className="p-6 border-b border-white/10 flex justify-between items-start">
                          <div className="flex-1 mr-4">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                  {activeTask.status === TaskStatus.TODO && (
                                      <button 
                                        onClick={() => updateTaskState(activeTask.id, { status: TaskStatus.IN_PROGRESS })}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded text-xs font-bold uppercase flex items-center gap-2 transition-colors animate-pulse"
                                      >
                                          <PlayCircle className="w-3.5 h-3.5"/> Start Job
                                      </button>
                                  )}
                                  <select value={activeTask.status} onChange={(e) => updateTaskState(activeTask.id, { status: e.target.value as TaskStatus })} className="bg-[#0f172a] text-slate-300 px-2 py-0.5 rounded text-xs border border-white/10 font-mono uppercase tracking-wide outline-none focus:border-sadaya-gold mb-2 md:mb-0">
                                      {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <select value={activeTask.priority} onChange={(e) => updateTaskState(activeTask.id, { priority: e.target.value as any })} className="bg-[#0f172a] text-slate-300 px-2 py-0.5 rounded text-xs border border-white/10 font-mono uppercase tracking-wide outline-none focus:border-sadaya-gold">
                                      <option value="High">High Priority</option>
                                      <option value="Medium">Medium Priority</option>
                                      <option value="Low">Low Priority</option>
                                  </select>
                              </div>
                              <input value={activeTask.title} onChange={(e) => updateTaskState(activeTask.id, { title: e.target.value })} className="text-2xl font-bold text-white font-headline bg-transparent border-b border-transparent hover:border-white/20 focus:border-sadaya-gold outline-none w-full"/>
                          </div>
                          <button onClick={() => setActiveTask(null)} className="text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                          <div className="md:col-span-2 space-y-6 relative order-2 md:order-1">
                              <div>
                                  <h4 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide flex items-center justify-between"><span className="flex items-center"><FileText className="w-4 h-4 mr-2"/> Description</span><button onClick={() => setIsDrivePickerOpen(true)} className="text-xs text-sadaya-gold flex items-center hover:underline bg-sadaya-gold/10 px-2 py-1 rounded border border-sadaya-gold/20"><Paperclip className="w-3 h-3 mr-1"/> Attach Drive File</button></h4>
                                  <div className="relative">
                                      <textarea value={activeTask.description} onChange={(e) => { updateTaskState(activeTask.id, { description: e.target.value }); handleInputTrigger(e.target.value, 'description'); }} className="w-full text-slate-400 text-sm leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5 font-body font-light min-h-[100px] outline-none focus:border-sadaya-gold placeholder-slate-600" placeholder="Enter task description (Use @ to tag members, # to reference attached files)..."/>
                                      {mentionState.isOpen && mentionState.field === 'description' && (<div className="absolute top-full left-0 mt-1 w-64 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">{mentionState.type === 'user' && activeProject.members.map(m => (<div key={m} onClick={() => insertMention(`@${m}`)} className="p-2 hover:bg-white/10 cursor-pointer text-sm text-white flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px]">{m.charAt(0)}</div> {m}</div>))}{mentionState.type === 'file' && (activeTask.attachments || []).map(attId => { const f = driveItems.find(d => d.id === attId); return f ? (<div key={f.id} onClick={() => insertMention(`#${f.name}`)} className="p-2 hover:bg-white/10 cursor-pointer text-sm text-white flex items-center gap-2"><File className="w-4 h-4 text-sadaya-gold"/> {f.name}</div>) : null; })}{mentionState.type === 'file' && (!activeTask.attachments || activeTask.attachments.length === 0) && (<div className="p-2 text-xs text-slate-500">No attachments found. Attach files first.</div>)}</div>)}
                                  </div>
                                  {activeTask.attachments && activeTask.attachments.length > 0 && (<div className="mt-3 flex flex-wrap gap-2">{activeTask.attachments.map(attId => { const f = driveItems.find(d => d.id === attId); return f ? (<div key={attId} className="flex items-center bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-slate-300"><File className="w-3 h-3 mr-2 text-sadaya-gold"/> {f.name}</div>) : null; })}</div>)}
                              </div>
                              <div>
                                  <div className="flex justify-between items-center mb-3"><h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center"><CheckSquare className="w-4 h-4 mr-2"/> Checklist</h4><span className="text-xs text-slate-500">{activeTask.checklist.filter(i => i.completed).length} / {activeTask.checklist.length}</span></div>
                                  <div className="space-y-2">{activeTask.checklist.map(item => (<div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors group relative">
                                      <div className="flex items-center gap-3">
                                          <div onClick={() => toggleChecklistItem(activeTask.id, item.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${item.completed ? 'bg-sadaya-gold border-sadaya-gold text-black' : 'border-slate-600 bg-transparent'}`}>{item.completed && <CheckCircle className="w-3.5 h-3.5"/>}</div>
                                          <div className="flex-1 relative">
                                              <input value={item.text} onChange={(e) => updateChecklistText(activeTask.id, item.id, e.target.value)} className={`bg-transparent outline-none w-full text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'} placeholder-slate-600`} placeholder="Checklist item..." onClick={(e) => e.stopPropagation()}/>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              {item.image ? (
                                                  <div className="relative group/img">
                                                      <img src={item.image} className="w-10 h-10 rounded object-cover border border-white/10" alt=""/>
                                                      <button 
                                                        onClick={() => handleChecklistImageUpload(activeTask.id, item.id)}
                                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded"
                                                        title="Replace Photo"
                                                      >
                                                          <Edit className="w-3 h-3 text-white"/>
                                                      </button>
                                                  </div>
                                              ) : (
                                                  <button 
                                                    onClick={() => handleChecklistImageUpload(activeTask.id, item.id)}
                                                    className="p-2 text-slate-500 hover:text-sadaya-gold hover:bg-white/5 rounded transition-colors"
                                                    title="Upload Photo"
                                                  >
                                                      <ImageIcon className="w-4 h-4"/>
                                                  </button>
                                              )}
                                              <button onClick={() => deleteChecklistItem(activeTask.id, item.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><X className="w-4 h-4"/></button>
                                          </div>
                                      </div>
                                  </div>))}<button onClick={() => addChecklistItem(activeTask.id)} className="flex items-center text-sm text-slate-500 hover:text-sadaya-gold p-2"><Plus className="w-4 h-4 mr-2"/> Add item</button></div>
                              </div>

                              {(activeTask.status === TaskStatus.REVIEW || isAdminOrStaff) && (
                                  <div className="mt-8 pt-8 border-t border-white/10 animate-in slide-in-from-bottom-2">
                                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                          <ShieldCheck className="w-4 h-4 text-green-400"/> Quality Inspection Report
                                      </h4>
                                      <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div>
                                                  <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Inspection Score</label>
                                                  <div className="flex items-center gap-4">
                                                      <input 
                                                        type="range" 
                                                        min="0" max="100" 
                                                        value={activeTask.report?.inspectionScore || 0}
                                                        onChange={(e) => updateTaskState(activeTask.id, { report: { ...activeTask.report!, inspectionScore: Number(e.target.value) } })}
                                                        className="flex-1 accent-sadaya-gold"
                                                      />
                                                      <span className="text-xl font-bold text-white font-mono">{activeTask.report?.inspectionScore || 0}%</span>
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Upload Verification Media</label>
                                                  <div className="grid grid-cols-2 gap-2">
                                                      <button 
                                                        onClick={() => simulateUpload('video', 'Before')}
                                                        disabled={uploadProgress !== null}
                                                        className="py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold hover:bg-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                                      >
                                                          <PlayCircle className="w-3.5 h-3.5"/> Before Video
                                                      </button>
                                                      <button 
                                                        onClick={() => simulateUpload('video', 'After')}
                                                        disabled={uploadProgress !== null}
                                                        className="py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold hover:bg-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                                      >
                                                          <PlayCircle className="w-3.5 h-3.5"/> After Video
                                                      </button>
                                                      <button 
                                                        onClick={() => simulateUpload('image', 'Work')}
                                                        disabled={uploadProgress !== null}
                                                        className="py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold hover:bg-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                                      >
                                                          <ImageIcon className="w-3.5 h-3.5"/> Progress Photo
                                                      </button>
                                                  </div>
                                                  {uploadProgress !== null && (
                                                      <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                                          <div className="h-full bg-sadaya-gold transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                          
                                          {activeTask.checklist.some(i => i.image) && (
                                              <div>
                                                  <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Checklist Verification Photos</label>
                                                  <div className="flex flex-wrap gap-3">
                                                      {activeTask.checklist.filter(i => i.image).map(item => (
                                                          <div key={item.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group/itemmedia">
                                                              <img src={item.image} className="w-full h-full object-cover" alt=""/>
                                                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white p-0.5 truncate">{item.text}</div>
                                                              <button 
                                                                onClick={() => {
                                                                    const newChecklist = activeTask.checklist.map(i => i.id === item.id ? { ...i, image: undefined } : i);
                                                                    updateTaskState(activeTask.id, { checklist: newChecklist });
                                                                }}
                                                                className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl opacity-0 group-hover/itemmedia:opacity-100 transition-opacity"
                                                              >
                                                                  <X className="w-2 h-2"/>
                                                              </button>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}

                                          <div>
                                              <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Inspector Comments</label>
                                              <textarea 
                                                value={activeTask.report?.comments || ''}
                                                onChange={(e) => updateTaskState(activeTask.id, { report: { ...activeTask.report!, comments: e.target.value } })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white h-24 focus:border-sadaya-gold outline-none"
                                                placeholder="Enter detailed inspection notes..."
                                              />
                                          </div>

                                          {activeTask.report?.media && activeTask.report.media.length > 0 && (
                                              <div className="space-y-4">
                                                  <label className="text-xs text-slate-500 uppercase font-bold block">Inspection Media (Before & After)</label>
                                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                      {activeTask.report.media.map((m, i) => (
                                                          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group/media">
                                                              {m.type === 'image' ? (
                                                                  <img src={m.url} className="w-full h-full object-cover" />
                                                              ) : (
                                                                  <div className="w-full h-full bg-black flex items-center justify-center">
                                                                      <PlayCircle className="w-8 h-8 text-white/40 group-hover/media:text-white transition-colors" />
                                                                      <video src={m.url} controls className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover/media:opacity-100 transition-opacity" />
                                                                  </div>
                                                              )}
                                                              <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider ${m.category === 'Before' ? 'bg-orange-500' : m.category === 'After' ? 'bg-green-500' : 'bg-black/60'}`}>{m.category || 'Work'}</div>
                                                              <button onClick={() => updateTaskState(activeTask.id, { report: { ...activeTask.report!, media: activeTask.report?.media.filter((_, idx) => idx !== i) || [] } })} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover/media:opacity-100"><X className="w-3 h-3 text-white"/></button>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>
                          <div className="space-y-6 order-1 md:order-2">
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Custom Label</label>
                                  <div className="flex gap-2 mb-2 flex-wrap">{LABEL_COLORS.map(c => (<div key={c.bg} onClick={() => updateTaskState(activeTask.id, { label: { ...activeTask.label, color: c.bg, text: activeTask.label?.text || 'Label' } })} className={`w-5 h-5 rounded-full cursor-pointer ${activeTask.label?.color === c.bg ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c.bg }}></div>))}</div>
                                  <input value={activeTask.label?.text || ''} onChange={(e) => updateTaskState(activeTask.id, { label: { ...activeTask.label, color: activeTask.label?.color || '#3b82f6', text: e.target.value } })} placeholder="Label Text" className="w-full bg-[#0f172a] border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-sadaya-gold"/>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Assignee</label>
                                  <select value={activeTask.assignee} onChange={(e) => updateTaskState(activeTask.id, { assignee: e.target.value })} className="w-full bg-[#0f172a] border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-sadaya-gold"><option value="Unassigned">Unassigned</option>{activeProject.members.map(m => <option key={m} value={m}>{m}</option>)}</select>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Due Date</label>
                                  <input type="date" min={new Date().toISOString().split('T')[0]} value={activeTask.dueDate ? new Date(activeTask.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => updateTaskState(activeTask.id, { dueDate: e.target.value })} className={`w-full bg-[#0f172a] border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-sadaya-gold ${getDueDateColor(activeTask.dueDate)}`}/>
                              </div>
                              <div className="pt-6 border-t border-white/10 space-y-2">
                                  <button onClick={() => archiveTask(activeTask.id)} className={`w-full py-2 flex items-center justify-center rounded-lg text-sm transition-colors ${activeTask.isArchived ? 'bg-sadaya-gold/20 text-sadaya-gold hover:bg-sadaya-gold/30' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}><Archive className="w-4 h-4 mr-2"/> {activeTask.isArchived ? 'Unarchive Task' : 'Archive Task'}</button>
                                  <button onClick={() => deleteTask(activeTask.id)} className="w-full py-2 flex items-center justify-center text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm transition-colors"><Trash2 className="w-4 h-4 mr-2"/> Delete Task</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {editingProject && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                       <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20"><h2 className="text-xl font-headline text-white font-bold">Edit Project Details</h2><button onClick={() => setEditingProject(null)}><X className="w-6 h-6 text-slate-500 hover:text-white"/></button></div>
                       <div className="p-6 overflow-y-auto space-y-4">
                           <div><label className="text-xs text-slate-400 uppercase font-bold">Project Title</label><input value={editingProject.title} onChange={e => setEditingProject({...editingProject, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1"/></div>
                           <div><label className="text-xs text-slate-400 uppercase font-bold">Description</label><textarea value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1 h-20"/></div>
                           <div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-slate-400 uppercase font-bold">Due Date</label><input type="date" value={editingProject.dueDate} onChange={e => setEditingProject({...editingProject, dueDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1"/></div><div><label className="text-xs text-slate-400 uppercase font-bold">Status</label><select value={editingProject.status} onChange={e => setEditingProject({...editingProject, status: e.target.value as any})} className="w-full bg-[#0f172a] border border-white/10 rounded p-2 text-white mt-1"><option value="Active">Active</option><option value="On Hold">On Hold</option><option value="Completed">Completed</option></select></div></div>
                           <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-2"><div className="flex gap-2 w-full md:w-auto"><button onClick={() => setEditingProject({...editingProject, isArchived: !editingProject.isArchived})} className={`flex-1 md:flex-none px-3 py-1 text-sm rounded border ${editingProject.isArchived ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-white/5 text-slate-400 border-white/10'}`}>{editingProject.isArchived ? 'Unarchive Project' : 'Archive Project'}</button><button onClick={(e) => deleteProject(editingProject.id, e)} className="flex-1 md:flex-none px-3 py-1 text-sm rounded border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete Project</button></div></div>
                       </div>
                       <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3"><button onClick={() => setEditingProject(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button><button onClick={() => handleUpdateProject(editingProject)} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">Save Changes</button></div>
                  </div>
              </div>
          )}
          
          {isManageProjectMembersOpen && activeProject && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                  <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20"><div><h2 className="text-xl font-headline text-white font-bold">Manage Project Team</h2><p className="text-xs text-slate-400">Add/Remove members for "{activeProject.title}"</p></div><button onClick={() => setIsManageProjectMembersOpen(false)}><X className="w-6 h-6 text-slate-500 hover:text-white"/></button></div>
                      <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                          <div><h4 className="text-xs font-bold text-sadaya-gold uppercase mb-3">Internal Team (Employees)</h4><div className="space-y-2">{teamMembers.filter(m => activeOrg.assignedEmployees?.includes(m.id)).map(m => { const isMember = activeProject.members.includes(m.name); return (<div key={m.id} onClick={() => toggleProjectMember(m.name)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isMember ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{m.name.charAt(0)}</div><div><div className="font-bold text-sm">{m.name}</div><div className="text-xs opacity-70">{m.role}</div></div></div>{isMember && <CheckCircle className="w-5 h-5 text-sadaya-gold"/>}</div>); })}</div></div>
                          <div><h4 className="text-xs font-bold text-sadaya-gold uppercase mb-3">Client Stakeholders</h4><div className="space-y-2">{activeOrg.users.map(u => { const isMember = activeProject.members.includes(u.name); return (<div key={u.id} onClick={() => toggleProjectMember(u.name)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isMember ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-900/50 text-indigo-200 flex items-center justify-center text-xs font-bold">{u.name.charAt(0)}</div><div><div className="font-bold text-sm">{u.name}</div><div className="text-xs opacity-70">Client Access</div></div></div>{isMember && <CheckCircle className="w-5 h-5 text-sadaya-gold"/>}</div>); })}</div></div>
                      </div>
                      <div className="p-6 border-t border-white/10 bg-black/20 text-right"><button onClick={() => setIsManageProjectMembersOpen(false)} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors text-sm">Done</button></div>
                  </div>
              </div>
          )}
          </>
      );
  }

  if (viewLevel === 'org-detail' && activeOrg) {
      const orgProjects = projects.filter(p => p.clientId === activeOrg.id && (showArchivedProjects ? p.isArchived : !p.isArchived));
      return (
          <>
          <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-500 relative z-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6 gap-4">
                  <div className="flex items-center gap-4">
                      <button onClick={() => { setViewLevel('orgs'); setSelectedOrgId(null); }} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6"/></button>
                      <div><h2 className="text-3xl font-headline font-bold text-white mb-1">{activeOrg.name}</h2><div className="flex items-center gap-4 text-sm text-slate-400"><span className="flex items-center"><Briefcase className="w-4 h-4 mr-1"/> {activeOrg.industry}</span><span className="w-1 h-1 rounded-full bg-slate-600"></span><span className="flex items-center"><Users className="w-4 h-4 mr-1"/> {activeOrg.users.length} Users</span></div></div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      {(currentUser?.role !== UserRole.CLIENT && setOrganizations) && (<button onClick={() => setIsManageTeamOpen(true)} className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-lg font-bold text-sm hover:text-white hover:bg-white/10 transition-colors flex items-center"><Shield className="w-4 h-4 mr-2"/> <span className="hidden md:inline">Manage Team</span></button>)}
                      <div className="flex bg-black/40 rounded-lg p-1 border border-white/10"><button onClick={() => setShowArchivedProjects(false)} className={`px-3 py-1 text-xs rounded ${!showArchivedProjects ? 'bg-sadaya-gold text-black font-bold' : 'text-slate-400'}`}>Active</button><button onClick={() => setShowArchivedProjects(true)} className={`px-3 py-1 text-xs rounded ${showArchivedProjects ? 'bg-sadaya-gold text-black font-bold' : 'text-slate-400'}`}>Archived</button></div>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                      <div onClick={() => setIsProjectModalOpen(true)} className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-6 text-slate-500 hover:text-sadaya-gold hover:border-sadaya-gold/30 hover:bg-white/5 transition-all cursor-pointer group min-h-[180px] h-full"><div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/5 group-hover:border-sadaya-gold/20"><Plus className="w-6 h-6"/></div><span className="font-bold text-sm uppercase tracking-wider font-headline">Initialize Project</span></div>
                      {orgProjects.map(p => { const dynamicProgress = calculateProjectProgress(p.id); return (<div key={p.id} onClick={() => { setSelectedProjectId(p.id); setViewLevel('project-board'); }} className={`bg-slate-900/40 border p-5 rounded-xl hover:bg-white/5 cursor-pointer transition-all relative overflow-hidden group min-h-[180px] h-full flex flex-col justify-between ${p.isArchived ? 'border-slate-700 opacity-60' : 'border-white/10 hover:border-sadaya-gold/30'}`}>{p.isArchived && <div className="absolute top-2 right-2 text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded">ARCHIVED</div>}<div><div className="flex justify-between items-start mb-3"><h4 className="text-white font-bold font-headline w-3/4 truncate">{p.title}</h4><div className="flex items-center gap-2">{!p.isArchived && <div className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-slate-500'}`}></div>}<button onClick={(e) => { e.stopPropagation(); setEditingProject(p); }} className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10" title="Edit Project Details"><Edit className="w-3 h-3"/></button></div></div><p className="text-sm text-slate-400 mb-4 line-clamp-2 font-body font-light">{p.description}</p></div><div><div className="mb-3"><div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress ({dynamicProgress}%)</span><span>{dynamicProgress}%</span></div><div className="h-1.5 bg-black/50 rounded-full overflow-hidden"><div className="h-full bg-sadaya-gold rounded-full transition-all duration-1000" style={{ width: `${dynamicProgress}%` }}></div></div></div><div className="flex justify-between items-center text-xs text-slate-500"><div className="flex -space-x-2">{p.members.map((m, i) => (<div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-black flex items-center justify-center text-white text-[9px] font-bold">{m.charAt(0)}</div>))}</div><div className={`flex items-center bg-white/5 px-2 py-1 rounded ${getDueDateColor(p.dueDate)}`}><Clock className="w-3 h-3 mr-1"/> {p.dueDate}</div></div></div></div>); })}
                      {orgProjects.length === 0 && (<div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl h-full flex items-center justify-center">No {showArchivedProjects ? 'archived' : 'active'} projects found.</div>)}
                  </div>
              </div>
              {isProjectModalOpen && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"><div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"><div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20"><h2 className="text-xl font-headline text-white font-bold">Initialize New Project</h2><button onClick={() => setIsProjectModalOpen(false)}><X className="w-6 h-6 text-slate-500 hover:text-white"/></button></div><div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">{isTaskGenerating ? (<div className="flex flex-col items-center justify-center py-12"><Sparkles className="w-12 h-12 text-sadaya-gold animate-spin mb-4"/><p className="text-white font-bold">Varia is formulating the project plan...</p><p className="text-slate-400 text-sm">Generating tasks, assigning priorities, and setting deadlines.</p></div>) : (<><div><label className="text-xs text-slate-400 uppercase font-bold">Project Title</label><input value={newProjectForm.title} onChange={e => setNewProjectForm({...newProjectForm, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1 focus:border-sadaya-gold outline-none"/></div><div><label className="text-xs text-slate-400 uppercase font-bold">Description</label><textarea value={newProjectForm.description} onChange={e => setNewProjectForm({...newProjectForm, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1 h-20 resize-none focus:border-sadaya-gold outline-none"/></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-slate-400 uppercase font-bold">Due Date</label><input type="date" min={new Date().toISOString().split('T')[0]} value={newProjectForm.dueDate} onChange={e => setNewProjectForm({...newProjectForm, dueDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1 focus:border-sadaya-gold outline-none"/></div><div><label className="text-xs text-slate-400 uppercase font-bold">Project Team</label><div className="flex flex-wrap gap-2 mt-1 bg-white/5 p-2 rounded min-h-[42px]">{teamMembers.filter(m => m.role !== UserRole.SUPER_ADMIN && activeOrg.assignedEmployees?.includes(m.id)).map(m => (<button key={m.id} onClick={() => { const exists = newProjectForm.members.includes(m.name); setNewProjectForm({ ...newProjectForm, members: exists ? newProjectForm.members.filter(n => n !== m.name) : [...newProjectForm.members, m.name] }); }} className={`text-xs px-2 py-1 rounded border ${newProjectForm.members.includes(m.name) ? 'bg-sadaya-gold text-black border-sadaya-gold' : 'border-slate-600 text-slate-400'}`}>{m.name}</button>))}{activeOrg.users.map(u => (<button key={u.id} onClick={() => { const exists = newProjectForm.members.includes(u.name); setNewProjectForm({ ...newProjectForm, members: exists ? newProjectForm.members.filter(n => n !== u.name) : [...newProjectForm.members, u.name] }); }} className={`text-xs px-2 py-1 rounded border ${newProjectForm.members.includes(u.name) ? 'bg-indigo-500 text-white border-indigo-500' : 'border-slate-600 text-slate-400'}`}>{u.name} (Client)</button>))}</div></div></div><div className="pt-4 border-t border-white/10"><div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-sadaya-gold"/><label className="text-xs text-sadaya-gold uppercase font-bold">Varia Strategy (AI Auto-Task Generation)</label></div><textarea value={newProjectForm.strategy} onChange={e => setNewProjectForm({...newProjectForm, strategy: e.target.value})} placeholder="Describe the project strategy here. Varia will automatically generate tasks, checklists, and timelines based on this input..." className="w-full bg-sadaya-tan/10 border border-sadaya-gold/30 rounded p-3 text-white h-32 text-sm focus:border-sadaya-gold outline-none"/></div></>)}</div>{!isTaskGenerating && (<div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3"><button onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button><button onClick={handleCreateProject} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors text-sm flex items-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">{newProjectForm.strategy ? <><Sparkles className="w-4 h-4 mr-2"/> Initiate Varia Project</> : 'Create Project'}</button></div>)}</div></div>
              )}
              {isManageTeamOpen && activeOrg && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"><div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"><div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20"><div><h2 className="text-xl font-headline text-white font-bold">Manage Organization Team</h2><p className="text-xs text-slate-400">Assign employees to {activeOrg.name}</p></div><button onClick={() => setIsManageTeamOpen(false)}><X className="w-6 h-6 text-slate-500 hover:text-white"/></button></div><div className="p-6 overflow-y-auto max-h-[60vh] space-y-2">{teamMembers.map(emp => { const isAssigned = activeOrg.assignedEmployees?.includes(emp.id); return (<div key={emp.id} onClick={() => toggleOrgEmployee(emp.id)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isAssigned ? 'bg-sadaya-gold/10 border-sadaya-gold text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{emp.name.charAt(0)}</div><div><div className="font-bold text-sm">{emp.name}</div><div className="text-xs opacity-70">{emp.role}</div></div></div>{isAssigned && <CheckCircle className="w-5 h-5 text-sadaya-gold"/>}</div>); })}</div><div className="p-6 border-t border-white/10 bg-black/20 text-right"><button onClick={() => setIsManageTeamOpen(false)} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors text-sm">Done</button></div></div></div>
              )}
              {editingProject && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"><div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"><div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20"><h2 className="text-xl font-headline text-white font-bold">Edit Project Details</h2><button onClick={() => setEditingProject(null)}><X className="w-6 h-6 text-slate-500 hover:text-white"/></button></div><div className="p-6 overflow-y-auto space-y-4"><div><label className="text-xs text-slate-400 uppercase font-bold">Project Title</label><input value={editingProject.title} onChange={e => setEditingProject({...editingProject, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1"/></div><div><label className="text-xs text-slate-400 uppercase font-bold">Description</label><textarea value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1 h-20"/></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-slate-400 uppercase font-bold">Due Date</label><input type="date" value={editingProject.dueDate} onChange={e => setEditingProject({...editingProject, dueDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white mt-1"/></div><div><label className="text-xs text-slate-400 uppercase font-bold">Status</label><select value={editingProject.status} onChange={e => setEditingProject({...editingProject, status: e.target.value as any})} className="w-full bg-[#0f172a] border border-white/10 rounded p-2 text-white mt-1"><option value="Active">Active</option><option value="On Hold">On Hold</option><option value="Completed">Completed</option></select></div></div><div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-2"><div className="flex gap-2 w-full md:w-auto"><button onClick={() => setEditingProject({...editingProject, isArchived: !editingProject.isArchived})} className={`flex-1 md:flex-none px-3 py-1 text-sm rounded border ${editingProject.isArchived ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-white/5 text-slate-400 border-white/10'}`}>{editingProject.isArchived ? 'Unarchive Project' : 'Archive Project'}</button><button onClick={(e) => deleteProject(editingProject.id, e)} className="flex-1 md:flex-none px-3 py-1 text-sm rounded border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete Project</button></div></div></div><div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3"><button onClick={() => setEditingProject(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button><button onClick={() => handleUpdateProject(editingProject)} className="px-6 py-2 bg-sadaya-gold text-black font-bold rounded hover:bg-white transition-colors text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">Save Changes</button></div></div></div>
              )}
          </div>
          </>
      );
  }

  return (
      <div className="h-full flex flex-col animate-in fade-in">
          <div className="mb-8">
              <h2 className="text-3xl font-display text-white mb-2 font-headline">Operations Nexus</h2>
              <p className="text-slate-400 font-body font-light">Select a client organization to manage projects and assets.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between"><div><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Active Projects</div><div className="text-2xl font-bold text-white font-headline">{projects.filter(p => p.status === 'Active' && !p.isArchived).length}</div></div><div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Layers className="w-5 h-5 text-blue-400"/></div></div>
              <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between"><div><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Global Tasks Pending</div><div className="text-2xl font-bold text-white font-headline">{tasks.filter(t => t.status !== TaskStatus.DONE && !t.isArchived).length}</div></div><div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20"><Activity className="w-5 h-5 text-yellow-400"/></div></div>
              <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between"><div><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Organizations</div><div className="text-2xl font-bold text-white font-headline">{visibleOrganizations.length}</div></div><div className="w-10 h-10 rounded-full bg-sadaya-gold/10 flex items-center justify-center border border-sadaya-gold/20"><Building className="w-5 h-5 text-sadaya-gold"/></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleOrganizations.map(org => {
                  const activeProjCount = projects.filter(p => p.clientId === org.id && p.status === 'Active' && !p.isArchived).length;
                  return (<div key={org.id} onClick={(e) => handleOrgClick(org.id)} className="glass-panel p-6 rounded-2xl hover:bg-white/5 cursor-pointer transition-all group border-t-4 border-t-transparent hover:border-t-sadaya-gold relative overflow-hidden"><div className="flex items-center justify-between mb-6"><div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><Building className="w-6 h-6 text-sadaya-gold group-hover:scale-110 transition-transform"/></div><span className={`text-xs px-2 py-1 rounded-full border ${org.status === 'Active' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'}`}>{org.status}</span></div><h3 className="text-xl font-bold text-white mb-1 font-headline">{org.name}</h3><p className="text-sm text-slate-500 mb-6 font-body">{org.industry}</p><div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4"><div><div className="text-2xl font-display text-white">{activeProjCount}</div><div className="text-xs text-slate-500 uppercase tracking-wider">Active Projects</div></div><div><div className="text-2xl font-display text-white">{org.users.length}</div><div className="text-xs text-slate-500 uppercase tracking-wider">Members</div></div></div></div>);
              })}
          </div>
      </div>
  );
};
