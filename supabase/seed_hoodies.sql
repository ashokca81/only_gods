-- Phase 2b: replace the demo catalog with the real hoodie products (₹, galleries).
-- Safe: only removes the demo seed ids 1..8; any admin-added products (uuid ids) stay.
delete from public.products where id in ('1','2','3','4','5','6','7','8');

insert into public.products
  (id, name, price, image, images, category, colors, sizes, description, trending, new_arrival, sort_order)
values
  ('1','Black Wildloom Hoodie',23000,
   'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
   array['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop'],
   'Hoodies',array['Black'],array['S','M','L','XL','XXL'],
   'Premium heavyweight hoodie with signature Wildloom detailing. Crafted for all-day comfort and street-ready style.',true,false,1),

  ('2','Brown Star Studded Hoodie',17000,
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
   array['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1506634572416-48cdfe530110?q=80&w=800&auto=format&fit=crop'],
   'Hoodies',array['Brown'],array['S','M','L','XL','XXL'],
   'Soft brushed fleece hoodie with hand-placed star studs. A bold statement piece.',true,false,2),

  ('3','Grey Star Studded Hoodie',17000,
   'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop',
   array['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop'],
   'Hoodies',array['Grey'],array['S','M','L','XL','XXL'],
   'Heather grey hoodie finished with metallic star studs. Everyday essential, elevated.',true,true,3),

  ('4','Brown Wildloom Hoodie',23000,
   'https://images.unsplash.com/photo-1506634572416-48cdfe530110?q=80&w=800&auto=format&fit=crop',
   array['https://images.unsplash.com/photo-1506634572416-48cdfe530110?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'],
   'Hoodies',array['Brown'],array['S','M','L','XL','XXL'],
   'The Wildloom in rich earth brown. Heavyweight cotton with a relaxed drop-shoulder fit.',true,false,4),

  ('5','Meadow Blue Hoodie',14500,
   'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop',
   array['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop'],
   'Hoodies',array['Blue'],array['S','M','L','XL','XXL'],
   'Calm meadow-blue hoodie in brushed cotton fleece. Understated and endlessly wearable.',true,true,5),

  ('6','Red Serpent Bloom Zipper Hoodie',14000,
   'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
   array['https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop'],
   'Hoodies',array['Red'],array['S','M','L','XL','XXL'],
   'Full-zip hoodie with Serpent Bloom back graphic. Bold colour, clean silhouette.',true,true,6),

  ('7','Black Poison Petals Zipper Hoodie',16000,
   'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=800&auto=format&fit=crop',
   array['https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'],
   'Hoodies',array['Black'],array['S','M','L','XL','XXL'],
   'Zip-through hoodie with Poison Petals embroidery. Dark, detailed, and refined.',true,true,7),

  ('8','Black Serpent Bloom Zipper Hoodie',14000,
   'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
   array['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=800&auto=format&fit=crop','https://images.unsplash.com/photo-1506634572416-48cdfe530110?q=80&w=800&auto=format&fit=crop'],
   'Hoodies',array['Black'],array['S','M','L','XL','XXL'],
   'The Serpent Bloom zipper in classic black. A wardrobe anchor with subtle edge.',false,true,8);
