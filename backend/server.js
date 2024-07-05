const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const {hashPassword, comparePassword, generateToken, authenticateToken} = require('./helpers/utils');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static('public'));

const db = mysql.createConnection({
  host: 'api.pelaporan-infrastruktur.online', // sesuaikan dengan nama host database
  user: 'admin', // sesuaikan dengan nama user database
  password: 'U3:r6m£\0r5Q', // sesuaikan dengan password database
  database: 'u213693861_infrastruktur', // sesuaikan dengan nama database
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

app.get('/', (req, res) => {
  res.send('Bagian Backend dari Pelaporan Infrastruktur');
});

app.post('/register', (req, res) => {
  const hashedPassword = hashPassword(req.body.password);
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  const values = [req.body.username, req.body.email, hashedPassword];

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error('Error inserting data: ', err);
      return res.status(500).json({error: 'Error inserting data'});
    }
    return res.status(200).json(data);
  });
});

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Error fetching data: ', err);
      return res.status(500).json({error: 'Error fetching data'});
    }

    if (results.length === 0) {
      return res.status(400).json({error: 'User not found'});
    }

    const user = results[0];
    const isMatch = comparePassword(password[0], user.password);

    if (!isMatch) {
      return res.status(400).json({error: 'Invalid credentials'});
    }

    const token = generateToken(user);

    return res.status(200).json({token, username: user.username, email: user.email});
  });
});

app.post('/tambahberita', authenticateToken, (req, res) => {
  const sql = 'INSERT INTO beritas (judul, waktu, deskripsi, gambar) VALUES (?, ?, ?, ?)';
  const name = req.files.gambar.name;
  const file = req.files.gambar;
  const fileSize = file.data.length;
  const ext = path.extname(file.name);
  const fileName = file.md5 + ext;
  const url = `${req.protocol}://${req.get('host')}/images/${fileName}`;
  const allowedTypes = ['.png', '.jpg', '.jpeg'];

  if (!allowedTypes.includes(ext.toLowerCase())) return res.status(422).json({msg: 'Invalid image type'});
  if (fileSize > 5000000) return res.status(422).json({msg: 'Image must be less than 5mb'});

  file.mv(`./public/images/${fileName}`, async (err) => {
    if (err) return res.status(500).json({msg: err.message});
    try {
      console.log(req.body.judul);
      await db.query('INSERT INTO beritas (judul, waktu, deskripsi, gambar) VALUES (?, ?, ?, ?)', [req.body.judul, new Date(), req.body.deskripsi, url]);
      res.status(201).json({msg: 'Berita created successfully'});
    } catch (error) {
      console.log(error.message);
    }
  });

  // db.query(sql, values, (err, data) => {
  //   if (err) {
  //     console.error('Error inserting data: ', err);
  //     return res.status(500).json({error: 'Error inserting data'});
  //   }
  //   return res.status(200).json(data);
  // });
});

// route mengambil data dari mysql
app.get('/api/data', (req, res) => {
  const sql = 'SELECT * FROM beritas';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

// Route mengambil data berdasarkan id (detail berita)
app.get('/api/data/:id', (req, res) => {
  const {id} = req.params;
  const sql = 'SELECT * FROM beritas WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (results.length === 0) {
      return res.status(404).send('Berita not found');
    }
    res.json(results[0]);
  });
});

app.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
