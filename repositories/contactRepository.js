/**
 * Репозиторий для работы с таблицей contacts.
 * Методы возвращают объект записи или null.
 */
class ContactRepository {
    constructor(db) {
      this.db = db;
    }
  
    /**
     * Поиск по нормализованному телефону (без символов, только цифры).
     * Возвращает первую найденную запись или null.
     */
    async findByNormalizedPhone(normalizedPhone) {
      if (!normalizedPhone) return null;
      const sql = `SELECT * FROM contacts WHERE normalized_phone = ?`;
      const rows = await this.db.query(sql, [normalizedPhone]);
      return rows[0];
    }
  
    /**
     * Поиск по внешнему идентификатору amo_id
     */
    async findByAmoId(amoId) {
      const sql = `SELECT * FROM contacts WHERE amo_id = ?`;
      const rows = await this.db.query(sql, [amoId]);
      return rows[0];
    }
  
    /**
     * Создать контакт.
     * Возвращает полностью созданную запись (чтобы получить insertId и поля).
     */
    async create(contact) {
      const sql = `
        INSERT INTO contacts (amo_id, name, phone, normalized_phone, email, company_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const params = [
        contact.amo_id,
        contact.name,
        contact.phone,
        contact.normalized_phone,
        contact.email,
        contact.company_name,
        contact.created_at,
        contact.updated_at,
      ];
  
      const result = await this.db.exec(sql, params);
      return this.findById(result.insertId);
    }
  
    /**
     * Обновить контакт по amo_id.
     * Возвращает обновлённую запись.
     */
    async update(amoId, contact) {
      const sql = `
        UPDATE contacts
        SET name = ?, phone = ?, normalized_phone = ?, email = ?, company_name = ?, updated_at = ?
        WHERE amo_id = ?
      `;
  
      const params = [
        contact.name,
        contact.phone,
        contact.normalized_phone,
        contact.email,
        contact.company_name,
        contact.updated_at,
        amoId
      ];
  
      await this.db.exec(sql, params);
      return this.findByAmoId(amoId);
    }
  
    async findById(id) {
      const sql = `SELECT * FROM contacts WHERE id = ?`;
      const rows = await this.db.query(sql, [id]);
      return rows[0];
    }
  
    // Повтор метода findByAmoId для удобства API репозитория
    async findByAmoIdDuplicate(amoId) {
      return this.findByAmoId(amoId);
    }
  
    /**
     * Получить список контактов (по умолчанию лимит 200).
     */
    async findAll(limit = 200) {
      limit = Number(limit) || 200;
      return this.db.query(`SELECT * FROM contacts ORDER BY id DESC LIMIT ${limit}`);
    }
  }
  
  module.exports = ContactRepository;
  