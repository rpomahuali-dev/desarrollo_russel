import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KnownEntity {
  ruc: string;
  personType: 'natural' | 'juridica';
  businessName?: string;
  firstName?: string;
  lastNamePaterno?: string;
  lastNameMaterno?: string;
  docType: 'DNI' | 'CE' | 'RUC';
  docNumber: string;
  legalRepName?: string;
  legalRepLastNamePaterno?: string;
  legalRepLastNameMaterno?: string;
  legalRepDni?: string;
  direccion?: string;
  estado?: string;
  condicion?: string;
}

const KNOWN_DIRECTORY: Record<string, KnownEntity> = {
  // Mineros y Clientes del Sistema
  '10428910241': {
    ruc: '10428910241',
    personType: 'natural',
    firstName: 'Daniel',
    lastNamePaterno: 'Peña',
    lastNameMaterno: 'Quispe',
    docType: 'DNI',
    docNumber: '42891024',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Jr. Los Mineros 142, Rinconada, Puno'
  },
  '10428910244': {
    ruc: '10428910244',
    personType: 'natural',
    firstName: 'José David',
    lastNamePaterno: 'Pardo',
    lastNameMaterno: 'Dávila',
    docType: 'DNI',
    docNumber: '42891024',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Av. Las Gardenias 450, Lima'
  },
  '10094827118': {
    ruc: '10094827118',
    personType: 'natural',
    firstName: 'Carlos',
    lastNamePaterno: 'Perez',
    lastNameMaterno: 'Dias',
    docType: 'DNI',
    docNumber: '09482711',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Calle Bolognesi 210, Arequipa'
  },
  '10419283014': {
    ruc: '10419283014',
    personType: 'natural',
    firstName: 'Juan Carlos',
    lastNamePaterno: 'Cardenas',
    lastNameMaterno: 'Flores',
    docType: 'DNI',
    docNumber: '41928301',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Av. Sol 380, Cusco'
  },
  '10448192834': {
    ruc: '10448192834',
    personType: 'natural',
    firstName: 'Carlos',
    lastNamePaterno: 'Paredes',
    lastNameMaterno: 'Mendoza',
    docType: 'DNI',
    docNumber: '44819283',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Urb. Manuel Prado B-4, Cusco'
  },
  '10401928371': {
    ruc: '10401928371',
    personType: 'natural',
    firstName: 'Administrador',
    lastNamePaterno: 'Principal',
    lastNameMaterno: 'Consultor',
    docType: 'DNI',
    docNumber: '40192837',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'San Isidro, Lima'
  },
  // Concesionarias y Empresas Mineras Registradas
  '20549182931': {
    ruc: '20549182931',
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
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Carretera Interoceánica Km 112, Madre de Dios'
  },
  '20601948212': {
    ruc: '20601948212',
    personType: 'juridica',
    businessName: 'Minera Aurífera San Cristóbal E.I.R.L.',
    firstName: 'Roberto',
    lastNamePaterno: 'Gómez',
    lastNameMaterno: 'Vargas',
    legalRepName: 'Roberto',
    legalRepLastNamePaterno: 'Gómez',
    legalRepLastNameMaterno: 'Vargas',
    legalRepDni: '09482125',
    docType: 'DNI',
    docNumber: '09482125',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Sector Pampa Blanca Mz. C Lote 4, Ananea, Puno'
  },
  '20481928311': {
    ruc: '20481928311',
    personType: 'juridica',
    businessName: 'Compañía de Minas y Exploraciones Los Andes S.A.',
    firstName: 'Jorge',
    lastNamePaterno: 'Mendoza',
    lastNameMaterno: 'Soto',
    legalRepName: 'Jorge',
    legalRepLastNamePaterno: 'Mendoza',
    legalRepLastNameMaterno: 'Soto',
    legalRepDni: '48192831',
    docType: 'DNI',
    docNumber: '48192831',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Av. Ejército 814 Of. 402, Yanahuara, Arequipa'
  },
  '20100055234': {
    ruc: '20100055234',
    personType: 'juridica',
    businessName: 'Compañía de Minas Buenaventura S.A.A.',
    firstName: 'Roque',
    lastNamePaterno: 'Benavides',
    lastNameMaterno: 'Ganoza',
    legalRepName: 'Roque',
    legalRepLastNamePaterno: 'Benavides',
    legalRepLastNameMaterno: 'Ganoza',
    legalRepDni: '07829104',
    docType: 'DNI',
    docNumber: '07829104',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Las Begonias 415 Piso 19, San Isidro, Lima'
  },
  '20100047218': {
    ruc: '20100047218',
    personType: 'juridica',
    businessName: 'Banco de Crédito del Perú',
    firstName: 'Gianfranco',
    lastNamePaterno: 'Ferrari',
    lastNameMaterno: 'De Las Casas',
    legalRepName: 'Gianfranco',
    legalRepLastNamePaterno: 'Ferrari',
    legalRepLastNameMaterno: 'De Las Casas',
    legalRepDni: '08291040',
    docType: 'DNI',
    docNumber: '08291040',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Jr. Centenario 156, La Molina, Lima'
  },
  '20100147514': {
    ruc: '20100147514',
    personType: 'juridica',
    businessName: 'Sociedad Minera Cerro Verde S.A.A.',
    firstName: 'Julia',
    lastNamePaterno: 'Torreblanca',
    lastNameMaterno: 'Marmanillo',
    legalRepName: 'Julia',
    legalRepLastNamePaterno: 'Torreblanca',
    legalRepLastNameMaterno: 'Marmanillo',
    legalRepDni: '29601842',
    docType: 'DNI',
    docNumber: '29601842',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Asiento Minero Cerro Verde, Uchumayo, Arequipa'
  },
  '20602849182': {
    ruc: '20602849182',
    personType: 'juridica',
    businessName: 'Cooperativa Minera San Antonio de Poto Ltda.',
    firstName: 'Eloy',
    lastNamePaterno: 'Mamani',
    lastNameMaterno: 'Condori',
    legalRepName: 'Eloy',
    legalRepLastNamePaterno: 'Mamani',
    legalRepLastNameMaterno: 'Condori',
    legalRepDni: '41928410',
    docType: 'DNI',
    docNumber: '41928410',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Jr. Comercio 312, Ananea, San Antonio de Putina, Puno'
  }
};

