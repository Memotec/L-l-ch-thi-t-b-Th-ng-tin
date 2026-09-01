import { EquipmentData } from './types';

export const sampleEquipments: EquipmentData[] = [
  {
    id: 'eq-vhf-t6t-01',
    createdAt: '2014-11-20T08:00:00.000Z',
    updatedAt: '2025-10-24T10:30:00.000Z',
    general: {
      category: 'VHF/UHF',
      name: 'VHF PARK AIR T6T',
      manufacturer: 'PARK AIR',
      model: 'T6T',
      serial: '6U11654',
      assetNo: '10314082501470',
      assetCode: 'VHF-T6T-B9',
      yearMade: '2014',
      origin: 'ENGLAND',
      commissioned: '2014-11-20',
      acceptanceDate: '2014-11-15',
      warrantyDate: '',
      nextCalDate: '2026-10-28',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)',
      estimatedLifespanYears: 15,
      notes: 'Máy phát VHF liên lạc không địa T6T - Tần số 120.9 TxM - B9'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'Đài Thông Tin',
      location: 'Trạm VHF B9 - 120.9 TxM',
      primaryEngineer: 'Kỹ sư Đội Thông Tin',
      phoneContact: '028-3844xxxx',
      supervisor: 'Trưởng Đài Thông Tin',
      coverNote: 'B9 - VHF (120.9 TxM)'
    },
    orgRows: [
      {
        id: 'tr-1',
        date: '2014',
        unit: 'Đài Thông Tin',
        handoverDocNo: 'BB-NTBG-2014',
        status: 'Tốt',
        note: 'Tiếp nhận đưa vào khai thác chính thức'
      }
    ],
    licenses: [
      {
        id: 'lic-1',
        startNo: '373205/GP',
        startDate: '2023-07-01',
        content: 'Giấy phép sử dụng tần số và thiết bị VTĐ (Tần số 120.900 MHz)',
        endDate: '2026-06-30',
        active: true
      },
      {
        id: 'lic-2',
        startNo: '5503/GP-CHK',
        startDate: '2023-10-28',
        content: 'Giấy phép khai thác hệ thống kỹ thuật, thiết bị bảo đảm hoạt động bay',
        endDate: '2026-10-28',
        active: true
      }
    ],
    freqLicenses: [
      { id: 'f-1', no: '220043/GP', expiryDate: '30/06/2016' },
      { id: 'f-2', no: '220044/GP-DP', expiryDate: '30/06/2016' },
      { id: 'f-3', no: '220044/GP-GH', expiryDate: '30/06/2018' },
      { id: 'f-4', no: '220043/GP-GH2', expiryDate: '30/06/2020' },
      { id: 'f-5', no: '220043/GP-GH3', expiryDate: '30/6/2023' },
      { id: 'f-6', no: '220043/GP-GH4', expiryDate: '18/8/2024' },
      { id: 'f-7', no: '373205/GP', expiryDate: '30/06/2026' }
    ],
    exploitLicenses: [
      { id: 'e-1', no: '4380/GP-CHK', expiryDate: '03/11/2016' },
      { id: 'e-2', no: '636/GP-CHK', expiryDate: '21/2/2017' },
      { id: 'e-3', no: '293/GP-CHK', expiryDate: '19/01/2019' },
      { id: 'e-4', no: '5177/GP-CHK', expiryDate: '08/11/2019' },
      { id: 'e-5', no: '4594/GP-CHK', expiryDate: '08/11/2021' },
      { id: 'e-6', no: '4441/GP-CHK', expiryDate: '8/11/2023' },
      { id: 'e-7', no: '5036/GP-CHK', expiryDate: '28/10/2024' },
      { id: 'e-8', no: '5503/GP-CHK', expiryDate: '28/10/2026' }
    ],
    spec: {
      text: 'Liên lạc thoại không địa; điều chế AM; Tần số: VHF; Dải tần 118 – 136.975 MHz; Phân cực đứng; Công suất 50W; Công nghệ bán dẫn; Nguồn điện: AC 220 / 50Hz; DC: 24 – 31V.',
      power: 'AC 220V / 50Hz; DC: 24 - 31V',
      output: 'Công suất 50W',
      range: '118 - 136.975 MHz',
      interface: 'Phân cực đứng, điều chế AM',
      mgmtIp: '192.168.1.50',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      vlanId: 'VLAN 10',
      firmware: 'T6T DSP v4.2',
      snmpCommunity: 'public',
      channelFreq: '120.900 MHz (TxM)'
    },
    components: [
      { id: 'cp-1', no: '01', name: 'VHF Tx Park Air T6T', partNo: 'T6T-50W-TX', serial: '6U11654', unit: 'bộ', qty: '01', healthStatus: 'Tốt', note: 'Máy phát VHF' }
    ],
    docs: [
      { id: 'doc-1', no: '01', name: 'T6T MK6 50W VHF Transmitter User Documentation', qty: '01', format: 'Bản in giấy', lang: 'English', location: 'Tủ hồ sơ kỹ thuật đài', note: 'Tài liệu hướng dẫn sử dụng' }
    ],
    maintenance: [
      {
        id: 'mt-1',
        date: '13/6/15',
        cycle: 'Định kỳ',
        content: '- Vệ sinh thiết bị.\n- Đo tần số phát, công suất phát, VSWR, độ biến điệu.\n- Kiểm tra nguồn cấp AC, DC.\n- Kiểm tra kết nối.',
        measuredParams: 'Thông số P, f, m, VSWR, AC, DC đạt chuẩn',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-2',
        date: '26 - 31/10/2015',
        cycle: 'Định kỳ',
        content: 'Đo thông số thiết bị (P, f, m, VSWR, AC, DC), Kiểm tra kết nối, Vệ sinh tủ thiết bị.',
        measuredParams: 'P=50W, f=120.900MHz, VSWR<1.2',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-3',
        date: '5/4 - 15/4/16',
        cycle: 'Định kỳ',
        content: 'Kiểm tra thông số, kết nối, nguồn. Vệ sinh thiết bị, rack.',
        measuredParams: 'Nguồn AC/DC ổn định, thông số RF tốt',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-4',
        date: '26 - 30/9/16',
        cycle: 'Định kỳ',
        content: 'Kiểm tra thông số, kết nối, nguồn. Vệ sinh thiết bị, rack.',
        measuredParams: 'Thông số đạt yêu cầu',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-5',
        date: '24 - 28/04/17',
        cycle: 'Định kỳ',
        content: 'Kiểm tra thông số, kết nối, nguồn. Vệ sinh thiết bị.',
        measuredParams: 'P=50W, VSWR=1.15',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-6',
        date: '20 - 26/11/2017',
        cycle: 'Định kỳ',
        content: 'Kiểm tra thông số liên lạc thoại, data, kiểm tra các kết nối, vệ sinh.',
        measuredParams: 'Đo kiểm thoại & data đạt chuẩn',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-7',
        date: '07 - 11/05/2018',
        cycle: 'Định kỳ',
        content: 'Kiểm tra thông số liên lạc thoại & data; kiểm tra các kết nối; vệ sinh thiết bị.',
        measuredParams: 'Thông số đạt tiêu chuẩn khai thác',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-8',
        date: '22 - 27/10/2018',
        cycle: 'Định kỳ',
        content: 'Kiểm tra thông số liên lạc thoại, data. Kiểm tra các kết nối. Vệ sinh thiết bị.',
        measuredParams: 'Hoạt động bình thường',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-9',
        date: '22 - 27/10/2019',
        cycle: 'Định kỳ',
        content: 'Kiểm tra thông số, kết nối, vệ sinh thiết bị.',
        measuredParams: 'Thông số tốt',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-10',
        date: '16 - 21/3/2020',
        cycle: 'Định kỳ',
        content: 'Kiểm tra thông số, kết nối, nguồn: OK. Vệ sinh thiết bị & rack: OK.',
        measuredParams: 'Nguồn & thông số RF: OK',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-11',
        date: '05 - 10/10/2020',
        cycle: 'Định kỳ',
        content: 'Các thông số hoạt động đạt tiêu chuẩn kỹ thuật.',
        measuredParams: 'Đạt tiêu chuẩn KT',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-12',
        date: '14 - 17/04/2021',
        cycle: 'Định kỳ',
        content: 'Vệ sinh TB, kiểm tra kết nối, kiểm tra các thông số hoạt động, kiểm tra nguồn điện.',
        measuredParams: 'Nguồn & kết nối tốt',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-13',
        date: '20 - 27/9/2021',
        cycle: 'Định kỳ',
        content: 'Vệ sinh TB, kiểm tra kết nối, kiểm tra các thông số KT, kiểm tra nguồn.',
        measuredParams: 'Thông số KT ổn định',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-14',
        date: '05 - 17/4/2022',
        cycle: 'Định kỳ',
        content: 'Vệ sinh thiết bị, kiểm tra nguồn & kết nối, kiểm tra thông số KT.',
        measuredParams: 'Nguồn & thông số KT: OK',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-15',
        date: '19 - 25/9/2022',
        cycle: 'Định kỳ',
        content: 'Vệ sinh thiết bị: OK. Kiểm tra kết nối, nguồn, thông số KT, chất lượng liên lạc: OK. Thông số hoạt động đạt tiêu chuẩn kỹ thuật.',
        measuredParams: 'Chất lượng liên lạc thoại: Rõ ràng, P=50W',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-16',
        date: '20/3 - 27/3/2023',
        cycle: 'Định kỳ',
        content: 'Vệ sinh thiết bị. Kiểm tra nguồn, kết nối. Kiểm tra thông số KT.',
        measuredParams: 'Thông số kỹ thuật đạt chuẩn',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-17',
        date: '16 - 20/10/2023',
        cycle: 'Định kỳ',
        content: '+ Kiểm tra nguồn, kết nối: OK\n+ Kiểm tra thông số hoạt động: OK\n+ Vệ sinh thiết bị: OK',
        measuredParams: 'Nguồn & RF: OK',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-18',
        date: '25/3 - 7/4/2024',
        cycle: 'Định kỳ',
        content: '+ K/tra thông số hoạt động: OK\n+ K/tra kết nối: OK\n+ Vệ sinh t/bị: OK',
        measuredParams: 'Tất cả mục kiểm tra: OK',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-19',
        date: '23/9 - 6/10/2024',
        cycle: 'Định kỳ',
        content: '+ K/tra thông số hoạt động: OK\n+ KT kết nối: OK\n+ Vệ sinh t/bị: OK',
        measuredParams: 'Hoạt động bình thường',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-20',
        date: '20/3 - 3/4/2025',
        cycle: 'Định kỳ',
        content: '- Ktra thông số + k.nối: OK\n- Vệ sinh t/bị: OK',
        measuredParams: 'Thông số đạt yêu cầu',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      },
      {
        id: 'mt-21',
        date: '9/10 - 24/10/2025',
        cycle: 'Định kỳ',
        content: '- KT thông số, kết nối: OK\n- Vệ sinh: OK',
        measuredParams: 'Hệ thống vận hành an toàn',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      }
    ],
    repair: [
      {
        id: 'rp-1',
        date: '10/10/17',
        resolvedDate: '02/4/19',
        type: 'Sửa chữa khắc phục sự cố',
        incidentDescription: 'Hỏng, đã gửi đi sửa chữa.',
        rootCause: 'Lỗi khối công suất PA',
        actionTaken: 'Gửi về trung tâm sửa chữa chuyên sâu của đơn vị.',
        replacedParts: 'Module PA',
        person: 'Đội TT',
        status: 'Đã xử lý dứt điểm'
      },
      {
        id: 'rp-2',
        date: '02/4/19',
        resolvedDate: '02/4/19',
        type: 'Đưa vào hoạt động',
        incidentDescription: 'Sửa xong, đưa vào hoạt động.',
        rootCause: 'Đã hoàn tất nghiệm thu thử tải',
        actionTaken: 'Lắp đặt lại vào vị trí trạm B9, đo kiểm tra các chỉ tiêu kỹ thuật đạt tiêu chuẩn trước khi đưa vào phát sóng.',
        replacedParts: 'Không',
        person: 'Đội TT',
        status: 'Đã xử lý dứt điểm'
      }
    ]
  },
  {
    id: 'eq-voice-sitti-02',
    createdAt: '2020-03-15T09:00:00.000Z',
    updatedAt: '2024-08-15T14:20:00.000Z',
    general: {
      category: 'VOICE',
      name: 'Hệ thống Chuyển mạch Thoại Không lưu (VCS SITTI M800IP)',
      manufacturer: 'SITTI S.p.A',
      model: 'MULTIFONO M800IP',
      serial: 'SITTI-M800-0492',
      assetNo: '10314082502210',
      assetCode: 'VCS-ACC-NODE-A',
      yearMade: '2020',
      origin: 'ITALY',
      commissioned: '2021-03-15',
      acceptanceDate: '2021-03-01',
      warrantyDate: '2023-03-15',
      nextCalDate: '2026-03-01',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)',
      estimatedLifespanYears: 20,
      notes: 'Hệ thống chuyển mạch thoại không địa (Air-Ground) và liên lạc mặt đất (Ground-Ground)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'Đội Thông Tin',
      location: 'Phòng Thiết bị Trung Tâm Tầng 2 / Dãy Rack 04',
      primaryEngineer: 'Nguyễn Chí Thanh',
      phoneContact: '028-3844xxxx',
      supervisor: 'Đội Trưởng Thông Tin',
      coverNote: 'VCS - M800IP'
    },
    orgRows: [
      {
        id: 'tr-v1',
        date: '2021-03-15',
        unit: 'Đài Thông Tin',
        handoverDocNo: 'BB-NT-VCS-01',
        status: 'Tốt',
        note: 'Tiếp nhận đưa vào khai thác chính thức'
      }
    ],
    licenses: [
      {
        id: 'lic-v1',
        startNo: 'GPHK-VCS-2021',
        startDate: '2021-04-01',
        content: 'Giấy phép khai thác Hệ thống VCS phục vụ điều hành bay',
        endDate: '2026-04-01',
        active: true
      }
    ],
    spec: {
      text: 'Hệ thống chuyển mạch thoại số IP phân tán hoàn toàn (Fully Distributed IP VCS) tuân thủ EUROCAE ED-137B/C. Cấu trúc dự phòng Redundant Dual LAN, bộ vi xử lý Quad-core, card giao tiếp tương tự và số hóa E1/VoIP.',
      power: 'Nguồn đôi Dual AC 220V và Dual DC -48VDC',
      output: 'Công suất tiêu thụ: 450W',
      range: '300Hz - 3400Hz (Narrowband) & 50Hz - 7000Hz (Wideband)',
      interface: 'ED-137B/C VoIP SIP, E1/ISDN PRI, Analogue 2/4 wire E&M',
      mgmtIp: '10.100.20.10',
      subnetMask: '255.255.255.0',
      gateway: '10.100.20.1',
      vlanId: 'VLAN 100',
      firmware: 'M800IP Release 5.4.1',
      snmpCommunity: 'public',
      channelFreq: 'Tích hợp 16 kênh VHF/UHF + 24 luồng Thoại Hotline'
    },
    components: [
      { id: 'cp-v1', no: '01', name: 'Khối xử lý trung tâm (Core Controller Board CCB)', partNo: 'CCB-M800-IP', serial: 'SN-CCB-1102', unit: 'Card', qty: '02', healthStatus: 'Tốt', note: 'Chế độ Hot-Standby 1+1' },
      { id: 'cp-v2', no: '02', name: 'Card giao tiếp Radio ED-137 IP (RIB-IP)', partNo: 'RIB-IP-8C', serial: 'SN-RIB-8840', unit: 'Card', qty: '04', healthStatus: 'Tốt', note: 'Mỗi card 8 kênh Radio' }
    ],
    docs: [
      { id: 'doc-v1', no: '01', name: 'SITTI M800IP System Architecture & Maintenance Guide', qty: '01', format: 'Bản in giấy', lang: 'English', location: 'Tủ tài liệu đài', note: 'Tài liệu gốc nhà sản xuất' }
    ],
    maintenance: [
      {
        id: 'mt-v1',
        date: '15/05/2023',
        cycle: 'Định kỳ',
        content: 'Kiểm tra trạng thái các card giao tiếp, đo độ trễ mạng LAN A/B, vệ sinh quạt làm mát.',
        measuredParams: 'Ping RTT < 1ms, không nghẽn thoại',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Đội TT'
      }
    ],
    repair: []
  }
];

