select * from shows; -- 1
select * from performances; -- 2
select * from halls; -- 3
select * from sections; -- 4
select * from actors; -- 5
select * from roles; -- 6
select * from users; -- 7
select * from orders; -- 8
select * from tickets; -- 9
select * from performance_actors; -- 10
select * from performance_halls; -- 11
select * from seats; -- 12
select * from seat_rows; -- 13

SELECT s.id, s.name, s.description, s.price, s.age_rating, s.photo
      FROM shows s
      JOIN performances p ON p.show_id = s.id
      WHERE p.date = CURRENT_DATE
      GROUP BY s.id
      ORDER BY MIN(p.time)

-- 1. СОЗДАНИЕ ТАБЛИЦ

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    photo BYTEA,
    age_rating VARCHAR(5) NOT NULL CHECK (age_rating IN ('0+', '6+', '12+', '16+', '18+'))
);

CREATE TABLE halls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE actors (
    id SERIAL PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL
);

CREATE TABLE performances (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    show_id INT REFERENCES shows(id) ON DELETE CASCADE
);

CREATE TABLE performance_actors (
    performance_id INT REFERENCES performances(id) ON DELETE CASCADE,
    actor_id INT REFERENCES actors(id) ON DELETE CASCADE,
    PRIMARY KEY (performance_id, actor_id)
);

CREATE TABLE performance_halls (
    hall_id INT REFERENCES halls(id) ON DELETE CASCADE,
    performance_id INT REFERENCES performances(id) ON DELETE CASCADE,
    PRIMARY KEY (hall_id, performance_id)
);

CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Партер', 'Балкон', 'Ложа', 'Амфитеатр', 'VIP')),
    hall_id INT REFERENCES halls(id) ON DELETE CASCADE
);

CREATE TABLE seat_rows (
    id SERIAL PRIMARY KEY,
    number_in_section INT NOT NULL,
    section_id INT REFERENCES sections(id) ON DELETE CASCADE,
    surcharge DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    number_in_row INT NOT NULL,
    row_id INT REFERENCES seat_rows(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Ожидает оплаты' 
        CHECK (payment_status IN ('Ожидает оплаты', 'Оплачен', 'Отменён', 'Возврат средств'))
);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    seat_id INT REFERENCES seats(id) ON DELETE RESTRICT,
    performance_id INT REFERENCES performances(id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE
);

-- 2. ЗАПОЛНЕНИЕ ТЕСТОВЫМИ ДАННЫМИ

-- Роли
INSERT INTO roles (name) VALUES 
('Администратор'), ('Кассир'), ('Клиент');

-- Залы
INSERT INTO halls (name) VALUES 
('Большой зал'), ('Камерная сцена'), ('Малый зал');

-- Шоу
INSERT INTO shows (name, description, price, age_rating) VALUES 
('Лебединое озеро', 'Классический балет П.И. Чайковского в двух действиях', 2500.00, '0+'),
('Гамлет', 'Трагедия Уильяма Шекспира', 1800.00, '12+'),
('Вишнёвый сад', 'Комедия А.П. Чехова', 1500.00, '6+'),
('Преступление и наказание', 'Драматизация романа Ф.М. Достоевского', 2000.00, '16+'),
('Мастер и Маргарита', 'Мистическая постановка по роману М.А. Булгакова', 2200.00, '18+');

-- Актеры
INSERT INTO actors (last_name, first_name, middle_name) VALUES 
('Иванов', 'Пётр', 'Сергеевич'),
('Петрова', 'Анна', 'Владимировна'),
('Сидоров', 'Михаил', 'Александрович'),
('Козлова', 'Елена', 'Дмитриевна'),
('Новиков', 'Андрей', 'Игоревич'),
('Соколова', 'Мария', 'Павловна');

-- Пользователи
INSERT INTO users (last_name, first_name, middle_name, password, email, date_of_birth, role_id) VALUES 
('Админ', 'Админ', 'Админ', '$2b$12$TRr8YynTqm.AluiAEefZKuoHBgosvUJOHaaCMYhtdhV0zW/hhbUxu', 'admin@theater.ru', '1985-03-15', 1),
('Кассир', 'Кассир', 'Кассир', '$2b$12$TRr8YynTqm.AluiAEefZKuoHBgosvUJOHaaCMYhtdhV0zW/hhbUxu', 'kassa1@theater.ru', '1992-05-20', 2),
('Иванов', 'Иван', 'Дмитриевич', '$2b$12$TRr8YynTqm.AluiAEefZKuoHBgosvUJOHaaCMYhtdhV0zW/hhbUxu', 'client1@mail.ru', '1995-01-30', 3),
('Петрова', 'Анна', 'Сергеевна', '$2b$12$TRr8YynTqm.AluiAEefZKuoHBgosvUJOHaaCMYhtdhV0zW/hhbUxu', 'client2@mail.ru', '1998-07-12', 3);

-- Показы
INSERT INTO performances (date, time, show_id) VALUES 
('2026-06-10', '19:00', 1),
('2026-06-12', '18:00', 1),
('2026-06-15', '19:00', 2),
('2026-05-16', '18:00', 3),
('2026-05-20', '19:00', 4),
('2026-05-22', '19:00', 5),
('2026-05-25', '18:00', 2),
('2026-06-28', '19:00', 3);

-- Актеры в показах
INSERT INTO performance_actors (performance_id, actor_id) VALUES 
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 4),
(3, 5), (3, 6),
(4, 2), (4, 5),
(5, 3), (5, 6),
(6, 1), (6, 2), (6, 3), (6, 4),
(7, 5), (7, 6),
(8, 2), (8, 5);

-- Показы в залах
INSERT INTO performance_halls (hall_id, performance_id) VALUES 
(1, 1), (1, 2), (1, 3), (1, 6), (1, 7),
(2, 4), (2, 5),
(3, 8);

-- Секции
INSERT INTO sections (type, hall_id) VALUES 
('Партер', 1), ('Балкон', 1), ('Ложа', 1),
('Партер', 2), ('VIP', 2),
('Партер', 3), ('Амфитеатр', 3);

-- Ряды
INSERT INTO seat_rows (number_in_section, section_id, surcharge) VALUES 
(1, 1, 0), (2, 1, 50), (3, 1, 100), (4, 1, 150),
(1, 2, -100), (2, 2, -50), (3, 2, 0),
(1, 3, 500), (2, 3, 600),
(1, 4, 0), (2, 4, 50), (3, 4, 100),
(1, 5, 1000), (2, 5, 1200),
(1, 6, 0), (2, 6, 50),
(1, 7, -50), (2, 7, 0);

-- Места (автогенерация)
DO $$
DECLARE
    r RECORD;
    s INT;
    count INT;
BEGIN
    FOR r IN SELECT id FROM seat_rows LOOP
        count := 8 + (r.id % 5);
        FOR s IN 1..count LOOP
            INSERT INTO seats (number_in_row, row_id) VALUES (s, r.id);
        END LOOP;
    END LOOP;
END $$;

-- Заказы
INSERT INTO orders (user_id, created_at, payment_status) VALUES 
(3, '2026-04-06 10:00:00', 'Оплачен'),
(4, '2026-04-06 11:30:00', 'Оплачен'),
(3, '2026-04-07 15:45:00', 'Возврат средств'),
(4, '2026-04-07 17:00:00', 'Оплачен');

-- Билеты
INSERT INTO tickets (seat_id, performance_id, order_id) VALUES 
(1, 1, 11), (2, 1, 11),
(25, 3, 12),
(50, 4, 13), (51, 4, 13), (52, 4, 13),
(75, 5, 14), (76, 5, 14);
