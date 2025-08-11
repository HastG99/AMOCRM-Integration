/**
 * Контроллер для приёма вебхуков от amoCRM.
 * Ожидает в теле запроса объект с полями `contacts` и/или `leads` (amoCRM payload).
 * Делегирует обработку контактам и сделкам через соответствующие сервисы.
 */
class WebhookController {
    constructor(contactService, dealService) {
      this.contactService = contactService;
      this.dealService = dealService;
    }
  
    /**
     * Точка входа: POST /webhooks
     * Пример payload: { contacts: { add: [...], update: [...] }, leads: { add: [...], update: [...] } }
     */
    async handle(req, res) {
      try {
        console.info('[Webhook] Incoming request');
        const { contacts, leads } = req.body;
  
        if (!contacts && !leads) {
          // Некорректный запрос — ничего для обработки
          console.warn('[Webhook] No contacts or leads in payload');
          return res.status(400).json({ error: 'No contacts or leads data' });
        }
  
        // Параллельно запускаем обработку всех массивов (если присутствуют)
        await Promise.all([
          this._processEntities('contact', 'add', contacts?.add),
          this._processEntities('contact', 'update', contacts?.update),
          this._processEntities('deal', 'add', leads?.add),
          this._processEntities('deal', 'update', leads?.update),
        ]);
  
        res.json({ ok: true });
      } catch (err) {
        console.error('[Webhook] Handler error:', err);
        res.status(500).json({ error: err.message });
      }
    }
  
    /**
     * Внутренняя функция: пройтись по массиву сущностей и вызвать сервисы.
     * entityType: 'contact' | 'deal'
     * eventType: 'add' | 'update'
     */
    async _processEntities(entityType, eventType, entities) {
      if (!entities || !entities.length) return;
  
      const promises = entities.map(entity => {
        if (!entity.id) {
          // Пропускаем записи без id (amoCRM в норме присылает id)
          console.warn(`[Webhook] Skipping ${entityType} with missing id:`, entity);
          return Promise.resolve();
        }
  
        try {
          if (entityType === 'contact') {
            return this.contactService.processContactFromWebhook(entity, eventType);
          } else if (entityType === 'deal') {
            return this.dealService.processDealFromWebhook(entity, eventType);
          }
        } catch (err) {
          // Локально логируем ошибку по конкретной сущности, но продолжаем обработку других
          console.error(`[Webhook] Error processing ${entityType} ${eventType}:`, {
            error: err.message,
            stack: err.stack,
            entity
          });
          return Promise.resolve();
        }
      });
  
      await Promise.all(promises);
    }
  }
  
  module.exports = WebhookController;
  