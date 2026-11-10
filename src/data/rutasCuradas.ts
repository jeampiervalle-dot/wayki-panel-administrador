import type { Linea } from '../domain/models'

// Subrutas SIT/SmartBus unificadas ida/vuelta, alineadas a la app KMP
// (CombiRoute.kt -> ArequipaRoutes.smartbusRoutes). Se resuelven contra
// lineas de BD por número SIT en el nombre; si no existen en BD se crean
// placeholders (sin trazado).
export interface SubrutaCurada {
  name: string
  routeId: string
  returnRouteId?: string | null
}

export const SUBRUTAS_POR_CODIGO: Record<string, SubrutaCurada[]> = {
  C2: [
    { name: '4 · Salaverry ⇄ Villa Los Milagros', routeId: '21105225', returnRouteId: '21105226' },
    { name: '4A · Ciudad de Dios ⇄ Terminal Terrestre', routeId: '17620010', returnRouteId: '17684888' },
    { name: '4B · Terminal Terrestre ⇄ Villa Hermosa', routeId: '17683273', returnRouteId: '17653560' },
    { name: '4C · Avenida Venezuela ⇄ Villa Milagros', routeId: '17684890', returnRouteId: '17653490' },
    { name: '4D · Villa Los Milagros ⇄ Óvalo Avelino', routeId: '17683269', returnRouteId: '17683270' },
    { name: 'A · El Naranjal ⇄ Ángeles del Sur Zona A', routeId: '17608055', returnRouteId: '17684886' },
    { name: 'AJ · AMIFIV ⇄ Salaverry', routeId: '21270562', returnRouteId: '21270561' },
    { name: 'BR · Apipa ⇄ Terminal Terrestre', routeId: '17608045', returnRouteId: '17684889' },
    { name: 'C · Los Ccoritos ⇄ Ángeles del Sur Zona A', routeId: '17684887', returnRouteId: '17608077' },
    { name: 'CIMA · Ciudad Blanca ⇄ Ciudad Municipal', routeId: '17658558', returnRouteId: '17658550' },
    { name: 'CIMA Bustamante · Apipa ⇄ Óvalo Mariscal Castilla', routeId: '17683271', returnRouteId: '17683272' },
    { name: 'CIMA · Sor Ana ⇄ Alto San Martín', routeId: '17658522', returnRouteId: '17658549' },
    { name: 'Cettar · Ciudad Municipal ⇄ Terminal Terrestre', routeId: '17607753', returnRouteId: '17683267' },
    { name: 'El Litoral · Chachani ⇄ Salaverry', routeId: '17658669', returnRouteId: '17679511' },
    { name: 'Los Canarios · Chachani ⇄ Terminal Terrestre', routeId: '21198646', returnRouteId: '21198645' },
    { name: 'Los Canarios · Terminal Terrestre ⇄ Villa Magisterial', routeId: '21201202', returnRouteId: '21201201' },
    { name: 'Peruarbo · Alameda Salaverry ⇄ Peruarbo', routeId: '17683268', returnRouteId: '17608051' },
    { name: 'Santa Clara · Villa Miguel Grau ⇄ Fundo Cabrería', routeId: '17684885', returnRouteId: '17608110' },
    { name: 'Señor de Luren · Huacsapata ⇄ Villa Los Milagros', routeId: '21222665', returnRouteId: '21217878' },
  ],
  C3: [
    { name: '11 de Mayo · Mujeres con Esperanza ⇄ Terminal Terrestre', routeId: '17653636', returnRouteId: '17683264' },
    { name: 'A000 · El Azufral ⇄ Terminal Terrestre', routeId: '21290923', returnRouteId: '21290922' },
    { name: 'A5/San Miguel · Sector 7 Deán Valdivia ⇄ Las Convenciones', routeId: '21297017', returnRouteId: '21297016' },
    { name: 'Casimiro (Seguro Social) · Casimiro ⇄ Coliseo Arequipa', routeId: '17664629', returnRouteId: '17664645' },
    { name: 'Casimiro (Terminal Terrestre) · Casimiro ⇄ Terminal Terrestre', routeId: '21417183', returnRouteId: '21417182' },
    { name: 'Chapi · Av. Independencia ⇄ Mujeres con Esperanza', routeId: '17664511', returnRouteId: '17664509' },
    { name: 'Embajada · Los Pioneros ⇄ Terminal Terrestre', routeId: '17659544', returnRouteId: '17686763' },
    { name: 'Enace · Avenida Venezuela ⇄ Urbanización Deán Valdivia', routeId: '17445672', returnRouteId: '17445532' },
    { name: 'San Miguel · Las Convenciones ⇄ Sector 7 Deán Valdivia', routeId: '17684893', returnRouteId: '17515510' },
    { name: 'Zamacola · Terminal Pesquero ⇄ Terminal Terrestre', routeId: '17659504', returnRouteId: '17658664' },
  ],
  C4: [
    { name: '7A: Huarangal · Av. Salaverry ⇄ Huarangal', routeId: '21416255', returnRouteId: '21416256' },
    { name: '7A: Mirador · Av. Salaverry ⇄ El Mirador', routeId: '21416182', returnRouteId: '21416183' },
    { name: '7A: Villa Ecológica · Av. Salaverry ⇄ Villa Ecológica', routeId: '17687967', returnRouteId: '17608042' },
    { name: '7B · Av. Salaverry ⇄ El Mirador', routeId: '21416272', returnRouteId: '21416273' },
    { name: 'A1 · El Mirador ⇄ Ruta del Sillar', routeId: '17633933', returnRouteId: '17688012' },
    { name: 'A15 · Plaza España ⇄ Tomasa', routeId: '17688014', returnRouteId: '17633936' },
    { name: 'Alto Selva Alegre: A · Av. Salaverry ⇄ San Luis', routeId: '17664776', returnRouteId: '17664775' },
    { name: 'B: Juan XXIII · Avelino ⇄ La Galaxia', routeId: '17664649', returnRouteId: '17664648' },
    { name: 'B: Miraflores (Salvador) · El Salvador ⇄ Terminal Terrestre', routeId: '17619994', returnRouteId: '17688015' },
    { name: 'B: Miraflores · El Salvador ⇄ Terminal Terrestre', routeId: '21272961', returnRouteId: '21272960' },
    { name: 'C · Av. Salaverry ⇄ Cementerio de Miraflores', routeId: '17688016', returnRouteId: '17581799' },
    { name: 'D · San Luis ⇄ Terminal Terrestre', routeId: '17633924', returnRouteId: '17683265' },
    { name: 'D Huaranguillo · Huaranguillo ⇄ San Luis', routeId: '17683274', returnRouteId: '17681083' },
    { name: 'Gráficos · Av. Emancipación ⇄ Salaverry', routeId: '17664646', returnRouteId: '17664647' },
    { name: 'Gráficos: A · Av. Salaverry ⇄ San Luis', routeId: '17684894', returnRouteId: '17518939' },
    { name: 'Gráficos: B (P. Polanco) · Avelino ⇄ El Mirador', routeId: '17688013', returnRouteId: '17633932' },
    { name: 'Gráficos: B (San Luis) · Avelino ⇄ San Luis', routeId: '17684907', returnRouteId: '17626535' },
    { name: 'Gráficos: Umacollo · San Luis ⇄ Umacollo', routeId: '17633927', returnRouteId: '17683266' },
  ],
  C5: [
    { name: 'A · Estadio Melgar ⇄ Jerusalen', routeId: '17664825', returnRouteId: '17664824' },
    { name: 'A: San Jerónimo · Estadio Melgar ⇄ San Jerónimo', routeId: '17688180', returnRouteId: '17687934' },
    { name: 'A: Señor de Huanca · Estadio Melgar ⇄ Señor de Huanca', routeId: '17688207', returnRouteId: '17688018' },
    { name: 'Atalaya · Atalaya ⇄ Estadio Melgar', routeId: '17664795', returnRouteId: '17664821' },
    { name: 'C: Atalaya · Atalaya ⇄ Terminal Terrestre', routeId: '17664793', returnRouteId: '17664794' },
    { name: 'C: Cenepa · Colegio Independencia ⇄ Héroes del Cenepa', routeId: '17664788', returnRouteId: '17664787' },
    { name: 'C: Los Olivos (Estadio Melgar) · Estadio Melgar ⇄ San Miguel', routeId: '17664827', returnRouteId: '17664826' },
    { name: 'C: Mirador Berlín · Berlín ⇄ Estadio Melgar', routeId: '17664822', returnRouteId: '17664823' },
    { name: 'C: Olivos (Terminal Terrestre) · San Miguel ⇄ Terminal Terrestre', routeId: '17664789', returnRouteId: '17664790' },
    { name: 'Miguel Grau · Estadio Melgar ⇄ Miguel Grau', routeId: '17664792', returnRouteId: '17664791' },
  ],
  C6: [
    { name: 'A · La Merced ⇄ Miguel Grau', routeId: '17688024', returnRouteId: '17634339' },
    { name: 'Urb. Tahuaycani ⇄ Miguel Grau', routeId: '21279058', returnRouteId: '21279059' },
    { name: 'B · Cementerio Apacheta ⇄ Miguel Grau', routeId: '17688022', returnRouteId: '17636328' },
    { name: 'B2 · Miguel Grau ⇄ Terminal Terrestre', routeId: '17633938', returnRouteId: '17688019' },
    { name: 'B2 A · Miguel Grau ⇄ Terminal Terrestre', routeId: '17636285', returnRouteId: '17688020' },
    { name: 'C · Miguel Grau ⇄ Plaza Las Américas', routeId: '17636305', returnRouteId: '17688021' },
    { name: 'H · Alto de la Alianza ⇄ Miguel Grau', routeId: '17688023', returnRouteId: '17636635' },
  ],
  C7: [
    { name: '02 · C. José Olaya ⇄ Plaza Paucarpata', routeId: '17664831', returnRouteId: '17664830' },
    { name: '5 · Alto Libertad ⇄ Campo de Marte', routeId: '17664972', returnRouteId: '17664971' },
    { name: '06 · Avelino ⇄ Huacsapata', routeId: '17664974', returnRouteId: '17664973' },
    { name: '3 · Baños de Jesús ⇄ Aeropuerto', routeId: '17634360', returnRouteId: '17688025' },
    { name: '7 · Guardia Civil ⇄ Vallecito', routeId: '17664975', returnRouteId: '17775694' },
    { name: '9 · Campo de Marte ⇄ La Católica', routeId: '17664977', returnRouteId: '17664978' },
    { name: 'B · Terminal Terrestre ⇄ Villa Santa Rosa', routeId: '17688026', returnRouteId: '17636304' },
    { name: 'C: Israel · Israel ⇄ Terminal Terrestre', routeId: '17677829', returnRouteId: '17688027' },
    { name: 'H C · Avelino ⇄ Huacsapata', routeId: '21261724', returnRouteId: '21261725' },
    { name: 'P · Plaza Paucarpata ⇄ Tío Chico', routeId: '17664828', returnRouteId: '17664829' },
    { name: 'P: Los Portales de Chiguata · Avelino ⇄ Los Portales de Chiguata', routeId: '21261652', returnRouteId: '21261653' },
    { name: 'P: San José · Plaza Paucarpata ⇄ San José', routeId: '21261202', returnRouteId: '21261201' },
  ],
  C8: [
    { name: 'A · Santa Ana ⇄ Plaza Mayta Capac', routeId: '17643025', returnRouteId: '17688039' },
    { name: 'B · Independencia ⇄ Yumina', routeId: '21240658', returnRouteId: '21240657' },
    { name: 'LA · Av. La Paz ⇄ Juventud Characato', routeId: '17688030', returnRouteId: '17636375' },
    { name: 'LB: Cerrillo · Calle Victor Lira ⇄ Cerrillo', routeId: '17688017', returnRouteId: '17688029' },
    { name: 'LB: Mollebaya · Calle Victor Lira ⇄ Mollebaya', routeId: '17684891', returnRouteId: '17688028' },
    { name: 'T Quequeña · Quequeña ⇄ Terminal Terrestre', routeId: '17677911', returnRouteId: '17688038' },
    { name: 'T: San Antonio · San Antonio ⇄ Terminal Terrestre', routeId: '17642932', returnRouteId: '17688031' },
  ],
  C9: [
    { name: '3 de octubre: A · La Campiña II ⇄ Tahuantinsuyo', routeId: '17664981', returnRouteId: '17664982' },
    { name: '3 de octubre: B · La Campiña II ⇄ Parque Selva Alegre', routeId: '17511052', returnRouteId: '17688040' },
    { name: '3 de octubre: C · La Campiña II ⇄ Mariano Melgar', routeId: '17664983', returnRouteId: '17664984' },
    { name: '3 de octubre: D · Alto Misti ⇄ La Campiña II', routeId: '17664986', returnRouteId: '17664985' },
    { name: '4 de octubre: Cayma · El Golf ⇄ Enace', routeId: '17511191', returnRouteId: '17688048' },
    { name: '4 de octubre: Feria Altiplano · El Golf ⇄ Feria Altiplano', routeId: '17654414', returnRouteId: '17688206' },
    { name: '4 de octubre · El Golf → Feria Altiplano', routeId: '21257623', returnRouteId: null },
    { name: 'Alto Libertad · Alto Libertad ⇄ Av. Paisajista', routeId: '17688046', returnRouteId: '17644947' },
    { name: 'Alto de la luna · Calle San Agustín ⇄ Simón Bolivar', routeId: '21311675', returnRouteId: '21311676' },
    { name: 'Ciudad Mi Trabajo: A · El Pasto ⇄ Pachacutec', routeId: '17644902', returnRouteId: '17688044' },
    { name: 'Ciudad Mi Trabajo: M · La Mansión ⇄ La Salle', routeId: '17644912', returnRouteId: '17688045' },
    { name: 'Dolores · La Salle ⇄ La Campiña III', routeId: '17688041', returnRouteId: '17643070' },
    { name: 'Monterrey - Corbacho · Av. La Paz ⇄ Av. Paisajista', routeId: '17688051', returnRouteId: '17658190' },
    { name: 'Monterrey - San Martín · La Campiña III ⇄ La Salle', routeId: '17664987', returnRouteId: '17664988' },
    { name: 'Simon Bolivar · Cruce Sabandía ⇄ Cruce Sabandía', routeId: '17688049', returnRouteId: '17688050' },
    { name: 'Socabaya: B · Horacio Zevallos ⇄ Pachacutec', routeId: '17654231', returnRouteId: '17688047' },
  ],
  C10: [
    { name: '13 · Av Paucarpata ⇄ San Hilarión', routeId: '17688058', returnRouteId: '17658204' },
    { name: '38 · Av. Progreso ⇄ Av. Tahuantinsuyo', routeId: '17688059', returnRouteId: '17658205' },
    { name: 'A · La Mansión del Fundador ⇄ Ciudad Blanca', routeId: '17688054', returnRouteId: '17636366' },
    { name: 'Avelino - 7 de junio · Avelino ⇄ Urb. Micaela Bastidas', routeId: '21278873', returnRouteId: '21278874' },
    { name: 'D · Av. Los Alpes ⇄ Av. Paisajista', routeId: '17688229', returnRouteId: '17688055' },
    { name: 'M · Av. Paucarpata ⇄ Mansión', routeId: '17688060', returnRouteId: '17658252' },
    { name: 'P30 · La Salle ⇄ Plaza Huayco', routeId: '17687966', returnRouteId: '17687963' },
    { name: 'Sachaca - 7 de Junio · Alata ⇄ Av. Paucarpata', routeId: '17658187', returnRouteId: '17688056' },
    { name: 'Tahuaycani · Calle Peral ⇄ Urb. Micaela Bastidas', routeId: '17688208', returnRouteId: '17688057' },
    { name: 'Tiabaya - Goyeneche · Av. Paucarpata ⇄ Tiabaya', routeId: '17688053', returnRouteId: '17688052' },
  ],
  C11: [
    { name: 'A: Alto Libertad · Alto Libertad ⇄ Plaza de Armas', routeId: '17688061', returnRouteId: '17687970' },
    { name: 'A: Pachacutec · Av. Estados Unidos ⇄ Semirural Pachacutec', routeId: '17688062', returnRouteId: '17658212' },
    { name: 'B: Alto Libertad · Alto Libertad ⇄ Plaza de Armas', routeId: '17687840', returnRouteId: '17678105' },
    { name: 'B: Pachacutec · Av. Estados Unidos ⇄ Semirural Pachacutec', routeId: '17688063', returnRouteId: '17658213' },
    { name: 'Cural · El Cural ⇄ La Isla', routeId: '17688065', returnRouteId: '17688209' },
    { name: 'M · Avelino ⇄ Pachacutec', routeId: '17688064', returnRouteId: '17658215' },
    { name: 'Uchumayo · Av. La Salle ⇄ La Estación de Uchumayo', routeId: '17688210', returnRouteId: '17688066' },
  ],
}

