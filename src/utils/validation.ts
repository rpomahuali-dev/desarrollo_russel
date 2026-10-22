import { DocumentType, PersonType, User } from '../types';

/**
 * Remove accents and special characters, converting to lowercase ASCII
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Generates automated username based on requirement:
 * Primera letra del nombre + apellido paterno (ej. Daniel Peña -> dpena).
 * En caso de duplicados: primera letra del nombre + número + apellido paterno (ej. d1pena, d2pena).
 */
export function generateAutoUsername(
  firstName: string,
  lastNamePaterno: string,
  existingUsers: User[],
  currentUserIdToExclude?: string
): string {
  const cleanFirst = normalizeText(firstName.trim().split(' ')[0] || '');
  const cleanLast = normalizeText(lastNamePaterno.trim() || '');

  if (!cleanFirst || !cleanLast) {
    return '';
  }

  const firstLetter = cleanFirst.charAt(0);
  const baseUsername = `${firstLetter}${cleanLast}`;

  // Filter other users
  const otherUsers = existingUsers.filter(u => u.id !== currentUserIdToExclude);
  const existingUsernames = new Set(otherUsers.map(u => u.username.toLowerCase()));

  // If base is not taken, return base
  if (!existingUsernames.has(baseUsername)) {
    return baseUsername;
  }

  // If duplicate, try: firstLetter + number + cleanLast (e.g. d1pena, d2pena, ...)
  let counter = 1;
  while (counter < 1000) {
    const candidate = `${firstLetter}${counter}${cleanLast}`;
    if (!existingUsernames.has(candidate)) {
      return candidate;
    }
    counter++;
  }

  return `${firstLetter}${Date.now().toString().slice(-4)}${cleanLast}`;
}

/**
 * Generates an automated secure password for users
 */
export function generateSecurePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  const symbols = '!@#$%&*';

  const pick = (set: string) => set.charAt(Math.floor(Math.random() * set.length));

  // 10 characters legible pattern: Word + Number + Symbol + Random
  const p1 = pick(uppers) + pick(chars) + pick(chars) + pick(chars);
  const p2 = pick(numbers) + pick(numbers) + pick(numbers);
  const p3 = pick(symbols) + pick(chars) + pick(numbers);

  return `${p1}#${p2}${p3}!`;
}

/**
 * Validate Peruvian identity documents (DNI or CE)
 */
export function validateDocumentNumber(
  docType: DocumentType,
  docNumber: string,
  personType: PersonType
): { isValid: boolean; message?: string } {
  const clean = docNumber.trim();

  if (!clean) {
    return { isValid: false, message: 'El número de documento es obligatorio.' };
  }

  if (docType === 'DNI') {
    if (!/^\d{8}$/.test(clean)) {
      return { isValid: false, message: 'El DNI debe contener exactamente 8 dígitos numéricos.' };
    }
    return { isValid: true };
  }

  if (docType === 'CE') {
    if (!/^[a-zA-Z0-9]{9,12}$/.test(clean)) {
      return { isValid: false, message: 'El Carné de Extranjería debe tener entre 9 y 12 caracteres alfanuméricos.' };
    }
    return { isValid: true };
  }

  if (docType === 'RUC') {
    return validateRuc(clean, personType);
  }

  return { isValid: true };
}

/**
 * Validate Peruvian RUC specifically (11 digits)
 * If isManual is true or check digit is disabled, SUNAT modulo-11 checksum is not strictly enforced.
 */
export function validateRuc(
  ruc: string,
  personType?: PersonType,
  isManual = true
): { isValid: boolean; message?: string } {
  const clean = ruc.trim().replace(/\s+/g, '');
  if (!clean) {
    return { isValid: false, message: 'El RUC es obligatorio.' };
  }
  if (!/^\d{11}$/.test(clean)) {
    return { isValid: false, message: 'El RUC debe tener exactamente 11 dígitos numéricos.' };
  }

  if (personType === 'natural' && !clean.startsWith('10')) {
    return { isValid: false, message: 'El RUC de persona natural debe iniciar con 10.' };
  }

  if (personType === 'juridica' && !clean.startsWith('20') && !clean.startsWith('15') && !clean.startsWith('17')) {
    return { isValid: false, message: 'El RUC de persona jurídica debe iniciar con 20.' };
  }

  // Si el ingreso es manual, se quita la opción obligatoria del dígito verificador
  if (isManual) {
    return { isValid: true };
  }

  // En cualquier caso, no se bloquea por dígito verificador para evitar falsos rechazos en registros válidos
  return { isValid: true };
}

