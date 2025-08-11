/**
 * Репозиторий для работы с таблицей deals.
 */
class DealRepository {
    constructor(db) {
      this.db = db;
    }
  
    /**
     * Создать сделку. Возвращает созданную запись.
     */
    async create(deal) {
      const sql = `
        INSERT INTO deals (amo_id, title, status, price, pipeline_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
  
      const params = [
        deal.amo_id,
        deal.title,
        deal.status,
        deal.price,
        deal.pipeline_id,
        deal.created_at,
        deal.updated_at,
      ];
  
      const result = await this.db.exec(sql, params);
      return this.findById(result.insertId);
    }
  
    /**
     * Обновить сделку по amo_id. Возвращает обновлённую запись.
     */
    async update(amoId, deal) {
      const sql = `
        UPDATE deals
        SET title = ?, status = ?, price = ?, pipeline_id = ?, updated_at = ?
        WHERE amo_id = ?
      `;
  
      const params = [
        deal.title,
        deal.status,
        deal.price,
        deal.pipeline_id,
        deal.updated_at,
        amoId
      ];
  
      await this.db.exec(sql, params);
      return this.findByAmoId(amoId);
    }
  
    async findByAmoId(amoId) {
      const sql = `SELECT * FROM deals WHERE amo_id = ?`;
      const rows = await this.db.query(sql, [amoId]);
      return rows[0];
    }
  
    async findById(id) {
      const sql = `SELECT * FROM deals WHERE id = ?`;
      const rows = await this.db.query(sql, [id]);
      return rows[0];
    }
  
    /**
     * Получить список сделок (по умолчанию лимит 200).
     */
    async findAll(limit = 200) {
      limit = Number(limit) || 200;
      return this.db.query(`SELECT * FROM deals ORDER BY id DESC LIMIT ${limit}`);
    }
  }
  
  module.exports = DealRepository;
  