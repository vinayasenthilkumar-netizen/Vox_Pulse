/**
 * index.js
 * Main app entry point
 */

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));



// Initialize express-session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret', // password set ( also in .env file)
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Change to true if using HTTPS
}));

// Initialize SQLite & auto-migrate tables
global.db = new sqlite3.Database(
  path.join(__dirname, 'database.db'),
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error('SQLite open error:', err);
      process.exit(1);
    }
    console.log('Connected to SQLite');

    // Enable FKs
    global.db.run(`PRAGMA foreign_keys = ON;`);
    
  }
);

// Middleware to check if the organiser is authenticated
function checkOrganiserAuth(req, res, next) {
  if (req.session.loggedIn) {
    return next(); // Continue to the requested route
  } else {
    res.redirect('/organiser/login'); // Redirect to login page if not authenticated
  }
}

// Import route modules
const settingsRoutes = require('./routes/settings');
const eventsRoutes = require('./routes/events');

// Mount routes
app.use('/organiser/settings', settingsRoutes);
app.use('/organiser/events', eventsRoutes);



// Organiser Login Route GET
app.get('/organiser/login', (req, res) => {
  res.render('login', { error: null });
});

// Organiser Login POST Route
app.post('/organiser/login', (req, res) => {
  const { password } = req.body;

  // Compare the provided password with the one in the .env file
  if (password === process.env.ORG_PASSWORD) {
    req.session.loggedIn = true;  // Store login status in session
    res.redirect('/organiser');   // Redirect to organiser page
  } else {
    res.render('login', { error: 'Incorrect password!' });  // Show error if password is incorrect
  }
});



// Logout route
app.get('/organiser/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      // If there's an error while destroying the session, redirect back to the organiser home
      return res.redirect('/organiser');
    }
    // After destroying the session, redirect to the login page
    res.redirect('/');
  });
});


// Apply the authentication middleware to all organiser routes
app.use('/organiser', checkOrganiserAuth);

// Main Home with dynamic site name & description
app.get('/', (req, res, next) => {
  global.db.get(
    'SELECT name, description FROM settings WHERE id = 1',
    (err, site) => {
      if (err) return next(err);

      // Get next 3 published events for slides in home page (carousel)
      global.db.all(
        `SELECT title, event_date
         FROM events
         WHERE status = 'published'
         ORDER BY date(event_date) ASC
         LIMIT 3`,
        (errEv, slides) => {
          if (errEv) return next(errEv);

          // home page with the site name and description
          res.render('home', {
            name: site?.name || 'Event Manager',
            description: site?.description || '',
            slides
          });
        }
      );
    }
  );
});




// Route for displaying the organiser home page with the list of published events
app.get('/organiser', (req, res, next) => {
  global.db.get('SELECT name, description FROM settings WHERE id = 1', (err, site) => {
    if (err) return next(err);

    // Get the published events and their updated ticket quantities and other details
    global.db.all(
      `SELECT id, title, event_date, event_end, description, 
              child_price_quantity, child_price_price, adult_quantity, adult_price, created_at, published_at
       FROM events WHERE status = 'published' ORDER BY published_at DESC`,
      (errPub, published) => {
        if (errPub) return next(errPub);

        // Get the draft events and their updated ticket quantities and other details
        global.db.all(
          `SELECT id, title, event_date, event_end, description, 
                  child_price_quantity, child_price_price, adult_quantity, adult_price, created_at
           FROM events WHERE status = 'draft' ORDER BY created_at DESC`,
          (errDraft, drafts) => {
            if (errDraft) return next(errDraft);

            // Render the organiser page with the updated event data
            res.render('organiser', {
              name: site?.name || 'Untitled Site',
              description: site?.description || '',
              published,
              drafts
            });
          }
        );
      }
    );
  });
});



// Attendee Home with the list of published events in the order of event_date
app.get('/attendee', (req, res, next) => {
  global.db.get(
    'SELECT name, description FROM settings WHERE id = 1',  // site name and description 
    (err, site) => {
      if (err) return next(err);
      // Selects the events with published status to be displayed 
      global.db.all(
        `SELECT * FROM events WHERE status = 'published' ORDER BY date(event_date) ASC`,
        (errEvents, events) => {
          if (errEvents) return next(errEvents);
          // Render the event details page for the attendee 
          res.render('attendee', {
            name: site?.name || 'Untitled Site',
            description: site?.description || '',
            events
          });
        }
      );
    }
  );
});



// Route to display event details for an attendee
app.get('/attendee/events/:id', (req, res, next) => {
  const eventId = req.params.id;  // Get event ID from URL

  // Get site name and description
  global.db.get('SELECT name, description FROM settings WHERE id = 1', (err, site) => {
    if (err) return next(err);

    // Get the event details from the database
    global.db.get(
      `SELECT * FROM events WHERE id = ? AND status = 'published'`, 
      [eventId],
      (errEvent, event) => {
        if (errEvent) return next(errEvent);
        if (!event) return res.status(404).send('Event not found');

        // Render the event details page for the attendee event page 
        res.render('attendeeEvent', {
          name: site?.name || 'Untitled Site',
          description: site?.description || '',
          event  // The updated event data is passed here
        });
      }
    );
  });
});

// 
 
