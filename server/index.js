import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ServerApiVersion } from 'mongodb';

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/szkolny-wezel';
const jwtSecret = process.env.JWT_SECRET || 'development-secret-change-me';

app.use(cors());
app.use(express.json());

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['Nauczyciel', 'Dyrektor', 'Pedagog'] },
});

const studentSchema = new mongoose.Schema({
  id: Number,
  name: String,
  status: String,
  lastExit: String,
  avatarBg: String,
}, { _id: false });

const activitySchema = new mongoose.Schema({
  id: Number,
  studentName: String,
  exitTime: String,
  returnTime: String,
  duration: String,
  reason: String,
  status: String,
}, { _id: false });

const classSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  studentsCount: Number,
  exitsToday: Number,
  teacher: String,
  students: [studentSchema],
  activityHistory: [activitySchema],
});

const User = mongoose.model('User', userSchema);
const SchoolClass = mongoose.model('SchoolClass', classSchema);

const demoClasses = [
  {
    id: '3A', name: '3A', studentsCount: 32, exitsToday: 24, teacher: 'Jan Nowak',
    students: [
      { id: 1, name: 'Jan Kowalski', status: 'Na zewnątrz', lastExit: '11:32 (6 min temu)', avatarBg: '#8b5cf6' },
      { id: 2, name: 'Anna Nowak', status: 'Na zewnątrz', lastExit: '11:28 (10 min temu)', avatarBg: '#3b82f6' },
      { id: 3, name: 'Mateusz Wiśniewski', status: 'Wrócił', lastExit: '11:15', avatarBg: '#10b981' },
      { id: 4, name: 'Zofia Dąbrowska', status: 'Obecna', lastExit: '-', avatarBg: '#6b7280' },
      { id: 5, name: 'Kacper Zieliński', status: 'Wrócił', lastExit: '10:45', avatarBg: '#f59e0b' },
      { id: 6, name: 'Julia Kowalczyk', status: 'Obecna', lastExit: '-', avatarBg: '#ec4899' },
      { id: 7, name: 'Michał Kamiński', status: 'Na zewnątrz', lastExit: '11:35 (3 min temu)', avatarBg: '#6366f1' },
    ],
    activityHistory: [
      { id: 101, studentName: 'Michał Kamiński', exitTime: '11:35', returnTime: 'w trakcie', duration: '3 min', reason: 'Łazienka', status: 'Na zewnątrz' },
      { id: 102, studentName: 'Jan Kowalski', exitTime: '11:32', returnTime: 'w trakcie', duration: '6 min', reason: 'Łazienka', status: 'Na zewnątrz' },
      { id: 103, studentName: 'Anna Nowak', exitTime: '11:28', returnTime: 'w trakcie', duration: '10 min', reason: 'Pielęgniarka', status: 'Na zewnątrz' },
      { id: 104, studentName: 'Mateusz Wiśniewski', exitTime: '11:10', returnTime: '11:15', duration: '5 min', reason: 'Łazienka', status: 'Zakończone' },
    ],
  },
  { id: '1A', name: '1A', studentsCount: 28, exitsToday: 12, teacher: 'Anna Maj', students: [], activityHistory: [] },
  { id: '1B', name: '1B', studentsCount: 30, exitsToday: 9, teacher: 'Marek Kowal', students: [], activityHistory: [] },
  { id: '2A', name: '2A', studentsCount: 29, exitsToday: 7, teacher: 'Ewa Wiśniewska', students: [], activityHistory: [] },
  { id: '2C', name: '2C', studentsCount: 27, exitsToday: 8, teacher: 'Karolina Wójcik', students: [], activityHistory: [] },
  { id: '3B', name: '3B', studentsCount: 31, exitsToday: 11, teacher: 'Tomasz Pawlak', students: [], activityHistory: [] },
  { id: '3C', name: '3C', studentsCount: 25, exitsToday: 6, teacher: 'Natalia Król', students: [], activityHistory: [] },
  { id: '2B', name: '2B', studentsCount: 26, exitsToday: 5, teacher: 'Piotr Zieliński', students: [], activityHistory: [] },
];

const createToken = (user) => jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '8h' });

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego.' });

  try {
    req.auth = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ message: 'Sesja wygasła. Zaloguj się ponownie.' });
  }
};

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase(), role });
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return res.status(401).json({ message: 'Nieprawidłowy e-mail, hasło lub rola.' });
    }

    res.json({
      token: createToken(user),
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/classes', requireAuth, async (req, res, next) => {
  try {
    const classes = await SchoolClass.find().sort({ name: 1 }).lean();
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

app.get('/api/classes/:id', requireAuth, async (req, res, next) => {
  try {
    const schoolClass = await SchoolClass.findOne({ id: req.params.id }).lean();
    if (!schoolClass) return res.status(404).json({ message: 'Nie znaleziono klasy.' });
    res.json(schoolClass);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  void req;
  void next;
  console.error(error);
  res.status(500).json({ message: 'Wystąpił błąd serwera.' });
});

const seedDatabase = async () => {
  if (!(await User.exists({}))) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await User.create({ email: 'admin@szkolnywezel.pl', passwordHash, name: 'Jan Nowak', role: 'Nauczyciel' });
    console.log('Utworzono konto demo: admin@szkolnywezel.pl / admin123');
  }
  if (!(await SchoolClass.exists({}))) {
    await SchoolClass.insertMany(demoClasses);
    console.log('Utworzono dane demo klas.');
  }
};

mongoose.connect(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
  .then(seedDatabase)
  .then(() => app.listen(port, () => console.log(`API działa na porcie ${port}`)))
  .catch((error) => {
    console.error('Nie można połączyć z MongoDB:', error.message);
    process.exit(1);
  });
