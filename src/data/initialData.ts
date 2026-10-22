import { AuditLog, BackupRecord, FileItem, TrashCase, TrashFile, User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'Admin*2026!',
    role: 'admin',
    status: 'active',
    personType: 'natural',
    firstName: 'Administrador',
    lastNamePaterno: 'Principal',
    lastNameMaterno: 'Consultor',
    docType: 'DNI',
    docNumber: '40192837',
    ruc: '10401928371',
    email: 'consultoria@ingenieria.pe',
    phone: '984123456',
    validFrom: '2025-01-01',
    validUntil: '2030-12-31',
    storageQuotaBytes: 100 * 1024 * 1024 * 1024, // 100 GB
    usedStorageBytes: 222142000, // Exact sum of all files in system (~222.1 MB)
    createdAt: '2025-01-01',
    lastLoginAt: '20/10/2026 21:40'
  },
  {
    id: 'user-colab-1',
    username: 'cparedes',
    password: 'Colab#4821!',
    role: 'collaborator',
    status: 'active',
    personType: 'natural',
    firstName: 'Carlos',
    lastNamePaterno: 'Paredes',
    lastNameMaterno: 'Mendoza',
    docType: 'DNI',
    docNumber: '44819283',
    ruc: '10448192834',
    email: 'cparedes@ingenieria.pe',
    phone: '951234891',
    validFrom: '2026-01-01',
    validUntil: '2027-12-31',
    storageQuotaBytes: 20 * 1024 * 1024 * 1024, // 20 GB
    usedStorageBytes: 0,
    createdAt: '2026-01-10',
    lastLoginAt: '20/10/2026 19:15'
  },
  {
    id: 'user-client-daniel',
    username: 'danielp',
    password: 'Minero#7192!',
    role: 'client',
    status: 'active',
    personType: 'natural',
    firstName: 'Daniel',
    lastNamePaterno: 'Peña',
    lastNameMaterno: 'Quispe',
    docType: 'DNI',
    docNumber: '42891024',
    ruc: '10428910241',
    email: 'daniel.pena.minero@gmail.com',
    phone: '951982341',
    validFrom: '2026-04-20',
    validUntil: '2026-10-23', // Matches screenshot: expires in 4 days
    storageQuotaBytes: 2 * 1024 * 1024 * 1024, // 2048 MB (2 GB)
    usedStorageBytes: 190142000, // Exact sum of Daniel's files (~190.1 MB)
    createdAt: '2026-04-20',
    lastLoginAt: '20/10/2026 18:25',
    notes: 'Minero en proceso de formalización técnica.'
  },
  {
    id: 'user-client-empresa',
    username: 'mrosales',
    password: 'Eldorado#2026!',
    role: 'client',
    status: 'active',
    personType: 'juridica',
    businessName: 'Corporación Minera El Dorado S.A.C.',
    firstName: 'Manuel',
    lastNamePaterno: 'Rosales',
    lastNameMaterno: 'Campos',
    legalRepName: 'Manuel',
    legalRepLastNamePaterno: 'Rosales',
    legalRepLastNameMaterno: 'Campos',
    legalRepDni: '41829310',
    docType: 'DNI',
    docNumber: '41829310',
    ruc: '20549182931',
    email: 'contacto@mineraeldorado.com.pe',
    phone: '954001928',
    validFrom: '2026-01-01',
    validUntil: '2026-11-15',
    storageQuotaBytes: 5 * 1024 * 1024 * 1024, // 5120 MB (5 GB)
    usedStorageBytes: 32000000, // Exact sum of El Dorado's files (32 MB)
    createdAt: '2026-01-05',
    lastLoginAt: '19/10/2026 14:10'
  },
  {
    id: 'user-client-carlosperez',
    username: 'carlosperez1',
    password: 'Perez#5912!',
    role: 'client',
    status: 'inactive',
    personType: 'natural',
    firstName: 'Carlos',
    lastNamePaterno: 'Perez',
    lastNameMaterno: 'Dias',
    docType: 'DNI',
    docNumber: '09482711',
    ruc: '10094827118',
    email: 'carlosperez.dias@hotmail.com',
    phone: '984019283',
    validFrom: '2026-05-01',
    validUntil: '2026-09-30', // expired
    storageQuotaBytes: 1 * 1024 * 1024 * 1024, // 1024 MB
    usedStorageBytes: 0,
    createdAt: '2026-05-01',
    lastLoginAt: '28/09/2026 11:05'
  },
  {
    id: 'user-client-juancarlos',
    username: 'juancarlos1',
    password: 'Cardenas#3182!',
    role: 'client',
    status: 'inactive',
    personType: 'natural',
    firstName: 'Juan Carlos',
    lastNamePaterno: 'Cardenas',
    lastNameMaterno: 'Flores',
    docType: 'DNI',
    docNumber: '41928301',
    ruc: '10419283014',
    email: 'juancarlos.cardenas@outlook.com',
    phone: '952817290',
    validFrom: '2026-06-01',
    validUntil: '2026-10-15', // expired
    storageQuotaBytes: 1 * 1024 * 1024 * 1024,
    usedStorageBytes: 0,
    createdAt: '2026-06-01',
    lastLoginAt: '14/10/2026 16:50'
  }
];

