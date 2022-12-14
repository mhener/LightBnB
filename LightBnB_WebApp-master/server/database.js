const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'vagrant'
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

/* getUserWithEmail
Accepts an email address and will return a promise.
The promise should resolve with a user object with the given email address, or null if that user does not exist.
*/

const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email = $1;`, [email])
    .then((result) => {
      console.log(result.rows);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = (id) => {
  return pool
    .query(`SELECT name FROM users WHERE id = $1;`, [id])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

/* 
Accepts a user object that will have a name, email, and password property
This function should insert the new user into the database.
It will return a promise that resolves with the new user object. 
This object should contain the user's id after it's been added to the database.
Add RETURNING *; to the end of an INSERT query to return the objects that were inserted. 
This is handy when you need the auto generated id of an object you've just added to the database.
*/
const addUser =  (user) => {
  return pool.query(`
  INSERT INTO users(name, email, password)
  VALUES($1, $2, $3)
  RETURNING *;
`, [user.name, user.email, user.password])
    .then(res => {
      return res.rows[0];
    })
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
  .query(`SELECT reservations.*, properties.title, properties.cost_per_night, avg(rating) as average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = $1
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT $2;`, [guest_id, limit])
  .then((result) => {
    console.log(result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `AND owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night));
    queryString += `AND cost_per_night >= $${queryParams.length}`;
    queryParams.push(Number(options.maximum_price_per_night));
    queryString += `AND cost_per_night <= $${queryParams.length}`;
  }

  // 4
  queryString += `GROUP BY properties.id `;
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += `HAVING avg(rating) >= $${queryParams.length}`;
  }
  queryParams.push(limit);
  queryString += `ORDER BY cost_per_night
  LIMIT $${queryParams.length};
`;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams)
    .then(res => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryString = `
  INSERT INTO properties (title, description, owner_id, cover_photo_url, thumbnail_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, province, city, country, street, post_code) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
  `;
  const queryParams = [property.title, property.description, property.owner_id, property.cover_photo_url, property.thumbnail_photo_url, property.cost_per_night, Number(property.parking_spaces), Number(property.number_of_bathrooms), Number(property.number_of_bedrooms), property.province, property.city, property.country, property.street, property.post_code]

  return db.query(queryString, queryParams) 
    .then(res => res.rows[0])
    .catch(err => err);
}
exports.addProperty = addProperty;
