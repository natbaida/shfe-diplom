import {getAllData, addFilm, addHall, deleteHall, deleteFilm, addSeance, updateHallPrices, updateHallConfig} from './api.js';

let allHalls = [];
let activeHallId = null;
const hallsList = document.querySelector('.halls-list');
let hallConfig = [];
let hallRows = 0;
let hallPlaces = 0;
let allFilms = [];
let seances = [];
const filmsList = document.querySelector('.films-list');
const hallSelect = document.getElementById('seance-hall');
const filmSelect = document.getElementById('seance-film');
const hallGrid = document.getElementById('hall-grid');
const toggleButtons = document.querySelectorAll('.section-top svg');
const addFilmForm = document.getElementById('add-film-form');
const posterInput = document.getElementById('poster-input');
const filmName = document.getElementById('film-name');
const filmDuration = document.getElementById('film-duration');
const filmDescription = document.getElementById('film-description');
const filmOrigin = document.getElementById('film-country');
const hallForm = document.getElementById('add-hall-form');
const hallNameInput = hallForm.querySelector('#hall-name');
const popupAddFilm = document.getElementById('popup-add-film');
const popupAddSeans = document.getElementById('popup-add-seans');
const popupAddHall = document.getElementById('popup-add-hall');
const addSeanceForm = popupAddSeans.querySelector('form');
const TIME_STEP = 30;
const rowsInput = document.getElementById('rows');
const placesInput = document.getElementById('places');



document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await getAllData();

        allHalls = data.halls;
        allFilms = data.films;
        seances = data.seances;

        renderHalls(allHalls);
        renderHallSelectButtons(allHalls);
        renderFilms(allFilms);
        renderSchedule();

        if (allHalls.length) {
            activeHallId = allHalls[0].id;
            setActiveHall(activeHallId);
        }

    } catch (err) {
        console.error(err);
        alert('Ошибка загрузки данных');
    }
});

function renderHallOptions(halls) {
    hallSelect.innerHTML = '<option value="">Выберите зал</option>';

    halls.forEach(hall => {
        const option = document.createElement('option');
        option.value = hall.id;
        option.textContent = hall.hall_name;
        hallSelect.appendChild(option);
    });
}

function renderFilmOptions(films) {
    filmSelect.innerHTML = '<option value="">Выберите фильм</option>';

    films.forEach(film => {
        const option = document.createElement('option');
        option.value = film.id;
        option.textContent = film.film_name;
        filmSelect.appendChild(option);
    });
}

function renderFilms(films) {
    filmsList.innerHTML = '';

    films.forEach(film => {
        const filmCard = document.createElement('div');
        filmCard.className = 'film-item';
        filmCard.dataset.filmId = film.id;
        filmCard.setAttribute('draggable', 'true');

        filmCard.innerHTML = `
            <img 
                class="film-img"
                src="${film.film_poster}" 
                alt="${film.film_name}"
            >
            <div class="film-item-info">
                <h4 class="film-name">${film.film_name}</h4>
                <p class="film-duration">${film.film_duration} мин</p>
            </div>
            <button class="delete-img film-icon" title="Удалить фильм"></button>
        `;

        filmsList.appendChild(filmCard);
    });
}
filmsList.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.film-icon');
    if (!deleteBtn) return;

    const filmCard = deleteBtn.closest('.film-item');
    const filmId = Number(filmCard.dataset.filmId);

    if (!confirm('Удалить фильм?')) return;

    try {
        const result = await deleteFilm(filmId);

        allFilms = result.result.films;

        renderFilms(allFilms);
    } catch (err) {
        console.error(err);
        alert('Ошибка при удалении фильма');
    }
});

addSeanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const hallId = Number(hallSelect.value);
    const filmId = Number(filmSelect.value);
    const time = document.getElementById('seance-time').value;

    if (!hallId || !filmId || !time) {
        alert('Заполните все поля');
        return;
    }

    try {
        const result = await addSeance({
            seanceHallid: hallId,
            seanceFilmid: filmId,
            seanceTime: time
        });

        console.log('Сеанс добавлен', result);

        popupAddSeans.classList.add('hidden');
        addSeanceForm.reset();

    } catch (err) {
        console.error(err);
        alert('Ошибка при добавлении сеанса');
    }
});

