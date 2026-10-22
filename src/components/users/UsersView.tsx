import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentType, PersonType, User, UserHistoryEvent, UserRole, UserStatus } from '../../types';
import {
  checkUserAccessStatus,
  formatBytes,
  formatDate,
  generateAutoUsername,
  generateSecurePassword,
  lookupRucData,
  lookupRucDataAsync,
  validateDateRange,
  validateDocumentNumber,
  validateRuc
} from '../../utils/validation';
import {
  UserPlus,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  HardDrive,
  Building2,
  User as UserIcon,
  Sparkles,
  Key,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Edit,
  X,
  SearchCheck,
  History,
  FileText,
  Loader2
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const {
    currentUser,
    users,
    addUser,
    updateUser,
    toggleUserStatus,
    extendUserValidity
  } = useApp();

  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditingUser, setIsEditingUser] = useState<User | null>(null);
  const [credentialsModalUser, setCredentialsModalUser] = useState<User | null>(null);

  // Form state
  // REQUIREMENT: RUC must be the FIRST data entered!
  const [rucNumber, setRucNumber] = useState('');
  const [rucAutoMessage, setRucAutoMessage] = useState('');
  const [isManualFillMode, setIsManualFillMode] = useState(false);

  const [personType, setPersonType] = useState<PersonType>('natural');
  const [firstName, setFirstName] = useState('');
  const [lastNamePaterno, setLastNamePaterno] = useState('');
  const [lastNameMaterno, setLastNameMaterno] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [status, setStatus] = useState<UserStatus>('active');
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });

  // Storage quota in MB - allows manual typing of numbers smoothly!
  const [quotaMBInput, setQuotaMBInput] = useState<string>('2048');

  const [customUsername, setCustomUsername] = useState('');
  const [isManualUsername, setIsManualUsername] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Form error states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState('');

  // Automatic username generation: 1st letter of name + first surname
  useEffect(() => {
    if (!isManualUsername && firstName && lastNamePaterno) {
      const autoUser = generateAutoUsername(
        firstName,
        lastNamePaterno,
        users,
        isEditingUser ? isEditingUser.id : undefined
      );
      setCustomUsername(autoUser);
    }
  }, [firstName, lastNamePaterno, isManualUsername, users, isEditingUser]);

  const [isQueryingSunat, setIsQueryingSunat] = useState(false);

  // Handle RUC entry & auto-fill logic
  const handleRucChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    setRucNumber(clean);

    // If reaches 11 digits and NOT in manual mode, perform automatic lookup
    if (clean.length === 11 && !isManualFillMode) {
      applyRucAutofill(clean);
    } else {
      if (!isManualFillMode) {
        setRucAutoMessage('');
      }
    }
  };

  const applyRucAutofill = async (ruc: string) => {
    const clean = ruc.trim().replace(/\D/g, '');
    if (!clean || clean.length < 11) {
      setRucAutoMessage('Por favor ingrese los 11 dígitos del RUC para consultar SUNAT.');
      return;
    }

    setIsQueryingSunat(true);
    setRucAutoMessage('Consultando padrón oficial SUNAT / RENIEC en tiempo real...');

    try {
      const result = await lookupRucDataAsync(clean);
      if (result.found) {
        setPersonType(result.personType);
        setDocType(result.docType);
        setDocNumber(result.docNumber);
        if (result.firstName) setFirstName(result.firstName);
        if (result.lastNamePaterno) setLastNamePaterno(result.lastNamePaterno);
        if (result.lastNameMaterno) setLastNameMaterno(result.lastNameMaterno);
        if (result.businessName) {
          setBusinessName(result.businessName);
        }
        setRucAutoMessage(result.message || 'Datos de RUC validados y autocompletados con éxito.');

        // Generar automáticamente el nombre de usuario desde los datos validados
        if (!isManualUsername && result.firstName && result.lastNamePaterno) {
          const autoUser = generateAutoUsername(
            result.firstName,
            result.lastNamePaterno,
            users,
            isEditingUser ? isEditingUser.id : undefined
          );
          setCustomUsername(autoUser);
        }
      } else {
        if (clean.startsWith('10')) {
          setPersonType('natural');
          setDocType('DNI');
          setDocNumber(clean.substring(2, 10));
          setRucAutoMessage(`RUC 10 detectado. DNI ${clean.substring(2, 10)} extraído automáticamente. Complete los nombres.`);
        } else if (clean.startsWith('20')) {
          setPersonType('juridica');
          setRucAutoMessage('RUC 20 detectado como Persona Jurídica. Complete la Razón Social y datos del Representante Legal.');
        } else {
          setRucAutoMessage(result.message || 'RUC no localizado en línea. Puede ingresar los datos manualmente.');
        }
      }
    } catch {
      setRucAutoMessage('Servicio SUNAT temporalmente no disponible. Puede completar los datos manualmente.');
    } finally {
      setIsQueryingSunat(false);
    }
  };

  const resetForm = () => {
    setRucNumber('');
    setRucAutoMessage('');
    setIsManualFillMode(false);
    setPersonType('natural');
    setFirstName('');
    setLastNamePaterno('');
    setLastNameMaterno('');
    setBusinessName('');
    setDocType('DNI');
    setDocNumber('');
    setEmail('');
    setPhone('');
    setRole('client');
    setStatus('active');
    setValidFrom(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setValidUntil(d.toISOString().split('T')[0]);
    setQuotaMBInput('2048'); // 2048 MB = 2 GB default
    setCustomUsername('');
    setIsManualUsername(false);
    setGeneratedPassword(generateSecurePassword());
    setShowPassword(true);
    setFormErrors({});
  };

  const openCreateModal = () => {
    setIsEditingUser(null);
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setIsEditingUser(u);
    setRucNumber(u.ruc || '');
    setRucAutoMessage('');
    setIsManualFillMode(true);
    setPersonType(u.personType);
    setFirstName(u.firstName);
    setLastNamePaterno(u.lastNamePaterno);
    setLastNameMaterno(u.lastNameMaterno);
    setBusinessName(u.businessName || '');
    setDocType(u.docType);
    setDocNumber(u.docNumber);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role);
    setStatus(u.status);
    setValidFrom(u.validFrom);
    setValidUntil(u.validUntil);
    setQuotaMBInput(String(Math.round(u.storageQuotaBytes / (1024 * 1024))));
    setCustomUsername(u.username);
    setIsManualUsername(true);
    setGeneratedPassword(u.password || generateSecurePassword());
    setShowPassword(true);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate RUC (first data)
    if (!rucNumber.trim()) {
      errors.rucNumber = 'El número de RUC es obligatorio.';
    } else {
      const rucVal = validateRuc(rucNumber, personType, isManualFillMode);
      if (!rucVal.isValid) {
        errors.rucNumber = rucVal.message || 'RUC no válido.';
      }
    }

    // Validate names
    if (!firstName.trim()) errors.firstName = 'El nombre es obligatorio.';
    if (!lastNamePaterno.trim()) errors.lastNamePaterno = 'El apellido paterno es obligatorio.';
    if (personType === 'juridica' && !businessName.trim()) {
      errors.businessName = 'La Razón Social de la empresa es requerida.';
    }

    // Validate Document (DNI or CE)
    const docValidation = validateDocumentNumber(docType, docNumber, personType);
    if (!docValidation.isValid) {
      errors.docNumber = docValidation.message || 'Documento no válido.';
    }

    // Validate Dates
    const dateValidation = validateDateRange(validFrom, validUntil);
    if (!dateValidation.isValid) {
      errors.dates = dateValidation.message || 'Rango de fechas inválido.';
    }

    // Validate Username
    const finalUsername = customUsername.trim().toLowerCase();
    if (!finalUsername) {
      errors.username = 'El nombre de usuario es obligatorio.';
    } else {
      const duplicate = users.find(
        u => u.username.toLowerCase() === finalUsername && (!isEditingUser || u.id !== isEditingUser.id)
      );
      if (duplicate) {
        errors.username = `El usuario "${finalUsername}" ya existe. Modifíquelo o agregue un sufijo.`;
      }
    }

    // Storage Quota validation (in MB)
    const numericQuotaMB = parseInt(quotaMBInput, 10);
    if (isNaN(numericQuotaMB) || numericQuotaMB < 10) {
      errors.quota = 'La cuota de almacenamiento mínima es de 10 MB.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const quotaBytes = numericQuotaMB * 1024 * 1024;
    const finalPassword = generatedPassword.trim() || generateSecurePassword();

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestampFormatted = `${day}/${month}/${year} ${hours}:${minutes}`;

    if (isEditingUser) {
      // Build history events for tracking changes (e.g. natural to juridica, quota, data changes)
      const existingHistory: UserHistoryEvent[] = isEditingUser.history || [];
      const newEvents: UserHistoryEvent[] = [];

      // Check if person type changed (e.g. natural to juridica)
      if (isEditingUser.personType !== personType) {
        newEvents.push({
          id: `h-${Date.now()}-1`,
          timestamp: timestampFormatted,
          action: 'Cambio de Tipo de Persona',
          detail: `Actualizado de ${isEditingUser.personType === 'natural' ? 'Persona Natural' : 'Persona Jurídica'} a ${personType === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}${personType === 'juridica' ? ` (Razón Social: "${businessName}")` : ''}.`,
          author: currentUser.username,
          tag: 'tipo_persona'
        });
      }

      // Check if quota changed
      if (isEditingUser.storageQuotaBytes !== quotaBytes) {
        newEvents.push({
          id: `h-${Date.now()}-2`,
          timestamp: timestampFormatted,
          action: 'Ajuste de Cuota de Almacenamiento',
          detail: `Cuota modificada de ${Math.round(isEditingUser.storageQuotaBytes / (1024 * 1024))} MB a ${numericQuotaMB} MB (${formatBytes(quotaBytes)}).`,
          author: currentUser.username,
          tag: 'cuota'
        });
      }

      // Check if RUC or documents changed
      if (isEditingUser.ruc !== rucNumber.trim()) {
        newEvents.push({
          id: `h-${Date.now()}-3`,
          timestamp: timestampFormatted,
          action: 'Actualización de Número de RUC',
          detail: `RUC actualizado a ${rucNumber.trim()}.`,
          author: currentUser.username,
          tag: 'datos'
        });
      }

      // Check if validity changed
      if (isEditingUser.validUntil !== validUntil) {
        newEvents.push({
          id: `h-${Date.now()}-4`,
          timestamp: timestampFormatted,
          action: 'Modificación de Vigencia de Acceso',
          detail: `Nueva fecha de caducidad fijada para el ${validUntil}.`,
          author: currentUser.username,
          tag: 'vigencia'
        });
      }

      if (newEvents.length === 0) {
        newEvents.push({
          id: `h-${Date.now()}-5`,
          timestamp: timestampFormatted,
          action: 'Actualización General de Ficha',
          detail: 'Datos de contacto y perfil actualizados.',
          author: currentUser.username,
          tag: 'datos'
        });
      }

      updateUser(isEditingUser.id, {
        personType,
        firstName: firstName.trim(),
        lastNamePaterno: lastNamePaterno.trim(),
        lastNameMaterno: lastNameMaterno.trim(),
        businessName: personType === 'juridica' ? businessName.trim() : undefined,
        legalRepName: personType === 'juridica' ? firstName.trim() : undefined,
        legalRepLastNamePaterno: personType === 'juridica' ? lastNamePaterno.trim() : undefined,
        legalRepLastNameMaterno: personType === 'juridica' ? lastNameMaterno.trim() : undefined,
        legalRepDni: personType === 'juridica' ? docNumber.trim() : undefined,
        docType,
        docNumber: docNumber.trim(),
        ruc: rucNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        status,
        validFrom,
        validUntil,
        storageQuotaBytes: quotaBytes,
        username: finalUsername,
        password: finalPassword,
        history: [...newEvents, ...existingHistory]
      });
      setFormSuccess(`Usuario @${finalUsername} actualizado con éxito.`);
    } else {
      const initialHistory: UserHistoryEvent[] = [
        {
          id: `h-${Date.now()}-init`,
          timestamp: timestampFormatted,
          action: 'Registro Inicial en el Sistema',
          detail: `Usuario dado de alta como ${personType === 'juridica' ? `Persona Jurídica ("${businessName.trim()}")` : 'Persona Natural'} con RUC ${rucNumber.trim()} y ${docType} ${docNumber.trim()}. Cuota inicial: ${numericQuotaMB} MB.`,
          author: currentUser.username,
          tag: 'creacion'
        }
      ];

      addUser({
        username: finalUsername,
        password: finalPassword,
        personType,
        firstName: firstName.trim(),
        lastNamePaterno: lastNamePaterno.trim(),
        lastNameMaterno: lastNameMaterno.trim(),
        businessName: personType === 'juridica' ? businessName.trim() : undefined,
        legalRepName: personType === 'juridica' ? firstName.trim() : undefined,
        legalRepLastNamePaterno: personType === 'juridica' ? lastNamePaterno.trim() : undefined,
        legalRepLastNameMaterno: personType === 'juridica' ? lastNameMaterno.trim() : undefined,
        legalRepDni: personType === 'juridica' ? docNumber.trim() : undefined,
        docType,
        docNumber: docNumber.trim(),
        ruc: rucNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        status,
        validFrom,
        validUntil,
        storageQuotaBytes: quotaBytes,
        history: initialHistory
      });
      setFormSuccess(`Usuario @${finalUsername} registrado exitosamente.`);
    }

    setIsCreateModalOpen(false);
    resetForm();
    setTimeout(() => setFormSuccess(''), 4000);
  };

  const handleCopyCredentials = (u: User) => {
    const text = `Acceso al Administrador de archivos:\nUsuario: ${u.username}\nContraseña: ${u.password || 'Consultar admin'}\nEnlace: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const fullName = `${u.firstName} ${u.lastNamePaterno} ${u.lastNameMaterno} ${u.businessName || ''}`.toLowerCase();
      return (
        fullName.includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.docNumber.includes(q) ||
        (u.ruc && u.ruc.includes(q)) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#f0f4f8] min-h-[calc(100vh-100px)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#102a43] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#102a43]" />
            <span>Gestión de Mineros y Usuarios</span>
          </h2>
          <p className="text-xs text-[#486581] mt-0.5">
            Registro inicial mediante RUC con autocompletado y llenado manual, cuotas libres en MB y línea de historia.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md shadow-2xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Registrar Nuevo Usuario</span>
        </button>
      </div>

      {formSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{formSuccess}</span>
          <button onClick={() => setFormSuccess('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">✕</button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d9e2ec] shadow-2xs mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#627d98]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RUC, DNI, usuario o empresa..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#cbd5e1] rounded-md bg-white focus:ring-2 focus:ring-[#133e66] outline-none text-[#102a43]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#486581] font-medium">Rol:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#cbd5e1] rounded-md bg-white text-[#102a43] font-medium"
            >
              <option value="all">Todos los roles</option>
              <option value="client">Cliente (Minero)</option>
              <option value="collaborator">Colaborador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#486581] font-medium">Estado:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#cbd5e1] rounded-md bg-white text-[#102a43] font-medium"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
              <th className="py-3 px-4">Titular / Minero</th>
              <th className="py-3 px-3">Usuario y Contraseña</th>
              <th className="py-3 px-3">RUC</th>
              <th className="py-3 px-3">DNI / CE</th>
              <th className="py-3 px-3">Estado</th>
              <th className="py-3 px-3">Último Ingreso</th>
              <th className="py-3 px-3">Vigencia de Acceso</th>
              <th className="py-3 px-3">Cuota Asignada</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filteredUsers.map((u) => {
              const accessCheck = checkUserAccessStatus(u);
              const usedBytes = u.usedStorageBytes || 0;
              const quotaBytes = u.storageQuotaBytes || (2 * 1024 * 1024 * 1024);
              const percentUsed = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

              return (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Name & Type */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        u.personType === 'juridica' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.personType === 'juridica' ? <Building2 className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {u.businessName || `${u.firstName} ${u.lastNamePaterno} ${u.lastNameMaterno}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {u.personType === 'juridica' ? `Rep: ${u.firstName} ${u.lastNamePaterno}` : 'Persona Natural'}
                          {u.phone && ` · Tel: ${u.phone}`}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Username & Auto Password */}
                  <td className="py-3 px-3">
                    <div className="font-mono font-semibold text-slate-900 text-xs">
                      @{u.username}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500 capitalize">
                        {u.role === 'client' ? 'Cliente' : u.role === 'collaborator' ? 'Colaborador' : 'Administrador'}
                      </span>
                      <button
                        onClick={() => setCredentialsModalUser(u)}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Ver credenciales de acceso"
                      >
                        <Key className="w-3 h-3 text-amber-600" />
                      </button>
                    </div>
                  </td>

                  {/* RUC */}
                  <td className="py-3 px-3 font-mono text-blue-700 font-bold">
                    {u.ruc ? u.ruc : <span className="text-slate-400 italic">No registrado</span>}
                  </td>

                  {/* DNI / CE */}
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {u.docType}: {u.docNumber}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3 px-3">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Cambiar estado"
                    >
                      {u.status === 'active' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Inactivo</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Último Ingreso (formato dd/mm/aaaa hh:mm) */}
                  <td className="py-3 px-3">
                    <div className="text-[11px] font-mono tabular-nums text-slate-800 font-medium">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt, true) : (
                        <span className="text-slate-400 italic">Sin ingresos</span>
                      )}
                    </div>
                  </td>

                  {/* Validity Range (formato dd/mm/aaaa) */}
                  <td className="py-3 px-3">
                    <div className="text-[11px] font-mono tabular-nums text-slate-700 font-medium">
                      {formatDate(u.validFrom)} al {formatDate(u.validUntil)}
                    </div>
                    <div className="mt-0.5">
                      {u.role === 'admin' ? (
                        <span className="text-[10px] text-slate-400">Acceso Maestro</span>
                      ) : !accessCheck.isAllowed ? (
                        <span className="text-[10px] font-semibold text-rose-600">
                          Vencido
                        </span>
                      ) : accessCheck.daysRemaining <= 7 ? (
                        <span className="text-[10px] font-semibold text-amber-600">
                          Vence en {accessCheck.daysRemaining} días
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600">
                          Vigente ({accessCheck.daysRemaining} días)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Quota in MB/GB */}
                  <td className="py-3 px-3">
                    <div className="w-28">
                      <div className="flex justify-between text-[10px] font-mono text-slate-600 mb-0.5">
                        <span>{formatBytes(usedBytes)}</span>
                        <span>{Math.round(quotaBytes / (1024 * 1024))} MB</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentUsed >= 90
                              ? 'bg-rose-500'
                              : percentUsed >= 75
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, percentUsed)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-3 py-1 bg-[#d9e2ec] hover:bg-[#bcccdc] text-[#102a43] rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Editar parámetros y ver historia"
                      >
                        <Edit className="w-3 h-3 text-[#102a43]" />
                        <span>Editar</span>
                      </button>

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => extendUserValidity(u.id, 30)}
                          className="px-3 py-1 bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                          title="Extender vigencia +30 días"
                        >
                          +30d
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#d9e2ec] w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[#103b66] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {isEditingUser ? `Editar Usuario: @${isEditingUser.username}` : 'Registrar Nuevo Usuario / Minero'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4">
              {/* REQUIREMENT: FIRST DATA ENTERED IS RUC NUMBER! */}
              <div className="p-4 bg-blue-50/70 border-2 border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <SearchCheck className="w-4 h-4 text-blue-700" />
                    <span>Número de RUC (Primer Dato Obligatorio) *</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-semibold bg-white px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Autocompletado SUNAT / RENIEC</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={rucNumber}
                      onChange={(e) => handleRucChange(e.target.value)}
                      placeholder="Ingrese los 11 dígitos del RUC (ej. 20549182931 o 10428910241)..."
                      className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                      autoFocus={!isEditingUser}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isQueryingSunat || !rucNumber.trim()}
                    onClick={() => applyRucAutofill(rucNumber)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {isQueryingSunat ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Consultando SUNAT...</span>
                      </>
                    ) : (
                      <>
                        <SearchCheck className="w-3.5 h-3.5" />
                        <span>Consultar SUNAT</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Feedback auto-fill message */}
                {rucAutoMessage && (
                  <div className={`text-[11px] px-3 py-2 rounded-md border flex items-center justify-between ${
                    isQueryingSunat
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : rucAutoMessage.includes('validado') || rucAutoMessage.includes('verificado') || rucAutoMessage.includes('éxito')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {isQueryingSunat && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />}
                      <span>{rucAutoMessage}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsManualFillMode(!isManualFillMode)}
                      className="text-blue-700 font-semibold hover:underline ml-2 cursor-pointer shrink-0"
                    >
                      {isManualFillMode ? 'Activar modo automático' : 'Cambiar a manual'}
                    </button>
                  </div>
                )}

                {/* Opción de ingreso manual sin dígito verificador */}
                <div className="pt-1.5 border-t border-blue-200/60 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isManualFillMode}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsManualFillMode(checked);
                        if (checked) {
                          setRucAutoMessage('Modo manual activado: Se omitirá la validación del dígito verificador del RUC.');
                        } else {
                          setRucAutoMessage('');
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Ingreso manual de datos (Permite RUC de 11 dígitos sin validar dígito verificador de SUNAT)</span>
                  </label>
                </div>

                {formErrors.rucNumber && <p className="text-xs text-rose-600 font-medium">{formErrors.rucNumber}</p>}
              </div>

              {/* Persona Natural / Jurídica & Role */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Persona *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPersonType('natural');
                        setDocType('DNI');
                      }}
                      className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                        personType === 'natural'
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Persona Natural
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPersonType('juridica');
                        setDocType('RUC');
                      }}
                      className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                        personType === 'juridica'
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Persona Jurídica
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rol en el Sistema *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="client">Cliente (Minero) - Crea carpetas y sube archivos</option>
                    <option value="collaborator">Colaborador - Solo visualiza y consulta archivos</option>
                    <option value="admin">Administrador - Control total del sistema</option>
                  </select>
                </div>
              </div>

              {/* Business Name if Juridica */}
              {personType === 'juridica' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Razón Social de la Empresa * (Autocompletada o manual)
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="ej. Corporación Minera El Dorado S.A.C."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  {formErrors.businessName && <p className="text-xs text-rose-600 mt-1">{formErrors.businessName}</p>}
                </div>
              )}

              {/* Names: can be auto-filled or edited manually */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {personType === 'juridica' ? 'Nombre del Representante Legal *' : 'Nombre(s) *'}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={personType === 'juridica' ? 'ej. Manuel' : 'ej. Daniel'}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  {formErrors.firstName && <p className="text-xs text-rose-600 mt-1">{formErrors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {personType === 'juridica' ? 'Apellido Paterno del Representante Legal *' : 'Apellido Paterno *'}
                  </label>
                  <input
                    type="text"
                    value={lastNamePaterno}
                    onChange={(e) => setLastNamePaterno(e.target.value)}
                    placeholder={personType === 'juridica' ? 'ej. Rosales' : 'ej. Peña'}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  {formErrors.lastNamePaterno && <p className="text-xs text-rose-600 mt-1">{formErrors.lastNamePaterno}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {personType === 'juridica' ? 'Apellido Materno del Representante Legal' : 'Apellido Materno'}
                  </label>
                  <input
                    type="text"
                    value={lastNameMaterno}
                    onChange={(e) => setLastNameMaterno(e.target.value)}
                    placeholder={personType === 'juridica' ? 'ej. Campos' : 'ej. Quispe'}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Identity Document (DNI/CE) automatically derived or manual */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {personType === 'natural' ? 'Documento de Identidad (DNI / CE) *' : 'DNI del Representante Legal *'}
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                  >
                    <option value="DNI">DNI (8 dígitos)</option>
                    {personType === 'natural' && <option value="CE">CE (Carné Extranjería)</option>}
                  </select>
                </div>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value.replace(/\s+/g, ''))}
                  placeholder="ej. 42891024"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.docNumber && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.docNumber}</p>}
              </div>

              {/* Automatic Username generation */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      {personType === 'juridica'
                        ? 'Nombre de Usuario (Generado desde Representante Legal)'
                        : 'Nombre de Usuario (Automático: 1ra letra + Apellido)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManualUsername(!isManualUsername)}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                  >
                    {isManualUsername ? 'Restaurar automático' : 'Modificar'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      value={customUsername}
                      onChange={(e) => {
                        setCustomUsername(e.target.value);
                        setIsManualUsername(true);
                      }}
                      className="w-full pl-6 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>
                {formErrors.username && <p className="text-xs text-rose-600 mt-1">{formErrors.username}</p>}
              </div>

              {/* Automatic Password Generation Box */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-700" />
                    <span className="text-xs font-semibold text-blue-900">
                      Contraseña Generada Automáticamente por el Sistema
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeneratedPassword(generateSecurePassword())}
                    className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerar otra</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={generatedPassword}
                      onChange={(e) => setGeneratedPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold text-slate-900 border border-slate-300 rounded-md bg-white pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Contact info: Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="minero@dominio.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono Celular
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="951 234 567"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {/* Validity Dates: Desde cuándo, Hasta cuándo */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-900">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tiempo de Vigencia del Acceso</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Desde Cuándo (Inicio) *
                    </label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Hasta Cuándo (Expiración) *
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>
                {formErrors.dates && <p className="text-xs text-rose-600">{formErrors.dates}</p>}
              </div>

              {/* REQUIREMENT: Límite de Almacenamiento - PERMITE INGRESO MANUAL DE NÚMEROS */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>Límite de Almacenamiento (Asignado en MB) *</span>
                  </span>
                  <span className="font-mono text-blue-700 font-bold">
                    {parseInt(quotaMBInput, 10) >= 1024
                      ? `${(parseInt(quotaMBInput, 10) / 1024).toFixed(1)} GB (${quotaMBInput || 0} MB)`
                      : `${quotaMBInput || 0} MB`}
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    value={quotaMBInput}
                    onChange={(e) => setQuotaMBInput(e.target.value)}
                    placeholder="Ingrese los MB..."
                    className="w-36 px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  <div className="flex items-center gap-1 text-xs flex-wrap">
                    {[250, 500, 1000, 2048, 5120, 10240].map(mb => (
                      <button
                        key={mb}
                        type="button"
                        onClick={() => setQuotaMBInput(String(mb))}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border cursor-pointer ${
                          quotaMBInput === String(mb) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Puede ingresar manualmente cualquier valor en Megabytes o usar los botones predefinidos.
                </p>
                {formErrors.quota && <p className="text-xs text-rose-600">{formErrors.quota}</p>}
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#d9e2ec] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec] rounded-md cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md shadow-2xs cursor-pointer transition-colors"
                >
                  {isEditingUser ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS VIEW MODAL */}
      {credentialsModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-[#d9e2ec] w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 bg-[#103b66] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs">Credenciales de Acceso</h4>
              </div>
              <button
                onClick={() => setCredentialsModalUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[#f0f4f8] rounded-lg border border-[#d9e2ec] space-y-2">
                <div>
                  <span className="text-[10px] text-[#627d98] uppercase tracking-wider block">Usuario</span>
                  <p className="font-mono font-bold text-[#102a43]">@{credentialsModalUser.username}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#627d98] uppercase tracking-wider block">Contraseña</span>
                  <p className="font-mono font-bold text-[#133e66]">
                    {credentialsModalUser.password || 'Minero#2026!'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyCredentials(credentialsModalUser)}
                  className="px-4 py-2 bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Credenciales Copiadas' : 'Copiar Credenciales'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