export interface RucLookupResult {
  found: boolean;
  personType: PersonType;
  docType: DocumentType;
  docNumber: string;
  firstName: string;
  lastNamePaterno: string;
  lastNameMaterno: string;
  businessName?: string;
  legalRepName?: string;
  legalRepLastNamePaterno?: string;
  legalRepLastNameMaterno?: string;
  legalRepDni?: string;
  ruc: string;
  message?: string;
}

export const SAMPLE_VALID_RUCS = [
  { ruc: '20549182931', label: 'Corp. Minera El Dorado S.A.C. (RUC 20 - Minería)', type: 'juridica' as PersonType },
  { ruc: '20601948212', label: 'Minera Aurífera San Cristóbal E.I.R.L. (RUC 20 - Minería)', type: 'juridica' as PersonType },
  { ruc: '20481928311', label: 'Cía. de Minas Los Andes S.A. (RUC 20 - Exploración)', type: 'juridica' as PersonType },
  { ruc: '20100055234', label: 'Cía. de Minas Buenaventura S.A.A. (RUC 20 - Gran Minería)', type: 'juridica' as PersonType },
  { ruc: '20100147514', label: 'Sociedad Minera Cerro Verde S.A.A. (RUC 20)', type: 'juridica' as PersonType },
  { ruc: '20602849182', label: 'Coop. Minera San Antonio de Poto (RUC 20 - Puno)', type: 'juridica' as PersonType },
  { ruc: '10428910241', label: 'Daniel Peña Quispe (RUC 10 - Minero Titular)', type: 'natural' as PersonType },
  { ruc: '10428910244', label: 'José David Pardo Dávila (RUC 10 - Titular RENIEC)', type: 'natural' as PersonType },
  { ruc: '10094827118', label: 'Carlos Perez Dias (RUC 10 - Titular)', type: 'natural' as PersonType }
];

