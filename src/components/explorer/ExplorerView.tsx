import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp, ViewMode, SortField, SortOrder } from '../../context/AppContext';
import { FileItem, FileType } from '../../types';
import { formatBytes, formatDate } from '../../utils/validation';
import { FilePreviewModal } from './FilePreviewModal';
import { NewFolderModal } from './NewFolderModal';
import { UploadFileModal } from './UploadFileModal';
import { RenameModal } from './RenameModal';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  Edit2,
  Search,
  ArrowUp,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  Table as TableIcon,
  Compass,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  Archive,
  File,
  Lock,
  CheckCircle,
  ArrowUpDown,
  AlertTriangle,
  Building2,
  User as UserIcon,
  Check
} from 'lucide-react';

export const ExplorerView: React.FC = () => {
  const {
    currentUser,
    users,
    allClients,
    files,
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
    moveToTrash
  } = useApp();

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTargetItem, setRenameTargetItem] = useState<FileItem | null>(null);

  // Trash confirmation modal state
  const [trashConfirmItem, setTrashConfirmItem] = useState<FileItem | null>(null);

  // Searchable Client dropdown state (for Admin & Collaborator)
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Close client dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Collaborator role check: only view, search by user, cannot create or upload
  const isCollaborator = currentUser.role === 'collaborator';

  // Available clients list for selector
  const availableClients = currentUser.role === 'client'
    ? users.filter(u => u.id === currentUser.id)
    : allClients.length > 0 ? allClients : users.filter(u => u.role === 'client');

  // Filtered clients in searchable dropdown by name, surname, or RUC
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return availableClients;
    const q = clientSearchTerm.toLowerCase().trim();
    return availableClients.filter(c => {
      const fullName = `${c.firstName} ${c.lastNamePaterno} ${c.lastNameMaterno}`.toLowerCase();
      const bName = (c.businessName || '').toLowerCase();
      const ruc = (c.ruc || '').toLowerCase();
      const username = c.username.toLowerCase();
      const doc = c.docNumber.toLowerCase();
      return fullName.includes(q) || bName.includes(q) || ruc.includes(q) || username.includes(q) || doc.includes(q);
    });
  }, [availableClients, clientSearchTerm]);

  // Selected client
  const effectiveClientId = currentClientId || (availableClients[0]?.id || currentUser.id);
  const client = users.find(u => u.id === effectiveClientId) || currentUser;

  const currentFolder = files.find(f => f.id === currentFolderId);

  // Filter items in current view
  const currentItems = useMemo(() => {
    let filtered = files.filter(f => {
      if (f.inTrash) return false;
      if (f.clientId !== effectiveClientId) return false;
      return f.parentId === currentFolderId;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = files.filter(f => {
        if (f.inTrash) return false;
        if (f.clientId !== effectiveClientId) return false;
        return f.name.toLowerCase().includes(q) || (f.category && f.category.toLowerCase().includes(q));
      });
    }

    return filtered.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [files, effectiveClientId, currentFolderId, searchQuery, sortField, sortOrder]);

  // Selected item object (if single)
  const selectedItem = useMemo(() => {
    if (selectedItemIds.length === 1) {
      return files.find(f => f.id === selectedItemIds[0]) || null;
    }
    return null;
  }, [selectedItemIds, files]);

  // Handle open item (folder navigation or preview)
  const handleOpenItem = (item: FileItem) => {
    if (item.isFolder) {
      navigateToFolder(item.id);
    } else {
      setPreviewFile(item);
      setIsPreviewOpen(true);
    }
  };

  const handleDownload = (item: FileItem) => {
    const element = document.createElement('a');
    const fileContent = `Administrador de archivos\nArchivo: ${item.name}\nTipo: ${item.fileType}\nTamaño: ${formatBytes(item.sizeBytes)}\nFecha: ${item.createdAt}\nRuta: ${item.path}\n\n[Documento certificado del sistema]`;
    const fileBlob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = item.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setActionSuccess(`Descargando archivo: ${item.name}`);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  // Open trash confirmation modal
  const promptMoveToTrash = (item: FileItem) => {
    if (isCollaborator) {
      setActionError('El rol colaborador no tiene permisos para eliminar archivos.');
      setTimeout(() => setActionError(''), 4000);
      return;
    }
    if (currentUser.role === 'client' && item.isClientReadOnly) {
      setActionError('No puede eliminar este elemento: ha sido compartido como Solo Lectura por el Administrador.');
      setTimeout(() => setActionError(''), 4000);
      return;
    }
    setTrashConfirmItem(item);
  };

  // Confirm moving to trash
  const handleConfirmMoveToTrash = () => {
    if (!trashConfirmItem) return;
    const res = moveToTrash(trashConfirmItem.id);
    if (!res.success) {
      setActionError(res.message || 'No se pudo mover el elemento a la papelera.');
      setTimeout(() => setActionError(''), 4000);
    } else {
      setActionSuccess(`"${trashConfirmItem.name}" ha sido enviado a la papelera.`);
      setTimeout(() => setActionSuccess(''), 3000);
      setSelectedItemIds([]);
    }
    setTrashConfirmItem(null);
  };

  const handleStartRename = (itemToRename?: FileItem) => {
    if (isCollaborator) {
      setActionError('El rol colaborador no tiene permisos para renombrar archivos.');
      setTimeout(() => setActionError(''), 4000);
      return;
    }

    const target = itemToRename || selectedItem;
    if (!target) {
      setActionError('Por favor seleccione un archivo o carpeta para renombrar.');
      setTimeout(() => setActionError(''), 3000);
      return;
    }

    if (currentUser.role === 'client' && target.isClientReadOnly) {
      setActionError('No puede renombrar este archivo: ha sido compartido como Solo Lectura por el Administrador.');
      setTimeout(() => setActionError(''), 4000);
      return;
    }

    setRenameTargetItem(target);
    setIsRenameModalOpen(true);
  };

  // Render file type icon
  const getFileIcon = (fileType: FileType, isFolder: boolean) => {
    if (isFolder) {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-100" />;
    }
    switch (fileType) {
      case 'dwg':
        return <Compass className="w-5 h-5 text-amber-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'zip':
        return <Archive className="w-5 h-5 text-orange-600" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  // Breadcrumbs path items
  const breadcrumbs = useMemo(() => {
    const list: { label: string; onClick: () => void }[] = [];

    if (client) {
      list.push({
        label: client.businessName || `${client.firstName} ${client.lastNamePaterno}`,
        onClick: () => setCurrentLocation(client.id, null)
      });
    }

    if (currentFolder) {
      list.push({
        label: currentFolder.name,
        onClick: () => {}
      });
    }

    return list;
  }, [client, currentFolder, setCurrentLocation]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-100px)] overflow-hidden bg-white w-full">
      {/* Top Client Bar with SEARCHABLE CLIENT COMBBOX for Admin & Collaborator */}
      <div className="bg-[#102a43] text-white px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-[#0c2237]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 relative" ref={clientDropdownRef}>
            <span className="text-xs font-semibold text-blue-100/90">Cliente / Titular:</span>

            {currentUser.role !== 'client' ? (
              <div className="relative">
                {/* Searchable Combobox Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsClientSearchOpen(!isClientSearchOpen)}
                  className="flex items-center gap-2 bg-[#1b4369] hover:bg-[#245482] border border-[#2b6194] text-white rounded-md px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-blue-300" />
                  <span className="truncate max-w-[220px]">
                    {client.businessName || `${client.firstName} ${client.lastNamePaterno}`}
                  </span>
                  {client.ruc && (
                    <span className="px-1.5 py-0.2 bg-[#0e2a47] text-blue-200 rounded font-mono text-[10px] border border-[#275a8c]">
                      RUC: {client.ruc}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-blue-200 ml-1" />
                </button>

                {/* Dropdown Popover with Instant Search by Name, Surname, or RUC */}
                {isClientSearchOpen && (
                  <div className="absolute left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-[#d9e2ec] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-[#102a43]">
                    <div className="p-3 bg-[#f0f4f8] border-b border-[#d9e2ec]">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#627d98]" />
                        <input
                          type="text"
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          placeholder="Buscar por nombre, apellidos o número de RUC..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#cbd5e1] rounded-md bg-white focus:ring-2 focus:ring-[#133e66] outline-none text-[#102a43] font-medium"
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-[#627d98] mt-1.5">
                        Seleccione el cliente para visualizar sus expedientes técnicos.
                      </p>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-[#edf2f7]">
                      {filteredClients.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#627d98]">
                          No se encontraron clientes con el criterio "{clientSearchTerm}".
                        </div>
                      ) : (
                        filteredClients.map((c) => {
                          const isSelected = c.id === effectiveClientId;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCurrentLocation(c.id, null);
                                setIsClientSearchOpen(false);
                                setClientSearchTerm('');
                              }}
                              className={`w-full p-2.5 text-left text-xs hover:bg-[#f0f4f8] transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected ? 'bg-[#d9e2ec]/60 font-bold' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  c.personType === 'juridica' ? 'bg-amber-100 text-amber-800' : 'bg-[#d9e2ec] text-[#102a43]'
                                }`}>
                                  {c.personType === 'juridica' ? <Building2 className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                </div>
                                <div className="truncate">
                                  <p className="text-[#102a43] font-semibold truncate">
                                    {c.businessName || `${c.firstName} ${c.lastNamePaterno} ${c.lastNameMaterno}`}
                                  </p>
                                  <p className="text-[11px] text-[#627d98] font-mono">
                                    RUC: <strong className="text-[#102a43]">{c.ruc || 'N/A'}</strong> · DNI: {c.docNumber}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5">
                                {isSelected && (
                                  <span className="p-1 rounded-full bg-[#133e66] text-white">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="px-3 py-1 bg-[#194066] rounded-md text-xs font-bold text-white border border-[#275a8c]">
                {currentUser.businessName || `${currentUser.firstName} ${currentUser.lastNamePaterno}`}
              </span>
            )}
          </div>
        </div>

        {/* Quota overview for this client */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-blue-100/80">
            Cuota del Cliente:{' '}
            <strong className="text-white tabular-nums">{formatBytes(client.usedStorageBytes || 0)}</strong> de{' '}
            <strong className="text-white tabular-nums">{formatBytes(client.storageQuotaBytes || 2 * 1024 * 1024 * 1024)}</strong>
          </span>
        </div>
      </div>

      {/* Action Ribbon Toolbar */}
      <div className="bg-white border-b border-[#d9e2ec] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* If collaborator: show badge that collaborator can only view/search files */}
          {isCollaborator ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d9e2ec] border border-[#bcccdc] text-[#102a43] text-xs font-semibold rounded-md shadow-2xs">
                <Eye className="w-3.5 h-3.5 text-[#133e66]" />
                <span>Modo Colaborador: Solo Consulta y Visualización de Archivos</span>
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsNewFolderOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] rounded-md border border-[#d9e2ec] shadow-2xs transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-amber-600" />
                <span>Nueva Carpeta</span>
              </button>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Subir Archivo</span>
              </button>

              <div className="h-5 w-px bg-[#d9e2ec] mx-1" />
            </>
          )}

          <button
            onClick={() => {
              if (selectedItem && !selectedItem.isFolder) {
                setPreviewFile(selectedItem);
                setIsPreviewOpen(true);
              }
            }}
            disabled={!selectedItem || selectedItem.isFolder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#f0f4f8] hover:bg-[#e2e8f0] disabled:opacity-40 disabled:hover:bg-[#f0f4f8] text-[#102a43] rounded-md border border-[#d9e2ec] transition-colors cursor-pointer"
            title="Vista previa del documento o plano"
          >
            <Eye className="w-3.5 h-3.5 text-[#133e66]" />
            <span>Vista Previa</span>
          </button>

          <button
            onClick={() => {
              if (selectedItem && !selectedItem.isFolder) {
                handleDownload(selectedItem);
              }
            }}
            disabled={!selectedItem || selectedItem.isFolder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#133e66] hover:bg-[#0e2e4d] disabled:opacity-40 disabled:hover:bg-[#133e66] text-white rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>

          {/* Admin and Client only action buttons: Renombrar & Mover a Papelera */}
          {!isCollaborator && (
            <>
              <button
                onClick={() => handleStartRename()}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  selectedItem
                    ? 'bg-[#d9e2ec] hover:bg-[#bcccdc] text-[#102a43] border border-[#bcccdc] shadow-2xs cursor-pointer'
                    : 'bg-[#f0f4f8] text-[#9fb3c8] border border-[#d9e2ec]'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5 text-[#102a43]" />
                <span>Renombrar</span>
              </button>

              <button
                onClick={() => {
                  if (selectedItem) {
                    promptMoveToTrash(selectedItem);
                  } else {
                    setActionError('Por favor seleccione un archivo o carpeta para mover a la papelera.');
                    setTimeout(() => setActionError(''), 3000);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  selectedItem
                    ? 'bg-[#9e1c1c] hover:bg-[#7f1d1d] text-white shadow-2xs cursor-pointer'
                    : 'bg-[#f0f4f8] text-[#9fb3c8] border border-[#d9e2ec]'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Mover a Papelera</span>
              </button>
            </>
          )}
        </div>

        {/* Right View & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Sorting Field */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent border-none outline-none text-xs text-slate-700 font-medium"
            >
              <option value="name">Nombre</option>
              <option value="updatedAt">Fecha de Modificación</option>
              <option value="sizeBytes">Tamaño</option>
              <option value="fileType">Tipo</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-1 text-[11px] font-mono hover:bg-slate-100 rounded cursor-pointer"
              title="Cambiar orden"
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>

          {/* View Mode Toggle: Details, Grid, List */}
          <div className="flex items-center gap-0.5 bg-slate-200/80 p-0.5 rounded-md">
            <button
              onClick={() => setViewMode('details')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'details' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista de Detalles (Tabla)"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista de Cuadrícula (Iconos Grandes)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista de Lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Address Bar & Breadcrumbs Path */}
      <div className="px-6 py-2.5 border-b border-slate-200 flex items-center gap-3 bg-white">
        <button
          onClick={navigateUp}
          disabled={!currentFolderId}
          className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition-colors cursor-pointer"
          title="Subir un nivel de carpeta"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        {/* Breadcrumb Path Box */}
        <div className="flex-1 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-600 overflow-x-auto">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <button
                onClick={crumb.onClick}
                className="hover:text-blue-600 font-medium whitespace-nowrap transition-colors cursor-pointer"
              >
                {crumb.label}
              </button>
              {idx < breadcrumbs.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-72 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar archivos o carpetas..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Feedback alerts */}
      {actionError && (
        <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700 cursor-pointer">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Files View Canvas */}
      <div className="flex-1 overflow-auto p-6">
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-700 text-sm">
              Esta carpeta está vacía
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {isCollaborator
                ? 'Modo Colaborador: Solo consulta. No hay archivos registrados en esta ubicación.'
                : currentUser.role === 'client'
                ? 'Puede crear nuevas carpetas o subir archivos utilizando los botones superiores.'
                : 'Cargue planos, memorias o estudios para este cliente.'}
            </p>
            {!isCollaborator && (
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setIsNewFolderOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-slate-700 cursor-pointer"
                >
                  + Crear Carpeta
                </button>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer"
                >
                  ⬆ Subir Archivo
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'details' ? (
          /* DETAILS VIEW */
          <div className="border border-[#d9e2ec] rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
                  <th className="py-3 px-3.5 w-10"></th>
                  <th className="py-3 px-3.5">Nombre</th>
                  <th className="py-3 px-3.5">Fecha de Modificación</th>
                  <th className="py-3 px-3.5">Tipo</th>
                  <th className="py-3 px-3.5 text-right">Tamaño</th>
                  <th className="py-3 px-3.5">Permiso / Origen</th>
                  <th className="py-3 px-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {currentItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemIds([item.id])}
                      onDoubleClick={() => handleOpenItem(item)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#d9e2ec]/40 font-medium' : 'hover:bg-[#f8fafc]'
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        {getFileIcon(item.fileType, item.isFolder)}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-md" title={item.name}>
                            {item.name}
                          </span>
                          {item.isFolder && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({files.filter(f => f.parentId === item.id && !f.inTrash).length} elem.)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px] tabular-nums">
                        {formatDate(item.updatedAt, true)}
                      </td>
                      <td className="py-2 px-3 text-slate-600 capitalize">
                        {item.isFolder ? 'Carpeta de archivos' : (
                          item.fileType === 'dwg' ? 'Plano CAD / DWG' :
                          item.fileType === 'pdf' ? 'Documento PDF' :
                          item.fileType === 'excel' ? 'Hoja de Cálculo' :
                          item.fileType === 'video' ? 'Video' :
                          item.fileType === 'image' ? 'Imagen' :
                          item.fileType === 'zip' ? 'Archivo ZIP' : 'Archivo'
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-700 font-mono text-[11px] tabular-nums">
                        {item.isFolder ? '—' : formatBytes(item.sizeBytes)}
                      </td>
                      <td className="py-2 px-3">
                        {isCollaborator ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <Eye className="w-3 h-3" />
                            <span>Visualización (Colaborador)</span>
                          </span>
                        ) : item.isClientReadOnly ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Lock className="w-3 h-3" />
                            <span>Solo Lectura (Admin)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>Editable (Cliente)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                          {!item.isFolder && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFile(item);
                                  setIsPreviewOpen(true);
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                                title="Ver vista previa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(item);
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                                title="Descargar"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {!isCollaborator && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRename(item);
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                                title="Renombrar elemento"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  promptMoveToTrash(item);
                                }}
                                className="p-1 hover:bg-rose-100 rounded text-rose-600 cursor-pointer"
                                title="Mover a papelera"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {currentItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemIds([item.id])}
                  onDoubleClick={() => handleOpenItem(item)}
                  className={`p-3 rounded-lg border text-center flex flex-col items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="p-3 mb-1">
                    {item.isFolder ? (
                      <Folder className="w-12 h-12 text-amber-500 fill-amber-100" />
                    ) : item.fileType === 'dwg' ? (
                      <Compass className="w-12 h-12 text-amber-600" />
                    ) : item.fileType === 'pdf' ? (
                      <FileText className="w-12 h-12 text-rose-600" />
                    ) : item.fileType === 'excel' ? (
                      <FileSpreadsheet className="w-12 h-12 text-emerald-600" />
                    ) : item.fileType === 'video' ? (
                      <Video className="w-12 h-12 text-purple-600" />
                    ) : item.fileType === 'image' ? (
                      <ImageIcon className="w-12 h-12 text-blue-500" />
                    ) : (
                      <Archive className="w-12 h-12 text-orange-500" />
                    )}
                  </div>

                  <div className="w-full">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums">
                      {item.isFolder ? 'Carpeta' : formatBytes(item.sizeBytes)}
                    </p>
                  </div>

                  <div className="mt-2 text-[10px]">
                    {isCollaborator ? (
                      <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" /> Consulta
                      </span>
                    ) : item.isClientReadOnly ? (
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Solo Lectura
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Editable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-1">
            {currentItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemIds([item.id])}
                  onDoubleClick={() => handleOpenItem(item)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-medium'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {getFileIcon(item.fileType, item.isFolder)}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 text-[11px] font-mono tabular-nums">
                    <span>{item.isFolder ? 'Carpeta' : formatBytes(item.sizeBytes)}</span>
                    <span>{formatDate(item.updatedAt, true)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-6 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>
          <span>{currentItems.length} elementos</span>
          {selectedItem && (
            <span> · 1 elemento seleccionado ({formatBytes(selectedItem.sizeBytes)})</span>
          )}
        </div>
        <div>
          <span>Cliente activo: {client.businessName || `${client.firstName} ${client.lastNamePaterno}`}</span>
        </div>
      </div>

      {/* Modals */}
      {isPreviewOpen && previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setIsPreviewOpen(false)}
          onDownload={handleDownload}
        />
      )}

      {isNewFolderOpen && !isCollaborator && (
        <NewFolderModal
          isOpen={isNewFolderOpen}
          onClose={() => setIsNewFolderOpen(false)}
          onCreate={(name) => {
            const res = createFolder(name);
            if (!res.success) {
              setActionError(res.message || 'Error al crear carpeta');
              setTimeout(() => setActionError(''), 4000);
            } else {
              setActionSuccess(`Carpeta "${name}" creada exitosamente.`);
              setTimeout(() => setActionSuccess(''), 3000);
            }
          }}
        />
      )}

      {isUploadOpen && !isCollaborator && (
        <UploadFileModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUpload={(data) => {
            const res = uploadFile(data);
            if (res.success) {
              setActionSuccess(`Archivo "${data.name}" cargado exitosamente.`);
              setTimeout(() => setActionSuccess(''), 3000);
            }
            return res;
          }}
        />
      )}

      {/* Dedicated Rename Modal */}
      {isRenameModalOpen && renameTargetItem && !isCollaborator && (
        <RenameModal
          isOpen={isRenameModalOpen}
          item={renameTargetItem}
          onClose={() => {
            setIsRenameModalOpen(false);
            setRenameTargetItem(null);
          }}
          onRename={(itemId, newName) => {
            const res = renameItem(itemId, newName);
            if (res.success) {
              setActionSuccess(`Elemento renombrado a "${newName}".`);
              setTimeout(() => setActionSuccess(''), 3000);
            }
            return res;
          }}
        />
      )}

      {/* Trash Confirmation Modal */}
      {trashConfirmItem && !isCollaborator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Enviar a la Papelera</h3>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    ¿Está seguro de enviar «{trashConfirmItem.name}» a la papelera?
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {trashConfirmItem.isFolder
                      ? 'Se moverá la carpeta y todos los archivos que contiene. Podrá ser restaurada posteriormente desde la papelera.'
                      : 'El archivo dejará de estar visible en esta carpeta y se moverá a la papelera.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTrashConfirmItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  No, Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMoveToTrash}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors shadow-2xs cursor-pointer"
                >
                  Sí, Enviar a Papelera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