function findBySmartbusId(lineas: Linea[], smartId?: string | null): Linea | undefined {
  if (!smartId) return undefined
  const re = new RegExp(`\\b${smartId}\\b`)
  return lineas.find((l) => re.test(l.nombre ?? '') || String(l.id) === smartId)
}

const FALLBACK_COLORS: Record<string, string> = {
  C2: '#E53935', C3: '#1E88E5', C4: '#43A047', C5: '#FB8C00', C6: '#8E24AA',
  C7: '#00ACC1', C8: '#D81B60', C9: '#546E7A', C10: '#FDD835', C11: '#6D4C41',
}

export function resolverSubrutasCuradas(code: string, allLineas: Linea[], preferId?: number | null): Linea[] | null {
  const defs = SUBRUTAS_POR_CODIGO[code]
  if (!defs) return null
  const base = allLineas.find((l) => new RegExp(`\\b${code}\\b`, 'i').test(l.nombre ?? '') || new RegExp(`\\b${code}\\b`, 'i').test(l.corredor ?? ''))
  let synthetic = -9000
  return defs.map((s) => {
    const a = findBySmartbusId(allLineas, s.routeId)
    const b = findBySmartbusId(allLineas, s.returnRouteId ?? undefined)
    let canon = a ?? b
    if (preferId != null) {
      if (a?.id === preferId) canon = a
      else if (b?.id === preferId) canon = b
    }
    if (canon) {
      return {
        ...canon,
        nombre: s.name,
        corredor: code,
      }
    }
    return {
      id: synthetic--,
      nombre: s.name,
      corredor: code,
      origen: undefined,
      destino: undefined,
      colorHex: base?.colorHex ?? FALLBACK_COLORS[code] ?? '#6750A4',
    } as Linea
  })
}
