require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const Db = require('./models/db.mysql');

const ContactRepository = require('./repositories/contactRepository');
const ContactDealRepository = require('./repositories/contactDealRepository');
const DealRepository = require('./repositories/dealRepository');

const ContactService = require('./services/contactService');
const DealService = require('./services/dealService');

const WebhookController = require('./controllers/webhookController');

// Создаём Express приложение
const app = express();

// Парсинг JSON и x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Простейший лог всех входящих запросов в консоль — удобно для отладки
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url} Content-Type: ${req.headers['content-type']}`);
  next();
});

// Репозитории — слой доступа к данным
const contactRepository = new ContactRepository(Db);
const dealRepository = new DealRepository(Db);
const contactDealRepository = new ContactDealRepository(Db);

// Сервисы — бизнес-логика
const contactService = new ContactService(contactRepository);
const dealService = new DealService(dealRepository, contactDealRepository, contactRepository);

// Контроллер для обработки вебхуков
const webhookController = new WebhookController(contactService, dealService);

// Health-check — для мониторинга / readiness
app.get('/health', (req, res) => res.json({ ok: true }));

// Отладочные эндпоинты — показывают содержимое таблиц (только для локальной разработки)
app.get('/debug/contacts', async (req, res) => {
  try {
    const rows = await contactRepository.findAll();
    res.json(rows);
  } catch (err) {
    console.error('[Debug contacts] DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/deals/:id/contacts', async (req, res) => {
  try {
    const dealId = req.params.id;
    const contacts = await contactDealRepository.findDealContacts(dealId);
    res.json(contacts);
  } catch (err) {
    console.error('[Debug deal contacts] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/deals', async (req, res) => {
  try {
    const rows = await dealRepository.findAll();
    res.json(rows);
  } catch (err) {
    console.error('[Debug deals] DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинт для приёма вебхуков amoCRM
app.post('/webhooks', (req, res) => webhookController.handle(req, res));

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
