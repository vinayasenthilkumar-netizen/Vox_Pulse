# VoxPulse Event Manager — CM2040 Coursework Submission

## Overview

**VoxPulse** is a web based music event management system built for Managing Music Events and Booking.It utilises Node.js, Express, SQLite, and EJS as part of the CM2040 module: Database, Networks, and the Web

It enables:
- Organiser to create, edit, publish, and delete music events
- Organiser to update the site settings accordingly
- Attendees to browse upcoming events and book tickets
- Real time updates to event ticket quantities and pricing
- A full history of bookings for each event
- Proper updating of the database 

---------------------------------------------------------------------------------------

## Libraries Used

- Express.js                                 
- SQLite3                                    
- EJS (Embedded JavaScript Templates)        
- Bootstrap 5 (via static files)             
- express-session                          
- dotenv                                  

---------------------------------------------------------------------------------------

## Installation & Setup

#### How i installed the dependencies

- ```npm install```                        - Installs the packages needed to run the application
- ```npm install express-session dotenv``` - Adds **session management** and **environment variable** support
- ```npm install bootstrap```              - Installs **Bootstrap** for styling with prebuilt CSS and components 
- ```npm install express ejs sqlite3```    - Installs **Express framework**, **EJS** template engine, and **SQLite** database driver 

------------------------------------------------------------------------------------------------------------

## How to run the application 

- ```npm install```          - Installs the packages needed to run the application
- ```npm run clean-db-win``` - Deletes the database.db file on Windows to reset the database 
- ```npm run build-db-win``` - Recreates the database.db file on Windows using the db_schema.sql script 
- ```npm run start```        - start the application 

---------------------------------------------------------------------------------------
## Password 

- **Password** for the **Organiser Login** : Music@
- For your information this is located in the .env file with this code : ORG_PASSWORD=Music@

---------------------------------------------------------------------------------------

## How to test the Application 

#### My application can be tested by using the following routes

- http://localhost:3000              - Main home page 
- http://localhost:3000/organiser    - Organiser home page ( will go to the Login page for authentication )
- http://localhost:3000/attendee     - Attendee home page

---------------------------------------------------------------------------------------