// Helper function to insert user into the users table
function insertUser(attendee_name, callback) {
  global.db.run(
    `INSERT INTO users (user_name) VALUES (?)`,
    [attendee_name],
    function (err) {
      if (err) return callback(err);
      callback(null, this.lastID); // Return the user_id
    }
  );
}

// Helper function to insert email into the email_accounts table
function insertEmail(attendee_email, user_id, callback) {
  global.db.run(
    `INSERT INTO email_accounts (email_address, user_id) VALUES (?, ?)`,
    [attendee_email, user_id],
    function (err) {
      if (err) return callback(err);
      callback(null, this.lastID); // Return the email_account_id
    }
  );
}

// Helper function to get event details from the events table
function getEvent(eventId, callback) {
  global.db.get(
    'SELECT * FROM events WHERE id = ? AND status = "published"',
    [eventId],
    callback
  );
}

// Helper function to insert booking details into the bookings table
// these are the parameters in the functions as these chnage for every booking 
function insertBooking(user_id, email_account_id, eventId, child_price_quantity, adult_quantity, totalPrice, event, callback) {
  const childPricePrice = event.child_price_price;
  const adultPrice = event.adult_price;
  
  const childPriceTotal = child_price_quantity * childPricePrice;
  const adultTotal = adult_quantity * adultPrice;

  // Put in the values according to the attributes for the booking table 
  global.db.run(
    `INSERT INTO bookings (user_id, email_account_id, event_id, event_s, event_e, childticket_type, childquantity, childprice, adultticket_type, adultquantity, adultprice, tprice)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id, 
      email_account_id, 
      eventId, 
      event.event_date, 
      event.event_end, 
      'Child', 
      child_price_quantity, 
      childPricePrice, 
      'Adult', 
      adult_quantity, 
      adultPrice, 
      totalPrice
    ], 
    function (err) {
      if (err) return callback(err);
      callback(null); // Callback after insertion
    }
  );
}


// Post route for booking event in attendee event  
app.post('/attendee/events/:id/book', (req, res, next) => {
  const eventId = req.params.id; // Get event ID from URL
  const { child_price_quantity, adult_quantity, attendee_name, attendee_email } = req.body;

  // Check if user already exists
  global.db.get('SELECT user_id FROM users WHERE user_name = ?', [attendee_name], (err, user) => {
    if (err) return next(err);


    // For New Users     
    // If the user does not exist, create a new user
    if (!user) {
      insertUser(attendee_name, (err, userId) => {
        if (err) return next(err);

        // After user creation, insert email
        insertEmail(attendee_email, userId, (err, emailAccountId) => {
          if (err) return next(err);

          // Get the event details
          getEvent(eventId, (err, event) => {
            if (err) return next(err);
            if (!event) return res.status(404).send('Event not found');

            // Calculate total price for booking
            const childPriceTotal = child_price_quantity * event.child_price_price;
            const adultTotal = adult_quantity * event.adult_price;
            const totalPrice = childPriceTotal + adultTotal;

            // Update ticket quantities in the events table
            const newChildQuantity = event.child_price_quantity - child_price_quantity;
            const newAdultQuantity = event.adult_quantity - adult_quantity;

            // Ensure there are enough tickets
            if (newChildQuantity < 0 || newAdultQuantity < 0) {
              return res.status(400).send('Not enough tickets available');
            }

            // Insert booking details
            insertBooking(userId, emailAccountId, 
              eventId, child_price_quantity, adult_quantity, totalPrice, event, (err) => {
              if (err) return next(err);

              // Update the event with the new ticket quantities
              global.db.run(
                `UPDATE events
                 SET child_price_quantity = ?, adult_quantity = ?
                 WHERE id = ?`,
                [newChildQuantity, newAdultQuantity, eventId],
                (errUpdate) => {
                  if (errUpdate) return next(errUpdate);
                  res.redirect('/attendee');  // Redirect to attendee page after successful booking 
                }
              );
            });
          });
        });
      });
    } else {

      // For Existing Users
      // If user exists, insert email and proceed with booking
      insertEmail(attendee_email, user.user_id, (err, emailAccountId) => {
        if (err) return next(err);

        // Get the event details
        getEvent(eventId, (err, event) => {
          if (err) return next(err);
          if (!event) return res.status(404).send('Event not found');

          // Calculate total price for booking
          const childPriceTotal = child_price_quantity * event.child_price_price;
          const adultTotal = adult_quantity * event.adult_price;
          const totalPrice = childPriceTotal + adultTotal;

          // Update ticket quantities in the events table
          const newChildQuantity = event.child_price_quantity - child_price_quantity;
          const newAdultQuantity = event.adult_quantity - adult_quantity;

          // Ensure there are enough tickets
          if (newChildQuantity < 0 || newAdultQuantity < 0) {
            return res.status(400).send('Not enough tickets available');
          }

          // Insert booking details
          insertBooking(user.user_id, emailAccountId, 
            eventId, child_price_quantity, adult_quantity, totalPrice, event, (err) => {
            if (err) return next(err);

            // Update the event with the new ticket quantities
            global.db.run(
              `UPDATE events
               SET child_price_quantity = ?, adult_quantity = ?
               WHERE id = ?`,
              [newChildQuantity, newAdultQuantity, eventId],
              (errUpdate) => {
                if (errUpdate) return next(errUpdate);
                res.redirect('/attendee');  // Redirect to attendee page after successful booking
              }
            );
          });
        });
      });
    }
  });
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