export const INITIAL_FILES: FileItem[] = [
  // --- Root Folders for Daniel Peña ---
  {
    id: 'folder-daniel-1',
    name: '01. Planos y Levantamientos Topográficos',
    isFolder: true,
    parentId: null,
    clientId: 'user-client-daniel',
    category: 'Planos',
    path: '/01. Planos y Levantamientos Topográficos',
    sizeBytes: 0,
    fileType: 'folder',
    extension: '',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-04-22 10:30',
    updatedAt: '2026-10-12 16:45',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false
  },
  {
    id: 'folder-daniel-2',
    name: '02. Estudios Ambientales (IGA - DIA)',
    isFolder: true,
    parentId: null,
    clientId: 'user-client-daniel',
    category: 'Estudios Ambientales',
    path: '/02. Estudios Ambientales (IGA - DIA)',
    sizeBytes: 0,
    fileType: 'folder',
    extension: '',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-04-22 10:32',
    updatedAt: '2026-09-18 11:15',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false
  },
  {
    id: 'folder-daniel-3',
    name: '03. Trámites de Formalización y Legal',
    isFolder: true,
    parentId: null,
    clientId: 'user-client-daniel',
    category: 'Legal',
    path: '/03. Trámites de Formalización y Legal',
    sizeBytes: 0,
    fileType: 'folder',
    extension: '',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-04-22 10:35',
    updatedAt: '2026-10-05 09:20',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false
  },
  {
    id: 'folder-daniel-4',
    name: '04. Informes de Producción y Ensayos Químicos',
    isFolder: true,
    parentId: null,
    clientId: 'user-client-daniel',
    category: 'Costos',
    path: '/04. Informes de Producción y Ensayos Químicos',
    sizeBytes: 0,
    fileType: 'folder',
    extension: '',
    uploadedByUserId: 'user-colab-1',
    uploadedByRole: 'collaborator',
    uploadedByName: 'Carlos Paredes',
    createdAt: '2026-05-10 14:00',
    updatedAt: '2026-10-18 17:00',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false
  },
  {
    id: 'folder-daniel-5',
    name: '05. Documentos Aportados por el Minero',
    isFolder: true,
    parentId: null,
    clientId: 'user-client-daniel',
    category: 'General',
    path: '/05. Documentos Aportados por el Minero',
    sizeBytes: 0,
    fileType: 'folder',
    extension: '',
    uploadedByUserId: 'user-client-daniel',
    uploadedByRole: 'client',
    uploadedByName: 'Daniel Peña',
    createdAt: '2026-05-12 11:20',
    updatedAt: '2026-10-19 14:10',
    isClientReadOnly: false, // Client can edit and add here
    isClientUploaded: true,
    inTrash: false
  },

  // --- Files inside folder-daniel-1 (Planos) ---
  {
    id: 'file-daniel-cad-1',
    name: 'Plano_Topografico_Curvas_Nivel_2026.dwg',
    isFolder: false,
    parentId: 'folder-daniel-1',
    clientId: 'user-client-daniel',
    category: 'Planos',
    path: '/01. Planos y Levantamientos Topográficos/Plano_Topografico_Curvas_Nivel_2026.dwg',
    sizeBytes: 18500000, // 18.5 MB
    fileType: 'dwg',
    extension: 'dwg',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-04-25 11:20',
    updatedAt: '2026-04-25 11:20',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false,
    description: 'Levantamiento topográfico con estación total georreferenciada WGS84 Zona 19S.',
    fileContentSimulated: {
      previewType: 'cad',
      summary: 'Plano Topográfico - Concesión Aurífera. Escala 1:1000. Curvas a cada 5 metros.',
      cadLayers: ['Curvas de nivel', 'Vértices de Concesión', 'Bocamina Nivel 01', 'Canaleta de relaves', 'Campamento']
    }
  },
  {
    id: 'file-daniel-pdf-1',
    name: 'Memoria_Descriptiva_Levantamiento.pdf',
    isFolder: false,
    parentId: 'folder-daniel-1',
    clientId: 'user-client-daniel',
    category: 'Planos',
    path: '/01. Planos y Levantamientos Topográficos/Memoria_Descriptiva_Levantamiento.pdf',
    sizeBytes: 4200000, // 4.2 MB
    fileType: 'pdf',
    extension: 'pdf',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-04-25 11:25',
    updatedAt: '2026-04-25 11:25',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false,
    description: 'Memoria técnica de cálculo de coordenadas UTM y poligonales cerradas.',
    fileContentSimulated: {
      previewType: 'pdf',
      summary: 'Memoria descriptiva oficial del levantamiento topográfico para expediente INGEMMET.',
      totalPages: 18
    }
  },

  // --- Files inside folder-daniel-2 (Ambiental) ---
  {
    id: 'file-daniel-env-1',
    name: 'Estudio_Impacto_Ambiental_Semidetallado.pdf',
    isFolder: false,
    parentId: 'folder-daniel-2',
    clientId: 'user-client-daniel',
    category: 'Estudios Ambientales',
    path: '/02. Estudios Ambientales (IGA - DIA)/Estudio_Impacto_Ambiental_Semidetallado.pdf',
    sizeBytes: 28400000, // 28.4 MB
    fileType: 'pdf',
    extension: 'pdf',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-06-14 09:10',
    updatedAt: '2026-06-14 09:10',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false,
    description: 'Instrumento de Gestión Ambiental (IGAFOM) fase correctiva y preventiva.',
    fileContentSimulated: {
      previewType: 'pdf',
      summary: 'Expediente IGAFOM aprobado con Resolución Directoral Regional de Energía y Minas.',
      totalPages: 124
    }
  },
  {
    id: 'file-daniel-pdf-mooc',
    name: 'MOOC IA_FASCÍCULO_Tema 1.pdf',
    isFolder: false,
    parentId: 'folder-daniel-2',
    clientId: 'user-client-daniel',
    category: 'Estudios Ambientales',
    path: '/02. Estudios Ambientales (IGA - DIA)/MOOC IA_FASCÍCULO_Tema 1.pdf',
    sizeBytes: 8192000, // 8.2 MB
    fileType: 'pdf',
    extension: 'pdf',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-07-02 16:20',
    updatedAt: '2026-07-02 16:20',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false,
    description: 'Manual de referencia técnica y fascículo ambiental.',
    fileContentSimulated: {
      previewType: 'pdf',
      summary: 'Fascículo de capacitación técnica ambiental.',
      totalPages: 32
    }
  },

  // --- Files inside folder-daniel-4 (Producción y Excel) ---
  {
    id: 'file-daniel-xlsx-1',
    name: 'Balance_Metalurgico_Ensayos_Quimicos.xlsx',
    isFolder: false,
    parentId: 'folder-daniel-4',
    clientId: 'user-client-daniel',
    category: 'Costos',
    path: '/04. Informes de Producción y Ensayos Químicos/Balance_Metalurgico_Ensayos_Quimicos.xlsx',
    sizeBytes: 1850000, // 1.85 MB
    fileType: 'excel',
    extension: 'xlsx',
    uploadedByUserId: 'user-colab-1',
    uploadedByRole: 'collaborator',
    uploadedByName: 'Carlos Paredes',
    createdAt: '2026-09-01 15:30',
    updatedAt: '2026-10-15 18:20',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false,
    description: 'Leyes de cabeza de Au (g/t), recuperación gravimétrica y reactivos.',
    fileContentSimulated: {
      previewType: 'spreadsheet',
      summary: 'Control de ensaye al fuego por laboratorios certificados.',
      sheetHeaders: ['Lote #', 'Fecha', 'Muestra', 'Ley Au (g/t)', 'Ley Ag (oz/t)', 'Humedad %', 'Recuperación %'],
      sheetRows: [
        ['LT-01', '12/10/2026', 'Veta Esperanza', '18.42', '2.15', '4.2%', '91.5%'],
        ['LT-02', '14/10/2026', 'Clavo Central', '24.10', '3.40', '3.8%', '93.2%'],
        ['LT-03', '17/10/2026', 'Desmonte Nivel 2', '2.10', '0.40', '5.1%', '74.0%'],
        ['LT-04', '19/10/2026', 'Veta de Cuarzo', '31.85', '4.80', '3.5%', '95.1%']
      ]
    }
  },

  // --- Files inside folder-daniel-5 (Subidos por Daniel) ---
  {
    id: 'file-daniel-video-1',
    name: 'Inspeccion_Campo_Dron_Sector_Principal.mp4',
    isFolder: false,
    parentId: 'folder-daniel-5',
    clientId: 'user-client-daniel',
    category: 'Multimedia',
    path: '/05. Documentos Aportados por el Minero/Inspeccion_Campo_Dron_Sector_Principal.mp4',
    sizeBytes: 84000000, // 84 MB
    fileType: 'video',
    extension: 'mp4',
    uploadedByUserId: 'user-client-daniel',
    uploadedByRole: 'client',
    uploadedByName: 'Daniel Peña',
    createdAt: '2026-08-10 17:15',
    updatedAt: '2026-08-10 17:15',
    isClientReadOnly: false,
    isClientUploaded: true,
    inTrash: false,
    description: 'Video aéreo en alta resolución del campamento y boca de túnel.',
    fileContentSimulated: {
      previewType: 'video',
      summary: 'Inspección aérea grabada con Dron DJI Mavic 3 Enterprise.',
      duration: '04:22 min'
    }
  },
  {
    id: 'file-daniel-zip-1',
    name: 'Expediente_Tecnico_Completo_Comprimido.zip',
    isFolder: false,
    parentId: 'folder-daniel-5',
    clientId: 'user-client-daniel',
    category: 'General',
    path: '/05. Documentos Aportados por el Minero/Expediente_Tecnico_Completo_Comprimido.zip',
    sizeBytes: 45000000, // 45 MB
    fileType: 'zip',
    extension: 'zip',
    uploadedByUserId: 'user-client-daniel',
    uploadedByRole: 'client',
    uploadedByName: 'Daniel Peña',
    createdAt: '2026-09-20 18:00',
    updatedAt: '2026-09-20 18:00',
    isClientReadOnly: false,
    isClientUploaded: true,
    inTrash: false,
    description: 'Compilado comprimido de certificados de análisis y facturas de insumos.',
    fileContentSimulated: {
      previewType: 'archive',
      summary: 'Archivo ZIP con 14 documentos anexos escaneados.'
    }
  },

  // --- Folders and Files for Corporación Minera El Dorado (Jurídica) ---
  {
    id: 'folder-eldorado-1',
    name: 'Estudios Geológicos y Sondajes Diamantinos',
    isFolder: true,
    parentId: null,
    clientId: 'user-client-empresa',
    category: 'Planos',
    path: '/Estudios Geológicos y Sondajes Diamantinos',
    sizeBytes: 0,
    fileType: 'folder',
    extension: '',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-02-01 10:00',
    updatedAt: '2026-10-11 12:00',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false
  },
  {
    id: 'file-eldorado-cad-1',
    name: 'Secciones_Geologicas_Sondajes_DDH.dwg',
    isFolder: false,
    parentId: 'folder-eldorado-1',
    clientId: 'user-client-empresa',
    category: 'Planos',
    path: '/Estudios Geológicos y Sondajes Diamantinos/Secciones_Geologicas_Sondajes_DDH.dwg',
    sizeBytes: 32000000,
    fileType: 'dwg',
    extension: 'dwg',
    uploadedByUserId: 'user-admin',
    uploadedByRole: 'admin',
    uploadedByName: 'Administrador Principal',
    createdAt: '2026-02-15 14:00',
    updatedAt: '2026-02-15 14:00',
    isClientReadOnly: true,
    isClientUploaded: false,
    inTrash: false,
    fileContentSimulated: {
      previewType: 'cad',
      summary: 'Secciones Geológicas Transversales. Pozos DDH-01 al DDH-24.',
      cadLayers: ['Litología', 'Alteración Hidrotermal', 'Estructuras', 'Pozos de Perforación']
    }
  }
];

