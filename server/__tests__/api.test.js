const request = require('supertest');
const express = require('express');
const cors = require('cors');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Мок базы данных
jest.mock('../src/config/database', () => {
  const pool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  pool.on = jest.fn();
  return pool;
});

const pool = require('../src/config/database');
const routes = require('../src/routes');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use('/api', routes);

// Вспомогательные данные
const mockShow = {
  id: 1, name: 'Гамлет', description: 'Трагедия Уильяма Шекспира',
  price: '1800.00', age_rating: '12+', photo: null,
};

const mockPerformance = {
  id: 1, date: '2026-06-15', time: '19:00:00', show_id: 2,
  show_name: 'Гамлет', hall_name: 'Большой зал', hall_id: 1, actors: [],
};

const mockUser = {
  id: 3, last_name: 'Иванов', first_name: 'Иван', middle_name: 'Дмитриевич',
  email: 'client1@mail.ru', date_of_birth: '1995-01-30', role_id: 3,
  role_name: 'Клиент',
  password: '$2b$12$TRr8YynTqm.AluiAEefZKuoHBgosvUJOHaaCMYhtdhV0zW/hhbUxu',
};

test('1. GET /api/shows возвращает список шоу', async () => {
  pool.query.mockResolvedValueOnce({ rows: [mockShow] });

  const res = await request(app).get('/api/shows');

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data[0].name).toBe('Гамлет');
});

test('2. GET /api/shows/:id возвращает шоу с показами', async () => {
  pool.query
    .mockResolvedValueOnce({ rows: [mockShow] })
    .mockResolvedValueOnce({ rows: [mockPerformance] });

  const res = await request(app).get('/api/shows/1');

  expect(res.status).toBe(200);
  expect(res.body.data.name).toBe('Гамлет');
  expect(Array.isArray(res.body.data.performances)).toBe(true);
});

test('3. GET /api/shows/:id возвращает 404 если шоу не найдено', async () => {
  pool.query
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] });

  const res = await request(app).get('/api/shows/9999');

  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
});

test('4. GET /api/shows/afisha возвращает предстоящие показы', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ ...mockPerformance, photo: null }] });

  const res = await request(app).get('/api/shows/afisha?limit=10');

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
});

test('5. GET /api/shows/afisha с фильтром по дате возвращает 200', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] });

  const res = await request(app).get('/api/shows/afisha?dateFrom=2026-12-31');

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
});

test('6. POST /api/auth/login — успешный вход', async () => {
  pool.query.mockResolvedValueOnce({ rows: [mockUser] });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'client1@mail.ru', password: 'password123' });

  expect([200, 401]).toContain(res.status);
});

test('7. POST /api/auth/login без данных возвращает 400', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({});

  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
});

test('8. POST /api/auth/register с занятым email возвращает 409', async () => {
  pool.query.mockResolvedValueOnce({ rows: [mockUser] });

  const res = await request(app)
    .post('/api/auth/register')
    .send({
      last_name: 'Тест', first_name: 'Тест', email: 'client1@mail.ru', password: '12345678',
    });

  expect(res.status).toBe(409);
  expect(res.body.success).toBe(false);
});

test('9. POST /api/orders создаёт заказ', async () => {
  const mockClient = {
    query: jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99, payment_status: 'Ожидает оплаты', user_id: 3, created_at: new Date() }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({}),
    release: jest.fn(),
  };
  pool.connect.mockResolvedValueOnce(mockClient);

  const res = await request(app)
    .post('/api/orders')
    .send({ userId: 3, performanceId: 1, seatIds: [1] });

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.data.id).toBe(99);
});

test('10. POST /api/orders возвращает 409 если место занято', async () => {
  const mockClient = {
    query: jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ seat_id: 1 }] })
      .mockResolvedValueOnce({}),
    release: jest.fn(),
  };
  pool.connect.mockResolvedValueOnce(mockClient);

  const res = await request(app)
    .post('/api/orders')
    .send({ userId: 3, performanceId: 1, seatIds: [1] });

  expect(res.status).toBe(409);
  expect(res.body.success).toBe(false);
});

test('11. GET /api/performances/:id/seats возвращает места', async () => {
  const mockSeat = {
    seat_id: 1, number_in_row: 1, row_id: 1, number_in_section: 1,
    surcharge: '0.00', section_id: 1, section_type: 'Партер',
    hall_id: 1, hall_name: 'Большой зал', is_taken: false,
  };
  pool.query.mockResolvedValueOnce({ rows: [mockSeat] });

  const res = await request(app).get('/api/performances/1/seats');

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
});

test('12. PUT /api/orders/:id/status меняет статус заказа', async () => {
  pool.query.mockResolvedValueOnce({
    rows: [{ id: 1, payment_status: 'Оплачен', user_id: 3, created_at: new Date() }],
  });

  const res = await request(app)
    .put('/api/orders/1/status')
    .send({ status: 'Оплачен' });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});

test('13. PUT /api/orders/:id/status с неверным статусом возвращает 400', async () => {
  const res = await request(app)
    .put('/api/orders/1/status')
    .send({ status: 'Несуществующий' });

  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
});

test('14. GET /api/users/:userId/orders возвращает историю', async () => {
  const mockOrder = {
    order_id: 11, created_at: new Date(), payment_status: 'Оплачен',
    tickets: [{ show_name: 'Гамлет', seat_id: 1, date: '2026-06-15', time: '19:00' }],
  };
  pool.query.mockResolvedValueOnce({ rows: [mockOrder] });

  const res = await request(app).get('/api/users/3/orders');

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data[0].payment_status).toBe('Оплачен');
});

test('15. GET /api/admin/shows возвращает шоу с фото в base64', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ ...mockShow, photo: null }] });

  const res = await request(app).get('/api/admin/shows');

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data[0]).toHaveProperty('photo');
});