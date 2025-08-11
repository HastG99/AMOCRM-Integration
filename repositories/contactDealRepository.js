/**
 * Репозиторий для таблицы contact_deal (many-to-many контактов и сделок).
 * Включает операции добавления связей, удаления и синхронизации (транзакция).
 */
class ContactDealRepository {
    constructor(db) {
      this.db = db;
    }
  
    /**
     * Привязать контакт к сделке (если связь уже есть — silently ignore).
     */
    async linkContactToDeal(contactId, dealId) {
      const sql = `
        INSERT INTO contact_deal (contact_id, deal_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE contact_id=contact_id
      `;
      await this.db.query(sql, [contactId, dealId]);
    }
  
    /**
     * Удалить все связи для сделки (используется при полной синхронизации)
     */
    async unlinkAllDealContacts(dealId) {
      await this.db.query('DELETE FROM contact_deal WHERE deal_id = ?', [dealId]);
    }
  
    /**
     * Получить контакты, связанные с указанной сделкой
     */
    async findDealContacts(dealId) {
      return this.db.query(`
        SELECT contacts.* 
        FROM contacts
        JOIN contact_deal ON contacts.id = contact_deal.contact_id
        WHERE contact_deal.deal_id = ?
      `, [dealId]);
    }
  
    /**
     * Полная синхронизация: удаляем старые связи и вставляем новые в рамках транзакции.
     * Это гарантирует целостность данных, если произойдёт ошибка — откатим изменения.
     */
    async syncDealContacts(dealId, contactIds) {
      const connection = await this.db.getConnection();
      try {
        await connection.beginTransaction();
  
        await connection.query('DELETE FROM contact_deal WHERE deal_id = ?', [dealId]);
  
        for (const contactId of contactIds) {
          await connection.query(
            'INSERT INTO contact_deal (contact_id, deal_id) VALUES (?, ?)',
            [contactId, dealId]
          );
        }
  
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    }
  }
  
  module.exports = ContactDealRepository;
  