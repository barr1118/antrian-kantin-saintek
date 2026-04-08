document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    const googleLoginBtn = document.getElementById('google-login-btn');

    googleLoginBtn.addEventListener('click', () => {
        // Gunakan Google sebagai provider otentikasi
        const provider = new firebase.auth.GoogleAuthProvider();

        // Buka pop-up untuk login
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                // Verifikasi Email
                if (user.email === 'am762638@gmail.com' || user.email.endsWith('@student.ar-raniry.ac.id')) {
                    console.log('Login berhasil:', user);
                    window.location.href = 'index.html';
                } else {
                    auth.signOut().then(() => {
                        alert('Akses Ditolak! Harap gunakan email student UIN Ar-Raniry untuk mengantri.');
                    });
                }
            })
            .catch((error) => {
                // Handle error di sini
                console.error('Login gagal:', error);
                alert('Gagal login: ' + error.message);
            });
    });
});