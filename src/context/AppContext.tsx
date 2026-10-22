import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  AuditLog,
  BackupRecord,
  FileItem,
  FileType,
  StorageQuotaStats,
  TrashCase,
  TrashFile,
  User
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_BACKUPS,
  INITIAL_FILES,
  INITIAL_TRASH_CASES,
  INITIAL_TRASH_FILES,
  INITIAL_USERS
} from '../data/initialData';
import { formatBytes, checkUserAccessStatus, formatDate } from '../utils/validation';

export type ViewMode = 'details' | 'grid' | 'list';
export type SortField = 'name' | 'updatedAt' | 'sizeBytes' | 'fileType';
export type SortOrder = 'asc' | 'desc';

interface AppContextType {
  // Authentication & Session
  isAuthenticated: boolean;
  currentUser: User;
  login: (usernameOrEmail: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  users: User[];
  allClients: User[];

  // Files & Trash
  files: FileItem[];
  trashCases: TrashCase[];
  trashFiles: TrashFile[];
  auditLogs: AuditLog[];
  backups: BackupRecord[];

  // Navigation & Location
  currentClientId: string | null;
  currentFolderId: string | null;
  selectedItemIds: string[];
  viewMode: ViewMode;
  sortField: SortField;
  sortOrder: SortOrder;
  searchQuery: string;

  // Navigation methods
  setCurrentLocation: (clientId: string | null, folderId: string | null) => void;
  navigateToFolder: (folderId: string | null) => void;
  navigateUp: () => void;
  setSelectedItemIds: (ids: string[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setSearchQuery: (query: string) => void;

  // File Operations
  createFolder: (name: string) => { success: boolean; message?: string };
  uploadFile: (file: {
    name: string;
    sizeBytes: number;
    fileType: FileType;
    extension: string;
    description?: string;
    category?: any;
    previewData?: any;
  }) => { success: boolean; message?: string };
  renameItem: (itemId: string, newName: string) => { success: boolean; message?: string };
  moveToTrash: (itemId: string) => { success: boolean; message?: string };
  restoreFromTrash: (type: 'case' | 'file', id: string) => void;
  deletePermanently: (type: 'case' | 'file', id: string) => void;
  emptyTrash: () => void;

  // User Management
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'usedStorageBytes'>) => { success: boolean; message?: string; user?: User };
  updateUser: (userId: string, data: Partial<User>) => { success: boolean; message?: string };
  toggleUserStatus: (userId: string) => void;
  extendUserValidity: (userId: string, additionalDays: number) => void;

  // Backup Operations
  createBackupNow: () => BackupRecord;
  verifyBackupItem: (backupId: string) => boolean;
  deleteBackupItem: (backupId: string) => void;

  // Stats & Reports
  quotaReports: StorageQuotaStats[];
  totalDiskStats: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percentUsed: number;
  };
  totalQuotaStats: {
    totalAssignedQuotaBytes: number;
    totalConsumedQuotaBytes: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'admdoc_users_v5',
  FILES: 'admdoc_files_v5',
  TRASH_CASES: 'admdoc_trash_cases_v5',
  TRASH_FILES: 'admdoc_trash_files_v5',
  AUDIT: 'admdoc_audit_v5',
  BACKUPS: 'admdoc_backups_v5',
  ACTIVE_USER_ID: 'admdoc_active_user_id_v5',
  IS_AUTH: 'admdoc_is_auth_v5'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load or fallback to initial
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FILES);
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [trashCases, setTrashCases] = useState<TrashCase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRASH_CASES);
    return saved ? JSON.parse(saved) : INITIAL_TRASH_CASES;
  });

  const [trashFiles, setTrashFiles] = useState<TrashFile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRASH_FILES);
    return saved ? JSON.parse(saved) : INITIAL_TRASH_FILES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [backups, setBackups] = useState<BackupRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BACKUPS);
    return saved ? JSON.parse(saved) : INITIAL_BACKUPS;
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    return saved || 'user-admin';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_AUTH);
    return saved !== null ? saved === 'true' : true;
  });

  // Location / Explorer state
  const [currentClientId, setCurrentClientId] = useState<string | null>('user-client-daniel');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRASH_CASES, JSON.stringify(trashCases));
  }, [trashCases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRASH_FILES, JSON.stringify(trashFiles));
  }, [trashFiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  }, [backups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_AUTH, String(isAuthenticated));
  }, [isAuthenticated]);

  // Keep each user's usedStorageBytes dynamically synchronized with actual files
  const usersWithSyncedStorage = useMemo(() => {
    return users.map(u => {
      const clientFiles = files.filter(f => f.clientId === u.id && !f.inTrash && !f.isFolder);
      const calculatedUsed = clientFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
      return {
        ...u,
        usedStorageBytes: calculatedUsed
      };
    });
  }, [users, files]);

  // Current active user
  const currentUser = useMemo(() => {
    return usersWithSyncedStorage.find(u => u.id === activeUserId) || usersWithSyncedStorage[0];
  }, [usersWithSyncedStorage, activeUserId]);

  // List of all clients
  const allClients = useMemo(() => {
    return usersWithSyncedStorage.filter(u => u.role === 'client');
  }, [usersWithSyncedStorage]);

  // Ensure currentClientId is always valid
  useEffect(() => {
    if (currentUser.role === 'client') {
      setCurrentClientId(currentUser.id);
    } else {
      if (!currentClientId || !users.some(u => u.id === currentClientId)) {
        const firstClient = allClients[0] || users[0];
        if (firstClient) {
          setCurrentClientId(firstClient.id);
        }
      }
    }
  }, [currentUser, allClients, currentClientId, users]);

  // Add audit log helper
  const addAudit = (action: string, detail: string) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formatted = `${day}/${month}/${year} ${hours}:${minutes}`;

    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: formatted,
      username: currentUser.username,
      action,
      detail,
      ip: '127.0.0.1'
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Login handler
  const login = (usernameOrEmail: string, password?: string) => {
    const clean = usernameOrEmail.trim().toLowerCase();
    const target = users.find(
      u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (!target) {
      return { success: false, message: 'El usuario o correo electrónico ingresado no existe.' };
    }

    if (target.status === 'inactive') {
      return { success: false, message: 'La cuenta se encuentra desactivada por el administrador.' };
    }

    const validity = checkUserAccessStatus(target);
    if (!validity.isAllowed) {
      return { success: false, message: validity.reason || 'El acceso para este usuario ha vencido.' };
    }

    if (password && target.password && target.password !== password) {
      return { success: false, message: 'Contraseña incorrecta. Verifique sus credenciales.' };
    }

    const loginTime = formatDate(new Date().toISOString(), true);
    setUsers(prev => prev.map(u => (u.id === target.id ? { ...u, lastLoginAt: loginTime } : u)));

    setActiveUserId(target.id);
    setIsAuthenticated(true);
    setSelectedItemIds([]);

    if (target.role === 'client') {
      setCurrentClientId(target.id);
      setCurrentFolderId(null);
    }

    addAudit('login', `Inicio de sesión exitoso: @${target.username} (${target.firstName} ${target.lastNamePaterno})`);
    return { success: true };
  };

  const logout = () => {
    addAudit('logout', `Cierre de sesión de @${currentUser.username}`);
    setIsAuthenticated(false);
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    setActiveUserId(userId);
    setSelectedItemIds([]);
    if (target.role === 'client') {
      setCurrentClientId(target.id);
      setCurrentFolderId(null);
    }
    addAudit('login', `Cambio de sesión a usuario: @${target.username}`);
  };

  const setCurrentLocation = (clientId: string | null, folderId: string | null) => {
    setCurrentClientId(clientId);
    setCurrentFolderId(folderId);
    setSelectedItemIds([]);
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedItemIds([]);
  };

  const navigateUp = () => {
    if (currentFolderId) {
      const currentFolder = files.find(f => f.id === currentFolderId);
      if (currentFolder && currentFolder.parentId) {
        setCurrentFolderId(currentFolder.parentId);
      } else {
        setCurrentFolderId(null);
      }
    }
  };

  // Recalculate client used storage bytes based on non-trash files
  const syncClientUsage = (clientId: string) => {
    const clientFiles = files.filter(f => f.clientId === clientId && !f.inTrash && !f.isFolder);
    const totalBytes = clientFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
    setUsers(prev => prev.map(u => u.id === clientId ? { ...u, usedStorageBytes: totalBytes } : u));
  };

  // File Operations: Directly under client/folder without any mine restriction
  const createFolder = (name: string) => {
    if (!name.trim()) {
      return { success: false, message: 'El nombre de la carpeta no puede estar vacío.' };
    }

    let targetClientId = currentClientId;
    if (!targetClientId) {
      targetClientId = currentUser.role === 'client' ? currentUser.id : (allClients[0]?.id || users[0]?.id);
      setCurrentClientId(targetClientId);
    }

    if (currentUser.role === 'client' && targetClientId !== currentUser.id) {
      return { success: false, message: 'No tiene autorización para crear carpetas en este espacio.' };
    }

    let folderPath = `/${name.trim()}`;
    if (currentFolderId) {
      const parent = files.find(f => f.id === currentFolderId);
      if (parent) {
        folderPath = `${parent.path}/${name.trim()}`;
      }
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newFolder: FileItem = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      isFolder: true,
      parentId: currentFolderId,
      clientId: targetClientId,
      category: 'General',
      path: folderPath,
      sizeBytes: 0,
      fileType: 'folder',
      extension: '',
      uploadedByUserId: currentUser.id,
      uploadedByRole: currentUser.role,
      uploadedByName: `${currentUser.firstName} ${currentUser.lastNamePaterno}`,
      createdAt: formattedDate,
      updatedAt: formattedDate,
      isClientReadOnly: currentUser.role === 'admin' || currentUser.role === 'collaborator',
      isClientUploaded: currentUser.role === 'client',
      inTrash: false
    };

    setFiles(prev => [...prev, newFolder]);
    addAudit('carpeta_creada', `Carpeta "${name.trim()}" creada`);
    return { success: true };
  };

  const uploadFile = (fileData: {
    name: string;
    sizeBytes: number;
    fileType: FileType;
    extension: string;
    description?: string;
    category?: any;
    previewData?: any;
  }) => {
    let targetClientId = currentClientId;
    if (!targetClientId) {
      targetClientId = currentUser.role === 'client' ? currentUser.id : (allClients[0]?.id || users[0]?.id);
      setCurrentClientId(targetClientId);
    }

    const clientUser = users.find(u => u.id === targetClientId);
    if (!clientUser) {
      return { success: false, message: 'Cliente no encontrado.' };
    }

    // Storage Quota Validation
    const currentUsed = clientUser.usedStorageBytes || 0;
    const quota = clientUser.storageQuotaBytes || (2 * 1024 * 1024 * 1024);

    if (currentUsed + fileData.sizeBytes > quota) {
      const overBy = (currentUsed + fileData.sizeBytes) - quota;
      return {
        success: false,
        message: `Límite de cuota de almacenamiento excedido. Asignado: ${formatBytes(quota)}, usado: ${formatBytes(currentUsed)}, se requiere ${formatBytes(fileData.sizeBytes)} (excede por ${formatBytes(overBy)}). Contacte al administrador.`
      };
    }

    if (currentUser.role === 'client' && targetClientId !== currentUser.id) {
      return { success: false, message: 'No tiene permiso para subir archivos en otros clientes.' };
    }

    let filePath = `/${fileData.name.trim()}`;
    if (currentFolderId) {
      const parent = files.find(f => f.id === currentFolderId);
      if (parent) {
        filePath = `${parent.path}/${fileData.name.trim()}`;
      }
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newFile: FileItem = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: fileData.name.trim(),
      isFolder: false,
      parentId: currentFolderId,
      clientId: targetClientId,
      category: fileData.category || 'General',
      path: filePath,
      sizeBytes: fileData.sizeBytes,
      fileType: fileData.fileType,
      extension: fileData.extension,
      uploadedByUserId: currentUser.id,
      uploadedByRole: currentUser.role,
      uploadedByName: `${currentUser.firstName} ${currentUser.lastNamePaterno}`,
      createdAt: formattedDate,
      updatedAt: formattedDate,
      isClientReadOnly: currentUser.role === 'admin' || currentUser.role === 'collaborator',
      isClientUploaded: currentUser.role === 'client',
      inTrash: false,
      description: fileData.description || 'Documento cargado.',
      fileContentSimulated: fileData.previewData || {
        previewType: fileData.fileType === 'dwg' ? 'cad' : fileData.fileType === 'pdf' ? 'pdf' : fileData.fileType === 'excel' ? 'spreadsheet' : 'text',
        summary: `Documento: ${fileData.name}`
      }
    };

    setFiles(prev => [...prev, newFile]);
    setUsers(prev => prev.map(u => u.id === targetClientId ? { ...u, usedStorageBytes: u.usedStorageBytes + fileData.sizeBytes } : u));

    addAudit('archivo_subido', `${fileData.name} (${formatBytes(fileData.sizeBytes)})`);
    return { success: true };
  };

  const renameItem = (itemId: string, newName: string) => {
    const item = files.find(f => f.id === itemId);
    if (!item) return { success: false, message: 'Elemento no encontrado.' };

    if (currentUser.role === 'client' && item.isClientReadOnly) {
      return { success: false, message: 'Acceso denegado: Este archivo o carpeta ha sido compartido por el Administrador en modo Solo Lectura.' };
    }

    const trimmed = newName.trim();
    if (!trimmed) return { success: false, message: 'El nombre no puede estar vacío.' };

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const oldPath = item.path;
    const parentPath = oldPath.lastIndexOf('/') > 0 ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
    const newPath = `${parentPath}/${trimmed}`;

    setFiles(prev => prev.map(f => {
      if (f.id === itemId) {
        return {
          ...f,
          name: trimmed,
          path: newPath,
          updatedAt: formattedDate
        };
      }
      // If it is a folder, also update paths of all its descendant items
      if (item.isFolder && f.path.startsWith(oldPath + '/')) {
        return {
          ...f,
          path: newPath + f.path.substring(oldPath.length)
        };
      }
      return f;
    }));

    addAudit('renombrar', `Elemento "${item.name}" renombrado a "${trimmed}"`);
    return { success: true };
  };

  const moveToTrash = (itemId: string) => {
    const item = files.find(f => f.id === itemId);
    if (!item) return { success: false, message: 'Elemento no encontrado.' };

    if (currentUser.role === 'client' && item.isClientReadOnly) {
      return {
        success: false,
        message: 'Acceso denegado: Los archivos del Administrador son de Solo Lectura. Solo puede eliminar los archivos creados por usted.'
      };
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateFormatted = `${day}/${month}/${year} ${hours}:${minutes}`;

    const client = users.find(u => u.id === item.clientId);
    const clientName = client ? (client.businessName || `${client.firstName} ${client.lastNamePaterno}`) : 'Cliente';

    if (item.isFolder) {
      const allSubFiles = files.filter(f => f.path.startsWith(item.path));
      const subFilesCount = allSubFiles.filter(f => !f.isFolder).length;
      const totalFolderSize = allSubFiles.reduce((acc, f) => acc + f.sizeBytes, 0);

      const trashCase: TrashCase = {
        id: `tc-${Date.now()}`,
        folderId: item.id,
        clientId: item.clientId,
        clientName,
        title: item.name,
        fileCount: subFilesCount,
        totalSize: totalFolderSize,
        deletedAt: dateFormatted,
        deletedBy: currentUser.username
      };

      setTrashCases(prev => [trashCase, ...prev]);

      setFiles(prev => prev.map(f => {
        if (f.id === item.id || f.path.startsWith(item.path + '/')) {
          return {
            ...f,
            inTrash: true,
            deletedAt: dateFormatted,
            deletedBy: currentUser.username,
            deletedByRole: currentUser.role
          };
        }
        return f;
      }));

      addAudit('caso_a_papelera', `Carpeta "${item.name}" enviada a papelera con ${subFilesCount} archivo(s)`);
    } else {
      const trashFile: TrashFile = {
        id: `tf-${Date.now()}`,
        fileId: item.id,
        name: item.name,
        fileType: item.fileType,
        sizeBytes: item.sizeBytes,
        clientId: item.clientId,
        clientName,
        casePath: item.path,
        deletedAt: dateFormatted,
        deletedBy: currentUser.username
      };

      setTrashFiles(prev => [trashFile, ...prev]);

      setFiles(prev => prev.map(f => {
        if (f.id === item.id) {
          return {
            ...f,
            inTrash: true,
            deletedAt: dateFormatted,
            deletedBy: currentUser.username,
            deletedByRole: currentUser.role
          };
        }
        return f;
      }));

      addAudit('archivo_a_papelera', `Archivo "${item.name}" (${formatBytes(item.sizeBytes)}) enviado a papelera`);
    }

    setTimeout(() => syncClientUsage(item.clientId), 50);
    return { success: true };
  };

  const restoreFromTrash = (type: 'case' | 'file', id: string) => {
    if (type === 'case') {
      const tc = trashCases.find(c => c.id === id);
      if (!tc) return;

      setFiles(prev => prev.map(f => {
        if (f.id === tc.folderId || (f.path && f.path.includes(tc.title))) {
          return { ...f, inTrash: false, deletedAt: undefined, deletedBy: undefined };
        }
        return f;
      }));

      setTrashCases(prev => prev.filter(c => c.id !== id));
      addAudit('restaurar_caso', `Carpeta "${tc.title}" restaurada`);
      syncClientUsage(tc.clientId);
    } else {
      const tf = trashFiles.find(f => f.id === id);
      if (!tf) return;

      setFiles(prev => prev.map(f => {
        if (f.id === tf.fileId) {
          return { ...f, inTrash: false, deletedAt: undefined, deletedBy: undefined };
        }
        return f;
      }));

      setTrashFiles(prev => prev.filter(f => f.id !== id));
      addAudit('restaurar_archivo', `Archivo "${tf.name}" restaurado`);
      syncClientUsage(tf.clientId);
    }
  };

  const deletePermanently = (type: 'case' | 'file', id: string) => {
    if (type === 'case') {
      const tc = trashCases.find(c => c.id === id);
      if (!tc) return;

      setFiles(prev => prev.filter(f => f.id !== tc.folderId && !f.path.includes(tc.title)));
      setTrashCases(prev => prev.filter(c => c.id !== id));
      addAudit('borrar_definitivo', `Carpeta "${tc.title}" eliminada definitivamente`);
    } else {
      const tf = trashFiles.find(f => f.id === id);
      if (!tf) return;

      setFiles(prev => prev.filter(f => f.id !== tf.fileId));
      setTrashFiles(prev => prev.filter(f => f.id !== id));
      addAudit('borrar_definitivo', `Archivo "${tf.name}" eliminado definitivamente`);
    }
  };

  const emptyTrash = () => {
    const fileIdsToDelete = new Set(trashFiles.map(tf => tf.fileId));
    const folderIdsToDelete = new Set(trashCases.map(tc => tc.folderId));

    setFiles(prev => prev.filter(f => !f.inTrash && !fileIdsToDelete.has(f.id) && !folderIdsToDelete.has(f.id)));
    setTrashCases([]);
    setTrashFiles([]);
    addAudit('vaciar_papelera', 'Papelera vaciada completamente');
  };

  // User Management
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'usedStorageBytes'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      usedStorageBytes: 0
    };

    setUsers(prev => [newUser, ...prev]);
    addAudit(
      'usuario_creado',
      `Usuario creado: @${newUser.username} (${newUser.firstName} ${newUser.lastNamePaterno}), Rol: ${newUser.role}, Cuota: ${formatBytes(newUser.storageQuotaBytes)}`
    );
    return { success: true, user: newUser };
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...data } : u)));
    addAudit('usuario_actualizado', `Usuario ID ${userId} actualizado`);
    return { success: true };
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        addAudit('estado_usuario', `Usuario "${u.username}" cambiado a: ${nextStatus}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const extendUserValidity = (userId: string, additionalDays: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const today = new Date();
        const currentUntil = new Date(u.validUntil);
        const baseDate = currentUntil < today ? today : currentUntil;

        const newUntil = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
        const yyyy = newUntil.getFullYear();
        const mm = String(newUntil.getMonth() + 1).padStart(2, '0');
        const dd = String(newUntil.getDate()).padStart(2, '0');
        const formatted = `${yyyy}-${mm}-${dd}`;

        addAudit('vigencia_extendida', `Vigencia de "${u.username}" extendida +${additionalDays} días (Hasta: ${formatted})`);
        return { ...u, validUntil: formatted, status: 'active' };
      }
      return u;
    }));
  };

  // Backup Operations
  const createBackupNow = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const filename = `respaldo_${yyyy}${mm}${dd}_${hh}${min}${ss}.zip`;
    const dateFormatted = `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    const pseudoHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const newBackup: BackupRecord = {
      id: `bak-${Date.now()}`,
      filename,
      date: dateFormatted,
      size: '1.5 MB',
      sizeBytes: 1542100,
      fileCount: files.filter(f => !f.inTrash).length,
      checksum: pseudoHash,
      status: 'verified'
    };

    setBackups(prev => [newBackup, ...prev]);
    addAudit('respaldo_creado', `Respaldo manual generado: ${filename}`);
    return newBackup;
  };

  const verifyBackupItem = (backupId: string) => {
    let verified = false;
    setBackups(prev => prev.map(b => {
      if (b.id === backupId) {
        verified = true;
        return { ...b, status: 'verified' };
      }
      return b;
    }));
    addAudit('respaldo_verificado', `Respaldo ${backupId} verificado`);
    return verified;
  };

  const deleteBackupItem = (backupId: string) => {
    setBackups(prev => prev.filter(b => b.id !== backupId));
    addAudit('respaldo_eliminado', `Respaldo ${backupId} eliminado`);
  };

  // Quota Reports calculations
  const quotaReports = useMemo<StorageQuotaStats[]>(() => {
    return allClients.map(client => {
      const clientFiles = files.filter(f => f.clientId === client.id && !f.inTrash);
      const usedBytes = clientFiles.reduce((acc, f) => acc + (f.isFolder ? 0 : f.sizeBytes), 0);
      const assigned = client.storageQuotaBytes || 2 * 1024 * 1024 * 1024;
      const percentage = assigned > 0 ? (usedBytes / assigned) * 100 : 0;
      const clientFolders = clientFiles.filter(f => f.isFolder).length;
      const clientRegularFiles = clientFiles.filter(f => !f.isFolder).length;

      const breakdown = {
        planos: clientFiles.filter(f => f.fileType === 'dwg' || (f.category === 'Planos' && !f.isFolder)).reduce((a, b) => a + b.sizeBytes, 0),
        estudios: clientFiles.filter(f => f.category === 'Estudios Ambientales' && !f.isFolder).reduce((a, b) => a + b.sizeBytes, 0),
        costos: clientFiles.filter(f => f.fileType === 'excel' && !f.isFolder).reduce((a, b) => a + b.sizeBytes, 0),
        multimedia: clientFiles.filter(f => (f.fileType === 'video' || f.fileType === 'image') && !f.isFolder).reduce((a, b) => a + b.sizeBytes, 0),
        otros: clientFiles.filter(f => !['dwg', 'excel', 'video', 'image'].includes(f.fileType) && f.category !== 'Estudios Ambientales' && !f.isFolder).reduce((a, b) => a + b.sizeBytes, 0)
      };

      return {
        clientId: client.id,
        clientName: client.businessName || `${client.firstName} ${client.lastNamePaterno} ${client.lastNameMaterno}`.trim(),
        username: client.username,
        assignedQuotaBytes: assigned,
        usedBytes,
        percentageUsed: Math.min(100, Math.round(percentage * 10) / 10),
        isOverLimit: usedBytes >= assigned,
        isNearLimit: percentage >= 80,
        fileCount: clientRegularFiles,
        folderCount: clientFolders,
        status: client.status,
        validUntil: client.validUntil,
        categoryBreakdown: breakdown
      };
    });
  }, [allClients, files]);

  const totalDiskStats = useMemo(() => {
    const totalBytes = 200 * 1024 * 1024 * 1024;
    const usedBytes = files.filter(f => !f.inTrash && !f.isFolder).reduce((a, b) => a + b.sizeBytes, 0);
    const freeBytes = totalBytes - usedBytes;
    const percentUsed = (usedBytes / totalBytes) * 100;

    return {
      totalBytes,
      usedBytes,
      freeBytes,
      percentUsed: Math.round(percentUsed * 100) / 100
    };
  }, [files]);

  const totalQuotaStats = useMemo(() => {
    const totalAssignedQuotaBytes = allClients.reduce((acc, c) => acc + (c.storageQuotaBytes || 0), 0);
    const totalConsumedQuotaBytes = quotaReports.reduce((acc, r) => acc + r.usedBytes, 0);
    return {
      totalAssignedQuotaBytes,
      totalConsumedQuotaBytes
    };
  }, [allClients, quotaReports]);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        switchUser,
        users: usersWithSyncedStorage,
        allClients,
        files,
        trashCases,
        trashFiles,
        auditLogs,
        backups,
        currentClientId,
        currentFolderId,
        selectedItemIds,
        viewMode,
        sortField,
        sortOrder,
        searchQuery,
        setCurrentLocation,
        navigateToFolder,
        navigateUp,
        setSelectedItemIds,
        setViewMode,
        setSortField,
        setSortOrder,
        setSearchQuery,
        createFolder,
        uploadFile,
        renameItem,
        moveToTrash,
        restoreFromTrash,
        deletePermanently,
        emptyTrash,
        addUser,
        updateUser,
        toggleUserStatus,
        extendUserValidity,
        createBackupNow,
        verifyBackupItem,
        deleteBackupItem,
        quotaReports,
        totalDiskStats,
        totalQuotaStats
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
