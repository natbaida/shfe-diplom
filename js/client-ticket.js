document.addEventListener('DOMContentLoaded', () => {
    const bookingDataRaw = localStorage.getItem('bookingData');
    const ticketsRaw = localStorage.getItem('ticketsResult');
    if(!bookingDataRaw || !ticketsRaw || ticketsRaw === 'undefined') {
        alert('Нет данных о бронировании.')
        location.href = '../index.html';
        return;
    }
    const bookingData = JSON.parse(bookingDataRaw);
    const tickets = JSON.parse(ticketsRaw);
    renderTicketInfo(bookingData);
    renderQRCode(bookingData, tickets);
});

function renderTicketInfo(data) {
    document.querySelector('.film-name').textContent = data.filmName;
    document.querySelector('.film-hall').textContent = data.hallName;
    document.querySelector('.film-time').textContent = data.seanceTime;
    const seatsText = data.seats.map(seat => `Ряд ${seat.row} место ${seat.place}`).join(', ');
    document.querySelector('.film-seat').textContent = seatsText;
}

function renderQRCode(booking, tickets) {
    const qrContainer = document.querySelector('.qr-code-booked');
    qrContainer.innerHTML = '';
    const qrText = tickets.map(ticket => `
        Билет №${ticket.id}
        Фильм: ${ticket.ticket_filmname}
        Зал: ${ticket.ticket_hallname}
        Дата: ${ticket.ticket_date}
        Время: ${ticket.ticket_time}
        Ряд: ${ticket.ticket_row}
        Место: ${ticket.ticket_place}
        Цена: ${ticket.ticket_price} ₽
            `.trim()).join('\n----------------\n');
    const qr = QRCreator(qrText, {
        mode: -1,
        eccl: 0,
        version: -1,
        mask: -1,
        image: "PNG",
        modsize: 3,
        margin: 4
    });
    if (qr.error) {
        qrContainer.textContent = `Ошибка генерации QR-кода: ${qr.error}`;
    } else {
        qrContainer.append(qr.result);
    }
}