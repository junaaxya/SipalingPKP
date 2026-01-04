const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDEEAF6' }
}

const META_LABEL_STYLE = {
  font: { bold: true },
  alignment: { vertical: 'middle', horizontal: 'left' }
}

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('id-ID')
}

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('id-ID')
}

const formatYesNo = (value) => {
  if (value === null || value === undefined) return ''
  return value ? 'Ya' : 'Tidak'
}

const getValueByPath = (data, path) => {
  if (!data || !path) return undefined
  return path.split('.').reduce((acc, key) => acc?.[key], data)
}

const resolveColumnValue = (row, column) => {
  if (typeof column.value === 'function') {
    return column.value(row)
  }
  if (column.path) {
    return getValueByPath(row, column.path)
  }
  if (column.key) {
    return row?.[column.key]
  }
  return ''
}

const formatLandOwnership = (value) => {
  const mapping = {
    milik_sendiri: 'Milik Sendiri',
    bukan_milik_sendiri: 'Bukan Milik Sendiri'
  }
  return mapping[value] || value || ''
}

const formatHouseOwnership = (value) => {
  const mapping = {
    milik_sendiri: 'Milik Sendiri',
    sewa: 'Sewa',
    menumpang: 'Menumpang'
  }
  return mapping[value] || value || ''
}

const formatHouseType = (value) => {
  const mapping = {
    rumah_tapak: 'Rumah Tapak',
    rumah_susun: 'Rumah Susun',
    rumah_petak: 'Rumah Petak',
    kos: 'Kos'
  }
  return mapping[value] || value || ''
}

const formatFloorMaterial = (value) => {
  const mapping = {
    tanah: 'Tanah',
    keramik: 'Keramik',
    rabat_semen: 'Rabat Semen',
    papan: 'Papan',
    kayu: 'Kayu',
    bata: 'Bata'
  }
  return mapping[value] || value || ''
}

const formatWallMaterial = (value) => {
  const mapping = {
    tembok_tanpa_plester: 'Tembok/Bata/Batako Tanpa Plester',
    tembok_dengan_plester: 'Tembok Bata/Batako dengan Plester',
    papan: 'Papan',
    anyaman_bambu: 'Anyaman Bambu',
    lainnya: 'Lainnya'
  }
  return mapping[value] || value || ''
}

const formatRoofMaterial = (value) => {
  const mapping = {
    genteng_beton: 'Genteng (Beton/Keramik)',
    seng_multiroof: 'Seng/Multiroof',
    kayu_sirap: 'Kayu/Sirap',
    asbes: 'Asbes',
    lainnya: 'Lainnya'
  }
  return mapping[value] || value || ''
}

const formatWaterSource = (value) => {
  const mapping = {
    sumur_gali: 'Sumur Gali',
    sumur_bor: 'Sumur Bor',
    ledeng: 'Ledeng',
    lainnya: 'Sumber Air Lainnya'
  }
  return mapping[value] || value || ''
}

const formatWaterLocation = (value) => {
  const mapping = {
    di_tanah_sendiri: 'Di Dalam Tanah Sendiri',
    menumpang_tempat_lain: 'Menumpang/Mengambil dari Tempat Lain'
  }
  return mapping[value] || value || ''
}

const formatToiletOwnership = (value) => {
  const mapping = {
    milik_sendiri: 'Milik Sendiri',
    jamban_bersama: 'Jamban Bersama',
    tidak_memiliki: 'Tidak Memiliki Jamban'
  }
  return mapping[value] || value || ''
}

const formatToiletType = (value) => {
  const mapping = {
    cubluk: 'Cubluk',
    leher_angsa_jongkok: 'Leher Angsa (Jongkok)',
    leher_angsa_duduk: 'Leher Angsa (Duduk)'
  }
  return mapping[value] || value || ''
}

