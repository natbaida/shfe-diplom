import { getAllData, addFilm, addHall, deleteHall, deleteFilm, addSeance, updateHallPrices, updateHallConfig, setHallOpenStatus, deleteSeance } from './api.js';

let allHalls = [];
let activeHallId = null;
const hallsList = document.querySelector('.halls-list');
let hallConfig = [];
let hallRows = 0;
let hallPlaces = 0;
let allFilms = [];
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
let seances = [];
const TIME_STEP = 30;
const saleBtn = document.getElementById('sale-open');

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
            const hall = allHalls.find(h => h.id === activeHallId);
            if (saleBtn && hall) {
                const isOpen = hall.hall_open === 1;
                updateSaleButtonText(saleBtn, isOpen);
                updateOpenReadyText(isOpen);
            }
        }

    } catch (err) {
        console.error(err);
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
};

function renderFilmOptions(films) {
    filmSelect.innerHTML = '<option value="">Выберите фильм</option>';

    films.forEach(film => {
        const option = document.createElement('option');
        option.value = film.id;
        option.textContent = film.film_name;
        filmSelect.appendChild(option);
    });
};

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
};

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
        const newSeance = normalizeSeance({
            seance_hallid: hallId,
            seance_filmid: filmId,
            seance_time: time
        });
        if (!newSeance) {
            alert('Фильм не найден');
            return;
        }
        const hallSeances = seances
            .filter(s => s.seance_hallid === hallId)
            .map(normalizeSeance)
            .filter(Boolean);
        if (isOverlap(newSeance, hallSeances)) {
            alert('Сеанс пересекается');
            return;
        }
        if (newSeance.end > 1439) {
            alert('Сеанс должен закончиться до 23:59');
            return;
        }
        const result = await addSeance({
            seanceHallid: hallId,
            seanceFilmid: filmId,
            seanceTime: time
        });
        seances = result.result.seances;
        renderSchedule();
        popupAddSeans.classList.add('hidden');
        addSeanceForm.reset();
    } catch (err) {
        console.error(err);
        alert('Ошибка при добавлении сеанса');
    }
});

function setActiveHall(hallId) {
    activeHallId = hallId;
    const hall = allHalls.find(h => h.id === hallId);
    if (saleBtn && hall) {
        const isOpen = hall.hall_open === 1;
        updateSaleButtonText(saleBtn, isOpen);
        updateOpenReadyText(isOpen);
    }
    renderHallSelectButtons(allHalls);
    onHallChange(hallId);
    console.log('Активный зал:', hallId);
};

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
};

const rowsInput = document.getElementById('rows');
const placesInput = document.getElementById('places');

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
};

function createEmptyConfig(rows, places) {
    return Array.from({ length: rows }, () =>
        Array.from({ length: places }, () => 'standart')
    );
};

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
};

function renderHallGrid() {
    hallGrid.innerHTML = '';
    for (let row = 0; row < hallRows; row++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'hall-row';
        for (let place = 0; place < hallPlaces; place++) {
            const seat = document.createElement('div');
            seat.classList.add('hall-seat');
            const seatType = hallConfig[row][place];
            seat.classList.add(seatType);
            seat.dataset.row = row;
            seat.dataset.place = place;
            rowEl.appendChild(seat);
        };
        hallGrid.appendChild(rowEl);
    };
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
};

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
        const button = e.target.closest('#sale-open');
        const hallId = activeHallId;
        if (!hallId) {
            alert('Сначала выберите зал для конфигурации');
            return;
        }
        const currentStatus = button.classList.contains('open');
        const newStatus = !currentStatus;
        toggleHallStatus(hallId, newStatus, button);
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

savePricesBtn.addEventListener('click', async () => {
    if (!activeHallId) {
        alert('Сначала выберите зал');
        return;
    }
    const commonPriceInput = document.getElementById('common-price');
    const vipPriceInput = document.getElementById('vip-price');
    const priceStandart = Number(commonPriceInput.value);
    const priceVip = Number(vipPriceInput.value);
    if (!priceStandart || !priceVip) {
        alert('Введите корректные цены');
        return;
    }
    try {
        const response = await updateHallPrices(
            activeHallId,
            priceStandart,
            priceVip
        );
        const hall = allHalls.find(h => h.id === activeHallId);
        if (hall) {
            hall.hall_price_standart = priceStandart;
            hall.hall_price_vip = priceVip;
        };
        alert('Цены успешно сохранены');
        console.log('Ответ сервера:', response);
    } catch (err) {
        console.error(err);
        alert('Ошибка при сохранении цен');
    };
});


