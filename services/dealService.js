/**
 * Сервис для обработки сделок (deals).
 * Задачи:
 * - создать или обновить сделку в БД
 * - при наличии списка contact amo_id — связать внутренние contacts с этой сделкой (через contact_deal)
 */

/** Преобразует unix timestamp (в секундах) к формату MySQL DATETIME */
function toMysqlDatetime(unixTimestamp) {
    if (!unixTimestamp) return null;
    const date = new Date(unixTimestamp * 1000);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  class DealService {
    constructor(dealRepository, contactDealRepository, contactRepository) {
      this.dealRepository = dealRepository;
      this.contactDealRepository = contactDealRepository;
      this.contactRepository = contactRepository;
    }
  
    /**
     * Обработка сделки, пришедшей из вебхука.
     * eventType = 'add' | 'update'
     * Если payload содержит поле `contacts` — ожидается массив amo_id контактов, которые нужно связать с сделкой.
     */
    async processDealFromWebhook(deal, eventType) {
      const created_at = toMysqlDatetime(deal.created_at);
      const updated_at = toMysqlDatetime(deal.updated_at);
  
      const dealData = {
        title: deal.name || '',
        status: `${deal.status_id}` || '',
        price: deal.price ? Number(deal.price) : null,
        pipeline_id: deal.pipeline_id || null,
        created_at,
        updated_at,
      };
  
      try {
        let savedDeal;
  
        if (eventType === 'add') {
          savedDeal = await this.dealRepository.create({
            ...dealData,
            amo_id: deal.id
          });
        } else if (eventType === 'update') {
          const existingDeal = deal.id
            ? await this.dealRepository.findByAmoId(deal.id)
            : null;
  
          if (existingDeal) {
            savedDeal = await this.dealRepository.update(deal.id, dealData);
          } else {
            // Если при обновлении сделки в БД её нет — создаём новую
            savedDeal = await this.dealRepository.create({
              ...dealData,
              amo_id: deal.id
            });
          }
        }
  
        // Если пришёл список contacts (массив amo_id) — синхронизируем связи
        if (savedDeal && savedDeal.id && deal.contacts) {
          await this._processDealContacts(savedDeal.id, deal.contacts);
        }
  
        return savedDeal;
      } catch (err) {
        console.error(`[DealService] Error in ${eventType}:`, err.message || err);
        throw err;
      }
    }
  
    /**
     * Преобразует массив amo_id контактов в внутренние contact.id и вызывает syncDealContacts.
     * Если контакт не найден — просто логируем предупреждение.
     */
    async _processDealContacts(dealId, contactAmoIds) {
      if (!contactAmoIds || !Array.isArray(contactAmoIds)) {
        console.warn(`[DealService] Invalid contacts array for deal ${dealId}`);
        return;
      }
  
      const contactIds = [];
      for (const amoId of contactAmoIds) {
        const contact = await this.contactRepository.findByAmoId(amoId);
        if (contact) {
          contactIds.push(contact.id);
        } else {
          console.warn(`[DealService] Contact amo_id=${amoId} not found for deal=${dealId}`);
        }
      }
  
      if (contactIds.length > 0) {
        await this.contactDealRepository.syncDealContacts(dealId, contactIds);
      }
    }
  }
  
  module.exports = DealService;
  