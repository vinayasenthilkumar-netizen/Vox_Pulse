-- Ensure foreign key constraints are enabled
PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;


-- Users table to store name of user 
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT, -- userid is primary key 
    user_name TEXT NOT NULL   -- name of user 
);

CREATE TABLE IF NOT EXISTS settings (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL
);


-- Email accounts table to store email address for each user 
CREATE TABLE IF NOT EXISTS email_accounts (
    email_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_address TEXT NOT NULL,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Events table with ticket columns
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TEXT NOT NULL,  -- Event start date
    event_end TEXT NOT NULL,  -- Event end date
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT NULL,  -- timestamp when published
    status TEXT NOT NULL DEFAULT 'draft',
    child_price_quantity INTEGER DEFAULT 0,
    child_price_price REAL DEFAULT 0,
    adult_quantity INTEGER DEFAULT 0,
    adult_price REAL DEFAULT 0
);

-- Bookings table to track user bookings for each event
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,  -- The user who made the booking
    email_account_id INTEGER,  -- The email used to make the booking
    event_id INTEGER,  -- The event being booked
    event_s TEXT,      -- Start date of event 
    event_e TEXT,      -- End date of event
    childticket_type TEXT,  -- 'child'
    childquantity INTEGER,  -- The number of child price tickets booked
    childprice REAL,  -- The individual price for the tickets booked
    adultticket_type TEXT,  -- 'adult'
    adultquantity INTEGER,  -- The number of adult tickets booked
    adultprice REAL,  -- The individual price for the tickets booked
    tprice REAL,
    booking_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (email_account_id) REFERENCES email_accounts(email_account_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 1) Sample users
INSERT OR REPLACE INTO users (user_id, user_name) VALUES
  (1, 'Alice'),
  (2, 'Bob');

-- 2) Sample email accounts
INSERT OR REPLACE INTO email_accounts (email_account_id, email_address, user_id) VALUES
  (1, 'alice@example.com', 1),
  (2, 'bob@example.com',   2);

-- 3) Sample published events
INSERT OR REPLACE INTO events 
  (id, title, description, event_date, event_end, published_at, status, child_price_quantity, child_price_price, adult_quantity, adult_price)
VALUES
  (1, 'Jazz Night', 'An evening of smooth jazz vocals under the stars.', '2025-08-15', '2025-08-15', '2025-06-01 10:00:00', 'published', 50, 15.00, 100,30.00),
  (2, 'Classical Evening','Orchestral performances by our renowned musicians.','2025-09-10', '2025-09-14', '2025-06-15 12:00:00', 'published', 30,10.00,80,25.00);

-- 4) Sample draft events
INSERT OR REPLACE INTO events 
  (id, title, description,event_date,event_end,published_at, status,child_price_quantity, child_price_price, adult_quantity, adult_price)
VALUES
  (3, 'Vocal Culture Workshop', 'A workshop for aspiring singers to improve on their vocal techniques.', '2025-10-05', '2025-10-05', NULL,'draft',20,3.00, 20, 50.00),
  (4, 'Adult Violin Class','Learn Classical violin lessons from renowned teachers ','2025-11-20', '2025-11-20', NULL, 'draft', 10, 5.00, 50,20.00);

-- 5) Sample bookings (one per published event)
INSERT OR REPLACE INTO bookings 
  (user_id, email_account_id, event_id, event_s, event_e, childticket_type, childquantity, childprice, adultticket_type, adultquantity, adultprice, tprice, booking_date)
VALUES
  (1, 1, 1,'2025-08-15','2025-08-15','child',2,15.00,'adult',1, 30.00,60.00,'2025-06-20 14:30:00'),
  (2,2, 2, '2025-09-10','2025-09-10','child', 1, 10.00, 'adult', 2,25.00, 60.00, '2025-06-25 09:15:00');

-- 6) sample site settings
INSERT OR REPLACE INTO settings
  (id, name, description)
VALUES
  (1,'VoxPulse','Unleash your sound. Feel the pulse. Be VoxPulse.');


COMMIT;
