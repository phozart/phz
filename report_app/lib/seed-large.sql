-- Seed sales_orders using generate_series (runs entirely inside PostgreSQL).
-- Usage: pass $1 = batch offset, $2 = batch size
-- Called repeatedly by seed-cli.ts in 1M-row batches.
-- NOTE: hashint4 returns int4; abs(int4_min) overflows. Cast to bigint before abs().

INSERT INTO sales_orders (date, year, quarter, month, product, category, region, sales_rep, quantity, unit_price, discount, amount, profit, payment_method, status, customer_name, customer_email, order_priority, shipping_method, shipping_cost, tax_amount, total_amount, warehouse, channel, currency, exchange_rate, return_flag, fulfillment_date, lead_time_days, margin_pct, notes)
SELECT
  d,
  EXTRACT(YEAR FROM d)::smallint,
  'Q' || EXTRACT(QUARTER FROM d)::text,
  (ARRAY['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])[EXTRACT(MONTH FROM d)::int],
  products[pi],
  categories[pi],
  regions[ri],
  reps[rpi],
  qty,
  up,
  disc,
  ROUND(qty * up * (1.0 - disc / 100.0))::int AS amount,
  ROUND(qty * up * (1.0 - disc / 100.0) * (0.25 + (abs(h11::bigint) % 25)::int / 100.0))::int AS profit,
  payments[1 + (abs(h8::bigint) % 4)::int],
  CASE WHEN abs(h9::bigint) % 10 < 7 THEN 'completed' ELSE statuses[1 + (abs(h10::bigint) % 5)::int] END,
  -- new columns
  cust_first || ' ' || cust_last,
  LOWER(cust_first) || '.' || LOWER(cust_last) || '@' || email_domains[1 + (abs(h14::bigint) % 5)::int],
  priorities[1 + (abs(h12::bigint) % 4)::int],
  ship_methods[1 + (abs(h13::bigint) % 4)::int],
  ship_costs[1 + (abs(h13::bigint) % 4)::int],
  ROUND(qty * up * (1.0 - disc / 100.0) * 0.08)::int AS tax_amount,
  ROUND(qty * up * (1.0 - disc / 100.0))::int + ROUND(qty * up * (1.0 - disc / 100.0) * 0.08)::int + ship_costs[1 + (abs(h13::bigint) % 4)::int] AS total_amount,
  warehouses[1 + (abs(h15::bigint) % 6)::int],
  channels[1 + (abs(h16::bigint) % 4)::int],
  currencies[1 + (abs(h17::bigint) % 5)::int],
  exch_rates[1 + (abs(h17::bigint) % 5)::int],
  abs(h18::bigint) % 20 < 1,
  d + (1 + abs(h19::bigint) % 14)::int,
  (1 + abs(h19::bigint) % 14)::smallint,
  ROUND((0.25 + (abs(h11::bigint) % 25)::int / 100.0) * 100, 2)::numeric(5,2),
  CASE WHEN abs(h20::bigint) % 5 = 0 THEN note_texts[1 + (abs(h20::bigint) % 8)::int] ELSE NULL END
FROM (
  SELECT
    i,
    ('2023-01-01'::date + (abs(h0::bigint) % 730)::int) AS d,
    1 + (abs(h2::bigint) % 10)::int AS pi,
    1 + (abs(h3::bigint) % 5)::int  AS ri,
    1 + (abs(h4::bigint) % 20)::int AS rpi,
    1 + (abs(h5::bigint) % 20)::int AS qty,
    (ARRAY[1200,450,120,60,180,90,250,15,85,65])[1 + (abs(h2::bigint) % 10)::int]
      * (80 + (abs(h6::bigint) % 40)::int) / 100 AS up,
    CASE WHEN abs(h7::bigint) % 10 < 3 THEN (abs(hashint4(h7 + 1)::bigint) % 20)::int ELSE 0 END AS disc,
    h8, h9, h10, h11, h12, h13, h14, h15, h16, h17, h18, h19, h20,
    (ARRAY['James','Maria','Robert','Linda','Michael','Sarah','William','Emma','Richard','Jennifer',
           'Thomas','Jessica','Daniel','Ashley','Matthew','Amanda','Anthony','Stephanie','Andrew','Nicole'])[1 + (abs(h21::bigint) % 20)::int] AS cust_first,
    (ARRAY['Anderson','Martinez','Thompson','Robinson','Clark','Rodriguez','Lewis','Walker','Hall','Allen',
           'Young','King','Wright','Scott','Green','Baker','Adams','Nelson','Hill','Campbell'])[1 + (abs(h22::bigint) % 20)::int] AS cust_last
  FROM (
    SELECT i::int AS i,
      hashint4(i::int)                    AS h0,
      hashint4(i::int #  203598127) AS h2,
      hashint4(i::int #  314159265) AS h3,
      hashint4(i::int #  427198361) AS h4,
      hashint4(i::int #  538264917) AS h5,
      hashint4(i::int #  649328173) AS h6,
      hashint4(i::int #  760491329) AS h7,
      hashint4(i::int #  871653587) AS h8,
      hashint4(i::int #  982817643) AS h9,
      hashint4(i::int # 1093981799) AS h10,
      hashint4(i::int # 1205143957) AS h11,
      hashint4(i::int # 1316308113) AS h12,
      hashint4(i::int # 1427472269) AS h13,
      hashint4(i::int # 1538636427) AS h14,
      hashint4(i::int # 1649800583) AS h15,
      hashint4(i::int # 1760964739) AS h16,
      hashint4(i::int # 1872128897) AS h17,
      hashint4(i::int # 1983293053) AS h18,
      hashint4(i::int # 2094457211) AS h19,
      hashint4(i::int #  105621367) AS h20,
      hashint4(i::int #  216785523) AS h21,
      hashint4(i::int #  327949681) AS h22
    FROM generate_series($1::bigint, $1::bigint + $2::bigint - 1) AS i
  ) hashes
) sub
CROSS JOIN (SELECT
  ARRAY['Laptop','Monitor','Keyboard','Mouse','Headset','Webcam','Dock','Cable','SSD','RAM'] AS products,
  ARRAY['Hardware','Hardware','Peripherals','Peripherals','Audio','Video','Accessories','Accessories','Storage','Memory'] AS categories,
  ARRAY['North America','Europe','Asia Pacific','Latin America','Middle East'] AS regions,
  ARRAY['Alex Chen','Sarah Kim','James Wilson','Maria Garcia','David Lee','Emma Brown','Ryan Patel','Lisa Wang','Tom Harris','Nina Scott','Jake Miller','Amy Zhang','Chris Davis','Rachel Liu','Mark Taylor','Sophie Martin','Ben Thomas','Olivia Clark','Dan White','Kate Johnson'] AS reps,
  ARRAY['Credit Card','Wire Transfer','Purchase Order','PayPal'] AS payments,
  ARRAY['completed','processing','shipped','cancelled','refunded'] AS statuses,
  ARRAY['High','Medium','Low','Critical'] AS priorities,
  ARRAY['Standard','Express','Overnight','Freight'] AS ship_methods,
  ARRAY[8,15,25,35] AS ship_costs,
  ARRAY['gmail.com','outlook.com','company.com','yahoo.com','proton.me'] AS email_domains,
  ARRAY['US-East','US-West','EU-Central','EU-West','APAC-Tokyo','APAC-Sydney'] AS warehouses,
  ARRAY['Online','In-Store','Phone','Partner'] AS channels,
  ARRAY['USD','EUR','GBP','JPY','AUD'] AS currencies,
  ARRAY[1.0000,0.9200,0.7900,149.5000,1.5300]::numeric(10,4)[] AS exch_rates,
  ARRAY['Expedited processing','Gift wrap requested','Bulk order discount applied','Customer VIP','Fragile - handle with care','Requires signature','Back-ordered item included','Insurance added'] AS note_texts
) AS p;