function rebuildHallConfig() {
    const rows = Number(rowsInput.value);
    const places = Number(placesInput.value);
    if (!rows || !places) return;
    hallRows = rows;
    hallPlaces = places;
    hallConfig = createEmptyConfig(rows, places);
    renderHallGrid();
};

rowsInput.addEventListener('change', rebuildHallConfig);
placesInput.addEventListener('change', rebuildHallConfig);

const saveHallConfigBtn = document.getElementById('layout-config-btn');

saveHallConfigBtn.addEventListener('click', async () => {
    if (!activeHallId) {
        alert('Выберите зал');
        return;
    }
    try {
        const result = await updateHallConfig(
            activeHallId,
            hallRows,
            hallPlaces,
            hallConfig
        );
        const hall = allHalls.find(h => h.id === activeHallId);
        if (hall) {
            hall.hall_rows = result.result.hall_rows;
            hall.hall_places = result.result.hall_places;
            hall.hall_config = result.result.hall_config;
        };
        alert('Схема зала сохранена');
        console.log('Ответ сервера:', result);

    } catch (err) {
        console.error(err);
        alert('Ошибка сохранения схемы');
    };
});

const cancelBtn = document.getElementById('layout-cancel-btn');

cancelBtn.addEventListener('click', () => {
    if (!activeHallId) return;
    onHallChange(activeHallId);
});

function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

function normalizeSeance(seance) {
    const film = allFilms.find(f => f.id === seance.seance_filmid);
    if (!film) return null;
    const start = timeToMinutes(seance.seance_time);
    const duration = film.film_duration;
    const end = start + duration;
    return {
        ...seance,
        start,
        duration,
        end
    };
};

function isOverlap(newSeance, seancesInHall) {
    return seancesInHall.some(s =>
        newSeance.start < s.end &&
        newSeance.end > s.start
    );
}

filmsList.addEventListener('dragstart', e => {
    const card = e.target.closest('.film-item');
    if (!card) return;
    e.dataTransfer.setData('filmId', card.dataset.filmId);
});

document.addEventListener('dragover', e => {
    if (e.target.closest('.schedule-line')) {
        e.preventDefault();
    }
});

document.addEventListener('drop', e => {
    const line = e.target.closest('.schedule-line');
    if (!line) return;
    e.preventDefault();
    const filmId = Number(e.dataTransfer.getData('filmId'));
    const hallId = Number(line.dataset.hallId);
    const rect = line.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const totalSteps = 24 * 60 / TIME_STEP;
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
    document.getElementById('seance-time').value =
        minutesToTime(Math.floor(start / TIME_STEP) * TIME_STEP);
};

function minutesToTime(min) {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
};

window.addEventListener('resize', () => {
    renderSchedule();
});

function renderSchedule() {
    const schedule = document.querySelector('.schedule');
    schedule.innerHTML = '';
    allHalls.forEach(hall => {
        const hallEl = document.createElement('div');
        hallEl.className = 'schedule-hall';
        hallEl.dataset.hallId = hall.id;
        hallEl.innerHTML = `
            <div class="schedule-hall-title">${hall.hall_name}</div>
            <div class="schedule-hall-trash" data-hall-id="${hall.id}">
                <div class="trash-icon"><svg width="64px" height="64px" viewBox="-2.5 0 61 61" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><filter id="a" width="200%" height="200%" x="-50%" y="-50%" filterUnits="objectBoundingBox"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feGaussianBlur stdDeviation="10" in="shadowOffsetOuter1" result="shadowBlurOuter1"></feGaussianBlur><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" in="shadowBlurOuter1" result="shadowMatrixOuter1"></feColorMatrix><feMerge><feMergeNode in="shadowMatrixOuter1"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter></defs><path fill-rule="evenodd" d="M36 26v10.997c0 1.659-1.337 3.003-3.009 3.003h-9.981c-1.662 0-3.009-1.342-3.009-3.003v-10.997h16zm-2 0v10.998c0 .554-.456 1.002-1.002 1.002h-9.995c-.554 0-1.002-.456-1.002-1.002v-10.998h12zm-9-5c0-.552.451-1 .991-1h4.018c.547 0 .991.444.991 1 0 .552-.451 1-.991 1h-4.018c-.547 0-.991-.444-.991-1zm0 6.997c0-.551.444-.997 1-.997.552 0 1 .453 1 .997v6.006c0 .551-.444.997-1 .997-.552 0-1-.453-1-.997v-6.006zm4 0c0-.551.444-.997 1-.997.552 0 1 .453 1 .997v6.006c0 .551-.444.997-1 .997-.552 0-1-.453-1-.997v-6.006zm-6-5.997h-4.008c-.536 0-.992.448-.992 1 0 .556.444 1 .992 1h18.016c.536 0 .992-.448.992-1 0-.556-.444-1-.992-1h-4.008v-1c0-1.653-1.343-3-3-3h-3.999c-1.652 0-3 1.343-3 3v1z" filter="url(#a)"></path></g></svg>️</div>
            </div>
            <div class="schedule-line" data-hall-id="${hall.id}"></div>
        `;
        schedule.appendChild(hallEl);
    });
    addTimelineMarkers();
    initTrashBins();
    renderSeances();
}

function initTrashBins() {
    document.querySelectorAll('.schedule-hall-trash').forEach(trashBin => {
        trashBin.style.opacity = '0';
        trashBin.style.pointerEvents = 'none';
        trashBin.addEventListener('dragover', handleTrashDragOver);
        trashBin.addEventListener('dragenter', handleTrashDragEnter);
        trashBin.addEventListener('dragleave', handleTrashDragLeave);
        trashBin.addEventListener('drop', handleTrashDrop);
    });
}
let activeTrashBin = null;

function handleTrashDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (e.dataTransfer.types.includes('seanceId')) {
        this.classList.add('active');
        activeTrashBin = this;
    }
};