const formatSepticTankType = (value) => {
  const mapping = {
    biotank: 'Biotank',
    tanki_permanen: 'Tanki dengan Konstruksi Permanen',
    lubang_tanah: 'Lubang Tanah',
    tidak_memiliki: 'Tidak Memiliki Tanki'
  }
  return mapping[value] || value || ''
}

const formatSepticPumpingService = (value) => {
  const mapping = {
    pemda: 'Pemda',
    swasta_perorangan: 'Swasta (Perorangan/Badan Usaha)'
  }
  return mapping[value] || value || ''
}

const formatWastewaterDisposal = (value) => {
  const mapping = {
    jaringan_pipa: 'Tergabung dalam Jaringan Pipa Pengolahan Air Limbah',
    tangki_septic: 'Tergabung dalam Tangki Septic',
    drainase_sungai: 'Langsung Dialirkan ke Drainase/Saluran/Sungai',
    resapan_tanah: 'Ditampung dalam Lubang/Resapan ke Tanah'
  }
  return mapping[value] || value || ''
}

const formatWasteCollectionManager = (value) => {
  const mapping = {
    pemda: 'Pemda',
    pemdes: 'Pemdes',
    lsm_kelompok_masyarakat: 'LSM/Kelompok Masyarakat',
    swasta: 'Lainnya'
  }
  return mapping[value] || value || ''
}

const formatWasteDisposalMethod = (value) => {
  const mapping = {
    dibakar: 'Dibakar',
    diolah_rumah: 'Diolah di Rumah (Kompos/Ditimbun)',
    tempat_sampah_umum: 'Dibuang ke Tempat Sampah Umum',
    dibuang_lainnya: 'Dibuang di Tempat Lainnya'
  }
  return mapping[value] || value || ''
}

const formatRoadType = (value) => {
  const mapping = {
    lebar_kurang_3_5m: 'Jalan Lebar < 3,5 m',
    lebar_lebih_3_5m: 'Jalan Lebar > 3,5 m',
    tidak_ada_akses: 'Tidak Terdapat Jalan Akses'
  }
  return mapping[value] || value || ''
}

const formatRoadConstruction = (value) => {
  const mapping = {
    beton: 'Jalan Beton',
    aspal: 'Jalan Aspal',
    konblok: 'Jalan Konblok',
    tanah_sirtu: 'Jalan Tanah/Sirtu',
    lainnya: 'Konstruksi Lainnya'
  }
  return mapping[value] || value || ''
}

const formatElectricitySource = (value) => {
  const mapping = {
    pln_sendiri: 'PLN Sendiri',
    pln_menumpang: 'PLN Menumpang',
    tidak_ada: 'Tidak Ada',
    lainnya: 'Lainnya'
  }
  return mapping[value] || value || ''
}

const formatHousingType = (value) => {
  const mapping = {
    sederhana: 'Sederhana',
    menengah: 'Menengah',
    mewah: 'Mewah',
    campuran: 'Campuran'
  }
  return mapping[String(value || '').toLowerCase()] || value || ''
}

const formatFacilityItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return ''
  return items
    .map((item) => {
      const type = String(item?.type || '').trim()
      const name = String(item?.name || '').trim()
      if (!name) return null
      if (!type) return name
      return `${type}: ${name}`
    })
    .filter(Boolean)
    .join(', ')
}

