const express = require('express');
const router = express.Router();


// Base route

// When someone goes to `/organiser`, they will be redirected to the organiser page.

router.get('/', (req, res) => {
  res.redirect('/organiser');
});


// Show Create Event form

// Gives an empty event object so the form fields start blank.

router.get('/new', (req, res) => {
  res.render('createEvent', {
    event: {
      title: '',
      event_date: '',
      event_end: '',
      description: '',
      child_price_quantity: 0,
      child_price_price: 0,
      adult_quantity: 0,
      adult_price: 0
    }
  });
});


// Handle new event submission

// Reads form fields from req.body and inserts a new row into the events table.

router.post('/new', (req, res, next) => {
  const {
    title,
    description,
    event_date,
    event_end,
    child_price_quantity = 0,
    child_price_price = 0,
    adult_quantity = 0,
    adult_price = 0
  } = req.body;

  global.db.run(
    `INSERT INTO events
       (title, description, event_date, event_end,
        child_price_quantity, child_price_price,
        adult_quantity, adult_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      event_date,
      event_end,
      child_price_quantity,
      child_price_price,
      adult_quantity,
      adult_price
    ],
    function(err) {
      if (err) return next(err);
      // After saving, show the organiser home again
      res.redirect('/organiser');
    }
  );
});


// Show Edit Event form

// Gets the existing event by ID and passes it to the edit template.
// The form fields will be populated initially with the current values.

router.get('/:id/edit', (req, res, next) => {
  const { id } = req.params;
  global.db.get(
    'SELECT * FROM events WHERE id = ?',
    [id],
    (err, event) => {
      if (err) return next(err);
      res.render('editEvent', { event });
    }
  );
});


// Handle event updates

// Takes the submitted form data and updates the respective event row.
// Records modified_at timestamp to track changes.

router.post('/:id/edit', (req, res, next) => {
  const { id } = req.params;
  const {
    title,
    description,
    event_date,
    event_end,
    child_price_quantity = 0,
    child_price_price = 0,
    adult_quantity = 0,
    adult_price = 0
  } = req.body;

  global.db.run(
    `UPDATE events
       SET title = ?,
           description = ?,
           event_date = ?,
           event_end = ?,
           child_price_quantity = ?,
           child_price_price = ?,
           adult_quantity = ?,
           adult_price = ?,
           modified_at = datetime('now')
     WHERE id = ?`,
    [
      title,
      description,
      event_date,
      event_end,
      child_price_quantity,
      child_price_price,
      adult_quantity,
      adult_price,
      id
    ],
    function(err) {
      if (err) return next(err);
      // Return to organiser dashboard once saved
      res.redirect('/organiser');
    }
  );
});


// Delete an event (and its bookings)

// First removes any bookings tied to this event to maintain integrity,
// then delete the event itself. Redirects Organiser page on success.

router.post('/:id/delete', (req, res, next) => {
  const { id } = req.params;

  // Remove related bookings first
  global.db.run(
    'DELETE FROM bookings WHERE event_id = ?',
    [id],
    function(err) {
      if (err) return next(err);

      // Then delete the event record
      global.db.run(
        'DELETE FROM events WHERE id = ?',
        [id],
        function(err) {
          if (err) return next(err);
          res.redirect('/organiser');
        }
      );
    }
  );
});


// Publish a draft event

// Marks a draft as published and records the publish timestamp.
// After updating, sends the organiser back to the organiser page.

router.post('/:id/publish', (req, res, next) => {
  const { id } = req.params;
  global.db.run(
    `UPDATE events
       SET status = 'published',
           published_at = datetime('now')
     WHERE id = ?`,
    [id],
    err => {
      if (err) return next(err);
      res.redirect('/organiser');
    }
  );
});


// View all bookings

// Joins bookings, users, email_accounts, and events.
// Format the dates , gets site settings, and renders the bookings page.

router.get('/view-bookings', (req, res, next) => {
  global.db.all(
    `SELECT b.booking_id,
            u.user_name,
            ea.email_address,
            e.title,
            b.event_s, b.event_e,
            b.childticket_type,
            b.childquantity,
            e.child_price_price,
            b.adultticket_type,
            b.adultquantity,
            e.adult_price,
            b.tprice,
            b.booking_date
     FROM bookings b
     LEFT JOIN users u       ON b.user_id = u.user_id
     LEFT JOIN email_accounts ea ON b.email_account_id = ea.email_account_id
     LEFT JOIN events e      ON b.event_id = e.id
     ORDER BY b.booking_date DESC`,
    (err, bookings) => {
      if (err) return next(err);

      // Convert the raw date strings into human-friendly formats
      bookings.forEach(booking => {
        booking.start_date   = new Date(booking.event_s).toLocaleDateString();
        booking.end_date     = new Date(booking.event_e).toLocaleDateString();
        booking.booking_date = new Date(booking.booking_date).toLocaleString();
      });

      // Get the site’s name & description for the page header
      global.db.get(
        'SELECT name, description FROM settings WHERE id = 1',
        (err, site) => {
          if (err) return next(err);

          // Render the template with all gathered data
          res.render('viewBookings', {
            bookings,
            name:        site?.name        || 'Untitled Site',
            description: site?.description || 'No description available'
          });
        }
      );
    }
  );
});

module.exports = router;