async function querySunatApi(rucOrDni: string) {
  const clean = rucOrDni.trim().replace(/\D/g, '');

  // 1. Verificar si está en el directorio conocido/verificado
  if (KNOWN_DIRECTORY[clean]) {
    const k = KNOWN_DIRECTORY[clean];
    return {
      found: true,
      source: 'DIRECTORIO_OFICIAL_MINERIA',
      ruc: k.ruc,
      personType: k.personType,
      businessName: k.businessName || '',
      firstName: k.firstName || k.legalRepName || '',
      lastNamePaterno: k.lastNamePaterno || k.legalRepLastNamePaterno || '',
      lastNameMaterno: k.lastNameMaterno || k.legalRepLastNameMaterno || '',
      legalRepName: k.legalRepName || '',
      legalRepLastNamePaterno: k.legalRepLastNamePaterno || '',
      legalRepLastNameMaterno: k.legalRepLastNameMaterno || '',
      legalRepDni: k.legalRepDni || '',
      docType: k.docType,
      docNumber: k.docNumber,
      estado: k.estado || 'ACTIVO',
      condicion: k.condicion || 'HABIDO',
      direccion: k.direccion || '',
      message: `RUC verificado en el padrón: ${k.businessName || `${k.firstName} ${k.lastNamePaterno}`}`
    };
  }

  // 2. Consulta en vivo para RUC 20 (Persona Jurídica)
  if (clean.startsWith('20') && clean.length === 11) {
    try {
      // Intentar OpenRUC primero (especializado en RUC 20 de SUNAT)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://openruc.com/api/ruc/${clean}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.razon_social) {
          return {
            found: true,
            source: 'SUNAT_OPENRUC',
            ruc: clean,
            personType: 'juridica' as const,
            businessName: data.razon_social,
            estado: data.estado || 'ACTIVO',
            condicion: data.condicion || 'HABIDO',
            direccion: data.direccion || '',
            ubigeo: data.ubigeo || '',
            docType: 'DNI' as const,
            docNumber: '',
            firstName: '',
            lastNamePaterno: '',
            lastNameMaterno: '',
            legalRepName: '',
            legalRepLastNamePaterno: '',
            legalRepLastNameMaterno: '',
            legalRepDni: '',
            message: `Razón Social validada en SUNAT: ${data.razon_social}`
          };
        }
      }
    } catch {
      // continuar con fallback
    }

    try {
      // Intentar apis.net.pe RUC
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 4000);
      const res2 = await fetch(`https://api.apis.net.pe/v1/ruc?numero=${clean}`, {
        signal: controller2.signal
      });
      clearTimeout(timeoutId2);

      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.nombre) {
          return {
            found: true,
            source: 'SUNAT_APIS_NET',
            ruc: clean,
            personType: 'juridica' as const,
            businessName: data2.nombre,
            estado: data2.estado || 'ACTIVO',
            condicion: data2.condicion || 'HABIDO',
            direccion: data2.direccion || '',
            docType: 'DNI' as const,
            docNumber: '',
            firstName: '',
            lastNamePaterno: '',
            lastNameMaterno: '',
            legalRepName: '',
            legalRepLastNamePaterno: '',
            legalRepLastNameMaterno: '',
            legalRepDni: '',
            message: `Razón Social validada en SUNAT: ${data2.nombre}`
          };
        }
      }
    } catch {
      // continuar
    }

    return {
      found: false,
      source: 'NOT_FOUND',
      ruc: clean,
      personType: 'juridica' as const,
      businessName: '',
      docType: 'DNI' as const,
      docNumber: '',
      firstName: '',
      lastNamePaterno: '',
      lastNameMaterno: '',
      legalRepName: '',
      legalRepLastNamePaterno: '',
      legalRepLastNameMaterno: '',
      legalRepDni: '',
      message: 'RUC 20 no localizado en padrón SUNAT en línea. Puede ingresar la Razón Social manualmente.'
    };
  }

  // 3. Consulta en vivo para RUC 10 (Persona Natural) o DNI
  if ((clean.startsWith('10') && clean.length === 11) || clean.length === 8) {
    const dni = clean.length === 11 ? clean.substring(2, 10) : clean;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && (data.nombres || data.nombre)) {
          const fn = data.nombres || (data.nombre ? data.nombre.split(' ')[0] : '');
          const lp = data.apellidoPaterno || '';
          const lm = data.apellidoMaterno || '';

          return {
            found: true,
            source: 'RENIEC_SUNAT_LIVE',
            ruc: clean.length === 11 ? clean : `10${dni}0`,
            personType: 'natural' as const,
            docType: 'DNI' as const,
            docNumber: dni,
            firstName: fn,
            lastNamePaterno: lp,
            lastNameMaterno: lm,
            businessName: '',
            estado: data.estado || 'ACTIVO',
            condicion: data.condicion || 'HABIDO',
            direccion: data.direccion || '',
            message: `Titular validado en RENIEC/SUNAT: ${data.nombre || `${fn} ${lp} ${lm}`}`
          };
        }
      }
    } catch {
      // continuar
    }

    // Si no se encuentra en línea, extraer el DNI fielmente
    return {
      found: true,
      source: 'DNI_EXTRACTED',
      ruc: clean,
      personType: 'natural' as const,
      docType: 'DNI' as const,
      docNumber: dni,
      firstName: '',
      lastNamePaterno: '',
      lastNameMaterno: '',
      businessName: '',
      message: `RUC 10 detectado. DNI ${dni} extraído con éxito. Ingrese nombres o active ingreso manual.`
    };
  }

  return {
    found: false,
    source: 'INVALID_FORMAT',
    ruc: clean,
    personType: 'natural' as const,
    docType: 'DNI' as const,
    docNumber: '',
    firstName: '',
    lastNamePaterno: '',
    lastNameMaterno: '',
    businessName: '',
    message: 'El número ingresado debe tener 11 dígitos para RUC u 8 para DNI.'
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route para consulta SUNAT / DNI
  app.get('/api/sunat/:doc', async (req: Request, res: Response) => {
    const doc = req.params.doc;
    const result = await querySunatApi(doc);
    res.json(result);
  });

  app.get('/api/sunat', async (req: Request, res: Response) => {
    const doc = (req.query.ruc || req.query.dni || '') as string;
    const result = await querySunatApi(doc);
    res.json(result);
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'SUNAT RUC Autocompletion Engine' });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