export const HOUSING_EXPORT_CATEGORIES = [
  {
    id: 'umum',
    label: 'Informasi Umum',
    columns: [
      { header: 'ID', path: 'id' },
      { header: 'Status', path: 'status' },
      { header: 'Tanggal Diajukan', value: (row) => formatDateTime(row.submittedAt || row.createdAt) },
      {
        header: 'Status Layak Huni',
        value: (row) => {
          if (row.isLivable === null || row.isLivable === undefined) return ''
          return row.isLivable ? 'Layak Huni' : 'Tidak Layak Huni'
        }
      }
    ]
  },
  {
    id: 'pengisi',
    label: 'Identitas Pengisi',
    columns: [
      { header: 'Nama Pengisi', path: 'formRespondent.name' },
      { header: 'Email Pengisi', path: 'formRespondent.email' },
      { header: 'Jabatan Pengisi', path: 'formRespondent.position' },
      { header: 'Jabatan Lainnya', path: 'formRespondent.positionOther' },
      { header: 'Telepon Pengisi', path: 'formRespondent.phone' }
    ]
  },
  {
    id: 'pemilik',
    label: 'Identitas Pemilik',
    columns: [
      { header: 'Nama Pemilik', path: 'householdOwner.ownerName' },
      { header: 'Telepon Pemilik', path: 'householdOwner.ownerPhone' },
      { header: 'Nama Kepala Keluarga', path: 'householdOwner.headOfFamilyName' },
      { header: 'Telepon Kepala Keluarga', path: 'householdOwner.headOfFamilyPhone' },
      { header: 'Usia Kepala Keluarga', path: 'householdOwner.headOfFamilyAge' },
      { header: 'Nomor KK', path: 'householdOwner.familyCardNumber' },
      { header: 'Jumlah KK', path: 'householdOwner.totalFamilyMembers' },
      { header: 'Alamat', path: 'householdOwner.houseNumber' },
      { header: 'RT', path: 'householdOwner.rt' },
      { header: 'RW', path: 'householdOwner.rw' },
      { header: 'Kode Pos', path: 'householdOwner.postalCode' },
      { header: 'Pendidikan', path: 'householdOwner.educationLevel' },
      { header: 'Pendidikan Lainnya', path: 'householdOwner.educationLevelOther' },
      { header: 'Pekerjaan', path: 'householdOwner.occupation' },
      { header: 'Penghasilan Bulanan', path: 'householdOwner.monthlyIncome' },
      { header: 'Status Kepemilikan Tanah', value: (row) => formatLandOwnership(row.householdOwner?.landOwnershipStatus) },
      { header: 'Status Kepemilikan Rumah', value: (row) => formatHouseOwnership(row.householdOwner?.houseOwnershipStatus) },
      { header: 'Pernah Menerima Bantuan', value: (row) => formatYesNo(row.householdOwner?.hasReceivedHousingAssistance) },
      { header: 'Tahun Bantuan', path: 'householdOwner.housingAssistanceYear' },
      { header: 'Terdaftar Miskin', value: (row) => formatYesNo(row.householdOwner?.isRegisteredAsPoor) },
      { header: 'Bukti Kriteria Miskin', path: 'householdOwner.poorRegistrationAttachment' }
    ]
  },
  {
    id: 'lokasi',
    label: 'Lokasi',
    columns: [
      { header: 'Provinsi', path: 'householdOwner.province.name' },
      { header: 'Kabupaten/Kota', path: 'householdOwner.regency.name' },
      { header: 'Kecamatan', path: 'householdOwner.district.name' },
      { header: 'Desa/Kelurahan', path: 'householdOwner.village.name' },
      { header: 'Latitude', path: 'householdOwner.latitude' },
      { header: 'Longitude', path: 'householdOwner.longitude' }
    ]
  },
  {
    id: 'bangunan',
    label: 'Bahan Bangunan',
    columns: [
      { header: 'Luas Bangunan', path: 'houseData.buildingArea' },
      { header: 'Luas Tanah', path: 'houseData.landArea' },
      { header: 'Memiliki IMB/PBG', value: (row) => formatYesNo(row.houseData?.hasBuildingPermit) },
      { header: 'Jenis Rumah', value: (row) => formatHouseType(row.houseData?.houseType) },
      { header: 'Jumlah Penghuni', path: 'houseData.totalOccupants' },
      { header: 'Material Lantai', value: (row) => formatFloorMaterial(row.houseData?.floorMaterial) },
      { header: 'Material Dinding', value: (row) => formatWallMaterial(row.houseData?.wallMaterial) },
      { header: 'Material Dinding Lainnya', path: 'houseData.wallMaterialOther' },
      { header: 'Material Atap', value: (row) => formatRoofMaterial(row.houseData?.roofMaterial) },
      { header: 'Material Atap Lainnya', path: 'houseData.roofMaterialOther' }
    ]
  },
  {
    id: 'air',
    label: 'Akses Air Bersih',
    columns: [
      { header: 'Sumber Air MCK', value: (row) => formatWaterSource(row.waterAccess?.sanitationWaterSource) },
      { header: 'Sumber Air MCK Lainnya', path: 'waterAccess.sanitationWaterSourceOther' },
      { header: 'Kedalaman Sumur Bor MCK', path: 'waterAccess.sanitationWaterDepth' },
      { header: 'Lokasi Sumber Air', value: (row) => formatWaterLocation(row.waterAccess?.sanitationWaterLocation) },
      { header: 'Sumber Air Minum', value: (row) => formatWaterSource(row.waterAccess?.drinkingWaterSource) },
      { header: 'Sumber Air Minum Lainnya', path: 'waterAccess.drinkingWaterSourceOther' },
      { header: 'Kedalaman Sumur Bor Minum', path: 'waterAccess.drinkingWaterDepth' }
    ]
  },
  {
    id: 'sanitasi',
    label: 'Sanitasi',
    columns: [
      { header: 'Kepemilikan Jamban', value: (row) => formatToiletOwnership(row.sanitationAccess?.toiletOwnership) },
      { header: 'Jumlah Jamban', path: 'sanitationAccess.toiletCount' },
      { header: 'Jenis Closet', value: (row) => formatToiletType(row.sanitationAccess?.toiletType) },
      { header: 'Jenis Tangki Septik', value: (row) => formatSepticTankType(row.sanitationAccess?.septicTankType) },
      { header: 'Tahun Pembuatan Tangki', path: 'sanitationAccess.septicTankYear' },
      { header: 'Pernah Penyedotan', value: (row) => formatYesNo(row.sanitationAccess?.hasSepticPumping) },
      { header: 'Tahun Penyedotan', path: 'sanitationAccess.septicPumpingYear' },
      { header: 'Jasa Sedot Tinja', value: (row) => formatSepticPumpingService(row.sanitationAccess?.septicPumpingService) },
      { header: 'Pengaliran Air Limbah', value: (row) => formatWastewaterDisposal(row.sanitationAccess?.wastewaterDisposal) }
    ]
  },
  {
    id: 'persampahan',
    label: 'Persampahan',
    columns: [
      { header: 'Akses Pengangkutan Sampah', value: (row) => formatYesNo(row.wasteManagement?.hasWasteCollection) },
      { header: 'Pengelola Sampah', value: (row) => formatWasteCollectionManager(row.wasteManagement?.wasteCollectionManager) },
      { header: 'Pengelola Sampah Lainnya', path: 'wasteManagement.wasteCollectionManagerOther' },
      { header: 'Pengelolaan Sampah', value: (row) => formatWasteDisposalMethod(row.wasteManagement?.wasteDisposalMethod) },
      { header: 'Lokasi Pembuangan', path: 'wasteManagement.wasteDisposalLocation' }
    ]
  },
  {
    id: 'jalan',
    label: 'Akses Jalan',
    columns: [
      { header: 'Jenis Jalan', value: (row) => formatRoadType(row.roadAccess?.roadType) },
      { header: 'Konstruksi Jalan', value: (row) => formatRoadConstruction(row.roadAccess?.roadConstruction) },
      { header: 'Konstruksi Jalan Lainnya', path: 'roadAccess.roadConstructionOther' }
    ]
  },
  {
    id: 'energi',
    label: 'Akses Energi',
    columns: [
      { header: 'Sumber Listrik', value: (row) => formatElectricitySource(row.energyAccess?.electricitySource) },
      { header: 'Sumber Listrik Lainnya', path: 'energyAccess.electricitySourceOther' },
      { header: 'Kapasitas PLN', path: 'energyAccess.plnCapacity' }
    ]
  }
]