function setActiveHall(hallId) {
    activeHallId = hallId;

    renderHallSelectButtons(allHalls);
    onHallChange(hallId);

    console.log('Активный зал:', hallId);
}
function renderHalls(halls) {
    hallsList.innerHTML = '';

    halls.forEach(hall => {
        const li = document.createElement('li');
        li.className = 'hall-info';
        li.dataset.hallId = hall.id;

        li.innerHTML = `
            <div class="hall-number">— ${hall.hall_name}</div>
            <div class="delete-img" title="Удалить зал"></div>
        `;

        hallsList.appendChild(li);
    });
}

function onHallChange(hallId) {
    const hall = allHalls.find(h => h.id === hallId);
    if (!hall) return;

    hallRows = hall.hall_rows || 0;
    hallPlaces = hall.hall_places || 0;
    rowsInput.value = hallRows;
    placesInput.value = hallPlaces;

    hallConfig = hall.hall_config?.length
        ? hall.hall_config
        : createEmptyConfig(hallRows, hallPlaces);

    renderHallGrid();
    renderPrices(hall);
}

function createEmptyConfig(rows, places) {
    return Array.from({ length: rows }, () =>
        Array.from({ length: places }, () => 'standart')
    );
}

hallGrid.addEventListener('click', (e) => {
    const seat = e.target.closest('.hall-seat');
    if (!seat) return;

    const row = +seat.dataset.row;
    const place = +seat.dataset.place;

    const types = ['standart', 'vip', 'disabled'];
    const current = hallConfig[row][place];
    const next = types[(types.indexOf(current) + 1) % types.length];

    hallConfig[row][place] = next;
    renderHallGrid();
});

function renderPrices(hall) {
    const commonInput = document.getElementById('common-price');
    const vipInput = document.getElementById('vip-price');

    if (commonInput) commonInput.value = hall.hall_price_standart || '';
    if (vipInput) vipInput.value = hall.hall_price_vip || '';
}

function renderHallGrid() {
    hallGrid.innerHTML = '';
    for(let row = 0; row < hallRows; row++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'hall-row';
        for(let place = 0; place < hallPlaces; place++) {
            const seat = document.createElement('div');
            seat.className = 'hall-seat';
            const seatType = hallConfig[row][place];
            seat.classList.add(seatType);
            seat.dataset.row = row;
            seat.dataset.place = place;
            rowEl.appendChild(seat);
        }
        hallGrid.appendChild(rowEl);
    }
};

function renderHallSelectButtons(halls) {
    document.querySelectorAll('.hall-select-btn-list').forEach(container => {
        container.innerHTML = '';

        halls.forEach(hall => {
            const btn = document.createElement('a');
            btn.className = 'hall-select-btn';
            btn.textContent = hall.hall_name;
            btn.dataset.hallId = hall.id;

            if (hall.id === activeHallId) {
                btn.classList.add('active');
            }
            container.appendChild(btn);
        });
    });
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.hall-select-btn');
    if (!btn) return;
    const hallId = Number(btn.dataset.hallId);
    if (Number.isNaN(hallId)) {
        console.warn('Некорректный hallId', btn.dataset.hallId);
        return;
    }
    setActiveHall(hallId);
});


hallsList.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-img');
    if (!deleteBtn) return;

    const hallItem = deleteBtn.closest('.hall-info');
    const hallId = Number(hallItem.dataset.hallId);

    if (!confirm('Удалить зал?')) return;

    try {
        await deleteHall(hallId);

        allHalls = allHalls.filter(h => h.id !== hallId);

        renderHalls(allHalls);
        renderHallSelectButtons(allHalls);

        if (activeHallId === hallId && allHalls.length) {
            setActiveHall(allHalls[0].id);
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка при удалении зала');
    }
});