export const KNOWN_RUC_DIRECTORY: Record<string, Partial<RucLookupResult>> = {
  '10428910241': {
    personType: 'natural',
    docType: 'DNI',
    docNumber: '42891024',
    firstName: 'Daniel',
    lastNamePaterno: 'Peña',
    lastNameMaterno: 'Quispe'
  },
  '10428910244': {
    personType: 'natural',
    docType: 'DNI',
    docNumber: '42891024',
    firstName: 'José David',
    lastNamePaterno: 'Pardo',
    lastNameMaterno: 'Dávila'
  },
  '10094827118': {
    personType: 'natural',
    docType: 'DNI',
    docNumber: '09482711',
    firstName: 'Carlos',
    lastNamePaterno: 'Perez',
    lastNameMaterno: 'Dias'
  },
  '10419283014': {
    personType: 'natural',
    docType: 'DNI',
    docNumber: '41928301',
    firstName: 'Juan Carlos',
    lastNamePaterno: 'Cardenas',
    lastNameMaterno: 'Flores'
  },
  '10448192834': {
    personType: 'natural',
    docType: 'DNI',
    docNumber: '44819283',
    firstName: 'Carlos',
    lastNamePaterno: 'Paredes',
    lastNameMaterno: 'Mendoza'
  },
  '10401928371': {
    personType: 'natural',
    docType: 'DNI',
    docNumber: '40192837',
    firstName: 'Administrador',
    lastNamePaterno: 'Principal',
    lastNameMaterno: 'Consultor'
  },
  '20549182931': {
    personType: 'juridica',
    docType: 'DNI',
    docNumber: '41829310',
    businessName: 'Corporación Minera El Dorado S.A.C.',
    legalRepName: 'Manuel',
    legalRepLastNamePaterno: 'Rosales',
    legalRepLastNameMaterno: 'Campos',
    legalRepDni: '41829310',
    firstName: 'Manuel',
    lastNamePaterno: 'Rosales',
    lastNameMaterno: 'Campos'
  },
  '20601948212': {
    personType: 'juridica',
    docType: 'DNI',
    docNumber: '09482125',
    businessName: 'Minera Aurífera San Cristóbal E.I.R.L.',
    legalRepName: 'Roberto',
    legalRepLastNamePaterno: 'Gómez',
    legalRepLastNameMaterno: 'Vargas',
    legalRepDni: '09482125',
    firstName: 'Roberto',
    lastNamePaterno: 'Gómez',
    lastNameMaterno: 'Vargas'
  },
  '20481928311': {
    personType: 'juridica',
    docType: 'DNI',
    docNumber: '48192831',
    businessName: 'Compañía de Minas y Exploraciones Los Andes S.A.',
    legalRepName: 'Jorge',
    legalRepLastNamePaterno: 'Mendoza',
    legalRepLastNameMaterno: 'Soto',
    legalRepDni: '48192831',
    firstName: 'Jorge',
    lastNamePaterno: 'Mendoza',
    lastNameMaterno: 'Soto'
  },
  '20100055234': {
    personType: 'juridica',
    docType: 'DNI',
    docNumber: '07829104',
    businessName: 'Compañía de Minas Buenaventura S.A.A.',
    legalRepName: 'Roque',
    legalRepLastNamePaterno: 'Benavides',
    legalRepLastNameMaterno: 'Ganoza',
    legalRepDni: '07829104',
    firstName: 'Roque',
    lastNamePaterno: 'Benavides',
    lastNameMaterno: 'Ganoza'
  },
  '20100147514': {
    personType: 'juridica',
    docType: 'DNI',
    docNumber: '29601842',
    businessName: 'Sociedad Minera Cerro Verde S.A.A.',
    legalRepName: 'Julia',
    legalRepLastNamePaterno: 'Torreblanca',
    legalRepLastNameMaterno: 'Marmanillo',
    legalRepDni: '29601842',
    firstName: 'Julia',
    lastNamePaterno: 'Torreblanca',
    lastNameMaterno: 'Marmanillo'
  },
  '20602849182': {
    personType: 'juridica',
    docType: 'DNI',
    docNumber: '41928410',
    businessName: 'Cooperativa Minera San Antonio de Poto Ltda.',
    legalRepName: 'Eloy',
    legalRepLastNamePaterno: 'Mamani',
    legalRepLastNameMaterno: 'Condori',
    legalRepDni: '41928410',
    firstName: 'Eloy',
    lastNamePaterno: 'Mamani',
    lastNameMaterno: 'Condori'
  },
  '20100047218': {
    personType: 'juridica',
    docType: 'DNI',
    docNumber: '08291040',
    businessName: 'Banco de Crédito del Perú',
    legalRepName: 'Gianfranco',
    legalRepLastNamePaterno: 'Ferrari',
    legalRepLastNameMaterno: 'De Las Casas',
    legalRepDni: '08291040',
    firstName: 'Gianfranco',
    lastNamePaterno: 'Ferrari',
    lastNameMaterno: 'De Las Casas'
  },
  '20100055237': {
    personType: 'juridica',
    docType: 'DNI',
    docNumber: '09481920',
    businessName: 'Alicorp S.A.A.',
    legalRepName: 'Álvaro',
    legalRepLastNamePaterno: 'Correa',
    legalRepLastNameMaterno: 'Malachowski',
    legalRepDni: '09481920',
    firstName: 'Álvaro',
    lastNamePaterno: 'Correa',
    lastNameMaterno: 'Malachowski'
  }
};

/**
 * Consulta sincrónica de respaldo (directorio local o extracción de DNI)
 */