export const INFRASTRUCTURE_EXPORT_CATEGORIES = [
  {
    id: 'umum',
    label: 'Informasi Umum',
    columns: [
      { header: 'ID', path: 'id' },
      { header: 'Status', path: 'status' },
      { header: 'Tahun Survei', path: 'surveyYear' },
      { header: 'Periode Survei', path: 'surveyPeriod' }
    ]
  },
  {
    id: 'lokasi',
    label: 'Lokasi',
    columns: [
      { header: 'Provinsi', path: 'province.name' },
      { header: 'Kabupaten/Kota', path: 'regency.name' },
      { header: 'Kecamatan', path: 'district.name' },
      { header: 'Desa/Kelurahan', path: 'village.name' }
    ]
  },
  {
    id: 'profil',
    label: 'Profil Desa/Kelurahan',
    columns: [
      { header: 'Jumlah Penduduk', path: 'villageInfo.populationCount' },
      { header: 'Jumlah Rumah', path: 'villageInfo.householdCount' }
    ]
  },
  {
    id: 'pendidikan',
    label: 'Sarana Pendidikan',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.education) }
    ]
  },
  {
    id: 'kesehatan',
    label: 'Sarana Kesehatan',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.health) }
    ]
  },
  {
    id: 'peribadatan',
    label: 'Sarana Peribadatan',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.religious) }
    ]
  },
  {
    id: 'utilitas',
    label: 'Utilitas Dasar',
    columns: [
      { header: 'Listrik Tercakup', value: (row) => formatYesNo(row.electricity?.isFullCoverage) },
      { header: 'Dusun Belum Terjangkau Listrik', path: 'electricity.uncoveredDusunCount' },
      { header: 'Jumlah SPAM', path: 'water.spamCount' },
      { header: 'Jumlah Operator Telepon', path: 'telecom.operatorCount' },
      { header: 'Dusun Belum Terjangkau Telepon', path: 'telecom.uncoveredDusunCount' }
    ]
  },
  {
    id: 'transportasi',
    label: 'Transportasi',
    columns: [
      { header: 'Jumlah Trayek Bus', path: 'transportation.busRouteCount' },
      { header: 'Jumlah Trayek Angkot', path: 'transportation.angkotRouteCount' },
      { header: 'Trayek Lainnya', path: 'transportation.otherTransportCount' },
      { header: 'Catatan Transportasi', path: 'transportation.otherTransportType' }
    ]
  },
  {
    id: 'perniagaan',
    label: 'Sarana Perniagaan',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.commercial) }
    ]
  },
  {
    id: 'pelayanan',
    label: 'Pelayanan Umum',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.publicServices) }
    ]
  },
  {
    id: 'rekreasi',
    label: 'Rekreasi & Olahraga',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.recreation) }
    ]
  },
  {
    id: 'pemakaman',
    label: 'Pemakaman',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.cemetery) }
    ]
  },
  {
    id: 'pertamanan',
    label: 'Pertamanan',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.greenSpace) }
    ]
  },
  {
    id: 'parkir',
    label: 'Parkir',
    columns: [
      { header: 'Daftar Sarana', value: (row) => formatFacilityItems(row.parking) }
    ]
  },
  {
    id: 'gas',
    label: 'Jaringan Gas',
    columns: [
      { header: 'Jumlah Agen Gas', path: 'gas.gasAgentCount' }
    ]
  },
  {
    id: 'pemadam',
    label: 'Pemadam Kebakaran',
    columns: [
      { header: 'Mobil Damkar', path: 'fireDepartment.fireTruckCount' },
      { header: 'Pengelola', path: 'fireDepartment.fireManager' },
      { header: 'APAR', path: 'fireDepartment.aparCount' }
    ]
  },
  {
    id: 'penerangan',
    label: 'Penerangan Jalan',
    columns: [
      { header: 'Jumlah Lampu Jalan', path: 'streetLighting.streetLightCount' }
    ]
  }
]

