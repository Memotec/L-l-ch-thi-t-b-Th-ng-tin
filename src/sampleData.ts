import { EquipmentData } from './types';

export function createEmptyEquipment(category = 'VHF/UHF', name = 'Thiết bị kỹ thuật mới'): EquipmentData {
  return {
    id: 'eq-' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    general: {
      category: category as any,
      name,
      manufacturer: 'Chưa rõ',
      model: 'Chưa rõ',
      serial: 'SN-' + Math.floor(Math.random() * 89999 + 10000),
      assetNo: 'TSN-TB-' + Math.floor(Math.random() * 899 + 100),
      assetCode: 'TB-' + Math.floor(Math.random() * 8999 + 1000),
      yearMade: '2023',
      origin: 'Việt Nam',
      commissioned: new Date().toISOString().split('T')[0],
      acceptanceDate: new Date().toISOString().split('T')[0],
      warrantyDate: new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
      nextCalDate: new Date(Date.now() + 180*24*3600*1000).toISOString().split('T')[0],
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)',
      estimatedLifespanYears: 10,
      notes: 'Thiết bị mới tạo'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'Đài Kỹ thuật',
      location: 'Phòng máy',
      primaryEngineer: 'Kỹ thuật viên',
      phoneContact: '0900000000',
      supervisor: 'Trưởng đài',
      coverNote: 'Sổ lý lịch thiết bị'
    },
    orgRows: [],
    licenses: [],
    freqLicenses: [],
    exploitLicenses: [],
    spec: {
      text: 'Thông số kỹ thuật mặc định',
      power: '220V / 24V',
      output: 'Tiêu chuẩn',
      range: 'Theo thiết kế nhà sản xuất',
      interface: 'RJ45 / BNC',
      mgmtIp: '10.10.10.10',
      subnetMask: '255.255.255.0',
      gateway: '10.10.10.1',
      vlanId: '100',
      firmware: 'v1.0',
      snmpCommunity: 'public',
      channelFreq: '118.000 MHz'
    },
    components: [],
    docs: [],
    maintenance: [],
    repair: []
  };
}

