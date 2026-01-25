import { loginAdmin } from './api.js';

const form = document.querySelector('.login-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if(!email || !password) {
        alert('Введите email и пароль!');
        return;
    };
    loginAdmin(email, password)
    .then(data => {
        window.location.href = '/shfe-diplom/html/admin-index.html';
        // window.location.href = '../html/admin-index.html';

    })
    .catch(error => {
        alert(error.message);
    });
});