function handleTrashDragEnter(e) {
    e.preventDefault();
    if (e.dataTransfer.types.includes('seanceId')) {
        this.classList.add('active');
        activeTrashBin = this;
    };
};

function handleTrashDragLeave(e) {
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('active');
        if (activeTrashBin === this) {
            activeTrashBin = null;
        };
    };
};

async function handleTrashDrop(e) {
    e.preventDefault();
    const seanceId = e.dataTransfer.getData('seanceId');
    const hallId = this.dataset.hallId;
    const type = e.dataTransfer.getData('type');
    if (type !== 'seance' || !seanceId) return;
    const seance = seances.find(s => s.id === parseInt(seanceId));
    if (!seance || seance.seance_hallid !== parseInt(hallId)) {
        this.classList.remove('active');
        return;
    }
    if (!confirm('Удалить этот сеанс?')) {
        this.classList.remove('active');
        activeTrashBin = null;
        return;
    }
    try {
        const result = await deleteSeance(parseInt(seanceId));
        seances = result.result.seances;
        renderSchedule();
    } catch (err) {
        console.error(err);
    }
    this.classList.remove('active');
    activeTrashBin = null;
}

document.addEventListener('dragstart', e => {
    const seanceBlock = e.target.closest('.seance-block');
    if (!seanceBlock) return;
    e.dataTransfer.setData('seanceId', seanceBlock.dataset.seanceId);
    e.dataTransfer.setData('type', 'seance');
    e.dataTransfer.effectAllowed = 'move';
    document.querySelectorAll('.schedule-hall-trash').forEach(trashBin => {
        trashBin.style.opacity = '1';
        trashBin.style.pointerEvents = 'auto';
    });
    seanceBlock.classList.add('dragging');
    setTimeout(() => {
        seanceBlock.style.opacity = '0.4';
    }, 0);
});

document.addEventListener('dragend', e => {
    const seanceBlock = e.target.closest('.seance-block');
    if (seanceBlock) {
        seanceBlock.classList.remove('dragging');
        seanceBlock.style.opacity = '';
    };
    document.querySelectorAll('.schedule-hall-trash').forEach(trashBin => {
        trashBin.style.opacity = '0';
        trashBin.style.pointerEvents = 'none';
        trashBin.classList.remove('active');
    });
    activeTrashBin = null;
});

async function toggleHallStatus(hallId, newStatus, button) {
    if (!hallId) {
        alert('Сначала выберите зал для конфигурации');
        return;
    }
    try {
        const statusValue = newStatus ? '1' : '0';
        const result = await setHallOpenStatus(hallId, statusValue);
        const hallIndex = allHalls.findIndex(h => h.id === hallId);
        if (hallIndex !== -1) {
            allHalls[hallIndex].hall_open = newStatus ? 1 : 0;
        }
        updateSaleButtonText(button, newStatus);
        updateOpenReadyText(newStatus);
        alert(newStatus ? 'Зал открыт для продажи билетов!' : 'Зал закрыт для продажи билетов.');
    } catch (err) {
        console.error(err);
        alert('Ошибка при изменении статуса зала');
    };
};

