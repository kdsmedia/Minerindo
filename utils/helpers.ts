export const formatRp = (amount: number): string => {
  if (amount === 0) return 'Rp0';
  return 'Rp' + Math.floor(amount).toLocaleString('id-ID');
};

export const formatRpDecimal = (amount: number): string => {
  return 'Rp' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatHash = (mhs: number): string => {
  if (mhs >= 1000) return (mhs / 1000).toFixed(2) + ' GH/s';
  if (mhs >= 1) return mhs.toFixed(2) + ' MH/s';
  return (mhs * 1000).toFixed(0) + ' KH/s';
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
};

export const formatTimeCountdown = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h > 0 ? String(h).padStart(2, '0') : null,
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');
};

export const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const getReferralCode = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.slice(-6);
};

export const getPhoneEmail = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  return `${cleaned}@minerindo.id`;
};

export const isToday = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

export const secondsUntilEndTime = (endTimeStr: string): number => {
  const end = new Date(endTimeStr).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((end - now) / 1000));
  return diff;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
