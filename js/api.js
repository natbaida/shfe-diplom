const API_BASE_URL = 'https://shfe-diplom.neto-server.ru/';

export function getAllData() {
    return fetch(`${API_BASE_URL}alldata`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сети');
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error('Ошибка сервера');
            }
            return data.result;
        });
};

export function loginAdmin(login, password) {
    const formData = new FormData();
    formData.set('login', login);
    formData.set('password', password);

    return fetch(`${API_BASE_URL}login`, {
        method:'POST', 
        body: formData
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка авторизации');
        }
        return response.json();
    });
};

export function addHall(hallName) {
    const formData = new FormData();
    formData.set('hallName', hallName);

    return fetch(`${API_BASE_URL}hall`, {
        method:'POST', 
        body: formData
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при добавлении зала');
        }
        return response.json();
    });
};

export function deleteHall(hallId) {
    return fetch(`${API_BASE_URL}hall/${hallId}`, {
        method: 'DELETE'
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при удалении зала');
        }
        return response.json();
    });
};

export function updateHallConfig(hallId, rowCount, placeCount, config) {
    const formData = new FormData();
    formData.set('rowCount', rowCount);
    formData.set('placeCount', placeCount);
    formData.set('config', JSON.stringify(config));

    return fetch(`${API_BASE_URL}hall/${hallId}`, {
        method:'POST', 
        body: formData
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при изменении конфигурации зала');
        }
        return response.json();
    });
};

export function updateHallPrices(hallId, priceStandart, priceVip) {
    const formData = new FormData();
    formData.set('priceStandart', priceStandart);
    formData.set('priceVip', priceVip);

    return fetch(`${API_BASE_URL}price/${hallId}`, {
        method:'POST', 
        body: formData
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при изменении стоимости билетов');
        }
        return response.json();
    });
};

export function setHallOpenStatus(hallId, hallOpen) {
    const formData = new FormData();
    formData.set('hallOpen', hallOpen);

    return fetch(`${API_BASE_URL}open/${hallId}`, {
        method:'POST', 
        body: formData
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при изменении статуса кинозала');
        }
        return response.json();
    });
};

export function addFilm(formData) {
    return fetch(`${API_BASE_URL}film`, {
        method:'POST', 
        body: formData
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при добавлении фильма');
        }
        return response.json();
    });
};

export function deleteFilm(filmId) {
    return fetch(`${API_BASE_URL}film/${filmId}`, {
        method: 'DELETE'
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при удалении фильма');
        }
        return response.json();
    });
};

export function addSeance({ seanceHallid, seanceFilmid, seanceTime }) {
    const formData = new FormData();

    formData.append('seanceHallid', seanceHallid);
    formData.append('seanceFilmid', seanceFilmid);
    formData.append('seanceTime', seanceTime);

    return fetch(`${API_BASE_URL}seance`, {
        method: 'POST',
        body: formData
    })
        .then(res => {
            if (!res.ok) {
                throw new Error('Ошибка при добавлении сеанса');
            }
            return res.json();
        });
};

export function deleteSeance(seanceId) {
    return fetch(`${API_BASE_URL}seance/${seanceId}`, {
        method: 'DELETE'
    }) .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при удалении сеанса');
        }
        return response.json();
    });
};

export function getHallConfig(seanceId, date) {
    const url = `${API_BASE_URL}hallconfig?seanceId=${seanceId}&date=${date}`;
    
    return fetch(url)
    .then(response => {
        if(!response.ok) {
            throw new Error('Ошибка при получении схемы зала');
        }
        return response.json();
    });
};

export function buyTickets(seanceId, ticketDate, tickets) {
    const formData = new FormData();

    formData.set('seanceId', seanceId);
    formData.set('ticketDate', ticketDate);
    formData.set('tickets', JSON.stringify(tickets));

    return fetch(`${API_BASE_URL}ticket`, {
        method: 'POST',
        body: formData
    }).then(res => res.json());
};