export const INITIAL_TRASH_CASES: TrashCase[] = [
  {
    id: 'tc-initial-1',
    folderId: 'f-old-reinfo',
    clientId: 'user-client-daniel',
    clientName: 'Daniel Peña',
    title: 'Borradores de Planos Caducados 2024',
    fileCount: 4,
    totalSize: 45200000,
    deletedAt: '12/10/2026 14:22',
    deletedBy: 'admin'
  }
];

export const INITIAL_TRASH_FILES: TrashFile[] = [
  {
    id: 'tf-initial-1',
    fileId: 'file-temp-old-1',
    name: 'Croquis_Antiguo_Sector_Bocamina.pdf',
    fileType: 'pdf',
    sizeBytes: 3450000,
    clientId: 'user-client-daniel',
    clientName: 'Daniel Peña',
    casePath: '/Borradores de Planos Caducados 2024',
    deletedAt: '15/10/2026 09:12',
    deletedBy: 'admin'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '19/10/2026 15:42',
    username: 'admin',
    action: 'subida_archivo',
    detail: 'Plano_Topografico_Curvas_Nivel_2026.dwg (18.5 MB) en cliente Daniel Peña',
    ip: '190.236.42.10'
  },
  {
    id: 'log-2',
    timestamp: '19/10/2026 14:10',
    username: 'danielp',
    action: 'carpeta_creada',
    detail: 'Carpeta "05. Documentos Aportados por el Minero" creada',
    ip: '179.6.14.88'
  },
  {
    id: 'log-3',
    timestamp: '19/10/2026 12:05',
    username: 'danielp',
    action: 'login',
    detail: 'Inicio de sesión exitoso desde Puno',
    ip: '179.6.14.88'
  },
  {
    id: 'log-4',
    timestamp: '18/10/2026 17:00',
    username: 'cparedes',
    action: 'modificacion_archivo',
    detail: 'Actualización de Balance_Metalurgico_Ensayos_Quimicos.xlsx',
    ip: '190.119.55.23'
  },
  {
    id: 'log-5',
    timestamp: '15/10/2026 09:12',
    username: 'admin',
    action: 'papelera',
    detail: 'Archivo Croquis_Antiguo_Sector_Bocamina.pdf enviado a la papelera',
    ip: '190.236.42.10'
  }
];

export const INITIAL_BACKUPS: BackupRecord[] = [
  {
    id: 'bak-1',
    filename: 'respaldo_completo_20261019_040000.zip',
    date: '19/10/2026 04:00',
    size: '182.4 MB',
    sizeBytes: 191260200,
    fileCount: 42,
    checksum: 'sha256:4a8b9e112fa09c8e23b',
    status: 'verified'
  },
  {
    id: 'bak-2',
    filename: 'respaldo_semanal_20261012_040000.zip',
    date: '12/10/2026 04:00',
    size: '176.8 MB',
    sizeBytes: 185388000,
    fileCount: 39,
    checksum: 'sha256:7c9d012489eab3182fc',
    status: 'verified'
  }
];
