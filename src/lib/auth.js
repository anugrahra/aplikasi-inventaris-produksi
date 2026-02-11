// File ini khusus logika Admin (RBAC)
// Satu sumber kebenaran (DRY Principle)

export const isAdmin = (email) => {
  const adminEmails = [
    'dialog.anugrah@gmail.com'
  ];
  
  // Pastikan email ada isinya, baru cek daftar
  return email && adminEmails.includes(email);
};