function updateSaleButtonText(button, isOpen) {
    if (!button) return;

    if (isOpen) {
        button.textContent = 'Закрыть продажу билетов';
        button.classList.add('open');
        button.classList.add('hall-open');
        button.classList.remove('hall-closed');
    } else {
        button.textContent = 'Открыть продажу билетов';
        button.classList.remove('open');
        button.classList.add('hall-closed');
        button.classList.remove('hall-open');
    }
}
function updateOpenReadyText(isOpen) {
    const openReadyText = document.querySelector('.open-ready-text');
    if (openReadyText) {
        openReadyText.textContent = isOpen
            ? 'Продажа билетов открыта'
            : 'Всё готово к открытию';
    }
}

function addTimelineMarkers() {
    document.querySelectorAll('.schedule-line').forEach(line => {
        const timeline = document.createElement('div');
        timeline.className = 'timeline-marker';

        const hallId = Number(line.dataset.hallId);
        const hallSeances = seances
            .filter(s => s.seance_hallid === hallId)
            .map(s => normalizeSeance(s))
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);

        hallSeances.forEach(seance => {
            const marker = document.createElement('div');
            marker.className = 'time-marker';
            marker.style.left = `${(seance.start / (24 * 60)) * 100}%`;
            marker.textContent = minutesToTime(seance.start);

            timeline.appendChild(marker);
        });

        if (hallSeances.length === 0) {
            const noSeancesMarker = document.createElement('div');
            noSeancesMarker.className = 'no-seances-marker';
            noSeancesMarker.textContent = 'Нет сеансов';
            timeline.appendChild(noSeancesMarker);
        }

        line.parentNode.insertBefore(timeline, line);
    });
};

function renderSeances() {
    document.querySelectorAll('.schedule-line').forEach(line => {
        line.innerHTML = '';
        const hallId = Number(line.dataset.hallId);
        const hallSeances = seances
            .filter(s => s.seance_hallid === hallId)
            .map(s => normalizeSeance(s))
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
        checkOverlapsForHall(hallSeances);
        hallSeances.forEach(seance => {
            const film = allFilms.find(f => f.id === seance.seance_filmid);
            if (!film) return;
            const block = createSeanceBlock(seance, film, line);
            line.appendChild(block);
        });
    });
};

function createSeanceBlock(seance, film) {
    const block = document.createElement('div');
    block.className = 'seance-block';
    block.dataset.seanceId = seance.id;
    block.dataset.start = seance.start;
    block.dataset.end = seance.end;
    block.title = `${film.film_name}\n${minutesToTime(seance.start)} - ${minutesToTime(seance.end)}`;
    block.draggable = true;
    const leftPercentage = (seance.start / (24 * 60)) * 100;
    const widthPercentage = (seance.duration / (24 * 60)) * 100;
    block.style.left = `${leftPercentage}%`;
    block.style.width = `${widthPercentage}%`;
    const colorIndex = film.id % 6;
    const colors = [
        'rgba(133, 153, 255, 0.7)',
        'rgba(133, 226, 255, 0.7)',
        'rgba(133, 255, 137, 0.7)',
        'rgba(133, 255, 211, 0.7)',
        'rgba(202, 255, 133, 0.7)',
        'rgba(255, 251, 133, 0.7)'
    ];
    block.style.backgroundColor = colors[colorIndex];
    block.style.border = `2px solid ${colors[colorIndex]}`

    block.innerHTML = `
        <div class="seance-title">${film.film_name}</div>
    `;
    return block;
};

function checkOverlapsForHall(seances) {
    for (let i = 0; i < seances.length; i++) {
        for (let j = i + 1; j < seances.length; j++) {
            const seanceA = seances[i];
            const seanceB = seances[j];
            if (seanceA.start < seanceB.end && seanceA.end > seanceB.start) {
                console.warn(`Обнаружено наложение сеансов в зале ${seanceA.seance_hallid}:`);
                console.warn(`Сеанс ${seanceA.id} (${minutesToTime(seanceA.start)}-${minutesToTime(seanceA.end)})`);
                console.warn(`Сеанс ${seanceB.id} (${minutesToTime(seanceB.start)}-${minutesToTime(seanceB.end)})`);
            };
        };
    };
};