export const sampleEquipments: EquipmentData[] = [

  {
    id: 'eq-vhf-01',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2026-01-10T10:30:00Z',
    general: {
      category: 'VHF/UHF',
      name: 'Đài thu phát VHF chính - Trạm Tân Sơn Nhất',
      manufacturer: 'Jotron',
      model: 'TR-7750',
      serial: 'JT-99214',
      assetNo: 'TSN-VHF-01',
      assetCode: 'TB-VHF-2023-01',
      yearMade: '2022',
      origin: 'Na Uy',
      commissioned: '2023-02-10',
      acceptanceDate: '2023-02-05',
      warrantyDate: '2025-02-10',
      nextCalDate: '2026-06-15',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)',
      estimatedLifespanYears: 10,
      notes: 'Đài chính phục vụ điều hành bay khu vực tiếp cận TSN.'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'Đài Kỹ thuật Trạm Ra-đa / VHF TSN',
      location: 'Phòng máy VHF - Tòa nhà Khai thác TNS',
      primaryEngineer: 'Nguyễn Văn An',
      phoneContact: '0903123456',
      supervisor: 'Trần Văn Bình',
      coverNote: '120.9 MHz - Kênh tiếp cận'
    },
    orgRows: [
      {
        id: 'org-1',
        date: '2023-02-10',
        unit: 'Đài Kỹ thuật TSN',
        handoverDocNo: '128/QĐ-KTTN',
        status: 'Bàn giao đưa vào khai thác chính thức',
        note: 'Đầy đủ phụ kiện theo hợp đồng'
      }
    ],
    licenses: [
      {
        id: 'lic-1',
        startNo: 'GP-VHF-2023/01',
        startDate: '2023-01-01',
        content: 'Giấy phép sử dụng tần số vô tuyến điện đài hàng không',
        endDate: '2028-01-01',
        active: true
      }
    ],
    freqLicenses: [
      { id: 'f1', no: '120.9 MHz', expiryDate: '2028-01-01' }
    ],
    exploitLicenses: [
      { id: 'e1', no: 'GP Khai thác số 456/CAV', expiryDate: '2028-01-01' }
    ],
    spec: {
      text: 'Đài phát thanh VHF băng tần hàng không 118-137 MHz, công suất phát 50W, độ nhạy thu cao.',
      power: '50W',
      output: '50 Ohm BNC',
      range: '100 Hải lý',
      interface: 'Ethernet RJ45, E1, Analog Audio',
      mgmtIp: '10.10.50.21',
      subnetMask: '255.255.255.0',
      gateway: '10.10.50.1',
      vlanId: '120',
      firmware: 'v4.12.1',
      snmpCommunity: 'public_tsn',
      channelFreq: '120.900 MHz'
    },
    components: [
      { id: 'c1', no: 1, name: 'Bo mạch thu (Receiver Module)', partNo: 'RX-77-B', serial: 'RX-991', unit: 'Cái', qty: 1, healthStatus: 'Tốt', note: 'Hoạt động ổn định' },
      { id: 'c2', no: 2, name: 'Bo mạch phát (Transmitter Module)', partNo: 'TX-77-50', serial: 'TX-992', unit: 'Cái', qty: 1, healthStatus: 'Tốt', note: 'Công suất chuẩn 50W' },
      { id: 'c3', no: 3, name: 'Khối nguồn AC/DC', partNo: 'PSU-77', serial: 'PSU-441', unit: 'Cái', qty: 1, healthStatus: 'Tốt', note: 'Tích hợp acquy dự phòng' }
    ],
    docs: [
      { id: 'd1', no: 1, name: 'Sổ tay Vận hành & Bảo dưỡng (User Manual)', qty: 1, format: 'Cả hai', lang: 'Tiếng Anh', location: 'Tủ tài liệu kỹ thuật TSN', note: 'Bản gốc' },
      { id: 'd2', no: 2, name: 'Sơ đồ khối nguyên lý điện tử (Schematic)', qty: 2, format: 'Bản điện tử (PDF/CAD)', lang: 'Tiếng Anh', location: 'Máy chủ kỹ thuật', note: 'Bản scan màu' }
    ],
    maintenance: [
      {
        id: 'm1',
        date: '2026-01-05',
        cycle: 'Hàng tháng',
        content: 'Kiểm tra công suất phát, độ nhạy thu, điện áp nguồn và hệ thống ăng-ten feeder',
        measuredParams: 'SWR: 1.05, Power: 50.2W, Sensitivity: -107dBm',
        result: 'Đạt yêu cầu kỹ thuật',
        person: 'Nguyễn Văn An',
        supervisor: 'Trần Văn Bình'
      }
    ],
    repair: [
      {
        id: 'r1',
        date: '2025-05-12',
        resolvedDate: '2025-05-12',
        type: 'Bảo trì ngăn ngừa',
        incidentDescription: 'Vệ sinh quạt tản nhiệt khối nguồn và kiểm tra đầu giắc kết nối ăng-ten',
        rootCause: 'Bụi bám do vận hành lâu ngày',
        actionTaken: 'Thổi bụi, vệ sinh contact cleaner, siết lại đầu giắc N-type',
        replacedParts: 'Không thay thế linh kiện',
        person: 'Nguyễn Văn An',
        status: 'Đã xử lý dứt điểm'
      }
    ]
  },
  {
    id: 'eq-viba-02',
    createdAt: '2023-03-20T08:00:00Z',
    updatedAt: '2026-02-01T14:00:00Z',
    general: {
      category: 'VIBA',
      name: 'Hệ thống Viba số bước sóng cao TSN - Vũng Tàu',
      manufacturer: 'NEC',
      model: 'PASOLINK Neo',
      serial: 'NEC-88392',
      assetNo: 'TSN-VB-02',
      assetCode: 'TB-VB-2023-02',
      yearMade: '2021',
      origin: 'Nhật Bản',
      commissioned: '2023-04-01',
      acceptanceDate: '2023-03-28',
      warrantyDate: '2024-04-01',
      nextCalDate: '2026-08-20',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)',
      estimatedLifespanYears: 12,
      notes: 'Đường truyền Viba dữ liệu radar và thoại chính.'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'Đài Kỹ thuật Viba - Viba Tháp',
      location: 'Trạm Viba Vũng Tàu',
      primaryEngineer: 'Phạm Hồng Thái',
      phoneContact: '0918234567',
      supervisor: 'Lê Hoàng Long',
      coverNote: 'Đường truyền trục TSN - VT'
    },
    orgRows: [],
    licenses: [
      {
        id: 'lic-2',
        startNo: 'GP-VB-992',
        startDate: '2023-01-01',
        content: 'Giấy phép tần số Viba điểm-điểm',
        endDate: '2027-12-31',
        active: true
      }
    ],
    freqLicenses: [{ id: 'f2', no: '7.5 GHz Band', expiryDate: '2027-12-31' }],
    exploitLicenses: [{ id: 'e2', no: 'GP Viba 112/CAV', expiryDate: '2027-12-31' }],
    spec: {
      text: 'Thiết bị Viba số dung lượng cao 16E1 + GbE, tần số 7GHz.',
      power: '24V DC',
      output: '+20dBm',
      range: '45 Km',
      interface: 'Optical SFP, GbE, E1',
      mgmtIp: '10.10.60.10',
      subnetMask: '255.255.255.0',
      gateway: '10.10.60.1',
      vlanId: '200',
      firmware: 'v3.0.4',
      snmpCommunity: 'public_viba',
      channelFreq: '7500 MHz'
    },
    components: [
      { id: 'cp1', no: 1, name: 'IDU Chassis', partNo: 'NEC-IDU-100', serial: 'IDU-552', unit: 'Cái', qty: 1, healthStatus: 'Tốt', note: 'Chạy ổn định' }
    ],
    docs: [
      { id: 'dc1', no: 1, name: 'Tài liệu cấu hình Viba NEC', qty: 1, format: 'Bản điện tử (PDF/CAD)', lang: 'Tiếng Anh', location: 'Server Kỹ thuật', note: 'Đầy đủ' }
    ],
    maintenance: [],
    repair: []
  }
];