toggleButtons.forEach(button => {
    button.addEventListener('click', function () {
        const sectionArea = this.closest('.form-section').querySelector('.section-area');
        if (sectionArea.style.display === 'none') {
            sectionArea.style.display = '';
            sectionArea.classList.remove('hidden');
            button.style.rotate = '0deg';
        } else {
            button.style.rotate = '180deg';
            sectionArea.style.display = 'none';
            sectionArea.classList.add('hidden');
        }

        const sectionTop = this.closest('.section-top');
        const sectionContainer = sectionTop.querySelector('.section-container');

        sectionContainer.classList.toggle('no-before');
    });
});


document.addEventListener('click', (e) => {

    if (e.target.closest('#create-hall')) {
        popupAddHall.classList.remove('hidden');
    }

    if (e.target.closest('#add-film')) {
        popupAddFilm.classList.remove('hidden');
    }

    if (e.target.closest('#sale-open')) {
        popupAddSeans.classList.remove('hidden');
        renderHallOptions(allHalls);
        renderFilmOptions(allFilms);
    }

    if (e.target.closest('.js-close-popup')) {
        const popup = e.target.closest('section');
        popup.classList.add('hidden');
    }
});


const uploadPosterBtn = document.getElementById('upload-poster');
uploadPosterBtn.addEventListener('click', () => {
    posterInput.click();
});



addFilmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!filmName.value.trim() || !filmDuration.value.trim() || !filmDescription.value.trim() || !filmOrigin.value.trim()) {
        alert('Заполните все поля');
        return;
    }
    const filePoster = posterInput.files[0];
    if (!filePoster) {
        alert('Загрузите постер');
        return;
    }
    if (filePoster.type !== 'image/png') {
        alert('Постер должен быть в формате PNG');
        return;
    }
    if (filePoster.size > 3 * 1024 * 1024) {
        alert('Размер постера не более 3 МБ');
        return;
    }
    const formData = new FormData();
    formData.append('filmName', filmName.value.trim());
    formData.append('filmDuration', filmDuration.value.trim());
    formData.append('filmDescription', filmDescription.value.trim());
    formData.append('filmOrigin', filmOrigin.value.trim());
    formData.append('filePoster', filePoster);

    try {
        const result = await addFilm(formData);

        allFilms = result.result.films;

        renderFilms(allFilms);

        addFilmForm.reset();
        posterInput.value = '';
        popupAddFilm.classList.add('hidden');

    } catch (error) {
        console.error(error);
        alert('Ошибка при добавлении фильма');
    }
});

hallForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const hallName = hallNameInput.value.trim();
    if (!hallName) {
        alert('Введите название зала');
        return;
    }

    addHall(hallName)
        .then(data => {
            const newHall = data.result.halls[data.result.halls.length - 1];

            allHalls.push(newHall);

            renderHalls(allHalls);
            renderHallSelectButtons(allHalls);

            if (!activeHallId) {
                setActiveHall(newHall.id);
            }

            popupAddHall.classList.add('hidden');
            hallNameInput.value = '';
        });
});

const savePricesBtn = document.getElementById('save-prices');
const commonPriceInput = document.getElementById('common-price');
const vipPriceInput = document.getElementById('vip-price');

savePricesBtn.addEventListener('click', async() => {
    if(!activeHallId) {
        alert('Сначала выберите зал!');
        return;
    }
    const priceStandart = Number(commonPriceInput.value);
    const priceVip = Number(vipPriceInput.value);
    if(!priceStandart || !priceVip) {
        alert('Введите корректные цены.');
        return;
    }
    try {
        const respose = await updateHallPrices(activeHallId, priceStandart, priceVip);
        const hall = allHalls.find(hall => hall.id === activeHallId);
        if(hall) {
            hall.hall_price_standart = priceStandart;
            hall.hall_price_vip = priceVip;
        }
    } catch (error) {
        alert('Ошибка при сохранении цен.');
    }
});

