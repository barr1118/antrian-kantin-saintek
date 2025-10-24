document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Referensi Database
    const antrianRef = database.ref('antrian');
    const nomorSekarangRef = database.ref('nomorSedangDipanggil');
    const nomorTerakhirRef = database.ref('nomorTerakhir'); // Perlu diperhatikan

    // Elemen Tampilan
    const mahasiswaView = document.getElementById('mahasiswa-view');
    const adminView = document.getElementById('admin-view');
    const footer = document.querySelector('footer');

    // Elemen Mahasiswa
    const mhsNomorSekarangEl = document.getElementById('mhs-nomor-sekarang');
    const nomorSayaEl = document.getElementById('nomor-saya');
    const daftarAntrianEl = document.getElementById('daftar-antrian');
    const ambilNomorBtn = document.getElementById('ambil-nomor');
    const myNumberCard = document.querySelector('.my-number'); // Untuk highlight

    // Elemen Admin
    const adminNomorSekarangEl = document.getElementById('admin-nomor-sekarang');
    const daftarAntrianAdminEl = document.getElementById('daftar-antrian-admin');
    const panggilSelanjutnyaBtn = document.getElementById('panggil-selanjutnya');
    const resetAntrianBtn = document.getElementById('reset-antrian');

    // Elemen Login/Logout
    const adminLoginLink = document.getElementById('admin-login-link');
    const adminLogoutLink = document.getElementById('admin-logout-link');

    // --- LOGIKA PERALIHAN TAMPILAN ---

    function showMahasiswaView() {
        mahasiswaView.classList.remove('hidden');
        adminView.classList.add('hidden');
        footer.classList.remove('hidden');
    }

    function showAdminView() {
        mahasiswaView.classList.add('hidden');
        adminView.classList.remove('hidden');
        footer.classList.add('hidden');
    }

    adminLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        const password = prompt('Masukkan kata sandi admin:');
        if (password === 'babar123') {
            sessionStorage.setItem('isAdmin', 'true');
            showAdminView();
        } else if (password !== null) { // Jika user menekan OK tapi password salah
            alert('Kata sandi salah!');
        }
    });

    adminLogoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('isAdmin');
        showMahasiswaView();
    });

    if (sessionStorage.getItem('isAdmin') === 'true') {
        showAdminView();
    } else {
        showMahasiswaView();
    }

    // --- FUNGSI BANTU UNTUK UPDATE UI MAHASISWA ---
    function updateMahasiswaUIState() {
        const myStoredNumber = localStorage.getItem('nomorAntrianSaya');
        if (myStoredNumber) {
            nomorSayaEl.textContent = `A-${myStoredNumber}`;
            ambilNomorBtn.disabled = true;
            ambilNomorBtn.textContent = "Anda Sudah Mengambil Nomor";
        } else {
            nomorSayaEl.textContent = '-';
            ambilNomorBtn.disabled = false;
            ambilNomorBtn.textContent = "Ambil Nomor Antrian";
            // Pastikan tidak ada highlight jika tidak ada nomor
            myNumberCard.style.backgroundColor = '#f9f9f9';
            myNumberCard.querySelector('p').style.color = '#007bff';
        }
    }

    // --- LISTENER FIREBASE ---

    // Listener untuk nomor yang sedang dipanggil
    nomorSekarangRef.on('value', (snapshot) => {
        const nomor = snapshot.val();
        const teksNomor = nomor ? `A-${nomor}` : '-';
        
        mhsNomorSekarangEl.textContent = teksNomor;
        adminNomorSekarangEl.textContent = teksNomor;

        const myStoredNumber = localStorage.getItem('nomorAntrianSaya');
        if (myStoredNumber && (nomor && nomor.toString() === myStoredNumber)) {
            // Jika nomor kita sedang dipanggil
            myNumberCard.style.backgroundColor = '#28a745';
            myNumberCard.querySelector('p').style.color = 'white';
            // Notifikasi suara (opsional)
            // new Audio('notif.mp3').play();
        } else {
            // Jika nomor kita bukan yang sedang dipanggil, hilangkan highlight
            myNumberCard.style.backgroundColor = '#f9f9f9';
            myNumberCard.querySelector('p').style.color = '#007bff';
        }
        updateMahasiswaUIState(); // Panggil ini untuk sinkronisasi tombol
    });

    // Listener untuk daftar antrian
    antrianRef.on('value', (snapshot) => {
        daftarAntrianEl.innerHTML = '';
        daftarAntrianAdminEl.innerHTML = '';
        
        const currentQueueNumbers = []; // Untuk mengecek apakah nomor saya masih ada di antrian
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const nomor = childSnapshot.val().nomor;
                currentQueueNumbers.push(nomor.toString());

                const liMhs = document.createElement('li');
                const liAdmin = document.createElement('li');
                
                liMhs.textContent = `A-${nomor}`;
                liAdmin.textContent = `A-${nomor}`;
                
                daftarAntrianEl.appendChild(liMhs);
                daftarAntrianAdminEl.appendChild(liAdmin);
            });
        } else {
            daftarAntrianEl.innerHTML = '<li>Antrian kosong</li>';
            daftarAntrianAdminEl.innerHTML = '<li>Tidak ada antrian.</li>';
        }

        // Sinkronisasi status nomor saya setelah daftar antrian diupdate
        const myStoredNumber = localStorage.getItem('nomorAntrianSaya');
        const currentServingNumber = mhsNomorSekarangEl.textContent.replace('A-', '') || null;

        // Kondisi untuk menghapus nomor saya dari local storage:
        // 1. Saya punya nomor di localStorage.
        // 2. Nomor saya TIDAK SEDANG DIPANGGIL.
        // 3. Nomor saya TIDAK ADA DALAM DAFTAR ANTRIAN YANG MASIH AKTIF.
        if (myStoredNumber && 
            myStoredNumber !== currentServingNumber &&
            !currentQueueNumbers.includes(myStoredNumber)) {
            
            localStorage.removeItem('nomorAntrianSaya');
        }
        updateMahasiswaUIState(); // Panggil ini untuk sinkronisasi tombol
    });

    // --- FUNGSI SPESIFIK MAHASISWA ---
    
    ambilNomorBtn.addEventListener('click', () => {
        nomorTerakhirRef.transaction((currentValue) => (currentValue || 0) + 1)
        .then((result) => {
            if (result.committed) {
                const nomorBaru = result.snapshot.val();
                antrianRef.push().set({ nomor: nomorBaru });
                localStorage.setItem('nomorAntrianSaya', nomorBaru.toString()); // Simpan sebagai string
                updateMahasiswaUIState(); // Update UI setelah mengambil nomor
            }
        });
    });

    // Panggil saat DOM dimuat untuk mengatur status awal
    updateMahasiswaUIState(); 

    // --- FUNGSI SPESIFIK ADMIN ---

    panggilSelanjutnyaBtn.addEventListener('click', () => {
        antrianRef.orderByKey().limitToFirst(1).once('value', (snapshot) => {
            if (snapshot.exists()) {
                let keyToDelete, nomorToCall;
                snapshot.forEach((child) => {
                    keyToDelete = child.key;
                    nomorToCall = child.val().nomor;
                });
                nomorSekarangRef.set(nomorToCall);
                antrianRef.child(keyToDelete).remove();
            } else {
                alert('Antrian sudah kosong!');
                nomorSekarangRef.set(null); // Pastikan nomor sedang dipanggil kosong
            }
        });
    });

    resetAntrianBtn.addEventListener('click', () => {
        if (confirm('Yakin ingin mereset seluruh data antrian? Aksi ini tidak bisa dibatalkan!')) {
            antrianRef.set(null);
            nomorSekarangRef.set(null);
            nomorTerakhirRef.set(0); // Reset nomor terakhir ke 0
            
            // Tidak perlu removeItem('nomorAntrianSaya') di sini karena akan ditangani
            // oleh listener antrianRef.on('value') di sisi klien semua pengguna.
            
            alert('Antrian berhasil direset.');
        }
    });
});