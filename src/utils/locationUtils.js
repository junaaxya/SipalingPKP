const normalizeLocationUnit = (unit) => {
  if (!unit) return null
  if (typeof unit === 'string') {
    return {
      id: unit,
      name: unit
    }
  }

  return {
    id: unit.id || unit.code || unit.value || unit.kode || '',
    name: unit.name || unit.label || unit.text || unit.nama || ''
  }
}

const mapReverseGeocodeResponse = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Data lokasi tidak valid.')
  }

  const province = normalizeLocationUnit(data.province || data.provinsi)
  const regency = normalizeLocationUnit(data.regency || data.kabupaten || data.kota)
  const district = normalizeLocationUnit(data.district || data.kecamatan)
  const village = normalizeLocationUnit(data.village || data.kelurahan || data.desa)

  return {
    province,
    regency: regency ? { ...regency, parentId: province?.id } : null,
    district: district ? { ...district, parentId: regency?.id } : null,
    village: village ? { ...village, parentId: district?.id } : null,
    address: data.address || data.alamat || '',
    postalCode: data.postalCode || data.postal_code || data.kodePos || '',
    rt: data.rt || data.RT || '',
    rw: data.rw || data.RW || ''
  }
}

const resolveLocationId = (location) =>
  location?.id ?? location?.code ?? location?.value ?? location?.kode ?? null

export { normalizeLocationUnit, mapReverseGeocodeResponse, resolveLocationId }
