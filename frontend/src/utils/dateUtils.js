export const getISTDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

export const getISTMonth = () => {
  return getISTDate().slice(0, 7);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ✅ NEW: Format time in IST
export const formatTimeIST = (dateTime) => {
  if (!dateTime) return '—';
  const d = new Date(dateTime);
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// ✅ NEW: Format date and time in IST
export const formatDateTimeIST = (dateTime) => {
  if (!dateTime) return '—';
  const d = new Date(dateTime);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
