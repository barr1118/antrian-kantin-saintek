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
                // Login berhasil, arahkan ke halaman utama
                console.log('Login berhasil:', result.user);
                window.location.href = 'index.html';
            })
            .catch((error) => {
                // Handle error di sini
                console.error('Login gagal:', error);
                alert('Gagal login: ' + error.message);
            });
    });
});