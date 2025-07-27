-- ====================================
-- DADOS INICIAIS PARA RASPADINHA
-- ====================================

-- ====================================
-- INSERIR CATEGORIAS DE RASPADINHA
-- ====================================
INSERT INTO scratch_categories (name, slug, price, max_reward, rtp_percentage, banner_url) VALUES
('Raspadinha R$ 5,00', 'raspadinha-5', 5.00, 1000.00, 85, 'https://ik.imagekit.io/azx3nlpdu/NOVOS-BANNER-RASPA.png'),
('Raspadinha R$ 10,00', 'raspadinha-10', 10.00, 5000.00, 85, 'https://ik.imagekit.io/azx3nlpdu/banner/10-reais.png'),
('Raspadinha R$ 25,00', 'raspadinha-25', 25.00, 10000.00, 85, 'https://ik.imagekit.io/azx3nlpdu/banner/25-reais.png')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  max_reward = EXCLUDED.max_reward,
  banner_url = EXCLUDED.banner_url,
  updated_at = NOW();

-- ====================================
-- INSERIR PRÊMIOS PARA CATEGORIA R$ 5,00
-- ====================================

-- Prêmios em dinheiro para raspadinha de R$ 5,00
INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 2,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/2 REAIS.png', 2.00, 400, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 5,00', 'https://ik.imagekit.io/azx3nlpdu/50-CENTAVOS-2.png', 5.00, 200, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 10,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/10 REAIS.png', 10.00, 150, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 25,00', 'https://ik.imagekit.io/azx3nlpdu/700.png', 25.00, 80, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 50,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/50 REAIS.png', 50.00, 40, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 100,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/100 REAIS.png', 100.00, 20, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

-- Prêmios produtos para raspadinha de R$ 5,00
INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'Fone Bluetooth', 'https://ik.imagekit.io/azx3nlpdu/item_fone_de_ouvido_bluetooth.png', 80.00, 15, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'Smartwatch D20', 'https://ik.imagekit.io/azx3nlpdu/item_smartwatch_d20_shock.png', 120.00, 10, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'iPhone 15 Azul', 'https://ik.imagekit.io/azx3nlpdu/variant_iphone_15_azul.png', 1000.00, 2, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-5'
ON CONFLICT DO NOTHING;

-- ====================================
-- INSERIR PRÊMIOS PARA CATEGORIA R$ 10,00
-- ====================================

-- Prêmios em dinheiro para raspadinha de R$ 10,00
INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 5,00', 'https://ik.imagekit.io/azx3nlpdu/50-CENTAVOS-2.png', 5.00, 300, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 10,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/10 REAIS.png', 10.00, 250, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 25,00', 'https://ik.imagekit.io/azx3nlpdu/700.png', 25.00, 150, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 50,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/50 REAIS.png', 50.00, 100, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 100,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/100 REAIS.png', 100.00, 60, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 500,00', 'https://ik.imagekit.io/azx3nlpdu/500-REAIS.png', 500.00, 20, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

-- Prêmios produtos para raspadinha de R$ 10,00
INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'Cabo USB-C', 'https://ik.imagekit.io/azx3nlpdu/item_cabo_para_recarga_usb_c.png', 30.00, 80, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'Copo Stanley Preto', 'https://ik.imagekit.io/azx3nlpdu/item_copo_t_rmico_stanley_preto.png', 150.00, 40, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'Controle Xbox Purple', 'https://ik.imagekit.io/azx3nlpdu/item_controle_xbox_astral_purple.png', 350.00, 15, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'PlayStation 5', 'https://ik.imagekit.io/azx3nlpdu/item_playstation_5.png', 5000.00, 1, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-10'
ON CONFLICT DO NOTHING;

-- ====================================
-- INSERIR PRÊMIOS PARA CATEGORIA R$ 25,00
-- ====================================

-- Prêmios em dinheiro para raspadinha de R$ 25,00
INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 10,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/10 REAIS.png', 10.00, 200, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 25,00', 'https://ik.imagekit.io/azx3nlpdu/700.png', 25.00, 180, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 50,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/50 REAIS.png', 50.00, 120, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 100,00', 'https://ik.imagekit.io/azx3nlpdu/Notas/100 REAIS.png', 100.00, 80, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 500,00', 'https://ik.imagekit.io/azx3nlpdu/500-REAIS.png', 500.00, 30, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'R$ 1.000,00', 'https://ik.imagekit.io/azx3nlpdu/1K.png', 1000.00, 15, 'cash'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

-- Prêmios produtos para raspadinha de R$ 25,00
INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'Smart TV 55"', 'https://ik.imagekit.io/azx3nlpdu/item_smart_tv_4k_55.png', 2500.00, 8, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'Notebook G15', 'https://ik.imagekit.io/azx3nlpdu/item_notebook_g15.png', 4000.00, 5, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

INSERT INTO prizes (category_id, name, image_url, value, probability_weight, type) 
SELECT id, 'Moto Biz 110i Vermelha', 'https://ik.imagekit.io/azx3nlpdu/variant_biz_110i_vermelho.png', 10000.00, 1, 'product'
FROM scratch_categories WHERE slug = 'raspadinha-25'
ON CONFLICT DO NOTHING;

-- ====================================
-- INICIALIZAR CONTROLE RTP
-- ====================================
INSERT INTO rtp_control (category_id, current_rtp, total_invested, total_paid)
SELECT id, 0.00, 0.00, 0.00
FROM scratch_categories
ON CONFLICT (category_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';