export interface MachineConfig {
  id: string;
  name: string;
  quality: string;
  qualityColor: string;
  icon: string;
  price: number;
  durationMinutes: number;
  multiplier: number;
  description: string;
  gradient: readonly [string, string];
}

export interface CoinConfig {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  gradient: readonly [string, string];
  baseHashrateMH: number;
  ratePerSec: number;
  rpPerCoin: number;
  description: string;
}

export const MACHINES: MachineConfig[] = [
  {
    id: 'm1',
    name: 'Starter Rig',
    quality: 'Dasar',
    qualityColor: '#9CA3AF',
    icon: 'laptop',
    price: 25000,
    durationMinutes: 30,
    multiplier: 1.5,
    description: 'Mesin pemula untuk mulai menambang',
    gradient: ['#374151', '#1F2937'],
  },
  {
    id: 'm2',
    name: 'Silver Miner',
    quality: 'Standar',
    qualityColor: '#C0C0C0',
    icon: 'server',
    price: 50000,
    durationMinutes: 60,
    multiplier: 2.5,
    description: 'Performa stabil untuk penambang rutin',
    gradient: ['#6B7280', '#374151'],
  },
  {
    id: 'm3',
    name: 'Gold Digger',
    quality: 'Premium',
    qualityColor: '#F5C518',
    icon: 'cpu-64-bit',
    price: 100000,
    durationMinutes: 120,
    multiplier: 4.0,
    description: 'Kecepatan tinggi dengan efisiensi optimal',
    gradient: ['#D97706', '#92400E'],
  },
  {
    id: 'm4',
    name: 'Diamond Drill',
    quality: 'Elite',
    qualityColor: '#60A5FA',
    icon: 'diamond-stone',
    price: 200000,
    durationMinutes: 240,
    multiplier: 6.0,
    description: 'Mesin elite untuk hasil maksimal',
    gradient: ['#2563EB', '#1E40AF'],
  },
  {
    id: 'm5',
    name: 'Titan Extractor',
    quality: 'Epik',
    qualityColor: '#A855F7',
    icon: 'rocket-launch',
    price: 500000,
    durationMinutes: 480,
    multiplier: 9.0,
    description: 'Kekuatan epik untuk penambang profesional',
    gradient: ['#7C3AED', '#4C1D95'],
  },
  {
    id: 'm6',
    name: 'Quantum Miner',
    quality: 'Legendaris',
    qualityColor: '#F5C518',
    icon: 'atom',
    price: 1000000,
    durationMinutes: 1440,
    multiplier: 15.0,
    description: 'Teknologi kuantum — kekuatan tertinggi',
    gradient: ['#F5C518', '#C8A000'],
  },
];

// Rates: ratePerSec × rpPerCoin = Rp/s at 100% hash
// minRate = 25% → min Rp/s = ratePerSec × rpPerCoin × 0.25
export const COINS: CoinConfig[] = [
  {
    id: 'bara',
    name: 'BARA',
    fullName: 'Batu Bara',
    icon: 'fire',
    color: '#92400E',
    gradient: ['#92400E', '#6B4226'],
    baseHashrateMH: 12,
    ratePerSec: 0.8,
    rpPerCoin: 1,
    description: 'Mineral umum, mudah ditambang',
  },
  {
    id: 'timah',
    name: 'TIMAH',
    fullName: 'Timah',
    icon: 'circle-outline',
    color: '#9CA3AF',
    gradient: ['#6B7280', '#4B5563'],
    baseHashrateMH: 9,
    ratePerSec: 0.5,
    rpPerCoin: 2,
    description: 'Logam industri yang cukup melimpah',
  },
  {
    id: 'perak',
    name: 'PERAK',
    fullName: 'Perak',
    icon: 'star-outline',
    color: '#D1D5DB',
    gradient: ['#9CA3AF', '#6B7280'],
    baseHashrateMH: 7,
    ratePerSec: 0.35,
    rpPerCoin: 5,
    description: 'Logam mulia berharga sedang',
  },
  {
    id: 'minyak',
    name: 'MINYAK',
    fullName: 'Minyak Bumi',
    icon: 'water',
    color: '#374151',
    gradient: ['#1F2937', '#111827'],
    baseHashrateMH: 5,
    ratePerSec: 0.25,
    rpPerCoin: 10,
    description: 'Sumber daya energi berharga tinggi',
  },
  {
    id: 'giok',
    name: 'GIOK',
    fullName: 'Batu Giok',
    icon: 'hexagon',
    color: '#10B981',
    gradient: ['#059669', '#065F46'],
    baseHashrateMH: 3,
    ratePerSec: 0.15,
    rpPerCoin: 20,
    description: 'Batu permata berharga dari alam',
  },
  {
    id: 'emas',
    name: 'EMAS',
    fullName: 'Emas',
    icon: 'star-circle',
    color: '#F5C518',
    gradient: ['#F5C518', '#C8A000'],
    baseHashrateMH: 1.5,
    ratePerSec: 0.06,
    rpPerCoin: 50,
    description: 'Logam paling berharga, langka dan eksklusif',
  },
];

export const APP_CONFIG = {
  name: 'MINERINDO',
  packageName: 'com.altomedia.minerindo',
  developer: 'ALTOMEDIA',
  contact: 'altomediaindonesia@gmail.com',
  whatsapp: 'https://whatsapp.com/channel/0029VbDlYg9HVvTbH0KDRg0R',
  playstore: 'https://play.google.com/store/apps/details?id=com.altomedia.minerindo',
  minWithdrawal: 25000,
  minAdsForWithdrawal: 250,
  referralBonus: 500,
  checkinReward: 50,
  ratingPopupInterval: 10 * 60 * 1000, // 10 minutes in ms
  autoRefreshInterval: 60 * 1000, // 1 minute in ms
  maxWithdrawalPerDay: 1,
  inviteFriendsTask: { required: 10, reward: 2000 },
  rentMachineTask: { reward: 500 },
};
