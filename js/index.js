import { getAllData } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    renderDates();
    loadPage();
});

async function loadPage() {
    try {
        const data = await getAllData();
        renderFilms(data);
    } catch (error) {
        console.error(error);
    }
};

const filmsList = document.getElementById('films-list');

function renderFilms({films, halls, seances}) {
    filmsList.innerHTML = '';
    
    films.forEach(film => {
        const filmSeances = seances.filter(s => s.seance_filmid === film.id);
        const filmElement = document.createElement('div');
        filmElement.classList.add('film-item');
        filmElement.innerHTML = `
            <div class="film-item-el">
                <div class="film-info">
                    <img class="film-image" src="${film.film_poster}" alt="Постер">
                    <div class="film-description">
                        <div class="film-name">
                            <h4>${film.film_name}</h4>
                        </div>
                        <div class="film-text">
                            <p>${film.film_description}</p>
                        </div>
                        <div class="film-dopinfo">
                            <div class="film-time">
                                <p>${film.film_duration} минут</p>
                            </div>
                            <div class="film-country">
                                <p>${film.film_origin}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="film-halls">
                    ${renderHalls(halls, filmSeances, film)}
                </div>
            </div>
            `;
        filmsList.appendChild(filmElement);
    })
};

function renderHalls(halls, seances, film) {
    let html = '';
    halls.forEach(hall => {
        const hallSeances = seances.filter(s => s.seance_hallid === hall.id);
        if(hallSeances.length === 0) return;
        html += `
            <div class="hall">
                <p>${hall.hall_name}</p>
            </div>
            <div class="time-list">
              ${hallSeances.map(seance => {  
            const isPast = isSeancePast(seance.seance_time);
            return `
                    <button 
                        class="time-item ${isPast ? 'disabled' : ''}"   
                        data-seance-id="${seance.id}"
                        data-seance-time="${seance.seance_time}"
                        data-film-name="${film.film_name}"
                        data-hall-id="${hall.id}"
                        data-hall-name="${hall.hall_name}"
                        data-hall-price-standart="${hall.hall_price_standart}"
                        data-hall-price-vip="${hall.hall_price_vip}"
                        ${isPast ? 'disabled' : ''}>
                        ${seance.seance_time}
                    </button>
                `}).join('')}
            </div>
        `;
    });
    return html;
}

function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

let startDate = new Date();
let selectedDate = getTodayDate();

function formatDate(date) {
    return date.toISOString().split('T')[0];
};

const datesList = document.querySelector('.dates-list');

function renderDates() {
    datesList.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if(startDate > today) {
        const leftArrow = document.createElement('div');
        leftArrow.className = 'date-item arrow';
        leftArrow.innerHTML = `
            <svg width="10" height="14" viewBox="0 0 10 14">
                <path d="M8.18 0L0.28 6.64L8.18 13.3L10 11.45L4.2 6.67L10 1.85L8.18 0Z"/>
            </svg>
        `;
        leftArrow.addEventListener('click', () => {
            startDate.setDate(startDate.getDate() - 7);
            renderDates();
        });
        datesList.appendChild(leftArrow);
    }

    for(let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const isoDate = formatDate(date);
        const dayNumber = date.getDate();
        const dayOfWeek = date.getDay();
        const weekdaysShort = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const weekdayName = weekdaysShort[dayOfWeek];
        const dateEl = document.createElement('div');
        let topText, bottomText;

        if(isoDate === getTodayDate()) {
            topText = 'Сегодня';
            bottomText = `${weekdayName}, ${dayNumber}`;
        } else {
            topText = weekdayName + ',';
            bottomText = dayNumber.toString();
        }

        dateEl.className = 'date-item';
        if(dayOfWeek === 0 || dayOfWeek === 6) {
            dateEl.classList.add("weekend")
        } 

        if(isoDate === selectedDate) {
            dateEl.classList.add('active');
        }

        dateEl.innerHTML = `
            <p class="today">${topText}</p>
            <p>${bottomText}</p>
        `;

        dateEl.addEventListener('click', () => {
            selectedDate = isoDate;
            renderDates();
            loadPage();
        })
        datesList.appendChild(dateEl);
    } 
    renderArrow();
};

function renderArrow() {
    const arrow = document.createElement('div');
    arrow.className = 'date-item arrow';
    arrow.innerHTML = `
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none"
             xmlns="http://www.w3.org/2000/svg">
            <path d="M1.81641 0L9.71484 6.64453L1.81641 13.3008L0 11.4492L5.80078 6.66797L0 1.85156L1.81641 0Z" fill="black"/>
        </svg>
    `;
    arrow.addEventListener('click', () => {
        startDate.setDate(startDate.getDate() + 7);
        renderDates();
    });
    datesList.appendChild(arrow);
};

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.time-item');
    if(!btn) return;
    const seanceId = btn.dataset.seanceId;
    const hallId = btn.dataset.hallId;
    const hallName = btn.dataset.hallName;
    const hallPriceStandart = btn.dataset.hallPriceStandart;
    const hallPriceVip = btn.dataset.hallPriceVip;
    localStorage.setItem('seanceId', seanceId);
    localStorage.setItem('seanceTime', btn.dataset.seanceTime);
    localStorage.setItem('filmName', btn.dataset.filmName);
    localStorage.setItem('date', selectedDate);
    localStorage.setItem('hallId', hallId);
    localStorage.setItem('hallName', hallName);
    localStorage.setItem('hallPriceStandart', hallPriceStandart);
    localStorage.setItem('hallPriceVip', hallPriceVip);
    window.location.href = './html/client-hall.html';
});

function isSeancePast(seanceTime) {
    const now = new Date();
    const todayDateStr = getTodayDate();
    const selectedDateObj = new Date(selectedDate);
    const todayDateObj = new Date(todayDateStr);
    if(selectedDateObj < todayDateObj) {
        return true;
    }
    if(selectedDateObj > todayDateObj) {
        return false;
    }
    const currentHours = now.getHours();
    const currentMinuts = now.getMinutes();
    const currentTotalMinuts = currentHours * 60 + currentMinuts;
    const [seanceHours, seanceMinuts] = seanceTime.split(':').map(Number);
    const seanceTotalMinuts = seanceHours * 60 + seanceMinuts;
    return seanceTotalMinuts <= currentTotalMinuts;
};