function rebuildHallConfig() {
    const rows = Number(rowsInput.value);
    const places = Number(placesInput.value);
    if(!rows || !places) {
        return;
    }
    hallRows = rows;
    hallPlaces = places;
    hallConfig = createEmptyConfig(rows, places);
    renderHallGrid();
};

rowsInput.addEventListener('change', rebuildHallConfig);
placesInput.addEventListener('change', rebuildHallConfig);

const saveHallConfigBtn = document.getElementById('layout-config-btn');
const cancelHallConfigBtn = document.getElementById('layout-cancel-btn');

saveHallConfigBtn.addEventListener('click', async() => {
    if(!activeHallId) {
        alert('Выберите зал.');
        return;
    }
    try { 
        const result = await updateHallConfig(activeHallId, hallRows, hallPlaces, hallConfig);
        const hall = allHalls.find(hall => hall.id === activeHallId);
        if(hall) {
            hall.hall_rows = result.result.hall_rows;
            hall.hall_places = result.result.hall_places;
            hall.hall_config = result.result.hall_config;
        }
    } catch (error) {
        alert('Ошибка сохранения.');
    }
});

cancelHallConfigBtn.addEventListener('click', () => {
    if(!activeHallId) {
        return;
    }
    onHallChange(activeHallId);
});

const schedule = document.querySelector('.schedule');

function renderSchedule() {
    schedule.innerHTML = '';
    allHalls.forEach(hall => {
        const hallEl = document.createElement('div');
        hallEl.className = 'schedule-hall';
        hallEl.dataset.hallId = hall.id;
        hallEl.innerHTML = `
            <div class="schedule-hall-title">${hall.hall_name}</div>
            <div class="schedule-line" data-hall-id="${hall.id}"></div>
            `;
            schedule.appendChild(hallEl);
    });
    renderSeances();
};

function renderSeances() {
    document.querySelectorAll('.schedule-line').forEach(line => {
        line.innerHTML = '';
    });
    seances.forEach(seance => {
        const film = allFilms.find(film => film.id === seance.seance_filmid);
        if(!film) return;
        const start = timeToMinutes(seance.seance_time);
        const line = document.querySelector(`.schedule-line[data-hall-id="${seance.seance_hallid}"]`);
        if(!line) return;
        const block = document.createElement('div');
        block.className = 'seance-block';
        const left = getSeanceLeft(line, start);
        block.style.left = `${left}px`;
        block.textContent = film.film_name;
        line.appendChild(block);
    });
};

function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

filmsList.addEventListener('dragstart', e => {
    const card = e.target.closest('.film-item');
    if(!card) return;
    e.dataTransfer.setdata('filmId', card.dataset.filmId)
});

document.addEventListener('dragover', e => {
    if(e.target.closest('.schedule-line')) {
        e.preventDefault()
    }
});

document.addEventListener('drop', e => {
    const line = e.target.closest('.schedule-line');
    if(!line) return;
    e.preventDefault();
    const filmId = Number(e.dataTransfer.getData('filmId'));
    const hallId = Number(line.dataset.hallId);

    const rect = line.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;

    const totalSteps = 24 * 60 / TIME_STEP; // 48
    const stepWidth = line.clientWidth / totalSteps;

    const startMinutes =
        Math.floor(offsetX / stepWidth) * TIME_STEP;
        openSeancePopup(filmId, hallId, startMinutes);
});

function openSeancePopup(filmId, hallId, start) {
    renderHallOptions(allHalls);
    renderFilmOptions(allFilms);
    popupAddSeans.classList.remove('hidden');
    filmSelect.value = String(filmId);
    hallSelect.value = String(hallId);
    document.getElementById('seance-time').value = minutesToTime(Math.floor(start / TIME_STEP) * TIME_STEP);
};

function minutesToTime(min) {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
};

window.addEventListener('resize', () => {
    renderSchedule();
});

function getSeanceLeft(line, startMinutes) {
    const totalSteps = 24 * 60 / TIME_STEP;
    const stepWidth = line.clientWidth / totalSteps;
    const stepIndex = Math.floor(startMinutes / TIME_STEP);
    return stepIndex * stepWidth;
};