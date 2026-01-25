import {getHallConfig} from "./api.js";

document.addEventListener('DOMContentLoaded', () => {
    loadHall();
    renderFilmInfo();
});
const standartPrice = Number(localStorage.getItem('hallPriceStandart'));
const vipPrice = Number(localStorage.getItem('hallPriceVip'));

document.getElementById('standart-price').innerText = standartPrice;
document.getElementById('vip-price').innerText = vipPrice;

const seanceId = localStorage.getItem('seanceId');
const date = localStorage.getItem('date');
let selectedSeats = [];
if (!seanceId || !date) {
    alert('Нет данных о сеансе');
    location.href = '/shfe-diplom/index.html';
    // location.href = '../index.html';
}

async function loadHall() {
    try {
        const data = await getHallConfig(seanceId, date);

        if (!data.success) {
            throw new Error('Ошибка сервера');
        }

        renderHall(data.result);
    } catch (err) {
        console.error(err);
        alert('Ошибка загрузки зала');
    }
}

function renderHall(config) {
    const container = document.getElementById('seats-container');
    container.innerHTML = '';

    config.forEach((row, rowIndex) => {
        const rowEl = document.createElement('div');
        rowEl.classList.add('seats-row');

        row.forEach((seatType, seatIndex) => {
            const seat = document.createElement('div');
            seat.classList.add('seat');

            seat.dataset.row = rowIndex + 1;
            seat.dataset.place = seatIndex + 1;

            if (seatType === 'standart') seat.classList.add('seat-standart');
            if (seatType === 'vip') seat.classList.add('seat-vip');
            if (seatType === 'taken') seat.classList.add('seat-taken');
            if (seatType === 'disabled') seat.classList.add('seat-disabled');

            if (seatType === 'standart' || seatType === 'vip') {
                seat.addEventListener('click', () => toggleSeat(
                    seat,
                    seatType,
                    rowIndex + 1,
                    seatIndex + 1
                ));
            }

            rowEl.appendChild(seat);
        });

        container.appendChild(rowEl);
    });
}

const bookingBtn = document.querySelector('.btn-booking');

bookingBtn.addEventListener('click', () => {
    if (selectedSeats.length === 0) {
        alert('Выберите хотя бы одно место');
        return;
    }

    const bookingData = {
        seanceId: localStorage.getItem('seanceId'),
        filmName: document.querySelector('.film-name').textContent,
        hallName: document.querySelector('.film-hall').textContent,
        seanceTime: document.getElementById('film-time').textContent,
        date: localStorage.getItem('date'),
        seats: selectedSeats,
        totalPrice: calculateTotalPrice()
    };

    localStorage.setItem('bookingData', JSON.stringify(bookingData));

    window.location.href = '/shfe-diplom/html/client-payment.html';
    // window.location.href = '../html/client-payment.html';
});

function calculateTotalPrice() {
    return selectedSeats.reduce((sum, seat) => sum + seat.coast, 0);
};


function toggleSeat(seat) {
    const row = Number(seat.dataset.row);
    const place = Number(seat.dataset.place);
    const seatType = seat.classList.contains('seat-vip') ? 'vip' : 'standart';

    const index = selectedSeats.findIndex(
        s => s.row === row && s.place === place
    );

    if (index >= 0) {
        selectedSeats.splice(index, 1);
        seat.classList.remove('selected-seat');
    } else {
        const coast = seatType === 'vip' ? vipPrice : standartPrice;
        selectedSeats.push({ row, place, coast });
        seat.classList.add('selected-seat');
    }
}

function renderFilmInfo() {
    const filmName = localStorage.getItem('filmName');
    const hallName = localStorage.getItem('hallName');
    const seanceTime = localStorage.getItem('seanceTime');
    if(!filmName || !hallName || !seanceTime) {
        alert('Нет данных о фильме.')
        return;
    }
    document.querySelector('.film-name').textContent = filmName;
    document.querySelector('.film-hall').textContent = hallName;
    document.getElementById('film-time').textContent = seanceTime;
};