// routes/settings.js

const express = require('express');
const router = express.Router();


// Display the Site Settings form

// When the organiser visits `/organiser/settings`, 
// Get the current site name and description (row with id = 1). Render the settings view
// with values so the form is already filled.

router.get('/', (req, res, next) => {
  global.db.get(
    'SELECT name, description FROM settings WHERE id = 1',
    (err, row) => {
      if (err) return next(err);
      res.render('settings', {
        // Use empty strings if no record exists yet
        name:        row?.name        || '',
        description: row?.description || '',
        error:       null
      });
    }
  );
});


// Handle Site Settings form submission

// Validate that both fields are not empty. If validation fails, re-render
// Form with an error message else Save (or replace)
// settings row and redirect back to the organiser page.

router.post('/', (req, res, next) => {
  const { name, description } = req.body;

  // Basic validation: neither field may be blank
  if (!name.trim() || !description.trim()) {
    return res.render('settings', {
      name,
      description,
      error: 'Both fields are required.'
    });
  }

  // Insert a new row or replace the existing one (always id = 1 so it always upadtes that one row )
  global.db.run(
    `INSERT OR REPLACE INTO settings (id, name, description)
     VALUES (1, ?, ?)`,
    [ name.trim(), description.trim() ],
    err => {
      if (err) return next(err);
      // After saving, go back to organiser home
      res.redirect('/organiser');
    }
  );
});

module.exports = router;
