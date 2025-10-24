document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Referensi Database
    const antrianRef = database.ref('antrian');
    const nomorSekarangRef = database.ref('nomorSedangDipanggil');
    const nomorTerakhirRef = database.ref('nomorTerakhir');

    // Elemen Tampilan
    const mahasiswaView = document.getElementById('mahasiswa-view');
    const adminView = document.getElementById('admin-view');
    const footer = document.querySelector('footer');

    // Elemen Mahasiswa
    const mhsNomorSekarangEl = document.getElementById('mhs-nomor-sekarang');
    const nomorSayaEl = document.getElementById('nomor-saya');
    const daftarAntrianEl = document.getElementById('daftar-antrian');
    const ambilNomorBtn = document.getElementById('ambil-nomor');

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
        footer.classList.remove('hidden'); // Tampilkan footer di halaman mahasiswa
    }

    function showAdminView() {
        mahasiswaView.classList.add('hidden');
        adminView.classList.remove('hidden');
        footer.classList.add('hidden'); // Sembunyikan footer di halaman admin
    }

    adminLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        const password = prompt('Masukkan kata sandi admin:');
        // Kata sandi sederhana untuk demonstrasi. JANGAN GUNAKAN INI DI PRODUKSI.
        if (password === 'babar123') {
            sessionStorage.setItem('isAdmin', 'true');
            showAdminView();
        } else if (password) { // Jika user memasukkan sesuatu tapi salah
            alert('Kata sandi salah!');
        }
    });

    adminLogoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('isAdmin');
        showMahasiswaView();
    });

    // Cek status login saat halaman dimuat
    if (sessionStorage.getItem('isAdmin') === 'true') {
        showAdminView();
    } else {
        showMahasiswaView();
    }

    // --- LISTENER FIREBASE (BERLAKU UNTUK KEDUA TAMPILAN) ---

    nomorSekarangRef.on('value', (snapshot) => {
        const nomor = snapshot.val();
        const teksNomor = nomor ? `A-${nomor}` : '-';
        
        mhsNomorSekarangEl.textContent = teksNomor;
        adminNomorSekarangEl.textContent = teksNomor;

        const nomorSaya = localStorage.getItem('nomorAntrianSaya');
        if (nomor && nomor.toString() === nomorSaya) {
            document.querySelector('.my-number').style.backgroundColor = '#28a745';
            document.querySelector('.my-number p').style.color = 'white';
        }
    });

    antrianRef.on('value', (snapshot) => {
        daftarAntrianEl.innerHTML = '';
        daftarAntrianAdminEl.innerHTML = '';
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const nomor = childSnapshot.val().nomor;
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
    });

    // --- FUNGSI SPESIFIK MAHASISWA ---
    
    ambilNomorBtn.addEventListener('click', () => {
        nomorTerakhirRef.transaction((currentValue) => (currentValue || 0) + 1)
        .then((result) => {
            if (result.committed) {
                const nomorBaru = result.snapshot.val();
                antrianRef.push().set({ nomor: nomorBaru });
                localStorage.setItem('nomorAntrianSaya', nomorBaru);
                nomorSayaEl.textContent = `A-${nomorBaru}`;
                ambilNomorBtn.disabled = true;
                ambilNomorBtn.textContent = "Anda Sudah Mengambil Nomor";
            }
        });
    });

    // Cek local storage saat halaman dimuat
    // INI ADALAH BARIS YANG DIPERBAIKI
    const nomorSayaTersimpan = localStorage.getItem('nomorAntrianSaya');
    if (nomorSayaTersimpan) {
        nomorSayaEl.textContent = `A-${nomorSayaTersimpan}`;
        ambilNomorBtn.disabled = true;
        ambilNomorBtn.textContent = "Anda Sudah Mengambil Nomor";
    }

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
            }
        });
    });

    resetAntrianBtn.addEventListener('click', () => {
        if (confirm('Yakin ingin mereset seluruh data antrian?')) {
            antrianRef.set(null);
            nomorSekarangRef.set(null);
            nomorTerakhirRef.set(0);
            localStorage.removeItem('nomorAntrianSaya');
            alert('Antrian berhasil direset.');
            window.location.reload();
        }
    });
});