export const HOUSING_DEVELOPMENT_EXPORT_CATEGORIES = [
  {
    id: 'umum',
    label: 'Informasi Umum',
    columns: [
      { header: 'ID', path: 'id' },
      { header: 'Status', path: 'status' },
      { header: 'Tanggal Diajukan', value: (row) => formatDateTime(row.submittedAt || row.createdAt) },
      { header: 'Tanggal Verifikasi', value: (row) => formatDateTime(row.verifiedAt || row.reviewedAt) }
    ]
  },
  {
    id: 'perumahan',
    label: 'Data Perumahan',
    columns: [
      { header: 'Nama Perumahan', path: 'developmentName' },
      { header: 'Nama Pengembang', path: 'developerName' },
      { header: 'Jenis Perumahan', value: (row) => formatHousingType(row.housingType) },
      { header: 'Jumlah Unit', path: 'plannedUnitCount' },
      { header: 'Luas Lahan', path: 'landArea' },
      { header: 'Kebutuhan Jalan Akses', value: (row) => formatYesNo(row.hasRoadAccess) },
      { header: 'Panjang Jalan (m)', path: 'roadLengthMeters' },
      { header: 'Status Lahan', path: 'landStatus' }
    ]
  },
  {
    id: 'lokasi',
    label: 'Lokasi',
    columns: [
      { header: 'Provinsi', path: 'province.name' },
      { header: 'Kabupaten/Kota', path: 'regency.name' },
      { header: 'Kecamatan', path: 'district.name' },
      { header: 'Desa/Kelurahan', path: 'village.name' },
      { header: 'Latitude', path: 'latitude' },
      { header: 'Longitude', path: 'longitude' }
    ]
  }
]

