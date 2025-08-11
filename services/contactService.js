/**
 * Сервис для обработки контактов, пришедших из вебхуков amoCRM.
 * Логика:
 * - извлечь телефон и email из custom_fields
 * - нормализовать телефон (оставить только цифры)
 * - попытаться найти существующий контакт по нормализованному телефону или по amo_id
 * - создать или обновить запись в БД
 */

/** Преобразует unix timestamp (в секундах) к формату MySQL DATETIME */
function toMysqlDatetime(unixTimestamp) {
    if (!unixTimestamp) return null;
    const date = new Date(unixTimestamp * 1000);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  /** Убирает из телефона всё кроме цифр */
  function normalizePhone(phone) {
    if (!phone) return null;
    return phone.replace(/\D/g, '');
  }
  
  /** Извлекает телефон из custom_fields (с учётом возможного поля code='PHONE' или имени поля, содержащего 'телефон') */
  function extractPhone(contact) {
    if (!contact.custom_fields) return null;
    const phoneField = contact.custom_fields.find(field =>
      field.code === 'PHONE' || (field.name || '').toLowerCase().includes('телефон')
    );
    if (!phoneField || !phoneField.values || phoneField.values.length === 0) return null;
    return phoneField.values[0].value;
  }
  
  /** Извлекает email из custom_fields (по code='EMAIL' или имени поля содержащему 'email') */
  function extractEmail(contact) {
    if (!contact || !contact.custom_fields) return null;
  
    const emailField = contact.custom_fields.find(field => {
      if (!field) return false;
      const fieldName = field.name || '';
      const fieldCode = field.code || '';
      return fieldCode === 'EMAIL' || fieldName.toLowerCase().includes('email');
    });
  
    return emailField?.values?.[0]?.value || null;
  }
  
  class ContactService {
    constructor(contactRepository) {
      this.contactRepository = contactRepository;
    }
  
    /**
     * Обработка контакта из вебхука.
     * eventType = 'add' | 'update'
     */
    async processContactFromWebhook(contact, eventType) {
      const phone = extractPhone(contact);
      const normalized_phone = normalizePhone(phone);
      const email = extractEmail(contact);
      const created_at = toMysqlDatetime(contact.created_at);
      const updated_at = toMysqlDatetime(contact.updated_at);
  
      const contactData = {
        name: contact.name || '',
        phone,
        normalized_phone,
        email,
        company_name: contact.company_name || null,
        created_at,
        updated_at
      };
  
      try {
        let existingContact = null;
        if (normalized_phone) {
          // Ищем по нормализованному телефону — это помогает сопоставлять контакты, пришедшие с разных каналов
          existingContact = await this.contactRepository.findByNormalizedPhone(normalized_phone);
        }
  
        // Если не нашли по телефону — пробуем по внешнему amo_id
        if (!existingContact && contact.id) {
          existingContact = await this.contactRepository.findByAmoId(contact.id);
        }
  
        if (eventType === 'add') {
          if (existingContact) {
            // Если contact уже существует — это потенциальная конфликтная ситуация
            throw new Error('Contact already exists');
          }
          return await this.contactRepository.create({
            ...contactData,
            amo_id: contact.id
          });
        } else if (eventType === 'update') {
          if (!existingContact) {
            // При обновлении, если не было найдено — создаём
            return await this.contactRepository.create({
              ...contactData,
              amo_id: contact.id
            });
          }
          return await this.contactRepository.update(contact.id, contactData);
        }
      } catch (err) {
        console.error(`[ContactService] Error in ${eventType}:`, err.message || err);
        throw err;
      }
    }
  }
  
  module.exports = ContactService;
  