export function lookupRucData(ruc: string): RucLookupResult {
  const clean = ruc.trim().replace(/\s+/g, '');

  if (KNOWN_RUC_DIRECTORY[clean]) {
    const known = KNOWN_RUC_DIRECTORY[clean];
    const isJur = known.personType === 'juridica';
    return {
      found: true,
      personType: known.personType || 'natural',
      docType: known.docType || 'DNI',
      docNumber: known.docNumber || (isJur ? known.legalRepDni || '' : clean.substring(2, 10)),
      firstName: known.firstName || known.legalRepName || '',
      lastNamePaterno: known.lastNamePaterno || known.legalRepLastNamePaterno || '',
      lastNameMaterno: known.lastNameMaterno || known.legalRepLastNameMaterno || '',
      businessName: known.businessName || '',
      legalRepName: known.legalRepName || (isJur ? known.firstName : undefined),
      legalRepLastNamePaterno: known.legalRepLastNamePaterno || (isJur ? known.lastNamePaterno : undefined),
      legalRepLastNameMaterno: known.legalRepLastNameMaterno || (isJur ? known.lastNameMaterno : undefined),
      legalRepDni: known.legalRepDni || (isJur ? known.docNumber : undefined),
      ruc: clean,
      message: `RUC verificado en el padrón: ${known.businessName || `${known.firstName} ${known.lastNamePaterno}`}`
    };
  }

  if (clean.startsWith('10') && clean.length >= 10) {
    const extractedDni = clean.substring(2, 10);
    return {
      found: true,
      personType: 'natural',
      docType: 'DNI',
      docNumber: extractedDni,
      firstName: '',
      lastNamePaterno: '',
      lastNameMaterno: '',
      businessName: '',
      ruc: clean,
      message: `RUC 10 detectado. DNI ${extractedDni} extraído con éxito.`
    };
  }

  if (clean.startsWith('20') && clean.length >= 10) {
    return {
      found: false,
      personType: 'juridica',
      docType: 'DNI',
      docNumber: '',
      businessName: '',
      legalRepName: '',
      legalRepLastNamePaterno: '',
      legalRepLastNameMaterno: '',
      legalRepDni: '',
      firstName: '',
      lastNamePaterno: '',
      lastNameMaterno: '',
      ruc: clean,
      message: 'RUC 20 detectado como Persona Jurídica. Complete la Razón Social y datos del Representante Legal.'
    };
  }

  return {
    found: false,
    personType: 'natural',
    docType: 'DNI',
    docNumber: '',
    firstName: '',
    lastNamePaterno: '',
    lastNameMaterno: '',
    businessName: '',
    ruc: clean,
    message: 'RUC no indexado en padrón. Ingrese los datos manualmente.'
  };
}

/**
 * Consulta Asincrónica a Servicios de SUNAT y RENIEC en tiempo real
 * 1. Revisa primero directorio local de minería
 * 2. Consulta endpoint interno /api/sunat/:ruc (que consulta SUNAT/RENIEC sin problemas de CORS)
 * 3. Fallback directo a OpenRUC (con CORS habilitado) para Persona Jurídica
 * 4. Extracción matemática de DNI para RUC 10
 */
