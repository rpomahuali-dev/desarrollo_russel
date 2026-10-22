export type UserRole = 'admin' | 'collaborator' | 'client';
export type UserStatus = 'active' | 'inactive';
export type PersonType = 'natural' | 'juridica';
export type DocumentType = 'DNI' | 'CE' | 'RUC';

export interface UserHistoryEvent {
  id: string;
  timestamp: string; // 'DD/MM/YYYY HH:mm'
  action: string; // e.g. 'Registro inicial', 'Cambio a Persona Jurídica', 'Actualización de RUC', 'Ampliación de cuota'
  detail: string;
  author: string; // e.g. 'admin' or username
  tag: 'creacion' | 'tipo_persona' | 'datos' | 'cuota' | 'vigencia' | 'acceso';
}

export interface User {
  id: string;
  username: string; // e.g. 'dpena' or 'd1pena'
  password?: string; // Automatically generated password
  role: UserRole;
  status: UserStatus;
  personType: PersonType;
  firstName: string; // or legal representative
  lastNamePaterno: string;
  lastNameMaterno: string;
  businessName?: string; // Razón Social si es persona jurídica
  legalRepName?: string; // Nombre del representante legal
  legalRepLastNamePaterno?: string; // Apellido paterno del representante legal
  legalRepLastNameMaterno?: string; // Apellido materno del representante legal
  legalRepDni?: string; // DNI del representante legal
  docType: DocumentType;
  docNumber: string;
  ruc?: string; // RUC for both persona natural and juridica
  email: string;
  phone: string;
  validFrom: string; // ISO date 'YYYY-MM-DD'
  validUntil: string; // ISO date 'YYYY-MM-DD'
  storageQuotaBytes: number; // in bytes (configured from MB)
  usedStorageBytes: number;
  createdAt: string;
  lastLoginAt?: string; // Último ingreso del usuario (formato dd/mm/aaaa hh:mm)
  notes?: string;
  history?: UserHistoryEvent[];
}

export type FileType = 'pdf' | 'dwg' | 'excel' | 'word' | 'image' | 'video' | 'zip' | 'folder' | 'other';

export interface FileItem {
  id: string;
  name: string;
  isFolder: boolean;
  parentId: string | null; // null represents the root inside client
  clientId: string;
  path: string;
  sizeBytes: number;
  fileType: FileType;
  extension: string;
  uploadedByUserId: string;
  uploadedByRole: UserRole;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
  isClientReadOnly: boolean; // If true, client can only read/download, cannot edit/delete
  isClientUploaded: boolean; // Flag if the client uploaded it
  inTrash: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByRole?: UserRole;
  description?: string;
  category?: string;
  fileContentSimulated?: {
    previewType: 'cad' | 'pdf' | 'spreadsheet' | 'image' | 'video' | 'archive' | 'text';
    summary?: string;
    sheetHeaders?: string[];
    sheetRows?: (string | number)[][];
    cadLayers?: string[];
    totalPages?: number;
    dimensions?: string;
    duration?: string;
  };
}

export interface TrashCase {
  id: string;
  folderId: string;
  clientId: string;
  clientName: string;
  title: string;
  fileCount: number;
  totalSize: number;
  deletedAt: string;
  deletedBy: string;
}

export interface TrashFile {
  id: string;
  fileId: string;
  name: string;
  fileType: FileType;
  sizeBytes: number;
  clientId: string;
  clientName: string;
  casePath: string;
  deletedAt: string;
  deletedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // 'DD/MM/YYYY HH:mm'
  username: string;
  action: string;
  detail: string;
  ip: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  date: string; // 'DD/MM/YYYY HH:mm'
  size: string;
  sizeBytes: number;
  fileCount: number;
  checksum: string;
  status: 'verified' | 'unverified';
}

export interface StorageQuotaStats {
  clientId: string;
  clientName: string;
  username: string;
  assignedQuotaBytes: number;
  usedBytes: number;
  percentageUsed: number;
  isOverLimit: boolean;
  isNearLimit: boolean; // > 80%
  fileCount: number;
  folderCount: number;
  status: UserStatus;
  validUntil: string;
  categoryBreakdown: {
    planos: number;
    estudios: number;
    costos: number;
    multimedia: number;
    otros: number;
  };
}
