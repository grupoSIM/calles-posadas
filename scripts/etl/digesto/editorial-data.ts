export interface EditorialDefinition {
  match: (nombre: string, numero: number | null, tipo: string) => boolean;
  explicacion: string;
  fuente_biografica: string;
  categoria_toponimica: 'PROCER' | 'CIENCIA_CULTURA' | 'PIONERO' | 'FLORA_FAUNA' | 'FECHA_PATRIA' | 'RELIGIOSO' | 'COMUNITARIO' | 'GEOGRAFIA';
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
}

export const EDITORIAL_DEFINITIONS: EditorialDefinition[] = [
  // --- EJE 83 Y AVENIDAS TRONCALES (ORDENANZA XVIII - N° 4) ---
  {
    match: (n) => norm(n).includes('alicia moreau de justo'),
    explicacion: 'Alicia Moreau de Justo (1885-1986), médica, educadora y dirigente socialista argentina, destacada pionera continental en la defensa de los derechos humanos, el sufragio femenino y la paz.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('cocomarola'),
    explicacion: 'Mario del Tránsito Cocomarola (1918-1974), "El Taita del Chamamé", prolífico compositor y bandoneonista, referente máximo de la música litoraleña y autor del himno regional "Kilómetro 11".',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('facundo quiroga'),
    explicacion: 'Juan Facundo Quiroga (1788-1835), caudillo riojano y militar federal conocido como "El Tigre de los Llanos", figura central de las luchas autonómicas provinciales argentinas.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('de andrea') || norm(n).includes('andrea monseñor'),
    explicacion: 'Monseñor Miguel de Andrea (1877-1960), obispo católico, orador y sociólogo argentino, incansable defensor de la justicia social y promotor de la sindicalización obrera cristiana.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'RELIGIOSO'
  },
  {
    match: (n) => norm(n).includes('valerio ozuna'),
    explicacion: 'Valerio Ozuna, destacado educador pionero y funcionario territorial del Consejo General de Educación en Misiones, formador de comunidades escolares.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('kolping'),
    explicacion: 'Beato Adolfo Kolping (1813-1865), sacerdote católico alemán fundador de la Obra Kolping, dedicada a la promoción social, técnica, humana y laboral de los trabajadores en todo el mundo.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'RELIGIOSO'
  },
  {
    match: (n) => norm(n).includes('piro') || norm(n).includes('julio jose piro'),
    explicacion: 'Julio José Piró (1888-1965), ilustre médico cirujano y sanitarista de Posadas, pionero en la atención hospitalaria pública y la erradicación de endemias en Misiones.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('ramon angel dominguez'),
    explicacion: 'Ramón Ángel Domínguez, dirigente vecinal y pionero de la consolidación urbana y barrial en el sector oeste de Posadas.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('jesus de nazareno'),
    explicacion: 'Advocación central del cristianismo en homenaje a Jesús de Nazaret, símbolo de redención y fe profundamente arraigado en la tradición espiritual comunitaria.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'RELIGIOSO'
  },
  {
    match: (n) => norm(n).includes('juan maza'),
    explicacion: 'Juan Agustín Maza (1784-1830), patriota y jurisconsulto mendocino, congresal en Tucumán en 1816 y fervoroso defensor de la independencia de las Provincias Unidas.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('constitucion'),
    explicacion: 'En conmemoración de la Constitución de la Nación Argentina, sancionada por el Congreso General Constituyente en Santa Fe el 1 de mayo de 1853, base jurídica de la República.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'FECHA_PATRIA'
  },
  {
    match: (n) => norm(n).includes('pueyrredon'),
    explicacion: 'Juan Martín de Pueyrredón (1777-1850), militar y estadista patrio, Director Supremo de las Provincias Unidas del Río de la Plata y soporte estratégico del Cruce de los Andes.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('de las americas'),
    explicacion: 'Homenaje a la unión, fraternidad e integración cultural y soberana de las naciones del continente americano.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('rodolfo muller') || norm(n).includes('muller'),
    explicacion: 'Rodolfo Müller, pionero e industrial impulsor de la colonización agrícola, forestal y agroindustrial en el territorio de Misiones.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('juan domingo peron') || norm(n).includes('peron'),
    explicacion: 'Juan Domingo Perón (1895-1974), teniente general y tres veces presidente constitucional de la Argentina, fundador del movimiento peronista y transformador de los derechos laborales y sociales.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('soldado argentino'),
    explicacion: 'Homenaje perenne al Soldado Argentino, custodio de las fronteras, la soberanía nacional y la integridad territorial de la patria.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('ramon martinez'),
    explicacion: 'Ramón Martínez (1881-1960), médico y progresista intendente municipal de Posadas, artífice del saneamiento costero y el ensanche de avenidas en el siglo XX.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('jauretche') || norm(n).includes('jaurectche'),
    explicacion: 'Arturo Jauretche (1901-1974), ensayista, abogado y político argentino, cofundador de FORJA y lúcido pensador del ideario nacional y la soberanía cultural.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('morinigo'),
    explicacion: 'María de la Cruz Moriñigo (1890-1974), benefactora y líder barrial comunitaria de Posadas, pionera en la contención de infancias a través del deporte.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('grismado'),
    explicacion: 'Carlos Grismado, personalidad comunitaria y pionero barrial de la ciudad de Posadas.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('fores') || norm(n).includes('perpetuo fores'),
    explicacion: 'Pedro Perpetuo Forés, docente y promotor social comunitario de Posadas.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('miqueri'),
    explicacion: 'Salvador Miqueri (1926-2013), "El Lucero del Chamamé", cantor, guitarrista y compositor de prolífica trayectoria poética y musical en el Litoral argentino.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('fangio'),
    explicacion: 'Juan Manuel Fangio (1911-1995), mítico piloto automovilístico argentino, quíntuple campeón mundial de Fórmula 1 y paradigma del deporte y la ética internacional.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 4',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },

  // --- ORDENANZAS PARTICULARES (XVIII-80 Y XVIII-306) ---
  {
    match: (n) => norm(n).includes('ramon ayala'),
    explicacion: 'Ramón Gumercindo Cidade "Ramón Ayala" (1927-2023), "El Mensú", supremo cantautor, pintor, escritor y creador del gualambao, máxima gloria poética y artística de Misiones.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 306',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('llamosas') || norm(n).includes('tulo llamosas'),
    explicacion: 'Fernando Elías "Tulo" Llamosas (1939-2001), recordado dirigente cívico y primer intendente municipal de Posadas tras la reinstauración democrática de diciembre de 1983.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 80',
    categoria_toponimica: 'PIONERO'
  },

  // --- CALLES DEL EJIDO URBANO (ORDENANZA XVIII - N° 46) ---
  {
    match: (n) => norm(n).includes('san martin de balcarce'),
    explicacion: 'Mercedes Tomasa de San Martín y Escalada de Balcarce (1816-1875), hija del Libertador General José de San Martín y de María de los Remedios de Escalada, depositaria de sus célebres Máximas.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('ghandi') || norm(n).includes('gandhi'),
    explicacion: 'Mahatma Gandhi (1869-1948), pacifista, filósofo y líder independentista de la India, apóstol universal de la no violencia (Ahimsa) y la resistencia pacífica.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('peñaloza') || norm(n).includes('chacho'),
    explicacion: 'Ángel Vicente "El Chacho" Peñaloza (1798-1863), militar y caudillo federal riojano, defensor incansable del federalismo del interior y las libertades provinciales.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('tala'),
    explicacion: 'Celtis tala, árbol autóctono de madera noble y follaje denso, representativo de la flora y bosques nativos de la región.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('naranjos'),
    explicacion: 'Citrus aurantium, árbol frutal cítrico característico de las quintas y solares tradicionales de la capital misionera.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('lapachos'),
    explicacion: 'Handroanthus heptaphyllus, árbol monumental y flor oficial de Posadas y Misiones, orgullo de la selva paranaense por sus floraciones rosadas y amarillas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('los andes'),
    explicacion: 'Cordillera de los Andes, colosal cadena montañosa de América del Sur y escenario épico de la gesta libertadora continental.',
    fuente_biografica: 'Síntesis geográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('larrea'),
    explicacion: 'Juan Larrea (1782-1847), comerciante y político patriota, vocal de la Primera Junta de Gobierno patrio de mayo de 1810.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('paul percy harris') || norm(n).includes('harris'),
    explicacion: 'Paul Percy Harris (1868-1947), abogado estadounidense y fundador del Rotary International, institución pionera en la ayuda humanitaria y el servicio comunitario.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('roque gonzalez') || norm(n).includes('gonzalez de santa cruz'),
    explicacion: 'San Roque González de Santa Cruz (1576-1628), sacerdote jesuita y primer santo rioplatense, fundador de la histórica reducción de Nuestra Señora de la Anunciación de Itapúa (1615), origen fundacional de Posadas.',
    fuente_biografica: 'Síntesis histórica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'RELIGIOSO'
  },
  {
    match: (n) => norm(n).includes('beethoven'),
    explicacion: 'Ludwig van Beethoven (1770-1827), eminente compositor y director de orquesta alemán, una de las personalidades más universales e influyentes en la historia de la música.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('dartois'),
    explicacion: 'Luciano Dartois "Panchito", destacado agrimensor y explorador territorial que confeccionó la mensura original y delineación de las chacras de Posadas a fines del siglo XIX.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('hernandez'),
    explicacion: 'José Hernández (1834-1886), escritor, periodista, poeta y legislador argentino, autor de "El Gaucho Martín Fierro", poema épico y emblema de la literatura gauchesca nacional.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('alberti'),
    explicacion: 'Manuel Maximiliano Alberti (1763-1811), sacerdote patriota y vocal de la Primera Junta de Gobierno de mayo de 1810, director del periódico La Gazeta de Buenos Ayres.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('azcuenaga'),
    explicacion: 'Miguel de Azcuénaga (1754-1833), militar y político patriota, vocal de la Primera Junta de 1810 y gobernador de la provincia de Buenos Aires.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('castelli'),
    explicacion: 'Juan José Castelli (1764-1812), abogado y político patriota, "el orador de la Revolución de Mayo" y vocal de la Primera Junta patria.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('guaranies'),
    explicacion: 'Pueblo originario Guaraní, pobladores ancestrales de la cuenca del Plata y Misiones, cuyo idioma, cosmovisión y saberes constituyen la raíz identitaria de la región.',
    fuente_biografica: 'Síntesis histórica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('discepolo'),
    explicacion: 'Enrique Santos Discépolo (1901-1951), genial poeta, compositor, actor y dramaturgo argentino, autor de tangos inmortales como "Cambalache" y "Yira, yira".',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('araucarias'),
    explicacion: 'Araucaria angustifolia (Pino Paraná), especie milenaria de conífera nativa del norte misionero, declarada Monumento Natural Provincial.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('espinillos'),
    explicacion: 'Acacia caven, arbusto espinoso autóctono caracterizado por sus vistosas flores amarillas perfumadas y su rusticidad.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('zaluski'),
    explicacion: 'Miguel Ángel Zaluski, maestro normal nacional y abnegado educador posadeño, recordado por su vocación docente en la formación de juventudes.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('dornell'),
    explicacion: 'Cecilio Dornell, agente de la Policía de Misiones que ofrendó su vida en el cumplimiento del deber custodiando la seguridad ciudadana.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('brasilia'),
    explicacion: 'Brasilia, capital federal de la República Federativa del Brasil, país hermano limítrofe con Misiones a través del río Uruguay y San Antonio.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('potosi'),
    explicacion: 'Potosí, histórica ciudad minera del Alto Perú y símbolo de la riqueza cultural y económica de la América colonial hispana.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('camelias'),
    explicacion: 'Camellia japonica, arbusto ornamental de flores elegantes muy cultivado en los jardines tradicionales de Posadas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 46',
    categoria_toponimica: 'FLORA_FAUNA'
  },

  // --- CALLES INTERNAS Y CHACRAS (ORDENANZA XVIII - N° 130) ---
  {
    match: (n) => norm(n).includes('sanchez ratti'),
    explicacion: 'Juan Carlos Sánchez Ratti, notable periodista, cronista e historiador posadeño, prolífico investigador de la memoria fundacional y toponímica misionera.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('pensamientos'),
    explicacion: 'Viola tricolor, planta herbácea de flores aterciopeladas y variados colores, símbolo de belleza en la jardinería urbana de Posadas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('girasoles'),
    explicacion: 'Helianthus annuus, planta anual de floración dorada que orienta sus corolas hacia la luz solar, ícono de vitalidad y agricultura.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('estrella federal'),
    explicacion: 'Euphorbia pulcherrima, arbusto de vistosas brácteas rojas, símbolo toponímico floral y patriótico en la historia argentina.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('jazmines'),
    explicacion: 'Jasminum, arbusto trepador célebre por el exquisito aroma de sus flores blancas, característico de los patios y veredas misioneras.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('gladiolos'),
    explicacion: 'Gladiolus, planta bulbosa de espigas florales multicolores, muy apreciada en la horticultura y ornamentación urbana.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('dalias'),
    explicacion: 'Dahlia, especie floral de gran porte y vivos matices, presente en el paisaje doméstico de las chacras posadeñas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('geranios'),
    explicacion: 'Pelargonium, planta rústica de prolongada floración en balcones y jardines de la ciudad de Posadas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('amapolas'),
    explicacion: 'Papaver rhoeas, flor silvestre de pétalos delicados y rojo intenso, alegoría universal del recuerdo y la naturaleza.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('calas'),
    explicacion: 'Zantedeschia aethiopica, planta de elegante floración blanca acopada, tradicional en los jardines ribereños de Posadas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('tulipanes'),
    explicacion: 'Tulipa, planta bulbosa reconocida mundialmente por la perfección y simetría de sus copas florales.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('magnolias'),
    explicacion: 'Magnolia grandiflora, árbol de follaje perenne y grandes flores blancas intensamente perfumadas, hito en las quintas tradicionales.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('narcisos'),
    explicacion: 'Narcissus, flor primaveral de corola acampanada, asociada al renacer de la flora en los climas subtropicales.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('lilas'),
    explicacion: 'Syringa, arbusto caducifolio de ramilletes lilas de suave aroma, muy apreciado en la toponimia vecinal.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('amarantos'),
    explicacion: 'Amaranthus, planta ancestral de panojas florales color carmín y valor nutricional, símbolo de resistencia.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('irupe'),
    explicacion: 'Victoria cruziana (Irupé), planta acuática monumental nativa de las aguas del Paraná, emblema mitológico y vegetal guaraní.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('primaveras'),
    explicacion: 'Bougainvillea (Santa Rita / Primavera), trepadora de profusa floración fucsia y violeta que viste los cercos posadeños.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('alheli'),
    explicacion: 'Matthiola incana, hierba ornamental mediterránea adaptada a los jardines familiares por su perfume y variedad cromática.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('teresitas'),
    explicacion: 'Catharanthus roseus, pequeña flor de quintas subtropicales apreciada por su rusticidad y presencia continua.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('malvones'),
    explicacion: 'Pelargonium zonale, planta tradicional de macetas y canteros hogareños en los barrios consolidados de Posadas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('campanillas'),
    explicacion: 'Ipomoea, enredadera silvestre de flores en forma de campana que bordea las chacras y costas del río.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('clavelinas'),
    explicacion: 'Dianthus deltoides, hierba floral de pétalos dentados y dulce fragancia, común en los canteros vecinales.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('lirios'),
    explicacion: 'Iris, planta de estilizadas flores heráldicas cultivada en los espacios verdes y jardines familiares posadeños.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('alegrias del hogar'),
    explicacion: 'Impatiens walleriana, planta de sombra y floración permanente muy popular en las galerías y patios misioneros.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('violetas'),
    explicacion: 'Viola odorata, flor silvestre de sutil perfume y pétalos azul violáceo, clásica en los canteros de las chacras históricas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('crisantemos'),
    explicacion: 'Chrysanthemum, especie de floración otoñal apreciada por su nobleza y diversidad en los jardines comunitarios.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('orquideas'),
    explicacion: 'Orchidaceae, familia botánica epífita emblemática de la selva misionera, célebre por la exquisita complejidad de sus flores.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('azucenas'),
    explicacion: 'Lilium candidum, flor blanca acampanada de intenso aroma, tradicionalmente cultivada en los jardines de Posadas.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('claveles'),
    explicacion: 'Dianthus caryophyllus, clásica flor de corte de bordes rizados, símbolo de devoción y afecto en la memoria barrial.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('marcelas'),
    explicacion: 'Achyrocline satureioides (Marcela), planta aromática y medicinal silvestre autóctona de Misiones, recolectada tradicionalmente en Viernes Santo.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('petunias'),
    explicacion: 'Petunia, planta anual de copiosa floración en campana que adorna los frentes y plazas de la ciudad.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('manzanillas'),
    explicacion: 'Matricaria chamomilla, hierba medicinal de pequeñas flores blancas y corazón amarillo, indispensable en la farmacopea popular.',
    fuente_biografica: 'Síntesis botánica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FLORA_FAUNA'
  },
  {
    match: (n) => norm(n).includes('independencia argentina'),
    explicacion: 'En conmemoración del 9 de Julio de 1816, día en que el Congreso de Tucumán proclamó la independencia de las Provincias Unidas del dominio español.',
    fuente_biografica: 'Síntesis histórica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FECHA_PATRIA'
  },
  {
    match: (n) => norm(n).includes('mariano boedo'),
    explicacion: 'Mariano Boedo (1782-1819), jurista y político patriota salteño, diputado y vicepresidente del histórico Congreso de Tucumán de 1816.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('uriarte'),
    explicacion: 'Pedro Francisco de Uriarte (1758-1839), sacerdote y patriota santiagueño, congresal en Tucumán y firmante de la Declaración de la Independencia en 1816.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('araos'),
    explicacion: 'Pedro Miguel Aráoz (1759-1832), sacerdote católico patriota, congresal por Tucumán y firmante del Acta de la Independencia de 1816.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('victoriano sotelo') || norm(n).includes('sotelo'),
    explicacion: 'Victoriano Sotelo, vecino pionero y referente de la Chacra 32-33 de Posadas, protagonista del esfuerzo comunitario en la apertura de pasajes y servicios.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('patricio alfredo guanca') || norm(n).includes('guanca'),
    explicacion: 'Patricio Alfredo Guanca (1957-1982), cabo principal de mar de la Armada Argentina, héroe caído en combate en las Islas Georgias del Sur el 3 de abril de 1982 a bordo de la corbeta ARA Guerrico.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('gottschalk'),
    explicacion: 'Emilio Gottschalk (1884-1963), pionero industrial, comerciante y filántropo de Posadas, donante de parcelas para obras públicas y paseos comunitarios.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('lucho perez'),
    explicacion: 'Luis "Lucho" Pérez, entrañable dirigente social, vecinal y promotor de clubes deportivos barriales y contención de infancias en Posadas.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('navajas centeno'),
    explicacion: 'Víctor Navajas Centeno (1903-1967), pionero industrial yerbatero e innovador agrícola, fundador del emblemático Establecimiento Las Marías.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('christin'),
    explicacion: 'Mario Jorge Christín, dirigente vecinalista y vecino pionero de la urbanización y mejora habitacional de las chacras de Posadas.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('semilla'),
    explicacion: 'Esteban Servando Semilla, marino y baqueano fluvial del Alto Paraná, pionero en la navegación y cartas hidrográficas del río.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('santisimo redentor') || norm(n).includes('redentor'),
    explicacion: 'Advocación religiosa cristiana comunitaria de la congregación y comunidad eclesial del Santísimo Redentor.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'RELIGIOSO'
  },
  {
    match: (n) => norm(n).includes('ciurey'),
    explicacion: 'Estanislao Ciurey, vecino pionero de origen inmigrante y promotor del desarrollo solidario en el ejido urbano posadeño.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('martin omar maciel') || norm(n).includes('maciel'),
    explicacion: 'Martín Omar Maciel, cabo segundo artillero de la Armada Argentina, héroe oriundo de la región caído en combate en el hundimiento del Crucero ARA General Belgrano el 2 de mayo de 1982.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('jorge newbery') || norm(n).includes('newbery'),
    explicacion: 'Jorge Newbery (1875-1914), ingeniero, hombre de ciencia y pionero indiscutido de la aviación argentina, fundador de la Escuela Militar de Aviación.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('lorenzini'),
    explicacion: 'Carola Lorenzini (1899-1941), célebre aviadora civil y paracaidista argentina, primera mujer instructora de vuelo de América del Sur y plusmarquista de aviación.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('japon'),
    explicacion: 'Japón, nación insular de Asia oriental, en reconocimiento a la colectividad japonesa y pioneros nipones que integraron el desarrollo hortícola y social de Misiones.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('luzuriaga'),
    explicacion: 'Pablo de Luzuriaga, militar patriota y héroe combatiente durante las campañas por la independencia nacional.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('figueredo'),
    explicacion: 'Juan Bautista Figueredo, militar patriota de activa participación en la defensa de los territorios fronterizos del Plata.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('catalano'),
    explicacion: 'Salvador Catalano, ilustre maestro y director de escuela en Posadas, educador ejemplar en la consolidación pedagógica de la infancia provincial.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('29 de mayo'),
    explicacion: 'En conmemoración del Día del Ejército Argentino, instituido el 29 de mayo de 1810 por decreto de la Primera Junta de Gobierno patrio.',
    fuente_biografica: 'Síntesis histórica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FECHA_PATRIA'
  },
  {
    match: (n) => norm(n).includes('blandengues'),
    explicacion: 'Cuerpo de Blandengues de la Frontera, legendario regimiento de caballería virreinal y patrio que defendió las fronteras del Río de la Plata.',
    fuente_biografica: 'Síntesis histórica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('escuadron alto parana'),
    explicacion: 'Escuadrón Alto Paraná de Gendarmería Nacional, histórica unidad apostada en las fronteras fluviales de Misiones para la custodia y soberanía territorial.',
    fuente_biografica: 'Síntesis institucional y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'COMUNITARIO'
  },
  {
    match: (n) => norm(n).includes('28 de julio'),
    explicacion: 'En conmemoración del aniversario de la creación de la Gendarmería Nacional Argentina, sancionada el 28 de julio de 1938 por Ley N° 12.367.',
    fuente_biografica: 'Síntesis histórica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'FECHA_PATRIA'
  },
  {
    match: (n) => norm(n).includes('tripepi'),
    explicacion: 'Miguel Ángel Tripepi, primer gendarme de la Gendarmería Nacional Argentina caído heroicamente en cumplimiento del deber custodio de la patria.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  // --- ARTERIAS HISTÓRICAS DEL CASCO CÉNTRICO (FEAT-021) ---
  {
    match: (n, num) => (num === 27 || num === null) && norm(n).includes('general paz'),
    explicacion: 'José María Paz (1791-1854), militar y estratega patriota, general de la independencia argentina y autor de célebres Memorias póstumas de gran valor historiográfico.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n, num) => (num === 28 || num === null) && norm(n).includes('alvear') && !norm(n).includes('marcelo'),
    explicacion: 'Carlos María de Alvear (1789-1852), militar y político de la emancipación rioplatense, Director Supremo de las Provincias Unidas y comandante general en la Batalla de Ituzaingó.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n, num) => (num === 32 || num === null) && norm(n).includes('santa fe'),
    explicacion: 'En homenaje a la provincia de Santa Fe, provincia histórica del litoral argentino y sede del Congreso General Constituyente que sancionó la Constitución Nacional de 1853.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'GEOGRAFIA'
  },
  {
    match: (n, num) => (num === 44 || num === null) && norm(n).includes('entre rios'),
    explicacion: 'En homenaje a la provincia de Entre Ríos, provincia litoraleña clave en la gesta federal y en el proceso de organización constitucional de la República Argentina.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'GEOGRAFIA'
  },
  {
    match: (n, num) => (num === 46 || num === null) && norm(n).includes('catamarca'),
    explicacion: 'En homenaje a la provincia de Catamarca, provincia del noroeste argentino integrante histórica de las Provincias Unidas del Río de la Plata y protagonista de la independencia.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'GEOGRAFIA'
  },
  {
    match: (n, num) => (num === 47 || num === null) && norm(n).includes('san luis'),
    explicacion: 'En homenaje a la provincia de San Luis, provincia cuyana de fervor patriótico que brindó auxilio fundamental al General San Martín para la conformación del Ejército de los Andes.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'GEOGRAFIA'
  },
  {
    match: (n, num) => (num === 48 || num === null) && norm(n).includes('salta'),
    explicacion: 'En homenaje a la provincia de Salta, cuna de los Infernales del General Martín Miguel de Güemes y glorioso baluarte de la Guerra Gaucha en custodia de la frontera norte.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'GEOGRAFIA'
  },
  {
    match: (n, num) => (num === 49 || num === null) && norm(n).includes('jujuy'),
    explicacion: 'En homenaje a la provincia de Jujuy, protagonista del heroico Éxodo Jujeño de 1812 y tierra de combate permanente por la defensa y soberanía de la patria.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'GEOGRAFIA'
  },
  {
    match: (n, num) => (num === 50 || num === null) && norm(n).includes('tucuman'),
    explicacion: 'En homenaje a la provincia de Tucumán, solar patrio del Congreso General Constituyente donde se proclamó la Declaración de la Independencia de las Provincias Unidas el 9 de Julio de 1816.',
    fuente_biografica: 'Síntesis toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'GEOGRAFIA'
  },
  // --- AVENIDAS TRONCALES HISTÓRICAS (FEAT-022) ---
  {
    match: (n) => norm(n).includes('lopez y planes'),
    explicacion: 'Vicente López y Planes (1785-1856), estadista, abogado y político argentino, autor de la letra del Himno Nacional Argentino y presidente provisional de las Provincias Unidas del Río de la Plata en 1827.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  },
  {
    match: (n) => norm(n).includes('blas parera'),
    explicacion: 'Blas Parera (1776-1840), compositor y músico hispanoargentino, autor de la partitura y música oficial del Himno Nacional Argentino adoptada por la Asamblea del Año XIII.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('cabred') || norm(n).includes('domingo cabred'),
    explicacion: 'Domingo Cabred (1859-1929), eminente médico psiquiatra, sanitarista y docente universitario argentino, creador del moderno sistema asistencial de puertas abiertas y de colonias hospitalarias modelo.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('francisco de haro'),
    explicacion: 'Francisco de Haro (1870-1941), médico pioneiro, legislador y filántropo de fecunda trayectoria social, fundador de instituciones de beneficencia y promotor de la salud pública en Misiones.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'CIENCIA_CULTURA'
  },
  {
    match: (n) => norm(n).includes('bustamante') || norm(n).includes('ricardo bustamante'),
    explicacion: 'Ricardo Bustamante, agrimensor y cartógrafo pionero de Posadas, responsable de la demarcación, mensura y delineación de la cuadrícula urbana original del municipio.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PIONERO'
  },
  {
    match: (n) => norm(n).includes('rademacher'),
    explicacion: 'Padre José Fridolín Rademacher (1870-1954), sacerdote misionero de la Congregación del Verbo Divino, educador y párroco emblemático que dedicó su ministerio pastoral a la comunidad posadeña.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'RELIGIOSO'
  },
  {
    match: (n) => norm(n).includes('aguado') && !norm(n).includes('urquiza'),
    explicacion: 'Alejandro Aguado (1784-1842), militar, mecenas y financiero, dilecto amigo y albacea testamentario del Libertador General José de San Martín a quien brindó leal auxilio en su exilio.',
    fuente_biografica: 'Síntesis biográfica y toponímica municipal - Ordenanza XVIII - N° 130',
    categoria_toponimica: 'PROCER'
  }
];

export function findEditorialEnrichment(
  nombreOficial: string,
  numeroCalle: number | null,
  tipoVia: string
): { explicacion: string; fuente_biografica: string; categoria_toponimica: string } | null {
  for (const def of EDITORIAL_DEFINITIONS) {
    if (def.match(nombreOficial, numeroCalle, tipoVia)) {
      return {
        explicacion: def.explicacion,
        fuente_biografica: def.fuente_biografica,
        categoria_toponimica: def.categoria_toponimica
      };
    }
  }
  return null;
}