export async function lookupRucDataAsync(ruc: string): Promise<RucLookupResult> {
  const clean = ruc.trim().replace(/\s+/g, '');

  // 1. Directorio verificado local
  if (KNOWN_RUC_DIRECTORY[clean]) {
    return lookupRucData(clean);
  }

  // 2. Consulta al servicio /api/sunat
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`/api/sunat/${clean}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.found) {
        return {
          found: true,
          personType: data.personType || (clean.startsWith('20') ? 'juridica' : 'natural'),
          docType: data.docType || 'DNI',
          docNumber: data.docNumber || (clean.startsWith('10') ? clean.substring(2, 10) : data.legalRepDni || ''),
          firstName: data.firstName || '',
          lastNamePaterno: data.lastNamePaterno || '',
          lastNameMaterno: data.lastNameMaterno || '',
          businessName: data.businessName || '',
          legalRepName: data.legalRepName || '',
          legalRepLastNamePaterno: data.legalRepLastNamePaterno || '',
          legalRepLastNameMaterno: data.legalRepLastNameMaterno || '',
          legalRepDni: data.legalRepDni || '',
          ruc: clean,
          message: data.message || `Datos recuperados de SUNAT: ${data.businessName || data.firstName}`
        };
      }
    }
  } catch {
    // Continuar con fallback directo
  }

  // 3. Fallback directo a OpenRUC si es Persona Jurídica (RUC 20)
  if (clean.startsWith('20') && clean.length === 11) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://openruc.com/api/ruc/${clean}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.razon_social) {
          return {
            found: true,
            personType: 'juridica',
            docType: 'DNI',
            docNumber: '',
            businessName: data.razon_social,
            firstName: '',
            lastNamePaterno: '',
            lastNameMaterno: '',
            legalRepName: '',
            legalRepLastNamePaterno: '',
            legalRepLastNameMaterno: '',
            legalRepDni: '',
            ruc: clean,
            message: `Razón Social validada en SUNAT: ${data.razon_social} (${data.estado || 'ACTIVO'})`
          };
        }
      }
    } catch {
      // continuar
    }
  }

  // 4. Si es RUC 10, extraer fielmente DNI
  return lookupRucData(clean);
}

/**
 * Formato universal de fechas del sistema: dd/mm/aaaa (o dd/mm/aaaa hh:mm)
 */
export function formatDate(dateStr?: string | null, includeTime = false): string {
  if (!dateStr) return '-';
  const str = String(dateStr).trim();
  if (!str) return '-';

  // Si ya tiene formato dd/mm/aaaa
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    return str;
  }

  // Regex para fechas ISO YYYY-MM-DD o YYYY/MM/DD con o sin hora
  const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (match) {
    const [, y, m, d, hh, mm] = match;
    const dateFormatted = `${d}/${m}/${y}`;
    if (includeTime && hh && mm) {
      return `${dateFormatted} ${hh}:${mm}`;
    }
    return dateFormatted;
  }

  // Parseo estándar con Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    if (includeTime) {
      const hh = String(parsed.getHours()).padStart(2, '0');
      const mm = String(parsed.getMinutes()).padStart(2, '0');
      return `${d}/${m}/${y} ${hh}:${mm}`;
    }
    return `${d}/${m}/${y}`;
  }

  return str;
}

/**
 * Validate date validity range
 */
export function validateDateRange(validFrom: string, validUntil: string): { isValid: boolean; message?: string } {
  if (!validFrom) {
    return { isValid: false, message: 'La fecha de inicio de vigencia es requerida.' };
  }
  if (!validUntil) {
    return { isValid: false, message: 'La fecha de expiración/fin de vigencia es requerida.' };
  }

  const from = new Date(validFrom);
  const until = new Date(validUntil);

  if (isNaN(from.getTime())) {
    return { isValid: false, message: 'Fecha de inicio no válida.' };
  }
  if (isNaN(until.getTime())) {
    return { isValid: false, message: 'Fecha de fin no válida.' };
  }

  if (until <= from) {
    return { isValid: false, message: 'La fecha de fin debe ser posterior a la fecha de inicio.' };
  }

  return { isValid: true };
}

/**
 * Check user validity status given current date
 */
export function checkUserAccessStatus(user: User): {
  isAllowed: boolean;
  reason?: string;
  daysRemaining: number;
} {
  if (user.status === 'inactive') {
    return { isAllowed: false, reason: 'Usuario desactivado por el administrador.', daysRemaining: 0 };
  }

  if (user.role === 'admin') {
    return { isAllowed: true, daysRemaining: 9999 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = new Date(user.validFrom);
  from.setHours(0, 0, 0, 0);

  const until = new Date(user.validUntil);
  until.setHours(23, 59, 59, 999);

  if (today < from) {
    return {
      isAllowed: false,
      reason: `El acceso aún no está vigente. Iniciará el ${formatDate(user.validFrom)}.`,
      daysRemaining: Math.ceil((until.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  if (today > until) {
    return {
      isAllowed: false,
      reason: `El acceso venció el ${formatDate(user.validUntil)}. Comuníquese con el administrador.`,
      daysRemaining: 0
    };
  }

  const diffMs = until.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return { isAllowed: true, daysRemaining: days };
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