export const getExportCategories = (type) => {
  switch (type) {
    case 'housing':
      return HOUSING_EXPORT_CATEGORIES
    case 'facility':
      return INFRASTRUCTURE_EXPORT_CATEGORIES
    case 'housing-development':
      return HOUSING_DEVELOPMENT_EXPORT_CATEGORIES
    default:
      return []
  }
}

export const getColumnsForCategories = (categories, selectedIds) => {
  const selectedSet = new Set(selectedIds)
  const columns = []
  categories.forEach((category) => {
    if (selectedSet.has(category.id)) {
      columns.push(...category.columns)
    }
  })
  return columns
}

export const exportToExcel = async ({
  sheetName,
  fileName,
  columns,
  rows,
  metaRows = []
}) => {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)

  metaRows.forEach((row, index) => {
    const added = sheet.addRow(row)
    if (index === 0) {
      added.font = { bold: true, size: 12 }
    }
    if (row.length > 1) {
      added.getCell(1).style = META_LABEL_STYLE
    }
  })

  if (metaRows.length) {
    sheet.addRow([])
  }

  const headerRow = sheet.addRow(columns.map((col) => col.header))
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  headerRow.fill = HEADER_FILL

  rows.forEach((row) => {
    const values = columns.map((col) => resolveColumnValue(row, col))
    sheet.addRow(values)
  })

  const totalRows = sheet.rowCount
  columns.forEach((column, index) => {
    const columnRef = sheet.getColumn(index + 1)
    let maxLength = column.header.length
    for (let rowIndex = 1; rowIndex <= totalRows; rowIndex += 1) {
      const cellValue = sheet.getRow(rowIndex).getCell(index + 1).value
      const text = cellValue === null || cellValue === undefined
        ? ''
        : String(cellValue)
      if (text.length > maxLength) {
        maxLength = text.length
      }
    }
    columnRef.width = Math.min(Math.max(12, maxLength + 2), 48)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const buildMetaRows = ({ title, scopeLabel, filterSummary }) => {
  const rows = []
  if (title) {
    rows.push([title])
  }
  rows.push(['Tanggal Cetak', formatDateTime(new Date())])
  rows.push(['Cakupan Data', scopeLabel || 'Semua Data'])
  rows.push(['Filter', filterSummary || 'Tidak ada filter'])
  return rows
}
