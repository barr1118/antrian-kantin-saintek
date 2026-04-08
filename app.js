document.addEventListener('DOMContentLoaded', () => {


    const ADMIN_EMAIL = "am762638@gmail.com";


    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();


    const antrianRef = database.ref('antrian');
    const nomorSekarangRef = database.ref('nomorSedangDipanggil');
    const nomorTerakhirRef = database.ref('nomorTerakhir');


    auth.onAuthStateChanged((user) => {
        if (user) {
            // Validasi domain untuk perlindungan ganda (jika ada yang membypass login.html)
            if (user.email === ADMIN_EMAIL || user.email.endsWith('@student.ar-raniry.ac.id')) {
                console.log('Pengguna terdeteksi:', user.email);
                runApp(user);
            } else {
                alert('Akses Ditolak! Anda wajib menggunakan email Student UIN Ar-Raniry untuk mengantri.');
                auth.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            }
        } else {

            console.log('Tidak ada pengguna, mengarahkan ke login.html');
            window.location.href = 'login.html';
        }
    });


    function runApp(user) {

        const mahasiswaView = document.getElementById('mahasiswa-view');
        const adminView = document.getElementById('admin-view');


        const userInfoMhs = document.getElementById('user-info-mhs');
        const logoutBtnMhs = document.getElementById('logout-btn-mhs');
        const userInfoAdmin = document.getElementById('user-info-admin');
        const logoutBtnAdmin = document.getElementById('logout-btn-admin');


        const mhsNomorSekarangEl = document.getElementById('mhs-nomor-sekarang');
        const nomorSayaEl = document.getElementById('nomor-saya');
        const daftarAntrianEl = document.getElementById('daftar-antrian');
        const ambilNomorBtn = document.getElementById('ambil-nomor');
        const myNumberCard = document.querySelector('.my-number');


        const adminNomorSekarangEl = document.getElementById('admin-nomor-sekarang');
        const daftarAntrianAdminEl = document.getElementById('daftar-antrian-admin');
        const panggilSelanjutnyaBtn = document.getElementById('panggil-selanjutnya');
        const resetAntrianBtn = document.getElementById('reset-antrian');


        if (user.email === ADMIN_EMAIL) {
            adminView.classList.remove('hidden');
            mahasiswaView.classList.add('hidden');
            userInfoAdmin.textContent = `Admin: ${user.displayName || user.email}`;
        } else {
            mahasiswaView.classList.remove('hidden');
            adminView.classList.add('hidden');
            userInfoMhs.textContent = `Halo, ${user.displayName || user.email}`;
        }


        function handleLogout() {
            auth.signOut().then(() => {
                console.log('Logout berhasil');

            });
        }
        logoutBtnMhs.addEventListener('click', handleLogout);
        logoutBtnAdmin.addEventListener('click', handleLogout);




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
                myNumberCard.style.background = 'rgba(255, 255, 255, 0.75)';
                myNumberCard.querySelector('p').style.color = '#4F46E5';
            }
        }

        nomorSekarangRef.on('value', (snapshot) => {
            const nomor = snapshot.val();
            const teksNomor = nomor ? `A-${nomor}` : '-';
            mhsNomorSekarangEl.textContent = teksNomor;
            adminNomorSekarangEl.textContent = teksNomor;
            const myStoredNumber = localStorage.getItem('nomorAntrianSaya');
            if (myStoredNumber && (nomor && nomor.toString() === myStoredNumber)) {
                myNumberCard.style.background = 'linear-gradient(135deg, #34d399, #10b981)';
                myNumberCard.querySelector('p').style.color = 'white';
            } else {
                myNumberCard.style.background = 'rgba(255, 255, 255, 0.75)';
                myNumberCard.querySelector('p').style.color = '#4F46E5';
            }
            updateMahasiswaUIState();
        });

        antrianRef.on('value', (snapshot) => {
            daftarAntrianEl.innerHTML = '';
            daftarAntrianAdminEl.innerHTML = '';
            const currentQueueNumbers = [];
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
            const myStoredNumber = localStorage.getItem('nomorAntrianSaya');
            const currentServingNumber = mhsNomorSekarangEl.textContent.replace('A-', '') || null;
            if (myStoredNumber && myStoredNumber !== currentServingNumber && !currentQueueNumbers.includes(myStoredNumber)) {
                localStorage.removeItem('nomorAntrianSaya');
            }
            updateMahasiswaUIState();
        });

        ambilNomorBtn.addEventListener('click', () => {
            nomorTerakhirRef.transaction((currentValue) => (currentValue || 0) + 1)
                .then((result) => {
                    if (result.committed) {
                        const nomorBaru = result.snapshot.val();
                        antrianRef.push().set({ nomor: nomorBaru });
                        localStorage.setItem('nomorAntrianSaya', nomorBaru.toString());
                        updateMahasiswaUIState();
                    }
                });
        });

        updateMahasiswaUIState();

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
                    nomorSekarangRef.set(null);
                }
            });
        });

        resetAntrianBtn.addEventListener('click', () => {
            if (confirm('Yakin ingin mereset seluruh data antrian?')) {
                antrianRef.set(null);
                nomorSekarangRef.set(null);
                nomorTerakhirRef.set(0);
                alert('Antrian berhasil direset.');
            }
        });
    }
});