export function createEmptyEquipment(): EquipmentData {
  const newId = `eq-${Date.now()}`;
  return {
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    general: {
      category: 'VHF/UHF',
      name: '',
      manufacturer: '',
      model: '',
      serial: '',
      assetNo: '',
      assetCode: '',
      yearMade: '',
      origin: '',
      commissioned: '',
      acceptanceDate: '',
      warrantyDate: '',
      nextCalDate: '',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)',
      estimatedLifespanYears: 15,
      notes: ''
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: '',
      location: '',
      primaryEngineer: '',
      phoneContact: '',
      supervisor: '',
      coverNote: ''
    },
    orgRows: [],
    licenses: [],
    freqLicenses: [],
    exploitLicenses: [],
    spec: {
      text: '',
      power: '',
      output: '',
      range: '',
      interface: '',
      mgmtIp: '',
      subnetMask: '',
      gateway: '',
      vlanId: '',
      firmware: '',
      snmpCommunity: '',
      channelFreq: ''
    },
    components: [],
    docs: [],
    maintenance: [],
    repair: []
  };
}

export function cloneEquipment(source: EquipmentData): EquipmentData {
  const cloned: EquipmentData = JSON.parse(JSON.stringify(source));
  cloned.id = `eq-${Date.now()}`;
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = new Date().toISOString();
  cloned.general.name = `${source.general.name} (Bản sao/Dự phòng)`;
  if (cloned.general.serial) cloned.general.serial += '-CLONE';
  if (cloned.general.assetNo) cloned.general.assetNo += '-BK';
  cloned.general.status = 'Dự phòng sẵn sàng';
  return cloned;
}
