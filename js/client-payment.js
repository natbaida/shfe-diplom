import { buyTickets } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('bookingData'));

    if (!data) {
        alert('Нет данных бронирования');
        return;
    }

    document.querySelector('.film-name').textContent = data.filmName;
    document.querySelector('.film-hall').textContent = data.hallName;
    document.querySelector('.film-time').textContent = data.seanceTime;
    document.querySelector('.film-seat').textContent = data.seats.map(s => s.place).join(', ');
    document.querySelector('.film-costs').textContent = `${data.totalPrice} рублей`;

    const buyBtn = document.querySelector('.btn-booking');
    buyBtn.addEventListener('click', async () => {
        try {
            const ticketDate = data.date;

            const tickets = data.seats.map(seat => ({
                row: seat.row,
                place: seat.place,
                coast: seat.coast
            }));

            const response = await buyTickets(
                data.seanceId,
                ticketDate,
                tickets
            );

            console.log('BUY RESPONSE:', response);

            if (!response.success) {
                alert(response.error || 'Ошибка покупки билетов');
                return;
            }

            localStorage.setItem(
                'ticketsResult',
                JSON.stringify(response.result)
            );

            location.href = '/shfe-diplom/html/client-ticket.html';
            // location.href = '../html/client-ticket.html';

        } catch (err) {
            console.error(err);
            alert('Ошибка при покупке билетов');
        }
    });
});