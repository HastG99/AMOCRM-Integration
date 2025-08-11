CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amo_id VARCHAR(100) NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  normalized_phone VARCHAR(50),
  email VARCHAR(255) NULL,
  company_name VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_contacts_amo_id (amo_id),
  UNIQUE KEY ux_contacts_normalized_phone (normalized_phone),
  INDEX idx_deals_amo_id (amo_id)
);

CREATE TABLE IF NOT EXISTS deals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amo_id VARCHAR(100) NULL,
  external_id VARCHAR(255) NULL,
  title VARCHAR(255),
  status VARCHAR(100),
  price DECIMAL(15,2) NULL,
  pipeline_id INT NULL,
  contact_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_deals_amo_id (amo_id),
  UNIQUE KEY ux_deals_external_id (external_id),
  CONSTRAINT fk_deals_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  INDEX idx_deals_amo_id (amo_id)
);

CREATE TABLE IF NOT EXISTS contact_deal (
  contact_id INT NOT NULL,
  deal_id INT NOT NULL,
  PRIMARY KEY (contact_id, deal_id),
  CONSTRAINT fk_cd_contact FOREIGN KEY (contact_id) 
    REFERENCES contacts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cd_deal FOREIGN KEY (deal_id) 
    REFERENCES deals(id) ON DELETE CASCADE ON UPDATE CASCADE
);
