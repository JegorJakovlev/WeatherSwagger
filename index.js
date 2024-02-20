const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); 
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const app = express();
const PORT = process.env.PORT || 3000;
const keys = require('./config/keys');

const connection = mysql.createConnection(keys.mysql);

connection.connect(err => {
  if (err) {
    console.error('Ошибка подключения к базе данных MySQL:', err);
  } else {
    console.log('Подключение к базе данных MySQL успешно');
    createTables(); 
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function createTables() {
  const createUsersTableSql = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
  )`;

  const createWeatherDataTableSql = `CREATE TABLE IF NOT EXISTS weather_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    date DATE NOT NULL,
    windSpeed DECIMAL(5,2) NOT NULL
  )`;

  connection.query(createUsersTableSql, err => {
    if (err) console.error('Ошибка при создании таблицы пользователей:', err);
    else console.log('Таблица пользователей успешно создана');
  });

  connection.query(createWeatherDataTableSql, err => {
    if (err) console.error('Ошибка при создании таблицы данных о погоде:', err);
    else console.log('Таблица данных о погоде успешно создана');
  });
}


app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

 
  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен содержать не менее 8 символов' });
  }

 
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Ошибка при хешировании пароля:', err);
      return res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }
    
    
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    connection.query(sql, [username, email, hash], (err, result) => {
      if (err) {
        console.error('Ошибка при регистрации пользователя:', err);
        res.status(400).json({ error: 'Ошибка при регистрации пользователя' });
      } else {
        console.log('Пользователь успешно зарегистрирован');
        res.status(200).json({ message: 'Пользователь успешно зарегистрирован' });
      }
    });
  });
});


app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  connection.query(sql, [email], (err, result) => {
    if (err) {
      console.error('Ошибка при входе пользователя:', err);
      res.status(400).json({ error: 'Ошибка при входе пользователя' });
    } else if (result.length === 0) {
      console.log('Неверные учетные данные');
      res.status(401).json({ error: 'Неверные учетные данные' });
    } else {
      const user = result[0];
  
      bcrypt.compare(password, user.password, (err, isValid) => {
        if (err || !isValid) {
          console.error('Неверные учетные данные');
          res.status(401).json({ error: 'Неверные учетные данные' });
        } else {
          console.log('Вход успешно выполнен');
          res.status(200).json({ message: 'Вход успешно выполнен' });
        }
      });
    }
  });
});

app.put('/api/auth/update', (req, res) => {
  const { id, username, email, password } = req.body;
  const sql = 'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?';
  connection.query(sql, [username, email, password, id], (err, result) => {
    if (err) {
      console.error('Ошибка при обновлении учетной записи пользователя:', err);
      res.status(400).json({ error: 'Ошибка при обновлении учетной записи пользователя' });
    } else {
      console.log('Учетная запись пользователя успешно обновлена');
      res.status(200).json({ message: 'Учетная запись пользователя успешно обновлена' });
    }
  });
});

app.post('/api/weather', (req, res) => {
  const { city, temperature, date, windSpeed } = req.body;
  const sql = 'INSERT INTO weather_data (city, temperature, date, windSpeed) VALUES (?, ?, ?, ?)';
  connection.query(sql, [city, temperature, date, windSpeed], (err, result) => {
    if (err) {
      console.error('Ошибка при добавлении данных о погоде:', err);
      res.status(400).json({ error: 'Ошибка при добавлении данных о погоде' });
    } else {
      console.log('Данные о погоде успешно добавлены');
      res.status(200).json({ message: 'Данные о погоде успешно добавлены' });
    }
  });
});


app.delete('/api/auth/delete/:email', (req, res) => {
  const email = req.params.email;
  const sql = 'DELETE FROM users WHERE email = ?';
  connection.query(sql, [email], (err, result) => {
    if (err) {
      console.error('Ошибка при удалении учетной записи пользователя:', err);
      res.status(500).json({ error: 'Ошибка при удалении учетной записи пользователя' });
    } else {
      if (result.affectedRows === 0) {
        console.log(`Учетная запись пользователя с email ${email} не найдена`);
        res.status(404).json({ message: `Учетная запись пользователя с email ${email} не найдена` });
      } else {
        console.log(`Учетная запись пользователя с email ${email} успешно удалена`);
        res.status(200).json({ message: `Учетная запись пользователя с email ${email} успешно удалена` });
      }
    }
  });
});


app.put('/api/weather', (req, res) => {
  const { city, temperature, date, windSpeed } = req.body;
  const sql = 'UPDATE weather_data SET temperature = ?, windSpeed = ? WHERE city = ? AND date = ?';
  connection.query(sql, [temperature, windSpeed, city, date], (err, result) => {
    if (err) {
      console.error('Ошибка при обновлении данных о погоде:', err);
      res.status(400).json({ error: 'Ошибка при обновлении данных о погоде' });
    } else {
      if (result.affectedRows === 0) {
        console.log('Данные о погоде для указанного города и даты не найдены');
        res.status(404).json({ message: 'Данные о погоде для указанного города и даты не найдены' });
      } else {
        console.log(`Данные о погоде для города ${city} и даты ${date} успешно обновлены`);
        res.status(200).json({ message: 'Данные о погоде успешно обновлены' });
      }
    }
  });
});


app.get('/api/weather', (req, res) => {
  const city = req.query.city;
  const date = req.query.date;

  if (!city && !date) {
    res.status(400).json({ error: 'Не указан город или дата в параметрах запроса' });
    return;
  }

  let sql;
  let queryParams = [];

  if (city && date) {
    sql = 'SELECT * FROM weather_data WHERE city = ? AND date = ?';
    queryParams = [city, date];
  } else if (city) {
    sql = 'SELECT * FROM weather_data WHERE city = ?';
    queryParams = [city];
  } else if (date) {
    sql = 'SELECT * FROM weather_data WHERE date = ?';
    queryParams = [date];
  }

  connection.query(sql, queryParams, (err, result) => {
    if (err) {
      console.error('Ошибка при получении данных о погоде:', err);
      res.status(500).json({ error: 'Ошибка при получении данных о погоде' });
    } else {
      if (result.length === 0) {
        console.log('Данные о погоде не найдены');
        res.status(404).json({ message: 'Данные о погоде не найдены' });
      } else {
        console.log('Данные о погоде успешно найдены');
        res.status(200).json(result);
      }
    }
  });
});


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
